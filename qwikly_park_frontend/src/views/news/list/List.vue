<template>
  <div>

    <!-- ══ TITRE ══ -->
    <div class="mb-5">
      <h1 class="page-title">Gestion des actualités</h1>
    </div>

    <!-- ══ ALERT ══ -->
    <transition name="slide-down">
      <div v-if="alertVisible" class="alert-banner" :class="alertType === 'success' ? 'alert-success' : 'alert-warning'">
        <div class="alert-inner">
          <VIcon :icon="alertType === 'success' ? 'tabler-circle-check' : 'tabler-alert-triangle'" size="20" class="alert-icon" />
          <div class="alert-body">
            <div class="alert-title">{{ alertTitle }}</div>
            <div class="alert-sub">{{ alertSub }}</div>
          </div>
          <button class="alert-close" @click="alertVisible = false">
            <VIcon icon="tabler-x" size="16" />
          </button>
        </div>
      </div>
    </transition>

    <!-- ══ FILTRES ══ -->
    <VCard class="mb-4" elevation="0" border>
      <VCardText class="pa-4">
        <div class="filter-label mb-3">Filter</div>
        <div class="d-flex gap-3 flex-wrap align-end">
          <AppDateTimePicker
            v-model="filters.date"
            placeholder="Date de publication"
            hide-details
            density="compact"
            style="min-width:200px;max-width:260px"
            :config="{ dateFormat: 'Y-m-d' }"
          />
          <AppSelect
            v-model="filters.park_id"
            :items="parcOptions"
            item-title="name"
            item-value="id"
            placeholder="Parc"
            clearable
            hide-details
            density="compact"
            style="min-width:180px;max-width:240px"
          />
          <AppSelect
            v-model="filters.status"
            :items="statusOptions"
            item-title="label"
            item-value="value"
            placeholder="Statut"
            clearable
            hide-details
            density="compact"
            style="min-width:140px;max-width:180px"
          />
          <VBtn class="apply-btn" elevation="0" @click="applyFilters">Appliquer</VBtn>
        </div>
      </VCardText>
    </VCard>

    <!-- ══ BARRE SEARCH + ACTION ══ -->
    <VCard elevation="0" border>
      <VCardText class="pa-4">
        <div class="d-flex align-center gap-3 mb-5 flex-wrap">
          <span class="list-title">Liste des événements</span>
          <AppTextField
            v-model="search"
            placeholder="Rechercher..."
            prepend-inner-icon="tabler-search"
            hide-details
            clearable
            density="compact"
            class="flex-grow-1"
            style="min-width:160px"
            @update:modelValue="page = 1"
          />
          <button class="add-btn" @click="openCreate">
            <VIcon icon="tabler-plus" size="15" class="me-1" />Nouvelle Actualité
          </button>
        </div>

        <!-- LOADING -->
        <div v-if="isLoading" class="d-flex justify-center align-center py-12">
          <VProgressCircular indeterminate color="#E8A838" size="44" />
        </div>

        <template v-else>
          <!-- GRID CARDS -->
          <div v-if="paginatedItems.length" class="news-grid">
            <div v-for="item in paginatedItems" :key="item.id" class="news-card">

              <!-- Image + status chip -->
              <div class="card-img-wrap">
                <img
                  v-if="item.image_url"
                  :src="item.image_url"
                  class="card-img"
                  alt=""
                />
                <div v-else class="card-img card-img--empty">
                  <VIcon icon="tabler-photo" size="36" color="#d0d0d0" />
                </div>
                <span class="status-chip" :class="item.status === 'published' ? 'chip-published' : 'chip-draft'">
                  {{ item.status === 'published' ? 'Publié' : 'Brouillon' }}
                </span>
              </div>

              <!-- Body -->
              <div class="card-body">
                <p class="card-title">{{ item.title }}</p>

                <!-- Parks -->
                <div class="card-meta">
                  <div class="d-flex align-center gap-1 mb-1">
                    <VIcon icon="tabler-map-pin" size="13" style="color:#9e9e9e" />
                    <span class="meta-label">Associated parc(s)</span>
                  </div>
                  <ul class="parks-list">
                    <li v-for="(park, idx) in (item.parks || [])" :key="idx">{{ park.name || park }}</li>
                  </ul>
                </div>

                <!-- Date -->
                <div v-if="item.published_at" class="d-flex align-center gap-1 mb-3">
                  <VIcon icon="tabler-calendar" size="13" style="color:#9e9e9e" />
                  <span class="meta-date">{{ formatDate(item.published_at) }}</span>
                </div>

                <!-- Author -->
                <div v-if="item.author" class="author-row">
                  <VAvatar size="30" color="#E8A838" class="me-2">
                    <span style="font-size:11px;font-weight:700;color:#fff">
                      {{ initials(item.author.name) }}
                    </span>
                  </VAvatar>
                  <div>
                    <div class="author-name">{{ item.author.name }}</div>
                    <div class="author-email">{{ item.author.email }}</div>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="card-actions">
                <button class="act-btn act-delete" @click="openDelete(item)" title="Supprimer">
                  <VIcon icon="tabler-trash" size="15" />
                </button>
                <button class="act-btn act-status" @click="toggleStatus(item)" :title="item.status === 'published' ? 'Dépublier' : 'Publier'">
                  <VIcon :icon="item.status === 'published' ? 'tabler-eye-off' : 'tabler-eye'" size="15" />
                </button>
                <button class="detail-btn" @click="openDetail(item)">
                  <VIcon icon="tabler-eye" size="14" class="me-1" />Détail
                </button>
                <button class="edit-btn" @click="openEdit(item)">
                  <VIcon icon="tabler-edit" size="14" class="me-1" />Modifier
                </button>
              </div>

            </div>
          </div>

          <!-- EMPTY -->
          <div v-else class="d-flex flex-column align-center justify-center py-12">
            <VIcon icon="tabler-news-off" size="48" style="color:#e0e0e0" class="mb-3" />
            <span style="font-size:14px;color:#9e9e9e">Aucune actualité trouvée</span>
          </div>

          <!-- PAGINATION -->
          <div v-if="totalPages > 1" class="table-footer mt-5">
            <span class="showing-txt">
              Affichage {{ showingFrom }}–{{ showingTo }} sur {{ filteredItems.length }}
            </span>
            <div class="d-flex align-center gap-1">
              <button class="pg-btn" :disabled="page === 1" @click="page = 1">«</button>
              <button class="pg-btn" :disabled="page === 1" @click="page--">‹</button>
              <button
                v-for="p in visiblePages"
                :key="p"
                class="pg-btn"
                :class="p === page ? 'pg-btn--active' : ''"
                @click="page = p"
              >{{ p }}</button>
              <button class="pg-btn" :disabled="page === totalPages" @click="page++">›</button>
              <button class="pg-btn" :disabled="page === totalPages" @click="page = totalPages">»</button>
            </div>
          </div>
        </template>

      </VCardText>
    </VCard>


    <!-- ══ DIALOG SUPPRIMER ══ -->
    <VDialog v-model="deleteDialog" max-width="420">
      <VCard style="border-radius:16px;overflow:hidden">
        <VCardText style="padding:28px 24px 16px">
          <div style="font-size:16px;font-weight:700;color:#1a1a2e;margin-bottom:10px">Supprimer cette actualité ?</div>
          <p style="font-size:13px;color:#666;line-height:1.65;margin:0">
            Cette action est irréversible. L'actualité sera définitivement supprimée.
          </p>
        </VCardText>
        <div style="display:flex;gap:12px;padding:8px 24px 24px;justify-content:flex-end">
          <button @click="deleteDialog = false" style="
            display:inline-flex;align-items:center;justify-content:center;
            padding:0 28px;height:42px;border-radius:8px;
            border:2px solid #e53935;background:#fff;
            color:#e53935;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
            Annuler
          </button>
          <button @click="confirmDelete" :disabled="saving" style="
            display:inline-flex;align-items:center;justify-content:center;
            padding:0 28px;height:42px;border-radius:8px;
            border:none;background:#e53935;color:#fff;
            font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
            <span v-if="saving" style="margin-right:6px">⏳</span>
            Confirmer
          </button>
        </div>
      </VCard>
    </VDialog>

    <!-- ══ DIALOG DÉTAIL ══ -->
    <VDialog v-model="detailDialog" max-width="560">
      <VCard style="border-radius:16px;overflow:hidden">
        <template v-if="detailItem">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 22px 12px;border-bottom:1px solid #f5f5f5">
            <span style="font-size:16px;font-weight:700;color:#1a1a2e">Détail de l'actualité</span>
            <button @click="detailDialog=false" style="background:none;border:none;cursor:pointer;color:#999;display:inline-flex;align-items:center">
              <VIcon icon="tabler-x" size="18" />
            </button>
          </div>
          <VCardText style="padding:18px 22px 22px">
            <!-- Image -->
            <div v-if="detailItem.image_url" style="margin-bottom:16px;border-radius:10px;overflow:hidden">
              <img :src="detailItem.image_url" style="width:100%;height:200px;object-fit:cover;display:block" />
            </div>
            <!-- Status -->
            <div style="margin-bottom:8px">
              <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px"
                :style="detailItem.status === 'published'
                  ? 'background:#e8f5e9;color:#2e7d32'
                  : 'background:#f5f5f5;color:#757575;border:1px solid #e0e0e0'">
                {{ detailItem.status === 'published' ? 'Publié' : 'Brouillon' }}
              </span>
            </div>
            <!-- Title -->
            <div style="font-size:18px;font-weight:700;color:#1a1a2e;margin-bottom:14px;line-height:1.4">{{ detailItem.title }}</div>
            <!-- Description -->
            <div v-if="detailItem.description" style="font-size:13px;color:#555;line-height:1.7;margin-bottom:16px;white-space:pre-wrap">{{ detailItem.description }}</div>
            <!-- Parks -->
            <div v-if="detailItem.parks && detailItem.parks.length" style="margin-bottom:14px">
              <div style="font-size:11px;font-weight:700;color:#9e9e9e;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;display:flex;align-items:center;gap:4px">
                <VIcon icon="tabler-map-pin" size="13" style="color:#E8A838" />Parcs concernés
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:8px">
                <span v-for="park in detailItem.parks" :key="park.id"
                  style="background:#f5f5f5;border:1px solid #e8e8e8;border-radius:6px;padding:3px 10px;font-size:12px;color:#444;font-weight:500">
                  {{ park.name }}
                </span>
              </div>
            </div>
            <!-- Date -->
            <div v-if="detailItem.created_at" style="font-size:12px;color:#9e9e9e;display:flex;align-items:center;gap:5px">
              <VIcon icon="tabler-calendar" size="13" />
              <span>Créé le {{ formatDate(detailItem.created_at) }}</span>
            </div>
          </VCardText>
          <div style="padding:0 22px 18px;display:flex;justify-content:flex-end;gap:10px">
            <button @click="openEdit(detailItem); detailDialog=false" style="
              display:inline-flex;align-items:center;height:38px;padding:0 18px;
              border-radius:8px;border:none;background:#E8A838;color:#fff;
              font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;gap:5px">
              <VIcon icon="tabler-edit" size="14" />Modifier
            </button>
            <button @click="detailDialog=false" style="
              display:inline-flex;align-items:center;height:38px;padding:0 18px;
              border-radius:8px;border:1.5px solid #e0e0e0;background:#fff;
              color:#555;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
              Fermer
            </button>
          </div>
        </template>
      </VCard>
    </VDialog>

    <!-- ══ ADD / EDIT SIDEBAR ══ -->
    <AddSidebar
      v-model:isOpen="addDialog"
      :parcOptions="parcOptions"
      @saved="onSaved"
    />

    <EditSidebar
      v-model:isOpen="editDialog"
      :current="current"
      :parcOptions="parcOptions"
      @saved="onSaved"
    />

  </div>
