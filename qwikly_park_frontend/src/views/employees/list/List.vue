<template>
  <div>
    <!-- ══════════════════════════════════════
         TAB TOGGLE
    ══════════════════════════════════════ -->
    <div class="tab-bar mb-4">
      <button
        v-for="tab in tabs" :key="tab.key"
        class="tab-btn"
        :class="activeTab === tab.key ? 'tab-btn--active' : 'tab-btn--inactive'"
        @click="activeTab = tab.key"
      >
        <VIcon :icon="tab.icon" size="17" class="me-1" />
        {{ tab.label }}
      </button>
    </div>

    <!-- ══════════════════════════════════════
         ONGLET 1 — EMPLOYÉS
    ══════════════════════════════════════ -->
    <div v-if="activeTab === 'employees'">
      <VCard>
        <VCardText class="pa-4">
          <!-- Top bar -->
          <div class="d-flex align-center gap-3 mb-4 flex-wrap">
            <span class="text-subtitle-2 font-weight-medium">Employés</span>
            <VSelect
              v-model="empPerPage"
              :items="[{value:5,title:'5'},{value:10,title:'10'},{value:25,title:'25'}]"
              hide-details density="compact" variant="outlined"
              style="min-width:70px; max-width:80px"
            />
            <VSpacer />
            <VTextField
              v-model="searchQuery"
              placeholder="Rechercher un employé..."
              prepend-inner-icon="tabler-search"
              hide-details clearable density="compact" variant="outlined"
              style="max-width:280px"
              @click:clear="searchQuery = ''"
            />
            <VBtn class="export-btn" variant="outlined" @click="exportEmployees">
              <VIcon icon="tabler-upload" size="16" class="me-1" />Export
            </VBtn>
            <VBtn class="add-btn" elevation="0" @click="openAddEmp">
              <VIcon icon="tabler-plus" size="16" class="me-1" />Ajouter un employé
            </VBtn>
          </div>

          <!-- Table -->
          <VDataTableServer
            class="employees-table"
            :items-length="empTotal"
            :headers="empHeaders"
            :items="employees"
            :loading="empLoading"
            hide-default-header
          >
            <template #headers="{ columns }">
              <tr>
                <th v-for="col in columns" :key="col.key" class="table-th">{{ col.title }}</th>
              </tr>
            </template>
            <template #no-data><span class="text-medium-emphasis">Pas de données</span></template>
            <template #loading><span>Chargement...</span></template>

            <template #item.image="{ item }">
              <VAvatar size="36" :image="item.user?.image || placeholder" class="my-1" />
            </template>

            <template #item.name="{ item }">
              <div>
                <div class="font-weight-medium">{{ item.user?.firstname }} {{ item.user?.lastname }}</div>
                <div style="font-size:12px; color:#9e9e9e">{{ item.user?.email }}</div>
              </div>
            </template>

            <template #item.role="{ item }">
              {{ item.roles?.map(r => r.name).join(', ') || '—' }}
            </template>

            <template #item.park="{ item }">
              {{ item.park?.name || item.park?.localisation || item.owner?.company || '—' }}
            </template>

            <template #item.status="{ item }">
              <VChip :color="empColor(item.status)" size="small" class="font-weight-medium">
                {{ empStatus(item.status) }}
              </VChip>
            </template>

            <template #item.actions="{ item }">
              <IconBtn size="small" color="info" @click="openEmpDetails(item)">
                <VIcon icon="tabler-eye" size="17" />
                <VTooltip activator="parent" location="top">Voir détails</VTooltip>
              </IconBtn>
              <IconBtn size="small" color="secondary" @click="openPrintBadge(item)">
                <VIcon icon="tabler-printer" size="17" />
                <VTooltip activator="parent" location="top">Imprimer</VTooltip>
              </IconBtn>
              <IconBtn
                size="small"
                class="status-toggle-btn"
                :color="item.status === 'approved' ? 'error' : 'success'"
                @click="openDisableEmp(item)"
              >
                <VIcon :icon="item.status === 'approved' ? 'tabler-ban' : 'tabler-power'" size="17" />
                <VTooltip activator="parent" location="top">
                  {{ item.status === 'approved' ? 'Désactiver' : 'Activer' }}
                </VTooltip>
              </IconBtn>
              <IconBtn size="small" color="success" @click="openEditEmp(item)">
                <VIcon icon="tabler-pencil" size="17" />
                <VTooltip activator="parent" location="top">Éditer</VTooltip>
              </IconBtn>
              <IconBtn size="small" color="error" @click="openDeleteEmp(item)">
                <VIcon icon="tabler-trash" size="17" />
                <VTooltip activator="parent" location="top">Supprimer</VTooltip>
              </IconBtn>
            </template>

            <template #bottom>
              <div class="d-flex align-center justify-space-between px-2 pt-3">
                <span style="font-size:12px; color:#9e9e9e">
                  {{ empTotal }} employé(s)
                </span>
                <VPagination v-model="empPage" :length="Math.ceil(empTotal / empPerPage)" total-visible="5" size="small" />
              </div>
            </template>
          </VDataTableServer>
        </VCardText>
      </VCard>
    </div>

    <!-- ══════════════════════════════════════
         ONGLET 2 — POINTAGE
    ══════════════════════════════════════ -->
    <div v-else-if="activeTab === 'pointage'">
      <!-- Filtres -->
      <VCard class="mb-4">
        <VCardText class="pa-4">
          <div class="d-flex align-center gap-3 flex-wrap">
            <span class="filter-label">Filtres</span>
            <VSelect
              v-model="ptgEmployeeId"
              :items="employeeOptions"
              item-title="name" item-value="id"
              placeholder="Employé"
              hide-details clearable density="compact" variant="outlined"
              style="min-width:160px; max-width:200px"
            />
            <VSelect
              v-model="ptgPeriod"
              :items="periodOptions"
              placeholder="Période"
              hide-details density="compact" variant="outlined"
              style="min-width:140px; max-width:170px"
            />
            <VTextField
              v-model="ptgDateFrom"
              type="date" label="Du"
              hide-details density="compact" variant="outlined"
              style="min-width:140px; max-width:160px"
            />
            <VTextField
              v-model="ptgDateTo"
              type="date" label="Au"
              hide-details density="compact" variant="outlined"
              style="min-width:140px; max-width:160px"
            />
            <VBtn class="apply-btn ptg-apply-btn" elevation="0" @click="loadPointage">Appliquer</VBtn>
            <VSpacer />
            <VBtn class="export-btn" variant="outlined" @click="exportPointage">
              <VIcon icon="tabler-upload" size="16" class="me-1" />Export
            </VBtn>
          </div>
        </VCardText>
      </VCard>

      <!-- Stats résumé -->
      <VRow class="mb-4">
        <VCol cols="12" sm="4">
          <VCard class="stat-card text-center pa-4">
            <VIcon icon="tabler-users" color="#E8A838" size="28" class="mb-2" />
            <div class="text-h5 font-weight-bold">{{ ptgStats.total_employes }}</div>
            <div class="stat-label">Employés pointés</div>
          </VCard>
        </VCol>
        <VCol cols="12" sm="4">
          <VCard class="stat-card text-center pa-4">
            <VIcon icon="tabler-clock-check" color="#4CAF50" size="28" class="mb-2" />
            <div class="text-h5 font-weight-bold">{{ ptgStats.total_heures }}h</div>
            <div class="stat-label">Total heures travaillées</div>
          </VCard>
        </VCol>
        <VCol cols="12" sm="4">
          <VCard class="stat-card text-center pa-4">
            <VIcon icon="tabler-clock-exclamation" color="#F44336" size="28" class="mb-2" />
            <div class="text-h5 font-weight-bold">{{ ptgStats.absences }}</div>
            <div class="stat-label">Absences / Retards</div>
          </VCard>
        </VCol>
      </VRow>

      <!-- Table pointage -->
      <VCard>
        <VCardText class="pa-4">
          <VTable class="pointage-table">
            <thead>
              <tr>
                <th class="table-th">EMPLOYÉ</th>
                <th class="table-th">PARC</th>
                <th class="table-th">DATE</th>
                <th class="table-th">HEURE ENTRÉE</th>
                <th class="table-th">HEURE SORTIE</th>
                <th class="table-th">DURÉE</th>
                <th class="table-th">STATUT</th>
              </tr>
            </thead>
            <tbody v-if="!ptgLoading && pointages.length">
              <tr v-for="(p, i) in pointages" :key="i">
                <td>
                  <div class="d-flex align-center gap-2">
                    <VAvatar size="30" :image="(allEmployeesMap[p.employee?.id] || p.employee)?.user?.image || placeholder" />
                    <span style="font-size:13px">
                      {{ allEmployeesMap[p.employee?.id]?.user?.firstname || p.employee?.user?.firstname || '' }}
                      {{ allEmployeesMap[p.employee?.id]?.user?.lastname  || p.employee?.user?.lastname  || '' }}
                    </span>
                  </div>
                </td>
                <td style="font-size:13px">{{ allEmployeesMap[p.employee?.id]?.park?.name || p.employee?.park?.name || '—' }}</td>
                <td style="font-size:13px">{{ formatDate(p.date) }}</td>
                <td>
                  <span class="time-badge time-badge--in">
                    <VIcon icon="tabler-login" size="13" class="me-1" />
                    {{ formatTime(p.opened_at) }}
                  </span>
                </td>
                <td>
                  <span class="time-badge time-badge--out" v-if="p.closed_at">
                    <VIcon icon="tabler-logout" size="13" class="me-1" />
                    {{ formatTime(p.closed_at) }}
                  </span>
                  <span v-else class="time-badge time-badge--pending">En cours</span>
                </td>
                <td>
                  <span class="font-weight-medium" style="font-size:13px">
                    {{ p.duration || '—' }}
                  </span>
                </td>
                <td>
                  <VChip
                    :color="ptgStatusColor(p.status)"
                    size="small" class="font-weight-medium"
                  >
                    {{ ptgStatusLabel(p.status) }}
                  </VChip>
                </td>
              </tr>
            </tbody>
            <tbody v-else-if="ptgLoading">
              <tr><td colspan="7" class="text-center py-8">
                <VProgressCircular indeterminate color="#E8A838" size="32" />
              </td></tr>
            </tbody>
            <tbody v-else>
              <tr><td colspan="7" class="text-center py-8 text-medium-emphasis">
                Aucun pointage trouvé
              </td></tr>
            </tbody>
          </VTable>

          <!-- Pagination pointage -->
          <div class="d-flex align-center justify-space-between pt-3">
            <span style="font-size:12px; color:#9e9e9e">{{ ptgTotal }} entrée(s)</span>
            <VPagination v-model="ptgPage" :length="Math.ceil(ptgTotal / ptgPerPage)" total-visible="5" size="small" />
          </div>
        </VCardText>
      </VCard>
    </div>

    <!-- ══════════════════════════════════════
         ONGLET 3 — SESSIONS DE CAISSE
    ══════════════════════════════════════ -->
    <div v-else-if="activeTab === 'sessions'">

      <!-- Sous-navigation Sessions / Rôles de caisse -->
      <div class="d-flex align-center gap-3 mb-5">
        <button
          class="sub-tab-btn" :class="sessSubTab === 'sessions' ? 'sub-tab-btn--active' : ''"
          @click="sessSubTab = 'sessions'">
          <VIcon icon="tabler-cash-register" size="16" class="me-1" />Sessions
        </button>
        <button
          class="sub-tab-btn" :class="sessSubTab === 'roles' ? 'sub-tab-btn--active' : ''"
          @click="sessSubTab = 'roles'; loadCaisseRoles()">
          <VIcon icon="tabler-shield-check" size="16" class="me-1" />Rôles de caisse
        </button>
      </div>

      <!-- ══ SOUS-ONGLET : RÔLES DE CAISSE ══ -->
      <div v-if="sessSubTab === 'roles'">
        <!-- Header -->
        <VCard class="mb-4" elevation="0" border>
          <VCardText class="pa-4">
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-subtitle-1 font-weight-bold" style="color:#1a1a2e">Gestion des rôles de caisse</div>
                <div style="font-size:12px;color:#9e9e9e">Définissez les rôles et permissions spécifiques à la caisse</div>
              </div>
              <VBtn style="background:#E8A838;color:#1a1a2e;border-radius:8px" size="small" elevation="0"
                @click="openAddCaisseRole">
                <VIcon icon="tabler-plus" size="16" class="me-1" />Nouveau rôle
              </VBtn>
            </div>
          </VCardText>
        </VCard>

        <!-- Rôles standards pré-définis -->
        <VRow class="mb-4">
          <VCol cols="12" sm="6" v-for="preset in caisseRolePresets" :key="preset.key">
            <VCard elevation="0" border style="border-radius:12px">
              <VCardText class="pa-4">
                <div class="d-flex align-center gap-3 mb-3">
                  <div :style="`background:${preset.color}20;border-radius:8px;padding:8px`">
                    <VIcon :icon="preset.icon" :color="preset.color" size="22" />
                  </div>
                  <div>
                    <div class="font-weight-bold" style="color:#1a1a2e;font-size:14px">{{ preset.name }}</div>
                    <div style="font-size:11px;color:#9e9e9e">{{ preset.description }}</div>
                  </div>
                  <VSpacer />
                  <VChip color="info" size="x-small">Standard</VChip>
                </div>
                <div class="d-flex flex-wrap gap-1">
                  <VChip v-for="perm in preset.permissions" :key="perm"
                    size="x-small" variant="tonal" color="primary">
                    {{ perm }}
                  </VChip>
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>

        <!-- Rôles personnalisés -->
        <VCard elevation="0" border>
          <VCardText class="pa-4">
            <div class="text-subtitle-2 font-weight-bold mb-3" style="color:#1a1a2e">Rôles personnalisés</div>
            <div v-if="caisseRolesLoading" class="text-center py-6">
              <VProgressCircular indeterminate color="#E8A838" size="28" />
            </div>
            <div v-else-if="!caisseRoles.length" class="text-center py-6 text-medium-emphasis" style="font-size:13px">
              <VIcon icon="tabler-shield-off" size="36" style="color:#e0e0e0" class="mb-2 d-block" />
              Aucun rôle personnalisé. Cliquez sur "Nouveau rôle" pour en créer un.
            </div>
            <div v-else>
              <div v-for="role in caisseRoles" :key="role.id"
                class="d-flex align-center gap-3 py-3" style="border-bottom:1px solid #f5f5f5">
                <VIcon icon="tabler-shield-check" color="#E8A838" size="20" />
                <div class="flex-grow-1">
                  <div class="font-weight-medium" style="font-size:13px;color:#1a1a2e">{{ role.name }}</div>
                  <div class="d-flex flex-wrap gap-1 mt-1">
                    <VChip v-for="p in (role.permissions || [])" :key="p.id"
                      size="x-small" variant="tonal" color="success">{{ p.label || p.name }}</VChip>
                  </div>
                </div>
                <IconBtn size="small" color="success" @click="openEditCaisseRole(role)">
                  <VIcon icon="tabler-pencil" size="16" />
                </IconBtn>
                <IconBtn size="small" color="error" @click="deleteCaisseRole(role)">
                  <VIcon icon="tabler-trash" size="16" />
                </IconBtn>
              </div>
            </div>
          </VCardText>
        </VCard>

        <!-- Matrice des permissions -->
        <VCard class="mt-4" elevation="0" border>
          <VCardText class="pa-4">
            <div class="text-subtitle-2 font-weight-bold mb-3" style="color:#1a1a2e">
              <VIcon icon="tabler-lock-access" size="18" class="me-1" />Permissions disponibles
            </div>
            <VRow dense>
              <VCol cols="12" sm="6" md="4" v-for="perm in caissePermissionsList" :key="perm.key">
                <div class="d-flex align-center gap-2 py-2" style="border-bottom:1px solid #fafafa">
                  <VIcon :icon="perm.icon" size="16" style="color:#E8A838" />
                  <div>
                    <div style="font-size:12px;font-weight:600;color:#1a1a2e">{{ perm.label }}</div>
                    <div style="font-size:11px;color:#9e9e9e">{{ perm.description }}</div>
                  </div>
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </div>

      <!-- ══ SOUS-ONGLET : SESSIONS ══ -->
      <div v-if="sessSubTab === 'sessions'">

      <!-- Filtres -->
      <VCard class="mb-4">
        <VCardText class="pa-4">
          <div class="d-flex align-center gap-3 flex-wrap">
            <span class="filter-label">Filtres</span>
            <VSelect
              v-model="sessEmployeeId"
              :items="employeeOptions"
              item-title="name" item-value="id"
              placeholder="Employé"
              hide-details clearable density="compact" variant="outlined"
              style="min-width:160px; max-width:200px"
            />
            <VSelect
              v-model="sessCaisseId"
              :items="caisseOptions"
              item-title="name" item-value="id"
              placeholder="Caisse"
              hide-details clearable density="compact" variant="outlined"
              style="min-width:140px; max-width:170px"
            />
            <VTextField
              v-model="sessDateFrom"
              type="date" label="Du"
              hide-details density="compact" variant="outlined"
              style="min-width:140px; max-width:160px"
            />
            <VTextField
              v-model="sessDateTo"
              type="date" label="Au"
              hide-details density="compact" variant="outlined"
              style="min-width:140px; max-width:160px"
            />
            <VSelect
              v-model="sessStatut"
              :items="sessStatutOptions"
              placeholder="Statut"
              hide-details clearable density="compact" variant="outlined"
              style="min-width:130px; max-width:160px"
            />
            <VBtn class="apply-btn sess-apply-btn" elevation="0" @click="loadSessions">Appliquer</VBtn>
            <VSpacer />
            <VBtn class="export-btn" variant="outlined" @click="exportSessions">
              <VIcon icon="tabler-upload" size="16" class="me-1" />Export
            </VBtn>
            <VBtn class="add-btn" elevation="0" @click="openAddSession">
              <VIcon icon="tabler-plus" size="16" class="me-1" />Ajouté caisse
            </VBtn>
          </div>
        </VCardText>
      </VCard>

      <!-- Stats sessions -->
      <VRow class="mb-4">
        <VCol cols="12" sm="3">
          <VCard class="stat-card text-center pa-4">
            <VIcon icon="tabler-cash-register" color="#E8A838" size="28" class="mb-2" />
            <div class="text-h5 font-weight-bold">{{ sessStats.total_sessions }}</div>
            <div class="stat-label">Total sessions</div>
          </VCard>
        </VCol>
        <VCol cols="12" sm="3">
          <VCard class="stat-card text-center pa-4">
            <VIcon icon="tabler-lock-open" color="#4CAF50" size="28" class="mb-2" />
            <div class="text-h5 font-weight-bold">{{ sessStats.ouvertes }}</div>
            <div class="stat-label">Sessions ouvertes</div>
          </VCard>
        </VCol>
        <VCol cols="12" sm="3">
          <VCard class="stat-card text-center pa-4">
            <VIcon icon="tabler-lock" color="#9e9e9e" size="28" class="mb-2" />
            <div class="text-h5 font-weight-bold">{{ sessStats.cloturees }}</div>
            <div class="stat-label">Sessions clôturées</div>
          </VCard>
        </VCol>
        <VCol cols="12" sm="3">
          <VCard class="stat-card text-center pa-4">
            <VIcon icon="tabler-currency-euro" color="#1a1a2e" size="28" class="mb-2" />
            <div class="text-h5 font-weight-bold">{{ sessStats.montant_total }} €</div>
            <div class="stat-label">Montant total encaissé</div>
          </VCard>
        </VCol>
      </VRow>

      <!-- Toggle: actives / archivées -->
      <div class="d-flex align-center gap-3 mb-3">
        <div class="archive-toggle">
          <button
            class="archive-btn"
            :class="!showArchived ? 'archive-btn--active' : ''"
            @click="showArchived = false; loadSessions()"
          >Sessions actives</button>
          <button
            class="archive-btn"
            :class="showArchived ? 'archive-btn--active' : ''"
            @click="showArchived = true; loadSessions()"
          >
            <VIcon icon="tabler-archive" size="14" class="me-1" />
            Archives
          </button>
        </div>
      </div>

      <!-- Table sessions -->
      <VCard>
        <VCardText class="pa-4">
          <VTable class="sessions-table">
            <thead>
              <tr>
                <th class="table-th">ID SESSION</th>
                <th class="table-th">EMPLOYÉ</th>
                <th class="table-th">CAISSE</th>
                <th class="table-th">PARC</th>
                <th class="table-th">OUVERTURE</th>
                <th class="table-th">CLÔTURE</th>
                <th class="table-th">MONTANT ENCAISSÉ</th>
                <th class="table-th">STATUT</th>
                <th class="table-th">ACTIONS</th>
              </tr>
            </thead>
            <tbody v-if="!sessLoading && sessions.length">
              <tr v-for="s in sessions" :key="s.id">
                <td>
                  <span class="session-id">#{{ s.id }}</span>
                </td>
                <td style="font-size:13px">
                  {{ s.employee?.user?.firstname }} {{ s.employee?.user?.lastname }}
                </td>
                <td style="font-size:13px">{{ s.cash_register?.name || s.caisse?.name || '—' }}</td>
                <td style="font-size:13px">{{ s.park?.localisation || s.park?.name || '—' }}</td>
                <td style="font-size:13px">{{ formatDateTime(s.opened_at || s.created_at) }}</td>
                <td style="font-size:13px">{{ s.closed_at ? formatDateTime(s.closed_at) : '—' }}</td>
                <td>
                  <span class="font-weight-bold" style="color:#1a1a2e">
                    {{ (parseFloat(s.total ?? s.total_sales ?? s.montant ?? s.total_amount) || 0).toLocaleString('fr-FR') }} €
                  </span>
                </td>
                <td>
                  <VChip
                    :color="s.status === 'open' || s.statut === 'ouverte' ? 'success' : 'default'"
                    size="small" class="font-weight-medium"
                  >
                    {{ s.status === 'open' || s.statut === 'ouverte' ? 'Ouverte' : 'Clôturée' }}
                  </VChip>
                </td>
                <td>
                  <IconBtn size="small" color="info" @click="openSessionDetails(s)">
                    <VIcon icon="tabler-eye" size="17" />
                    <VTooltip activator="parent" location="top">Détails</VTooltip>
                  </IconBtn>
                  <IconBtn size="small" color="success" @click="openEditSession(s)">
                    <VIcon icon="tabler-pencil" size="17" />
                    <VTooltip activator="parent" location="top">Modifier</VTooltip>
                  </IconBtn>
                  <IconBtn size="small" color="warning" @click="printSession(s)" v-if="s.status !== 'open'">
                    <VIcon icon="tabler-printer" size="17" />
                    <VTooltip activator="parent" location="top">Imprimer</VTooltip>
                  </IconBtn>
                </td>
              </tr>
            </tbody>
            <tbody v-else-if="sessLoading">
              <tr><td colspan="9" class="text-center py-8">
                <VProgressCircular indeterminate color="#E8A838" size="32" />
              </td></tr>
            </tbody>
            <tbody v-else>
              <tr><td colspan="9" class="text-center py-8 text-medium-emphasis">
                Aucune session trouvée
              </td></tr>
            </tbody>
          </VTable>

          <div class="d-flex align-center justify-space-between pt-3">
            <span style="font-size:12px; color:#9e9e9e">{{ sessTotal }} session(s)</span>
            <VPagination v-model="sessPage" :length="Math.ceil(sessTotal / sessPerPage) || 1" total-visible="5" size="small" />
          </div>
        </VCardText>
      </VCard>
      </div><!-- end sessSubTab sessions -->
    </div><!-- end activeTab sessions -->

    <!-- ══════════════════════════════════════
         MODAL DÉTAILS EMPLOYÉ
    ══════════════════════════════════════ -->
    <VDialog v-model="empDetailsDialog" max-width="500">
      <VCard v-if="currentEmp">
        <VCardText class="pa-6">
          <div class="d-flex align-center gap-2 mb-4">
            <VBtn icon variant="text" size="small" @click="empDetailsDialog = false">
              <VIcon icon="tabler-arrow-left" size="20" />
            </VBtn>
            <span class="text-h6 font-weight-bold">Détails de l'employé</span>
          </div>
          <div class="text-center mb-5">
            <VAvatar size="80" :image="currentEmp.user?.image || placeholder" />
            <div class="text-subtitle-1 font-weight-bold mt-2">
              {{ currentEmp.user?.firstname }} {{ currentEmp.user?.lastname }}
            </div>
            <VChip :color="empColor(currentEmp.status)" size="small" class="mt-1">
              {{ empStatus(currentEmp.status) }}
            </VChip>
          </div>
          <div class="info-row"><span class="info-label">Email</span><span>{{ currentEmp.user?.email || '—' }}</span></div>
          <div class="info-row"><span class="info-label">Téléphone</span><span>{{ currentEmp.user?.phone || '—' }}</span></div>
          <div class="info-row"><span class="info-label">Date de naissance</span><span>{{ currentEmp.user?.birthdate || '—' }}</span></div>
          <div class="info-row"><span class="info-label">Rôle</span><span>{{ currentEmp.roles?.map(r => r.name).join(', ') || '—' }}</span></div>
          <div class="info-row"><span class="info-label">Parc / Entreprise</span><span>{{ currentEmp.park?.name || currentEmp.park?.localisation || currentEmp.owner?.company || '—' }}</span></div>
        </VCardText>
        <VCardText class="d-flex justify-end gap-2 pb-5">
          <VBtn variant="outlined" @click="empDetailsDialog = false">Fermer</VBtn>
          <VBtn class="apply-btn" elevation="0" @click="goToPointageEmp(currentEmp)">
            <VIcon icon="tabler-clock" size="16" class="me-1" />Voir pointage
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- ══════════════════════════════════════
         MODAL DÉTAILS SESSION
    ══════════════════════════════════════ -->
    <VDialog v-model="sessDetailsDialog" max-width="520">
      <VCard v-if="currentSession">
        <VCardText class="pa-6">
          <div class="d-flex align-center gap-2 mb-4">
            <VBtn icon variant="text" size="small" @click="sessDetailsDialog = false">
              <VIcon icon="tabler-arrow-left" size="20" />
            </VBtn>
            <span class="text-h6 font-weight-bold">Session #{{ currentSession.id }}</span>
            <VChip
              :color="currentSession.status === 'open' ? 'success' : 'default'"
              size="small" class="ms-2"
            >
              {{ currentSession.status === 'open' ? 'Ouverte' : 'Clôturée' }}
            </VChip>
          </div>

          <div class="info-row"><span class="info-label">Employé</span>
            <span>{{ currentSession.employee?.user?.firstname }} {{ currentSession.employee?.user?.lastname }}</span>
          </div>
          <div class="info-row"><span class="info-label">Caisse</span><span>{{ currentSession.cash_register?.name || currentSession.caisse?.name || '—' }}</span></div>
          <div class="info-row"><span class="info-label">Parc</span><span>{{ currentSession.park?.localisation || currentSession.park?.name || '—' }}</span></div>
          <div class="info-row"><span class="info-label">Ouverture</span><span>{{ formatDateTime(currentSession.opened_at || currentSession.created_at) }}</span></div>
          <div class="info-row"><span class="info-label">Clôture</span><span>{{ currentSession.closed_at ? formatDateTime(currentSession.closed_at) : 'En cours' }}</span></div>

          <VDivider class="my-4" />

          <!-- Montants -->
          <VRow>
            <VCol cols="6">
              <div class="text-caption text-medium-emphasis">Montant ouverture</div>
              <div class="text-h6 font-weight-bold">{{ (currentSession.montant_ouverture || 0).toLocaleString('fr-FR') }} €</div>
            </VCol>
            <VCol cols="6">
              <div class="text-caption text-medium-emphasis">Montant clôture</div>
              <div class="text-h6 font-weight-bold" style="color:#E8A838">
                {{ (currentSession.montant || currentSession.total_amount || 0).toLocaleString('fr-FR') }} €
              </div>
            </VCol>
          </VRow>

          <!-- Méthodes de paiement -->
          <div v-if="currentSession.payments && currentSession.payments.length" class="mt-4">
            <div class="text-subtitle-2 font-weight-bold mb-2">Répartition des paiements</div>
            <div v-for="pay in currentSession.payments" :key="pay.method"
                 class="d-flex justify-space-between py-1" style="border-bottom:1px solid #f5f5f5">
              <span style="font-size:13px">{{ pay.method }}</span>
              <span class="font-weight-medium" style="font-size:13px">{{ (pay.amount || 0).toLocaleString('fr-FR') }} €</span>
            </div>
          </div>
        </VCardText>
        <VCardText class="d-flex gap-2 pb-5">
          <VBtn variant="outlined" @click="sessDetailsDialog = false">Fermer</VBtn>
          <VSpacer />
          <VBtn class="export-btn" variant="outlined" @click="printSession(currentSession)">
            <VIcon icon="tabler-printer" size="16" class="me-1" />Imprimer
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- ══ MODAL AJOUTER EMPLOYÉ ══ -->
    <VDialog v-model="addEmpDialog" max-width="560" scrollable persistent>
      <VCard style="border-radius:14px;overflow:hidden">
        <div class="emp-modal-header d-flex align-center gap-2 px-5 py-4">
          <button class="emp-back-btn" @click="addEmpDialog=false">
            <VIcon icon="tabler-arrow-left" size="17" />
          </button>
          <span class="emp-modal-title">Ajouter un employé</span>
        </div>
        <VCardText class="px-5 pt-4 pb-2">
          <VForm ref="addEmpForm">
            <VRow dense>
              <VCol cols="12" md="6">
                <div class="emp-label mb-1">Prénom <span class="req">*</span></div>
                <VTextField v-model="addEmpData.firstname" placeholder="Prénom"
                  density="compact" variant="outlined" hide-details
                  :rules="[v=>!!v||'Requis']" />
              </VCol>
              <VCol cols="12" md="6">
                <div class="emp-label mb-1">Nom <span class="req">*</span></div>
                <VTextField v-model="addEmpData.lastname" placeholder="Nom"
                  density="compact" variant="outlined" hide-details
                  :rules="[v=>!!v||'Requis']" />
              </VCol>
              <VCol cols="12" md="6" class="mt-3">
                <div class="emp-label mb-1">Email <span class="req">*</span></div>
                <VTextField v-model="addEmpData.email" placeholder="email@exemple.com" type="email"
                  density="compact" variant="outlined" hide-details
                  :rules="[
                    v => !!v || 'Requis',
                    v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'Email invalide (ex: nom@exemple.com)'
                  ]" />
              </VCol>
              <VCol cols="12" md="6" class="mt-3">
                <div class="emp-label mb-1">Téléphone <span class="req">*</span></div>
                <VTextField v-model="addEmpData.phone" placeholder="+213770123456 ou +33612345678"
                  density="compact" variant="outlined" hide-details
                  :rules="[
                    v => !!v || 'Requis',
                    v => /^\+(213[567]\d{8}|33[1-9]\d{8})$/.test(v) || 'Format: +213XXXXXXXXX (DZ) ou +33XXXXXXXXX (FR)'
                  ]"
                />
              </VCol>
              <VCol cols="12" md="6" class="mt-3">
                <div class="emp-label mb-1">Rôle caisse <span class="req">*</span></div>
                <VSelect v-model="addEmpData.caisse_role_id" :items="caisseRoles"
                  item-title="name" item-value="id" placeholder="Sélectionner un rôle caisse"
                  density="compact" variant="outlined" hide-details
                  :rules="[v=>!!v||'Requis']" />
              </VCol>
              <VCol cols="12" md="6" class="mt-3">
                <div class="emp-label mb-1">Parc <span class="req">*</span></div>
                <VSelect v-model="addEmpData.park_id" :items="parcOptions"
                  item-title="name" item-value="id" placeholder="Sélectionner un parc"
                  density="compact" variant="outlined" hide-details
                  :rules="[v=>!!v||'Requis']" />
              </VCol>
              <VCol cols="12" md="6" class="mt-3">
                <div class="emp-label mb-1">Caisse <span class="req">*</span></div>
                <VSelect v-model="addEmpData.cash_register_id" :items="cashRegisters"
                  item-title="name" item-value="id" placeholder="Sélectionner une caisse"
                  density="compact" variant="outlined" hide-details
                  :rules="[v=>!!v||'Requis']" />
              </VCol>
              <VCol cols="12" md="6" class="mt-3">
                <div class="emp-label mb-1">Date de naissance <span class="req">*</span></div>
                <VTextField v-model="addEmpData.birthdate" type="date"
                  density="compact" variant="outlined" hide-details
                  :max="new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]"
                  :rules="[
                    v => !!v || 'Requis',
                    v => {
                      const min18 = new Date(); min18.setFullYear(min18.getFullYear() - 18);
                      return new Date(v) <= min18 || 'L\'employé doit avoir au moins 18 ans'
                    }
                  ]" />
              </VCol>
              <VCol cols="12" md="6" class="mt-3">
                <div class="emp-label mb-1">Date de début <span class="req">*</span></div>
                <VTextField v-model="addEmpData.start_date" type="date"
                  density="compact" variant="outlined" hide-details
                  :min="new Date().toISOString().split('T')[0]"
                  :rules="[
                    v => !!v || 'Requis',
                    v => v >= new Date().toISOString().split('T')[0] || 'La date de début doit être aujourd\'hui ou après'
                  ]" />
              </VCol>
              <VCol cols="12" class="mt-3">
                <div class="emp-label mb-1">Adresse <span class="req">*</span></div>
                <VTextField v-model="addEmpData.address" placeholder="Ex: 12 Rue de la Paix, Paris"
                  density="compact" variant="outlined" hide-details
                  :rules="[v=>!!v||'Requis']" />
              </VCol>
              <VCol cols="12" class="mt-3">
                <div class="emp-label mb-1">Mot de passe <span class="req">*</span></div>
                <VTextField v-model="addEmpData.password" placeholder="Minimum 8 caractères"
                  type="password" density="compact" variant="outlined" hide-details
                  :rules="[v=>!!v||'Requis', v=>v.length>=8||'Minimum 8 caractères']" />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
        <div class="emp-modal-footer">
          <button class="emp-footer-btn emp-footer-btn--cancel" @click="addEmpDialog=false">Annuler</button>
          <button class="emp-footer-btn emp-footer-btn--confirm" :disabled="addEmpSaving" @click="saveEmployee">
            <VProgressCircular v-if="addEmpSaving" size="14" indeterminate color="#fff" class="me-1" />
            Ajouter
          </button>
        </div>
      </VCard>
    </VDialog>

    <!-- ══ MODAL SUPPRIMER EMPLOYÉ ══ -->
    <VDialog v-model="deleteEmpDialog" max-width="420">
      <VCard style="border-radius:14px">
        <VCardText class="pa-6 pb-3">
          <div class="text-subtitle-1 font-weight-bold mb-2" style="color:#1a1a2e">Supprimer l'employé</div>
          <p style="font-size:13px;color:#666">
            Voulez-vous vraiment supprimer
            <strong>{{ deleteEmpTarget?.user?.firstname }} {{ deleteEmpTarget?.user?.lastname }}</strong> ?
            Cette action est irréversible.
          </p>
        </VCardText>
        <VCardText class="d-flex justify-end gap-2 pb-5">
          <VBtn variant="outlined" style="border-radius:8px;color:#555" @click="deleteEmpDialog=false">Annuler</VBtn>
          <VBtn style="background:#e53935;color:#fff;border-radius:8px;font-weight:700" elevation="0"
            :loading="deleteEmpSaving" @click="confirmDeleteEmp">Supprimer</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- ══ MODAL MODIFIER EMPLOYÉ ══ -->
    <VDialog v-model="editEmpDialog" max-width="560" scrollable persistent>
      <VCard style="border-radius:14px;overflow:hidden">
        <div class="emp-modal-header d-flex align-center gap-2 px-5 py-4">
          <button class="emp-back-btn" @click="editEmpDialog=false">
            <VIcon icon="tabler-arrow-left" size="17" />
          </button>
          <span class="emp-modal-title">Modifier l'employé</span>
        </div>
        <VCardText class="px-5 pt-4 pb-2">
          <VForm ref="editEmpForm">
            <VRow dense>
              <VCol cols="12" md="6">
                <div class="emp-label mb-1">Prénom <span class="req">*</span></div>
                <VTextField v-model="editEmpData.firstname" placeholder="Prénom"
                  density="compact" variant="outlined" hide-details
                  :rules="[v=>!!v||'Requis']" />
              </VCol>
              <VCol cols="12" md="6">
                <div class="emp-label mb-1">Nom <span class="req">*</span></div>
                <VTextField v-model="editEmpData.lastname" placeholder="Nom"
                  density="compact" variant="outlined" hide-details
                  :rules="[v=>!!v||'Requis']" />
              </VCol>
              <VCol cols="12" md="6" class="mt-3">
                <div class="emp-label mb-1">Email <span class="req">*</span></div>
                <VTextField v-model="editEmpData.email" placeholder="email@exemple.com" type="email"
                  density="compact" variant="outlined" hide-details
                  :rules="[v=>!!v||'Requis', v=>/.+@.+/.test(v)||'Email invalide']" />
              </VCol>
              <VCol cols="12" md="6" class="mt-3">
                <div class="emp-label mb-1">Téléphone</div>
                <VTextField v-model="editEmpData.phone" placeholder="+33..."
                  density="compact" variant="outlined" hide-details />
              </VCol>
              <VCol cols="12" md="6" class="mt-3">
                <div class="emp-label mb-1">Rôle caisse</div>
                <VSelect v-model="editEmpData.caisse_role_id" :items="caisseRoles"
                  item-title="name" item-value="id" placeholder="Sélectionner un rôle caisse"
                  density="compact" variant="outlined" hide-details clearable />
              </VCol>
              <VCol cols="12" md="6" class="mt-3">
                <div class="emp-label mb-1">Parc</div>
                <VSelect v-model="editEmpData.park_id" :items="parcOptions"
                  item-title="name" item-value="id" placeholder="Sélectionner un parc"
                  density="compact" variant="outlined" hide-details clearable />
              </VCol>
              <VCol cols="12" md="6" class="mt-3">
                <div class="emp-label mb-1">Date de naissance</div>
                <VTextField v-model="editEmpData.birthdate" type="date"
                  density="compact" variant="outlined" hide-details
                  :max="new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]" />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
        <div class="emp-modal-footer">
          <button class="emp-footer-btn emp-footer-btn--cancel" @click="editEmpDialog=false">Annuler</button>
          <button class="emp-footer-btn emp-footer-btn--confirm" :disabled="editEmpSaving" @click="saveEditEmployee">
            <VProgressCircular v-if="editEmpSaving" size="14" indeterminate color="#fff" class="me-1" />
            <VIcon v-else icon="tabler-device-floppy" size="15" class="me-1" />
            Enregistrer
          </button>
        </div>
      </VCard>
    </VDialog>

    <!-- ══ DIALOG DÉSACTIVER / ACTIVER EMPLOYÉ ══ -->
    <VDialog v-model="disableEmpDialog" max-width="420">
      <VCard style="border-radius:14px">
        <VCardText class="pa-6 pb-3">
          <div class="text-subtitle-1 font-weight-bold mb-2" style="color:#1a1a2e">
            {{ disableEmpTarget?.status === 'approved' ? 'Désactiver l\'employé' : 'Activer l\'employé' }}
          </div>
          <p style="font-size:13px;color:#666">
            Voulez-vous vraiment
            {{ disableEmpTarget?.status === 'approved' ? 'désactiver' : 'activer' }}
            <strong>{{ disableEmpTarget?.user?.firstname }} {{ disableEmpTarget?.user?.lastname }}</strong> ?
          </p>
        </VCardText>
        <VCardText class="d-flex justify-end gap-2 pb-5">
          <VBtn variant="outlined" style="border-radius:8px;color:#555" @click="disableEmpDialog=false">Annuler</VBtn>
          <VBtn
            :style="disableEmpTarget?.status === 'approved'
              ? 'background:#E65100;color:#fff;border-radius:8px;font-weight:700'
              : 'background:#4CAF50;color:#fff;border-radius:8px;font-weight:700'"
            elevation="0"
            :loading="disableEmpSaving"
            @click="confirmDisableEmp"
          >
            {{ disableEmpTarget?.status === 'approved' ? 'Désactiver' : 'Activer' }}
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- ══ MODAL CODE-BARRES ══ -->
    <VDialog v-model="barcodeDialog" max-width="420">
      <VCard style="border-radius:14px">
        <VCardText class="pa-6">
          <div class="d-flex align-center gap-2 mb-4">
            <VBtn icon variant="text" size="small" @click="barcodeDialog=false">
              <VIcon icon="tabler-arrow-left" size="18" />
            </VBtn>
            <span class="text-h6 font-weight-bold">Code QR employé</span>
          </div>
          <div class="text-center mb-4">
            <VAvatar size="64" :image="barcodeEmp?.user?.image || placeholder" class="mb-3" />
            <div class="font-weight-bold" style="color:#1a1a2e">
              {{ barcodeEmp?.user?.firstname }} {{ barcodeEmp?.user?.lastname }}
            </div>
          </div>
          <!-- QR Code display -->
          <div class="barcode-box">
            <div v-if="barcodeLoading" class="d-flex justify-center py-4">
              <VProgressCircular indeterminate color="#E8A838" size="32" />
            </div>
            <div v-else-if="qrDataUrl" class="text-center">
              <img :src="qrDataUrl" alt="QR Code"
                style="width:180px;height:180px;border-radius:8px;border:2px solid #f0f0f0" />
              <div style="font-size:11px;font-weight:600;letter-spacing:1px;color:#9e9e9e;margin-top:6px">
                {{ barcodeValue }}
              </div>
            </div>
            <div v-else class="text-center py-4 text-medium-emphasis" style="font-size:13px">
              <VIcon icon="tabler-qrcode" size="40" style="color:#e0e0e0" class="mb-2 d-block" />
              Cliquez sur "Générer" pour créer le QR code
            </div>
          </div>
          <div class="d-flex gap-2 mt-4">
            <VBtn class="w-100" style="background:#1a1a2e;color:#fff;border-radius:8px;font-weight:700" elevation="0"
              :loading="barcodeLoading" @click="generateBarcode">
              <VIcon icon="tabler-qrcode" size="16" class="me-1" />Générer
            </VBtn>
            <VBtn v-if="qrDataUrl" variant="outlined" style="border-radius:8px;color:#1a1a2e;border-color:#1a1a2e"
              @click="printBarcode">
              <VIcon icon="tabler-printer" size="16" />
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- ══ MODAL BADGE IMPRESSION ══ -->
    <VDialog v-model="badgeDialog" max-width="380">
      <VCard style="border-radius:14px">
        <VCardText class="pa-5">
          <div class="d-flex align-center gap-2 mb-4">
            <VBtn icon variant="text" size="small" @click="badgeDialog=false">
              <VIcon icon="tabler-arrow-left" size="18" />
            </VBtn>
            <span class="text-h6 font-weight-bold">Badge employé</span>
          </div>
          <!-- Badge preview -->
          <div id="badge-print-area" class="badge-card">
            <div class="badge-header">
              <VIcon icon="tabler-building-community" size="18" color="rgba(255,255,255,0.8)" class="me-2" />
              <span class="badge-company">QWIKLY</span>
            </div>
            <div class="badge-body">
              <VAvatar size="70" :image="badgeEmp?.user?.image || placeholder" style="border:3px solid #E8A838" />
              <div class="badge-name mt-2">{{ badgeEmp?.user?.firstname }} {{ badgeEmp?.user?.lastname }}</div>
              <div class="badge-role">{{ badgeEmp?.roles?.map(r=>r.name).join(', ') || 'Employé' }}</div>
              <div class="badge-park mt-1">{{ badgeEmp?.park?.localisation || badgeEmp?.park?.name || '—' }}</div>
            </div>
            <div class="badge-footer">
              <VIcon icon="tabler-qrcode" size="44" color="#1a1a2e" />
              <div style="font-size:10px;color:#888;margin-top:2px">ID: {{ badgeEmp?.id }}</div>
            </div>
          </div>
          <VBtn class="w-100 mt-4" style="background:#E8A838;color:#1a1a2e;border-radius:8px;font-weight:700" elevation="0"
            @click="printBadge">
            <VIcon icon="tabler-printer" size="16" class="me-1" />Imprimer le badge
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- ══ MODAL AJOUTÉ CAISSE ══ -->
    <VDialog v-model="addSessionDialog" max-width="500" scrollable persistent>
      <VCard style="border-radius:14px;overflow:hidden">
        <div class="emp-modal-header d-flex align-center gap-2 px-5 py-4">
          <button class="emp-back-btn" @click="addSessionDialog=false">
            <VIcon icon="tabler-arrow-left" size="17" />
          </button>
          <span class="emp-modal-title">Ajouté caisse</span>
        </div>

        <!-- Indicateur de temps en cours -->
        <div v-if="sessionTimer" class="session-live-bar">
          <VIcon icon="tabler-clock-play" size="16" class="me-2" style="color:#E8A838" />
          <span>Session ouverte depuis <strong>{{ sessionElapsed }}</strong></span>
          <span class="session-live-dot"></span>
        </div>

        <VCardText class="px-5 pt-4 pb-2">
          <VForm ref="addSessionForm">
            <VRow dense>
              <!-- ID caisse automatique (lecture seule) -->
              <VCol cols="12" class="mb-1">
                <div class="emp-label mb-1">ID Caisse</div>
                <div style="height:36px;padding:0 12px;border:1.5px solid #e0e0e0;border-radius:8px;
                            background:#f9f9f9;display:flex;align-items:center;gap:8px">
                  <VIcon icon="tabler-hash" size="14" style="color:#E8A838;flex-shrink:0" />
                  <span style="font-size:12px;font-weight:700;color:#1a1a2e;letter-spacing:1px">
                    {{ addSessionData.caisse_auto_id }}
                  </span>
                  <span style="font-size:11px;color:#9e9e9e;margin-left:auto">Généré automatiquement</span>
                </div>
              </VCol>

              <VCol cols="12" md="6" class="mt-2">
                <div class="emp-label mb-1">Employé <span style="color:#9e9e9e;font-size:11px">(optionnel)</span></div>
                <VSelect v-model="addSessionData.employee_id"
                  :items="employeeOptions" item-title="name" item-value="id"
                  placeholder="Sélectionner"
                  density="compact" variant="outlined" hide-details clearable />
              </VCol>
              <VCol cols="12" md="6" class="mt-2">
                <div class="emp-label mb-1">Rôle caisse <span class="req">*</span></div>
                <VSelect v-model="addSessionData.caisse_role_id"
                  :items="caisseRoles" item-title="name" item-value="id"
                  placeholder="Sélectionner le rôle"
                  density="compact" variant="outlined" hide-details
                  :rules="[v=>!!v||'Requis']" />
              </VCol>
              <VCol cols="12" class="mt-3">
                <div class="emp-label mb-1">Nom de la caisse <span class="req">*</span></div>
                <VTextField v-model="addSessionData.caisse_nom"
                  placeholder="Ex: Caisse principale"
                  density="compact" variant="outlined" hide-details
                  :rules="[v=>!!v||'Requis']" />
              </VCol>
              <VCol cols="12" class="mt-3">
                <div class="emp-label mb-1">Parc <span class="req">*</span></div>
                <VSelect v-model="addSessionData.park_id"
                  :items="parcOptions" item-title="name" item-value="id"
                  placeholder="Sélectionner le parc"
                  density="compact" variant="outlined" hide-details
                  :rules="[v=>!!v||'Requis']" />
              </VCol>
              <VCol cols="12" md="6" class="mt-3">
                <div class="emp-label mb-1">Heure ouverture <span class="req">*</span></div>
                <VTextField v-model="addSessionData.heure_ouverture"
                  type="time"
                  density="compact" variant="outlined" hide-details
                  :rules="[v=>!!v||'Requis']" />
              </VCol>
              <VCol cols="12" md="6" class="mt-3">
                <div class="emp-label mb-1">Heure fermeture <span class="req">*</span></div>
                <VTextField v-model="addSessionData.heure_fermeture"
                  type="time"
                  density="compact" variant="outlined" hide-details
                  :rules="[
                    v => !!v || 'Requis',
                    v => !addSessionData.heure_ouverture || v > addSessionData.heure_ouverture || 'Doit être après l\'heure d\'ouverture'
                  ]" />
              </VCol>
              <VCol cols="12" class="mt-3">
                <div class="emp-label mb-1">Note</div>
                <VTextarea v-model="addSessionData.note"
                  placeholder="Observations..."
                  rows="2" density="compact" variant="outlined" hide-details />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>

        <div class="emp-modal-footer">
          <button class="emp-footer-btn emp-footer-btn--cancel" @click="addSessionDialog=false">Annuler</button>
          <button class="emp-footer-btn emp-footer-btn--confirm" :disabled="addSessionSaving" @click="saveSession">
            <VProgressCircular v-if="addSessionSaving" size="14" indeterminate color="#fff" class="me-1" />
            <VIcon v-else icon="tabler-lock-open" size="15" class="me-1" />
            Ouvrir caisse
          </button>
        </div>
      </VCard>
    </VDialog>

    <!-- ══ MODAL MODIFIER SESSION ══ -->
    <VDialog v-model="editSessionDialog" max-width="500" scrollable persistent>
      <VCard style="border-radius:14px;overflow:hidden">
        <div class="emp-modal-header d-flex align-center gap-2 px-5 py-4">
          <button class="emp-back-btn" @click="editSessionDialog=false">
            <VIcon icon="tabler-arrow-left" size="17" />
          </button>
          <span class="emp-modal-title">Modifier la session #{{ editSessionData.id }}</span>
        </div>
        <VCardText class="px-5 pt-4 pb-2">
          <VForm ref="editSessionForm">
            <VRow dense>
              <VCol cols="12">
                <div class="emp-label mb-1">Employé <span style="color:#9e9e9e;font-size:11px">(optionnel)</span></div>
                <VSelect v-model="editSessionData.employee_id"
                  :items="employeeOptions" item-title="name" item-value="id"
                  placeholder="Sélectionner un employé"
                  density="compact" variant="outlined" hide-details clearable />
              </VCol>
              <VCol cols="12" class="mt-3">
                <div class="emp-label mb-1">Parc <span class="req">*</span></div>
                <VSelect v-model="editSessionData.park_id"
                  :items="parcOptions" item-title="name" item-value="id"
                  placeholder="Sélectionner le parc"
                  density="compact" variant="outlined" hide-details
                  :rules="[v=>!!v||'Requis']" />
              </VCol>
              <VCol cols="12" class="mt-3">
                <div class="emp-label mb-1">Nom de la caisse <span class="req">*</span></div>
                <VTextField v-model="editSessionData.caisse_nom"
                  placeholder="Ex: Caisse principale"
                  density="compact" variant="outlined" hide-details
                  :rules="[v=>!!v||'Requis']" />
              </VCol>
              <VCol cols="12" class="mt-3">
                <div class="emp-label mb-1">Montant d'ouverture (€)</div>
                <VTextField v-model="editSessionData.montant_ouverture"
                  placeholder="0.00" type="number"
                  density="compact" variant="outlined" hide-details />
              </VCol>
              <VCol cols="12" class="mt-3">
                <div class="emp-label mb-1">Statut</div>
                <VSelect v-model="editSessionData.status"
                  :items="[{title:'Ouverte', value:'open'},{title:'Clôturée', value:'closed'}]"
                  item-title="title" item-value="value"
                  density="compact" variant="outlined" hide-details />
              </VCol>
              <VCol cols="12" class="mt-3" v-if="editSessionData.status === 'closed'">
                <div class="emp-label mb-1">Montant de clôture (€)</div>
                <VTextField v-model="editSessionData.montant_cloture"
                  placeholder="0.00" type="number"
                  density="compact" variant="outlined" hide-details />
              </VCol>
              <VCol cols="12" class="mt-3">
                <div class="emp-label mb-1">Note</div>
                <VTextarea v-model="editSessionData.note"
                  placeholder="Observations..." rows="2"
                  density="compact" variant="outlined" hide-details />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
        <div class="emp-modal-footer">
          <button class="emp-footer-btn emp-footer-btn--cancel" @click="editSessionDialog=false">Annuler</button>
          <button class="emp-footer-btn emp-footer-btn--confirm" :disabled="editSessionSaving" @click="saveEditSession">
            <VProgressCircular v-if="editSessionSaving" size="14" indeterminate color="#fff" class="me-1" />
            <VIcon v-else icon="tabler-device-floppy" size="15" class="me-1" />
            Enregistrer
          </button>
        </div>
      </VCard>
    </VDialog>

    <!-- ══ MODAL RÔLE DE CAISSE (Ajouter / Modifier) ══ -->
    <VDialog v-model="caisseRoleDialog" max-width="520" scrollable persistent>
      <VCard style="border-radius:14px;overflow:hidden">
        <div class="emp-modal-header d-flex align-center gap-2 px-5 py-4">
          <button class="emp-back-btn" @click="caisseRoleDialog=false">
            <VIcon icon="tabler-arrow-left" size="17" />
          </button>
          <span class="emp-modal-title">{{ caisseRoleEditing ? 'Modifier le rôle' : 'Nouveau rôle de caisse' }}</span>
        </div>
        <VCardText class="px-5 pt-4 pb-2">
          <VForm ref="caisseRoleForm">
            <!-- Nom -->
            <div class="emp-label mb-1">Nom du rôle <span class="req">*</span></div>
            <VTextField v-model="caisseRoleData.name"
              placeholder="Ex: Responsable caisse"
              density="compact" variant="outlined" hide-details
              :rules="[v=>!!v||'Requis']" class="mb-4" />

            <!-- Parc -->
            <div class="emp-label mb-1">Parc <span class="req">*</span></div>
            <VSelect
              v-model="caisseRoleData.park_id"
              :items="parcOptions" item-title="name" item-value="id"
              placeholder="Sélectionner un parc"
              density="compact" variant="outlined" hide-details
              :rules="[v=>!!v||'Requis']" class="mb-4"
            />

            <!-- Permissions -->
            <div class="emp-label mb-3">Permissions accordées</div>
            <VRow dense>
              <!-- Si permissions chargées depuis API -->
              <template v-if="realCaissePermissions.length">
                <VCol cols="12" v-for="perm in realCaissePermissions" :key="perm.id">
                  <div class="d-flex align-center gap-3 py-2" style="border-bottom:1px solid #fafafa">
                    <VCheckbox v-model="caisseRoleData.permissions"
                      :value="perm.id" hide-details density="compact"
                      color="#1a1a2e" />
                    <div class="flex-grow-1">
                      <div style="font-size:13px;font-weight:600;color:#1a1a2e">{{ perm.label }}</div>
                      <div style="font-size:11px;color:#9e9e9e">{{ perm.permission }}</div>
                    </div>
                  </div>
                </VCol>
              </template>
              <!-- Fallback liste statique si API non disponible -->
              <template v-else>
                <VCol cols="12" v-for="perm in caissePermissionsList" :key="perm.key">
                  <div class="d-flex align-center gap-3 py-2" style="border-bottom:1px solid #fafafa">
                    <VCheckbox v-model="caisseRoleData.permissions"
                      :value="perm.key" hide-details density="compact"
                      color="#1a1a2e" />
                    <div class="flex-grow-1">
                      <div style="font-size:13px;font-weight:600;color:#1a1a2e">{{ perm.label }}</div>
                      <div style="font-size:11px;color:#9e9e9e">{{ perm.description }}</div>
                    </div>
                    <VIcon :icon="perm.icon" size="18" style="color:#E8A838" />
                  </div>
                </VCol>
              </template>
            </VRow>
          </VForm>
        </VCardText>
        <div class="emp-modal-footer">
          <button class="emp-footer-btn emp-footer-btn--cancel" @click="caisseRoleDialog=false">Annuler</button>
          <button class="emp-footer-btn emp-footer-btn--confirm" :disabled="caisseRoleSaving" @click="saveCaisseRole">
            <VProgressCircular v-if="caisseRoleSaving" size="14" indeterminate color="#fff" class="me-1" />
            <VIcon v-else icon="tabler-device-floppy" size="15" class="me-1" />
            {{ caisseRoleEditing ? 'Mettre à jour' : 'Créer le rôle' }}
          </button>
        </div>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackVisible" location="bottom end" variant="flat" :color="snackColor">
      {{ snackMessage }}
    </VSnackbar>
  </div>
