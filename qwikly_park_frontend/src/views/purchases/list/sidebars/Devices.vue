<template>
  <VNavigationDrawer
    temporary
    :width="600"
    location="end"
    class="scrollable-content"
    :model-value="isOpen"
    @update:model-value="(val) => $emit('update:isOpen', val)"
  >
    <AppDrawerHeaderSection title="Dispositifs" @cancel="close" />
    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat v-if="current">
        <VCardText
          class="d-flex flex-column devices"
          v-if="current.devices.length"
        >
          <VCard
            variant="tonal"
            v-for="(device, index) in current.devices"
            :key="index"
          >
            <div
              class="d-flex justify-space-between flex-wrap flex-md-nowrap flex-column flex-md-row"
            >
              <div class="ma-auto pa-2">
                <VImg
                  width="150"
                  aspect-ratio="2.6"
                  :src="getImage(device.type)"
                />
              </div>

              <VDivider :vertical="$vuetify.display.mdAndUp" />

              <VCardText :class="$vuetify.display.mdAndUp ? 'w-50' : 'w-100'">
                <VListItem class="px-0">
                  <p class="font-weight-bold mb-0">{{ device.machine_id }}</p>
                  <v-list-item-subtitle>ID de la machine</v-list-item-subtitle>
                </VListItem>
                <VListItem class="px-0">
                  <VListItemTitle class="font-weight-bold">{{
                    device.created_at
                  }}</VListItemTitle>
                  <v-list-item-subtitle>Enregistré à</v-list-item-subtitle>
                </VListItem>
              </VCardText>
            </div>
          </VCard>
        </VCardText>
        <VCardText v-else class="text-center" cols="12"
          >Pas de données disponibles</VCardText
        >
      </VCard>
    </PerfectScrollbar>
  </VNavigationDrawer>
</template>

<script>
import { useTheme } from "vuetify";
import { PerfectScrollbar } from "vue3-perfect-scrollbar";

import orderLight from "@images/products/order-light.svg";
import orderNotifyLight from "@images/products/order-notify-light.svg";
import caisseLight from "@images/products/caisse-light.svg";
import kitchenLight from "@images/products/kitchen-light.svg";

import orderDark from "@images/products/order-dark.svg";
import orderNotifyDark from "@images/products/order-notify-dark.svg";
import caisseDark from "@images/products/caisse-dark.svg";
import kitchenDark from "@images/products/kitchen-dark.svg";

export default {
  emits: ["update:isOpen"],

  setup() {
    const { global } = useTheme();
    return {
      global,
    };
  },

  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },

    current: {
      type: Object,
    },
  },

  components: { PerfectScrollbar },

  methods: {
    close() {
      this.$emit("update:isOpen", false);
    },

    getImage(type) {
      switch (type) {
        case "caisse":
          return this.global.name._value === "dark" ? caisseDark : caisseLight;
        case "order":
          return this.global.name._value === "dark" ? orderDark : orderLight;
        case "order_notify":
          return this.global.name._value === "dark"
            ? orderNotifyDark
            : orderNotifyLight;
        case "kitchen":
          return this.global.name._value === "dark"
            ? kitchenDark
            : kitchenLight;
        case "order_mobile":
          return this.global.name._value === "dark" ? orderDark : orderLight;
      }
    },
  },
};
</script>

<style scoped>
.devices {
  gap: 16px;
}
</style>
