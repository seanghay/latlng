<script setup lang="ts">
import { Codemirror } from "vue-codemirror";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import { nanoid } from "nanoid";
import { computed } from "@vue/reactivity";
import { effect } from "vue";
import { ref } from "vue";
import Button from "./components/Button.vue";
import { requestCurrentLocation } from "./location";
import copy from "clipboard-copy";
import { formatDistance, parseISO } from "date-fns";

//@ts-ignore
import { OpenLocationCode } from "open-location-code";
import ClipboardButton from "./components/ClipboardButton.vue";

const openLocationCode = new OpenLocationCode();
const histories = ref<any[]>([]);
const historyVisible = ref<boolean>(false);
const activeSelectionId = ref <string | null>(null);

const isCopyToClipboard = ref(false);
const isJsonViewVisible = ref(false);
const isLoading = ref(false);
const results = ref<any[]>([]);
const hasResult = computed(() => results.value && results.value.length);
const jsonValue = computed(() =>
  JSON.stringify(
    Object.fromEntries(results.value.map((field) => [field.id, field.value])),
    null,
    2
  )
);

effect(async () => {
  await invalidateHistories()
});


async function invalidateHistories() {
  const db = await cacheDb();
  histories.value = db as any[];
}

const extensions = [json(), oneDark];

const translations = new Map(
  Object.entries({
    building: "Building",
    road: "Road",
    hamlet: "Hamlet",
    village: "Village",
    town: "Town",
    state: "State / City",
    postcode: "Postal code",
    country: "Country",
    country_code: "Country code",
  })
);

function getOrDefault(key: string, defaultValue: () => any) {
  if (translations.has(key)) {
    return translations.get(key);
  }
  return defaultValue();
}

async function reverseGeo({ latitude, longitude }: any) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
    );
    return await response.json();
  } catch (e) {
    return null;
  }
}

async function cacheDb() {
  return new Promise((resolve) => {
    const key = `__items__`;
    const db = JSON.parse(localStorage.getItem(key) || `[]`);
    resolve(
      db.map((item: any) => ({
        ...item,
        data: Object.fromEntries(item.items.map((i: any) => [i.id, i.value])),
      }))
    );
  });
}

async function persist(items: any[]) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const id = nanoid();
      const key = `__items__`;
      const db = JSON.parse(localStorage.getItem(key) || `[]`);
      const newDb = [{ id, items, createdAt: new Date().toISOString() }, ...db].slice(0, 20);
      localStorage.setItem(key, JSON.stringify(newDb));
      resolve(items);
    });
  });
}

async function requestLocation() {
  isLoading.value = true;
  activeSelectionId.value = null;
  const { coords } = await requestCurrentLocation();
  const { latitude, longitude } = coords;

  const first = [
    { id: "timestamp", label: "Timestamp", value: new Date().toISOString() },
    {
      id: "position",
      label: "Latitude & Longitude",
      value: `${latitude}, ${longitude}`,
    },
    {
      id: "pluscode",
      label: "Plus Code",
      value: openLocationCode.encode(latitude, longitude),
    },
  ];

  results.value = [...first, { id: "loading", label: "Loading…" }];

  isLoading.value = false;
  const data = await reverseGeo({ latitude, longitude });
  let append = Object.entries(data.address).map(([key, value]) => ({
    id: key,
    label: getOrDefault(key, () => key),
    value,
  }));

  append = [
    { id: "display_name", label: "Address", value: data.display_name },
    ...append,
  ];

  results.value = [...first, ...append];
  await persist(results.value);
  await invalidateHistories()
}

function toggleJSONViewer() {
  isJsonViewVisible.value = !isJsonViewVisible.value;
}

async function copyClipboard() {
  await copy(jsonValue.value);
  isCopyToClipboard.value = true;
  setTimeout(async () => {
    isCopyToClipboard.value = false;
  }, 1000);
}

function showHistory() {
  historyVisible.value = !historyVisible.value;
}

function formatDate(str: string) {
  return formatDistance(parseISO(str), new Date(), { addSuffix: true });
}

function selectItem({ items, id }: any) {
  activeSelectionId.value = id;
  results.value = items;
}

function clearAll() {
  localStorage.removeItem('__items__');
  histories.value = []
}
</script>

