<script setup lang="ts">
import { ref } from "vue";
import Button from "./Button.vue";
import copy from "clipboard-copy";
const copying = ref(false);

const props = defineProps({
  inputValue: {
    type: String,
    required: true,
  },
});

async function click() {
  copying.value = true;
  await copy(props.inputValue);
  setTimeout(() => (copying.value = false), 1000);
}
</script>

<template>
  <Button @click="click()" small class="absolute top-4 right-4">
    <div v-if="copying" class="text-light-900 text-opacity-50 text-xl inline-block align-top i-ri-check-line"></div>
    <div v-else class="text-xl inline-block align-top i-ri-file-copy-line"></div>
  </Button>
</template>
