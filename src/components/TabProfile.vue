<template>
  <q-list padding class="rounded transparent-style q-card--bordered overflow-hidden">
    <q-item>
      <q-item-section side>
        <q-icon :name="mdiAccount" size="36px"></q-icon>
      </q-item-section>

      <q-item-section>
        <q-item-label class="text-h6">
          {{ vpn.user?.user?.first_name }} {{ vpn.user?.user?.last_name }}
        </q-item-label>

        <q-item-label caption>
          <div class="text-body1">Пользователь</div>
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item>
      <q-item-section side>
        <q-icon :name="mdiWallet" size="36px"></q-icon>
      </q-item-section>

      <q-item-section>
        <q-item-label class="text-h6">{{ money }} ₽</q-item-label>

        <q-item-label caption>
          <div class="text-body1">Баланс</div>
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item :clickable="!vpn.loadingOrders" @click="vpn.tab = 'orders'">
      <q-item-section side>
        <q-icon :name="mdiFolderKeyOutline" size="36px"></q-icon>
      </q-item-section>

      <q-item-section>
        <q-item-label class="text-h6">{{ vpn.total }}</q-item-label>

        <q-item-label caption>
          <div class="text-body1">Купленные ключи</div>
        </q-item-label>
      </q-item-section>

      <q-item-section side>
        <q-icon name="chevron_right" size="32px" />
      </q-item-section>

      <q-inner-loading :showing="vpn.loadingOrders">
        <q-spinner :thickness="1" size="50px" color="primary" />
      </q-inner-loading>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useVpnStore } from 'stores/vpnStore';

import { mdiAccount, mdiFolderKeyOutline, mdiWallet } from '@quasar/extras/mdi-v7';

const money = computed(() => (vpn.user.money / 100).toLocaleString('en-US').replace(/,/gi, ' '));

const vpn = useVpnStore();
</script>
