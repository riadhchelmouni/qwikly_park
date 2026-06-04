<template>
  <VNavigationDrawer
    temporary
    :width="800"
    location="end"
    class="scrollable-content"
    :model-value="isOpen"
    @update:model-value="(val) => $emit('update:isOpen', val)"
  >
    <AppDrawerHeaderSection title="Détails de l'élément" @cancel="close" />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat v-if="current">
        <VCardText>
          <VList lines="two" class="py-0">
            <VListItem class="px-0">
              <VListItemTitle class="font-weight-bold text-capitalize">
                {{ current.name }}
              </VListItemTitle>
              <VListItemSubtitle>Nom d'offre</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <VListItemTitle class="font-weight-bold text-capitalize"
                >{{ current.price }} DA</VListItemTitle
              >
              <VListItemSubtitle>Prix</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <VChip :color="current.lifetime ? 'success' : 'info'">{{
                current.lifetime ? "Abonnement à vie" : "Souscription mensuelle"
              }}</VChip>
              <VListItemSubtitle>Type</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0" v-if="current.duration">
              <VListItemTitle class="font-weight-bold text-capitalize"
                >{{ current.duration }} Mois</VListItemTitle
              >
              <VListItemSubtitle>Durée</VListItemSubtitle>
            </VListItem>

            <VRow class="my-4">
              <VCol cols="6" md="3" v-if="current.caisse">
                <VImg
                  :src="
                    global.name._value === 'dark' ? caisseDark : caisseLight
                  "
                  aspect-ratio="2.6"
                />
              </VCol>
              <VCol cols="6" md="3" v-if="current.order">
                <VImg
                  :src="global.name._value === 'dark' ? orderDark : orderLight"
                  aspect-ratio="2.6"
                />
              </VCol>
              <VCol cols="6" md="3" v-if="current.order_notify">
                <VImg
                  :src="
                    global.name._value === 'dark'
                      ? orderNotifyDark
                      : orderNotifyLight
                  "
                  aspect-ratio="2.6"
                />
              </VCol>
              <VCol cols="6" md="3" v-if="current.kitchen">
                <VImg
                  :src="
                    global.name._value === 'dark' ? kitchenDark : kitchenLight
                  "
                  aspect-ratio="2.6"
                />
              </VCol>
              <VCol cols="6" md="3" v-if="current.order_mobile">
                <VImg
                  :src="
                    global.name._value === 'dark'
                      ? orderMobileDark
                      : orderMobileLight
                  "
                  aspect-ratio="2.6"
                />
              </VCol>
            </VRow>

            <VListItem class="px-0">
              <v-chip
                :color="current.status === 'actif' ? 'success' : 'warning'"
                class="text-capitalize mb-1"
                >{{ current.status }}</v-chip
              >
              <VListItemSubtitle>Statut</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <p class="font-weight-bold mb-1">
                {{ current.created_at }}
              </p>
              <VListItemSubtitle>Créé à</VListItemSubtitle>
            </VListItem>
          </VList>
        </VCardText>
      </VCard>
    </PerfectScrollbar>

    <template v-slot:append>
      <VCard flat>
        <VCardText>
          <VRow>
            <VCol cols="12">
              <VBtn
                type="reset"
                variant="tonal"
                color="secondary"
                @click="close"
                >Fermer</VBtn
              >
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </template>
  </VNavigationDrawer>
</template>

<script>
import { PerfectScrollbar } from "vue3-perfect-scrollbar";
import { useTheme } from "vuetify";

import orderLight from "@images/products/order-light.svg";
import orderNotifyLight from "@images/products/order-notify-light.svg";
import caisseLight from "@images/products/caisse-light.svg";
import kitchenLight from "@images/products/kitchen-light.svg";
import orderMobileLight from "@images/products/order-mobile-light.svg";

import orderDark from "@images/products/order-dark.svg";
import orderNotifyDark from "@images/products/order-notify-dark.svg";
import caisseDark from "@images/products/caisse-dark.svg";
import kitchenDark from "@images/products/kitchen-dark.svg";
import orderMobileDark from "@images/products/order-mobile-dark.svg";

export default {
  emits: ["update:isOpen"],

  setup() {
    const { global } = useTheme();
    return {
      global,

      orderLight,
      orderNotifyLight,
      caisseLight,
      kitchenLight,
      orderDark,
      orderNotifyDark,
      caisseDark,
      kitchenDark,
      orderMobileLight,
      orderMobileDark,
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
  },
};
</script>