</template>

<script>
import { $api } from "@/utils/api";
import debounce from "lodash/debounce";
import { VDataTableServer } from "vuetify/labs/VDataTable";
import placeholder from "@images/placeholders/user.svg";
import QRCode from "qrcode";

export default {
  setup() {
    return { placeholder };
  },
  components: { VDataTableServer },

  data() {
    return {
      // ── Tabs ──
      activeTab: "employees",
      tabs: [
        { key: "employees", label: "Employés",         icon: "tabler-users" },
        { key: "pointage",  label: "Pointage",          icon: "tabler-clock" },
        { key: "sessions",  label: "Sessions de caisse", icon: "tabler-cash-register" },
      ],

      // ── Employee lookup map (id → employee) for cross-tab use ──
      allEmployeesMap: {},

      // ── Employés tab ──
      empHeaders: [
        { title: "Photo",    key: "image",   sortable: false, width: "60px" },
        { title: "NOM",      key: "name",    sortable: false },
        { title: "RÔLE",     key: "role",    sortable: false },
        { title: "PARC",     key: "park",    sortable: false },
        { title: "STATUT",   key: "status",  sortable: false },
        { title: "ACTIONS",  key: "actions", sortable: false },
      ],
      employees: [],
      empTotal: 0,
      empPage: 1,
      empPerPage: 10,
      empLoading: false,
      searchQuery: "",

      // ── Pointage tab ──
      pointages: [],
      ptgTotal: 0,
      ptgPage: 1,
      ptgPerPage: 15,
      ptgLoading: false,
      ptgEmployeeId: null,
      ptgPeriod: null,
      ptgDateFrom: "",
      ptgDateTo: "",
      ptgStats: { total_employes: 0, total_heures: 0, absences: 0 },

      // ── Sessions tab ──
      sessions: [],
      sessTotal: 0,
      sessPage: 1,
      sessPerPage: 15,
      sessLoading: false,
      sessEmployeeId: null,
      sessCaisseId: null,
      sessDateFrom: "",
      sessDateTo: "",
      sessStatut: null,
      showArchived: false,
      sessStats: { total_sessions: 0, ouvertes: 0, cloturees: 0, montant_total: 0 },

      // ── Shared options ──
      employeeOptions: [],
      caisseOptions: [],
      periodOptions: [
        { title: "Aujourd'hui", value: "day" },
        { title: "Cette semaine", value: "week" },
        { title: "Ce mois", value: "month" },
        { title: "Personnalisé", value: "custom" },
      ],
      sessStatutOptions: [
        { title: "Ouverte", value: "open" },
        { title: "Clôturée", value: "closed" },
      ],

      // ── Dialogs ──
      empDetailsDialog: false,
      sessDetailsDialog: false,
      currentEmp: null,
      currentSession: null,

      // ── Add employee ──
      addEmpDialog: false,
      addEmpSaving: false,
      addEmpData: { firstname:"", lastname:"", email:"", phone:"", password:"", role_id: null, park_id: null, caisse_role_id: null, cash_register_id: null },

      // ── Edit employee ──
      editEmpDialog: false,
      editEmpSaving: false,
      editEmpData: { id: null, firstname:"", lastname:"", email:"", phone:"", role_id: null, park_id: null, caisse_role_id: null },

      // ── Disable employee ──
      disableEmpDialog: false,
      disableEmpSaving: false,
      disableEmpTarget: null,

      // ── Delete employee ──
      deleteEmpDialog: false,
      deleteEmpSaving: false,
      deleteEmpTarget: null,

      // ── Barcode ──
      barcodeDialog: false,
      barcodeLoading: false,
      barcodeEmp: null,
      barcodeValue: "",
      qrDataUrl: "",

      // ── Badge ──
      badgeDialog: false,
      badgeEmp: null,

      // ── Sessions sub-tab ──
      sessSubTab: "sessions",

      // ── Add session ──
      addSessionDialog: false,
      addSessionSaving: false,
      addSessionData: { employee_id: null, park_id: null, caisse_role_id: null, caisse_nom: "", heure_ouverture: "", heure_fermeture: "", note: "", caisse_auto_id: "" },
      parcOptions: [],
      roleOptions: [],
      cashRegisters: [],
      sessionTimer: null,
      sessionStartTime: null,
      sessionElapsed: "00:00",

      // ── Edit session ──
      editSessionDialog: false,
      editSessionSaving: false,
      editSessionData: { id: null, employee_id: null, park_id: null, caisse_nom: "", montant_ouverture: "", montant_cloture: "", status: "open", note: "" },

      // ── Rôles de caisse ──
      caisseRoles: [],
      caisseRolesLoading: false,
      caisseRoleDialog: false,
      caisseRoleSaving: false,
      caisseRoleEditing: false,
      caisseRoleData: { id: null, name: "", park_id: null, permissions: [] },
      realCaissePermissions: [],

      caisseRolePresets: [
        {
          key: "caissier",
          name: "Caissier (Réservations)",
          icon: "tabler-cash",
          color: "#4CAF50",
          description: "Gère les ventes, billets et réservations en caisse",
          permissions: ["Vente billets", "Réservations", "Paiements", "Impression tickets"],
        },
      ],

      caissePermissionsList: [
        { key: "vente_billets",    label: "Vente de billets",      icon: "tabler-ticket",        description: "Émettre et valider des billets" },
        { key: "vente_produits",   label: "Vente de produits",     icon: "tabler-shopping-cart", description: "Vendre des produits depuis la caisse" },
        { key: "accueil_client",   label: "Accueil client",        icon: "tabler-user-check",    description: "Accueillir et orienter les clients" },
        { key: "reservations",     label: "Réservations",          icon: "tabler-calendar",      description: "Créer et gérer les réservations" },
        { key: "paiements",        label: "Paiements",             icon: "tabler-credit-card",   description: "Encaisser et gérer les paiements" },
        { key: "impression",       label: "Impression tickets",    icon: "tabler-printer",       description: "Imprimer les reçus et tickets" },
        { key: "sessions",         label: "Sessions de caisse",    icon: "tabler-cash-register", description: "Ouvrir et fermer les sessions" },
        { key: "statistiques",     label: "Statistiques",          icon: "tabler-chart-bar",     description: "Accéder aux rapports et statistiques" },
        { key: "clients",          label: "Gestion des clients",   icon: "tabler-users",         description: "Consulter et modifier les clients" },
        { key: "remises",          label: "Appliquer des remises", icon: "tabler-percentage",    description: "Accorder des réductions en caisse" },
      ],

      // ── Snackbar ──
      snackVisible: false,
      snackMessage: "",
      snackColor: "success",
    };
  },

  watch: {
    searchQuery() { this.debouncedEmpSearch(); },
    empPage()  { this.loadEmployees(); },
    empPerPage() { this.empPage = 1; this.loadEmployees(); },
    ptgPage()  { this.loadPointage(); },
    sessPage() { this.loadSessions(); },
    activeTab(val) {
      if (val === "pointage"  && !this.pointages.length)  this.loadPointage();
      if (val === "sessions"  && !this.sessions.length)   this.loadSessions();
    },
  },

  created() {
    this.debouncedEmpSearch = debounce(() => {
      this.empPage = 1;
      this.loadEmployees();
    }, 500);
  },

  async mounted() {
    await Promise.all([
      this.loadEmployees(),
      this.loadParcs(),
      this.loadRoles(),
      this.loadCaisseRoles(),
      this.loadCaissePermissions(),
      this.loadAllEmployeesMap(),
      this.loadCashRegisters(),
    ]);
    this.buildEmployeeOptions();
  },

  beforeUnmount() {
    if (this.sessionTimer) clearInterval(this.sessionTimer);
  },

  methods: {
    // ─────────────────────────────────────────
    // EMPLOYÉS
    // ─────────────────────────────────────────
    async loadEmployees() {
      this.empLoading = true;
      try {
        const res = await $api("/employees", {
          params: {
            page: this.empPage,
            per_page: this.empPerPage,
            keyword: this.searchQuery.length >= 3 ? this.searchQuery : "",
          },
        });
        this.employees = res.data || [];
        this.empTotal  = res.total || 0;
      } catch {
        this.showSnack("Impossible de charger les employés", "error");
      } finally {
        this.empLoading = false;
      }
    },

    buildEmployeeOptions() {
      const source = Object.keys(this.allEmployeesMap).length
        ? Object.values(this.allEmployeesMap)
        : this.employees;
      this.employeeOptions = source.map((e) => ({
        id: e.id,
        name: `${e.user?.firstname || ""} ${e.user?.lastname || ""}`.trim(),
      }));
    },

    async loadAllEmployeesMap() {
      try {
        const res = await $api("/employees", { params: { per_page: 500, page: 1 } });
        const map = {};
        (res.data || []).forEach(e => { map[e.id] = e; });
        this.allEmployeesMap = map;
      } catch {}
    },

    // ── Add / Delete / Barcode / Badge ──
    openAddEmp() {
      this.addEmpData = {
        firstname: "", lastname: "", email: "", phone: "", password: "",
        birthdate: "", address: "", start_date: "",
        role_id: null, park_id: null, caisse_role_id: null, cash_register_id: null,
      };
      this.addEmpDialog = true;
    },

    async saveEmployee() {
      const { valid } = await this.$refs.addEmpForm.validate();
      if (!valid) return;
      this.addEmpSaving = true;
      try {
        const { caisse_role_id } = this.addEmpData;
        const payload = {
          firstname:  this.addEmpData.firstname,
          lastname:   this.addEmpData.lastname,
          email:      this.addEmpData.email,
          phone:      this.addEmpData.phone,
          password:          this.addEmpData.password,
          park_id:           this.addEmpData.park_id           || undefined,
          cash_register_id:  this.addEmpData.cash_register_id  || undefined,
          birthdate:         this.addEmpData.birthdate         || undefined,
          address:           this.addEmpData.address           || undefined,
          start_date:        this.addEmpData.start_date        || undefined,
          roles:             caisse_role_id ? [caisse_role_id] : [],
        };
        const res    = await $api("/employees", { method: "POST", body: payload });
        const newEmp = res.employee || res.data || res;
        this.addEmpDialog = false;
        this.loadEmployees();
        await this.autoGenerateQR(newEmp);
      } catch (err) {
        const errData = err?.data || {};
        const errors  = errData?.errors;
        const msg = errors
          ? Object.values(errors).flat().join(" — ")
          : (errData?.message || "Erreur lors de l'ajout de l'employé");
        this.showSnack(msg, "error");
      } finally { this.addEmpSaving = false; }
    },

    async autoGenerateQR(emp) {
      this.barcodeEmp   = emp;
      this.barcodeValue = "";
      this.qrDataUrl    = "";
      this.barcodeDialog = true;
      this.barcodeLoading = true;
      try {
        const res = await $api("/employees/staff/generate-barcode", {
          method: "POST",
          body: { employee_id: emp.id },
        });
        this.barcodeValue = res.barcode || res.code || `EMP-${String(emp.id).padStart(6,"0")}`;
      } catch {
        this.barcodeValue = `EMP-${String(emp.id || Date.now()).padStart(6,"0")}`;
      } finally {
        this.barcodeLoading = false;
        if (this.barcodeValue) {
          this.qrDataUrl = await QRCode.toDataURL(this.barcodeValue, {
            width: 180, margin: 2,
            color: { dark: "#1a1a2e", light: "#ffffff" },
          });
        }
      }
    },

    openDeleteEmp(emp) {
      this.deleteEmpTarget = emp;
      this.deleteEmpDialog = true;
    },

    async confirmDeleteEmp() {
      this.deleteEmpSaving = true;
      try {
        await $api(`/employees/${this.deleteEmpTarget.id}`, { method: "DELETE" });
        this.employees = this.employees.filter(e => e.id !== this.deleteEmpTarget.id);
        this.deleteEmpDialog = false;
        this.showSnack("Employé supprimé", "success");
      } catch {
        this.showSnack("Erreur lors de la suppression", "error");
      } finally { this.deleteEmpSaving = false; }
    },

    // ── Edit employee ──
    openEditEmp(emp) {
      this.editEmpData = {
        id:             emp.id,
        firstname:      emp.user?.firstname || "",
        lastname:       emp.user?.lastname  || "",
        email:          emp.user?.email     || "",
        phone:          emp.user?.phone     || "",
        birthdate:      emp.user?.birthdate ? emp.user.birthdate.split('/').reverse().join('-') : "",
        role_id:        emp.roles?.[0]?.id  || null,
        park_id:        emp.park?.id        || null,
        caisse_role_id: emp.caisse_role?.id || null,
      };
      this.editEmpDialog = true;
    },

    async saveEditEmployee() {
      const { valid } = await this.$refs.editEmpForm.validate();
      if (!valid) return;
      this.editEmpSaving = true;
      try {
        const payload = {
          firstname: this.editEmpData.firstname,
          lastname:  this.editEmpData.lastname,
          email:     this.editEmpData.email,
          phone:     this.editEmpData.phone,
          birthdate: this.editEmpData.birthdate || undefined,
          park_id:   this.editEmpData.park_id   || undefined,
          ...(this.editEmpData.caisse_role_id ? { roles: [this.editEmpData.caisse_role_id] } : {}),
        };
        await $api(`/employees/${this.editEmpData.id}`, {
          method: "PUT",
          body: payload,
        });
        const idx = this.employees.findIndex(e => e.id === this.editEmpData.id);
        if (idx !== -1) {
          const existing = this.employees[idx];
          const selectedPark = this.parcOptions.find(p => p.id === this.editEmpData.park_id) || null;
          const selectedCaisseRole = this.caisseRoles.find(r => r.id === this.editEmpData.caisse_role_id) || null;
          this.employees.splice(idx, 1, {
            ...existing,
            user: {
              ...existing.user,
              firstname: this.editEmpData.firstname,
              lastname:  this.editEmpData.lastname,
              email:     this.editEmpData.email,
              phone:     this.editEmpData.phone,
            },
            park:        selectedPark ? { ...(existing.park || {}), id: selectedPark.id, name: selectedPark.name } : existing.park,
            caisse_role: selectedCaisseRole ? { id: selectedCaisseRole.id, name: selectedCaisseRole.name } : null,
          });
        }
        this.buildEmployeeOptions();
        this.editEmpDialog = false;
        this.showSnack("Employé mis à jour avec succès", "success");
      } catch {
        this.showSnack("Erreur lors de la mise à jour", "error");
      } finally { this.editEmpSaving = false; }
    },

    // ── Disable / Enable employee ──
    openDisableEmp(emp) {
      this.disableEmpTarget = emp;
      this.disableEmpDialog = true;
    },

    async confirmDisableEmp() {
      this.disableEmpSaving = true;
      const isActive = this.disableEmpTarget.status === "approved";
      try {
        await $api(`/employees/${this.disableEmpTarget.id}/change-status`, {
          method: "PATCH",
          body: { status: isActive ? "refused" : "approved" },
        });
        const idx = this.employees.findIndex(e => e.id === this.disableEmpTarget.id);
        if (idx !== -1) this.employees.splice(idx, 1, {
          ...this.employees[idx],
          status: isActive ? "refused" : "approved",
        });
        this.disableEmpDialog = false;
        this.showSnack(isActive ? "Employé désactivé" : "Employé activé", "success");
      } catch {
        this.showSnack("Erreur lors du changement de statut", "error");
      } finally { this.disableEmpSaving = false; }
    },

    openGenerateBarcode(emp) {
      this.barcodeEmp    = emp;
      this.barcodeValue  = "";
      this.qrDataUrl     = "";
      this.barcodeDialog = true;
    },

    async generateBarcode() {
      this.barcodeLoading = true;
      try {
        const res = await $api("/employees/staff/generate-barcode", {
          method: "POST",
          body: { employee_id: this.barcodeEmp.id },
        });
        this.barcodeValue = res.barcode || res.code || `EMP-${this.barcodeEmp.id}`;
        this.showSnack("QR Code généré", "success");
      } catch {
        this.barcodeValue = `EMP-${String(this.barcodeEmp.id).padStart(6,"0")}`;
        this.showSnack("QR Code généré localement", "info");
      } finally {
        this.barcodeLoading = false;
        if (this.barcodeValue) {
          this.qrDataUrl = await QRCode.toDataURL(this.barcodeValue, {
            width: 180, margin: 2,
            color: { dark: "#1a1a2e", light: "#ffffff" },
          });
        }
      }
    },

    printBarcode() {
      const w = window.open("", "_blank", "width=400,height=400");
      w.document.write(`
        <html><head><title>QR Code</title>
        <style>body{font-family:sans-serif;text-align:center;padding:20px}
        .val{font-size:13px;font-weight:bold;letter-spacing:2px;margin-top:8px;color:#1a1a2e}</style>
        </head><body>
        <p style="font-weight:bold">${this.barcodeEmp?.user?.firstname || ""} ${this.barcodeEmp?.user?.lastname || ""}</p>
        <img src="${this.qrDataUrl}" style="width:180px;height:180px" />
        <div class="val">${this.barcodeValue}</div>
        <script>window.print()<\/script>
        </body></html>`);
      w.document.close();
    },

    openPrintBadge(emp) {
      this.badgeEmp    = emp;
      this.badgeDialog = true;
    },

    printBadge() {
      const badge = document.getElementById("badge-print-area");
      if (!badge) return;
      const w = window.open("", "_blank", "width=400,height=600");
      w.document.write(`
        <html><head><title>Badge Employé</title>
        <style>
          body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5}
          .badge{width:280px;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.15);background:#fff}
          .badge-h{background:#1a1a2e;padding:16px;text-align:center;color:#fff;font-size:14px;font-weight:bold;letter-spacing:2px}
          .badge-b{padding:20px;text-align:center}
          .badge-avatar{width:80px;height:80px;border-radius:50%;border:3px solid #E8A838;object-fit:cover}
          .badge-name{font-size:16px;font-weight:700;color:#1a1a2e;margin-top:10px}
          .badge-role{font-size:12px;color:#9e9e9e;margin-top:4px}
          .badge-park{font-size:11px;color:#555;margin-top:3px}
          .badge-f{background:#f9f9f9;padding:14px;text-align:center;border-top:1px solid #f0f0f0}
        </style></head>
        <body><div class="badge">
          <div class="badge-h">QWIKLY</div>
          <div class="badge-b">
            <img class="badge-avatar" src="${this.badgeEmp?.user?.image || ''}" onerror="this.style.display='none'" />
            <div class="badge-name">${this.badgeEmp?.user?.firstname || ''} ${this.badgeEmp?.user?.lastname || ''}</div>
            <div class="badge-role">${this.badgeEmp?.roles?.map(r=>r.name).join(', ') || 'Employé'}</div>
            <div class="badge-park">${this.badgeEmp?.park?.localisation || this.badgeEmp?.park?.name || ''}</div>
          </div>
          <div class="badge-f">
            <div style="font-size:28px">|||||||||||||||</div>
            <div style="font-size:11px;margin-top:4px;color:#555">ID: ${this.badgeEmp?.id}</div>
          </div>
        </div>
        <script>window.print()<\/script>
        </body></html>`);
      w.document.close();
    },

    openEmpDetails(emp) {
      this.currentEmp = emp;
      this.empDetailsDialog = true;
    },

    openPointageEmp(emp) {
      this.ptgEmployeeId = emp.id;
      this.activeTab = "pointage";
      this.loadPointage();
    },

    goToPointageEmp(emp) {
      this.empDetailsDialog = false;
      this.openPointageEmp(emp);
    },

    exportEmployees() {
      const rows = [
        ["Nom", "Prénom", "Email", "Téléphone", "Rôle", "Statut"],
        ...this.employees.map((e) => [
          e.user?.lastname || "",
          e.user?.firstname || "",
          e.user?.email || "",
          e.user?.phone || "",
          e.roles?.map((r) => r.name).join(", ") || "",
          this.empStatus(e.status),
        ]),
      ];
      this.downloadCsv(rows, "employes.csv");
    },

    empColor(s) {
      return s === "approved" ? "success" : s === "refused" ? "error" : "warning";
    },
    empStatus(s) {
      return s === "approved" ? "Approuvé" : s === "refused" ? "Refusé" : "En attente";
    },

    // ─────────────────────────────────────────
    // POINTAGE
    // ─────────────────────────────────────────
    async loadPointage() {
      this.ptgLoading = true;
      try {
        const params = {
          page: this.ptgPage,
          per_page: this.ptgPerPage,
        };
        if (this.ptgEmployeeId) params.employee_id = this.ptgEmployeeId;
        if (this.ptgDateFrom)   params.from_date   = this.ptgDateFrom;
        if (this.ptgDateTo)     params.until_date  = this.ptgDateTo;

        const res = await $api("/employees/attendance", { params });
        this.pointages = res.data || [];
        this.ptgTotal  = res.total || 0;
        // Stats calculées depuis les données reçues
        this.ptgStats.total_employes = new Set(this.pointages.map((p) => p.employee?.id)).size;
        this.ptgStats.total_heures   = Math.round(
          this.pointages.reduce((acc, p) => {
            if (p.opened_at && p.closed_at) {
              return acc + (new Date(p.closed_at) - new Date(p.opened_at)) / 3600000;
            }
            return acc;
          }, 0)
        );
        this.ptgStats.absences = 0;
      } catch {
        // endpoint may not exist yet — show empty state silently
        this.pointages = [];
        this.ptgTotal  = 0;
      } finally {
        this.ptgLoading = false;
      }
    },

    exportPointage() {
      const rows = [
        ["Employé", "Parc", "Date", "Entrée", "Sortie", "Durée", "Statut"],
        ...this.pointages.map((p) => [
          `${p.employee?.user?.firstname || ""} ${p.employee?.user?.lastname || ""}`,
          p.park?.localisation || "",
          this.formatDate(p.date || p.created_at),
          p.heure_entree || p.check_in || "",
          p.heure_sortie || p.check_out || "",
          this.calcDuration(p.heure_entree || p.check_in, p.heure_sortie || p.check_out),
          this.ptgStatusLabel(p.statut || p.status),
        ]),
      ];
      this.downloadCsv(rows, "pointage.csv");
    },

    calcDuration(start, end) {
      const mins = this.durationMinutes(start, end);
      if (!mins) return "—";
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h}h${String(m).padStart(2, "0")}`;
    },

    durationMinutes(start, end) {
      if (!start || !end) return 0;
      const [sh, sm] = start.split(":").map(Number);
      const [eh, em] = end.split(":").map(Number);
      return (eh * 60 + em) - (sh * 60 + sm);
    },

    ptgStatusColor(s) {
      return s === "present" ? "success" : s === "absent" ? "error" : s === "retard" ? "warning" : "default";
    },
    ptgStatusLabel(s) {
      return s === "present" ? "Présent" : s === "absent" ? "Absent" : s === "retard" ? "Retard" : s || "—";
    },

    // ─────────────────────────────────────────
    // SESSIONS DE CAISSE
    // ─────────────────────────────────────────
    async loadSessions() {
      this.sessLoading = true;
      try {
        const params = {
          page: this.sessPage,
          per_page: this.sessPerPage,
          archived: this.showArchived ? 1 : 0,
        };
        if (this.sessEmployeeId) params.employee_id = this.sessEmployeeId;
        if (this.sessCaisseId)   params.caisse_id   = this.sessCaisseId;
        if (this.sessDateFrom)   params.date_from   = this.sessDateFrom;
        if (this.sessDateTo)     params.date_to     = this.sessDateTo;
        if (this.sessStatut)     params.status      = this.sessStatut;

        const res = await $api("/sessions", { params });
        this.sessions  = res.data || [];
        this.sessTotal = res.total || 0;
        // Stats
        if (res.stats) {
          this.sessStats = res.stats;
        } else {
          this.sessStats.total_sessions = this.sessTotal;
          this.sessStats.ouvertes  = this.sessions.filter((s) => s.status === "open" || s.statut === "ouverte").length;
          this.sessStats.cloturees = this.sessions.filter((s) => s.status === "closed" || s.statut === "cloturee").length;
          this.sessStats.montant_total = this.sessions.reduce((acc, s) => acc + (parseFloat(s.total ?? s.total_sales ?? s.montant ?? s.total_amount) || 0), 0);
        }
        // Load caisses from sessions for filter
        const caisses = {};
        this.sessions.forEach((s) => {
          const cr = s.cash_register || s.caisse;
          if (cr) caisses[cr.id] = cr;
        });
        this.caisseOptions = Object.values(caisses).map((c) => ({ id: c.id, name: c.name }));
      } catch {
        this.sessions  = [];
        this.sessTotal = 0;
      } finally {
        this.sessLoading = false;
      }
    },

    // ── Sessions ──
    async loadParcs() {
      try {
        const res = await $api("/parks", { params: { per_page: 200 } });
        this.parcOptions = (res.data || []).map(p => ({ id: p.id, name: p.name || `Parc ${p.id}` }));
      } catch { /* silent */ }
    },

    async loadRoles() {
      try {
        const res = await $api("/roles");
        this.roleOptions = (res.data || []).map(r => ({ id: r.id, name: r.name }));
      } catch { /* silent */ }
    },

    async loadCashRegisters() {
      try {
        const res = await $api("/cash-registers", { params: { per_page: 200 } });
        this.cashRegisters = (res.data || []).map(c => ({ id: c.id, name: c.name || `Caisse ${c.id}` }));
      } catch { /* silent */ }
    },

    openAddSession() {
      const now = new Date();
      const pad = n => String(n).padStart(2, "0");
      const autoId = `CSE-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
      const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      this.addSessionData = {
        employee_id: null, park_id: null, caisse_role_id: null,
        caisse_nom: "", heure_ouverture: currentTime, heure_fermeture: "",
        note: "", caisse_auto_id: autoId,
      };
      this.addSessionDialog = true;
    },

    async saveSession() {
      const { valid } = await this.$refs.addSessionForm.validate();
      if (!valid) return;
      this.addSessionSaving = true;
      try {
        const payload = {
          name:    this.addSessionData.caisse_nom,
          park_id: this.addSessionData.park_id,
          status:  "active",
        };
        await $api("/cash-registers/add", { method: "POST", body: payload });
        this.addSessionDialog = false;
        this.showSnack("Session ouverte avec succès", "success");
        // Start live timer
        this.sessionStartTime = new Date();
        this.sessionTimer = setInterval(() => {
          const diff = Math.floor((new Date() - this.sessionStartTime) / 1000);
          const m = Math.floor(diff / 60), s = diff % 60;
          this.sessionElapsed = `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
        }, 1000);
        this.loadSessions();
      } catch (err) {
        const errData = err?.data || {};
        const errors  = errData?.errors;
        const msg = errors
          ? Object.values(errors).flat().join(" — ")
          : (errData?.message || "Erreur lors de l'ouverture de la session");
        this.showSnack(msg, "error");
      } finally { this.addSessionSaving = false; }
    },

    openSessionDetails(s) {
      this.currentSession = s;
      this.sessDetailsDialog = true;
    },

    // ── Edit session ──────────────────────────────────────────────
    openEditSession(s) {
      this.editSessionData = {
        id:               s.id,
        employee_id:      s.employee?.id || null,
        park_id:          s.park?.id || null,
        caisse_nom:       s.caisse?.name || s.caisse_nom || "",
        montant_ouverture: s.montant_ouverture || 0,
        montant_cloture:  s.montant || s.total_amount || 0,
        status:           s.status || "open",
        note:             s.note || "",
      };
      this.editSessionDialog = true;
    },

    async saveEditSession() {
      const { valid } = await this.$refs.editSessionForm.validate();
      if (!valid) return;
      this.editSessionSaving = true;
      try {
        await $api(`/sessions/${this.editSessionData.id}`, {
          method: "PUT",
          body: this.editSessionData,
        });
        this.editSessionDialog = false;
        this.showSnack("Session modifiée avec succès", "success");
        this.loadSessions();
      } catch {
        this.showSnack("Erreur lors de la modification", "error");
      } finally { this.editSessionSaving = false; }
    },

    // ── Rôles de caisse ──────────────────────────────────────────
    async loadCaisseRoles() {
      this.caisseRolesLoading = true;
      try {
        const res = await $api("/caisse-roles", { params: { per_page: 200 } });
        this.caisseRoles = (res.data || []).map(role => {
          const extra = this.loadCaisseRoleExtra(role.id);
          return {
            ...role,
            park_id:     role.park_id     || extra.park_id     || null,
            permissions: role.permissions || extra.permissions || [],
          };
        });
      } catch {
        this.caisseRoles = [];
      } finally { this.caisseRolesLoading = false; }
    },

    openAddCaisseRole() {
      this.caisseRoleEditing = false;
      this.caisseRoleData = { id: null, name: "", park_id: this.parcOptions[0]?.id || null, permissions: [] };
      this.caisseRoleDialog = true;
    },

    openEditCaisseRole(role) {
      this.caisseRoleEditing = true;
      const extra = this.loadCaisseRoleExtra(role.id);
      this.caisseRoleData = {
        id:          role.id,
        name:        role.name,
        park_id:     role.park_id     || extra.park_id     || this.parcOptions[0]?.id || null,
        permissions: ((role.permissions || extra.permissions || []).map(p => p.id ?? p)),
      };
      this.caisseRoleDialog = true;
    },

    async loadCaissePermissions() {
      try {
        const res = await $api("/caisse-roles/permissions", { params: { per_page: 100 } });
        this.realCaissePermissions = (res.data || []).map(p => ({
          id:          p.permission?.id   ?? p.id,
          label:       p.permission?.label ?? p.label ?? p.permission,
          permission:  p.permission?.permission ?? p.permission,
        }));
      } catch { /* garder la liste statique si l'API échoue */ }
    },

    async saveCaisseRole() {
      const { valid } = await this.$refs.caisseRoleForm.validate();
      if (!valid) return;
      if (!this.caisseRoleData.park_id) {
        this.showSnack("Veuillez sélectionner un parc", "error");
        return;
      }
      this.caisseRoleSaving = true;
      try {
        const body = {
          name:        this.caisseRoleData.name,
          park_id:     this.caisseRoleData.park_id,
          permissions: this.caisseRoleData.permissions,
        };
        let savedRes;
        if (this.caisseRoleEditing) {
          savedRes = await $api(`/caisse-roles/${this.caisseRoleData.id}/update`, { method: "PUT", body });
          this.showSnack("Rôle mis à jour", "success");
        } else {
          savedRes = await $api("/caisse-roles/add", { method: "POST", body });
          this.showSnack("Rôle créé avec succès", "success");
        }
        const savedId = (savedRes?.data?.id ?? savedRes?.id) || this.caisseRoleData.id;
        if (savedId) {
          this.saveCaisseRoleExtra(savedId, {
            park_id:     this.caisseRoleData.park_id,
            permissions: this.caisseRoleData.permissions,
          });
        }
        this.caisseRoleDialog = false;
        this.loadCaisseRoles();
      } catch (err) {
        const msg = err?.data?.message || "Erreur lors de l'enregistrement";
        this.showSnack(msg, "error");
      } finally { this.caisseRoleSaving = false; }
    },

    saveCaisseRoleExtra(id, data) {
      try {
        localStorage.setItem(`caisse_role_extra_${id}`, JSON.stringify({
          park_id:     data.park_id     || null,
          permissions: Array.isArray(data.permissions) ? data.permissions : [],
        }));
      } catch {}
    },

    loadCaisseRoleExtra(id) {
      try {
        return JSON.parse(localStorage.getItem(`caisse_role_extra_${id}`) || "{}");
      } catch { return {}; }
    },

    async deleteCaisseRole(role) {
      if (!confirm(`Supprimer le rôle "${role.name}" ?`)) return;
      try {
        await $api(`/caisse-roles/${role.id}/delete`, { method: "DELETE" });
        this.caisseRoles = this.caisseRoles.filter(r => r.id !== role.id);
        this.showSnack("Rôle supprimé", "success");
      } catch {
        this.showSnack("Erreur lors de la suppression", "error");
      }
    },

    printSession(s) {
      window.print();
    },

    exportSessions() {
      const rows = [
        ["ID", "Employé", "Caisse", "Parc", "Ouverture", "Clôture", "Montant", "Statut"],
        ...this.sessions.map((s) => [
          "#" + s.id,
          `${s.employee?.user?.firstname || ""} ${s.employee?.user?.lastname || ""}`,
          s.caisse?.name || s.caisse_id || "",
          s.park?.localisation || s.park?.name || "",
          this.formatDateTime(s.opened_at || s.created_at),
          s.closed_at ? this.formatDateTime(s.closed_at) : "",
          (s.montant || s.total_amount || 0) + " €",
          s.status === "open" ? "Ouverte" : "Clôturée",
        ]),
      ];
      this.downloadCsv(rows, "sessions.csv");
    },

    // ─────────────────────────────────────────
    // UTILS
    // ─────────────────────────────────────────
    formatDate(d) {
      if (!d) return "—";
      const dt = new Date(d);
      return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()}`;
    },

    formatDateTime(d) {
      if (!d) return "—";
      const dt = new Date(d);
      return `${this.formatDate(d)} ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;
    },

    formatTime(d) {
      if (!d) return "—";
      const dt = new Date(d);
      return `${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;
    },

    downloadCsv(rows, filename) {
      const csv = rows
        .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = filename; link.click();
      URL.revokeObjectURL(url);
    },

    showSnack(message, color = "success") {
      this.snackMessage = message;
      this.snackColor   = color;
      this.snackVisible = true;
    },
  },
};
</script>

<style scoped>
/* ── Tabs ── */
.tab-bar {
  display: flex;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #E8A838;
  width: 100%;
  background: #E8A838;
}
.tab-btn {
  flex: 1;
  padding: 15px 25px;
  border: none;
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  letter-spacing: 0.2px;
}
.tab-btn--active {
  background: #1a1a2e;
  color: #fff;
}
.tab-btn--inactive {
  background: #E8A838;
  color: #1a1a2e;
}
.tab-btn--inactive:hover {
  background: #d4942b;
}

/* ── Sub-tabs (sessions / rôles caisse) ── */
.sub-tab-btn {
  display: inline-flex;
  align-items: center;
  padding: 8px 20px;
  border-radius: 20px;
  border: 1.5px solid #1a1a2e;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
  color: #1a1a2e;
}
.sub-tab-btn--active {
  background: #1a1a2e;
  color: #fff;
}
.sub-tab-btn:not(.sub-tab-btn--active):hover {
  background: #f5f5f5;
}

/* ── Buttons ── */
.apply-btn {
  background: #1a1a2e !important;
  color: #fff !important;
  min-width: 110px;
  border-radius: 8px;
  font-weight: 600;
}
.ptg-apply-btn {
  background: #E8A838 !important;
  color: #1a1a2e !important;
}
.sess-apply-btn {
  background: #E8A838 !important;
  color: #1a1a2e !important;
}
.export-btn {
  border-color: #1a1a2e !important;
  color: #1a1a2e !important;
  font-weight: 600;
  font-size: 13px;
  min-width: 100px;
}
.filter-label {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  min-width: 45px;
}

/* ── Tables ── */
.table-th {
  padding: 10px 12px !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  color: #9e9e9e !important;
  text-transform: uppercase;
  white-space: nowrap;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}
.pointage-table td, .sessions-table td {
  padding: 12px !important;
  border-bottom: 1px solid #f8f8f8;
  vertical-align: middle;
}

/* ── Time badges ── */
.time-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
.time-badge--in      { background: #E8F5E9; color: #2E7D32; }
.time-badge--out     { background: #FFEBEE; color: #C62828; }
.time-badge--pending { background: #FFF8E1; color: #E65100; }

/* ── Session ID ── */
.session-id {
  font-weight: 700;
  color: #1a1a2e;
  font-size: 13px;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 6px;
}

/* ── Stats cards ── */
.stat-card { border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important; }
.stat-label { font-size: 12px; color: #9e9e9e; margin-top: 4px; }

/* ── Archive toggle ── */
.archive-toggle {
  display: flex;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}
.archive-btn {
  padding: 7px 16px;
  border: none;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  display: flex;
  align-items: center;
  transition: all 0.2s;
}
.archive-btn--active {
  background: #1a1a2e;
  color: #fff;
}

/* ── Add employee button ── */
.add-btn { background:#E8A838 !important; color:#1a1a2e !important; border-radius:8px !important; font-weight:700; }

/* ── Employee modal ── */
.emp-modal-header { border-bottom:1px solid #f0f0f0; }
.emp-back-btn {
  width:32px; height:32px; border-radius:8px;
  border:1.5px solid #e0e0e0; background:#f9f9f9;
  display:inline-flex; align-items:center; justify-content:center;
  cursor:pointer; color:#1a1a2e; flex-shrink:0;
}
.emp-modal-title { font-size:16px; font-weight:700; color:#1a1a2e; }
.emp-label { font-size:12px; font-weight:600; color:#1a1a2e; }
.req { color:#e53935; }
.emp-modal-footer { display:grid; grid-template-columns:1fr 1fr; border-top:1px solid #f0f0f0; }
.emp-footer-btn {
  padding:14px; border:none; cursor:pointer;
  font-size:14px; font-weight:700;
  display:flex; align-items:center; justify-content:center; gap:6px;
}
.emp-footer-btn--cancel  { background:#f5f5f5; color:#555; }
.emp-footer-btn--confirm { background:#1a1a2e; color:#fff; }
.emp-footer-btn--confirm:disabled { opacity:0.6; cursor:not-allowed; }

/* ── Barcode ── */
.barcode-box {
  border:2px dashed #e0e0e0; border-radius:10px;
  padding:20px; background:#fafafa; min-height:90px;
  display:flex; align-items:center; justify-content:center;
}

/* ── Badge card ── */
.badge-card {
  border-radius:16px; overflow:hidden;
  box-shadow:0 4px 20px rgba(0,0,0,0.10);
  border:1px solid #f0f0f0;
}
.badge-header {
  background:#1a1a2e; padding:14px;
  display:flex; align-items:center; justify-content:center;
  color:#fff; font-size:14px; font-weight:700; letter-spacing:2px;
}
.badge-company { color:#fff; font-size:14px; font-weight:700; letter-spacing:2px; }
.badge-body { padding:20px; text-align:center; background:#fff; }
.badge-name { font-size:16px; font-weight:700; color:#1a1a2e; }
.badge-role { font-size:12px; color:#9e9e9e; margin-top:3px; }
.badge-park { font-size:11px; color:#555; }
.badge-footer { background:#f9f9f9; padding:14px; text-align:center; border-top:1px solid #f0f0f0; }

/* ── Session live bar ── */
.session-live-bar {
  background:#FFF8E1; border-bottom:1px solid #FFE082;
  padding:10px 20px; font-size:13px; color:#5D4037;
  display:flex; align-items:center;
}
.session-live-dot {
  width:8px; height:8px; border-radius:50%; background:#4CAF50;
  margin-left:auto; animation:pulse 1.2s infinite;
}
@keyframes pulse {
  0%,100% { opacity:1; transform:scale(1); }
  50%      { opacity:0.4; transform:scale(1.3); }
}

/* ── Info rows (dialog) ── */
.info-row {
  display: flex;
  align-items: flex-start;
  padding: 9px 0;
  border-bottom: 1px solid #f5f5f5;
  gap: 12px;
}
.info-row:last-child { border-bottom: none; }
.info-label {
  min-width: 150px;
  font-size: 13px;
  color: #9e9e9e;
  flex-shrink: 0;
}

/* ── Fix: status toggle button always visible ── */
.status-toggle-btn,
.status-toggle-btn:active,
.status-toggle-btn.v-btn--active,
.status-toggle-btn:focus {
  opacity: 1 !important;
}
.status-toggle-btn .v-icon {
  opacity: 1 !important;
}
/* Désactiver icon — force red, always visible */
.deactivate-icon {
  color: #e53935 !important;
  opacity: 1 !important;
}
</style>
