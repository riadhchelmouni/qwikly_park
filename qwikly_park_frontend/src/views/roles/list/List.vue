<template>
  <div>

    <!-- ══ PAGE HEADER ══ -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="rl-title">Gestion des rôles</h1>
        <p class="rl-sub">Définissez les rôles et contrôlez les accès à chaque module</p>
      </div>
      <div class="d-flex gap-2">
        <VBtn variant="outlined" class="rl-btn-outline" @click="getRoles">
          <VIcon icon="tabler-refresh" size="16" class="me-1"/>Actualiser
        </VBtn>
        <VBtn v-if="$can('roles-add')" class="rl-btn-primary" elevation="0" @click="addSideBar = true">
          <VIcon icon="tabler-plus" size="16" class="me-1"/>Nouveau rôle
        </VBtn>
      </div>
    </div>

    <!-- ══ STATS BAR ══ -->
    <VRow dense class="mb-6">
      <VCol cols="12" sm="4">
        <div class="rl-stat-card">
          <div class="rl-stat-icon" style="background:#eef0ff">
            <VIcon icon="tabler-shield" size="20" color="#5c6bc0"/>
          </div>
          <div>
            <div class="rl-stat-value">{{ roles.length }}</div>
            <div class="rl-stat-label">Rôles personnalisés</div>
          </div>
        </div>
      </VCol>
      <VCol cols="12" sm="4">
        <div class="rl-stat-card">
          <div class="rl-stat-icon" style="background:#e8f5e9">
            <VIcon icon="tabler-users" size="20" color="#43a047"/>
          </div>
          <div>
            <div class="rl-stat-value">{{ totalUsers }}</div>
            <div class="rl-stat-label">Utilisateurs assignés</div>
          </div>
        </div>
      </VCol>
      <VCol cols="12" sm="4">
        <div class="rl-stat-card">
          <div class="rl-stat-icon" style="background:#fff8e7">
            <VIcon icon="tabler-lock-open" size="20" color="#E8A838"/>
          </div>
          <div>
            <div class="rl-stat-value">3</div>
            <div class="rl-stat-label">Rôles système</div>
          </div>
        </div>
      </VCol>
    </VRow>

    <!-- ══ HIÉRARCHIE SYSTÈME ══ -->
    <div class="rl-section-header mb-3">
      <VIcon icon="tabler-sitemap" size="15" class="me-2" color="#E8A838"/>
      <span>Hiérarchie système</span>
      <div class="rl-section-line"/>
    </div>

    <VRow dense class="mb-6">

      <!-- Super Admin -->
      <VCol cols="12" md="4">
        <div class="rl-hierarchy-card rl-hierarchy-card--super">
          <div class="rl-hierarchy-badge">Niveau 1</div>
          <div class="d-flex align-center gap-3 mb-3">
            <div class="rl-hierarchy-icon rl-hierarchy-icon--super">
              <VIcon icon="tabler-crown" size="22" color="#fff"/>
            </div>
            <div>
              <div class="rl-hierarchy-name">Super Admin</div>
              <div class="rl-hierarchy-desc">Accès global complet</div>
            </div>
          </div>
          <div class="rl-hierarchy-perms">
            <div class="rl-perm-item rl-perm-item--ok">Toutes les franchises</div>
            <div class="rl-perm-item rl-perm-item--ok">Tous les parcs</div>
            <div class="rl-perm-item rl-perm-item--ok">Gestion des rôles globale</div>
            <div class="rl-perm-item rl-perm-item--ok">Paramétrage système</div>
            <div class="rl-perm-item rl-perm-item--ok">Statistiques globales</div>
          </div>
        </div>
      </VCol>

      <!-- Owner Franchise -->
      <VCol cols="12" md="4">
        <div class="rl-hierarchy-card rl-hierarchy-card--owner">
          <div class="rl-hierarchy-badge rl-hierarchy-badge--owner">Niveau 2</div>
          <div class="d-flex align-center gap-3 mb-3">
            <div class="rl-hierarchy-icon rl-hierarchy-icon--owner">
              <VIcon icon="tabler-building-store" size="22" color="#fff"/>
            </div>
            <div>
              <div class="rl-hierarchy-name">Owner (Franchise)</div>
              <div class="rl-hierarchy-desc">Sa franchise uniquement</div>
            </div>
          </div>
          <div class="rl-hierarchy-perms">
            <div class="rl-perm-item rl-perm-item--ok">Parcs de sa franchise</div>
            <div class="rl-perm-item rl-perm-item--ok">Clients & Employés</div>
            <div class="rl-perm-item rl-perm-item--ok">Stock, Events, News</div>
            <div class="rl-perm-item rl-perm-item--ok">Fournisseurs & Fidélité</div>
            <div class="rl-perm-item rl-perm-item--no">Autres franchises</div>
          </div>
        </div>
      </VCol>

      <!-- Admin Parc -->
      <VCol cols="12" md="4">
        <div class="rl-hierarchy-card rl-hierarchy-card--parc">
          <div class="rl-hierarchy-badge rl-hierarchy-badge--parc">Niveau 3</div>
          <div class="d-flex align-center gap-3 mb-3">
            <div class="rl-hierarchy-icon rl-hierarchy-icon--parc">
              <VIcon icon="tabler-building-community" size="22" color="#fff"/>
            </div>
            <div>
              <div class="rl-hierarchy-name">Admin Parc</div>
              <div class="rl-hierarchy-desc">Son parc uniquement</div>
            </div>
          </div>
          <div class="rl-hierarchy-perms">
            <div class="rl-perm-item rl-perm-item--ok">Opérations du parc</div>
            <div class="rl-perm-item rl-perm-item--ok">Employés & Clients du parc</div>
            <div class="rl-perm-item rl-perm-item--ok">Stock & Events</div>
            <div class="rl-perm-item rl-perm-item--no">Autres parcs / franchises</div>
            <div class="rl-perm-item rl-perm-item--no">Paramétrage global</div>
          </div>
        </div>
      </VCol>

    </VRow>

    <!-- Matrice Admin Parc détaillée -->
    <VCard elevation="0" border class="rl-matrix-card mb-6">
      <div class="rl-matrix-header" @click="showAdminParcMatrix = !showAdminParcMatrix" style="cursor:pointer">
        <div class="d-flex align-center gap-3">
          <div class="rl-matrix-icon">
            <VIcon icon="tabler-table" size="18" color="#E8A838"/>
          </div>
          <div>
            <div style="font-size:14px;font-weight:700;color:#fff">Matrice des permissions — Admin Parc</div>
            <div style="font-size:12px;color:rgba(255,255,255,.55);margin-top:2px">Détail complet des accès accordés et refusés</div>
          </div>
        </div>
        <VBtn icon variant="text" size="small" style="color:rgba(255,255,255,.7)">
          <VIcon :icon="showAdminParcMatrix ? 'tabler-chevron-up' : 'tabler-chevron-down'" size="20"/>
        </VBtn>
      </div>

      <VExpandTransition>
        <div v-if="showAdminParcMatrix">
          <VCardText class="pa-5">
            <VRow dense>
              <VCol v-for="group in adminParcPermissionsMatrix" :key="group.groupe" cols="12" sm="6" lg="4">
                <div class="rl-perm-group">
                  <div class="rl-perm-group-header">
                    <div class="rl-perm-group-icon">
                      <VIcon :icon="group.icon" size="15" color="#E8A838"/>
                    </div>
                    <span class="rl-perm-group-name">{{ group.groupe }}</span>
                    <VChip size="x-small" color="#E8A838" variant="tonal" class="ms-auto" style="font-size:10px">
                      {{ group.permissions.filter(p => p.granted).length }}/{{ group.permissions.length }}
                    </VChip>
                  </div>
                  <div v-for="perm in group.permissions" :key="perm.label" class="rl-perm-row">
                    <VIcon
                      :icon="perm.granted ? 'tabler-circle-check-filled' : 'tabler-circle-x-filled'"
                      size="14"
                      :style="perm.granted ? 'color:#4CAF50;flex-shrink:0' : 'color:#e0e0e0;flex-shrink:0'"
                    />
                    <span class="rl-perm-label" :style="perm.granted ? 'color:#333' : 'color:#ccc;text-decoration:line-through'">
                      {{ perm.label }}
                    </span>
                  </div>
                </div>
              </VCol>
            </VRow>
            <div class="d-flex align-center gap-4 mt-4 pt-3" style="border-top:1px solid #f0f0f0">
              <div class="d-flex align-center gap-1" style="font-size:12px;color:#555">
                <VIcon icon="tabler-circle-check-filled" size="13" color="#4CAF50"/>Permission accordée
              </div>
              <div class="d-flex align-center gap-1" style="font-size:12px;color:#555">
                <VIcon icon="tabler-circle-x-filled" size="13" color="#e0e0e0"/>Accès refusé
              </div>
            </div>
          </VCardText>
        </div>
      </VExpandTransition>
    </VCard>

    <!-- ══ RÔLES PERSONNALISÉS ══ -->
    <div class="rl-section-header mb-4">
      <VIcon icon="tabler-shield-cog" size="15" class="me-2" color="#E8A838"/>
      <span>Rôles personnalisés</span>
      <div class="rl-section-line"/>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="d-flex justify-center align-center py-10">
      <VProgressCircular indeterminate color="#E8A838" size="38"/>
    </div>

    <!-- Empty state -->
    <div v-else-if="roles.length === 0" class="rl-empty">
      <VIcon icon="tabler-shield-off" size="48" color="#e0e0e0" class="mb-3"/>
      <div style="font-size:15px;font-weight:600;color:#9e9e9e">Aucun rôle créé</div>
      <div style="font-size:13px;color:#bbb;margin-top:4px">Créez votre premier rôle en cliquant sur « Nouveau rôle »</div>
    </div>

    <VRow v-else>
      <VCol v-for="(role, index) in roles" :key="role.id" cols="12" sm="6" lg="4">
        <VCard elevation="0" border class="rl-role-card">

          <!-- Card top accent -->
          <div class="rl-role-accent"/>

          <VCardText class="pa-4">
            <!-- Header -->
            <div class="d-flex align-center gap-3 mb-3">
              <div class="rl-role-avatar">
                <VIcon icon="tabler-shield-check" size="19" color="#1a1a2e"/>
              </div>
              <div class="flex-grow-1 min-width-0">
                <div class="rl-role-name text-capitalize">{{ role.name }}</div>
                <div class="rl-role-meta">
                  <VIcon icon="tabler-users" size="11" class="me-1"/>
                  {{ role.users_count || 0 }} {{ (role.users_count || 0) > 1 ? 'utilisateurs' : 'utilisateur' }}
                </div>
              </div>
              <div class="d-flex flex-column align-end gap-1">
                <VChip
                  :color="role.status === 'actif' || role.status === true ? 'success' : 'default'"
                  size="x-small" variant="tonal"
                  style="font-size:10px;font-weight:700"
                >
                  {{ role.status === 'actif' || role.status === true ? 'Actif' : 'Inactif' }}
                </VChip>
                <VChip
                  v-if="role.permissions_count > 0"
                  color="#E8A838" size="x-small" variant="tonal"
                  style="font-size:10px"
                >
                  {{ role.permissions?.length || role.permissions_count || '—' }} permissions
                </VChip>
              </div>
            </div>

            <!-- Permissions preview -->
            <div v-if="role.permissions && role.permissions.length > 0" class="rl-perm-preview">
              <span v-for="p in role.permissions.slice(0, 3)" :key="p.id" class="rl-perm-tag">
                {{ p.type }}
              </span>
              <span v-if="role.permissions.length > 3" class="rl-perm-tag rl-perm-tag--more">
                +{{ role.permissions.length - 3 }}
              </span>
            </div>
            <div v-else class="rl-perm-preview">
              <span class="rl-perm-tag rl-perm-tag--none">Aucune permission</span>
            </div>
          </VCardText>

          <VDivider/>

          <!-- Actions -->
          <VCardText class="pa-3">
            <div class="d-flex align-center justify-end gap-1">
              <VBtn icon variant="text" size="small" color="primary" @click="openDetailsSidebar(role)">
                <VIcon size="17" icon="tabler-eye"/>
                <VTooltip activator="parent" location="top">Voir les détails</VTooltip>
              </VBtn>
              <VBtn
                v-if="role.id != 1 && $can('roles-update')"
                icon variant="text" size="small" color="success"
                @click="openEditSidebar(role, index)"
              >
                <VIcon size="17" icon="tabler-edit"/>
                <VTooltip activator="parent" location="top">Modifier</VTooltip>
              </VBtn>
              <VBtn
                v-if="role.id != 1 && $can('roles-update')"
                icon variant="text" size="small"
                :color="(role.status === 'actif' || role.status === true) ? 'warning' : 'success'"
                @click="openChangeStatusDialog(role.id)"
              >
                <VIcon size="17" icon="tabler-power"/>
                <VTooltip activator="parent" location="top">
                  {{ (role.status === 'actif' || role.status === true) ? 'Désactiver' : 'Activer' }}
                </VTooltip>
              </VBtn>
              <VBtn
                v-if="role.id != 1 && $can('roles-delete')"
                icon variant="text" size="small" color="error"
                :disabled="checkCount(role)"
                @click="openDeleteDialog(role.id)"
              >
                <VIcon size="17" icon="tabler-trash"/>
                <VTooltip activator="parent" location="top">Supprimer</VTooltip>
              </VBtn>
            </div>
          </VCardText>

        </VCard>
      </VCol>
    </VRow>

    <!-- ══ SIDEBARS ══ -->
    <AddSidebar
      v-model:isOpen="addSideBar"
      :permissions="permissions"
      v-if="$can('roles-add')"
      @permissions-loaded="permissions = $event"
    />
    <EditSidebar
      v-model:isOpen="editSideBar"
      :permissions="permissions"
      :current="current"
      v-if="$can('roles-update')"
      @permissions-loaded="permissions = $event"
    />
    <DetailsSidebar v-model:isOpen="detailsSideBar" :current="current" />

    <!-- ══ DIALOG: Changer statut ══ -->
    <VDialog v-model="changeStatusDialog" max-width="420" v-if="$can('roles-update')">
      <VCard style="border-radius:16px;overflow:hidden">
        <div style="background:#1a1a2e;padding:20px 24px;display:flex;align-items:center;gap:12px">
          <div style="width:40px;height:40px;border-radius:10px;background:rgba(232,168,56,.2);display:flex;align-items:center;justify-content:center">
            <VIcon icon="tabler-power" size="20" color="#E8A838"/>
          </div>
          <div style="color:#fff;font-size:15px;font-weight:700">Changer le statut</div>
        </div>
        <VCardText style="padding:24px;font-size:14px;color:#555">
          Voulez-vous vraiment changer l'état de ce rôle ?
        </VCardText>
        <VCardText class="d-flex justify-end gap-3 pt-0">
          <VBtn variant="tonal" color="secondary" style="border-radius:8px" @click="changeStatusDialog = false">Annuler</VBtn>
          <VBtn style="background:#1a1a2e;color:#fff;border-radius:8px" elevation="0" @click="confirmChangeStatus">Confirmer</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- ══ DIALOG: Supprimer ══ -->
    <VDialog v-model="deleteDialog" max-width="420" v-if="$can('roles-delete')">
      <VCard style="border-radius:16px;overflow:hidden">
        <div style="background:#e53935;padding:20px 24px;display:flex;align-items:center;gap:12px">
          <div style="width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center">
            <VIcon icon="tabler-trash" size="20" color="#fff"/>
          </div>
          <div style="color:#fff;font-size:15px;font-weight:700">Supprimer le rôle</div>
        </div>
        <VCardText style="padding:24px;font-size:14px;color:#555">
          Cette action est <strong>irréversible</strong>. Le rôle sera définitivement supprimé.
        </VCardText>
        <VCardText class="d-flex justify-end gap-3 pt-0">
          <VBtn variant="tonal" color="secondary" style="border-radius:8px" @click="deleteDialog = false">Annuler</VBtn>
          <VBtn color="error" style="border-radius:8px" elevation="0" @click="confirmDelete">Supprimer</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <VSnackbar v-model="isSnackbarVisible" location="bottom end" variant="flat" :color="snackBarDetails.color">
      {{ snackBarDetails.message }}
    </VSnackbar>
  </div>