<template>
  <div class="max-w-720px mx-auto p-4">
    <div class="flex justify-center items-center text-light-700 my-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        aria-hidden="true"
        role="img"
        class="iconify iconify--bxs"
        width="64"
        height="64"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 0 24 24"
      >
        <path
          fill="currentColor"
          d="M12 2C7.589 2 4 5.589 4 9.995C3.971 16.44 11.696 21.784 12 22c0 0 8.029-5.56 8-12c0-4.411-3.589-8-8-8zm0 12c-2.21 0-4-1.79-4-4s1.79-4 4-4s4 1.79 4 4s-1.79 4-4 4z"
        ></path>
      </svg>
    </div>
    <h1 class="text-center mt-1 font-bold text-2xl">Location</h1>
    <p class="opacity-70 text-sm mt-1 text-center">
      Get detailed information about your current location.
    </p>
    <div class="mt-4">
      <Button :loading="isLoading" block @click="requestLocation">
        <div class="text-xl inline-block align-top i-ri-play-circle-line"></div>

        <span class="mx-1">Request</span>
      </Button>
    </div>

    <div class="mt-4">
      <div
        class="hoverable-item transition relative bg-dark-700 hover:bg-dark-400 border-b border-b-dark-200 border-l border-l-dark-200 border-r border-r-dark-200 px-3 py-2.4"
        v-for="(item, index) in results"
        :key="item.id"
        :class="[
          index === 0
            ? 'border-t border-t-dark-200 rounded-tl-lg rounded-tr-lg'
            : null,
          index === results.length - 1 ? 'rounded-br-lg rounded-bl-lg' : '',
        ]"
      >
        <h1 v-if="item.label" class="font-semibold opacity-60 text-sm">
          {{ item.label }}
        </h1>
        <h1 v-if="item.value" class="text-white pr-10">{{ item.value }}</h1>
        <ClipboardButton v-if="item.value" :inputValue="item.value" />
      </div>
    </div>

    <Button v-if="hasResult" @click="toggleJSONViewer" class="mt-4 mr-2" small>
      <template v-if="!isJsonViewVisible">
        <div
          class="text-xl inline-block align-top i-ri-arrow-down-s-fill"
        ></div>
        <span class="px-2 inline-block">View JSON</span>
      </template>
      <template v-else>
        <div class="text-xl inline-block align-top i-ri-arrow-up-s-fill"></div>
        <span class="px-2 inline-block">Hide JSON</span>
      </template>
    </Button>

    <Button @click="copyClipboard" v-if="hasResult" class="mt-4 mr-2" small>
      <div
        v-if="isCopyToClipboard"
        class="text-light-900 text-opacity-50 text-xl inline-block align-top i-ri-check-double-line"
      ></div>
      <div
        v-else
        class="text-xl inline-block align-top i-ri-file-copy-line"
      ></div>

      <span
        v-if="isCopyToClipboard"
        class="text-light-900 text-opacity-50 px-2 inline-block"
        >Copied</span
      >
      <span v-else class="px-2 inline-block">Copy JSON</span>
    </Button>

    <div
      v-if="isJsonViewVisible && hasResult"
      class="my-4 overflow-hidden rounded"
    >
      <codemirror
        disabled
        :tab-size="2"
        :indent-with-tab="true"
        :model-value="jsonValue"
        :extensions="extensions"
      ></codemirror>
    </div>

    <div class="mt-4">
      <Button small block @click="showHistory()">
        <div
          class="text-xl inline-block align-top"
          :class="[
            historyVisible ? 'i-ri-arrow-up-s-fill' : 'i-ri-arrow-down-s-fill',
          ]"
        ></div>
        <span v-if="historyVisible" class="mx-1">Hide History</span>
        <span v-else class="mx-1">Show History</span>
      </Button>
    </div>

    <div class="mt-4 pb-10" v-if="historyVisible">
      <h1 class="text-2xl font-bold">
        <div class="text-2xl inline-block align-middle i-ri-history-fill"></div>
        <span class="mx-2">History</span>
      </h1>

      <div class="flex flex-col gap-2 mt-2">

        <p v-if="histories.length == 0">Empty</p>

        <div
          @click="selectItem(item)"
          tabindex="1"
        
          class="focus:outline-light-600 active:bg-dark-500 border cursor-pointer rounded bg-dark-400 border-dark-300 px-3 py-2"
          :class="[activeSelectionId === item.id ? 'border-gray-200 text-black bg-gray-300' : null]"
          v-for="item in histories"
          :key="item.id"
        >
          <h1 class="font-bold m-0 p-0">{{ item.data.position }}</h1>
          <h4 class="text-xs opacity-80">{{ item.data.display_name }}</h4>
          <h6
            class="mt-2 text-white bg-dark-300 px-2 rounded mb-1 py-1 inline-block text-xs font-bold"
          >
            {{ formatDate(item.createdAt) }}
          </h6>
        </div>
      </div>

      <Button v-if="histories.length" @click="clearAll()" small class="mt-4 mr-2">
        <div class="text-xl inline-block align-top i-ri-delete-bin-7-line"></div>
        <span class=" px-2 inline-block">Clear all</span>
      </Button>
    </div>
  </div>
</template>
