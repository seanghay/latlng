<script setup lang="ts">
defineProps({
  small: Boolean,
  rounded: {
    type: Boolean,
    default: true,
  },
  block: Boolean,
  loading: Boolean,
  disabled: Boolean,
});
</script>

<template>
  <button
    :disabled="disabled || loading"
    v-bind="$attrs"
    class="font-bold border disabled:cursor-not-allowed disabled:opacity-80 border-dark-100 bg-dark-200 disabled:bg-dark-100 text-sm hover:bg-dark-300 transition text-light-50"
    :class="[
      small ? 'px-2.2 py-1.5' : 'px-4 py-2',
      rounded ? small ? 'rounded' : 'rounded-lg' : '',
      block ? 'w-full' : null,
    ]"
  >
    <template v-if="loading"><span class="opacity-50">Loading…</span></template>
    <template v-else>
      <slot></slot>
    </template>
  </button>
</template>
