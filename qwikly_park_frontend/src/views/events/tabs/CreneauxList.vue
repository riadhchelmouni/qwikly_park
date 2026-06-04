<template>
  <div>
    <!-- ── Barre supérieure : Parc + bouton ── -->
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap gap-3">
      <div class="d-flex align-center gap-3">
        <span class="filter-label">Parc</span>
        <VSelect
          v-model="filterParc" :items="parcOptions" item-title="name" item-value="id"
          placeholder="Tous les parcs" hide-details clearable density="compact" variant="outlined"
          style="min-width:200px;max-width:240px"
          @update:model-value="loadCreneaux"
        />
      </div>
      <VBtn class="create-btn" elevation="0" @click="openCreate">
        <VIcon icon="tabler-plus" size="16" class="me-1" />Nouveaux Créneaux
      </VBtn>
    </div>

    <!-- ── Layout 2 colonnes ── -->
    <div class="creneaux-layout">

      <!-- ══ Panneau gauche ══ -->
      <div class="left-panel">
        <!-- Mini calendrier -->
        <VCard class="mb-3" style="border-radius:12px">
          <VCardText class="pa-3">
            <div class="d-flex align-center justify-space-between mb-2">
              <VBtn icon variant="text" size="x-small" @click="prevMonth">
                <VIcon icon="tabler-chevron-left" size="16" />
              </VBtn>
              <span style="font-size:13px;font-weight:700;color:#1a1a2e">{{ monthLabel }}</span>
              <VBtn icon variant="text" size="x-small" @click="nextMonth">
                <VIcon icon="tabler-chevron-right" size="16" />
              </VBtn>
            </div>
            <div class="mini-cal-grid">
              <div v-for="d in ['L','M','M','J','V','S','D']" :key="d+'h'" class="mini-cal-head">{{ d }}</div>
              <div v-for="(cell, i) in miniCalCells" :key="i"
                class="mini-cal-cell"
                :class="{
                  'mini-cal-cell--today': cell.isToday,
                  'mini-cal-cell--selected': selectedDate && cell.dateStr === selectedDate,
                  'mini-cal-cell--empty': !cell.day,
                  'mini-cal-cell--has': cell.hasEvent,
                }"
                @click="cell.day && selectDate(cell.dateStr)">
                {{ cell.day || '' }}
              </div>
            </div>
          </VCardText>
        </VCard>

        <!-- Recherche -->
        <VCard class="mb-3" style="border-radius:12px">
          <VCardText class="pa-3">
            <VTextField
              v-model="search" placeholder="Rechercher..." density="compact" variant="outlined"
              prepend-inner-icon="tabler-search" hide-details clearable
              style="border-radius:8px"
            />
          </VCardText>
        </VCard>

        <!-- Filtres -->
        <VCard style="border-radius:12px">
          <VCardText class="pa-3">
            <div class="text-caption font-weight-bold text-uppercase mb-2" style="color:#9e9e9e;letter-spacing:0.5px">Filtres</div>
            <div class="mb-2">
              <div style="font-size:12px;font-weight:600;color:#1a1a2e;margin-bottom:4px">Type</div>
              <VSelect v-model="filterType" :items="typeOptions" placeholder="Tous" hide-details clearable density="compact" variant="outlined" />
            </div>
            <div class="mb-2">
              <div style="font-size:12px;font-weight:600;color:#1a1a2e;margin-bottom:4px">Événement</div>
              <VSelect v-model="filterEvent" :items="eventOptions" item-title="name" item-value="id"
                placeholder="Tous" hide-details clearable density="compact" variant="outlined" />
            </div>
            <VBtn class="apply-btn mt-3 w-100" elevation="0" @click="loadCreneaux">Appliquer</VBtn>
          </VCardText>
        </VCard>
      </div>

      <!-- ══ Panneau droit : calendrier hebdomadaire ══ -->
      <div class="right-panel">
        <VCard style="border-radius:12px;overflow:hidden">
          <!-- Navigation semaine -->
          <div class="d-flex align-center justify-space-between pa-4 pb-0">
            <VBtn icon variant="text" size="small" @click="prevWeek">
              <VIcon icon="tabler-chevron-left" size="18" />
            </VBtn>
            <span style="font-size:14px;font-weight:700;color:#1a1a2e">
              Semaine du {{ formatDateShort(weekStart) }} – {{ formatDateShort(weekEnd) }}
            </span>
            <VBtn icon variant="text" size="small" @click="nextWeek">
              <VIcon icon="tabler-chevron-right" size="18" />
            </VBtn>
          </div>

          <VCardText class="pa-3">
            <!-- En-têtes jours -->
            <div class="week-grid">
              <div class="week-time-col"></div>
              <div v-for="day in weekDays" :key="day.label" class="week-day-head"
                :class="{'week-day-head--today': day.isToday}">
                <div class="week-day-name">{{ day.name }}</div>
                <div class="week-day-num" :class="{'week-day-num--today': day.isToday}">{{ day.num }}</div>
              </div>
            </div>

            <!-- Grille horaire -->
            <div v-if="isLoading" class="d-flex justify-center align-center py-10">
              <VProgressCircular indeterminate color="#E8A838" size="36" />
            </div>
            <div v-else class="week-body">
              <div v-for="hour in dayHours" :key="hour" class="week-row">
                <div class="week-time">{{ String(hour).padStart(2,'0') }}:00</div>
                <div v-for="day in weekDays" :key="day.label" class="week-cell"
                  :class="{'week-cell--today': day.isToday}"
                  @click="quickCreate(day, hour)">
                  <!-- Créneaux dans cette cellule -->
                  <div v-for="c in getCreneauxForCell(day.dateStr, hour)" :key="c.id"
                    class="creneau-pill"
                    @click.stop="openEdit(c)">
                    <div class="creneau-pill__name">{{ c.event?.name || 'Créneau' }}</div>
                    <div class="creneau-pill__time">{{ c.heure_debut }} - {{ c.heure_fin }}</div>
                  </div>
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </div>
    </div>

    <!-- ══ MODAL CRÉER/MODIFIER ══ -->
    <VDialog v-model="formDialog" max-width="520" scrollable persistent>
      <VCard style="border-radius:14px;overflow:hidden">

        <!-- Header -->
        <div class="cren-modal-header d-flex align-center gap-2 px-5 py-4">
          <button class="cren-back-btn" @click="formDialog=false">
            <VIcon icon="tabler-arrow-left" size="17" />
          </button>
          <span class="cren-modal-title">{{ isEditing ? 'Modifier le créneau' : 'Nouveaux créneaux' }}</span>
        </div>

        <VCardText class="px-5 pt-4 pb-2">
          <VForm ref="crenForm">

            <!-- Parc -->
            <div class="cren-label mb-1">Parc</div>
            <VSelect v-model="form.park_id" :items="parcOptions" item-title="name" item-value="id"
              placeholder="Sélectionner le parc"
              density="compact" variant="outlined" hide-details class="mb-4"
              :rules="[v=>!!v||'Requis']" />

            <!-- Nom d'évènement + Répétition -->
            <VRow dense class="mb-1">
              <VCol cols="12" md="7">
                <div class="cren-label mb-1">Nom d'évènement</div>
                <VSelect v-model="form.event_id" :items="eventOptions" item-title="name" item-value="id"
                  placeholder="Entrer le nom de l'évènement"
                  density="compact" variant="outlined" hide-details
                  :rules="[v=>!!v||'Requis']" />
              </VCol>
              <VCol cols="12" md="5">
                <div class="cren-label mb-1">Répétition</div>
                <VSelect v-model="form.repetitions" :items="repetitionOptions" item-title="title" item-value="value"
                  placeholder="Tous les jours"
                  density="compact" variant="outlined" hide-details />
              </VCol>
            </VRow>

            <!-- Date + Heure début + Heure fin + Capacité max -->
            <VRow dense class="mt-3 mb-1">
              <VCol cols="6" md="3">
                <div class="cren-label mb-1">Date</div>
                <VTextField v-model="form.date_start" placeholder="DD/MM/YYYY" type="date"
                  density="compact" variant="outlined" hide-details
                  :rules="[v=>!!v||'Requis']" />
              </VCol>
              <VCol cols="6" md="3">
                <div class="cren-label mb-1">Heure début</div>
                <VTextField v-model="form.heure_debut" placeholder="HH:MM" type="time"
                  density="compact" variant="outlined" hide-details />
              </VCol>
              <VCol cols="6" md="3">
                <div class="cren-label mb-1">Heure fin</div>
                <VTextField v-model="form.heure_fin" placeholder="HH:MM" type="time"
                  density="compact" variant="outlined" hide-details />
              </VCol>
              <VCol cols="6" md="3">
                <div class="cren-label mb-1">Capacité max</div>
                <VTextField v-model="form.capacite_max" placeholder="33" type="number"
                  density="compact" variant="outlined" hide-details />
              </VCol>
            </VRow>

            <!-- Note -->
            <div class="cren-label mb-1 mt-3">Note</div>
            <VTextarea v-model="form.note" placeholder="Ajouter des notes ici..."
              rows="3" density="compact" variant="outlined" hide-details />

          </VForm>
        </VCardText>

        <!-- Bouton Créer pleine largeur -->
        <div class="px-5 py-4">
          <button class="cren-create-btn" :disabled="saving" @click="saveCreneau">
            <VProgressCircular v-if="saving" size="14" indeterminate color="#fff" class="me-2" />
            {{ isEditing ? 'Enregistrer' : 'Créer' }}
          </button>
        </div>

      </VCard>
    </VDialog>

    <!-- Modal suppression -->
    <VDialog v-model="deleteDialog" max-width="400">
      <VCard style="border-radius:14px">
        <VCardText class="pa-6 pb-3">
          <div class="text-subtitle-1 font-weight-bold mb-2" style="color:#1a1a2e">Supprimer le créneau</div>
          <p style="font-size:13px;color:#666">Voulez-vous vraiment supprimer ce créneau ?</p>
        </VCardText>
        <VCardText class="d-flex justify-end gap-2 pb-5">
          <VBtn variant="outlined" style="border-radius:8px;color:#555" @click="deleteDialog=false">Annuler</VBtn>
          <VBtn style="background:#e53935;color:#fff;border-radius:8px;font-weight:700" elevation="0" :loading="deleting" @click="confirmDelete">Supprimer</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackVisible" location="bottom end" variant="flat" :color="snackColor" :timeout="3000">{{ snackMsg }}</VSnackbar>
  </div>
