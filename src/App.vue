<script setup lang="ts">
import { Codemirror } from "vue-codemirror";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";

import { computed } from "@vue/reactivity";
import { effect } from "vue";
import { ref } from "vue";
import Button from "./components/Button.vue";
import { requestCurrentLocation } from "./location";
import copy from "clipboard-copy";

//@ts-ignore
import { OpenLocationCode } from "open-location-code";
import ClipboardButton from "./components/ClipboardButton.vue";

const openLocationCode = new OpenLocationCode();

const isCopyToClipboard = ref(false);
const isJsonViewVisible = ref(true);
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

effect(async () => {});

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

async function requestLocation() {
  isLoading.value = true;
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
  const append = Object.entries(data.address).map(([key, value]) => ({
    id: key,
    label: getOrDefault(key, () => key),
    value,
  }));

  results.value = [...first, ...append];
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
      <Button :loading="isLoading" block @click="requestLocation"
        >Request</Button
      >
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
        <h1 v-if="item.value" class="text-white">{{ item.value }}</h1>
        <ClipboardButton :inputValue="item.value"/>
      </div>
    </div>

    <Button v-if="hasResult" @click="toggleJSONViewer" class="mt-4 mr-2" small>
      <template v-if="!isJsonViewVisible">
        <div
          class="text-xl inline-block align-top i-ri-arrow-drop-down-line"
        ></div>
        <span class="px-2 inline-block">View JSON</span>
      </template>
      <template v-else>
        <div
          class="text-xl inline-block align-top i-ri-arrow-drop-up-line"
        ></div>
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
  </div>
</template>
