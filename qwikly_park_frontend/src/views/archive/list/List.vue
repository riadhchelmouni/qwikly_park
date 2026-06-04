<template>
  <div>
    <VCard>
      <VCardText>
        <VDataTableServer
          class="text-no-wrap"
          :items-length="total"
          :headers="headers"
          :items="items"
          :loading="isLoading"
        >
          <template v-slot:top>
            <VRow>
              <VCol cols="12" sm="6" md="4">
                <AppSelect
                  v-model="model"
                  :items="models"
                  placeholder="Type"
                  item-value="value"
                  item-title="label"
                  single-line
                ></AppSelect>
              </VCol>
              <VCol cols="12" sm="6" md="4">
                <VBtn variant="flat" block @click="getItems" :disabled="!model"
                  >Actualiser</VBtn
                >
              </VCol>
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
                  :disabled="!model"
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

          <template #item.title="{ item }">{{ getTitle(item) }}</template>

          <template #item.actions="{ item, index }">
            <IconBtn
              color="success"
              @click="openRestoreDialog(item.id)"
              v-if="$can('archive-recover')"
            >
              <VIcon icon="tabler-reload" />
              <VTooltip activator="parent" location="top"
                >Récupérer l'élément</VTooltip
              >
            </IconBtn>

            <IconBtn
              color="error"
              @click="openDeleteDialog(item.id)"
              :disabled="checkCount(item)"
              v-if="$can('archive-delete')"
            >
              <VIcon icon="tabler-trash" />
              <VTooltip activator="parent" location="top"
                >Supprimer l'élément</VTooltip
              >
            </IconBtn>
          </template>

          <template #bottom>
            <VRow class="pt-2" justify="end" align="center" v-if="model">
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

    <VDialog
      v-model="changeStatusDialog"
      class="v-dialog-sm"
      v-if="$can('archive-recover')"
    >
      <VCard title="Confirmer la récupération de l'élément">
        <VCardText>Voulez-vous vraiment récupérer cet élément ?</VCardText>

        <VCardText class="d-flex justify-end gap-3 flex-wrap">
          <VBtn
            color="secondary"
            variant="tonal"
            @click="changeStatusDialog = false"
            >Annuler</VBtn
          >
          <VBtn @click="confirmRcovery">Confirmer</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <VDialog
      v-model="deleteDialog"
      class="v-dialog-sm"
      v-if="$can('archive-delete')"
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

export default {
  setup() {
    return {
      authStore: useAuthStore(),
    };
  },

  components: {
    VDataTableServer,
  },

  data() {
    return {
      headers: [
        {
          title: "Titre",
          key: "title",
          sortable: false,
        },
        {
          title: "Archivé à",
          key: "archived_at",
          sortable: false,
        },
        {
          title: "Actions",
          key: "actions",
          sortable: false,
        },
      ],

      models: [
        {
          label: "Offres",
          value: "offers",
        },
        {
          label: "Achats",
          value: "purchases",
        },
        {
          label: "Publicités",
          value: "ads",
        },
      ],

      model: null,

      items: [],

      searchQuery: "",
      total: 10,
      page: 1,
      perPage: 5,
      isLoading: false,

      deleteDialog: false,
      changeStatusDialog: false,

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
      this.getItems();
    },

    page() {
      this.getItems();
    },

    async model() {
      await this.getItems();
    },
  },

  created() {
    this.debouncedSearch = debounce(() => {
      this.getItems();
    }, 500);
  },

  beforeUnmount() {
    this.debouncedSearch.cancel();
  },

  methods: {
    getTitle(item) {
      return this.model && this.model === "purchases"
        ? item.client.user.firstname + " " + item.client.user.lastname
        : this.model && this.model === "ads"
        ? item.title
        : item.name;
    },

    async getItems() {
      this.isLoading = true;
      new Promise((resolve, reject) => {
        axios
          .get(`${import.meta.env.VITE_BASE_URL}/${this.model}/archived`, {
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
            this.items = res.data.data;
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

    checkCount(item) {
      return this.model && this.model === "offers" ? item.purchases > 0 : false;
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
          .delete(
            `${import.meta.env.VITE_BASE_URL}/${this.model}/${
              this.currentIndex
            }/delete`,
            {
              headers: {
                Authorization: "Bearer " + this.authStore.token,
                "X-Authorization": import.meta.env.VITE_API_KEY,
              },
            }
          )
          .then((res) => {
            const index = this.items.findIndex(
              (item) => item.id === this.currentIndex
            );
            this.items.splice(index, 1);
            this.currentIndex = null;
            this.showSnackbar({
              message: "Élément supprimé avec succès",
              color: "success",
            });
            this.isLoading = false;
            this.getItems();
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

    openRestoreDialog(index) {
      this.currentIndex = index;
      this.changeStatusDialog = true;
    },

    confirmRcovery() {
      this.isLoading = true;
      this.changeStatusDialog = false;
      new Promise((resolve, reject) => {
        axios
          .patch(
            `${import.meta.env.VITE_BASE_URL}/${this.model}/${
              this.currentIndex
            }/recover`,
            {},
            {
              headers: {
                Authorization: "Bearer " + this.authStore.token,
                "X-Authorization": import.meta.env.VITE_API_KEY,
              },
            }
          )
          .then((res) => {
            const index = this.items.findIndex(
              (item) => item.id === this.currentIndex
            );
            this.items.splice(index, 1);
            this.currentIndex = null;
            this.showSnackbar({
              message: "Élément récupéré avec succès",
              color: "success",
            });
            this.isLoading = false;
            this.getItems();
            resolve(res);
          })
          .catch((err) => {
            this.currentIndex = null;
            this.showSnackbar({
              message: "Impossible de récupérer l'élément",
              color: "error",
            });
            this.isLoading = false;
            reject(err);
          });
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
