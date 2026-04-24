<template>
  <div class="rounded transparent-style q-card--bordered q-pa-sm">
    <div v-xss-html="config.instructions"></div>
  </div>
</template>

<script setup lang="ts">
import config from '../utils/config';
</script>
