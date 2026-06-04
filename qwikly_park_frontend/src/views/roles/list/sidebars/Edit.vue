<template>
  <VNavigationDrawer
    temporary
    :width="520"
    location="end"
    class="scrollable-content"
    :model-value="isOpen"
    @update:model-value="(val) => $emit('update:isOpen', val)"
  >
    <AppDrawerHeaderSection title="Modifier le rôle" @cancel="close" />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <VForm ref="editForm">
            <VRow>

              <!-- Nom du rôle -->
              <VCol cols="12">
                <AppTextField
                  v-model="role.name"
                  label="Nom du rôle"
                  placeholder="Ex: Gestionnaire de parc"
                  :rules="[requiredValidator]"
                  prepend-inner-icon="tabler-shield"
                />
              </VCol>

              <!-- Statut -->
              <VCol cols="12">
                <AppSelect
                  v-model="role.status"
                  :items="statusOptions"
                  item-title="label"
                  item-value="value"
                  label="Statut"
                  prepend-inner-icon="tabler-toggle-left"
                />
              </VCol>

              <!-- Séparateur -->
              <VCol cols="12">
                <div class="d-flex align-center gap-2 my-1">
                  <div style="flex:1;height:1px;background:#f0f0f0"></div>
                  <span style="font-size:12px;font-weight:600;color:#9e9e9e;white-space:nowrap">
                    PERMISSIONS
                  </span>
                  <div style="flex:1;height:1px;background:#f0f0f0"></div>
                </div>
              </VCol>

              <!-- Loading -->
              <VCol v-if="permissionsLoading" cols="12" class="text-center py-4">
                <VProgressCircular indeterminate color="#E8A838" size="28" />
                <div style="font-size:12px;color:#9e9e9e;margin-top:8px">
                  Chargement des permissions...
                </div>
              </VCol>

              <!-- Permission groups -->
              <template v-else>
                <VCol
                  v-for="group in groupedPermissions"
                  :key="group.type"
                  cols="12"
                >
                  <label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:6px">
                    <VIcon :icon="getGroupIcon(group.type)" size="14" class="me-1" style="color:#E8A838"/>
                    {{ group.type }}
                  </label>
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
                      <span v-if="isSelected(perm.id)" style="margin-right:4px">✓</span>
                      {{ perm.displayName }}
                    </button>
                  </div>
                  <button
                    type="button"
                    class="select-all-btn"
                    @click="group.permissions.forEach(p => { if(!isSelected(p.id)) togglePermission(p.id) })"
                  >
                    Tout sélectionner
                  </button>
                </VCol>

                <!-- Empty state -->
                <VCol v-if="groupedPermissions.length === 0" cols="12">
                  <div class="text-center py-4" style="color:#9e9e9e;font-size:13px">
                    <VIcon icon="tabler-lock" size="32" style="color:#e0e0e0" class="d-block mb-2" />
                    Aucune permission disponible
                  </div>
                </VCol>

                <!-- Changed indicator -->
                <VCol v-if="hasChanges" cols="12">
                  <div style="background:#FFF8E7;border:1px solid #E8A838;border-radius:8px;padding:8px 14px;font-size:12px;color:#E65100;display:flex;align-items:center;gap:6px">
                    <VIcon icon="tabler-info-circle" size="14"/>
                    Des modifications non enregistrées sont en attente.
                  </div>
                </VCol>

                <!-- Summary -->
                <VCol v-if="selectedPermissionIds.length > 0" cols="12">
                  <div style="background:#f9f9f9;border-radius:8px;padding:10px 14px;font-size:12px;color:#555">
                    <VIcon icon="tabler-shield-check" size="14" class="me-1" style="color:#4CAF50"/>
                    <strong>{{ selectedPermissionIds.length }}</strong> permission(s) sélectionnée(s)
                  </div>
                </VCol>
              </template>

            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </PerfectScrollbar>

    <template v-slot:append>
      <VCard flat style="border-top:1px solid #f0f0f0">
        <VCardText class="d-flex gap-3">
          <VBtn
            style="background:#1a1a2e;color:#fff;flex:1;font-weight:700;border-radius:8px"
            elevation="0"
            :loading="loading"
            :disabled="loading || !hasChanges"
            @click="save"
          >
            <VIcon icon="tabler-device-floppy" size="16" class="me-1" />
            Enregistrer
          </VBtn>
          <VBtn
            variant="tonal"
            color="secondary"
            style="border-radius:8px"
            @click="close"
          >
            Annuler
          </VBtn>
        </VCardText>
      </VCard>
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
  emits: ["update:isOpen", "saved"],

  components: { PerfectScrollbar },

  setup() {
    return { requiredValidator };
  },

  props: {
    isOpen:      { type: Boolean, required: true },
    permissions: { type: Array,   default: () => [] },
    current:     { type: Object,  default: null },
  },

  data() {
    return {
      role: { name: "", status: true },
      selectedPermissionIds:  [],
      initialPermissionIds:   [],
      initialRole:            { name: "", status: true },
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
      const groups  = {};
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

    hasChanges() {
      const roleDiff =
        this.role.name   !== this.initialRole.name ||
        this.role.status !== this.initialRole.status;

      const sortedCurrent  = [...this.selectedPermissionIds].sort((a, b) => a - b);
      const sortedInitial  = [...this.initialPermissionIds].sort((a, b) => a - b);
      const permsDiff =
        sortedCurrent.length !== sortedInitial.length ||
        sortedCurrent.some((id, i) => id !== sortedInitial[i]);

      return roleDiff || permsDiff;
    },
  },

  watch: {
    isOpen(val) {
      if (val && this.current) {
        this.initForm();
        if (this.permissions.length === 0) {
          this.loadPermissions();
        }
      }
    },

    current(val) {
      if (val && this.isOpen) this.initForm();
    },
  },

  methods: {
    initForm() {
      if (!this.current) return;

      this.role = {
        name:   this.current.name   || "",
        status: this.current.status === "actif" || this.current.status === true,
      };
      this.initialRole = { ...this.role };

      // Pre-select existing permissions — current.permissions is an array of permission objects
      const existingIds = (this.current.permissions || []).map(p => p.id || p);
      this.selectedPermissionIds = [...existingIds];
      this.initialPermissionIds  = [...existingIds];

      this.$nextTick(() => this.$refs.editForm?.resetValidation());
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

    togglePermission(id) {
      const idx = this.selectedPermissionIds.indexOf(id);
      if (idx === -1) {
        this.selectedPermissionIds.push(id);
      } else {
        this.selectedPermissionIds.splice(idx, 1);
      }
    },

    formatPermissionLabel(permission, fallbackLabel) {
      const actionMap = {
        'voir':             '👁 Voir',
        'ajouter':          '＋ Ajouter',
        'mettre à jour':    '✎ Modifier',
        'supprimer':        '✕ Supprimer',
        'archiver':         '🗃 Archiver',
        'récupérer':        '↩ Récupérer',
        'statistiques':     '📊 Statistiques',
        'changer le statut':'⇄ Statut',
        'activer/désactiver':'⏻ Activer',
        'reset':            '↺ Réinitialiser',
        'export':           '↑ Exporter',
      };
      const label = fallbackLabel ? fallbackLabel.toLowerCase().trim() : '';
      if (actionMap[label]) return actionMap[label];

      const parts = permission.split('-');
      if (parts.length > 1) {
        const action = parts.slice(1).join('-');
        const actionLabels = {
          'add':           '＋ Ajouter',
          'update':        '✎ Modifier',
          'delete':        '✕ Supprimer',
          'archive':       '🗃 Archiver',
          'recover':       '↩ Récupérer',
          'stats':         '📊 Statistiques',
          'change-status': '⇄ Statut',
          'reset':         '↺ Réinitialiser',
          'export':        '↑ Exporter',
          'top-earnings':  '💹 Top Revenus',
          'top-purchases': '🏆 Top Achats',
        };
        if (actionLabels[action]) return actionLabels[action];
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
      };
      return icons[type] || "tabler-lock";
    },

    close() {
      this.$emit("update:isOpen", false);
    },

    async save() {
      const { valid } = await this.$refs.editForm.validate();
      if (!valid) return;

      this.loading = true;
      try {
        const res = await $api(`/roles/${this.current.id}/update`, {
          method: "PUT",
          body: {
            name:        this.role.name,
            status:      this.role.status,
            permissions: this.selectedPermissionIds,
          },
        });
        this.$emit("saved", res.role || res);
        this.busEmit("update-item", res.role || res);
        this.showSnackbar({ message: "Rôle mis à jour avec succès !", color: "success" });
        this.close();
      } catch (err) {
        const msg = err?.data?.message || "Impossible de mettre à jour le rôle.";
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
.perm-chips-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.perm-chip {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 20px;
  border: 1.5px solid #e0e0e0;
  background: #fff;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.perm-chip:hover {
  border-color: #E8A838;
  color: #E8A838;
}

.perm-chip--active {
  background: #1a1a2e;
  border-color: #1a1a2e;
  color: #fff;
}

.perm-chip--active:hover {
  background: #2d2d4e;
  border-color: #2d2d4e;
  color: #fff;
}

.select-all-btn {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 6px;
  border: none;
  background: transparent;
  font-size: 11px;
  font-weight: 600;
  color: #E8A838;
  cursor: pointer;
  margin-top: 4px;
  font-family: inherit;
  text-decoration: underline;
}
.select-all-btn:hover { color: #d4942b; }
</style>
