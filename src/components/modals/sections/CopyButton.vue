<template>
  <q-btn v-bind="props" @click="copyText">
    <transition name="q-transition--scale">
      <q-icon name="check" v-if="copied && !noIcon" />

      <div class="" v-else-if="!copied && !noIcon">
        <q-icon :name="mdiContentCopy" />
      </div>
    </transition>

    <div class="ellipsis" v-if="props.labelCopy">{{ props.labelCopy }}</div>

    <div class="ellipsis" v-if="hasSlot">
      <slot></slot>
    </div>

    <div class="absolute-full z-max"></div>
  </q-btn>
</template>

<script setup lang="ts">
import { mdiContentCopy } from '@quasar/extras/mdi-v7';
import { copyToClipboard, QBtnProps } from 'quasar';
import { useNotify } from 'src/utils/useNotify';
import { computed, ref, useSlots } from 'vue';

const props = withDefaults(defineProps<CopyButtonProps>(), {
  text: '',
  noIcon: false,
});

const slots = useSlots();

const hasSlot = computed(() => !!slots['default']);

const copied = ref(false);

const copyText = () => {
  copyToClipboard(props.text + '').then(() => {
    copied.value = true;
    useNotify('Скопировано!');

    setTimeout(() => (copied.value = false), 2000);
  });
};

interface TextProp {
  text: string | number;
  noIcon?: boolean;
  labelCopy?: string;
}

type CopyButtonProps = QBtnProps & TextProp;
</script>
