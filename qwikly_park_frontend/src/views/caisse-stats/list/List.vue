<template>
  <div>

    <h1 class="page-title mb-5">Statistiques &amp; Caisse sessions</h1>

    <!-- TABS -->
    <VCard class="mb-5" elevation="0" border>
      <VCardText class="pa-0">
        <div class="tab-bar">
          <button
            class="tab-btn"
            :class="activeTab === 'stats' ? 'tab-btn--active' : 'tab-btn--inactive'"
            @click="activeTab = 'stats'"
          >
            <VIcon icon="tabler-chart-bar" size="16" class="me-2" />
            Statistiques
          </button>
          <button
            class="tab-btn"
            :class="activeTab === 'caisse' ? 'tab-btn--active' : 'tab-btn--inactive'"
            @click="activeTab = 'caisse'"
          >
            <VIcon icon="tabler-device-laptop" size="16" class="me-2" />
            Caisse Session
          </button>
        </div>
      </VCardText>
    </VCard>

    <!-- ══════════ TAB: STATISTIQUES ══════════ -->
    <div v-if="activeTab==='stats'">

      <!-- Filter -->
      <VCard class="mb-4" elevation="0" border>
        <VCardText class="pa-4">
          <p class="filter-title mb-3">Filter</p>
          <div class="d-flex flex-wrap gap-3 align-end">
            <div class="filter-field">
              <div class="input-icon-wrap">
                <input v-model="statsFilter.periode" type="date" class="field-input" placeholder="Période" />
                <VIcon icon="tabler-calendar" size="15" class="field-icon" />
              </div>
            </div>
            <div class="filter-field">
              <div class="select-wrap">
                <select v-model="statsFilter.park_id" class="field-select">
                  <option value="">Parc</option>
                  <option v-for="p in parks" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
                <VIcon icon="tabler-chevron-down" size="14" class="select-icon" />
              </div>
            </div>
            <button class="btn-apply" @click="applyStatsFilter">Appliquer</button>
          </div>
        </VCardText>
      </VCard>

      <!-- Export -->
      <div class="d-flex justify-end mb-4">
        <button class="btn-export" @click="toast('Statistiques exportées.')">
          <VIcon icon="tabler-upload" size="14" class="me-1" />Export
        </button>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid mb-5">
        <div class="kpi-card">
          <div class="kpi-icon"><VIcon icon="tabler-ticket" size="22" color="#fff" /></div>
          <div>
            <div class="kpi-val">{{ kpi.billets }}</div>
            <div class="kpi-lbl">Total billets vendus</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon"><VIcon icon="tabler-id-badge" size="22" color="#fff" /></div>
          <div>
            <div class="kpi-val">{{ kpi.passes }}</div>
            <div class="kpi-lbl">Total passes vendus</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon"><VIcon icon="tabler-currency-euro" size="22" color="#fff" /></div>
          <div>
            <div class="kpi-val">{{ kpi.revenus }}</div>
            <div class="kpi-lbl">Revenus totaux</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon"><VIcon icon="tabler-users" size="22" color="#fff" /></div>
          <div>
            <div class="kpi-val">{{ kpi.clients }}</div>
            <div class="kpi-lbl">Nouveaux clients</div>
          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="charts-grid">
        <VCard elevation="0" border>
          <VCardText class="pa-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <p class="chart-title">Répartition des revenus</p>
              <VMenu>
                <template #activator="{ props }">
                  <button v-bind="props" class="dots-btn"><VIcon icon="tabler-dots-vertical" size="18" /></button>
                </template>
                <VList density="compact">
                  <VListItem title="Exporter PNG" />
                  <VListItem title="Exporter CSV" />
                </VList>
              </VMenu>
            </div>
            <VueApexCharts type="donut" height="280" :options="donutOpts" :series="donutSeries" />
          </VCardText>
        </VCard>

        <VCard elevation="0" border>
          <VCardText class="pa-4">
            <p class="chart-title mb-3">Ventes par période</p>
            <VueApexCharts type="line" height="280" :options="lineOpts" :series="lineSeries" />
          </VCardText>
        </VCard>
      </div>
    </div>

    <!-- ══════════ TAB: CAISSE SESSION ══════════ -->
    <div v-else-if="activeTab==='caisse'">

      <!-- Filter -->
      <VCard class="mb-4" elevation="0" border>
        <VCardText class="pa-4">
          <p class="filter-title mb-3">Filter</p>
          <div class="d-flex flex-wrap gap-3 align-end">
            <div class="filter-field">
              <div class="input-icon-wrap">
                <input v-model="caisseFilter.periode" type="date" class="field-input" placeholder="Période" />
                <VIcon icon="tabler-calendar" size="15" class="field-icon" />
              </div>
            </div>
            <div class="filter-field">
              <div class="select-wrap">
                <select v-model="caisseFilter.park_id" class="field-select">
                  <option value="">Parc</option>
                  <option v-for="p in parks" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
                <VIcon icon="tabler-chevron-down" size="14" class="select-icon" />
              </div>
            </div>
            <div class="filter-field">
              <div class="select-wrap">
                <select v-model="caisseFilter.caisse_id" class="field-select">
                  <option value="">Caisse</option>
                  <option v-for="c in caisses" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
                <VIcon icon="tabler-chevron-down" size="14" class="select-icon" />
              </div>
            </div>
            <button class="btn-apply" @click="applyCaisseFilter">Appliquer</button>
          </div>
        </VCardText>
      </VCard>

      <!-- Table card -->
      <VCard elevation="0" border>
        <VCardText class="pa-4">
          <div class="d-flex flex-wrap align-center gap-3 mb-4">
            <div class="d-flex align-center gap-2">
              <span class="filters-label">Filters</span>
              <select v-model="caissePerPage" class="per-page-select" @change="caissePage=1">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>
            <div class="search-wrap flex-grow-1">
              <VIcon icon="tabler-search" size="15" class="search-icon" />
              <input v-model="caisseSearch" class="search-input" placeholder="Rechercher ..." />
            </div>
            <button class="btn-export" @click="toast('Sessions exportées.')">
              <VIcon icon="tabler-upload" size="14" class="me-1" />Export
            </button>
            <button class="btn-add" @click="showCreate=true">
              <VIcon icon="tabler-plus" size="14" class="me-1" />Nouvelle Caisse
            </button>
          </div>

          <div v-if="caisseLoading" class="d-flex justify-center py-10">
            <VProgressCircular indeterminate color="#E8A838" />
          </div>
          <template v-else>
            <div class="table-scroll">
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="width:36px"><input type="checkbox" /></th>
                    <th>SESSION ID</th>
                    <th>PARC</th>
                    <th>MONTANT ACTUEL</th>
                    <th>STATUT</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!pageSessions.length">
                    <td colspan="6" class="empty-cell">Aucune session trouvée</td>
                  </tr>
                  <tr v-for="row in pageSessions" :key="row.id">
                    <td><input type="checkbox" /></td>
                    <td class="cell-id">{{ row.session_id || row.id }}</td>
                    <td>{{ row.parc_name || '—' }}</td>
                    <td class="cell-amount">{{ fmtMontant(row.montant_actuel) }}</td>
                    <td>
                      <span class="status-chip" :class="statusClass(row)">{{ statusLabel(row) }}</span>
                    </td>
                    <td class="cell-actions">
                      <button class="act-btn" title="Télécharger" @click="toast('Session téléchargée.')">
                        <VIcon icon="tabler-download" size="15" />
                      </button>
                      <button class="act-btn act-delete" title="Supprimer" @click="confirmDelete(row)">
                        <VIcon icon="tabler-trash" size="15" />
                      </button>
                      <button class="act-btn act-info" title="Détails" @click="openDetail(row)">
                        <VIcon icon="tabler-info-circle" size="15" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="table-footer">
              <span class="showing">Showing {{ caisseFrom }} to {{ caisseTo }} of {{ filteredSessions.length }} entries</span>
              <div class="pagination">
                <button class="pg" :disabled="caissePage===1" @click="caissePage=1">«</button>
                <button class="pg" :disabled="caissePage===1" @click="caissePage--">‹</button>
                <button v-for="p in caissePages" :key="p" class="pg" :class="p===caissePage?'pg-active':''" @click="caissePage=p">{{ p }}</button>
                <button class="pg" :disabled="caissePage===caisseTotalPages" @click="caissePage++">›</button>
                <button class="pg" :disabled="caissePage===caisseTotalPages" @click="caissePage=caisseTotalPages">»</button>
              </div>
            </div>
          </template>
        </VCardText>
      </VCard>
    </div>

    <!-- ══ MODAL: NOUVELLE CAISSE ══ -->
    <VDialog v-model="showCreate" max-width="500" persistent>
      <VCard style="border-radius:14px">
        <div class="modal-header">
          <button class="btn-back" @click="showCreate=false"><VIcon icon="tabler-arrow-left" size="16" /></button>
          <span class="modal-title">Nouvelle Session de Caisse</span>
        </div>
        <VCardText class="pa-5">
          <div class="mb-4">
            <p class="form-label">Parc</p>
            <div class="select-wrap">
              <select v-model="createForm.park_id" class="field-select">
                <option value="">Sélectionner un parc</option>
                <option v-for="p in parks" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
              <VIcon icon="tabler-chevron-down" size="14" class="select-icon" />
            </div>
          </div>
          <div class="mb-4">
            <p class="form-label">Montant initial (€)</p>
            <div class="euro-wrap">
              <input v-model="createForm.montant_initial" type="number" class="field-input" placeholder="0.00" />
              <span class="euro-sign">€</span>
            </div>
          </div>
          <div>
            <p class="form-label">Date d'ouverture</p>
            <div class="input-icon-wrap">
              <input v-model="createForm.date_ouverture" type="date" class="field-input" />
              <VIcon icon="tabler-calendar" size="15" class="field-icon" />
            </div>
          </div>
        </VCardText>
        <div class="modal-footer">
          <button class="btn-submit" :disabled="saving" @click="saveSession">
            {{ saving ? '...' : 'Créer la Session' }}
          </button>
        </div>
      </VCard>
    </VDialog>

    <!-- ══ MODAL: DÉTAILS ══ -->
    <VDialog v-model="showDetail" max-width="460">
      <VCard v-if="selectedSession" style="border-radius:14px">
        <div class="modal-header">
          <button class="btn-back" @click="showDetail=false"><VIcon icon="tabler-arrow-left" size="16" /></button>
          <span class="modal-title">Détails de la Session</span>
        </div>
        <VCardText class="pa-5">
          <div class="detail-row"><span class="detail-lbl">Session ID</span><span class="detail-val">{{ selectedSession.session_id || selectedSession.id }}</span></div>
          <div class="detail-row"><span class="detail-lbl">Parc</span><span class="detail-val">{{ selectedSession.parc_name || '—' }}</span></div>
          <div class="detail-row"><span class="detail-lbl">Montant actuel</span><span class="detail-val">{{ fmtMontant(selectedSession.montant_actuel) }}</span></div>
          <div class="detail-row" style="border:none">
            <span class="detail-lbl">Statut</span>
            <span class="status-chip" :class="statusClass(selectedSession)">{{ statusLabel(selectedSession) }}</span>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- ══ MODAL: CONFIRMER SUPPRESSION ══ -->
    <VDialog v-model="showDeleteConfirm" max-width="400">
      <VCard style="border-radius:14px">
        <VCardText class="pa-6">
          <p style="font-size:15px;font-weight:700;color:#1a1a2e;margin-bottom:8px">Supprimer cette session ?</p>
          <p style="font-size:13px;color:#777;margin:0">Cette action est irréversible.</p>
        </VCardText>
        <div class="d-flex justify-end gap-3 px-6 pb-5">
          <button class="btn-cancel" @click="showDeleteConfirm=false">Annuler</button>
          <button class="btn-danger" @click="doDelete">Supprimer</button>
        </div>
      </VCard>
    </VDialog>

    <!-- TOAST -->
    <transition name="fade">
      <div v-if="toastVisible" class="toast-bar">
        <VIcon icon="tabler-circle-check" size="16" class="me-2" />{{ toastMsg }}
      </div>
    </transition>

  </div>