</template>

<script>
import { $api } from "@/utils/api";
import dayjs from "dayjs";

import AddSidebar from "./sidebars/Add.vue";
import EditSidebar from "./sidebars/Edit.vue";

const PER_PAGE = 6;

export default {
  components: { AddSidebar, EditSidebar },

  setup() { return {}; },

  data() {
    return {
      news: [],
      isLoading: false,
      saving: false,

      search: "",
      page: 1,

      filters: { date: null, park_id: null, status: null },
      appliedFilters: { date: null, park_id: null, status: null },

      parcOptions: [],
      statusOptions: [
        { label: "Publié",   value: "published" },
        { label: "Brouillon", value: "draft"    },
      ],

      // dialogs
      deleteDialog: false,
      addDialog:    false,
      editDialog:   false,
      detailDialog: false,

      current:    null,
      detailItem: null,

      // alert
      alertVisible: false,
      alertType: "success",
      alertTitle: "",
      alertSub: "",
    };
  },

  computed: {
    filteredItems() {
      let list = [...this.news];

      if (this.search) {
        const q = this.search.toLowerCase();
        list = list.filter(n => (n.title || "").toLowerCase().includes(q));
      }
      return list;
    },

    totalPages() {
      return Math.max(1, Math.ceil(this.filteredItems.length / PER_PAGE));
    },

    paginatedItems() {
      const start = (this.page - 1) * PER_PAGE;
      return this.filteredItems.slice(start, start + PER_PAGE);
    },

    showingFrom() {
      return this.filteredItems.length === 0 ? 0 : (this.page - 1) * PER_PAGE + 1;
    },

    showingTo() {
      return Math.min(this.page * PER_PAGE, this.filteredItems.length);
    },

    visiblePages() {
      const total = this.totalPages;
      const cur   = this.page;
      if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
      const pages = new Set([1, total, cur]);
      if (cur > 2) pages.add(cur - 1);
      if (cur < total - 1) pages.add(cur + 1);
      return [...pages].sort((a, b) => a - b);
    },
  },

  async mounted() {
    await Promise.all([this.fetchParcs(), this.fetchNews()]);
  },

  methods: {
    applyFilters() {
      this.appliedFilters = { ...this.filters };
      this.page = 1;
      this.fetchNews();
    },

    async fetchParcs() {
      try {
        const res = await $api("/parks", { params: { per_page: 200 } });
        this.parcOptions = (res.data || res.parks || []).map(p => ({
          id:   p.id,
          name: p.nom || p.name || p.localisation || `Parc ${p.id}`,
        }));
      } catch { /* silent */ }
    },

    async fetchNews() {
      this.isLoading = true;
      this.news = [];
      try {
        const params = { per_page: 200 };
        if (this.appliedFilters.date)    params.date    = this.appliedFilters.date;
        if (this.appliedFilters.park_id) params.park_id = this.appliedFilters.park_id;
        if (this.appliedFilters.status)  params.status  = this.appliedFilters.status;

        const res = await $api("/news", { params });
        this.news = res.data || [];
      } catch {
        this.showAlert("error", "Erreur", "Impossible de charger les actualités.");
      } finally {
        this.isLoading = false;
      }
    },

    openCreate() {
      this.addDialog = true;
    },

    openEdit(item) {
      this.current    = { ...item };
      this.editDialog = true;
    },

    openDetail(item) {
      this.detailItem  = { ...item };
      this.detailDialog = true;
    },

    openDelete(item) {
      this.current      = item;
      this.deleteDialog = true;
    },

    async confirmDelete() {
      this.saving = true;
      try {
        await $api(`/news/${this.current.id}`, { method: "DELETE" });
        this.news = this.news.filter(n => n.id !== this.current.id);
        this.deleteDialog = false;
        this.showAlert("success", "Supprimée", "L'actualité a été supprimée.");
      } catch {
        this.showAlert("error", "Erreur", "Impossible de supprimer l'actualité.");
      } finally {
        this.saving = false;
      }
    },

    async toggleStatus(item) {
      try {
        const res = await $api(`/news/${item.id}/change-status`, { method: "PATCH" });
        const updated = res.data || res;
        const idx = this.news.findIndex(n => n.id === item.id);
        if (idx !== -1) this.news.splice(idx, 1, { ...this.news[idx], ...updated });
        this.showAlert(
          "success",
          "Statut mis à jour",
          item.status === "published" ? "Actualité dépubliée." : "Actualité publiée."
        );
      } catch {
        this.showAlert("error", "Erreur", "Impossible de changer le statut.");
      }
    },

    onSaved(savedRes) {
      const item = savedRes?.data || savedRes;
      if (item?.id) {
        const idx = this.news.findIndex(n => n.id === item.id);
        if (idx !== -1) {
          this.news.splice(idx, 1, { ...this.news[idx], ...item });
        } else {
          this.news.unshift(item);
        }
      } else {
        this.fetchNews();
      }
      this.showAlert("success", "Enregistrée", "L'actualité a été enregistrée avec succès.");
    },

    formatDate(d) {
      return d ? dayjs(d).format("DD/MM/YYYY") : "";
    },

    initials(name) {
      if (!name) return "?";
      return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
    },

    showAlert(type, title, sub) {
      this.alertType    = type;
      this.alertTitle   = title;
      this.alertSub     = sub;
      this.alertVisible = true;
      setTimeout(() => { this.alertVisible = false; }, 4000);
    },
  },
};
</script>

