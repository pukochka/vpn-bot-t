<template>
  <q-card-section
    class="row no-wrap items-center q-gutter-x-sm"
    :class="[(props.noTopSpace ? ' q-pt-none' : '') + (props.reverse ? ' reverse' : '')]"
  >
    <q-btn
      flat
      no-caps
      v-close-popup
      color="primary"
      label="Закрыть"
      class="rounded col"
      v-if="!props.noClose"
    />

    <slot></slot>
  </q-card-section>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<ModalTopProps>(), {
  noClose: false,
  noTopSpace: false,
  reverse: false,
});

interface ModalTopProps {
  noClose?: boolean;
  noTopSpace?: boolean;
  reverse?: boolean;
}
</script>
