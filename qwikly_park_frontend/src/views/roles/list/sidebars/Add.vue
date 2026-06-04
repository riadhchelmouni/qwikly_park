<template>
  <VNavigationDrawer
    temporary
    :width="560"
    location="end"
    class="scrollable-content"
    :model-value="isOpen"
    @update:model-value="(val) => $emit('update:isOpen', val)"
  >
    <!-- ── Header ──────────────────────────────────────────── -->
    <div class="drawer-header">
      <div class="drawer-header-left">
        <div class="drawer-header-icon">
          <VIcon icon="tabler-shield-plus" size="20" />
        </div>
        <div>
          <div class="drawer-header-title">Nouveau rôle</div>
          <div class="drawer-header-sub">Définissez les accès pour ce rôle</div>
        </div>
      </div>
      <button type="button" class="drawer-close-btn" @click="close">
        <VIcon icon="tabler-x" size="18" />
      </button>
    </div>

    <!-- ── Selected count banner ──────────────────────────── -->
    <div class="perm-banner" :class="selectedPermissionIds.length > 0 ? 'perm-banner--active' : ''">
      <div class="perm-banner-inner">
        <VIcon icon="tabler-shield-check" size="16" class="me-2" />
        <span v-if="selectedPermissionIds.length === 0">Aucune permission sélectionnée</span>
        <span v-else>
          <strong>{{ selectedPermissionIds.length }}</strong>
          permission{{ selectedPermissionIds.length > 1 ? 's' : '' }} sélectionnée{{ selectedPermissionIds.length > 1 ? 's' : '' }}
          sur <strong>{{ totalPermissions }}</strong>
        </span>
      </div>
      <div class="perm-banner-actions" v-if="filteredGroups.length > 0">
        <button type="button" class="banner-action-btn" @click="selectAllVisible">
          <VIcon icon="tabler-checks" size="13" class="me-1" />
          Tout sélectionner
        </button>
        <span class="banner-sep">·</span>
        <button type="button" class="banner-action-btn banner-action-btn--clear" @click="deselectAll">
          <VIcon icon="tabler-square-x" size="13" class="me-1" />
          Tout effacer
        </button>
      </div>
    </div>

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <div class="drawer-body">
        <VForm ref="addForm">

          <!-- ── Role name ───────────────────────────────── -->
          <div class="field-section">
            <div class="field-section-label">
              <VIcon icon="tabler-shield" size="14" class="me-1" style="color:#E8A838" />
              Informations du rôle
            </div>
            <div class="field-row">
              <AppTextField
                v-model="role.name"
                label="Nom du rôle"
                placeholder="Ex: Gestionnaire de parc"
                :rules="[requiredValidator]"
                prepend-inner-icon="tabler-shield"
              />
            </div>
            <div class="field-row">
              <AppSelect
                v-model="role.status"
                :items="statusOptions"
                item-title="label"
                item-value="value"
                label="Statut"
                prepend-inner-icon="tabler-toggle-left"
              />
            </div>
          </div>

          <!-- ── Permissions header + search ─────────────── -->
          <div class="perm-section-header">
            <div class="perm-section-title">
              <VIcon icon="tabler-lock" size="15" class="me-2" style="color:#E8A838" />
              Permissions
              <span class="perm-total-badge">{{ totalPermissions }}</span>
            </div>
          </div>

          <!-- Search -->
          <div class="perm-search-wrap">
            <div class="perm-search-inner">
              <VIcon icon="tabler-search" size="15" class="search-icon" />
              <input
                v-model="permSearch"
                type="text"
                class="perm-search-input"
                placeholder="Rechercher une permission..."
              />
              <button v-if="permSearch" type="button" class="search-clear-btn" @click="permSearch = ''">
                <VIcon icon="tabler-x" size="13" />
              </button>
            </div>
          </div>

          <!-- ── Loading ─────────────────────────────────── -->
          <div v-if="permissionsLoading" class="perm-loading">
            <VProgressCircular indeterminate color="#E8A838" size="32" />
            <div class="perm-loading-text">Chargement des permissions...</div>
          </div>

          <!-- ── No search results ───────────────────────── -->
          <div v-else-if="filteredGroups.length === 0 && permSearch" class="perm-empty">
            <VIcon icon="tabler-search-off" size="36" style="color:#e0e0e0" />
            <div>Aucune permission trouvée pour "<strong>{{ permSearch }}</strong>"</div>
          </div>

          <!-- ── Empty ───────────────────────────────────── -->
          <div v-else-if="filteredGroups.length === 0" class="perm-empty">
            <VIcon icon="tabler-lock" size="36" style="color:#e0e0e0" />
            <div>Aucune permission disponible</div>
          </div>

          <!-- ── Permission groups ───────────────────────── -->
          <template v-else>
            <div
              v-for="group in filteredGroups"
              :key="group.type"
              class="perm-group"
            >
              <!-- Group header -->
              <div class="perm-group-header">
                <div class="perm-group-left">
                  <div class="perm-group-icon">
                    <VIcon :icon="getGroupIcon(group.type)" size="14" />
                  </div>
                  <span class="perm-group-name">{{ group.type }}</span>
                  <span class="perm-group-count">
                    {{ countSelected(group) }}/{{ group.permissions.length }}
                  </span>
                </div>
                <div class="perm-group-actions">
                  <button
                    v-if="countSelected(group) < group.permissions.length"
                    type="button"
                    class="group-action-btn"
                    @click="selectGroup(group)"
                  >
                    Tout
                  </button>
                  <button
                    v-else
                    type="button"
                    class="group-action-btn group-action-btn--clear"
                    @click="deselectGroup(group)"
                  >
                    Effacer
                  </button>
                </div>
              </div>

              <!-- Chips -->
              <div class="perm-chips-grid">
                <button
                  v-for="perm in group.permissions"
                  :key="perm.id"
                  type="button"
                  class="perm-chip"
                  :class="isSelected(perm.id) ? 'perm-chip--active' : ''"
                  :title="perm.permission"
                  @click="togglePermission(perm.id)"
                >
                  <VIcon
                    :icon="isSelected(perm.id) ? 'tabler-check' : getActionIcon(perm.permission)"
                    size="12"
                    class="chip-icon"
                  />
                  {{ perm.displayName }}
                </button>
              </div>
            </div>
          </template>

        </VForm>
      </div>
    </PerfectScrollbar>

    <!-- ── Footer ──────────────────────────────────────────── -->
    <template v-slot:append>
      <div class="drawer-footer">
        <button
          type="button"
          class="footer-btn footer-btn--save"
          :disabled="loading"
          @click="save"
        >
          <VProgressCircular v-if="loading" indeterminate size="14" color="#fff" class="me-2" />
          <VIcon v-else icon="tabler-device-floppy" size="15" class="me-2" />
          Sauvegarder
        </button>
        <button type="button" class="footer-btn footer-btn--cancel" @click="close">
          Annuler
        </button>
      </div>
    </template>
  </VNavigationDrawer>

  <VSnackbar
    v-model="isSnackbarVisible"
    location="bottom end"
    variant="flat"
    :color="snackBarDetails.color"
  >{{ snackBarDetails.message }}</VSnackbar>
