<template>
  <div>
    <VCard class="mb-8">
      <VCardText>
        <VRow>
          <VCol cols="12" sm="6" md="4" v-if="$can('offers-add')">
            <VBtn variant="flat" block @click="addSideBar = true"
              >Ajouter un élément</VBtn
            >
          </VCol>
          <VCol cols="12" sm="6" md="4">
            <VBtn variant="flat" block @click="getOffers">Actualiser</VBtn>
          </VCol>
          <VCol
            v-if="!$can('offers-add')"
            md="4"
            class="d-none d-md-block"
          ></VCol>
          <VCol cols="12" sm="6" md="4">
            <AppTextField
              v-model="searchQuery"
              placeholder="Recherche"
              append-inner-icon="tabler-search"
              single-line
              hide-details
              outlined
              clearable
              @click:clear="searchQuery = ''"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <v-row
      align-content="center"
      class="fill-height"
      justify="center"
      v-if="isLoading"
    >
      <v-col class="text-subtitle-1 text-center" cols="12"
        >Chargement des données</v-col
      >
      <v-col cols="6">
        <v-progress-linear
          color="deep-purple-accent-4"
          height="6"
          indeterminate
          rounded
        ></v-progress-linear>
      </v-col>
    </v-row>

    <VRow v-else>
      <template v-if="offers.length">
        <VCol
          v-for="(offer, index) in offers"
          :key="index"
          cols="12"
          sm="6"
          lg="6"
        >
          <VCard>
            <VCardText class="pb-5">
              <div
                class="d-flex flex-column flex-md-row justify-md-space-between"
              >
                <h4 class="text-h4 text-capitalize">{{ offer.name }}</h4>
                <VBtn icon variant="text" size="small" color="medium-emphasis">
                  <VIcon size="24" icon="tabler-dots-vertical" />

                  <VMenu activator="parent">
                    <VList>
                      <VListItem @click="openDetailsSidebar(offer)">
                        <template #prepend>
                          <VIcon icon="tabler-eye" />
                        </template>
                        <VListItemTitle>Détails de l'élément</VListItemTitle>
                      </VListItem>

                      <VListItem
                        @click="openEditSidebar(offer, index)"
                        :disabled="checkCount(offer)"
                        v-if="$can('offers-update')"
                      >
                        <template #prepend>
                          <VIcon icon="tabler-edit" />
                        </template>
                        <VListItemTitle>Mettre à jour l'élément</VListItemTitle>
                      </VListItem>

                      <VListItem
                        @click="openDeleteDialog(offer.id)"
                        :disabled="checkCount(offer)"                        
                        v-if="$can('offers-archive')"
                      >
                        <template #prepend>
                          <VIcon icon="tabler-trash" />
                        </template>
                        <VListItemTitle>Supprimer l'élément</VListItemTitle>
                      </VListItem>
                    </VList>
                  </VMenu>
                </VBtn>
              </div>

              <VRow class="my-4">
                <VCol cols="6" sm="4" md="2" v-if="offer.caisse">
                  <VImg
                    :src="
                      global.name._value === 'dark' ? caisseDark : caisseLight
                    "
                    aspect-ratio="2.6"
                  />
                </VCol>
                <VCol cols="6" sm="4" md="2" v-if="offer.order">
                  <VImg
                    :src="
                      global.name._value === 'dark' ? orderDark : orderLight
                    "
                    aspect-ratio="2.6"
                  />
                </VCol>
                <VCol cols="6" sm="4" md="2" v-if="offer.kitchen">
                  <VImg
                    :src="
                      global.name._value === 'dark' ? kitchenDark : kitchenLight
                    "
                    aspect-ratio="2.6"
                  />
                </VCol>
                <VCol cols="6" sm="4" md="2" v-if="offer.order_notify">
                  <VImg
                    :src="
                      global.name._value === 'dark'
                        ? orderNotifyDark
                        : orderNotifyLight
                    "
                    aspect-ratio="2.6"
                  />
                </VCol>
                <VCol cols="6" sm="4" md="2" v-if="offer.order_mobile">
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
              <div class="d-flex align-center">
                <VChip
                  class="my-2"
                  :color="offer.lifetime ? 'success' : 'info'"
                  >{{
                    offer.lifetime
                      ? "Abonnement à vie"
                      : "Souscription mensuelle"
                  }}</VChip
                >
                <VSpacer />
                <h5 class="text-h4 text-capitalize">{{ offer.price }} DA</h5>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </template>
      <VCol v-else class="text-center" cols="12"
        >Pas de données disponibles</VCol
      >
    </VRow>
    <VRow class="pt-2" justify="end" align="center">
      <VCol lg="2" cols="3" />
      <VCol ms="auto" cols="auto" class="d-flex align-center justify-center gap-3">
        <VPagination
        v-model="page"
        total-visible="3"
        size="small"
        :length="Math.ceil(total / perPage)"
        class="flex-shrink-0"
        />
        <AppSelect
          v-model="perPage"
          :items="[
            { value: 5, title: '5' },
            { value: 10, title: '10' },
            { value: 25, title: '25' },
            { value: 50, title: '50' },
            ]"
            style="min-width: 4.7rem; max-width: 6rem"
            hide-details
            density="compact"
            class="flex-shrink-0"
          />
      </VCol>
    </VRow>
    <AddSidebar v-model:isOpen="addSideBar" v-if="$can('offers-add')" />

    <EditSidebar
      v-model:isOpen="editSideBar"
      :current="current"
      v-if="$can('offers-update')"
    />

    <DetailsSidebar v-model:isOpen="detailsSideBar" :current="current" />

    <VDialog
      v-model="changeStatusDialog"
      class="v-dialog-sm"
      v-if="$can('offers-update')"
    >
      <VCard title="Confirmer le changement de statut">
        <VCardText
          >Voulez-vous vraiment changer l'état de cet élément ?</VCardText
        >

        <VCardText class="d-flex justify-end gap-3 flex-wrap">
          <VBtn
            color="secondary"
            variant="tonal"
            @click="changeStatusDialog = false"
            >Annuler</VBtn
          >
          <VBtn @click="confirmChangeStatus">Confirmer</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <VDialog
      v-model="deleteDialog"
      class="v-dialog-sm"
      v-if="$can('offers-archive')"
    >
      <VCard title="Confirmer la suppression">
        <VCardText>Voulez-vous vraiment supprimer cet élément ?</VCardText>

        <VCardText class="d-flex justify-end gap-3 flex-wrap">
          <VBtn color="secondary" variant="tonal" @click="deleteDialog = false"
            >Annuler</VBtn
          >
          <VBtn @click="confirmDelete">Confirmer</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <VSnackbar
      v-model="isSnackbarVisible"
      location="bottom end"
      variant="flat"
      :color="snackBarDetails.color"
      >{{ snackBarDetails.message }}</VSnackbar
    >
  </div>