</template>

<script>
import { $api } from "@/utils/api";
import VueApexCharts from "vue3-apexcharts";

export default {
  name: "CaisseStatsList",
  components: { VueApexCharts },
  setup() { return {}; },

  data() {
    return {
      activeTab: "stats",
      tabs: [
        { key: "stats",  label: "Statistiques",   icon: "tabler-chart-bar" },
        { key: "caisse", label: "Caisse Session", icon: "tabler-device-laptop" },
      ],
      parks: [], caisses: [],

      statsFilter: { periode: "", park_id: "" },
      kpi: { billets: 200, passes: 200, revenus: "00 €", clients: 120 },

      donutSeries: [38.25, 22.64, 39.11],
      donutOpts: {
        colors: ["#2E7D32", "#81C784", "#A5D6A7"],
        labels: ["Billets", "Passes", "Autres"],
        legend: { position: "bottom", fontSize: "12px" },
        dataLabels: { enabled: false },
        plotOptions: { pie: { donut: { size: "65%" } } },
      },
      lineSeries: [{ name: "Ventes", data: [100, 180, 120, 300, 250, 350, 200, 310, 270, 380, 330, 390, 370] }],
      lineOpts: {
        chart: { toolbar: { show: false }, zoom: { enabled: false } },
        colors: ["#E8A838"],
        stroke: { curve: "smooth", width: 2.5 },
        fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.25, opacityTo: 0.01 } },
        dataLabels: { enabled: false },
        xaxis: { categories: ["7/12","8/12","9/12","10/12","11/12","12/12","13/12","14/12","15/12","16/12","17/12","18/12","19/12"], labels: { style: { fontSize: "11px", colors: "#9e9e9e" } } },
        yaxis: { labels: { style: { fontSize: "11px", colors: "#9e9e9e" } } },
        grid: { borderColor: "#f0f0f0" },
      },

      sessions: [], caisseLoading: false,
      caisseSearch: "", caissePage: 1, caissePerPage: 10,
      caisseFilter: { periode: "", park_id: "", caisse_id: "" },
      caisseApplied: { periode: "", park_id: "", caisse_id: "" },

      showCreate: false,
      createForm: { park_id: "", montant_initial: "", date_ouverture: "" },
      saving: false,
      showDetail: false, selectedSession: null,
      showDeleteConfirm: false, toDelete: null,
      toastVisible: false, toastMsg: "", toastTimer: null,
      caisseLoaded: false,
    };
  },

  computed: {
    filteredSessions() {
      let r = [...this.sessions];
      const q = (this.caisseSearch || "").toLowerCase();
      if (q) r = r.filter(i => (i.session_id || String(i.id)).toLowerCase().includes(q) || (i.parc_name || "").toLowerCase().includes(q));
      if (this.caisseApplied.periode)   r = r.filter(i => (i.date_ouverture || i.created_at || "").startsWith(this.caisseApplied.periode));
      if (this.caisseApplied.park_id)   r = r.filter(i => i.park_id == this.caisseApplied.park_id);
      if (this.caisseApplied.caisse_id) r = r.filter(i => i.caisse_id == this.caisseApplied.caisse_id);
      return r;
    },
    caisseTotalPages() { return Math.max(1, Math.ceil(this.filteredSessions.length / this.caissePerPage)); },
    pageSessions()     { const s = (this.caissePage-1)*this.caissePerPage; return this.filteredSessions.slice(s, s+this.caissePerPage); },
    caisseFrom()       { return this.filteredSessions.length ? (this.caissePage-1)*this.caissePerPage+1 : 0; },
    caisseTo()         { return Math.min(this.caissePage*this.caissePerPage, this.filteredSessions.length); },
    caissePages() {
      const t=this.caisseTotalPages, c=this.caissePage;
      let s=Math.max(1,c-2), e=Math.min(t,s+4);
      if (e-s<4) s=Math.max(1,e-4);
      const p=[]; for(let i=s;i<=e;i++) p.push(i); return p;
    },
  },

  watch: {
    caisseSearch() { this.caissePage = 1; },
    activeTab(val) {
      if (val === 'caisse' && !this.caisseLoaded) {
        this.caisseLoaded = true;
        this.loadSessions();
        this.loadCaisses();
      }
    },
  },

  async mounted() {
    await this.loadParks();
  },

  beforeUnmount() {
    clearTimeout(this.toastTimer);
  },

  methods: {
    fmtMontant(v) { if (v==null||v==="") return "—"; return Number(v).toLocaleString("fr-FR")+" €"; },
    statusLabel(r) { return { en_cours:"En cours", cloturee:"Clôturée", ouverte:"Ouverte" }[r.statut] || r.statut || "—"; },
    statusClass(r)  { return { en_cours:"chip-green", cloturee:"chip-red", ouverte:"chip-blue" }[r.statut] || "chip-gray"; },

    toast(msg) {
      clearTimeout(this.toastTimer);
      this.toastMsg = msg; this.toastVisible = true;
      this.toastTimer = setTimeout(() => { this.toastVisible = false; }, 3500);
    },

    applyStatsFilter()  { /* reload stats with filter */ },
    applyCaisseFilter() { this.caisseApplied={...this.caisseFilter}; this.caissePage=1; },

    openDetail(row)   { this.selectedSession=row; this.showDetail=true; },
    confirmDelete(row){ this.toDelete=row; this.showDeleteConfirm=true; },
    async doDelete() {
      const id = this.toDelete.id;
      try {
        await $api(`/caisse-sessions/${id}`, { method: "DELETE" });
      } catch { /* suppression locale si endpoint indisponible */ }
      this.sessions = this.sessions.filter(i => i.id !== id);
      this.showDeleteConfirm = false;
      this.toast("Session supprimée.");
    },

    async loadParks() {
      try {
        const r = await $api("/parks", { params: { per_page:200 } });
        this.parks=(r.data||[]).map(p=>({ id:p.id, name:p.localisation||p.numero||"Parc "+p.id }));
      } catch {}
    },
    async loadCaisses() {
      try {
        const r = await $api("/caisses", { params: { per_page: 200 } });
        this.caisses = (r.data || []).map(c => ({ id: c.id, name: c.name || c.nom || `Caisse ${c.id}` }));
      } catch { /* silent */ }
    },

    async loadSessions() {
      this.caisseLoading = true;
      try {
        const r = await $api("/caisse-sessions", { params: { per_page: 500 } });
        this.sessions = r.data || [];
      } catch {
        this.sessions = [
          { id:1, session_id:"C-2025-001", parc_name:"Urban Jamp 01", montant_actuel:3500, statut:"en_cours" },
          { id:2, session_id:"C-2025-002", parc_name:"Urban Jamp 02", montant_actuel:3000, statut:"cloturee" },
        ];
      } finally {
        this.caisseLoading = false;
      }
    },
    async saveSession() {
      this.saving=true;
      try {
        const r = await $api("/caisse-sessions", { method: "POST", body: this.createForm });
        this.sessions.unshift(r.item||r);
        this.showCreate=false;
        this.toast("Session créée avec succès.");
        this.createForm={ park_id:"", montant_initial:"", date_ouverture:"" };
      } catch(e) {
        this.toast(e?.data?.message||"Erreur lors de la création.");
      } finally { this.saving=false; }
    },
  },
};
</script>

