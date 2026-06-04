<template>
  <div class="dashboard">

    <!-- ══════════════════════════════════════
         HEADER + FILTRES
    ══════════════════════════════════════ -->
    <div class="d-flex align-center justify-space-between flex-wrap gap-3 mb-5">
      <div>
        <h1 class="text-h5 font-weight-bold" style="color:#1a1a2e">Tableau de bord</h1>
        <span style="font-size:13px; color:#9e9e9e">Vue globale — tous les parcs</span>
      </div>
      <div class="d-flex align-center gap-3 flex-wrap">
        <!-- Filtre Parc -->
        <VSelect
          v-model="filterParc"
          :items="parcOptions"
          item-title="name" item-value="id"
          placeholder="Tous les parcs"
          hide-details clearable density="compact" variant="outlined"
          style="min-width:170px; max-width:200px"
          @update:model-value="loadAll"
        />
        <!-- Filtre Période -->
        <div class="period-toggle">
          <button
            v-for="p in periods" :key="p.value"
            class="period-btn"
            :class="filterPeriod === p.value ? 'period-btn--active' : ''"
            @click="filterPeriod = p.value; loadAll()"
          >{{ p.label }}</button>
        </div>
        <!-- Refresh -->
        <VBtn icon variant="text" size="small" @click="loadAll" :loading="globalLoading">
          <VIcon icon="tabler-refresh" size="20" />
        </VBtn>
      </div>
    </div>

    <!-- ══════════════════════════════════════
         KPI CARDS — Row 1
    ══════════════════════════════════════ -->
    <VRow class="mb-4">
      <VCol v-for="kpi in kpiCards" :key="kpi.key" cols="12" sm="6" md="3">
        <VCard class="kpi-card" :class="kpi.alert ? 'kpi-card--alert' : ''">
          <VCardText class="pa-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="kpi-icon-wrap" :style="`background:${kpi.iconBg}`">
                <VIcon :icon="kpi.icon" :color="kpi.iconColor" size="22" />
              </div>
              <VChip
                v-if="kpi.trend !== null"
                :color="kpi.trend >= 0 ? 'success' : 'error'"
                size="x-small" class="font-weight-bold"
              >
                <VIcon :icon="kpi.trend >= 0 ? 'tabler-trending-up' : 'tabler-trending-down'" size="12" class="me-1" />
                {{ Math.abs(kpi.trend) }}%
              </VChip>
              <VChip v-if="kpi.alert" color="error" size="x-small">
                <VIcon icon="tabler-alert-triangle" size="12" class="me-1" />Alerte
              </VChip>
            </div>
            <div class="kpi-value">{{ kpi.loading ? '...' : kpi.value }}</div>
            <div class="kpi-label">{{ kpi.label }}</div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- ══════════════════════════════════════
         CHARTS — Row 2
    ══════════════════════════════════════ -->
    <VRow class="mb-4">
      <!-- Évolution des ventes -->
      <VCol cols="12" md="8">
        <VCard>
          <VCardText class="pa-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <div>
                <div class="text-subtitle-1 font-weight-bold" style="color:#1a1a2e">Évolution des ventes</div>
                <div style="font-size:12px; color:#9e9e9e">Billets + Passes par période</div>
              </div>
              <VSelect
                v-model="chartGroupBy"
                :items="[{value:'day',title:'Jour'},{value:'week',title:'Semaine'},{value:'month',title:'Mois'}]"
                hide-details density="compact" variant="outlined"
                style="max-width:110px"
                @update:model-value="loadCharts"
              />
            </div>
            <VueApexCharts
              v-if="!chartsLoading"
              type="area"
              height="280"
              :options="salesChartOptions"
              :series="salesChartSeries"
            />
            <div v-else class="d-flex justify-center align-center" style="height:280px">
              <VProgressCircular indeterminate color="#E8A838" size="40" />
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Répartition des revenus -->
      <VCol cols="12" md="4">
        <VCard>
          <VCardText class="pa-4">
            <div class="text-subtitle-1 font-weight-bold mb-1" style="color:#1a1a2e">Répartition des revenus</div>
            <div style="font-size:12px; color:#9e9e9e" class="mb-3">Par type de vente</div>
            <VueApexCharts
              v-if="!chartsLoading"
              type="donut"
              height="260"
              :options="donutChartOptions"
              :series="donutChartSeries"
            />
            <div v-else class="d-flex justify-center align-center" style="height:260px">
              <VProgressCircular indeterminate color="#E8A838" size="40" />
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- ══════════════════════════════════════
         ROW 3 — Top Parcs + Alertes + Activités
    ══════════════════════════════════════ -->
    <VRow>
      <!-- Top Parcs -->
      <VCol cols="12" md="5">
        <VCard>
          <VCardText class="pa-4">
            <div class="text-subtitle-1 font-weight-bold mb-3" style="color:#1a1a2e">
              <VIcon icon="tabler-trophy" color="#E8A838" size="18" class="me-1" />
              Top Parcs — Revenus
            </div>
            <div v-if="topParcs.length">
              <div v-for="(parc, i) in topParcs" :key="parc.id" class="top-parc-row">
                <div class="top-parc-rank" :style="i < 3 ? 'color:#E8A838;font-weight:800' : ''">
                  #{{ i + 1 }}
                </div>
                <div class="flex-grow-1">
                  <div style="font-size:13px; font-weight:600">{{ parc.name || parc.localisation }}</div>
                  <div style="font-size:11px; color:#9e9e9e">{{ parc.franchise?.name || '' }}</div>
                </div>
                <div class="text-right">
                  <div style="font-size:13px; font-weight:700; color:#1a1a2e">
                    {{ (parc.total_revenue || 0).toLocaleString('fr-FR') }} €
                  </div>
                  <div style="font-size:11px; color:#9e9e9e">{{ parc.total_orders || 0 }} commandes</div>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-medium-emphasis py-6" style="font-size:13px">
              Aucune donnée disponible
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Alertes stock -->
      <VCol cols="12" md="3">
        <VCard style="border: 1.5px solid #FFE0B2">
          <VCardText class="pa-4">
            <div class="text-subtitle-1 font-weight-bold mb-3" style="color:#1a1a2e">
              <VIcon icon="tabler-alert-triangle" color="warning" size="18" class="me-1" />
              Alertes Stock
            </div>
            <div v-if="stockAlerts.length">
              <div v-for="alert in stockAlerts" :key="alert.id" class="alert-row">
                <div class="flex-grow-1">
                  <div style="font-size:13px; font-weight:600">{{ alert.name }}</div>
                  <div style="font-size:11px; color:#9e9e9e">{{ alert.park?.localisation || '' }}</div>
                </div>
                <VChip
                  :color="alert.status === 'rupture' ? 'error' : 'warning'"
                  size="x-small" class="font-weight-bold"
                >
                  {{ alert.status === 'rupture' ? 'Rupture' : 'Stock bas' }}
                </VChip>
              </div>
            </div>
            <div v-else class="text-center py-6">
              <VIcon icon="tabler-circle-check" color="success" size="32" class="mb-2" />
              <div style="font-size:13px; color:#9e9e9e">Aucune alerte</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Activités récentes -->
      <VCol cols="12" md="4">
        <VCard>
          <VCardText class="pa-4">
            <div class="text-subtitle-1 font-weight-bold mb-3" style="color:#1a1a2e">
              <VIcon icon="tabler-activity" color="#1a1a2e" size="18" class="me-1" />
              Activités récentes
            </div>
            <div v-if="recentActivities.length">
              <div v-for="act in recentActivities" :key="act.id" class="activity-row">
                <div class="activity-dot" :style="`background:${actColor(act.type)}`"></div>
                <div class="flex-grow-1">
                  <div style="font-size:12px; font-weight:500">{{ act.description }}</div>
                  <div style="font-size:11px; color:#9e9e9e">{{ act.park }} · {{ formatTime(act.created_at) }}</div>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-medium-emphasis py-6" style="font-size:13px">
              Aucune activité récente
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

  </div>