<style scoped>
.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.filter-label {
  font-size: 13px;
  font-weight: 700;
  color: #1a1a2e;
}

.apply-btn {
  background: #E8A838 !important;
  color: #1a1a2e !important;
  font-weight: 700;
  font-size: 13px;
  height: 38px !important;
  border-radius: 8px !important;
  padding: 0 20px !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
}

.list-title {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a2e;
  white-space: nowrap;
}

.add-btn {
  display: inline-flex;
  align-items: center;
  height: 38px;
  padding: 0 18px;
  border-radius: 8px;
  border: none;
  background: #E8A838;
  color: #1a1a2e;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
}
.add-btn:hover { background: #d4942e; }

/* ── News grid ── */
.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.news-card {
  border: 1px solid #ebebeb;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.card-img-wrap {
  position: relative;
}

.card-img {
  width: 100%;
  height: 160px;
  object-fit: cover;
  display: block;
}

.card-img--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.status-chip {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
}

.chip-published {
  background: #e8f5e9;
  color: #2e7d32;
}

.chip-draft {
  background: #f5f5f5;
  color: #757575;
  border: 1px solid #e0e0e0;
}

.card-body {
  padding: 14px 16px 12px;
  flex: 1;
}

.card-title {
  font-size: 13px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 10px;
  line-height: 1.4;
}

.card-meta {
  margin-bottom: 8px;
}

.meta-label {
  font-size: 11px;
  color: #9e9e9e;
  font-weight: 600;
}

.parks-list {
  margin: 2px 0 0 14px;
  padding: 0;
  list-style: disc;
}

.parks-list li {
  font-size: 11px;
  color: #444;
  line-height: 1.7;
}

.meta-date {
  font-size: 11px;
  color: #9e9e9e;
}

.author-row {
  display: flex;
  align-items: center;
  margin-top: 8px;
}

.author-name {
  font-size: 12px;
  font-weight: 600;
  color: #1a1a2e;
  line-height: 1.3;
}

.author-email {
  font-size: 11px;
  color: #9e9e9e;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px 14px;
  border-top: 1px solid #f5f5f5;
}

.act-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  background: #fff;
  cursor: pointer;
  transition: background 0.15s;
}

