<template>
  <q-card-section
    class="row justify-between items-center no-wrap"
    :class="[props.noBottomSpace ? ' q-pb-none' : '']"
  >
    <div class="row items-center no-wrap">
      <slot name="prepend"></slot>

      <div class="text-h6">
        <slot name="default" v-if="!props.label"></slot>

        <div v-else>{{ props.label }}</div>
      </div>
    </div>

    <div>
      <slot name="append"></slot>

      <q-btn
        v-if="!props.noClose"
        flat
        v-close-popup
        icon="close"
        class="rounded"
        @click="emit('close')"
      />
    </div>
  </q-card-section>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<ModalTopProps>(), {
  label: '',
  noClose: false,
  noBottomSpace: false,
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();

interface ModalTopProps {
  label?: string;
  noClose?: boolean;
  noBottomSpace?: boolean;
}
</script>