</template>

<script>
import { $api } from "@/utils/api";

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
}

export default {
  setup() { return {}; },

  data() {
    const today = new Date();
    const ws = startOfWeek(today);
    return {
      creneaux: [], total: 0, isLoading: false,
      filterParc: null, filterEvent: null, filterType: null,
      search: "",

      parcOptions: [], eventOptions: [],
      typeOptions: ["Standard","VIP","Groupe","Anniversaire"],
      repetitionOptions: [
        { title: "Aucune",       value: "none"    },
        { title: "Quotidienne",  value: "daily"   },
        { title: "Hebdomadaire", value: "weekly"  },
        { title: "Mensuelle",    value: "monthly" },
      ],
      dayHours: [8,9,10,11,12,13,14,15,16,17,18,19,20],

      currentMonth: today.getMonth(),
      currentYear: today.getFullYear(),
      selectedDate: null,

      weekStartDate: ws,

      formDialog: false, deleteDialog: false,
      current: null, isEditing: false, saving: false, deleting: false,
      form: this.defaultForm(),

      snackVisible: false, snackMsg: "", snackColor: "success",
    };
  },

  watch: {
    'form.park_id'(newVal) {
      this.form.park_space_id = null;
      if (newVal) this.autoSelectSpace(newVal);
    },
  },

  computed: {
    monthLabel() {
      return new Date(this.currentYear, this.currentMonth, 1)
        .toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    },

    weekStart() { return new Date(this.weekStartDate); },
    weekEnd() {
      const d = new Date(this.weekStartDate);
      d.setDate(d.getDate() + 6);
      return d;
    },

    weekDays() {
      const days = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
      const today = new Date(); today.setHours(0,0,0,0);
      return days.map((name, i) => {
        const d = new Date(this.weekStartDate);
        d.setDate(d.getDate() + i);
        const dateStr = this.toDateStr(d);
        return { name, num: d.getDate(), label: dateStr, dateStr, isToday: d.getTime() === today.getTime() };
      });
    },

    miniCalCells() {
      const first = new Date(this.currentYear, this.currentMonth, 1);
      const last  = new Date(this.currentYear, this.currentMonth + 1, 0);
      const startDay = (first.getDay() + 6) % 7;
      const today = new Date(); today.setHours(0,0,0,0);
      const cells = [];
      for (let i = 0; i < startDay; i++) cells.push({ day: null });
      for (let d = 1; d <= last.getDate(); d++) {
        const dt = new Date(this.currentYear, this.currentMonth, d);
        const dateStr = this.toDateStr(dt);
        cells.push({
          day: d, dateStr,
          isToday: dt.getTime() === today.getTime(),
          hasEvent: this.creneaux.some(c => c.date_start?.startsWith(dateStr)),
        });
      }
      return cells;
    },
  },

  async mounted() {
    await Promise.all([this.loadCreneaux(), this.loadParcs(), this.loadEvents()]);
  },

  methods: {
    defaultForm() {
      return {
        park_id: null, park_space_id: null, event_id: null,
        date_start: "", heure_debut: "", heure_fin: "",
        capacite_max: "", type: "Standard", repetitions: "none", note: "",
      };
    },

    // Convertit la réponse API → format interne du composant
    normalizeSlot(s) {
      const firstBookable = (s.activities?.[0]) || (s.birthdays?.[0]) || (s.park_tickets?.[0]) || null;
      return {
        ...s,
        date_start:    s.slot_date    || s.date_start  || "",
        heure_debut:   s.start_time   || s.heure_debut  || "",
        heure_fin:     s.end_time     || s.heure_fin    || "",
        capacite_max:  s.max_reservations ?? s.capacite_max ?? "",
        event:         firstBookable,
      };
    },

    async loadCreneaux() {
      this.isLoading = true;
      try {
        const params = { per_page: 200 };
        if (this.filterParc)  params.park_id  = this.filterParc;
        if (this.filterEvent) params.event_id = this.filterEvent;
        const res = await $api("/reservation-slots", { params });
        this.creneaux = (res.data || []).map(s => this.normalizeSlot(s));
        this.total    = res.total || 0;
      } catch { this.creneaux = []; } finally { this.isLoading = false; }
    },

    async loadParcs() {
      try {
        const res = await $api("/parks", { params: { per_page: 200 } });
        this.parcOptions = (res.data || []).map(p => ({
          id: p.id,
          name: p.name + (p.city ? ' — ' + p.city : ''),
        }));
      } catch { /* */ }
    },

    async loadEvents() {
      try {
        const res = await $api("/events", { params: { per_page: 200 } });
        this.eventOptions = (res.data || []).map(e => ({ id: e.id, name: e.name || e.title }));
      } catch { /* */ }
    },

    // Sélectionne automatiquement le premier espace du parc
    async autoSelectSpace(parkId) {
      try {
        const res = await $api(`/parks/${parkId}/spaces`, { params: { per_page: 1 } });
        const first = (res.data || [])[0];
        if (first) this.form.park_space_id = first.id;
      } catch { /* */ }
    },

    getCreneauxForCell(dateStr, hour) {
      return this.creneaux.filter(c => {
        if (!c.date_start?.startsWith(dateStr)) return false;
        if (!c.heure_debut) return false;
        const h = parseInt(c.heure_debut.split(':')[0]);
        return h === hour;
      }).filter(c => {
        if (!this.search) return true;
        return (c.event?.name || '').toLowerCase().includes(this.search.toLowerCase());
      });
    },

    selectDate(dateStr) {
      this.selectedDate = dateStr;
      const dt = new Date(dateStr);
      this.weekStartDate = startOfWeek(dt);
    },

    quickCreate(day, hour) {
      this.isEditing = false;
      this.form = {
        ...this.defaultForm(),
        date_start:  day.dateStr,
        heure_debut: `${String(hour).padStart(2,'0')}:00`,
        heure_fin:   `${String(hour+1).padStart(2,'0')}:00`,
        park_id:     this.filterParc || null,
      };
      this.formDialog = true;
    },

    openCreate() {
      this.isEditing = false;
      this.form = this.defaultForm();
      this.formDialog = true;
    },

    openEdit(c) {
      this.isEditing = true;
      this.current = c;
      this.form = {
        ...this.defaultForm(),
        park_id:       c.park_id       || null,
        park_space_id: c.park_space_id || null,
        event_id:      c.event_id      || null,
        date_start:    c.date_start    || "",
        heure_debut:   c.heure_debut   || "",
        heure_fin:     c.heure_fin     || "",
        capacite_max:  c.capacite_max  || c.max_reservations || "",
      };
      this.formDialog = true;
    },

    openDelete(c) { this.current = c; this.deleteDialog = true; },

    async saveCreneau() {
      if (!this.$refs.crenForm) return;
      const { valid } = await this.$refs.crenForm.validate();
      if (!valid) return;
      this.saving = true;
      try {
        // Si park_space_id pas encore chargé, essayer maintenant
        if (!this.form.park_space_id && this.form.park_id) {
          await this.autoSelectSpace(this.form.park_id);
        }
        if (!this.form.park_space_id) {
          this.showSnack("Aucun espace disponible pour ce parc", "error");
          return;
        }

        const capacity = Number(this.form.capacite_max) || 1;

        if (this.isEditing) {
          // PUT — champs acceptés par UpdateReservationSlotRequest
          const payload = {
            park_space_id:    this.form.park_space_id,
            slot_date:        this.form.date_start,
            start_time:       this.form.heure_debut || "08:00",
            end_time:         this.form.heure_fin   || "09:00",
            max_reservations: capacity,
            max_occupants:    capacity,
          };
          const res = await $api(`/reservation-slots/${this.current.id}`, { method: "PUT", body: payload });
          const updated = this.normalizeSlot(res.data || res);
          const idx = this.creneaux.findIndex(x => x.id === this.current.id);
          if (idx !== -1) this.creneaux.splice(idx, 1, updated);
        } else {
          // POST — champs acceptés par StoreReservationSlotRequest
          const payload = {
            park_id:          this.form.park_id,
            park_space_id:    this.form.park_space_id,
            slot_date:        this.form.date_start,
            start_time:       this.form.heure_debut || "08:00",
            end_time:         this.form.heure_fin   || "09:00",
            max_reservations: capacity,
            max_occupants:    capacity,
          };
          const res = await $api("/reservation-slots", { method: "POST", body: payload });
          const created = this.normalizeSlot(res.data || res);
          this.creneaux.unshift(created);
        }

        this.formDialog = false;
        this.showSnack(this.isEditing ? "Créneau modifié" : "Créneau créé", "success");
      } catch (err) {
        const errors = err?.data?.errors;
        const msg = errors
          ? Object.values(errors).flat()[0]
          : (err?.data?.message || "Erreur lors de l'enregistrement");
        this.showSnack(msg, "error");
      } finally { this.saving = false; }
    },

    async confirmDelete() {
      this.deleting = true;
      try {
        await $api(`/reservation-slots/${this.current.id}`, { method: "DELETE" });
        this.creneaux = this.creneaux.filter(c => c.id !== this.current.id);
        this.deleteDialog = false;
        this.showSnack("Créneau supprimé", "success");
      } catch { this.showSnack("Erreur", "error"); } finally { this.deleting = false; }
    },

    prevMonth() { if (this.currentMonth === 0) { this.currentMonth = 11; this.currentYear--; } else this.currentMonth--; },
    nextMonth() { if (this.currentMonth === 11) { this.currentMonth = 0; this.currentYear++; } else this.currentMonth++; },
    prevWeek()  { const d = new Date(this.weekStartDate); d.setDate(d.getDate()-7); this.weekStartDate = d; },
    nextWeek()  { const d = new Date(this.weekStartDate); d.setDate(d.getDate()+7); this.weekStartDate = d; },

    toDateStr(d) {
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    },
    formatDateShort(d) {
      return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
    },
    showSnack(msg, color) { this.snackMsg = msg; this.snackColor = color; this.snackVisible = true; },
  },
};
</script>