.act-btn:hover { background: #f5f5f5; }

.act-delete { color: #e53935; }
.act-delete:hover { background: #fdecea; border-color: #ef9a9a; }

.act-status { color: #1a1a2e; }

.detail-btn {
  display: inline-flex;
  align-items: center;
  margin-left: auto;
  height: 32px;
  padding: 0 12px;
  border-radius: 6px;
  border: 1.5px solid #E8A838;
  background: #fff;
  color: #E8A838;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
}
.detail-btn:hover { background: #fff8ec; }

.edit-btn {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  border: none;
  background: #E8A838;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
}
.edit-btn:hover { background: #d4942b; }

/* ── Pagination ── */
.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.showing-txt {
  font-size: 12px;
  color: #9e9e9e;
}

.pg-btn {
  min-width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  background: #fff;
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
  cursor: pointer;
  padding: 0 8px;
  transition: all 0.15s;
}
.pg-btn:hover:not(:disabled) { background: #f5f5f5; }
.pg-btn:disabled { opacity: 0.4; cursor: default; }
.pg-btn--active { background: #1a1a2e !important; color: #fff !important; border-color: #1a1a2e !important; }

/* ── Alert ── */
.alert-banner {
  border-radius: 10px;
  margin-bottom: 16px;
  padding: 12px 16px;
}
.alert-success { background: #e8f5e9; border: 1px solid #a5d6a7; }
.alert-warning  { background: #fff3e0; border: 1px solid #ffcc80; }
.alert-inner { display: flex; align-items: flex-start; gap: 10px; }
.alert-icon { flex-shrink: 0; margin-top: 2px; }
.alert-body { flex: 1; }
.alert-title { font-size: 13px; font-weight: 700; color: #1a1a2e; }
.alert-sub   { font-size: 12px; color: #555; }
.alert-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  padding: 0;
  flex-shrink: 0;
}

.slide-down-enter-active, .slide-down-leave-active { transition: all 0.3s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
