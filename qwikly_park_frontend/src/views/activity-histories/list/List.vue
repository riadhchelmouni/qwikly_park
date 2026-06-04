<template>
  <div>
    <VCard class="mb-8">
      <VCardText>
        <VRow>
          <VCol cols="12" sm="6" md="4">
            <AppDateTimePicker
              v-model="start_date"
              label="À partir de"
              :config="{
                maxDate: new Date(),
              }"
            />
          </VCol>
          <VCol cols="12" sm="6" md="4" class="d-flex align-end">
            <VBtn variant="flat" block @click="getHistory">Actualiser</VBtn>
          </VCol>
          <VCol cols="12" sm="6" md="4">
            <AppDateTimePicker
              v-model="end_date"
              label="Jusqu'à"
              :key="start_date"
              :config="{
                minDate: start_date,
                maxDate: new Date(),
              }"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>
    <VCard>
      <VCardText>
        <VDataTableServer
          class="text-no-wrap"
          :items-length="total"
          :headers="headers"
          :items="activities"
          :loading="isLoading"
        >
          <template v-slot:top>
            <VRow>
              <VCol cols="12" sm="6" md="3"></VCol>
              <VCol cols="5" class="d-none d-md-block"></VCol>
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

          <template v-slot:item.icon="{ item }">
            <VIcon :icon="getIcon(item.model)" size="large" />
          </template>

          <template v-slot:item.title="{ item }">
            <span class="text-capitalize">{{ getTitle(item) }}</span>
          </template>

          <template v-slot:item.user="{ item }">
            <span class="text-capitalize">
              {{ item.user.firstname + " " + item.user.lastname }}
            </span>
          </template>

          <template v-slot:item.role="{ item }">
            <span class="text-capitalize">{{ item.user.role }}</span>
          </template>

          <template v-slot:item.action="{ item }">
            <v-chip :color="getColor(item.action)" class="text-capitalize">{{
              item.action
            }}</v-chip>
          </template>

          <template v-slot:item.model="{ item }">{{ item.model }}</template>

          <template #item.actions="{ item, index }">
            <IconBtn color="info" @click="openDetailsSidebar(item)">
              <VIcon icon="tabler-eye" />
              <VTooltip activator="parent" location="top"
                >Détails de l'élément</VTooltip
              >
            </IconBtn>
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

    <DetailsSidebar v-model:isOpen="detailsSideBar" :current="current" />

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
import dayjs from "dayjs";

import debounce from "lodash/debounce";

import { VDataTableServer } from "vuetify/labs/VDataTable";

import placeholder from "@images/placeholders/user.svg";

import DetailsSidebar from "./sidebars/Details.vue";

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
  },

  data() {
    return {
      headers: [
        {
          title: "Icon",
          key: "icon",
          sortable: false,
        },
        {
          title: "Modèle",
          key: "model",
          sortable: false,
        },
        {
          title: "Titre",
          key: "title",
          sortable: false,
        },
        {
          title: "Utilisateur",
          key: "user",
          sortable: false,
        },
        {
          title: "Rôle",
          key: "role",
          sortable: false,
        },
        {
          title: "Action",
          key: "action",
          sortable: false,
        },
        {
          title: "Actions",
          key: "actions",
          sortable: false,
        },
      ],

      activities: [],

      searchQuery: "",
      total: 10,
      page: 1,
      perPage: 5,
      isLoading: true,

      start_date: new Date(),
      end_date: new Date(),

      detailsSideBar: false,

      current: null,

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
      this.getHistory();
    },

    page() {
      this.getHistory();
    },
  },

  created() {
    this.debouncedSearch = debounce(() => {
      this.getHistory();
    }, 500);
  },

  beforeUnmount() {
    this.debouncedSearch.cancel();
  },

  async mounted() {
    await this.getHistory();
  },

  methods: {
    getTitle(item) {
      switch (item.model) {
        case "Rôle":
          return item.data.name;
        case "Utilisateur":
          return item.data.firstname + " " + item.data.lastname;
        case "Client":
          return item.data.user.firstname + " " + item.data.user.lastname;
        case "Offre":
          return item.data.name;
        case "Achat":
          return item.data.code;
        case "License":
          return item.data.key;
        case "Ad":
          return item.data.title ? item.data.title : item.data;
        case "Propriétaire":
          return item.data.user.firstname + " " + item.data.user.lastname;
      }
    },

    getColor(action) {
      switch (action) {
        case "ajouter":
          return "success";
        case "mettre à jour":
          return "info";
        case "activer":
          return "success";
        case "désactiver":
          return "warning";
        case "supprimer":
          return "error";
        case "bloquer":
          return "error";
        case "archiver":
          return "error";
        case "réinitialiser":
          return "error";
        case "récupérer":
          return "success";
        case "changer l'ordre":
          return "success";
        case "approuver":
          return "success";
        case "refuser":
          return "error";
      }
    },

    getIcon(model) {
      switch (model) {
        case "Rôle":
          return "tabler-user-check";
        case "Utilisateur":
          return "tabler-user";
        case "Client":
          return "tabler-user";
        case "Offre":
          return "tabler-discount-check";
        case "Achat":
          return "tabler-shopping-cart";
        case "License":
          return "tabler-license";
        case "Ad":
          return "tabler-ad-circle";
        case "Propriétaire":
          return "tabler-user";
      }
    },

    async getHistory() {
      const start_date = dayjs(this.start_date).format("YYYY-MM-DD");
      const end_date = dayjs(this.end_date).format("YYYY-MM-DD");
      this.isLoading = true;
      new Promise((resolve, reject) => {
        axios
          .get(import.meta.env.VITE_BASE_URL + "/activity-histories", {
            headers: {
              Authorization: "Bearer " + this.authStore.token,
              "X-Authorization": import.meta.env.VITE_API_KEY,
            },
            params: {
              page: this.page,
              per_page: this.perPage,
              keyword: this.searchQuery.length >= 3 ? this.searchQuery : "",
              start_date,
              end_date,
            },
          })
          .then((res) => {
            this.activities = res.data.data;
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

    openDetailsSidebar(item) {
      this.current = item;
      this.detailsSideBar = true;
    },

    showSnackbar({ message, color }) {
      this.isSnackbarVisible = true;
      this.snackBarDetails.message = message;
      this.snackBarDetails.color = color;
    },
  },
};
</script>