</template>

<script>
import { $api } from "@/utils/api";
import { PerfectScrollbar } from "vue3-perfect-scrollbar";
import { requiredValidator } from "@validators";

export default {
  emits: ["update:isOpen", "saved", "permissions-loaded"],

  components: { PerfectScrollbar },

  setup() {
    return { requiredValidator };
  },

  props: {
    isOpen:      { type: Boolean, required: true },
    permissions: { type: Array,   default: () => [] },
  },

  data() {
    return {
      role: { name: "", status: true },
      selectedPermissionIds: [],
      permSearch: "",
      loading: false,
      permissionsLoading: false,
      isSnackbarVisible: false,
      snackBarDetails: { message: "", color: "" },
      statusOptions: [
        { label: "Actif",   value: true  },
        { label: "Inactif", value: false },
      ],
    };
  },

  computed: {
    groupedPermissions() {
      const groups = {};
      const seenIds = new Set();
      this.permissions.forEach(item => {
        if (seenIds.has(item.id)) return;
        seenIds.add(item.id);
        if (!groups[item.type]) {
          groups[item.type] = { type: item.type, permissions: [] };
        }
        groups[item.type].permissions.push({
          id:          item.id,
          label:       item.label,
          permission:  item.permission,
          displayName: this.formatPermissionLabel(item.permission, item.label),
        });
      });
      return Object.values(groups);
    },

    filteredGroups() {
      if (!this.permSearch.trim()) return this.groupedPermissions;
      const q = this.permSearch.toLowerCase().trim();
      return this.groupedPermissions
        .map(group => ({
          ...group,
          permissions: group.permissions.filter(p =>
            p.displayName.toLowerCase().includes(q) ||
            p.permission.toLowerCase().includes(q) ||
            group.type.toLowerCase().includes(q)
          ),
        }))
        .filter(g => g.permissions.length > 0);
    },

    totalPermissions() {
      return this.groupedPermissions.reduce((sum, g) => sum + g.permissions.length, 0);
    },
  },

  watch: {
    isOpen(val) {
      if (val) {
        this.resetForm();
        if (this.permissions.length === 0) {
          this.loadPermissions();
        }
      }
    },
  },

  methods: {
    resetForm() {
      this.role = { name: "", status: true };
      this.selectedPermissionIds = [];
      this.permSearch = "";
      this.$nextTick(() => this.$refs.addForm?.resetValidation());
    },

    async loadPermissions() {
      this.permissionsLoading = true;
      try {
        const res = await $api("/roles/permissions");
        this.$emit("permissions-loaded", res.data || []);
      } catch { /* silent */ }
      finally { this.permissionsLoading = false; }
    },

    isSelected(id) {
      return this.selectedPermissionIds.includes(id);
    },

    countSelected(group) {
      return group.permissions.filter(p => this.isSelected(p.id)).length;
    },

    togglePermission(id) {
      const idx = this.selectedPermissionIds.indexOf(id);
      if (idx === -1) this.selectedPermissionIds.push(id);
      else this.selectedPermissionIds.splice(idx, 1);
    },

    selectGroup(group) {
      group.permissions.forEach(p => {
        if (!this.isSelected(p.id)) this.selectedPermissionIds.push(p.id);
      });
    },

    deselectGroup(group) {
      group.permissions.forEach(p => {
        const idx = this.selectedPermissionIds.indexOf(p.id);
        if (idx !== -1) this.selectedPermissionIds.splice(idx, 1);
      });
    },

    selectAllVisible() {
      this.filteredGroups.forEach(g => this.selectGroup(g));
    },

    deselectAll() {
      this.selectedPermissionIds = [];
    },

    getActionIcon(permission) {
      const parts = permission.split('-');
      const action = parts.slice(1).join('-');
      const map = {
        'add':           'tabler-plus',
        'update':        'tabler-pencil',
        'delete':        'tabler-trash',
        'archive':       'tabler-archive',
        'recover':       'tabler-restore',
        'stats':         'tabler-chart-bar',
        'change-status': 'tabler-arrows-exchange',
        'reset':         'tabler-refresh',
        'export':        'tabler-download',
        'barcode':       'tabler-barcode',
        'management':    'tabler-settings',
        'history':       'tabler-history',
        'close':         'tabler-door-exit',
        'redeem':        'tabler-gift',
        'cancel':        'tabler-ban',
        'top-earnings':  'tabler-trending-up',
        'top-purchases': 'tabler-trophy',
      };
      return map[action] || 'tabler-eye';
    },

    formatPermissionLabel(permission, fallbackLabel) {
      const parts = permission.split('-');
      const actionMap = {
        'add':           'Ajouter',
        'update':        'Modifier',
        'delete':        'Supprimer',
        'archive':       'Archiver',
        'recover':       'Récupérer',
        'stats':         'Statistiques',
        'change-status': 'Changer statut',
        'reset':         'Réinitialiser',
        'export':        'Exporter',
        'barcode':       'Code-barres',
        'management':    'Gestion',
        'history':       'Historique',
        'close':         'Clôturer',
        'redeem':        'Utiliser',
        'cancel':        'Annuler',
        'top-earnings':  'Top revenus',
        'top-purchases': 'Top achats',
      };
      if (parts.length > 1) {
        const action = parts.slice(1).join('-');
        if (actionMap[action]) return actionMap[action];
      }
      return fallbackLabel
        ? fallbackLabel.charAt(0).toUpperCase() + fallbackLabel.slice(1)
        : permission;
    },

    getGroupIcon(type) {
      const icons = {
        "Rôles":                    "tabler-shield",
        "Utilisateurs":             "tabler-users",
        "Clients":                  "tabler-user-check",
        "Offres":                   "tabler-tag",
        "Achats":                   "tabler-shopping-cart",
        "Publicités":               "tabler-ad",
        "Historique des activités": "tabler-history",
        "Archive":                  "tabler-archive",
        "Propriétaires":            "tabler-user-star",
        "Employés":                 "tabler-id-badge",
        "Parcs":                    "tabler-building",
        "Caisses":                  "tabler-cash-register",
        "Stock":                    "tabler-package",
        "Événements":               "tabler-calendar-event",
        "Passes":                   "tabler-ticket",
        "News":                     "tabler-news",
        "Fournisseurs":             "tabler-truck",
        "Fidélité":                 "tabler-heart",
        "Finances":                 "tabler-receipt",
        "Réservations":             "tabler-calendar-check",
        "Sessions":                 "tabler-clock",
      };
      return icons[type] || "tabler-lock";
    },

    close() {
      this.$emit("update:isOpen", false);
    },

    async save() {
      const { valid } = await this.$refs.addForm.validate();
      if (!valid) return;

      if (this.selectedPermissionIds.length === 0) {
        this.showSnackbar({ message: "Veuillez sélectionner au moins une permission.", color: "warning" });
        return;
      }

      this.loading = true;
      try {
        const res = await $api("/roles/add", {
          method: "POST",
          body: {
            name:        this.role.name,
            status:      this.role.status,
            permissions: this.selectedPermissionIds,
          },
        });
        this.$emit("saved", res.role || res);
        this.busEmit("add-item", res.role || res);
        this.showSnackbar({ message: "Rôle créé avec succès !", color: "success" });
        this.close();
      } catch (err) {
        const msg = err?.data?.message || "Impossible de créer le rôle.";
        this.showSnackbar({ message: msg, color: "error" });
      } finally {
        this.loading = false;
      }
    },

    showSnackbar({ message, color }) {
      this.snackBarDetails = { message, color };
      this.isSnackbarVisible = true;
    },
  },
};
</script>