</template>

<script>
import { $api } from "@/utils/api";
import AddSidebar from "./sidebars/Add.vue";
import EditSidebar from "./sidebars/Edit.vue";
import DetailsSidebar from "./sidebars/Details.vue";

export default {
  components: { AddSidebar, EditSidebar, DetailsSidebar },

  data() {
    return {
      roles: [],
      permissions: [],
      isLoading: true,
      deleteDialog: false,
      changeStatusDialog: false,
      current: null,
      currentIndex: null,
      addSideBar: false,
      editSideBar: false,
      detailsSideBar: false,
      isSnackbarVisible: false,
      snackBarDetails: { message: "", color: "" },

      showAdminParcMatrix: false,
      adminParcPermissionsMatrix: [
        {
          groupe: "Employés", icon: "tabler-id-badge",
          permissions: [
            { label: "Voir la liste des employés",    granted: true  },
            { label: "Ajouter un employé",             granted: true  },
            { label: "Modifier un employé",            granted: true  },
            { label: "Désactiver / activer",           granted: true  },
            { label: "Supprimer un employé",           granted: false },
          ],
        },
        {
          groupe: "Caisse & Sessions", icon: "tabler-cash-register",
          permissions: [
            { label: "Ouvrir / fermer une session",   granted: true  },
            { label: "Consulter les sessions",         granted: true  },
            { label: "Voir l'historique caisse",       granted: true  },
            { label: "Gérer les rôles caisse",         granted: true  },
            { label: "Supprimer une session",          granted: false },
          ],
        },
        {
          groupe: "Stock & Produits", icon: "tabler-package",
          permissions: [
            { label: "Consulter le stock",             granted: true  },
            { label: "Ajouter / ajuster quantités",    granted: true  },
            { label: "Créer / modifier un produit",    granted: true  },
            { label: "Gérer les fournisseurs",         granted: true  },
            { label: "Passer des commandes fournisseur", granted: true },
          ],
        },
        {
          groupe: "Clients", icon: "tabler-user-check",
          permissions: [
            { label: "Voir la liste des clients",      granted: true  },
            { label: "Voir les détails client",        granted: true  },
            { label: "Modifier un client",             granted: true  },
            { label: "Gérer les points fidélité",      granted: true  },
            { label: "Supprimer un client",            granted: true  },
          ],
        },
        {
          groupe: "Événements & Réservations", icon: "tabler-calendar-event",
          permissions: [
            { label: "Voir les réservations",          granted: true  },
            { label: "Modifier une réservation",       granted: true  },
            { label: "Gérer les événements du parc",   granted: true  },
            { label: "Créer des événements",           granted: true  },
            { label: "Supprimer des événements",       granted: true  },
          ],
        },
        {
          groupe: "Fidélité & Codes promo", icon: "tabler-star",
          permissions: [
            { label: "Voir les offres fidélité",       granted: true  },
            { label: "Gérer les codes promo",          granted: true  },
            { label: "Gérer les actualités",           granted: true  },
            { label: "Créer programmes fidélité",      granted: true  },
            { label: "KDO Time",                       granted: true  },
          ],
        },
        {
          groupe: "Administration parc", icon: "tabler-building-community",
          permissions: [
            { label: "Voir statistiques du parc",      granted: true  },
            { label: "Modifier infos du parc",         granted: true  },
            { label: "Gérer les caisses du parc",      granted: true  },
            { label: "Créer / supprimer des parcs",    granted: false },
            { label: "Gérer les franchises",           granted: false },
          ],
        },
        {
          groupe: "Accès refusés", icon: "tabler-lock",
          permissions: [
            { label: "Paramétrage système global",     granted: false },
            { label: "Gestion multi-franchise",        granted: false },
            { label: "Accès super-admin",              granted: false },
            { label: "Historique global activités",    granted: false },
            { label: "Archivage global",               granted: false },
          ],
        },
      ],
    };
  },

  computed: {
    totalUsers() {
      return this.roles.reduce((sum, r) => sum + (r.users_count || 0), 0);
    },
  },

  async mounted() {
    await this.getRoles();
    this.getPermissions();
    this.busOn("add-item", this.addItem);
    this.busOn("update-item", this.editItem);
  },

  methods: {
    async getRoles() {
      this.isLoading = true;
      try {
        const res = await $api("/roles");
        this.roles = res.data;
      } catch {
        this.showSnackbar({ message: "Impossible de récupérer les données", color: "error" });
      } finally {
        this.isLoading = false;
      }
    },

    async getPermissions() {
      try {
        const res = await $api("/roles/permissions");
        this.permissions = res.data;
      } catch {
        this.showSnackbar({ message: "Impossible de récupérer les permissions", color: "error" });
      }
    },

    checkCount(role) { return role.users_count > 0; },

    openDeleteDialog(id) { this.currentIndex = id; this.deleteDialog = true; },

    async confirmDelete() {
      this.isLoading = true;
      this.deleteDialog = false;
      try {
        await $api(`/roles/${this.currentIndex}/delete`, { method: "DELETE" });
        const idx = this.roles.findIndex(r => r.id === this.currentIndex);
        this.roles.splice(idx, 1);
        this.showSnackbar({ message: "Rôle supprimé avec succès", color: "success" });
      } catch (err) {
        const msg = err?.response?.status === 404
          ? "Impossible de supprimer : des données sont liées à ce rôle"
          : "Impossible de supprimer le rôle";
        this.showSnackbar({ message: msg, color: "error" });
      } finally {
        this.currentIndex = null;
        this.isLoading = false;
      }
    },

    openChangeStatusDialog(id) { this.currentIndex = id; this.changeStatusDialog = true; },

    async confirmChangeStatus() {
      this.isLoading = true;
      this.changeStatusDialog = false;
      try {
        const res = await $api(`/roles/${this.currentIndex}/change-status`, { method: "PATCH" });
        const idx = this.roles.findIndex(r => r.id === this.currentIndex);
        this.roles[idx] = res.role;
        this.showSnackbar({ message: "Statut mis à jour avec succès", color: "success" });
      } catch {
        this.showSnackbar({ message: "Impossible de changer l'état", color: "error" });
      } finally {
        this.currentIndex = null;
        this.isLoading = false;
      }
    },

    openEditSidebar(role, index) { this.currentIndex = index; this.current = role; this.editSideBar = true; },
    openDetailsSidebar(role) { this.current = role; this.detailsSideBar = true; },
    addItem(role) { this.roles.push(role); },
    editItem(role) { this.roles[this.currentIndex] = { ...role }; },

    showSnackbar({ message, color }) {
      this.isSnackbarVisible = true;
      this.snackBarDetails = { message, color };
    },
  },
};
</script>

