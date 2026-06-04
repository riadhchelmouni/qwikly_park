<template>
  <div>
    <VCard>
      <VCardText>
        <VDataTableServer
          class="text-no-wrap"
          :items-length="total"
          :headers="headers"
          :items="users"
          :loading="isLoading"
        >
          <template v-slot:top>
            <VRow>
              <VCol cols="12" sm="6" md="4" v-if="$can('users-add')">
                <VBtn variant="flat" block @click="addSideBar = true">Ajouter un élément</VBtn>
              </VCol>
              <VCol cols="12" sm="6" md="4">
                <VBtn variant="flat" block @click="getUsers">Actualiser</VBtn>
              </VCol>
              <VCol v-if="!$can('users-add')" md="4" class="d-none d-md-block"></VCol>
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

          <template v-slot:item.image="{ item }">
            <VImg
              :src="item.image ? item.image : placeholder"
              aspect-ratio="1"
              :width="60"
              cover
              class="rounded-circle my-2"
            />
          </template>

          <template v-slot:item.name="{ item }">{{ item.firstname + " " + item.lastname }}</template>

          <template v-slot:item.role="{ item }">
            <span class="text-capitalize">{{ item.role.name }}</span>
          </template>

          <template v-slot:item.status="{ item }">
            <v-chip
              :color="item.status === 'actif' ? 'success' : 'error'"
              class="text-capitalize"
            >{{ item.status }}</v-chip>
          </template>

          <template #item.actions="{ item, index }">
            <IconBtn color="info" @click="openDetailsSidebar(item)">
              <VIcon icon="tabler-eye" />
              <VTooltip activator="parent" location="top">Détails de l'élément</VTooltip>
            </IconBtn>

            <IconBtn
              color="success"
              @click="openEditSidebar(item, index)"
              v-if="$can('users-update') && authStore.user.id !== item.id"
            >
              <VIcon icon="tabler-edit" />
              <VTooltip activator="parent" location="top">Mettre à jour l'élément</VTooltip>
            </IconBtn>

            <IconBtn
              :color="item.status === 'actif' ? 'warning' : 'success'"
              @click="openchangeStatusDialog(item, item.id)"
              v-if="$can('users-update') && authStore.user.id !== item.id"
            >
              <VIcon icon="tabler-status-change" />
              <VTooltip activator="parent" location="top">Changer l'état de l'élément</VTooltip>
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

    <AddSidebar v-model:isOpen="addSideBar" :roles="roles" v-if="$can('users-add')" />

    <EditSidebar
      v-model:isOpen="editSideBar"
      :roles="roles"
      :current="current"
      v-if="$can('users-update')"
    />

    <DetailsSidebar v-model:isOpen="detailsSideBar" :current="current" />

    <VDialog v-model="changeStatusDialog" class="v-dialog-sm" v-if="$can('users-update')">
      <VCard title="Confirmer le changement de statut">
        <VCardText>Voulez-vous vraiment changer l'état de cet élément ?</VCardText>

        <VCardText class="d-flex justify-end gap-3 flex-wrap">
          <VBtn color="secondary" variant="tonal" @click="changeStatusDialog = false">Annuler</VBtn>
          <VBtn @click="confirmChangeStatus">Confirmer</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <VSnackbar
      v-model="isSnackbarVisible"
      location="bottom end"
      variant="flat"
      :color="snackBarDetails.color"
    >{{ snackBarDetails.message }}</VSnackbar>
  </div>
</template>

<script>
import { $api } from "@/utils/api";
import { useAuthStore } from "@/store/auth";

import debounce from "lodash/debounce";

import { VDataTableServer } from "vuetify/labs/VDataTable";

import AddSidebar from "./sidebars/Add.vue";
import EditSidebar from "./sidebars/Edit.vue";
import DetailsSidebar from "./sidebars/Details.vue";

import placeholder from "@images/placeholders/user.svg";

export default {
  setup() {
    return {
      authStore: useAuthStore(),
      placeholder
    };
  },

  components: {
    VDataTableServer,
    DetailsSidebar,
    AddSidebar,
    EditSidebar
  },

  data() {
    return {
      headers: [
        { title: "Image", key: "image", sortable: false },
        { title: "Nom", key: "name", sortable: false },
        { title: "Rôle", key: "role", sortable: false },
        { title: "Adresse e-mail", key: "email", sortable: false },
        { title: "Numéro de téléphone", key: "phone", sortable: false },
        { title: "Statut", key: "status", sortable: false },
        { title: "Actions", key: "actions", sortable: false }
      ],

      users: [],
      roles: [],

      searchQuery: "",
      total: 10,
      page: 1,
      perPage: 5,
      isLoading: true,

      changeStatusDialog: false,

      detailsSideBar: false,
      addSideBar: false,
      editSideBar: false,

      current: null,
      currentIndex: null,

      isSnackbarVisible: false,
      snackBarDetails: { message: "", color: "" }
    };
  },

  watch: {
    searchQuery() { this.debouncedSearch(); },
    perPage() { this.page = 1; this.getUsers(); },
    page() { this.getUsers(); }
  },

  created() {
    this.debouncedSearch = debounce(() => this.getUsers(), 500);
  },

  beforeUnmount() {
    this.debouncedSearch.cancel();
  },

  async mounted() {
    await this.getUsers();
    await this.getRoles();
    this.busOn("add-item", this.addItem);
    this.busOn("update-item", this.editItem);
  },

  methods: {
    async getUsers() {
      this.isLoading = true;
      try {
        const res = await $api("/users", {
          params: {
            page: this.page,
            per_page: this.perPage,
            keyword: this.searchQuery.length >= 3 ? this.searchQuery : ""
          }
        });
        this.users = res.data;
        this.total = res.total;
      } catch {
        this.showSnackbar({ message: "Impossible de récupérer les données", color: "error" });
      } finally {
        this.isLoading = false;
      }
    },

    async getRoles() {
      try {
        const res = await $api("/users/roles");
        this.roles = res.data;
      } catch {
        this.showSnackbar({ message: "Impossible de récupérer les données", color: "error" });
      }
    },

    openchangeStatusDialog(item, index) {
      this.currentIndex = index;
      this.current = item;
      this.changeStatusDialog = true;
    },

    async confirmChangeStatus() {
      this.isLoading = true;
      this.changeStatusDialog = false;
      try {
        const res = await $api(`/users/${this.currentIndex}/change-status`, { method: "PATCH" });
        const index = this.users.findIndex(user => user.id === this.currentIndex);
        this.users[index] = res.user;
        this.showSnackbar({ message: "Le statut de l'élément a bien été changé", color: "success" });
      } catch {
        this.showSnackbar({ message: "Impossible de changer l'état de l'élément", color: "error" });
      } finally {
        this.currentIndex = null;
        this.isLoading = false;
      }
    },

    openDetailsSidebar(user) {
      this.current = user;
      this.detailsSideBar = true;
    },

    openEditSidebar(user, index) {
      this.currentIndex = index;
      this.current = user;
      this.editSideBar = true;
    },

    addItem(user) { this.users.unshift(user); },
    editItem(user) { this.users[this.currentIndex] = { ...user }; },

    showSnackbar({ message, color }) {
      this.isSnackbarVisible = true;
      this.snackBarDetails.message = message;
      this.snackBarDetails.color = color;
    }
  }
};
</script>