</template>

<script>
import { $api } from "@/utils/api";
import VueApexCharts from "vue3-apexcharts";

export default {
  components: { VueApexCharts },

  setup() { return {}; },

  data() {
    return {
      // ── Filtres ──
      filterParc:   null,
      filterPeriod: "month",
      chartGroupBy: "month",

      periods: [
        { label: "7j",    value: "week"  },
        { label: "30j",   value: "month" },
        { label: "90j",   value: "quarter" },
        { label: "1an",   value: "year"  },
      ],

      parcOptions: [],
      globalLoading: false,
      chartsLoading: false,

      // ── KPI Cards ──
      kpiCards: [
        { key: "revenus",    label: "Revenus totaux",        icon: "tabler-currency-euro",     iconBg: "#FFF8E1", iconColor: "#E8A838", value: "0 €",  trend: null,  loading: true, alert: false },
        { key: "billets",    label: "Total billets vendus",  icon: "tabler-ticket",            iconBg: "#E3F2FD", iconColor: "#1976D2", value: "0",    trend: null,  loading: true, alert: false },
        { key: "passes",     label: "Passes actifs",         icon: "tabler-id-badge",          iconBg: "#E8F5E9", iconColor: "#388E3C", value: "0",    trend: null,  loading: true, alert: false },
        { key: "clients",    label: "Total clients",         icon: "tabler-users",             iconBg: "#F3E5F5", iconColor: "#7B1FA2", value: "0",    trend: null,  loading: true, alert: false },
        { key: "nouveaux",   label: "Nouveaux clients",      icon: "tabler-user-plus",         iconBg: "#E1F5FE", iconColor: "#0288D1", value: "0",    trend: null,  loading: true, alert: false },
        { key: "evenements", label: "Événements actifs",     icon: "tabler-calendar-event",    iconBg: "#FCE4EC", iconColor: "#C2185B", value: "0",    trend: null,  loading: true, alert: false },
        { key: "sessions",   label: "Sessions de caisse",    icon: "tabler-cash-register",     iconBg: "#E0F2F1", iconColor: "#00796B", value: "0",    trend: null,  loading: true, alert: false },
        { key: "stock",      label: "Alertes stock",         icon: "tabler-alert-triangle",    iconBg: "#FFF3E0", iconColor: "#E65100", value: "0",    trend: null,  loading: true, alert: false },
      ],

      // ── Charts ──
      salesChartSeries: [
        { name: "Billets",  data: [] },
        { name: "Passes",   data: [] },
        { name: "Revenus",  data: [] },
      ],
      salesChartOptions: {
        chart:  { toolbar: { show: false }, zoom: { enabled: false } },
        colors: ["#1a1a2e", "#E8A838", "#4CAF50"],
        stroke: { curve: "smooth", width: 2.5 },
        fill:   { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05 } },
        xaxis:  { categories: [], labels: { style: { fontSize: "11px", colors: "#9e9e9e" } } },
        yaxis:  { labels: { style: { fontSize: "11px", colors: "#9e9e9e" }, formatter: (v) => v.toLocaleString("fr-FR") } },
        legend: { position: "top", fontSize: "12px" },
        grid:   { borderColor: "#f5f5f5" },
        tooltip: { y: { formatter: (v) => v.toLocaleString("fr-FR") } },
        dataLabels: { enabled: false },
      },

      donutChartSeries:  [0, 0, 0],
      donutChartOptions: {
        colors: ["#1a1a2e", "#E8A838", "#4CAF50"],
        labels: ["Billets", "Passes", "Événements"],
        legend: { position: "bottom", fontSize: "12px" },
        dataLabels: { style: { fontSize: "11px" } },
        plotOptions: {
          pie: {
            donut: {
              size: "65%",
              labels: {
                show: true,
                total: {
                  show: true,
                  label: "Total",
                  formatter: (w) => {
                    const s = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                    return s.toLocaleString("fr-FR") + " €";
                  },
                },
              },
            },
          },
        },
        tooltip: { y: { formatter: (v) => v.toLocaleString("fr-FR") + " €" } },
      },

      // ── Tables ──
      topParcs:         [],
      stockAlerts:      [],
      recentActivities: [],
    };
  },

  async mounted() {
    await this.loadParcs();
    await this.loadAll();
  },

  methods: {
    // ─────────────────────────────────────────
    async loadAll() {
      this.globalLoading = true;
      await Promise.allSettled([
        this.loadKpis(),
        this.loadCharts(),
        this.loadTopParcs(),
        this.loadStockAlerts(),
        this.loadRecentActivities(),
      ]);
      this.globalLoading = false;
    },

    // ── Parcs pour le filtre ──
    async loadParcs() {
      try {
        const res = await $api("/parks", { params: { per_page: 100 } });
        const parks = res.data || [];
        this.parcOptions = parks.map((p) => ({
          id:   p.id,
          name: p.name || p.city || `Parc ${p.id}`,
        }));
      } catch (e) {
        console.error("Erreur chargement parcs:", e);
      }
    },

    // ── KPIs ──
    async loadKpis() {
      this.kpiCards.forEach((k) => (k.loading = true));
      try {
        const res = await $api("/dashboard/stats");
        const d = res.data;
        const rev = d.revenue?.total ?? 0;
        this.setKpi("revenus",    rev.toLocaleString("fr-FR") + " €", null);
        this.setKpi("billets",    d.orders?.total         ?? 0, null);
        this.setKpi("passes",     "—",                           null);
        this.setKpi("clients",    d.clients?.total        ?? 0, null);
        this.setKpi("nouveaux",   d.clients?.registered   ?? 0, null);
        this.setKpi("evenements", "—",                           null);
        this.setKpi("sessions",   d.sessions?.active      ?? 0, null);
        this.setKpi("stock",      "—",                           null, false);
      } catch (e) {
        console.error("KPI load error:", e);
        this.kpiCards.forEach((k) => (k.loading = false));
      }
      this.kpiCards.forEach((k) => (k.loading = false));
    },

    setKpi(key, value, trend = null, alert = false) {
      const k = this.kpiCards.find((c) => c.key === key);
      if (k) { k.value = value; k.trend = trend; k.alert = alert; k.loading = false; }
    },

    // ── Charts ──
    async loadCharts() {
      this.chartsLoading = true;
      const labels = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
      try {
        const res = await $api("/dashboard/charts", { params: { year: new Date().getFullYear() } });
        const months = res.data || [];
        this.salesChartOptions = {
          ...this.salesChartOptions,
          xaxis: { ...this.salesChartOptions.xaxis, categories: labels },
        };
        this.salesChartSeries = [
          { name: "Commandes", data: months.map((m) => m.orders  ?? 0) },
          { name: "Clients",   data: months.map((m) => m.clients ?? 0) },
          { name: "Revenus",   data: months.map((m) => m.revenue ?? 0) },
        ];
        const totalRev = months.reduce((s, m) => s + (m.revenue ?? 0), 0);
        this.donutChartSeries = [totalRev, 0, 0];
      } catch (e) {
        console.error("Charts load error:", e);
        this.salesChartOptions = {
          ...this.salesChartOptions,
          xaxis: { ...this.salesChartOptions.xaxis, categories: labels },
        };
        this.salesChartSeries = [
          { name: "Commandes", data: [0,0,0,0,0,0,0,0,0,0,0,0] },
          { name: "Clients",   data: [0,0,0,0,0,0,0,0,0,0,0,0] },
          { name: "Revenus",   data: [0,0,0,0,0,0,0,0,0,0,0,0] },
        ];
        this.donutChartSeries = [0, 0, 0];
      } finally {
        this.chartsLoading = false;
      }
    },

    // ── Top Parcs ──
    async loadTopParcs() {
      try {
        const res = await $api("/dashboard/top-parks", { params: { limit: 10 } });
        const all = Array.isArray(res) ? res : (res.data || []);
        this.topParcs = all.slice(0, 10);
      } catch (e) {
        console.error("Top parks error:", e);
        this.topParcs = [];
      }
    },

    // ── Alertes stock ──
    async loadStockAlerts() {
      try {
        const res = await $api("/stock/alerts", { params: { limit: 5 } });
        this.stockAlerts = res.data || [];
      } catch {
        this.stockAlerts = [];
      }
    },

    // ── Activités récentes ──
    async loadRecentActivities() {
      try {
        const today    = new Date().toISOString().split("T")[0];
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const res = await $api("/activity-histories", {
          params: { per_page: 8, start_date: monthAgo, end_date: today },
        });
        this.recentActivities = (res.data || []).map((a) => ({
          id:          a.id,
          description: a.action || "Activité",
          type:        a.model?.toLowerCase() || "default",
          park:        a.user?.name || "",
          created_at:  a.created_at,
        }));
      } catch (e) {
        console.error("Activities error:", e);
        this.recentActivities = [];
      }
    },

    // ── Helpers ──
    actColor(type) {
      const map = {
        purchase: "#4CAF50", client: "#1976D2", event: "#C2185B",
        session: "#00796B", stock: "#E65100", default: "#9e9e9e",
      };
      return map[type] || map.default;
    },

    formatTime(d) {
      if (!d) return "";
      const dt  = new Date(d);
      const now = new Date();
      const diff = Math.floor((now - dt) / 60000);
      if (diff < 60)  return `il y a ${diff}min`;
      if (diff < 1440) return `il y a ${Math.floor(diff/60)}h`;
      return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}`;
    },
  },
};
</script>

<style scoped>
.dashboard { padding: 4px; }

/* ── Période toggle ── */
.period-toggle {
  display: flex;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}
.period-btn {
  padding: 7px 14px;
  border: none;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  transition: all 0.2s;
}
.period-btn--active { background: #1a1a2e; color: #fff; }

/* ── KPI Cards ── */
.kpi-card { border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.06) !important; transition: transform 0.2s; }
.kpi-card:hover { transform: translateY(-2px); }
.kpi-card--alert { border: 1.5px solid #FF8A65 !important; }
.kpi-icon-wrap {
  width: 44px; height: 44px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
}
.kpi-value { font-size: 24px; font-weight: 800; color: #1a1a2e; line-height: 1.2; }
.kpi-label { font-size: 12px; color: #9e9e9e; margin-top: 4px; }

/* ── Top Parcs ── */
.top-parc-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}
.top-parc-row:last-child { border-bottom: none; }
.top-parc-rank { font-size: 14px; font-weight: 700; color: #9e9e9e; min-width: 28px; }

/* ── Alertes ── */
.alert-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
  border-bottom: 1px solid #f5f5f5;
}
.alert-row:last-child { border-bottom: none; }

/* ── Activités ── */
.activity-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f8f8f8;
}
.activity-row:last-child { border-bottom: none; }
.activity-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
}
</style>
