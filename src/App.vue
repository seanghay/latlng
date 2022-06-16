<script setup lang="ts">
import { computed } from "@vue/reactivity";
import { ref } from "vue";
import Button from "./components/Button.vue";
import { requestCurrentLocation } from "./location";

//@ts-ignore
import { OpenLocationCode } from "open-location-code";

const openLocationCode = new OpenLocationCode();

const isLoading = ref(false);
const results = ref<any[]>([]);
const hasResult = computed(() => results.value && results.value.length);

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
    { id: 'time', label: "Timestamp", value: new Date().toISOString() },
    {
      id: "latlng",
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
    label: key,
    value,
  }));

  results.value = [...first, ...append];
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
      <div class="transition bg-dark-700 hover:bg-dark-400 border-b border-b-dark-200 border-l border-l-dark-200 border-r border-r-dark-200 px-3 py-2.4"
      v-for="(item, index) in results" :key="item.id"
      :class='[
        index === 0 ? "border-t border-t-dark-200 rounded-tl-lg rounded-tr-lg" : null,
        index === results.length - 1 ? "rounded-br-lg rounded-bl-lg" : "" 
      ]'
      >
        <h1 v-if="item.label" class="font-semibold opacity-60 text-sm">
          {{ item.label }}
        </h1>
        <h1 v-if="item.value" class="text-white">{{ item.value }}</h1>
      </div>
    </div>

    <Button v-if="hasResult" class="mt-4 mx-2" small>
      <div class="text-xl inline-block align-top i-ri-share-box-line"></div>
      <span class="px-2 inline-block">View JSON</span>
    </Button>

    <Button v-if="hasResult" class="mt-4" small>
      <div class="text-xl inline-block align-top i-ri-share-box-line"></div>
      <span class="px-2 inline-block">Share</span>
    </Button>
  </div>
</template>
