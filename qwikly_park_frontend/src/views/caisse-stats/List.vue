<template>
  <div>

    <h1 class="page-title mb-5">Statistiques &amp; Sessions Caisse</h1>

    <!-- ══ MAIN TAB BAR (2 tabs only) ════════════════════════════════ -->
    <VCard class="mb-5" elevation="0" border>
      <VCardText class="pa-0">
        <div class="tab-bar">
          <button
            v-for="tab in mainTabs"
            :key="tab.key"
            class="tab-btn"
            :class="activeTab === tab.key ? 'tab-btn--active' : 'tab-btn--inactive'"
            @click="switchTab(tab.key)"
          >
            <VIcon v-if="tab.icon" :icon="tab.icon" size="15" class="me-2" />
            {{ tab.label }}
          </button>
        </div>
      </VCardText>
    </VCard>

    <!-- ══════════════════ TAB: STATISTIQUES ══════════════════════ -->
    <div v-if="activeTab === 'stats'">

      <!-- Filter -->
      <VCard class="mb-4" elevation="0" border>
        <VCardText class="pa-4">
          <p class="filter-title mb-3">Filtres</p>
          <div class="d-flex flex-wrap gap-3 align-end">
            <div class="filter-field">
              <div class="select-wrap">
                <select v-model="statsFilter.park_id" class="field-select">
                  <option value="">Tous les parcs</option>
                  <option v-for="p in parks" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
                <VIcon icon="tabler-chevron-down" size="14" class="select-icon" />
              </div>
            </div>
            <div class="filter-field">
              <div class="input-icon-wrap">
                <input v-model="statsFilter.date_from" type="date" class="field-input" />
                <VIcon icon="tabler-calendar" size="15" class="field-icon" />
              </div>
            </div>
            <div class="filter-field">
              <div class="input-icon-wrap">
                <input v-model="statsFilter.date_to" type="date" class="field-input" />
                <VIcon icon="tabler-calendar" size="15" class="field-icon" />
              </div>
            </div>
            <button class="btn-apply" :disabled="statsLoading" @click="loadStats">Appliquer</button>
          </div>
        </VCardText>
      </VCard>

      <!-- Export -->
      <div class="d-flex justify-end mb-4">
        <button class="btn-export" @click="toast('Statistiques exportées.')">
          <VIcon icon="tabler-upload" size="14" class="me-1" />Export
        </button>
      </div>

      <div v-if="statsLoading" class="d-flex justify-center py-8 mb-5">
        <VProgressCircular indeterminate color="#E8A838" />
      </div>

      <!-- KPI Cards -->
      <div v-else class="kpi-grid mb-5">
        <div class="kpi-card">
          <div class="kpi-icon"><VIcon icon="tabler-device-analytics" size="22" color="#fff" /></div>
          <div>
            <div class="kpi-val">{{ kpi.sessions }}</div>
            <div class="kpi-lbl">Sessions totales</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:#4CAF50"><VIcon icon="tabler-circle-check" size="22" color="#fff" /></div>
          <div>
            <div class="kpi-val">{{ kpi.closed }}</div>
            <div class="kpi-lbl">Sessions clôturées</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:#1a1a2e"><VIcon icon="tabler-currency-euro" size="22" color="#fff" /></div>
          <div>
            <div class="kpi-val">{{ kpi.revenus }}</div>
            <div class="kpi-lbl">Revenus totaux</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:#5C6BC0"><VIcon icon="tabler-users" size="22" color="#fff" /></div>
          <div>
            <div class="kpi-val">{{ kpi.clients }}</div>
            <div class="kpi-lbl">Clients enregistrés</div>
          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="charts-grid">
        <VCard elevation="0" border>
          <VCardText class="pa-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <p class="chart-title">Revenus par parc</p>
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
            <div v-if="donutSeries.length === 0 || donutSeries.every(v => v === 0)" class="d-flex align-center justify-center" style="height:280px;color:#bbb;font-size:13px">
              Aucune donnée disponible
            </div>
            <VueApexCharts v-else type="donut" height="280" :options="donutOpts" :series="donutSeries" />
          </VCardText>
        </VCard>

        <VCard elevation="0" border>
          <VCardText class="pa-4">
            <p class="chart-title mb-3">Revenus par jour (7 derniers jours)</p>
            <div v-if="lineSeries[0]?.data?.length === 0" class="d-flex align-center justify-center" style="height:280px;color:#bbb;font-size:13px">
              Aucune donnée disponible
            </div>
            <VueApexCharts v-else type="line" height="280" :options="lineOpts" :series="lineSeries" />
          </VCardText>
        </VCard>
      </div>
    </div>

    <!-- ══════════════════ TAB: SESSIONS CAISSE ═══════════════════ -->
    <div v-else-if="activeTab === 'sessions_caisse'">

      <!-- Action buttons row -->
      <div class="action-bar mb-4">
        <div class="action-bar-left">
          <button class="btn-action" :class="showArchives ? 'btn-action--on' : ''" @click="toggleArchives">
            <VIcon icon="tabler-archive" size="14" class="me-1" />
            Montrer Archives
          </button>
          <button class="btn-action" :class="showAnnulations ? 'btn-action--on' : ''" @click="toggleAnnulations">
            <VIcon icon="tabler-ban" size="14" class="me-1" />
            Montrer annulations
          </button>
          <button class="btn-action" :class="showAllDates ? 'btn-action--on' : ''" @click="toggleAllDates">
            <VIcon icon="tabler-calendar" size="14" class="me-1" />
            Montrer toutes dates
          </button>
        </div>
        <button class="btn-journal" @click="toast('Journal des ventes exporté.')">
          <VIcon icon="tabler-file-invoice" size="14" class="me-1" />
          Journal des ventes
        </button>
      </div>

      <!-- Sub-tabs (underline style with badges) -->
      <div class="sub-tab-bar mb-4">
        <button
          class="sub-tab-btn"
          :class="subTab === 'sessions' ? 'sub-tab-btn--active' : ''"
          @click="switchSubTab('sessions')"
        >
          TOUTES LES SESSIONS
          <span class="sub-tab-badge" :class="subTab === 'sessions' ? 'sub-tab-badge--active' : ''">
            {{ sessionTotal }}
          </span>
        </button>
        <button
          class="sub-tab-btn"
          :class="subTab === 'hist_ventes' ? 'sub-tab-btn--active' : ''"
          @click="switchSubTab('hist_ventes')"
        >
          VENTES
          <span class="sub-tab-badge" :class="subTab === 'hist_ventes' ? 'sub-tab-badge--active' : ''">
            {{ histVentes.length }}
          </span>
        </button>
        <button
          class="sub-tab-btn"
          :class="subTab === 'hist_resa' ? 'sub-tab-btn--active' : ''"
          @click="switchSubTab('hist_resa')"
        >
          RÉSERVATIONS
          <span class="sub-tab-badge" :class="subTab === 'hist_resa' ? 'sub-tab-badge--active' : ''">
            {{ histResa.length }}
          </span>
        </button>
        <button
          class="sub-tab-btn"
          :class="subTab === 'hist_caisse' ? 'sub-tab-btn--active' : ''"
          @click="switchSubTab('hist_caisse')"
        >
          PAR CAISSE
          <span class="sub-tab-badge" :class="subTab === 'hist_caisse' ? 'sub-tab-badge--active' : ''">
            {{ histCaisse.length }}
          </span>
        </button>
      </div>

      <!-- ── SUB-TAB: SESSIONS ─────────────────────────────────── -->
      <div v-if="subTab === 'sessions'">
        <VCard elevation="0" border>
          <VCardText class="pa-4">

            <!-- Top controls -->
            <div class="d-flex flex-wrap align-center gap-3 mb-3">
              <!-- Park filter -->
              <div class="filter-field">
                <div class="select-wrap">
                  <select v-model="caisseFilter.park_id" class="field-select" @change="applyCaisseFilter">
                    <option value="">Tous les parcs</option>
                    <option v-for="p in parks" :key="p.id" :value="p.id">{{ p.name }}</option>
                  </select>
                  <VIcon icon="tabler-chevron-down" size="14" class="select-icon" />
                </div>
              </div>
              <!-- Caisse filter -->
              <div class="filter-field">
                <div class="select-wrap">
                  <select v-model="caisseFilter.caisse_id" class="field-select" @change="applyCaisseFilter">
                    <option value="">Toutes les caisses</option>
                    <option v-for="c in cashRegisters" :key="c.id" :value="c.id">{{ c.name }}</option>
                  </select>
                  <VIcon icon="tabler-chevron-down" size="14" class="select-icon" />
                </div>
              </div>
              <!-- Date from -->
              <div class="filter-field" v-if="!showAllDates">
                <div class="input-icon-wrap">
                  <input v-model="caisseFilter.date_from" type="date" class="field-input" @change="applyCaisseFilter" />
                  <VIcon icon="tabler-calendar" size="15" class="field-icon" />
                </div>
              </div>
              <!-- Date to -->
              <div class="filter-field" v-if="!showAllDates">
                <div class="input-icon-wrap">
                  <input v-model="caisseFilter.date_to" type="date" class="field-input" @change="applyCaisseFilter" />
                  <VIcon icon="tabler-calendar" size="15" class="field-icon" />
                </div>
              </div>
              <div class="d-flex align-center gap-2 ms-auto">
                <div class="d-flex align-center gap-2">
                  <span class="filters-label">Afficher</span>
                  <select v-model="caissePerPage" class="per-page-select" @change="caissePage=1;loadSessions()">
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                </div>
                <div class="search-wrap">
                  <VIcon icon="tabler-search" size="15" class="search-icon" />
                  <input v-model="caisseSearch" class="search-input" placeholder="Rechercher ..." />
                </div>
                <button class="btn-export" @click="toast('Sessions exportées.')">
                  <VIcon icon="tabler-upload" size="14" class="me-1" />Export
                </button>
              </div>
            </div>

            <div v-if="caisseLoading" class="d-flex justify-center py-10">
              <VProgressCircular indeterminate color="#E8A838" />
            </div>
            <template v-else>
              <div class="table-scroll">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th style="width:36px"><input type="checkbox" @change="toggleSelectAll" /></th>
                      <th>
                        <span class="th-with-filter">
                          CAISSE
                          <VIcon icon="tabler-adjustments-horizontal" size="12" style="color:#1a6bc0;margin-left:4px" />
                        </span>
                      </th>
                      <th>
                        <span class="th-with-filter">
                          OUVERTE
                          <VIcon icon="tabler-chevrons-right" size="12" style="color:#1a6bc0;margin-left:4px" />
                        </span>
                      </th>
                      <th>
                        <span class="th-with-filter">
                          FERMÉE
                          <VIcon icon="tabler-chevrons-right" size="12" style="color:#1a6bc0;margin-left:4px" />
                        </span>
                      </th>
                      <th>VENTES</th>
                      <th>ATTENDU</th>
                      <th>RÉEL</th>
                      <th>ÉCART</th>
                    </tr>
                    <!-- Filter row -->
                    <tr class="filter-row">
                      <td></td>
                      <td>
                        <div class="filter-input-wrap">
                          <select v-model="caisseFilter.caisse_id" class="th-select" @change="applyCaisseFilter">
                            <option value="">Toutes les caisses</option>
                            <option v-for="c in cashRegisters" :key="c.id" :value="c.id">{{ c.name }}</option>
                          </select>
                          <VIcon icon="tabler-chevron-down" size="11" class="th-select-icon" />
                        </div>
                      </td>
                      <td>
                        <div class="filter-input-wrap">
                          <input v-model="caisseFilter.date_from" type="date" class="th-input" @change="applyCaisseFilter" />
                          <VIcon icon="tabler-chevrons-right" size="11" class="th-select-icon" style="color:#aaa" />
                        </div>
                      </td>
                      <td>
                        <div class="filter-input-wrap">
                          <input v-model="caisseFilter.date_to" type="date" class="th-input" @change="applyCaisseFilter" />
                          <VIcon icon="tabler-chevrons-right" size="11" class="th-select-icon" style="color:#aaa" />
                        </div>
                      </td>
                      <td></td>
                      <td>
                        <div class="filter-input-wrap">
                          <input type="text" class="th-input" placeholder="›" readonly />
                          <VIcon icon="tabler-chevrons-right" size="11" class="th-select-icon" style="color:#aaa" />
                        </div>
                      </td>
                      <td>
                        <div class="filter-input-wrap">
                          <input type="text" class="th-input" placeholder="›" readonly />
                          <VIcon icon="tabler-chevrons-right" size="11" class="th-select-icon" style="color:#aaa" />
                        </div>
                      </td>
                      <td></td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!pageSessions.length">
                      <td colspan="8" class="empty-cell">Aucune session trouvée</td>
                    </tr>
                    <tr v-for="row in pageSessions" :key="row.id" :class="selectedRows.includes(row.id) ? 'row-selected' : ''">
                      <td><input type="checkbox" :checked="selectedRows.includes(row.id)" @change="toggleRow(row.id)" /></td>
                      <td>
                        <button class="caisse-name-btn" @click="openDetail(row)">
                          <VIcon icon="tabler-adjustments-horizontal" size="12" class="me-1" style="color:#1a6bc0" />
                          {{ row.cash_register?.name || '—' }}
                        </button>
                      </td>
                      <td class="cell-date">
                        {{ fmtDateShort(row.opened_at) }}
                        <span v-if="!row.employee_id" class="ig-tag">(IG)</span>
                      </td>
                      <td class="cell-date">{{ row.closed_at ? fmtDateShort(row.closed_at) : '—' }}</td>
                      <td class="cell-center">{{ row.sales_count ?? 0 }}</td>
                      <td class="cell-amount">{{ fmtMontant(row.expected_amount ?? row.total ?? 0) }}</td>
                      <td class="cell-amount">{{ fmtMontant(row.real_amount ?? row.total ?? 0) }}</td>
                      <td class="cell-amount" :class="calcEcart(row) < 0 ? 'cell-negative' : calcEcart(row) > 0 ? 'cell-positive' : ''">
                        {{ fmtMontant(calcEcart(row)) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="table-footer">
                <span class="showing">
                  Affichage {{ caisseFrom }} à {{ caisseTo }} sur {{ sessionTotal }} sessions
                </span>
                <div class="pagination">
                  <button class="pg" :disabled="caissePage===1" @click="caissePage=1;loadSessions()">«</button>
                  <button class="pg" :disabled="caissePage===1" @click="caissePage--;loadSessions()">‹</button>
                  <button v-for="p in caissePages" :key="p" class="pg" :class="p===caissePage?'pg-active':''" @click="caissePage=p;loadSessions()">{{ p }}</button>
                  <button class="pg" :disabled="caissePage===caisseTotalPages" @click="caissePage++;loadSessions()">›</button>
                  <button class="pg" :disabled="caissePage===caisseTotalPages" @click="caissePage=caisseTotalPages;loadSessions()">»</button>
                </div>
              </div>
            </template>
          </VCardText>
        </VCard>
      </div>

      <!-- ── SUB-TAB: HISTORIQUE VENTES ───────────────────────── -->
      <div v-else-if="subTab === 'hist_ventes'">
        <VCard class="mb-4" elevation="0" border>
          <VCardText class="pa-4">
            <p class="filter-title mb-3">Filtres</p>
            <div class="d-flex flex-wrap gap-3 align-end">
              <div class="filter-field">
                <div class="select-wrap">
                  <select v-model="histVentesFilter.park_id" class="field-select">
                    <option value="">Tous les parcs</option>
                    <option v-for="p in parks" :key="p.id" :value="p.id">{{ p.name }}</option>
                  </select>
                  <VIcon icon="tabler-chevron-down" size="14" class="select-icon" />
                </div>
              </div>
              <div class="filter-field">
                <div class="input-icon-wrap">
                  <input v-model="histVentesFilter.date_from" type="date" class="field-input" />
                  <VIcon icon="tabler-calendar" size="15" class="field-icon" />
                </div>
              </div>
              <div class="filter-field">
                <div class="input-icon-wrap">
                  <input v-model="histVentesFilter.date_to" type="date" class="field-input" />
                  <VIcon icon="tabler-calendar" size="15" class="field-icon" />
                </div>
              </div>
              <button class="btn-apply" @click="loadHistVentes">Appliquer</button>
            </div>
          </VCardText>
        </VCard>
        <VCard elevation="0" border>
          <VCardText class="pa-4">
            <div class="d-flex align-center justify-space-between mb-4">
              <div class="d-flex align-center gap-2">
                <span class="filters-label">Résultats</span>
                <span style="font-size:12px;color:#9e9e9e">({{ histVentes.length }} achats)</span>
              </div>
              <button class="btn-export" @click="toast('Achats exportés.')">
                <VIcon icon="tabler-upload" size="14" class="me-1" />Export
              </button>
            </div>
            <div v-if="histVentesLoading" class="d-flex justify-center py-10">
              <VProgressCircular indeterminate color="#E8A838" />
            </div>
            <template v-else>
              <div class="table-scroll">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>CODE</th><th>CLIENT</th><th>OFFRE</th>
                      <th>LICENCES</th><th>DATE</th><th>STATUT</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!histVentes.length">
                      <td colspan="6" class="empty-cell">Aucun achat trouvé</td>
                    </tr>
                    <tr v-for="v in histVentes" :key="v.id">
                      <td class="cell-id">{{ v.code || ('ACH-' + v.id) }}</td>
                      <td>
                        <span v-if="v.client?.user">{{ v.client.user.firstname }} {{ v.client.user.lastname }}</span>
                        <span v-else>—</span>
                      </td>
                      <td>{{ v.offer?.name || '—' }}</td>
                      <td><span class="status-chip chip-blue">{{ (v.licenses || []).length }} licence(s)</span></td>
                      <td style="font-size:12px;color:#9e9e9e">{{ v.created_at || '—' }}</td>
                      <td><span class="status-chip chip-green">Actif</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
          </VCardText>
        </VCard>
      </div>

      <!-- ── SUB-TAB: HISTORIQUE RÉSERVATIONS ─────────────────── -->
      <div v-else-if="subTab === 'hist_resa'">
        <VCard class="mb-4" elevation="0" border>
          <VCardText class="pa-4">
            <p class="filter-title mb-3">Filtres</p>
            <div class="d-flex flex-wrap gap-3 align-end">
              <div class="filter-field">
                <div class="select-wrap">
                  <select v-model="histResaFilter.park_id" class="field-select">
                    <option value="">Tous les parcs</option>
                    <option v-for="p in parks" :key="p.id" :value="p.id">{{ p.name }}</option>
                  </select>
                  <VIcon icon="tabler-chevron-down" size="14" class="select-icon" />
                </div>
              </div>
              <div class="filter-field">
                <div class="input-icon-wrap">
                  <input v-model="histResaFilter.date_from" type="date" class="field-input" />
                  <VIcon icon="tabler-calendar" size="15" class="field-icon" />
                </div>
              </div>
              <div class="filter-field">
                <div class="input-icon-wrap">
                  <input v-model="histResaFilter.date_to" type="date" class="field-input" />
                  <VIcon icon="tabler-calendar" size="15" class="field-icon" />
                </div>
              </div>
              <button class="btn-apply" @click="loadHistResa">Appliquer</button>
            </div>
          </VCardText>
        </VCard>
        <VCard elevation="0" border>
          <VCardText class="pa-4">
            <div class="d-flex align-center justify-space-between mb-4">
              <div class="d-flex align-center gap-2">
                <span class="filters-label">Résultats</span>
                <span style="font-size:12px;color:#9e9e9e">({{ histResa.length }} réservations)</span>
              </div>
              <button class="btn-export" @click="toast('Réservations exportées.')">
                <VIcon icon="tabler-upload" size="14" class="me-1" />Export
              </button>
            </div>
            <div v-if="histResaLoading" class="d-flex justify-center py-10">
              <VProgressCircular indeterminate color="#E8A838" />
            </div>
            <template v-else>
              <div class="table-scroll">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>DATE</th><th>NOM</th><th>PARC</th>
                      <th>HORAIRE</th><th>CAPACITÉ</th><th>STATUT</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!histResa.length">
                      <td colspan="6" class="empty-cell">Aucune réservation trouvée</td>
                    </tr>
                    <tr v-for="r in histResa" :key="r.id">
                      <td>{{ r.date || fmtDate(r.created_at) }}</td>
                      <td class="cell-id">{{ r.name || '—' }}</td>
                      <td>{{ r.park?.name || r.park?.localisation || '—' }}</td>
                      <td style="font-size:12px;color:#9e9e9e">{{ r.start_time || '—' }} → {{ r.end_time || '—' }}</td>
                      <td>{{ r.capacity || '—' }}</td>
                      <td><span class="status-chip" :class="resaStatusClass(r)">{{ resaStatusLabel(r) }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
          </VCardText>
        </VCard>
      </div>

      <!-- ── SUB-TAB: PAR CAISSE ──────────────────────────────── -->
      <div v-else-if="subTab === 'hist_caisse'">
        <VCard class="mb-4" elevation="0" border>
          <VCardText class="pa-4">
            <p class="filter-title mb-3">Filtres</p>
            <div class="d-flex flex-wrap gap-3 align-end">
              <div class="filter-field">
                <div class="select-wrap">
                  <select v-model="histCaisseFilter.park_id" class="field-select">
                    <option value="">Tous les parcs</option>
                    <option v-for="p in parks" :key="p.id" :value="p.id">{{ p.name }}</option>
                  </select>
                  <VIcon icon="tabler-chevron-down" size="14" class="select-icon" />
                </div>
              </div>
              <button class="btn-apply" @click="loadHistCaisse">Appliquer</button>
            </div>
          </VCardText>
        </VCard>
        <VCard elevation="0" border>
          <VCardText class="pa-4">
            <div class="d-flex align-center justify-space-between mb-4">
              <div class="d-flex align-center gap-2">
                <span class="filters-label">Résultats</span>
                <span style="font-size:12px;color:#9e9e9e">({{ histCaisse.length }} caisses)</span>
              </div>
              <button class="btn-export" @click="toast('Historique caisse exporté.')">
                <VIcon icon="tabler-upload" size="14" class="me-1" />Export
              </button>
            </div>
            <div v-if="histCaisseLoading" class="d-flex justify-center py-10">
              <VProgressCircular indeterminate color="#E8A838" />
            </div>
            <template v-else>
              <div class="table-scroll">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>CODE</th><th>NOM CAISSE</th><th>PARC</th>
                      <th>NB. SESSIONS</th><th>REVENU TOTAL</th><th>STATUT</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!histCaisse.length">
                      <td colspan="6" class="empty-cell">Aucune caisse trouvée</td>
                    </tr>
                    <tr v-for="c in histCaisse" :key="c.id">
                      <td class="cell-id">{{ c.code || c.id }}</td>
                      <td>{{ c.name || '—' }}</td>
                      <td>{{ parkNameById(c.park_id) }}</td>
                      <td>{{ caisseSessionCount(c.id) }}</td>
                      <td class="cell-amount">{{ fmtMontant(caisseRevenue(c.id)) }}</td>
                      <td>
                        <span class="status-chip" :class="c.status === 'active' ? 'chip-green' : 'chip-gray'">
                          {{ c.status === 'active' ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
          </VCardText>
        </VCard>
      </div>

    </div>

    <!-- ══ MODAL: DÉTAILS SESSION ══════════════════════════════════ -->
    <VDialog v-model="showDetail" max-width="460">
      <VCard v-if="selectedSession" style="border-radius:14px">
        <div class="modal-header">
          <button class="btn-back" @click="showDetail=false"><VIcon icon="tabler-arrow-left" size="16" /></button>
          <span class="modal-title">Détails de la Session</span>
        </div>
        <VCardText class="pa-5">
          <div class="detail-row">
            <span class="detail-lbl">Session ID</span>
            <span class="detail-val">#S-{{ String(selectedSession.id).padStart(4,'0') }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-lbl">Nom caisse</span>
            <span class="detail-val">{{ selectedSession.cash_register?.name || '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-lbl">Parc</span>
            <span class="detail-val">{{ selectedSession.park?.name || selectedSession.park?.localisation || '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-lbl">Ouverture</span>
            <span class="detail-val">{{ fmtDatetime(selectedSession.opened_at) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-lbl">Fermeture</span>
            <span class="detail-val">{{ selectedSession.closed_at ? fmtDatetime(selectedSession.closed_at) : 'En cours' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-lbl">Attendu</span>
            <span class="detail-val">{{ fmtMontant(selectedSession.expected_amount ?? selectedSession.total ?? 0) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-lbl">Réel</span>
            <span class="detail-val">{{ fmtMontant(selectedSession.real_amount ?? selectedSession.total ?? 0) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-lbl">Écart</span>
            <span class="detail-val" :style="calcEcart(selectedSession) < 0 ? 'color:#e53935' : calcEcart(selectedSession) > 0 ? 'color:#2E7D32' : ''">
              {{ fmtMontant(calcEcart(selectedSession)) }}
            </span>
          </div>
          <div class="detail-row" style="border:none">
            <span class="detail-lbl">Statut</span>
            <span class="status-chip" :class="sessionStatusClass(selectedSession)">{{ sessionStatusLabel(selectedSession) }}</span>
          </div>
        </VCardText>
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

  data() {
    return {
      activeTab: "stats",
      subTab: "sessions",

      mainTabs: [
        { key: "stats",          label: "Statistiques",   icon: "tabler-chart-bar"     },
        { key: "sessions_caisse",label: "Sessions Caisse", icon: "tabler-device-laptop" },
      ],

      // Toggle states
      showArchives:   false,
      showAnnulations: false,
      showAllDates:   false,

      parks: [],
      cashRegisters: [],
      allSessions: [],
      selectedRows: [],

      // ── Stats ──
      statsLoading: false,
      statsFilter: { park_id: "", date_from: "", date_to: "" },
      kpi: { sessions: 0, closed: 0, revenus: "0 €", clients: 0 },
      donutSeries: [],
      donutOpts: {
        colors: ["#E8A838", "#1a1a2e", "#4CAF50", "#5C6BC0", "#EF5350"],
        labels: [],
        legend: { position: "bottom", fontSize: "12px" },
        dataLabels: { enabled: false },
        plotOptions: { pie: { donut: { size: "65%" } } },
      },
      lineSeries: [{ name: "Revenus (€)", data: [] }],
      lineOpts: {
        chart: { toolbar: { show: false }, zoom: { enabled: false } },
        colors: ["#E8A838"],
        stroke: { curve: "smooth", width: 2.5 },
        fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.25, opacityTo: 0.01 } },
        dataLabels: { enabled: false },
        xaxis: { categories: [], labels: { style: { fontSize: "11px", colors: "#9e9e9e" } } },
        yaxis: { labels: { style: { fontSize: "11px", colors: "#9e9e9e" }, formatter: (v) => v.toLocaleString("fr-FR") + " €" } },
        grid: { borderColor: "#f0f0f0" },
        tooltip: { y: { formatter: (v) => v.toLocaleString("fr-FR") + " €" } },
      },

      // ── Sessions ──
      sessions: [], caisseLoading: false,
      sessionTotal: 0, caisseTotalPages: 1,
      caisseSearch: "", caissePage: 1, caissePerPage: 10,
      caisseFilter: { park_id: "", caisse_id: "", date_from: "", date_to: "" },
      showDetail: false, selectedSession: null,

      // ── Historique Ventes ──
      histVentes: [], histVentesLoading: false,
      histVentesFilter: { park_id: "", date_from: "", date_to: "" },

      // ── Historique Réservations ──
      histResa: [], histResaLoading: false,
      histResaFilter: { park_id: "", date_from: "", date_to: "" },

      // ── Par caisse ──
      histCaisse: [], histCaisseLoading: false,
      histCaisseFilter: { park_id: "" },

      toastVisible: false, toastMsg: "", _timer: null,
    };
  },

  computed: {
    pageSessions() {
      const q = (this.caisseSearch || "").toLowerCase();
      if (!q) return this.sessions;
      return this.sessions.filter(s =>
        String(s.id).includes(q) ||
        (s.cash_register?.name || "").toLowerCase().includes(q) ||
        (s.park?.name || "").toLowerCase().includes(q)
      );
    },
    caisseFrom() { return this.sessions.length ? (this.caissePage - 1) * this.caissePerPage + 1 : 0; },
    caisseTo()   { return Math.min(this.caissePage * this.caissePerPage, this.sessionTotal); },
    caissePages() {
      const t = this.caisseTotalPages, c = this.caissePage;
      let s = Math.max(1, c - 2), e = Math.min(t, s + 4);
      if (e - s < 4) s = Math.max(1, e - 4);
      const p = []; for (let i = s; i <= e; i++) p.push(i); return p;
    },
  },

  async mounted() {
    await Promise.all([this.loadParks(), this.loadCashRegisters()]);
    await Promise.all([this.loadStats(), this.loadSessions()]);
  },

  methods: {
    fmtMontant(v) {
      if (v == null || v === "" || isNaN(Number(v))) return "—";
      return Number(v).toLocaleString("fr-FR") + " €";
    },
    fmtDate(d) {
      if (!d) return "—";
      const dt = new Date(d);
      return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()}`;
    },
    fmtDateShort(d) {
      if (!d) return "—";
      const dt = new Date(d);
      const yy = String(dt.getFullYear()).slice(2);
      const mm = String(dt.getMonth()+1).padStart(2,"0");
      const dd = String(dt.getDate()).padStart(2,"0");
      const hh = String(dt.getHours()).padStart(2,"0");
      const mi = String(dt.getMinutes()).padStart(2,"0");
      return `${dd}/${mm}/${yy} ${hh}:${mi}`;
    },
    fmtDatetime(d) {
      if (!d) return "—";
      const dt = new Date(d);
      return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;
    },
    calcEcart(row) {
      const attendu = Number(row.expected_amount ?? row.total ?? 0);
      const reel    = Number(row.real_amount ?? row.total ?? 0);
      return reel - attendu;
    },
    sessionStatusLabel(r) {
      return r.status === "open" ? "En cours" : r.status === "closed" ? "Clôturée" : r.status || "—";
    },
    sessionStatusClass(r) {
      return r.status === "open" ? "chip-green" : r.status === "closed" ? "chip-gray" : "chip-blue";
    },
    resaStatusLabel(r) {
      const s = r.status;
      return { confirmed:"Confirmée", pending:"En attente", cancelled:"Annulée", active:"Active" }[s] || s || "—";
    },
    resaStatusClass(r) {
      const s = r.status;
      return { confirmed:"chip-green", pending:"chip-blue", cancelled:"chip-red", active:"chip-green" }[s] || "chip-gray";
    },
    parkNameById(parkId) {
      const p = this.parks.find(p => p.id === parkId);
      return p ? p.name : "—";
    },
    caisseSessionCount(cashRegisterId) {
      return this.allSessions.filter(s => s.cash_register_id === cashRegisterId).length;
    },
    caisseRevenue(cashRegisterId) {
      return this.allSessions
        .filter(s => s.cash_register_id === cashRegisterId)
        .reduce((sum, s) => sum + Number(s.total || 0), 0);
    },

    toggleSelectAll(e) {
      if (e.target.checked) this.selectedRows = this.pageSessions.map(s => s.id);
      else this.selectedRows = [];
    },
    toggleRow(id) {
      const idx = this.selectedRows.indexOf(id);
      if (idx === -1) this.selectedRows.push(id);
      else this.selectedRows.splice(idx, 1);
    },

    toast(msg) {
      clearTimeout(this._timer);
      this.toastMsg = msg; this.toastVisible = true;
      this._timer = setTimeout(() => { this.toastVisible = false; }, 3500);
    },

    switchTab(key) {
      this.activeTab = key;
    },

    switchSubTab(key) {
      this.subTab = key;
      if (key === "hist_ventes" && !this.histVentes.length) this.loadHistVentes();
      if (key === "hist_resa"   && !this.histResa.length)   this.loadHistResa();
      if (key === "hist_caisse" && !this.histCaisse.length) this.loadHistCaisse();
    },

    toggleArchives()    { this.showArchives    = !this.showArchives;    this.applyCaisseFilter(); },
    toggleAnnulations() { this.showAnnulations = !this.showAnnulations; this.applyCaisseFilter(); },
    toggleAllDates()    { this.showAllDates    = !this.showAllDates;    this.applyCaisseFilter(); },

    applyCaisseFilter() { this.caissePage = 1; this.loadSessions(); },
    openDetail(row)    { this.selectedSession = row; this.showDetail = true; },

    async loadParks() {
      try {
        const r = await $api("/parks", { params: { per_page: 200 } });
        this.parks = (r.data || []).map(p => ({ id: p.id, name: p.name || p.localisation || ("Parc " + p.id) }));
      } catch {}
    },

    async loadCashRegisters() {
      try {
        const r = await $api("/cash-registers", { params: { per_page: 200 } });
        this.cashRegisters = r.data || [];
      } catch {}
    },

    async loadStats() {
      this.statsLoading = true;
      try {
        const params = { per_page: 500 };
        if (this.statsFilter.park_id) params.park_id = this.statsFilter.park_id;

        const [sessRes, clientsRes] = await Promise.allSettled([
          $api("/sessions/", { params }),
          $api("/clients/",  { params: { per_page: 1 } }),
        ]);

        const sessions = sessRes.status === "fulfilled" ? (sessRes.value.data || []) : [];
        this.allSessions = sessions;

        const totalRevenue = sessions.reduce((s, r) => s + Number(r.total || 0), 0);
        const closedCount  = sessions.filter(s => s.status === "closed").length;

        this.kpi = {
          sessions: sessions.length,
          closed:   closedCount,
          revenus:  totalRevenue.toLocaleString("fr-FR") + " €",
          clients:  clientsRes.status === "fulfilled" ? (clientsRes.value.total || 0) : 0,
        };

        this.buildCharts(sessions);
      } catch {}
      finally { this.statsLoading = false; }
    },

    buildCharts(sessions) {
      const parkMap = {};
      sessions.forEach(s => {
        const pName = s.park?.name || s.park?.localisation || ("Parc " + (s.park?.id || "?"));
        parkMap[pName] = (parkMap[pName] || 0) + Number(s.total || 0);
      });
      this.donutSeries = Object.values(parkMap);
      this.donutOpts = { ...this.donutOpts, labels: Object.keys(parkMap) };

      const days = [], dayLabels = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
        dayLabels.push(`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`);
      }
      const dayMap = {}; days.forEach(d => { dayMap[d] = 0; });
      sessions.forEach(s => {
        const day = (s.opened_at || s.created_at || "").slice(0, 10);
        if (Object.prototype.hasOwnProperty.call(dayMap, day)) dayMap[day] += Number(s.total || 0);
      });
      this.lineSeries = [{ name: "Revenus (€)", data: days.map(d => dayMap[d]) }];
      this.lineOpts = { ...this.lineOpts, xaxis: { ...this.lineOpts.xaxis, categories: dayLabels } };
    },

    async loadSessions() {
      this.caisseLoading = true;
      try {
        const params = { per_page: this.caissePerPage, page: this.caissePage };
        if (this.caisseFilter.park_id)   params.park_id          = this.caisseFilter.park_id;
        if (this.caisseFilter.caisse_id) params.cash_register_id = this.caisseFilter.caisse_id;
        if (!this.showAllDates) {
          if (this.caisseFilter.date_from) params.date_from = this.caisseFilter.date_from;
          if (this.caisseFilter.date_to)   params.date_to   = this.caisseFilter.date_to;
        }
        if (this.showArchives)    params.show_archives    = 1;
        if (this.showAnnulations) params.show_annulations = 1;

        const r = await $api("/sessions/", { params });
        this.sessions         = r.data || [];
        this.sessionTotal     = r.total || this.sessions.length;
        this.caisseTotalPages = r.total_pages || Math.max(1, Math.ceil(this.sessionTotal / this.caissePerPage));
        if (!this.allSessions.length) this.allSessions = this.sessions;
      } catch {
        this.sessions = []; this.sessionTotal = 0; this.caisseTotalPages = 1;
      }
      this.caisseLoading = false;
    },

    async loadHistVentes() {
      this.histVentesLoading = true;
      try {
        const params = { per_page: 100 };
        if (this.histVentesFilter.park_id)   params.park_id   = this.histVentesFilter.park_id;
        if (this.histVentesFilter.date_from) params.date_from = this.histVentesFilter.date_from;
        if (this.histVentesFilter.date_to)   params.date_to   = this.histVentesFilter.date_to;
        const r = await $api("/purchases/", { params });
        this.histVentes = r.data || [];
      } catch { this.histVentes = []; }
      finally { this.histVentesLoading = false; }
    },

    async loadHistResa() {
      this.histResaLoading = true;
      try {
        const params = { per_page: 100 };
        if (this.histResaFilter.park_id)   params.park_id   = this.histResaFilter.park_id;
        if (this.histResaFilter.date_from) params.date_from = this.histResaFilter.date_from;
        if (this.histResaFilter.date_to)   params.date_to   = this.histResaFilter.date_to;
        const r = await $api("/reservations/", { params });
        this.histResa = r.data || [];
      } catch { this.histResa = []; }
      finally { this.histResaLoading = false; }
    },

    async loadHistCaisse() {
      this.histCaisseLoading = true;
      try {
        const params = { per_page: 200 };
        if (this.histCaisseFilter.park_id) params.park_id = this.histCaisseFilter.park_id;
        const r = await $api("/cash-registers", { params });
        this.histCaisse = r.data || [];
        if (!this.allSessions.length) {
          const sr = await $api("/sessions/", { params: { per_page: 500 } });
          this.allSessions = sr.data || [];
        }
      } catch { this.histCaisse = []; }
      finally { this.histCaisseLoading = false; }
    },
  },
};
</script>

<style scoped>
.page-title  { font-size:22px;font-weight:700;color:#1a1a2e; }
.filter-title{ font-size:13px;font-weight:700;color:#1a1a2e;margin:0; }

/* ── MAIN TAB BAR (2 tabs) ─────────────────────────────────────── */
.tab-bar {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #E8A838;
}
.tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 13px 8px;
  border: none;
  cursor: pointer;
  font-weight: 700;
  font-size: 13px;
  transition: background .15s, color .15s;
  gap: 6px;
}
.tab-btn--active  { background: #1a1a2e; color: #fff; }
.tab-btn--inactive{ background: #E8A838; color: #1a1a2e; }
.tab-btn--inactive:hover { background: #d4942b; }

/* ── ACTION BAR ────────────────────────────────────────────────── */
.action-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.action-bar-left { display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex:1; }
.btn-action {
  display: inline-flex;
  align-items: center;
  height: 34px;
  padding: 0 14px;
  border: 1.5px solid #d0d0d0;
  border-radius: 7px;
  background: #fff;
  color: #555;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all .15s;
  white-space: nowrap;
}
.btn-action:hover   { border-color: #1a1a2e; color: #1a1a2e; }
.btn-action--on     { background: #e8f0fb; border-color: #1a6bc0; color: #1a6bc0; }
.btn-journal {
  display: inline-flex;
  align-items: center;
  height: 38px;
  padding: 0 18px;
  border: none;
  border-radius: 8px;
  background: #E8A838;
  color: #1a1a2e;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: opacity .15s;
  white-space: nowrap;
  flex-shrink: 0;
}
.btn-journal:hover { opacity: .88; }

/* ── SUB-TABS (underline style) ────────────────────────────────── */
.sub-tab-bar {
  display: flex;
  align-items: flex-end;
  border-bottom: 2px solid #f0f0f0;
  gap: 0;
  flex-wrap: wrap;
}
.sub-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  border: none;
  background: transparent;
  font-size: 11.5px;
  font-weight: 700;
  color: #9e9e9e;
  cursor: pointer;
  font-family: inherit;
  border-bottom: 2.5px solid transparent;
  margin-bottom: -2px;
  transition: color .15s, border-color .15s;
  white-space: nowrap;
}
.sub-tab-btn:hover { color: #1a1a2e; }
.sub-tab-btn--active { color: #1a1a2e; border-bottom-color: #1a1a2e; }
.sub-tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 18px;
  padding: 0 6px;
  border-radius: 10px;
  background: #f0f0f0;
  color: #9e9e9e;
  font-size: 10px;
  font-weight: 700;
}
.sub-tab-badge--active { background: #1a1a2e; color: #E8A838; }

/* ── FILTER FIELDS ─────────────────────────────────────────────── */
.filter-field { min-width:150px;max-width:200px; }
.field-input  { width:100%;height:38px;padding:0 34px 0 12px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:13px;color:#333;background:#fff;outline:none;font-family:inherit;box-sizing:border-box; }
.field-input:focus { border-color:#E8A838; }
.input-icon-wrap { position:relative; }
.field-icon  { position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#aaa;pointer-events:none; }
.select-wrap { position:relative; }
.field-select{ width:100%;height:38px;padding:0 32px 0 12px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:13px;color:#333;background:#fff;outline:none;font-family:inherit;appearance:none;cursor:pointer;box-sizing:border-box; }
.field-select:focus { border-color:#E8A838; }
.select-icon { position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#aaa;pointer-events:none; }

/* ── BUTTONS ───────────────────────────────────────────────────── */
.btn-apply  { height:38px;padding:0 22px;border:none;border-radius:8px;background:#E8A838;color:#1a1a2e;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit; }
.btn-apply:hover { opacity:.88; }
.btn-apply:disabled { opacity:.5;cursor:not-allowed; }
.btn-export { display:inline-flex;align-items:center;height:36px;padding:0 16px;border:1.5px solid #1a1a2e;border-radius:8px;background:#fff;color:#1a1a2e;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit; }
.btn-export:hover { background:#f5f5f5; }

/* ── KPI ───────────────────────────────────────────────────────── */
.kpi-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:14px; }
.kpi-card { display:flex;align-items:center;gap:14px;padding:18px 16px;border:1px solid #f0f0f0;border-radius:12px;background:#fff; }
.kpi-icon { width:46px;height:46px;border-radius:10px;background:#E8A838;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.kpi-val  { font-size:20px;font-weight:800;color:#1a1a2e;line-height:1.2; }
.kpi-lbl  { font-size:11px;color:#9e9e9e;margin-top:3px; }

/* ── CHARTS ────────────────────────────────────────────────────── */
.charts-grid { display:grid;grid-template-columns:1fr 1fr;gap:16px; }
.chart-title { font-size:14px;font-weight:700;color:#1a1a2e;margin:0; }
.dots-btn    { background:none;border:none;cursor:pointer;color:#888;display:inline-flex;padding:2px;border-radius:4px; }
.dots-btn:hover { background:#f5f5f5; }

/* ── TABLE ─────────────────────────────────────────────────────── */
.filters-label  { font-size:13px;font-weight:600;color:#444; }
.per-page-select{ height:32px;padding:0 8px;border:1.5px solid #e0e0e0;border-radius:6px;font-size:13px;color:#444;background:#fff;outline:none;cursor:pointer; }
.search-wrap    { position:relative;min-width:160px; }
.search-icon    { position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#bbb;pointer-events:none; }
.search-input   { width:100%;height:36px;padding:0 12px 0 32px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:13px;color:#333;background:#fff;outline:none;font-family:inherit;box-sizing:border-box; }
.search-input:focus { border-color:#E8A838; }
.table-scroll { overflow-x:auto; }
.data-table   { width:100%;border-collapse:collapse;font-size:13px; }
.data-table thead tr:first-child { background:#fafafa;border-bottom:1.5px solid #f0f0f0; }
.data-table th { padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#9e9e9e;text-transform:uppercase;white-space:nowrap;background:#fafafa; }
.th-with-filter { display:inline-flex;align-items:center; }
.data-table tbody tr { border-bottom:1px solid #f5f5f5;transition:background .1s; }
.data-table tbody tr:hover { background:#fafafa; }
.data-table tbody tr.row-selected { background:#fffbf0; }
.data-table td  { padding:10px 14px;vertical-align:middle; }
.cell-id        { font-weight:600;color:#1a1a2e; }
.cell-date      { font-size:12px;color:#555;white-space:nowrap; }
.cell-center    { text-align:center;font-weight:600;color:#333; }
.cell-amount    { font-weight:700;color:#1a1a2e; }
.cell-negative  { color:#e53935 !important; }
.cell-positive  { color:#2E7D32 !important; }
.empty-cell     { text-align:center;color:#bbb;padding:40px; }
.ig-tag         { display:inline-block;margin-left:4px;padding:1px 5px;border-radius:4px;background:#e8f0fb;color:#1a6bc0;font-size:10px;font-weight:700; }

/* Caisse name as link-style button */
.caisse-name-btn {
  display: inline-flex;
  align-items: center;
  background: transparent;
  border: none;
  color: #1a6bc0;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  padding: 0;
  text-decoration: underline;
}
.caisse-name-btn:hover { color: #1250a0; }

/* Filter row in thead */
.filter-row td { background: #f9f9f9; padding: 6px 14px; border-bottom: 1px solid #f0f0f0; }
.filter-input-wrap { position:relative;display:flex;align-items:center; }
.th-select {
  width: 100%;
  height: 28px;
  padding: 0 24px 0 8px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  font-size: 11px;
  color: #555;
  background: #fff;
  outline: none;
  font-family: inherit;
  appearance: none;
  cursor: pointer;
  box-sizing: border-box;
}
.th-input {
  width: 100%;
  height: 28px;
  padding: 0 22px 0 8px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  font-size: 11px;
  color: #555;
  background: #fff;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
}
.th-input:focus, .th-select:focus { border-color: #E8A838; }
.th-select-icon { position:absolute;right:5px;color:#bbb;pointer-events:none; }

/* ── STATUS ────────────────────────────────────────────────────── */
.status-chip { display:inline-block;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700; }
.chip-green  { background:#E8F5E9;color:#2E7D32; }
.chip-red    { background:#FDECEA;color:#c62828; }
.chip-blue   { background:#E3F2FD;color:#1565C0; }
.chip-gray   { background:#f5f5f5;color:#757575; }

/* ── PAGINATION ────────────────────────────────────────────────── */
.table-footer { display:flex;align-items:center;justify-content:space-between;padding:14px 0 2px; }
.showing      { font-size:12px;color:#9e9e9e; }
.pagination   { display:flex;align-items:center;gap:3px; }
.pg           { min-width:30px;height:30px;border-radius:6px;border:1.5px solid #e8e8e8;background:#fff;font-size:12px;font-weight:600;color:#555;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0 6px;transition:all .12s; }
.pg:hover:not(:disabled) { border-color:#1a1a2e;color:#1a1a2e; }
.pg:disabled  { opacity:.35;cursor:not-allowed; }
.pg-active    { background:#1a1a2e;border-color:#1a1a2e;color:#fff; }

/* ── MODAL ─────────────────────────────────────────────────────── */
.modal-header { display:flex;align-items:center;gap:12px;padding:16px 20px 14px;border-bottom:1px solid #f0f0f0; }
.modal-title  { font-size:15px;font-weight:700;color:#1a1a2e; }
.btn-back  { width:32px;height:32px;border-radius:8px;border:1.5px solid #e0e0e0;background:#f9f9f9;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;color:#1a1a2e; }
.btn-back:hover { background:#efefef; }
.detail-row { display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f5f5f5; }
.detail-lbl { font-size:13px;color:#888;font-weight:500; }
.detail-val { font-size:13px;color:#1a1a2e;font-weight:600; }

/* ── TOAST ─────────────────────────────────────────────────────── */
.toast-bar { position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;align-items:center;padding:12px 20px;border-radius:10px;background:#E8F5E9;color:#2E7D32;border:1px solid #C8E6C9;font-size:13px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,.1); }
.fade-enter-active,.fade-leave-active { transition:opacity .25s,transform .25s; }
.fade-enter-from,.fade-leave-to       { opacity:0;transform:translateY(8px); }

/* ── RESPONSIVE ────────────────────────────────────────────────── */
@media (max-width:900px) {
  .kpi-grid    { grid-template-columns:repeat(2,1fr); }
  .charts-grid { grid-template-columns:1fr; }
}
@media (max-width:600px) {
  .tab-btn { font-size:12px;padding:11px 8px; }
  .kpi-grid{ grid-template-columns:1fr 1fr; }
  .sub-tab-btn { font-size:10.5px;padding:8px 10px; }
}
</style>