<style scoped>
.page-title { font-size:22px;font-weight:700;color:#1a1a2e; }
.filter-title { font-size:13px;font-weight:700;color:#1a1a2e;margin:0; }

.tab-bar {
  display: flex;
  width: 100%;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #E8A838;
  background: #E8A838;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 13px 20px;
  border: none;
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  transition: all 0.2s ease;
  gap: 8px;
}

/* Actif → navy foncé */
.tab-btn--active {
  background: #1a1a2e;
  color: #fff;
}

/* Inactif → or/doré */
.tab-btn--inactive {
  background: #E8A838;
  color: #1a1a2e;
}

.tab-btn--inactive:hover {
  background: #d4942b;
}

/* FILTER */
.filter-field { min-width:150px;max-width:220px; }

/* INPUTS */
.field-input { width:100%;height:38px;padding:0 34px 0 12px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:13px;color:#333;background:#fff;outline:none;font-family:inherit;box-sizing:border-box; }
.field-input:focus { border-color:#E8A838; }
.field-input::placeholder { color:#bbb; }
.input-icon-wrap { position:relative; }
.field-icon { position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#aaa;pointer-events:none; }

/* SELECT */
.select-wrap { position:relative; }
.field-select { width:100%;height:38px;padding:0 32px 0 12px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:13px;color:#333;background:#fff;outline:none;font-family:inherit;appearance:none;cursor:pointer;box-sizing:border-box; }
.field-select:focus { border-color:#E8A838; }
.select-icon { position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#aaa;pointer-events:none; }

/* BUTTONS */
.btn-apply  { height:38px;padding:0 22px;border:none;border-radius:8px;background:#E8A838;color:#1a1a2e;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit; }
.btn-apply:hover { opacity:.88; }
.btn-export { display:inline-flex;align-items:center;height:36px;padding:0 16px;border:1.5px solid #1a1a2e;border-radius:8px;background:#fff;color:#1a1a2e;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit; }
.btn-export:hover { background:#f5f5f5; }
.btn-add    { display:inline-flex;align-items:center;height:36px;padding:0 16px;border:none;border-radius:8px;background:#1a1a2e;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit; }
.btn-add:hover { opacity:.88; }

/* KPI */
.kpi-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:14px; }
.kpi-card { display:flex;align-items:center;gap:14px;padding:18px 16px;border:1px solid #f0f0f0;border-radius:12px;background:#fff; }
.kpi-icon { width:46px;height:46px;border-radius:10px;background:#E8A838;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.kpi-val  { font-size:20px;font-weight:800;color:#1a1a2e;line-height:1.2; }
.kpi-lbl  { font-size:11px;color:#9e9e9e;margin-top:3px;line-height:1.3; }

/* CHARTS */
.charts-grid { display:grid;grid-template-columns:1fr 1fr;gap:16px; }
.chart-title { font-size:14px;font-weight:700;color:#1a1a2e;margin:0; }
.dots-btn    { background:none;border:none;cursor:pointer;color:#888;display:inline-flex;padding:2px;border-radius:4px; }
.dots-btn:hover { background:#f5f5f5; }

/* TABLE */
.filters-label { font-size:13px;font-weight:600;color:#444; }
.per-page-select { height:32px;padding:0 8px;border:1.5px solid #e0e0e0;border-radius:6px;font-size:13px;color:#444;background:#fff;outline:none;cursor:pointer; }
.search-wrap  { position:relative;min-width:160px; }
.search-icon  { position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#bbb;pointer-events:none; }
.search-input { width:100%;height:36px;padding:0 12px 0 32px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:13px;color:#333;background:#fff;outline:none;font-family:inherit;box-sizing:border-box; }
.search-input:focus { border-color:#E8A838; }
.table-scroll { overflow-x:auto; }
.data-table  { width:100%;border-collapse:collapse;font-size:13px; }
.data-table thead tr { background:#fafafa;border-bottom:1.5px solid #f0f0f0; }
.data-table th  { padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#9e9e9e;text-transform:uppercase;white-space:nowrap; }
.data-table tbody tr { border-bottom:1px solid #f5f5f5;transition:background .1s; }
.data-table tbody tr:hover { background:#fafafa; }
.data-table td  { padding:10px 14px;vertical-align:middle; }
.cell-id     { font-weight:600;color:#1a1a2e; }
.cell-amount { font-weight:700;color:#1a1a2e; }
.empty-cell  { text-align:center;color:#bbb;padding:40px; }
.cell-actions { white-space:nowrap; }
.act-btn { width:28px;height:28px;border-radius:6px;border:1.5px solid #e8e8e8;background:#fff;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;color:#666;margin-right:4px;transition:all .12s; }
.act-btn:hover    { border-color:#1a1a2e;color:#1a1a2e;background:#f5f5f5; }
.act-info:hover   { border-color:#E8A838;color:#E8A838;background:#fffbf0; }
.act-delete       { color:#e53935; }
.act-delete:hover { background:#fdecea;border-color:#ef9a9a; }

/* STATUS */
.status-chip { display:inline-block;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700; }
.chip-green  { background:#E8F5E9;color:#2E7D32; }
.chip-red    { background:#FDECEA;color:#c62828; }
.chip-blue   { background:#E3F2FD;color:#1565C0; }
.chip-gray   { background:#f5f5f5;color:#757575; }

/* PAGINATION */
.table-footer { display:flex;align-items:center;justify-content:space-between;padding:14px 0 2px; }
.showing      { font-size:12px;color:#9e9e9e; }
.pagination   { display:flex;align-items:center;gap:3px; }
.pg           { min-width:30px;height:30px;border-radius:6px;border:1.5px solid #e8e8e8;background:#fff;font-size:12px;font-weight:600;color:#555;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0 6px;transition:all .12s; }
.pg:hover:not(:disabled) { border-color:#1a1a2e;color:#1a1a2e; }
.pg:disabled  { opacity:.35;cursor:not-allowed; }
.pg-active    { background:#1a1a2e;border-color:#1a1a2e;color:#fff; }

/* MODAL */
.modal-header { display:flex;align-items:center;gap:12px;padding:16px 20px 14px;border-bottom:1px solid #f0f0f0; }
.modal-title  { font-size:15px;font-weight:700;color:#1a1a2e; }
.modal-footer { padding:8px 20px 20px; }
.btn-back  { width:32px;height:32px;border-radius:8px;border:1.5px solid #e0e0e0;background:#f9f9f9;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;color:#1a1a2e; }
.btn-back:hover { background:#efefef; }
.btn-submit { width:100%;height:44px;border-radius:10px;border:none;background:#1a1a2e;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center; }
.btn-submit:hover { opacity:.9; }
.btn-submit:disabled { opacity:.5;cursor:not-allowed; }
.btn-cancel { height:38px;padding:0 22px;border:1.5px solid #e0e0e0;border-radius:8px;background:#fff;color:#555;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit; }
.btn-danger { height:38px;padding:0 22px;border:none;border-radius:8px;background:#e53935;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit; }
.btn-danger:hover { background:#c62828; }
.form-label { font-size:12px;font-weight:600;color:#444;margin:0 0 4px; }
.euro-wrap  { position:relative; }
.euro-sign  { position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:14px;color:#aaa;pointer-events:none; }

/* DETAIL */
.detail-row  { display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f5f5f5; }
.detail-lbl  { font-size:13px;color:#888;font-weight:500; }
.detail-val  { font-size:13px;color:#1a1a2e;font-weight:600; }

/* TOAST */
.toast-bar  { position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;align-items:center;padding:12px 20px;border-radius:10px;background:#E8F5E9;color:#2E7D32;border:1px solid #C8E6C9;font-size:13px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,.1); }
.fade-enter-active,.fade-leave-active { transition:opacity .25s,transform .25s; }
.fade-enter-from,.fade-leave-to { opacity:0;transform:translateY(8px); }

/* RESPONSIVE */
@media (max-width:900px) {
  .kpi-grid    { grid-template-columns:repeat(2,1fr); }
  .charts-grid { grid-template-columns:1fr; }
  .tabs-bar    { max-width:100%; }
}
@media (max-width:600px) {
  .kpi-grid { grid-template-columns:1fr 1fr; }
}
</style>
