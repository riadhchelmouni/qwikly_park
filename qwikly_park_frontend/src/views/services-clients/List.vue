<template>
  <div>
    <!-- ─── Top Action Bar ─── -->
    <VCard class="mb-4">
      <VCardText class="pa-4">
        <div class="d-flex align-center gap-3 flex-wrap">
          <VBtn class="add-btn" elevation="0" @click="openAddSidebar">
            Ajouter Un Élément
          </VBtn>
          <VBtn class="refresh-btn" elevation="0" @click="getClients">
            Actualiser
          </VBtn>
          <VSpacer />
          <VTextField
            v-model="searchQuery"
            placeholder="Recherche"
            append-inner-icon="tabler-search"
            single-line hide-details clearable density="compact"
            variant="outlined"
            style="max-width:280px"
            @click:clear="searchQuery = ''"
          />
        </div>
      </VCardText>
    </VCard>

    <!-- ─── Table Card ─── -->
    <VCard>
      <VCardText class="pa-4">
        <VDataTableServer
          class="services-clients-table"
          :items-length="total"
          :headers="headers"
          :items="clients"
          :loading="isLoading"
          hide-default-header
        >
          <!-- Custom header -->
          <template #headers="{ columns }">
            <tr class="table-header-row">
              <th v-for="col in columns" :key="col.key" class="table-th">
                {{ col.title }}
              </th>
            </tr>
          </template>

          <template #no-data>
            <span class="text-medium-emphasis">Pas de données disponibles</span>
          </template>
          <template #loading>
            <span>Chargement des données...</span>
          </template>

          <!-- Image -->
          <template #item.image="{ item }">
            <VAvatar size="36" :image="item.image || placeholder" class="my-1" />
          </template>

          <!-- Nom -->
          <template #item.name="{ item }">
            <span class="font-weight-medium">
              {{ item.user?.firstname }} {{ item.user?.lastname }}
            </span>
          </template>

          <!-- Email -->
          <template #item.email="{ item }">
            {{ item.user?.email || '—' }}
          </template>

          <!-- Téléphone -->
          <template #item.phone="{ item }">
            {{ item.user?.phone || '—' }}
          </template>

          <!-- Statut -->
          <template #item.status="{ item }">
            <VChip
              :color="item.status === 'approved' ? 'success' : item.status === 'refused' ? 'error' : 'warning'"
              size="small"
              class="font-weight-medium status-chip"
            >
              {{ item.status === 'approved' ? 'Approuvé' : item.status === 'refused' ? 'Refusé' : 'En Attente' }}
            </VChip>
          </template>

          <!-- Actions -->
          <template #item.actions="{ item }">
            <div class="d-flex align-center gap-1">
              <IconBtn size="small" color="info" @click="openDetailsDialog(item)">
                <VIcon icon="tabler-eye" size="18" />
              </IconBtn>
              <IconBtn size="small" color="secondary" @click="openEditSidebar(item)">
                <VIcon icon="tabler-pencil" size="18" />
              </IconBtn>
              <VMenu>
                <template #activator="{ props }">
                  <IconBtn size="small" v-bind="props">
                    <VIcon icon="tabler-dots-vertical" size="18" />
                  </IconBtn>
                </template>
                <VList density="compact" nav>
                  <VListItem
                    v-if="item.status !== 'approved'"
                    prepend-icon="tabler-check"
                    title="Approuver"
                    @click="approveClient(item)"
                  />
                  <VListItem
                    v-if="item.status !== 'refused'"
                    prepend-icon="tabler-x"
                    title="Refuser"
                    @click="refuseClient(item)"
                  />
                  <VListItem
                    prepend-icon="tabler-trash"
                    title="Supprimer"
                    class="text-error"
                    @click="openDeleteDialog(item)"
                  />
                </VList>
              </VMenu>
            </div>
          </template>

          <!-- Pagination -->
          <template #bottom>
            <div class="d-flex align-center justify-space-between px-2 pt-3">
              <span style="font-size:12px; color:#9e9e9e">
                Showing 1 to {{ Math.min(perPage, total) }} of {{ total }} entries
              </span>
              <div class="d-flex align-center gap-2">
                <VPagination
                  v-model="page"
                  :length="Math.ceil(total / perPage)"
                  total-visible="4"
                  size="small"
                />
                <VSelect
                  v-model="perPage"
                  :items="[{value:5,title:'5'},{value:10,title:'10'},{value:25,title:'25'},{value:50,title:'50'}]"
                  hide-details density="compact" variant="outlined"
                  style="min-width:65px; max-width:75px"
                />
              </div>
            </div>
          </template>
        </VDataTableServer>
      </VCardText>
    </VCard>

    <!-- ═══════════════════════════════════════
         DETAILS DIALOG
    ════════════════════════════════════════ -->
    <VDialog v-model="detailsDialog" max-width="480" scrollable>
      <VCard v-if="current" class="details-modal">
        <VCardText class="pa-6 pb-3">
          <div class="d-flex align-center gap-2 mb-5">
            <VBtn icon variant="text" size="small" density="compact" @click="detailsDialog = false">
              <VIcon icon="tabler-arrow-left" size="20" />
            </VBtn>
            <span class="text-h6 font-weight-bold">Détails du client</span>
          </div>

          <div class="d-flex align-center gap-3 mb-5">
            <VAvatar size="56" :image="current.image || placeholder" />
            <div>
              <div class="font-weight-bold" style="font-size:16px">
                {{ current.user?.firstname }} {{ current.user?.lastname }}
              </div>
              <VChip
                :color="current.status === 'approved' ? 'success' : current.status === 'refused' ? 'error' : 'warning'"
                size="x-small" class="mt-1"
              >
                {{ current.status === 'approved' ? 'Approuvé' : current.status === 'refused' ? 'Refusé' : 'En Attente' }}
              </VChip>
            </div>
          </div>

          <div class="info-row">
            <span class="info-label">Adresse e-mail</span>
            <span class="info-value">{{ current.user?.email || '—' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Numéro de téléphone</span>
            <span class="info-value">{{ current.user?.phone || '—' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Ville</span>
            <span class="info-value">{{ current.ville || current.user?.ville || '—' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date d'inscription</span>
            <span class="info-value">{{ formatDate(current.created_at) }}</span>
          </div>
          <div class="info-row" v-if="current.parks && current.parks.length">
            <span class="info-label">Parc(s) associé(s)</span>
            <div class="info-value">
              <div v-for="park in current.parks" :key="park.id" style="color:#4CAF50">
                • {{ park.name || park.localisation || park.numero }}
              </div>
            </div>
          </div>
        </VCardText>

        <VCardText class="d-flex gap-2 px-6 pb-6 pt-2">
          <VBtn class="action-btn-delete" elevation="0" @click="openDeleteFromDetails">
            <VIcon icon="tabler-trash" size="16" class="me-1" />
            Supprimer
          </VBtn>
          <VSpacer />
          <VBtn class="action-btn-edit" elevation="0" @click="openEditFromDetails">
            <VIcon icon="tabler-edit" size="16" class="me-1" />
            Modifier
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- ═══════════════════════════════════════
         DELETE CONFIRM DIALOG
    ════════════════════════════════════════ -->
    <VDialog v-model="deleteDialog" max-width="440">
      <VCard>
        <VCardTitle class="text-subtitle-1 font-weight-bold pa-5 pb-2">
          Confirmer la suppression
        </VCardTitle>
        <VCardText class="px-5 pb-2">
          <p class="mb-1">Voulez-vous vraiment supprimer ce client ?</p>
          <p style="font-size:13px; color:#9e9e9e">
            Vous ne pourrez plus accéder aux données qui y sont rattachées après suppression.
          </p>
        </VCardText>
        <VCardText class="d-flex justify-end gap-3 px-5 pb-5 pt-1">
          <VBtn style="background:#1a1a2e; color:#fff; min-width:100px" elevation="0" @click="deleteDialog = false">
            Annuler
          </VBtn>
          <VBtn color="error" variant="text" @click="confirmDelete" style="min-width:100px">
            Supprimer
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- ═══════════════════════════════════════
         ADD CLIENT SIDEBAR
    ════════════════════════════════════════ -->
    <VNavigationDrawer
      v-model="addSidebar"
      temporary location="end"
      :width="480"
    >
      <div class="pa-6">
        <div class="d-flex align-center justify-space-between mb-6">
          <span class="text-h6 font-weight-bold">Ajouter Un Client</span>
          <VBtn icon variant="text" size="small" @click="addSidebar = false">
            <VIcon icon="tabler-x" size="20" />
          </VBtn>
        </div>

        <VForm ref="addFormRef" @submit.prevent="submitAdd">
          <VRow>
            <VCol cols="12">
              <VTextField
                v-model="addForm.firstname"
                label="Prénom"
                variant="outlined"
                density="compact"
                :error-messages="addErrors.firstname"
                class="mb-3"
              />
            </VCol>
            <VCol cols="12">
              <VTextField
                v-model="addForm.lastname"
                label="Nom"
                variant="outlined"
                density="compact"
                :error-messages="addErrors.lastname"
                class="mb-3"
              />
            </VCol>
            <VCol cols="12">
              <VTextField
                v-model="addForm.email"
                label="Adresse e-mail"
                type="email"
                variant="outlined"
                density="compact"
                :error-messages="addErrors.email"
                class="mb-3"
              />
            </VCol>
            <VCol cols="12">
              <VTextField
                v-model="addForm.phone"
                label="Numéro de téléphone (+213XXXXXXXXX)"
                variant="outlined"
                density="compact"
                :error-messages="addErrors.phone"
                class="mb-3"
              />
            </VCol>
            <VCol cols="12">
              <VTextField
                v-model="addForm.birthdate"
                label="Date de naissance"
                type="date"
                variant="outlined"
                density="compact"
                :error-messages="addErrors.birthdate"
                class="mb-3"
              />
            </VCol>
            <VCol cols="12">
              <VTextField
                v-model="addForm.address"
                label="Adresse"
                variant="outlined"
                density="compact"
                :error-messages="addErrors.address"
                class="mb-3"
              />
            </VCol>
            <VCol cols="12">
              <VTextField
                v-model="addForm.password"
                label="Mot de passe (min. 8 caractères)"
                type="password"
                variant="outlined"
                density="compact"
                :error-messages="addErrors.password"
                class="mb-3"
              />
            </VCol>
            <VCol cols="12">
              <VTextField
                v-model="addForm.password_confirmation"
                label="Confirmer le mot de passe"
                type="password"
                variant="outlined"
                density="compact"
                :error-messages="addErrors.password_confirmation"
                class="mb-4"
              />
            </VCol>
          </VRow>

          <div class="d-flex gap-3">
            <VBtn variant="outlined" style="flex:1" @click="addSidebar = false">Annuler</VBtn>
            <VBtn
              type="submit"
              style="flex:1; background:#1a1a2e; color:#fff"
              elevation="0"
              :loading="addLoading"
            >
              Ajouter
            </VBtn>
          </div>
        </VForm>
      </div>
    </VNavigationDrawer>

    <!-- ═══════════════════════════════════════
         EDIT CLIENT SIDEBAR
    ════════════════════════════════════════ -->
    <VNavigationDrawer
      v-model="editSidebar"
      temporary location="end"
      :width="480"
    >
      <div class="pa-6" v-if="current">
        <div class="d-flex align-center justify-space-between mb-6">
          <span class="text-h6 font-weight-bold">Modifier Le Client</span>
          <VBtn icon variant="text" size="small" @click="editSidebar = false">
            <VIcon icon="tabler-x" size="20" />
          </VBtn>
        </div>

        <VForm @submit.prevent="submitEdit">
          <VRow>
            <VCol cols="12">
              <VTextField
                v-model="editForm.firstname"
                label="Prénom"
                variant="outlined"
                density="compact"
                hide-details="auto"
                class="mb-4"
              />
            </VCol>
            <VCol cols="12">
              <VTextField
                v-model="editForm.lastname"
                label="Nom"
                variant="outlined"
                density="compact"
                hide-details="auto"
                class="mb-4"
              />
            </VCol>
            <VCol cols="12">
              <VTextField
                v-model="editForm.email"
                label="Adresse e-mail"
                type="email"
                variant="outlined"
                density="compact"
                hide-details="auto"
                class="mb-4"
              />
            </VCol>
            <VCol cols="12">
              <VTextField
                v-model="editForm.phone"
                label="Numéro de téléphone"
                variant="outlined"
                density="compact"
                hide-details="auto"
                class="mb-6"
              />
            </VCol>
          </VRow>

          <div class="d-flex gap-3">
            <VBtn variant="outlined" style="flex:1" @click="editSidebar = false">Annuler</VBtn>
            <VBtn
              type="submit"
              style="flex:1; background:#E8A838; color:#1a1a2e"
              elevation="0"
              :loading="editLoading"
            >
              Enregistrer
            </VBtn>
          </div>
        </VForm>
      </div>
    </VNavigationDrawer>

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
import debounce from "lodash/debounce";
import { VDataTableServer } from "vuetify/labs/VDataTable";
import placeholder from "@images/placeholders/user.svg";

export default {
  setup() {
    return { placeholder };
  },

  components: { VDataTableServer },

  data() {
    return {
      headers: [
        { title: "Image",                key: "image",   sortable: false, width: "60px" },
        { title: "Nom",                  key: "name",    sortable: false },
        { title: "Adresse e-mail",       key: "email",   sortable: false },
        { title: "Numéro de téléphone",  key: "phone",   sortable: false },
        { title: "Statut",               key: "status",  sortable: false },
        { title: "Actions",              key: "actions", sortable: false },
      ],

      clients: [],
      searchQuery: "",
      total: 0,
      page: 1,
      perPage: 5,
      isLoading: true,

      detailsDialog: false,
      deleteDialog: false,
      addSidebar: false,
      editSidebar: false,

      current: null,
      currentDeleteId: null,

      addForm: { firstname: "", lastname: "", email: "", phone: "", birthdate: "", address: "", password: "", password_confirmation: "" },
      addErrors: { firstname: [], lastname: [], email: [], phone: [], birthdate: [], address: [], password: [], password_confirmation: [] },
      editForm: { firstname: "", lastname: "", email: "", phone: "" },
      addLoading: false,
      editLoading: false,

      isSnackbarVisible: false,
      snackBarDetails: { message: "", color: "" },
    };
  },

  watch: {
    searchQuery() { this.debouncedSearch(); },
    perPage() { this.page = 1; this.getClients(); },
    page() { this.getClients(); },
  },

  created() {
    this.debouncedSearch = debounce(() => {
      this.page = 1;
      this.getClients();
    }, 500);
  },

  beforeUnmount() { this.debouncedSearch.cancel(); },

  async mounted() {
    await this.getClients();
  },

  methods: {
    async getClients() {
      this.isLoading = true;
      const params = {
        page: this.page,
        per_page: this.perPage,
      };
      if (this.searchQuery.length >= 3) params.keyword = this.searchQuery;
      try {
        const res = await $api("/clients", { params });
        this.clients = res.data;
        this.total = res.total;
      } catch {
        this.showSnackbar({ message: "Impossible de récupérer les données", color: "error" });
      } finally {
        this.isLoading = false;
      }
    },

    openAddSidebar() {
      this.addForm = { firstname: "", lastname: "", email: "", phone: "", birthdate: "", address: "", password: "", password_confirmation: "" };
      this.addErrors = { firstname: [], lastname: [], email: [], phone: [], birthdate: [], address: [], password: [], password_confirmation: [] };
      this.addSidebar = true;
    },

    async submitAdd() {
      this.addErrors = { firstname: [], lastname: [], email: [], phone: [], birthdate: [], address: [], password: [], password_confirmation: [] };
      this.addLoading = true;
      try {
        const res = await $api("/clients/add", {
          method: "POST",
          body: {
            firstname:             this.addForm.firstname,
            lastname:              this.addForm.lastname,
            email:                 this.addForm.email,
            phone:                 this.addForm.phone,
            birthdate:             this.addForm.birthdate,
            address:               this.addForm.address,
            password:              this.addForm.password,
            password_confirmation: this.addForm.password_confirmation,
          },
        });
        this.clients.unshift(res.client || res);
        this.total += 1;
        this.addSidebar = false;
        this.showSnackbar({ message: "Client ajouté avec succès", color: "success" });
      } catch (err) {
        const errors = err?.data?.errors || {};
        if (Object.keys(errors).length) {
          Object.keys(errors).forEach(field => {
            if (this.addErrors[field] !== undefined) {
              this.addErrors[field] = errors[field];
            }
          });
        } else {
          this.showSnackbar({ message: "Impossible d'ajouter le client", color: "error" });
        }
      } finally {
        this.addLoading = false;
      }
    },

    openEditSidebar(item) {
      this.current = item;
      this.editForm = {
        firstname: item.user?.firstname || "",
        lastname:  item.user?.lastname  || "",
        email:     item.user?.email     || "",
        phone:     item.user?.phone     || "",
      };
      this.editSidebar = true;
    },

    openEditFromDetails() {
      this.detailsDialog = false;
      this.editForm = {
        firstname: this.current?.user?.firstname || "",
        lastname:  this.current?.user?.lastname  || "",
        email:     this.current?.user?.email     || "",
        phone:     this.current?.user?.phone     || "",
      };
      this.editSidebar = true;
    },

    async submitEdit() {
      if (!this.current) return;
      this.editLoading = true;
      try {
        const res = await $api(`/clients/${this.current.id}/update`, {
          method: "PUT",
          body: this.editForm,
        });
        const idx = this.clients.findIndex(c => c.id === this.current.id);
        if (idx !== -1) this.clients[idx] = res.client || { ...this.clients[idx], user: { ...this.clients[idx].user, ...this.editForm } };
        this.editSidebar = false;
        this.showSnackbar({ message: "Client modifié avec succès", color: "success" });
      } catch {
        this.showSnackbar({ message: "Impossible de modifier le client", color: "error" });
      } finally {
        this.editLoading = false;
      }
    },

    openDetailsDialog(item) {
      this.current = item;
      this.detailsDialog = true;
    },

    openDeleteDialog(item) {
      this.current = item;
      this.currentDeleteId = item.id;
      this.deleteDialog = true;
    },

    openDeleteFromDetails() {
      this.currentDeleteId = this.current?.id;
      this.deleteDialog = true;
      this.detailsDialog = false;
    },

    async confirmDelete() {
      this.deleteDialog = false;
      try {
        await $api(`/clients/${this.currentDeleteId}`, { method: "DELETE" });
        this.clients = this.clients.filter(c => c.id !== this.currentDeleteId);
        this.total = Math.max(0, this.total - 1);
        this.showSnackbar({ message: "Client supprimé avec succès", color: "warning" });
        this.current = null;
        this.currentDeleteId = null;
      } catch {
        this.showSnackbar({ message: "Impossible de supprimer le client", color: "error" });
      }
    },

    async approveClient(item) {
      try {
        await $api(`/clients/${item.id}/approve`, { method: "PATCH" });
        item.status = "approved";
        this.showSnackbar({ message: "Client approuvé avec succès", color: "success" });
      } catch {
        this.showSnackbar({ message: "Impossible d'approuver le client", color: "error" });
      }
    },

    async refuseClient(item) {
      try {
        await $api(`/clients/${item.id}/refuse`, { method: "PATCH" });
        item.status = "refused";
        this.showSnackbar({ message: "Client refusé", color: "warning" });
      } catch {
        this.showSnackbar({ message: "Impossible de refuser le client", color: "error" });
      }
    },

    showSnackbar({ message, color }) {
      this.isSnackbarVisible = true;
      this.snackBarDetails.message = message;
      this.snackBarDetails.color = color;
    },

    formatDate(dateStr) {
      if (!dateStr) return "—";
      const d = new Date(dateStr);
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    },
  },
};
</script>

<style scoped>
/* ── Buttons ── */
.add-btn {
  background: #1a1a2e !important;
  color: #fff !important;
  min-width: 170px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
}
.refresh-btn {
  background: #1a1a2e !important;
  color: #fff !important;
  min-width: 130px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
}

/* ── Table ── */
.services-clients-table :deep(.v-data-table__th) { padding: 0 !important; }
.table-header-row { background: #fafafa; }
.table-th {
  padding: 10px 16px !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  color: #555 !important;
  white-space: nowrap;
  border-bottom: 1px solid #f0f0f0;
}

/* ── Status chip ── */
.status-chip { min-width: 90px; justify-content: center; }

/* ── Details modal ── */
.details-modal { border-radius: 16px; }
.info-row {
  display: flex;
  align-items: flex-start;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
  gap: 12px;
}
.info-row:last-child { border-bottom: none; }
.info-label {
  min-width: 180px;
  font-size: 13px;
  color: #9e9e9e;
  flex-shrink: 0;
}
.info-value { font-size: 13px; color: #1a1a2e; font-weight: 500; }

/* ── Action buttons ── */
.action-btn-delete {
  background: #FDECEA !important;
  color: #e53935 !important;
  font-weight: 600;
  font-size: 13px;
  border-radius: 8px;
  min-width: 120px;
}
.action-btn-edit {
  background: #E8A838 !important;
  color: #1a1a2e !important;
  font-weight: 700;
  font-size: 13px;
  border-radius: 8px;
  min-width: 130px;
}
</style>