<style scoped>
.filter-label { font-size:14px; font-weight:600; color:#1a1a2e; white-space:nowrap; }
.apply-btn  { background:#1a1a2e !important; color:#fff !important; border-radius:8px !important; font-weight:700; }
.create-btn { background:#E8A838 !important; color:#1a1a2e !important; border-radius:8px !important; font-weight:700; }

/* ── Two-column layout ── */
.creneaux-layout { display:grid; grid-template-columns:240px 1fr; gap:16px; align-items:start; }
@media (max-width:900px) { .creneaux-layout { grid-template-columns:1fr; } .left-panel { display:grid; grid-template-columns:1fr 1fr; gap:12px; } }
@media (max-width:600px) { .left-panel { grid-template-columns:1fr; } }

/* ── Mini calendrier ── */
.mini-cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:2px; }
.mini-cal-head { text-align:center; font-size:10px; font-weight:700; color:#9e9e9e; padding:3px 0; }
.mini-cal-cell {
  text-align:center; font-size:11px; font-weight:600; color:#555;
  padding:5px 2px; border-radius:6px; cursor:pointer; transition:all 0.12s;
  position:relative;
}
.mini-cal-cell:hover { background:#f5f5f5; }
.mini-cal-cell--today { color:#E8A838; font-weight:800; }
.mini-cal-cell--selected { background:#1a1a2e !important; color:#fff !important; border-radius:6px; }
.mini-cal-cell--empty { cursor:default; }
.mini-cal-cell--has::after {
  content:''; position:absolute; bottom:2px; left:50%; transform:translateX(-50%);
  width:4px; height:4px; border-radius:50%; background:#E8A838;
}

/* ── Week calendar ── */
.week-grid { display:grid; grid-template-columns:50px repeat(7,1fr); border-bottom:1px solid #f0f0f0; padding-bottom:8px; margin-bottom:0; }
.week-time-col { /* empty */ }
.week-day-head { text-align:center; padding:6px 2px; }
.week-day-head--today .week-day-num { background:#1a1a2e; color:#fff; }
.week-day-name { font-size:11px; font-weight:700; color:#9e9e9e; text-transform:uppercase; margin-bottom:3px; }
.week-day-num { display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:50%; font-size:13px; font-weight:700; color:#1a1a2e; }
.week-day-num--today { background:#1a1a2e; color:#fff; }

/* Week body */
.week-body { border:1px solid #f0f0f0; border-radius:8px; overflow:hidden; }
.week-row { display:grid; grid-template-columns:50px repeat(7,1fr); border-bottom:1px solid #f5f5f5; min-height:52px; }
.week-row:last-child { border-bottom:none; }
.week-time { font-size:11px; color:#9e9e9e; font-weight:600; padding:6px 4px 0; text-align:right; }
.week-cell {
  padding:3px; border-left:1px solid #f5f5f5; cursor:pointer; transition:background 0.12s;
  min-height:52px; position:relative;
}
.week-cell:hover { background:#fafafa; }
.week-cell--today { background:#FFFDE7; }

/* Créneau pill */
.creneau-pill {
  background:#1a1a2e; color:#fff; border-radius:5px; padding:3px 6px;
  margin-bottom:2px; cursor:pointer; transition:opacity 0.12s;
  overflow:hidden;
}
.creneau-pill:hover { opacity:0.85; }
.creneau-pill__name { font-size:10px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.creneau-pill__time { font-size:9px; opacity:0.75; }

/* ══ Modal Nouveaux créneaux ══ */
.cren-modal-header { border-bottom:1px solid #f0f0f0; }
.cren-back-btn {
  width:32px; height:32px; border-radius:8px;
  border:1.5px solid #e0e0e0; background:#f9f9f9;
  display:inline-flex; align-items:center; justify-content:center;
  cursor:pointer; color:#1a1a2e; flex-shrink:0; transition:background 0.15s;
}
.cren-back-btn:hover { background:#f0f0f0; }
.cren-modal-title { font-size:16px; font-weight:700; color:#1a1a2e; }
.cren-label { font-size:12px; font-weight:600; color:#1a1a2e; }
.cren-create-btn {
  width:100%; padding:14px; border:none; border-radius:8px;
  background:#1a1a2e; color:#fff;
  font-size:14px; font-weight:700; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  transition:opacity 0.15s;
}
.cren-create-btn:hover:not(:disabled) { opacity:0.88; }
.cren-create-btn:disabled { opacity:0.55; cursor:not-allowed; }
</style>
