<template>
  <VNavigationDrawer
    temporary
    :width="800"
    location="end"
    class="scrollable-content"
    :model-value="isOpen"
    @update:model-value="(val) => $emit('update:isOpen', val)"
  >
    <AppDrawerHeaderSection title="Ajouter un élément" @cancel="close" />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <VForm ref="addForm">
            <VRow>
              <VCol cols="12">
                <AppTextField
                  label="Nom d'offre"
                  v-model="offer.name"
                  :rules="[requiredValidator, stringLengthValidator]"
                />
              </VCol>

              <VCol cols="12">
                <VSwitch v-model="offer.lifetime" label="Abonnement À vie" />
              </VCol>

              <VCol cols="12" v-show="!offer.lifetime">
                <AppTextField
                  label="Durée d'abonnement"
                  v-model="offer.duration"
                  type="number"
                  suffix="Mois"
                  min="1"
                  :rules="[
                    offer.lifetime ? true : requiredValidator,
                    offer.lifetime ? true : positiveNumberValidator,
                    offer.lifetime ? true : integerValidator,
                  ]"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  label="Prix d'abonnement"
                  v-model="offer.price"
                  type="number"
                  suffix="DA"
                  min="1"
                  :rules="[requiredValidator, positiveNumberValidator]"
                />
              </VCol>

              <VCol cols="12">
                <CustomCheckboxesWithImage
                  v-model:selected-checkbox="offer.products"
                  :checkbox-content="products"
                  :aspectRatio="2.6"
                  :grid-column="{ sm: '3', cols: '6' }"
                />
              </VCol>

              <VCol cols="12">
                <AppSelect
                  v-model="offer.status"
                  color="info"
                  :items="statusOptions"
                  item-title="label"
                  item-value="value"
                  label="Statut"
                >
                  <template v-slot:selection="{ item }">
                    <span class="text-capitalize">
                      {{ item.raw.label }}
                    </span>
                  </template>
                  <template v-slot:item="{ item, props }">
                    <VListItem v-bind="props">
                      <template v-slot:title>
                        <span class="text-capitalize">
                          {{ item.raw.label }}
                        </span>
                      </template>
                    </VListItem>
                  </template>
                </AppSelect>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </PerfectScrollbar>

    <template v-slot:append>
      <VCard flat>
        <VCardText>
          <VRow>
            <VCol cols="12">
              <VBtn
                class="me-3"
                @click="save"
                :loading="loading"
                :disabled="loading"
                :key="loading"
                >Sauvegarder</VBtn
              >
              <VBtn
                type="reset"
                variant="tonal"
                color="secondary"
                @click="close"
                >Annuler</VBtn
              >
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </template>
  </VNavigationDrawer>

  <VSnackbar
    v-model="isSnackbarVisible"
    location="bottom end"
    variant="flat"
    :color="snackBarDetails.color"
    >{{ snackBarDetails.message }}</VSnackbar
  >
</template>

<script>
import axios from "axios";
import { useAuthStore } from "@/store/auth";

import { PerfectScrollbar } from "vue3-perfect-scrollbar";

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

import {
  requiredValidator,
  stringLengthValidator,
  positiveNumberValidator,
  integerValidator,
} from "@validators";

export default {
  emits: ["update:isOpen"],

  setup() {
    return {
      authStore: useAuthStore(),

      requiredValidator,
      stringLengthValidator,
      positiveNumberValidator,
      integerValidator,
    };
  },

  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },
  },

  components: { PerfectScrollbar },

  watch: {
    isOpen(val) {
      if (val) {
        this.offer = {
          name: null,
          lifetime: false,
          duration: null,
          price: null,
          products: [],
          status: true,
        };
      }
      this.$refs.addForm.resetValidation();
    },

    "offer.products"(val) {
      if (!val.includes("caisse")) this.offer.products.unshift("caisse");
    },
  },

  computed: {
    hasProducts(val) {
      return this.offer.products.length > 0;
    },
  },

  data() {
    return {
      statusOptions: [
        {
          label: "Actif",
          value: true,
        },
        {
          label: "Inactif",
          value: false,
        },
      ],

      products: [
        {
          bgImage: caisseLight,
          bgImageDark: caisseDark,
          value: "caisse",
        },
        {
          bgImage: orderLight,
          bgImageDark: orderDark,
          value: "order",
        },
        {
          bgImage: kitchenLight,
          bgImageDark: kitchenDark,
          value: "kitchen",
        },
        {
          bgImage: orderNotifyLight,
          bgImageDark: orderNotifyDark,
          value: "order_notify",
        },
        {
          bgImage: orderMobileLight,
          bgImageDark: orderMobileDark,
          value: "order_mobile",
        },
      ],

      offer: {
        name: null,
        lifetime: false,
        duration: null,
        price: null,
        products: [],
        status: true,
      },

      loading: false,

      isSnackbarVisible: false,
      snackBarDetails: {
        message: "",
        color: "",
      },
    };
  },

  methods: {
    close() {
      this.$emit("update:isOpen", false);
    },

    save() {
      this.$refs.addForm.validate().then(({ valid }) => {
        if (valid) {
          if (!this.hasProducts) {
            this.showSnackbar({
              message: "Veuillez sélectionner quelques produits",
              color: "error",
            });
            return;
          }
          this.loading = true;
          const data = {
            ...this.offer,
            caisse: this.offer.products.includes("caisse"),
            order: this.offer.products.includes("order"),
            order_notify: this.offer.products.includes("order_notify"),
            kitchen: this.offer.products.includes("kitchen"),
            order_mobile: this.offer.products.includes("order_mobile"),
          };
          if (this.offer.lifetime) delete data.duration;
          delete data.products;
          new Promise((resolve, reject) => {
            axios
              .post(import.meta.env.VITE_BASE_URL + "/offers/add", data, {
                headers: {
                  Authorization: "Bearer " + this.authStore.token,
                  "X-Authorization": import.meta.env.VITE_API_KEY,
                },
              })
              .then((res) => {
                this.loading = false;
                this.busEmit("add-item", res.data.offer);
                this.showSnackbar({
                  message: "Élément ajouté avec succès",
                  color: "success",
                });
                this.close();
                resolve(res);
              })
              .catch((err) => {
                this.loading = false;
                this.showSnackbar({
                  message: "Impossible d'ajouter l'élément",
                  color: "error",
                });
                reject(err);
              });
          });
        }
      });
    },

    showSnackbar({ message, color }) {
      this.isSnackbarVisible = true;
      this.snackBarDetails.message = message;
      this.snackBarDetails.color = color;
    },
  },
};
</script>