<style scoped>
/* ── Header ── */
.rl-title { font-size:22px;font-weight:800;color:#1a1a2e;margin:0 }
.rl-sub   { font-size:13px;color:#9e9e9e;margin:4px 0 0 }

.rl-btn-primary  { background:#1a1a2e;color:#fff;border-radius:8px;font-weight:700 }
.rl-btn-outline  { border-radius:8px;color:#1a1a2e;border-color:#1a1a2e;font-weight:600 }

/* ── Stats ── */
.rl-stat-card {
  display:flex;align-items:center;gap:14px;
  background:#fff;border:1.5px solid #f0f0f0;border-radius:14px;
  padding:16px 20px;
}
.rl-stat-icon {
  width:44px;height:44px;border-radius:12px;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
}
.rl-stat-value { font-size:22px;font-weight:800;color:#1a1a2e;line-height:1 }
.rl-stat-label { font-size:12px;color:#9e9e9e;margin-top:3px }

/* ── Section header ── */
.rl-section-header {
  display:flex;align-items:center;font-size:12px;font-weight:700;
  color:#1a1a2e;text-transform:uppercase;letter-spacing:.5px;
}
.rl-section-line { flex:1;height:1px;background:#f0f0f0;margin-left:12px }

/* ── Hierarchy cards ── */
.rl-hierarchy-card {
  border-radius:14px;padding:20px;position:relative;overflow:hidden;
  border:1.5px solid transparent;min-height:190px;
}
.rl-hierarchy-card--super { background:linear-gradient(135deg,#1a1a2e 0%,#2d2d4e 100%);border-color:#1a1a2e }
.rl-hierarchy-card--owner { background:linear-gradient(135deg,#2e4a1e 0%,#3d6428 100%);border-color:#3d6428 }
.rl-hierarchy-card--parc  { background:linear-gradient(135deg,#1a3040 0%,#264a5e 100%);border-color:#264a5e }

.rl-hierarchy-badge {
  position:absolute;top:12px;right:12px;
  font-size:10px;font-weight:700;padding:3px 8px;border-radius:20px;
  background:rgba(232,168,56,.25);color:#E8A838;letter-spacing:.4px;
}
.rl-hierarchy-badge--owner { background:rgba(255,255,255,.15);color:rgba(255,255,255,.8) }
.rl-hierarchy-badge--parc  { background:rgba(255,255,255,.12);color:rgba(255,255,255,.7) }

.rl-hierarchy-icon {
  width:46px;height:46px;border-radius:12px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
}
.rl-hierarchy-icon--super { background:rgba(232,168,56,.3) }
.rl-hierarchy-icon--owner { background:rgba(255,255,255,.2) }
.rl-hierarchy-icon--parc  { background:rgba(255,255,255,.15) }

.rl-hierarchy-name { font-size:15px;font-weight:800;color:#fff }
.rl-hierarchy-desc { font-size:11px;color:rgba(255,255,255,.55);margin-top:2px }

.rl-hierarchy-perms { display:flex;flex-direction:column;gap:5px }
.rl-perm-item {
  font-size:12px;padding:4px 10px;border-radius:6px;
  display:flex;align-items:center;gap:6px;
}
.rl-perm-item::before { content:'';width:6px;height:6px;border-radius:50%;flex-shrink:0 }
.rl-perm-item--ok { color:rgba(255,255,255,.85);background:rgba(76,175,80,.15) }
.rl-perm-item--ok::before { background:#4CAF50 }
.rl-perm-item--no { color:rgba(255,255,255,.4);background:rgba(255,255,255,.05) }
.rl-perm-item--no::before { background:rgba(255,255,255,.2) }

/* ── Matrix card ── */
.rl-matrix-card { border-radius:14px;overflow:hidden }
.rl-matrix-header {
  background:linear-gradient(135deg,#1a1a2e 0%,#2d2d4e 100%);
  padding:18px 24px;display:flex;align-items:center;justify-content:space-between;
}
.rl-matrix-icon {
  width:38px;height:38px;border-radius:10px;background:rgba(232,168,56,.2);
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
}

/* ── Permission matrix ── */
.rl-perm-group { border:1.5px solid #f0f0f0;border-radius:12px;overflow:hidden;margin-bottom:12px }
.rl-perm-group-header {
  display:flex;align-items:center;gap:8px;padding:9px 12px;
  background:#fafafa;border-bottom:1px solid #f0f0f0;
}
.rl-perm-group-icon {
  width:26px;height:26px;border-radius:7px;background:#fff8e7;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
}
.rl-perm-group-name { font-size:11px;font-weight:700;color:#1a1a2e;text-transform:uppercase;letter-spacing:.4px }
.rl-perm-row {
  display:flex;align-items:center;gap:8px;padding:6px 12px;
  border-bottom:1px solid #fafafa;
}
.rl-perm-row:last-child { border-bottom:none }
.rl-perm-label { font-size:12px;line-height:1.4 }

/* ── Role cards ── */
.rl-role-card { border-radius:12px;transition:box-shadow .15s;overflow:hidden }
.rl-role-card:hover { box-shadow:0 6px 20px rgba(0,0,0,.08) !important }

.rl-role-accent { height:3px;background:linear-gradient(90deg,#1a1a2e,#E8A838) }

.rl-role-avatar {
  width:42px;height:42px;border-radius:11px;background:#f0f4ff;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
}
.rl-role-name { font-size:14px;font-weight:700;color:#1a1a2e;overflow:hidden;text-overflow:ellipsis;white-space:nowrap }
.rl-role-meta { font-size:11px;color:#9e9e9e;display:flex;align-items:center;margin-top:2px }

.rl-perm-preview { display:flex;flex-wrap:wrap;gap:4px;min-height:24px }
.rl-perm-tag {
  font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;
  background:#f5f5f5;color:#555;border:1px solid #eee;
}
.rl-perm-tag--more { background:#fff8e7;color:#E8A838;border-color:#f5d98b }
.rl-perm-tag--none { background:#fafafa;color:#bbb;font-style:italic }

/* ── Empty ── */
.rl-empty { text-align:center;padding:48px 0 }
</style>