<style scoped>
/* ── Header ──────────────────────────────────────────────── */
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}
.drawer-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.drawer-header-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #1a1a2e 0%, #2d2d4e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #E8A838;
  flex-shrink: 0;
}
.drawer-header-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1.2;
}
.drawer-header-sub {
  font-size: 11px;
  color: #9e9e9e;
  margin-top: 1px;
}
.drawer-close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1.5px solid #e0e0e0;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9e9e9e;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}
.drawer-close-btn:hover { border-color: #1a1a2e; color: #1a1a2e; }

/* ── Banner ───────────────────────────────────────────────── */
.perm-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 20px;
  background: #f8f8f8;
  border-bottom: 1px solid #f0f0f0;
  font-size: 12px;
  color: #9e9e9e;
  transition: all 0.2s;
}
.perm-banner--active {
  background: #fff8ec;
  border-bottom-color: #fce8bb;
  color: #b87d1a;
}
.perm-banner-inner {
  display: flex;
  align-items: center;
  font-weight: 600;
}
.perm-banner-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.banner-sep { color: #ccc; font-size: 14px; }
.banner-action-btn {
  display: inline-flex;
  align-items: center;
  background: transparent;
  border: none;
  font-size: 11px;
  font-weight: 600;
  color: #1a1a2e;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: inherit;
  transition: background 0.15s;
}
.banner-action-btn:hover { background: rgba(26,26,46,0.06); }
.banner-action-btn--clear { color: #e53935; }
.banner-action-btn--clear:hover { background: rgba(229,57,53,0.06); }

/* ── Body ─────────────────────────────────────────────────── */
.drawer-body { padding: 20px; }

/* ── Field sections ──────────────────────────────────────── */
.field-section { margin-bottom: 8px; }
.field-section-label {
  font-size: 11px;
  font-weight: 700;
  color: #9e9e9e;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}
.field-row { margin-bottom: 12px; }

/* ── Permissions section header ──────────────────────────── */
.perm-section-header {
  margin-top: 4px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.perm-section-title {
  font-size: 11px;
  font-weight: 700;
  color: #9e9e9e;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  display: flex;
  align-items: center;
}
.perm-total-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 5px;
  border-radius: 10px;
  background: #1a1a2e;
  color: #E8A838;
  font-size: 10px;
  font-weight: 700;
  margin-left: 7px;
}

/* ── Search ───────────────────────────────────────────────── */
.perm-search-wrap { margin-bottom: 16px; }
.perm-search-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  padding: 8px 12px;
  background: #fafafa;
  transition: border-color 0.15s;
}
.perm-search-inner:focus-within { border-color: #E8A838; background: #fff; }
.search-icon { color: #bbb; flex-shrink: 0; }
.perm-search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 13px;
  color: #333;
  outline: none;
  font-family: inherit;
}
.perm-search-input::placeholder { color: #bbb; }
.search-clear-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #bbb;
  display: flex;
  align-items: center;
  padding: 0;
}
.search-clear-btn:hover { color: #555; }

/* ── Loading / Empty ─────────────────────────────────────── */
.perm-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36px 0;
  gap: 12px;
}
.perm-loading-text { font-size: 12px; color: #9e9e9e; }
.perm-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 36px 0;
  text-align: center;
  font-size: 13px;
  color: #9e9e9e;
}

/* ── Group ────────────────────────────────────────────────── */
.perm-group {
  margin-bottom: 18px;
}
.perm-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f4f4f4;
}
.perm-group-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.perm-group-icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #E8A838;
  flex-shrink: 0;
}
.perm-group-name {
  font-size: 12px;
  font-weight: 700;
  color: #333;
}
.perm-group-count {
  font-size: 10px;
  font-weight: 700;
  color: #E8A838;
  background: #fff8ec;
  border: 1px solid #fce8bb;
  border-radius: 8px;
  padding: 1px 7px;
}
.perm-group-actions {}
.group-action-btn {
  background: transparent;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 600;
  color: #1a1a2e;
  cursor: pointer;
  padding: 2px 8px;
  font-family: inherit;
  transition: all 0.15s;
}
.group-action-btn:hover { border-color: #1a1a2e; background: #f5f5f5; }
.group-action-btn--clear { color: #e53935; border-color: #fccdd4; }
.group-action-btn--clear:hover { background: #fff5f5; border-color: #e53935; }

/* ── Chips ────────────────────────────────────────────────── */
.perm-chips-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.perm-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border-radius: 20px;
  border: 1.5px solid #e8e8e8;
  background: #fff;
  font-size: 11.5px;
  font-weight: 600;
  color: #555;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.perm-chip:hover { border-color: #E8A838; color: #E8A838; background: #fff8ec; }
.perm-chip--active {
  background: #1a1a2e;
  border-color: #1a1a2e;
  color: #fff;
}
.perm-chip--active:hover { background: #2d2d4e; border-color: #2d2d4e; }
.chip-icon { flex-shrink: 0; }

/* ── Footer ───────────────────────────────────────────────── */
.drawer-footer {
  display: flex;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid #f0f0f0;
  background: #fff;
}
.footer-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  font-family: inherit;
  transition: all 0.15s;
}
.footer-btn--save {
  flex: 1;
  background: linear-gradient(135deg, #1a1a2e 0%, #2d2d4e 100%);
  color: #fff;
  padding: 0 20px;
}
.footer-btn--save:hover:not(:disabled) { opacity: 0.9; }
.footer-btn--save:disabled { opacity: 0.5; cursor: not-allowed; }
.footer-btn--cancel {
  padding: 0 18px;
  background: #f5f5f5;
  color: #555;
  border: 1.5px solid #e0e0e0;
}
.footer-btn--cancel:hover { background: #eee; border-color: #ccc; }
</style>
