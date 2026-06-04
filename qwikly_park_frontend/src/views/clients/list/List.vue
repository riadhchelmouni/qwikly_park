<template>
  <div>
    <!-- ─── Filter Card ─── -->
    <VCard class="mb-4 filter-card">
      <VCardText class="pa-4">
        <div class="d-flex align-center gap-3 flex-wrap">
          <span class="filter-label">Filter</span>

          <VSelect
            v-model="filterVille"
            :items="villeOptions"
            placeholder="Ville"
            hide-details clearable density="compact"
            variant="outlined" class="filter-select"
          />
          <VSelect
            v-model="filterDecharge"
            :items="dechargeOptions"
            placeholder="Décharges"
            hide-details clearable density="compact"
            variant="outlined" class="filter-select"
          />
          <VSelect
            v-model="filterParc"
            :items="parcOptions"
            item-title="name" item-value="id"
            placeholder="Parc"
            hide-details clearable density="compact"
            variant="outlined" class="filter-select"
          />
          <VTextField
            v-model="filterDepensesMin"
            placeholder="Dépense min"
            hide-details density="compact" type="number"
            variant="outlined" class="filter-input"
          />
          <VTextField
            v-model="filterDepensesMax"
            placeholder="Dépense max"
            hide-details density="compact" type="number"
            variant="outlined" class="filter-input"
          />

          <VBtn class="apply-btn" elevation="0" @click="applyFilters">Appliquer</VBtn>
        </div>
      </VCardText>
    </VCard>

    <!-- ─── Table Card ─── -->
    <VCard>
      <VCardText class="pa-4">
        <!-- Top bar -->
        <div class="d-flex align-center gap-3 mb-4 flex-wrap">
          <span class="text-subtitle-2 font-weight-medium">Filters</span>
          <VSelect
            v-model="perPage"
            :items="[{value:5,title:'5'},{value:10,title:'10'},{value:25,title:'25'},{value:50,title:'50'}]"
            hide-details density="compact" variant="outlined"
            style="min-width:70px; max-width:80px"
          />
          <VSpacer />
          <VTextField
            v-model="searchQuery"
            placeholder="Rechercher par nom, téléphone ou email..."
            prepend-inner-icon="tabler-search"
            single-line hide-details clearable density="compact"
            variant="outlined"
            style="max-width:310px"
            @click:clear="searchQuery = ''"
          />
          <VBtn class="export-btn" elevation="0" variant="outlined" @click="exportCSV">
            <VIcon icon="tabler-upload" size="16" class="me-1" />
            Export
          </VBtn>
        </div>

        <!-- Table -->
        <VDataTableServer
          class="clients-table"
          :items-length="total"
          :headers="headers"
          :items="clients"
          :loading="isLoading"
          v-model="selectedClients"
          show-select
          hide-default-header
        >
          <!-- Custom header -->
          <template #headers="{ columns }">
            <tr class="table-header-row">
              <th v-for="col in columns" :key="col.key" class="table-th">
                <VCheckbox
                  v-if="col.key === 'data-table-select'"
                  v-model="allSelected"
                  hide-details density="compact"
                  @change="toggleAll"
                />
                <span v-else>{{ col.title }}</span>
              </th>
            </tr>
          </template>

          <template #no-data>
            <span class="text-medium-emphasis">Pas de données disponibles</span>
          </template>
          <template #loading>
            <span>Chargement des données...</span>
          </template>

          <!-- Nom complet -->
          <template #item.name="{ item }">
            <div class="d-flex align-center gap-2 py-1">
              <VAvatar size="34" :image="item.image || placeholder" />
              <span class="font-weight-medium">{{ item.user?.firstname }} {{ item.user?.lastname }}</span>
            </div>
          </template>

          <!-- Email + Tél -->
          <template #item.contact="{ item }">
            <div style="line-height:1.4">
              <div style="font-size:13px">{{ item.user?.email || '—' }}</div>
              <div style="font-size:12px; color:#9e9e9e">{{ item.user?.phone || '' }}</div>
            </div>
          </template>

          <!-- Ville -->
          <template #item.ville="{ item }">
            {{ item.ville || item.user?.ville || '—' }}
          </template>

          <!-- Nb. Enfants -->
          <template #item.children_count="{ item }">
            {{ item.children_count ?? item.children?.length ?? 0 }}
          </template>

          <!-- Parc(s) -->
          <template #item.parks="{ item }">
            <span v-if="item.parks && item.parks.length" style="font-size:13px">
              {{ item.parks.map(p => p.name || p.localisation || p.numero).join(', ') }}
            </span>
            <span v-else style="color:#bbb">—</span>
          </template>

          <!-- Décharge -->
          <template #item.decharge="{ item }">
            <VChip
              :color="item.has_decharge || item.decharge === 'signed' ? 'success' : 'error'"
              size="small" class="font-weight-medium"
            >
              {{ item.has_decharge || item.decharge === 'signed' ? 'Signé' : 'Non signée' }}
            </VChip>
          </template>

          <!-- Actions -->
          <template #item.actions="{ item }">
            <div class="d-flex align-center gap-1">
              <VBtn icon variant="text" size="small" density="compact" color="primary"
                @click="openDetailsDialog(item)">
                <VIcon icon="tabler-eye" size="18" />
                <VTooltip activator="parent" location="top">Détails</VTooltip>
              </VBtn>
              <VBtn icon variant="text" size="small" density="compact" color="warning"
                @click="openEditSidebar(item)">
                <VIcon icon="tabler-pencil" size="18" />
                <VTooltip activator="parent" location="top">Modifier</VTooltip>
              </VBtn>
            </div>
          </template>

          <!-- Pagination -->
          <template #bottom>
            <div class="d-flex align-center justify-space-between px-2 pt-3">
              <span style="font-size:12px; color:#9e9e9e">
                Showing {{ total === 0 ? 0 : (page - 1) * perPage + 1 }} to {{ Math.min(page * perPage, total) }} of {{ total }} entries
              </span>
              <VPagination
                v-model="page"
                :length="Math.ceil(total / perPage)"
                total-visible="5"
                size="small"
              />
            </div>
          </template>
        </VDataTableServer>
      </VCardText>
    </VCard>

    <!-- ═══════════════════════════════════════
         DETAILS MODAL
    ════════════════════════════════════════ -->
    <VDialog v-model="detailsDialog" max-width="560" scrollable>
      <VCard v-if="current" class="details-modal">
        <VCardText class="pa-6 pb-3">
          <!-- Back + Title -->
          <div class="d-flex align-center gap-2 mb-5">
            <VBtn icon variant="text" size="small" density="compact" @click="detailsDialog = false">
              <VIcon icon="tabler-arrow-left" size="20" />
            </VBtn>
            <span class="text-h6 font-weight-bold">Détails du client</span>
          </div>

          <!-- Tab toggle -->
          <div class="details-tab-bar mb-5">
            <button
              v-for="tab in detailTabs" :key="tab.key"
              class="details-tab-btn"
              :class="detailTab === tab.key ? 'details-tab-btn--active' : 'details-tab-btn--inactive'"
              @click="detailTab = tab.key"
            >{{ tab.label }}</button>
          </div>

          <!-- ── Tab 1: Informations Générales ── -->
          <div v-if="detailTab === 'info'">
            <div class="info-row">
              <span class="info-label">Nom du client</span>
              <span class="info-value">{{ current.user?.firstname }} {{ current.user?.lastname }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email</span>
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
            <div class="info-row">
              <span class="info-label">Dernière activité</span>
              <span class="info-value">{{ current.last_activity || '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Statut</span>
              <VChip
                :color="current.status === 'approved' ? 'success' : current.status === 'refused' ? 'error' : 'warning'"
                size="small" class="font-weight-medium"
              >
                {{ current.status === 'approved' ? 'Actif' : current.status === 'refused' ? 'Refusé' : 'En attente' }}
              </VChip>
            </div>
            <div class="info-row">
              <span class="info-label">Signature de décharges</span>
              <VChip
                :color="current.has_decharge || current.decharge === 'signed' ? 'success' : 'error'"
                size="small" class="font-weight-medium"
              >
                {{ current.has_decharge || current.decharge === 'signed' ? 'Signé' : 'Non signé' }}
              </VChip>
            </div>
            <div class="info-row" v-if="current.parks && current.parks.length">
              <span class="info-label">Parc(s) associé(s)</span>
              <div class="info-value">
                <div v-for="park in current.parks" :key="park.id" style="color:#4CAF50">
                  • {{ park.name || park.localisation || park.numero }}
                </div>
              </div>
            </div>
          </div>

          <!-- ── Tab 2: Enfants Associés ── -->
          <div v-else-if="detailTab === 'children'">
            <div v-if="current.children && current.children.length">
              <div
                v-for="(child, i) in current.children" :key="i"
                class="pb-4 mb-4"
                :style="i < current.children.length - 1 ? 'border-bottom:1px solid #f0f0f0' : ''"
              >
                <div class="text-subtitle-2 font-weight-bold mb-3">Enfant {{ i + 1 }}</div>
                <div class="info-row">
                  <span class="info-label">Nom Complet</span>
                  <span class="info-value">{{ child.firstname }} {{ child.lastname }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Date de naissance</span>
                  <span class="info-value">{{ formatDate(child.birthdate) }} ({{ calcAge(child.birthdate) }} ans)</span>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-medium-emphasis py-8">
              Aucun enfant associé
            </div>
          </div>

          <!-- ── Tab 3: Passes Et Billets ── -->
          <div v-else-if="detailTab === 'passes'">
            <!-- Stats cards -->
            <VRow class="mb-5" no-gutters style="gap:12px; flex-wrap:nowrap">
              <VCol>
                <VCard variant="outlined" class="stat-card text-center pa-3">
                  <VIcon icon="tabler-calendar" color="#E8A838" size="26" class="mb-1" />
                  <div class="text-h6 font-weight-bold">{{ current.reservations_count || 0 }}</div>
                  <div class="stat-label">Nombre de réservations</div>
                </VCard>
              </VCol>
              <VCol>
                <VCard variant="outlined" class="stat-card text-center pa-3">
                  <VIcon icon="tabler-ticket" color="#E8A838" size="26" class="mb-1" />
                  <div class="text-h6 font-weight-bold">{{ current.passes_count || 0 }}</div>
                  <div class="stat-label">Nb. de passes</div>
                </VCard>
              </VCol>
              <VCol>
                <VCard variant="outlined" class="stat-card text-center pa-3">
                  <VIcon icon="tabler-currency-euro" color="#E8A838" size="26" class="mb-1" />
                  <div class="text-h6 font-weight-bold">{{ current.total_spent || 0 }} €</div>
                  <div class="stat-label">Total dépense</div>
                </VCard>
              </VCol>
            </VRow>

            <!-- Pass + Billets -->
            <VRow>
              <VCol cols="6">
                <div class="text-subtitle-2 font-weight-bold mb-2">Pass(s) attribué(s)</div>
                <div v-if="current.passes && current.passes.length">
                  <div v-for="p in current.passes" :key="p.id" style="font-size:13px">• {{ p.name }}</div>
                </div>
                <div v-else style="color:#bbb; font-size:13px">Aucun</div>
              </VCol>
              <VCol cols="6">
                <div class="text-subtitle-2 font-weight-bold mb-2">Billet(s) attribué(s)</div>
                <div v-if="current.billets && current.billets.length">
                  <div v-for="(b, idx) in current.billets.slice(0, 3)" :key="idx" style="font-size:13px">
                    • {{ b.name || b }}
                  </div>
                  <a v-if="current.billets.length > 3" href="#" style="color:#E8A838; font-size:13px; text-decoration:none">
                    Voir plus
                  </a>
                </div>
                <div v-else style="color:#bbb; font-size:13px">Aucun</div>
              </VCol>
            </VRow>
          </div>
          <!-- ── Tab 4: Décharge PDF ── -->
          <div v-else-if="detailTab === 'decharge'">
            <div class="d-flex align-center gap-3 mb-4">
              <VIcon icon="tabler-file-certificate" size="28" style="color:#E8A838" />
              <div>
                <div style="font-weight:700;font-size:14px;color:#1a1a2e">Fichier de décharge</div>
                <div style="font-size:12px;color:#9e9e9e">Document de responsabilité signé par le client</div>
              </div>
            </div>

            <VCard elevation="0" style="background:#f9f9f9;border-radius:10px;border:1px solid #f0f0f0" class="pa-4 mb-4">
              <div class="d-flex align-center gap-3">
                <VIcon icon="tabler-shield-check"
                  :style="(current.has_decharge || current.decharge === 'signed') ? 'color:#4CAF50' : 'color:#e53935'"
                  size="22" />
                <div>
                  <div style="font-weight:600;font-size:13px">Statut de la décharge</div>
                  <VChip
                    :color="(current.has_decharge || current.decharge === 'signed') ? 'success' : 'error'"
                    size="small" class="mt-1"
                  >
                    {{ (current.has_decharge || current.decharge === 'signed') ? 'Décharge signée' : 'Non signée' }}
                  </VChip>
                </div>
              </div>
            </VCard>

            <div v-if="current.has_decharge || current.decharge === 'signed'">
              <div class="info-row">
                <span class="info-label">Date de signature</span>
                <span class="info-value">{{ formatDate(current.decharge_signed_at || current.updated_at) }}</span>
              </div>
              <div class="info-row" style="border:none">
                <span class="info-label">Parc concerné</span>
                <span class="info-value">{{ current.parks?.[0]?.name || current.parks?.[0]?.localisation || '—' }}</span>
              </div>
            </div>

            <div class="d-flex gap-2 mt-4">
              <VBtn style="background:#1a1a2e;color:#fff;border-radius:8px;font-size:13px;font-weight:700"
                elevation="0" @click="exportDechargePdf(current)">
                <VIcon icon="tabler-file-type-pdf" size="15" class="me-1" />Exporter décharge PDF
              </VBtn>
              <VBtn v-if="!(current.has_decharge || current.decharge === 'signed')"
                variant="outlined" style="border-radius:8px;font-size:13px;color:#4CAF50;border-color:#4CAF50"
                @click="markDechargeSignee(current)">
                <VIcon icon="tabler-check" size="15" class="me-1" />Marquer comme signée
              </VBtn>
            </div>
          </div>

          <!-- ── Tab 5: Points de Fidélité ── -->
          <div v-else-if="detailTab === 'fidelite'">
            <div class="d-flex align-center gap-3 mb-4">
              <div style="width:56px;height:56px;border-radius:50%;background:#E8A838;display:flex;align-items:center;justify-content:center">
                <VIcon icon="tabler-star" size="28" color="#fff" />
              </div>
              <div>
                <div style="font-size:28px;font-weight:800;color:#1a1a2e">{{ current.points_fidelite || 0 }}</div>
                <div style="font-size:13px;color:#9e9e9e">points de fidélité</div>
              </div>
            </div>

            <VCard elevation="0" style="background:#f9f9f9;border-radius:10px" class="pa-4 mb-4">
              <VRow dense>
                <VCol cols="6">
                  <div style="font-size:11px;color:#9e9e9e;font-weight:600">NIVEAU</div>
                  <div style="font-weight:700;font-size:14px;color:#1a1a2e">
                    {{ getFideliteNiveau(current.points_fidelite) }}
                  </div>
                </VCol>
                <VCol cols="6">
                  <div style="font-size:11px;color:#9e9e9e;font-weight:600">VALEUR ESTIMÉE</div>
                  <div style="font-weight:700;font-size:14px;color:#E8A838">
                    {{ ((current.points_fidelite || 0) * 0.01).toFixed(2) }} €
                  </div>
                </VCol>
              </VRow>
            </VCard>

            <!-- Historique points -->
            <div style="font-weight:700;font-size:13px;color:#1a1a2e;margin-bottom:8px">Historique des points</div>
            <div v-if="current.points_history?.length">
              <div v-for="(h, i) in current.points_history" :key="i"
                class="d-flex align-center justify-space-between py-2"
                style="border-bottom:1px solid #f5f5f5;font-size:13px">
                <div>
                  <div style="font-weight:600">{{ h.label || 'Achat' }}</div>
                  <div style="font-size:11px;color:#9e9e9e">{{ formatDate(h.created_at) }}</div>
                </div>
                <span :style="h.points > 0 ? 'color:#4CAF50;font-weight:700' : 'color:#e53935;font-weight:700'">
                  {{ h.points > 0 ? '+' : '' }}{{ h.points }} pts
                </span>
              </div>
            </div>
            <div v-else style="text-align:center;color:#bbb;font-size:13px;padding:20px 0">
              Aucun historique de points
            </div>

            <!-- Ajouter des points manuellement -->
            <div class="mt-4 pa-3" style="background:#f9f9f9;border-radius:10px">
              <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:8px">Ajustement manuel</div>
              <div class="d-flex align-center gap-2">
                <VTextField v-model="manualPoints" type="number" density="compact" variant="outlined"
                  placeholder="Ex: +50 ou -20" hide-details style="max-width:150px" />
                <VBtn style="background:#1a1a2e;color:#E8A838;border-radius:8px;font-size:13px" size="small"
                  elevation="0" @click="addManualPoints(current)">
                  Appliquer
                </VBtn>
              </div>
            </div>
          </div>

        </VCardText>

        <!-- Bottom action buttons -->
        <VCardText class="d-flex gap-2 px-6 pb-6 pt-2">
          <VBtn class="action-btn-delete" elevation="0" @click="openDeleteFromDetails" v-if="$can('clients-delete')">
            <VIcon icon="tabler-trash" size="16" class="me-1" />
            Supprimer
          </VBtn>
          <VBtn class="action-btn-block" elevation="0" @click="blockClient">
            <VIcon icon="tabler-ban" size="16" class="me-1" />
            Bloquer
          </VBtn>
          <VSpacer />
          <VBtn class="action-btn-edit" elevation="0" @click="openEditFromDetails">
            <VIcon icon="tabler-edit" size="16" class="me-1" />
            Modifier Le Client
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
         CREATE CLIENT CONFIRM DIALOG
    ════════════════════════════════════════ -->
    <VDialog v-model="createConfirmDialog" max-width="440">
      <VCard>
        <VCardTitle class="text-subtitle-1 font-weight-bold pa-5 pb-2">
          Créer un nouveau client
        </VCardTitle>
        <VCardText class="px-5 pb-2">
          <p class="mb-1">Êtes-vous sûr de vouloir créer ce nouveau client ?</p>
          <p style="font-size:13px; color:#9e9e9e">
            Les informations saisies seront enregistrées et le client deviendra disponible pour la gestion par les administrateurs.
          </p>
        </VCardText>
        <VCardText class="d-flex justify-end gap-3 px-5 pb-5 pt-1">
          <VBtn variant="text" @click="createConfirmDialog = false" style="color:#666">Retour</VBtn>
          <VBtn style="background:#1a1a2e; color:#fff; min-width:160px" elevation="0" @click="confirmCreate">
            Confirmer La Création
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Sidebars -->
    <AddSidebar v-model:isOpen="addSideBar" v-if="$can('clients-add')" />
    <EditSidebar v-model:isOpen="editSideBar" :current="current" v-if="$can('clients-update')" />

    <!-- Approve / Refuse dialogs (kept for actions menu) -->
    <VDialog v-model="approveDialog" class="v-dialog-sm" v-if="$can('clients-change-status')">
      <VCard title="Confirmer l'approbation du client">
        <VCardText>Voulez-vous vraiment approuver ce client ?</VCardText>
        <VCardText class="d-flex justify-end gap-3 flex-wrap">
          <VBtn color="secondary" variant="tonal" @click="approveDialog = false">Annuler</VBtn>
          <VBtn @click="confirmApprove">Confirmer</VBtn>
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
import debounce from "lodash/debounce";
import { VDataTableServer } from "vuetify/labs/VDataTable";

import AddSidebar from "./sidebars/Add.vue";
import EditSidebar from "./sidebars/Edit.vue";

import placeholder from "@images/placeholders/user.svg";

export default {
  setup() {
    return { placeholder };
  },

  components: { VDataTableServer, AddSidebar, EditSidebar },

  data() {
    return {
      headers: [
        { title: "", key: "data-table-select", sortable: false, width: "40px" },
        { title: "NOM COMPLET", key: "name", sortable: false },
        { title: "EMAIL & TÉL.", key: "contact", sortable: false },
        { title: "VILLE", key: "ville", sortable: false },
        { title: "ENFANTS", key: "children_count", sortable: false },
        { title: "PARC(S)", key: "parks", sortable: false },
        { title: "DÉCHARGE", key: "decharge", sortable: false },
        { title: "ACTIONS", key: "actions", sortable: false, width: "100px" },
      ],

      clients: [],
      selectedClients: [],
      allSelected: false,

      searchQuery: "",
      total: 0,
      page: 1,
      perPage: 10,
      isLoading: true,

      // Filters
      filterVille: null,
      filterParc: null,
      filterDecharge: null,
      filterType: null,
      filterDepensesMin: "",
      filterDepensesMax: "",

      villeOptions: [],
      parcOptions: [],
      dechargeOptions: [
        { title: "Décharge signée", value: "signed" },
        { title: "Non signée", value: "unsigned" },
      ],

      // Dialogs
      detailsDialog: false,
      deleteDialog: false,
      createConfirmDialog: false,
      approveDialog: false,
      addSideBar: false,
      editSideBar: false,

      current: null,
      currentDeleteId: null,

      // Detail tabs
      detailTab: "info",
      detailTabs: [
        { key: "info",     label: "Informations" },
        { key: "children", label: "Enfants" },
        { key: "passes",   label: "Passes & Billets" },
        { key: "decharge", label: "Décharge" },
        { key: "fidelite", label: "Fidélité" },
      ],

      isSnackbarVisible: false,
      snackBarDetails: { message: "", color: "" },

      // Points fidélité
      manualPoints: "",
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
    await this.loadParcs();
    this.busOn("add-item", this.addItem);
    this.busOn("update-item", this.editItem);
  },

  methods: {
    // ─── API ───
    async getClients() {
      this.isLoading = true;
      const params = {
        page: this.page,
        per_page: this.perPage,
      };
      if (this.searchQuery.length >= 3) params.keyword = this.searchQuery;
      if (this.filterVille) params.ville = this.filterVille;
      if (this.filterParc) params.park_id = this.filterParc;
      if (this.filterDecharge) params.decharge = this.filterDecharge;
      if (this.filterType) params.type = this.filterType;
      if (this.filterDepensesMin !== "") params.depenses_min = this.filterDepensesMin;
      if (this.filterDepensesMax !== "") params.depenses_max = this.filterDepensesMax;

      try {
        const res = await $api("/clients", { params });
        this.clients = res.data       || res.clients || [];
        this.total   = res.total      ?? res.meta?.total ?? res.count ?? this.clients.length;
      } catch {
        this.showSnackbar({ message: "Impossible de récupérer les données", color: "error" });
      } finally {
        this.isLoading = false;
      }
    },

    async loadParcs() {
      try {
        const res = await $api("/parks", { params: { per_page: 200 } });
        const parks = res.data || [];
        this.parcOptions = parks.map((p) => ({
          id: p.id,
          name: p.localisation || p.numero || `Parc ${p.id}`,
        }));
        const villes = [...new Set(parks.map((p) => p.region).filter(Boolean))];
        this.villeOptions = villes.map((v) => ({ title: v, value: v }));
      } catch { /* silent */ }
    },

    // ─── Delete ───
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
        this.clients = this.clients.filter((c) => c.id !== this.currentDeleteId);
        this.total = Math.max(0, this.total - 1);
        const name = this.current ? `${this.current.user?.firstname} ${this.current.user?.lastname}` : "Le client";
        this.showSnackbar({ message: `Le client « ${name} » a été supprimé avec succès.`, color: "warning" });
        this.current = null;
        this.currentDeleteId = null;
      } catch {
        this.showSnackbar({ message: "Impossible de supprimer le client", color: "error" });
      }
    },

    // ─── Block ───
    async blockClient() {
      if (!this.current) return;
      try {
        await $api(`/clients/${this.current.id}/change-status`, { method: "PATCH" });
        this.showSnackbar({ message: "Statut du client modifié", color: "warning" });
        this.detailsDialog = false;
        this.getClients();
      } catch {
        this.showSnackbar({ message: "Impossible de bloquer le client", color: "error" });
      }
    },

    // ─── Approve / Refuse ───
    openApproveDialog(id) {
      this.currentDeleteId = id;
      this.approveDialog = true;
    },

    async confirmApprove() {
      this.approveDialog = false;
      this.isLoading = true;
      try {
        const res = await $api(`/clients/${this.currentDeleteId}/change-status`, { method: "PATCH" });
        const index = this.clients.findIndex((c) => c.id === this.currentDeleteId);
        if (index !== -1) this.clients[index] = res.client;
        this.showSnackbar({ message: "Client approuvé avec succès", color: "success" });
      } catch {
        this.showSnackbar({ message: "Impossible d'approuver le client", color: "error" });
      } finally {
        this.isLoading = false;
        this.currentDeleteId = null;
      }
    },

    // ─── Details ───
    openDetailsDialog(item) {
      this.current = item;
      this.detailTab = "info";
      this.detailsDialog = true;
    },

    // ─── Edit ───
    openEditSidebar(item) {
      this.current = item;
      this.editSideBar = true;
    },

    openEditFromDetails() {
      this.detailsDialog = false;
      this.editSideBar = true;
    },

    // ─── Create ───
    confirmCreate() {
      this.createConfirmDialog = false;
      this.addSideBar = true;
    },

    // ─── Filters ───
    applyFilters() {
      this.page = 1;
      this.getClients();
    },

    resetFilters() {
      this.filterVille = null;
      this.filterParc = null;
      this.filterDecharge = null;
      this.filterType = null;
      this.filterDepensesMin = "";
      this.filterDepensesMax = "";
      this.searchQuery = "";
      this.page = 1;
      this.getClients();
    },

    // ─── Select all ───
    toggleAll() {
      this.selectedClients = this.allSelected ? [...this.clients] : [];
    },

    // ─── Export CSV ───
    async exportCSV() {
      try {
        const params = { per_page: 9999 };
        if (this.filterVille) params.ville = this.filterVille;
        if (this.filterParc) params.park_id = this.filterParc;
        if (this.filterDecharge) params.decharge = this.filterDecharge;
        if (this.filterType) params.type = this.filterType;
        if (this.filterDepensesMin !== "") params.depenses_min = this.filterDepensesMin;
        if (this.filterDepensesMax !== "") params.depenses_max = this.filterDepensesMax;

        const res = await $api("/clients", { params });
        const data = res.data || [];
        const rows = [
          ["Nom", "Prénom", "Email", "Téléphone", "Ville", "Type", "Décharge", "Statut"],
          ...data.map((c) => [
            c.user?.lastname || "",
            c.user?.firstname || "",
            c.user?.email || "",
            c.user?.phone || "",
            c.ville || c.user?.ville || "",
            c.type || "",
            c.has_decharge ? "Signé" : "Non signée",
            c.status === "approved" ? "Actif" : c.status === "refused" ? "Refusé" : "En attente",
          ]),
        ];
        const csv = rows
          .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
          .join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "clients.csv";
        link.click();
        URL.revokeObjectURL(url);
      } catch {
        this.showSnackbar({ message: "Erreur lors de l'export", color: "error" });
      }
    },

    // ─── Helpers ───
    addItem(client) {
      if (!client) return;
      this.clients.unshift(client);
      this.total += 1;
    },
    editItem(client) {
      if (!client) return;
      const idx = this.clients.findIndex((c) => c.id === client.id);
      if (idx !== -1) {
        this.clients.splice(idx, 1, { ...client });
        if (this.current?.id === client.id) {
          this.current = { ...client };
        }
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

    calcAge(birthdate) {
      if (!birthdate) return "?";
      const diff = Date.now() - new Date(birthdate).getTime();
      return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
    },

    // ── Décharge PDF ──────────────────────────────────
    exportDechargePdf(client) {
      const nom = `${client.user?.firstname || ''} ${client.user?.lastname || ''}`.trim();
      const parcs = (client.parks || []).map(p => p.name || p.localisation || '').join(', ') || '—';
      const date = this.formatDate(client.decharge_signed_at || client.updated_at);
      const w = window.open("", "_blank", "width=794,height=1123");
      w.document.write(`
        <html><head><title>Décharge — ${nom}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 60px; color: #1a1a2e; line-height:1.7; }
          h1 { font-size: 22px; font-weight: 800; text-align: center; margin-bottom: 4px; }
          .sub { text-align:center; color:#777; font-size:13px; margin-bottom:40px; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: 700; font-size: 14px; border-bottom: 2px solid #E8A838; padding-bottom: 4px; margin-bottom: 12px; }
          .row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; border-bottom: 1px solid #f5f5f5; }
          .lbl { color: #777; }
          .clause { font-size: 13px; color: #333; margin-bottom: 10px; padding-left: 12px; border-left: 3px solid #E8A838; }
          .signature-zone { margin-top: 50px; display: flex; justify-content: space-between; }
          .sig-box { text-align: center; }
          .sig-line { width: 200px; border-bottom: 2px solid #1a1a2e; margin: 40px auto 6px; }
          .sig-label { font-size: 12px; color: #777; }
          .chip { display:inline-block; background:#4CAF50; color:#fff; border-radius:20px; padding:4px 14px; font-size:12px; font-weight:700; }
        </style></head><body>
        <h1>DÉCHARGE DE RESPONSABILITÉ</h1>
        <div class="sub">Royal Kids / Qwikly — Document officiel</div>

        <div class="section">
          <div class="section-title">Informations du signataire</div>
          <div class="row"><span class="lbl">Nom complet</span><span>${nom}</span></div>
          <div class="row"><span class="lbl">Email</span><span>${client.user?.email || '—'}</span></div>
          <div class="row"><span class="lbl">Téléphone</span><span>${client.user?.phone || '—'}</span></div>
          <div class="row"><span class="lbl">Parc(s) concerné(s)</span><span>${parcs}</span></div>
          <div class="row"><span class="lbl">Date de signature</span><span>${date}</span></div>
          <div class="row"><span class="lbl">Statut</span><span class="chip">Décharge signée ✓</span></div>
        </div>

        <div class="section">
          <div class="section-title">Clauses et conditions</div>
          <div class="clause">Je soussigné(e) <strong>${nom}</strong>, déclare avoir pris connaissance du règlement intérieur du parc et m'engage à le respecter.</div>
          <div class="clause">Je reconnais que l'établissement ne saurait être tenu responsable des accidents survenus en raison du non-respect des consignes de sécurité.</div>
          <div class="clause">J'autorise le personnel du parc à prendre toute mesure d'urgence nécessaire en cas d'accident de mon enfant.</div>
          <div class="clause">Je certifie que mon enfant est apte à pratiquer les activités du parc et qu'il ne présente aucune contre-indication médicale.</div>
        </div>

        <div class="signature-zone">
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-label">Signature du responsable légal</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-label">Cachet & Signature du parc</div>
          </div>
        </div>
        <script>window.print()<\/script>
        </body></html>`);
      w.document.close();
    },

    async markDechargeSignee(client) {
      try {
        await $api(`/clients/${client.id}/change-status`, { method: "PATCH" });
        client.has_decharge = true;
        client.decharge = 'signed';
        this.showSnackbar({ message: "Décharge marquée comme signée", color: "success" });
      } catch {
        this.showSnackbar({ message: "Erreur lors de la mise à jour", color: "error" });
      }
    },

    // ── Fidélité ──────────────────────────────────────
    getFideliteNiveau(points) {
      if (!points || points < 100) return '🥉 Bronze';
      if (points < 500)  return '🥈 Argent';
      if (points < 1000) return '🥇 Or';
      return '💎 Diamant';
    },

    async addManualPoints(client) {
      const pts = parseInt(this.manualPoints);
      if (!pts || isNaN(pts)) return;
      try {
        await $api(`/clients/${client.id}/points`, { method: "POST", body: { points: pts } });
        client.points_fidelite = (client.points_fidelite || 0) + pts;
        if (!client.points_history) client.points_history = [];
        client.points_history.unshift({ points: pts, label: 'Ajustement manuel', created_at: new Date().toISOString() });
        this.manualPoints = "";
        this.showSnackbar({ message: `${pts > 0 ? '+' : ''}${pts} points appliqués`, color: "success" });
      } catch {
        this.showSnackbar({ message: "Erreur lors de l'ajout des points", color: "error" });
      }
    },
  },
};
</script>

<style scoped>
/* ── Filter card ── */
.filter-card { border-radius: 12px; }
.filter-label { font-size: 14px; font-weight: 600; color: #1a1a2e; min-width: 38px; }
.filter-select { min-width: 120px; max-width: 145px; }
.filter-input  { min-width: 115px; max-width: 140px; }
.apply-btn {
  background: #1a1a2e !important;
  color: #E8A838 !important;
  min-width: 110px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
}

/* ── Export button ── */
.export-btn {
  border-color: #1a1a2e !important;
  color: #1a1a2e !important;
  font-weight: 600;
  font-size: 13px;
  min-width: 100px;
}

/* ── Table ── */
.clients-table :deep(.v-data-table__th) { padding: 0 !important; }
.table-header-row { background: #fafafa; }
.table-th {
  padding: 11px 14px !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  color: #9e9e9e !important;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  border-bottom: 1.5px solid #f0f0f0;
  background: #fafafa;
}

/* ── Details modal ── */
.details-modal { border-radius: 16px; }

.details-tab-bar {
  display: flex;
  border-radius: 10px;
  overflow: hidden;
  border: 1.5px solid #E8A838;
}
.details-tab-btn {
  flex: 1;
  padding: 11px 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 12.5px;
  transition: background 0.2s;
  white-space: nowrap;
}
.details-tab-btn--active   { background: #1a1a2e; color: #fff; }
.details-tab-btn--inactive { background: #F5C07A; color: #1a1a2e; }

/* ── Info rows ── */
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

/* ── Stat cards ── */
.stat-card { border-radius: 10px; border-color: #e8e8e8 !important; }
.stat-label { font-size: 11px; color: #9e9e9e; margin-top: 2px; }

/* ── Detail action buttons ── */
.action-btn-delete {
  background: #FDECEA !important;
  color: #e53935 !important;
  font-weight: 600;
  font-size: 13px;
  border-radius: 8px;
  min-width: 120px;
}
.action-btn-block {
  background: #FFF3E0 !important;
  color: #e65100 !important;
  font-weight: 600;
  font-size: 13px;
  border-radius: 8px;
  min-width: 110px;
}
.action-btn-edit {
  background: #E8A838 !important;
  color: #1a1a2e !important;
  font-weight: 700;
  font-size: 13px;
  border-radius: 8px;
  min-width: 160px;
}
</style>
