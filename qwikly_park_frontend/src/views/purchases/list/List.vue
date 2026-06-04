<template>
  <div>
    <VCard>
      <VCardText>
        <VDataTableServer
          class="text-no-wrap"
          :items-length="total"
          :headers="headers"
          :items="purchases"
          :loading="isLoading"
        >
          <template v-slot:top>
            <VRow>
              <VCol cols="12" sm="6" md="4" v-if="$can('purchases-add')">
                <VBtn variant="flat" block @click="addSideBar = true"
                  >Ajouter un élément</VBtn
                >
              </VCol>
              <VCol cols="12" sm="6" md="4">
                <VBtn variant="flat" block @click="getPurchases"
                  >Actualiser</VBtn
                >
              </VCol>
              <VCol
                v-if="!$can('purchases-add')"
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
          </template>

          <template v-slot:no-data>
            <span>Pas de données disponibles</span>
          </template>

          <template v-slot:loading>
            <span>Chargement des données</span>
          </template>

          <template v-slot:headers="{ columns }">
            <tr>
              <template v-for="column in columns" :key="column.key">
                <td>
                  <span class="font-weight-bold">{{ column.title }}</span>
                </td>
              </template>
            </tr>
          </template>

          <template v-slot:item.client="{ item }">{{
            item.client.user.firstname + " " + item.client.user.lastname
          }}</template>

          <template v-slot:item.offer="{ item }">{{
            item.offer.name
          }}</template>

          <template v-slot:item.status="{ item }">
            <v-chip
              :color="item.status === 'actif' ? 'success' : 'error'"
              class="text-capitalize"
              >{{ item.status }}</v-chip
            >
          </template>

          <template #item.actions="{ item, index }">
            <IconBtn color="info" @click="openDetailsSidebar(item)">
              <VIcon icon="tabler-eye" />
              <VTooltip activator="parent" location="top"
                >Détails de l'élément</VTooltip
              >
            </IconBtn>

            <IconBtn color="primary" @click="openLicensesSideBar(item, index)">
              <VIcon icon="tabler-license" />
              <VTooltip activator="parent" location="top">Licenses</VTooltip>
            </IconBtn>

            <VBtn icon variant="text" size="small" color="medium-emphasis">
              <VIcon size="24" icon="tabler-dots-vertical" />

              <VMenu activator="parent">
                <VList>
                  <VListItem
                    @click="openResetDialog(item.id)"
                    :disabled="!item.devices.length"
                    v-if="$can('purchases-update')"
                  >
                    <template #prepend>
                      <VIcon icon="tabler-devices-cancel" />
                    </template>
                    <VListItemTitle>Réinitialiser</VListItemTitle>
                  </VListItem>

                  <VListItem @click="openDevicesSideBar(item)">
                    <template #prepend>
                      <VIcon icon="tabler-devices" />
                    </template>
                    <VListItemTitle>Dispositifs</VListItemTitle>
                  </VListItem>

                  <VListItem
                    @click="openDeleteDialog(item.id)"
                    :disabled="item.licenses.length > 0"
                    v-if="$can('purchases-archive')"
                  >
                    <template #prepend>
                      <VIcon icon="tabler-trash" />
                    </template>
                    <VListItemTitle>Supprimer l'élément</VListItemTitle>
                  </VListItem>
                </VList>
              </VMenu>
            </VBtn>
          </template>

          <template #bottom>
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
          </template>
        </VDataTableServer>
      </VCardText>
    </VCard>

    <AddSidebar v-model:isOpen="addSideBar" v-if="$can('purchases-add')" />

    <DetailsSidebar v-model:isOpen="detailsSideBar" :current="current" />

    <DevicesSidebar v-model:isOpen="devicesSidebar" :current="current" />

    <LicensesSideBar v-model:isOpen="licensesSideBar" :current="current" />

    <VDialog
      v-model="resetDialog"
      class="v-dialog-sm"
      v-if="$can('purchases-reset')"
    >
      <VCard title="Confirmer la réinitialisation">
        <VCardText
          >Voulez-vous vraiment réinitialiser les dispositifs liés à cet achat
          ?</VCardText
        >

        <VCardText class="d-flex justify-end gap-3 flex-wrap">
          <VBtn color="secondary" variant="tonal" @click="resetDialog = false"
            >Annuler</VBtn
          >
          <VBtn @click="confirmReset">Confirmer</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <VDialog
      v-model="changeStatusDialog"
      class="v-dialog-sm"
      v-if="$can('purchases-update')"
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
      v-if="$can('purchases-archive')"
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