</template>

<script>
import axios from "axios";
import { useAuthStore } from "@/store/auth";
import { useTheme } from "vuetify";

import debounce from "lodash/debounce";

import AddSidebar from "./sidebars/Add.vue";
import EditSidebar from "./sidebars/Edit.vue";
import DetailsSidebar from "./sidebars/Details.vue";

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
  setup() {
    const { global } = useTheme();
    return {
      authStore: useAuthStore(),
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

  components: {
    AddSidebar,
    EditSidebar,
    DetailsSidebar,
  },

  data() {
    return {
      offers: [],

      deleteDialog: false,
      changeStatusDialog: false,

      searchQuery: "",
      total: 10,
      page: 1,
      perPage: 5,
      isLoading: true,

      current: null,
      currentIndex: null,

      addSideBar: false,
      editSideBar: false,
      detailsSideBar: false,

      isSnackbarVisible: false,
      snackBarDetails: {
        message: "",
        color: "",
      },
    };
  },

  watch: {
    searchQuery() {
      this.debouncedSearch();
    },

    perPage(val) {
      this.page = 1;
      this.getOffers();
    },

    page() {
      this.getOffers();
    },
  },

  created() {
    this.debouncedSearch = debounce(() => {
      this.getOffers();
    }, 500);
  },

  beforeUnmount() {
    this.debouncedSearch.cancel();
  },

  async mounted() {
    await this.getOffers();
    this.busOn("add-item", this.addItem);
    this.busOn("update-item", this.editItem);
  },

  methods: {
    async getOffers() {
      this.isLoading = true;
      new Promise((resolve, reject) => {
        axios
          .get(import.meta.env.VITE_BASE_URL + "/offers", {
            headers: {
              Authorization: "Bearer " + this.authStore.token,
              "X-Authorization": import.meta.env.VITE_API_KEY,
            },
            params: {
              page: this.page,
              per_page: this.perPage,
              keyword: this.searchQuery.length >= 3 ? this.searchQuery : "",
            },
          })
          .then((res) => {
            this.offers = res.data.data;
            this.total = res.data.total;
            this.isLoading = false;
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            this.showSnackbar({
              message: "Impossible de récupérer les données",
              color: "error",
            });
            reject(err);
          });
      });
    },

    checkCount(offer) {
      return offer.purchases > 0;
    },

    openDeleteDialog(index) {
      this.currentIndex = index;
      this.deleteDialog = true;
    },

    confirmDelete() {
      this.isLoading = true;
      this.deleteDialog = false;
      new Promise((resolve, reject) => {
        axios
          .patch(
            `${import.meta.env.VITE_BASE_URL}/offers/${
              this.currentIndex
            }/archive`,
            {},
            {
              headers: {
                Authorization: "Bearer " + this.authStore.token,
                "X-Authorization": import.meta.env.VITE_API_KEY,
              },
            }
          )
          .then((res) => {
            const index = this.offers.findIndex(
              (offer) => offer.id === this.currentIndex
            );
            this.offers.splice(index, 1);
            this.currentIndex = null;
            this.showSnackbar({
              message: "Élément supprimé avec succès",
              color: "success",
            });
            this.isLoading = false;
            resolve(res);
          })
          .catch((err) => {
            this.currentIndex = null;
            if (err.response.status === 404) {
              this.showSnackbar({
                message:
                  "Impossible de supprimer l'élément car il a des relations avec d'autres données",
                color: "error",
              });
            } else {
              this.showSnackbar({
                message: "Impossible de supprimer l'élément",
                color: "error",
              });
            }
            this.isLoading = false;
            reject(err);
          });
      });
    },

    openChangeStatusDialog(index) {
      this.currentIndex = index;
      this.changeStatusDialog = true;
    },

    confirmChangeStatus() {
      this.isLoading = true;
      this.changeStatusDialog = false;
      new Promise((resolve, reject) => {
        axios
          .patch(
            `${import.meta.env.VITE_BASE_URL}/offers/${
              this.currentIndex
            }/change-status`,
            {},
            {
              headers: {
                Authorization: "Bearer " + this.authStore.token,
                "X-Authorization": import.meta.env.VITE_API_KEY,
              },
            }
          )
          .then((res) => {
            const index = this.offers.findIndex(
              (offer) => offer.id === this.currentIndex
            );
            this.offers[index] = res.data.offer;
            this.currentIndex = null;
            this.showSnackbar({
              message: "Le statut de l'élément a bien été changé",
              color: "success",
            });
            this.isLoading = false;
            resolve(res);
          })
          .catch((err) => {
            this.currentIndex = null;
            this.showSnackbar({
              message: "Impossible de changer l'état de l'élément",
              color: "error",
            });
            this.isLoading = false;
            reject(err);
          });
      });
    },

    openEditSidebar(offer, index) {
      this.currentIndex = index;
      this.current = offer;
      this.editSideBar = true;
    },

    openDetailsSidebar(offer) {
      this.current = offer;
      this.detailsSideBar = true;
    },

    addItem(offer) {
      this.offers.unshift(offer);
    },

    editItem(offer) {
      this.offers[this.currentIndex] = { ...offer };
    },

    showSnackbar({ message, color }) {
      this.isSnackbarVisible = true;
      this.snackBarDetails.message = message;
      this.snackBarDetails.color = color;
    },
  },
};
</script>
