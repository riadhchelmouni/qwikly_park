<template>
  <VNavigationDrawer
    temporary
    :width="600"
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
            <VListSubheader class="list-header font-weight-bold"
              >Informations de client</VListSubheader
            >

            <VImg
              :src="
                current.client.user.image
                  ? current.client.user.image
                  : placeholder
              "
              aspect-ratio="1"
              class="w-25 rounded-circle mx-auto"
              cover
            />

            <VListItem class="px-0">
              <p class="font-weight-bold mb-1">
                {{
                  current.client.user.firstname +
                  " " +
                  current.client.user.lastname
                }}
              </p>
              <VListItemSubtitle>Nom</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <p class="font-weight-bold mb-1">
                {{ current.client.user.email }}
              </p>
              <VListItemSubtitle>Adresse e-mail</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <p class="font-weight-bold mb-1">
                {{ current.client.user.phone }}
              </p>
              <VListItemSubtitle>Numéro de téléphone</VListItemSubtitle>
            </VListItem>
          </VList>

          <VDivider class="my-2" />

          <VList lines="two" class="py-0">
            <VListSubheader class="list-header font-weight-bold"
              >Informations d'offre</VListSubheader
            >

            <VListItem class="px-0">
              <p class="font-weight-bold mb-1">
                {{ current.offer.name }}
              </p>
              <VListItemSubtitle>Nom d'offre</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <VChip :color="current.offer.lifetime ? 'success' : 'info'">{{
                current.offer.lifetime
                  ? "Abonnement à vie"
                  : "Souscription mensuelle"
              }}</VChip>
              <VListItemSubtitle>Type</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0" v-if="current.offer.duration">
              <VListItemTitle class="font-weight-bold text-capitalize"
                >{{ current.offer.duration }} Mois</VListItemTitle
              >
              <VListItemSubtitle>Durée</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0" v-else>
              <VListItemTitle class="font-weight-bold text-capitalize"
                >À vie</VListItemTitle
              >
              <VListItemSubtitle>Durée</VListItemSubtitle>
            </VListItem>

            <VRow class="my-4">
              <VCol cols="6" md="3" v-if="current.offer.caisse">
                <VImg
                  :src="
                    global.name._value === 'dark' ? caisseDark : caisseLight
                  "
                  aspect-ratio="2.6"
                />
              </VCol>
              <VCol cols="6" md="3" v-if="current.offer.order">
                <VImg
                  :src="global.name._value === 'dark' ? orderDark : orderLight"
                  aspect-ratio="2.6"
                />
              </VCol>
              <VCol cols="6" md="3" v-if="current.offer.order_notify">
                <VImg
                  :src="
                    global.name._value === 'dark'
                      ? orderNotifyDark
                      : orderNotifyLight
                  "
                  aspect-ratio="2.6"
                />
              </VCol>
              <VCol cols="6" md="3" v-if="current.offer.kitchen">
                <VImg
                  :src="
                    global.name._value === 'dark' ? kitchenDark : kitchenLight
                  "
                  aspect-ratio="2.6"
                />
              </VCol>
              <VCol cols="6" md="3" v-if="current.offer.order_mobile">
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
import { useTheme } from "vuetify";
import { PerfectScrollbar } from "vue3-perfect-scrollbar";

import placeholder from "@images/placeholders/user.svg";

import orderLight from "@images/products/order-light.svg";
import orderNotifyLight from "@images/products/order-notify-light.svg";
import caisseLight from "@images/products/caisse-light.svg";
import kitchenLight from "@images/products/kitchen-light.svg";
import orderMobileLight from "@images/products/order-mobile-light.svg";

import orderDark from "@images/products/order-dark.svg";
import orderMobileDark from "@images/products/order-mobile-dark.svg";
import orderNotifyDark from "@images/products/order-notify-dark.svg";
import caisseDark from "@images/products/caisse-dark.svg";
import kitchenDark from "@images/products/kitchen-dark.svg";

export default {
  emits: ["update:isOpen"],

  setup() {
    const { global } = useTheme();
    return {
      global,
      placeholder,
      orderLight,
      orderNotifyLight,
      caisseLight,
      kitchenLight,
      orderMobileLight,
      orderDark,
      orderNotifyDark,
      caisseDark,
      kitchenDark,
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

<style scoped>
.logo {
  top: 50%;
  transform: translateY(-50%);
}

.list-header {
  padding: 0 !important;
}
</style>
