<template>
  <div class="rounded transparent-style q-card--bordered q-pa-sm">
    <div class="block" style="line-height: 15px" v-xss-html="config.instructions"></div>
  </div>
</template>

<script setup lang="ts">
import config from '../utils/config';
</script>