import debounce from "lodash/debounce";

import { VDataTableServer } from "vuetify/labs/VDataTable";

import AddSidebar from "./sidebars/Add.vue";
import DetailsSidebar from "./sidebars/Details.vue";
import LicensesSideBar from "./sidebars/Licenses.vue";
import DevicesSidebar from "./sidebars/Devices.vue";

import placeholder from "@images/placeholders/user.svg";

export default {
  setup() {
    return {
      authStore: useAuthStore(),
      placeholder,
    };
  },

  components: {
    VDataTableServer,
    DetailsSidebar,
    AddSidebar,
    LicensesSideBar,
    DevicesSidebar,
  },

  data() {
    return {
      headers: [
        {
          title: "Code",
          key: "code",
          sortable: false,
        },
        {
          title: "Client",
          key: "client",
          sortable: false,
        },
        {
          title: "Offre",
          key: "offer",
          sortable: false,
        },
        {
          title: "Actions",
          key: "actions",
          sortable: false,
        },
      ],

      purchases: [],

      searchQuery: "",
      total: 10,
      page: 1,
      perPage: 5,
      isLoading: true,

      resetDialog: false,
      changeStatusDialog: false,
      deleteDialog: false,

      detailsSideBar: false,
      addSideBar: false,
      licensesSideBar: false,
      devicesSidebar: false,

      current: null,
      currentIndex: null,

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
      this.getPurchases();
    },

    page() {
      this.getPurchases();
    },
  },

  created() {
    this.debouncedSearch = debounce(() => {
      this.getPurchases();
    }, 500);
  },

  beforeUnmount() {
    this.debouncedSearch.cancel();
  },

  async mounted() {
    await this.getPurchases();
    this.busOn("add-item", this.addItem);
    this.busOn("add-license", this.addLicence);
    this.busOn("update-purchase", this.editItem);
  },

  methods: {
    openLicensesSideBar(purchase, index) {
      this.currentIndex = index;
      this.current = purchase;
      this.licensesSideBar = true;
    },

    async getPurchases() {
      this.isLoading = true;
      new Promise((resolve, reject) => {
        axios
          .get(import.meta.env.VITE_BASE_URL + "/purchases", {
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
            this.purchases = res.data.data;
            this.total = res.data.total;
            this.isLoading = false;
            resolve(res);
          })
          .catch((err) => {
            this.showSnackbar({
              message: "Impossible de récupérer les données",
              color: "error",
            });
            this.isLoading = false;
            reject(err);
          });
      });
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
            `${import.meta.env.VITE_BASE_URL}/purchases/${
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
            const index = this.purchases.findIndex(
              (purchase) => purchase.id === this.currentIndex
            );
            this.purchases.splice(index, 1);
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

    openResetDialog(index) {
      this.currentIndex = index;
      this.resetDialog = true;
    },

    confirmReset() {
      this.isLoading = true;
      this.resetDialog = false;
      new Promise((resolve, reject) => {
        axios
          .patch(
            `${import.meta.env.VITE_BASE_URL}/purchases/${
              this.currentIndex
            }/reset`,
            {},
            {
              headers: {
                Authorization: "Bearer " + this.authStore.token,
                "X-Authorization": import.meta.env.VITE_API_KEY,
              },
            }
          )
          .then((res) => {
            const index = this.purchases.findIndex(
              (purchase) => purchase.id === this.currentIndex
            );
            this.purchases[index] = { ...res.data.purchase };
            this.currentIndex = null;
            this.showSnackbar({
              message: "Élément réinitialisé avec succès",
              color: "success",
            });
            this.isLoading = false;
            resolve(res);
          })
          .catch((err) => {
            this.currentIndex = null;
            this.showSnackbar({
              message: "Impossible de réinitialiser l'élément",
              color: "error",
            });
            this.isLoading = false;
            reject(err);
          });
      });
    },

    openDetailsSidebar(purchase) {
      this.current = purchase;
      this.detailsSideBar = true;
    },

    openDevicesSideBar(purchase) {
      this.current = purchase;
      this.devicesSidebar = true;
    },

    addItem(purchase) {
      this.purchases.unshift(purchase);
    },

    editItem(purchase) {
      this.purchases[this.currentIndex] = { ...purchase };
    },

    addLicence(license) {
      this.purchases[this.currentIndex].licenses.push(license);
    },

    showSnackbar({ message, color }) {
      this.isSnackbarVisible = true;
      this.snackBarDetails.message = message;
      this.snackBarDetails.color = color;
    },
  },
};
</script>
