<template>
  <div>
    <!-- ── Barre : filtres + bouton ── -->
    <div class="d-flex align-center justify-space-between mb-5 flex-wrap gap-3">
      <div class="d-flex align-center gap-3 flex-wrap">
        <span class="filter-label">Filtres</span>
        <VSelect v-model="filterFranchise" :items="franchiseOptions" item-title="name" item-value="id"
          placeholder="Franchise" hide-details clearable density="compact" variant="outlined" style="min-width:160px;max-width:200px" />
        <VSelect v-model="filterParc" :items="parcOptions" item-title="name" item-value="id"
          placeholder="Parc" hide-details clearable density="compact" variant="outlined" style="min-width:150px;max-width:185px" />
        <VBtn class="apply-btn" elevation="0" @click="loadFormules">Appliquer</VBtn>
      </div>
      <VBtn class="create-btn" elevation="0" @click="openCreate">
        <VIcon icon="tabler-plus" size="16" class="me-1" />Nouvelle formule
      </VBtn>
    </div>

    <!-- ── Chargement ── -->
    <div v-if="isLoading" class="d-flex justify-center align-center py-16">
      <VProgressCircular indeterminate color="#E8A838" size="48" />
    </div>

    <!-- ── Groupées par franchise ── -->
    <div v-else-if="grouped.length">
      <div v-for="group in grouped" :key="group.franchise" class="mb-8">
        <!-- Titre de franchise -->
        <div class="franchise-heading mb-4">
          <VIcon icon="tabler-building-community" size="18" class="me-2" style="color:#E8A838" />
          {{ group.franchise }}
        </div>

        <VRow>
          <VCol v-for="f in group.items" :key="f.id" cols="12" sm="6" md="4" lg="3">
            <VCard class="formule-card" elevation="2">
              <!-- Header coloré -->
              <div class="formule-card__header">
                <VImg v-if="f.image_url" :src="f.image_url" height="90" cover>
                  <template #error>
                    <div class="formule-card__header-fallback">
                      <VIcon icon="tabler-cake" size="32" color="rgba(255,255,255,0.9)" />
                    </div>
                  </template>
                </VImg>
                <VIcon v-else icon="tabler-cake" size="32" color="rgba(255,255,255,0.9)" />
              </div>

              <VCardText class="pa-4">
                <!-- Nom -->
                <div class="formule-name mb-1">{{ f.name }}</div>
                <div v-if="f.titre_secondaire" class="formule-sub mb-3">{{ f.titre_secondaire }}</div>

                <!-- Infos avec icônes -->
                <div class="formule-info mb-1">
                  <div class="formule-info__icon">
                    <VIcon icon="tabler-currency-euro" size="14" color="#E8A838" />
                  </div>
                  <span class="formule-info__val">{{ f.prix_personne || 0 }} € / personne</span>
                </div>
                <div class="formule-info mb-1">
                  <div class="formule-info__icon">
                    <VIcon icon="tabler-mood-smile" size="14" color="#1a1a2e" />
                  </div>
                  <span class="formule-info__val">{{ f.nb_enfants_min || 0 }} enfants min</span>
                </div>
                <div class="formule-info mb-3">
                  <div class="formule-info__icon">
                    <VIcon icon="tabler-calendar-time" size="14" color="#1a1a2e" />
                  </div>
                  <span class="formule-info__val">{{ f.creneaux || 'Voir disponibilités' }}</span>
                </div>

                <!-- Actions -->
                <div class="d-flex align-center justify-space-between">
                  <VBtn class="btn-delete-sm" size="small" elevation="0" @click="openDelete(f)">
                    <VIcon icon="tabler-trash" size="13" class="me-1" />Supprimer
                  </VBtn>
                  <VBtn class="btn-modify-sm" size="small" elevation="0" @click="openEdit(f)">
                    <VIcon icon="tabler-edit" size="13" class="me-1" />Modifier
                  </VBtn>
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </div>
    </div>

    <!-- Vide -->
    <VCard v-else style="border-radius:12px">
      <VCardText class="text-center py-16 text-medium-emphasis">
        <VIcon icon="tabler-cake" size="52" class="mb-3" style="opacity:0.25" />
        <div style="font-size:14px">Aucune formule d'anniversaire</div>
      </VCardText>
    </VCard>


    <!-- ══════════════════════════════════════════════════
         MODAL DÉTAILS — 2 onglets
    ══════════════════════════════════════════════════ -->
    <VDialog v-model="detailsDialog" max-width="580" scrollable>
      <VCard v-if="current" style="border-radius:16px;overflow:hidden">
        <!-- Header coloré -->
        <div class="formule-modal-header d-flex align-center justify-space-between pa-5">
          <VBtn icon variant="text" size="small" style="color:#fff" @click="detailsDialog=false">
            <VIcon icon="tabler-arrow-left" size="18" />
          </VBtn>
          <span style="font-size:16px;font-weight:700;color:#fff">{{ current.name }}</span>
          <div style="width:36px"></div>
        </div>

        <!-- Onglets -->
        <div class="d-flex px-5 pt-4 gap-3">
          <button class="tab-toggle" :class="detailTab===0?'tab-toggle--active':''" @click="detailTab=0">
            Informations Générales
          </button>
          <button class="tab-toggle" :class="detailTab===1?'tab-toggle--active':''" @click="detailTab=1">
            Avantages
          </button>
        </div>

        <!-- Tab 0 — Informations -->
        <VCardText v-if="detailTab===0" class="pa-5 pt-4">
          <div class="info-row"><span class="info-lbl">Franchise</span><span>{{ current.franchise?.name || '—' }}</span></div>
          <div class="info-row"><span class="info-lbl">Parc</span><span>{{ current.park?.localisation || current.park?.name || '—' }}</span></div>
          <div class="info-row"><span class="info-lbl">Prix / personne</span><span class="font-weight-bold" style="color:#E8A838">{{ current.prix_personne || 0 }} €</span></div>
          <div class="info-row"><span class="info-lbl">Enfants minimum</span><span>{{ current.nb_enfants_min || 0 }}</span></div>
          <div class="info-row"><span class="info-lbl">Tranche d'âge</span><span>{{ current.age_min || '?' }} – {{ current.age_max || '?' }} ans</span></div>
          <div class="info-row"><span class="info-lbl">Créneaux</span><span>{{ current.creneaux || '—' }}</span></div>
          <div v-if="current.notes" class="mt-3">
            <div class="info-lbl mb-1">Notes</div>
            <p style="font-size:13px;color:#555;line-height:1.6">{{ current.notes }}</p>
          </div>
          <div class="d-flex gap-2 justify-end mt-4">
            <VBtn class="btn-delete" elevation="0" @click="openDelete(current);detailsDialog=false">
              <VIcon icon="tabler-trash" size="14" class="me-1" />Supprimer
            </VBtn>
            <VBtn class="btn-modify" elevation="0" @click="openEdit(current);detailsDialog=false">
              <VIcon icon="tabler-edit" size="14" class="me-1" />Modifier
            </VBtn>
          </div>
        </VCardText>

        <!-- Tab 1 — Avantages -->
        <VCardText v-else class="pa-5 pt-4">
          <div v-if="current.avantages && current.avantages.length" class="d-flex flex-column gap-2">
            <div v-for="(av, i) in current.avantages" :key="i" class="avantage-item">
              <VIcon icon="tabler-circle-check" size="16" color="#4CAF50" class="me-2 flex-shrink-0" />
              <span style="font-size:13px">{{ av }}</span>
            </div>
          </div>
          <div v-else class="text-center py-8 text-medium-emphasis" style="font-size:13px">
            Aucun avantage défini.
          </div>
        </VCardText>
      </VCard>
    </VDialog>


    <!-- ══════════════════════════════════════════════════
         MODAL CRÉER/MODIFIER — stepper 2 étapes
    ══════════════════════════════════════════════════ -->
    <VDialog v-model="formDialog" max-width="600" scrollable persistent>
      <VCard style="border-radius:14px;overflow:hidden">

        <!-- ── Header ── -->
        <div class="ann-modal-header d-flex align-center gap-2 px-5 py-4">
          <button class="ann-back-btn" @click="formDialog=false">
            <VIcon icon="tabler-arrow-left" size="17" />
          </button>
          <span class="ann-modal-title">{{ isEditing ? 'Modifier la Formule' : 'Nouvelle Formule' }}</span>
        </div>

        <!-- ── Stepper inline ── -->
        <div class="ann-stepper px-5 pb-4">
          <div class="ann-stepper-step">
            <div class="ann-stepper-num" :class="step===1?'ann-stepper-num--active':'ann-stepper-num--done'">1</div>
            <span class="ann-stepper-txt" :class="step===1?'ann-stepper-txt--active':''">Informations de formule</span>
          </div>
          <VIcon icon="tabler-chevron-right" size="16" style="color:#ccc;flex-shrink:0" />
          <div class="ann-stepper-step">
            <div class="ann-stepper-num" :class="step===2?'ann-stepper-num--active':''">2</div>
            <span class="ann-stepper-txt" :class="step===2?'ann-stepper-txt--active':''">Avantages</span>
          </div>
        </div>

        <VCardText class="px-5 pt-0 pb-2">
          <VForm ref="annivForm">

            <!-- ══ ÉTAPE 1 ══ -->
            <div v-if="step===1">

              <!-- Image -->
              <div class="ann-label mb-1">Image de formule</div>
              <div class="ann-img-zone" @click="$refs.annImgInput.click()">
                <VImg v-if="form.imagePreview" :src="form.imagePreview" height="140" cover style="border-radius:8px" />
                <div v-else style="height:140px" />
              </div>
              <div class="ann-hint mb-4">Formats autorisés : JPG, GIF ou PNG. Taille maximale de 800 Ko</div>
              <input ref="annImgInput" type="file" accept="image/*" class="d-none" @change="onImgChange" />

              <!-- Franchise | Parc -->
              <VRow dense class="mb-1">
                <VCol cols="12" md="6">
                  <div class="ann-label mb-1">Franchise</div>
                  <VSelect v-model="form.franchise_id" :items="franchiseOptions" item-title="name" item-value="id"
                    placeholder="Sélectionner la franchise"
                    density="compact" variant="outlined" hide-details />
                </VCol>
                <VCol cols="12" md="6">
                  <div class="ann-label mb-1">Parc</div>
                  <VSelect v-model="form.park_id" :items="parcOptions" item-title="name" item-value="id"
                    placeholder="Tous Les Parcs"
                    density="compact" variant="outlined" hide-details
                    :rules="[v=>!!v||'Requis']" />
                </VCol>
              </VRow>

              <!-- Nom | Titre secondaire -->
              <VRow dense class="mt-3 mb-1">
                <VCol cols="12" md="6">
                  <div class="ann-label mb-1">Nom de formule</div>
                  <VTextField v-model="form.name" placeholder="Entrer le nom de l'évènement"
                    density="compact" variant="outlined" hide-details
                    :rules="[v=>!!v||'Requis']" />
                </VCol>
                <VCol cols="12" md="6">
                  <div class="ann-label mb-1">Titre secondaire</div>
                  <VTextField v-model="form.titre_secondaire" placeholder="Entrer le nom de l'évènement"
                    density="compact" variant="outlined" hide-details />
                </VCol>
              </VRow>

              <!-- Prix | Nb enfants min | Âge (de _ à _) -->
              <VRow dense class="mt-3 mb-1">
                <VCol cols="12" md="4">
                  <div class="ann-label mb-1">Prix par personne</div>
                  <VTextField v-model="form.prix_personne" placeholder="Sélectionner la franchise"
                    type="number" density="compact" variant="outlined" hide-details>
                    <template #append-inner>
                      <span style="font-size:13px;color:#9e9e9e;font-weight:600">€</span>
                    </template>
                  </VTextField>
                </VCol>
                <VCol cols="12" md="4">
                  <div class="ann-label mb-1">Nombre minimum d'enfants</div>
                  <VTextField v-model="form.nb_enfants_min" placeholder="Nombre minimum d'enfants"
                    type="number" density="compact" variant="outlined" hide-details />
                </VCol>
                <VCol cols="12" md="4">
                  <div class="ann-label mb-1">Âge d'enfants</div>
                  <div class="d-flex align-center gap-1">
                    <VTextField v-model="form.age_min" placeholder="de" type="number"
                      density="compact" variant="outlined" hide-details />
                    <span style="font-size:12px;color:#9e9e9e;white-space:nowrap">à</span>
                    <VTextField v-model="form.age_max" placeholder="à" type="number"
                      density="compact" variant="outlined" hide-details />
                  </div>
                </VCol>
              </VRow>

              <!-- Adultes inclus toggle -->
              <div class="d-flex justify-end align-center gap-2 mt-3 mb-2">
                <span style="font-size:12px;font-weight:600;color:#1a1a2e">Adultes inclus</span>
                <VSwitch v-model="form.adultes_inclus" color="#E8A838" hide-details density="compact" inset />
              </div>

              <!-- Horaires section -->
              <div class="ann-section-title mb-2">Horaires</div>
              <div v-for="(h, i) in form.horaires" :key="i" class="mb-2">
                <VRow dense>
                  <VCol cols="12" md="4">
                    <div class="ann-label mb-1">Jours</div>
                    <VTextField v-model="h.jours" placeholder="DD/MM/YYYY" type="date"
                      density="compact" variant="outlined" hide-details />
                  </VCol>
                  <VCol cols="12" md="4">
                    <div class="ann-label mb-1">Heure début</div>
                    <VTextField v-model="h.heure_debut" placeholder="HH:MM" type="time"
                      density="compact" variant="outlined" hide-details />
                  </VCol>
                  <VCol cols="12" md="4">
                    <div class="ann-label mb-1">Heure fin</div>
                    <VTextField v-model="h.heure_fin" placeholder="HH:MM" type="time"
                      density="compact" variant="outlined" hide-details />
                  </VCol>
                </VRow>
              </div>
              <button class="ann-add-link" @click.prevent="form.horaires.push({jours:'',heure_debut:'',heure_fin:''})">
                <VIcon icon="tabler-circle-plus" size="15" class="me-1" />Ajouter Un Horaire
              </button>

              <!-- Note -->
              <div class="ann-label mb-1 mt-3">Note</div>
              <VTextarea v-model="form.notes" placeholder="Ajouter des notes ici..."
                rows="3" density="compact" variant="outlined" hide-details />

            </div>

            <!-- ══ ÉTAPE 2 ══ -->
            <div v-else>

              <!-- Horaires (recap) -->
              <div class="ann-section-title mb-3">Horaires</div>

              <!-- Avantage -->
              <div class="ann-label mb-2">Avantage</div>
              <div v-for="(av, i) in form.avantages" :key="'av'+i" class="mb-2">
                <VTextField v-model="form.avantages[i]" :placeholder="`Avantage ${i+1}`"
                  density="compact" variant="outlined" hide-details>
                  <template #append-inner>
                    <VIcon icon="tabler-x" size="14" style="cursor:pointer;color:#bbb"
                      @click="form.avantages.splice(i,1)" />
                  </template>
                </VTextField>
              </div>
              <button class="ann-add-link mb-4" @click.prevent="form.avantages.push('')">
                <VIcon icon="tabler-circle-plus" size="15" class="me-1" />Ajouter Un Avantage
              </button>

              <!-- Les options possibles -->
              <div class="ann-section-title mb-2">Les options possibles</div>
              <VRow dense class="mb-1">
                <VCol cols="8"><div class="ann-label">option possible</div></VCol>
                <VCol cols="4"><div class="ann-label">Prix</div></VCol>
              </VRow>
              <div v-for="(opt, i) in form.options" :key="'opt'+i" class="mb-2">
                <VRow dense>
                  <VCol cols="8">
                    <VTextField v-model="opt.label" :placeholder="`Option ${i+1}`"
                      density="compact" variant="outlined" hide-details />
                  </VCol>
                  <VCol cols="4">
                    <VTextField v-model="opt.prix" placeholder="Prix"
                      type="number" density="compact" variant="outlined" hide-details />
                  </VCol>
                </VRow>
              </div>
              <button class="ann-add-link" @click.prevent="form.options.push({label:'',prix:''})">
                <VIcon icon="tabler-circle-plus" size="15" class="me-1" />Ajouter Une Option
              </button>

            </div>

          </VForm>
        </VCardText>

        <!-- ── Footer ── -->
        <div class="ann-modal-footer">
          <button class="ann-footer-btn ann-footer-btn--brown" @click="step===1 ? formDialog=false : step=1">
            <VIcon icon="tabler-arrow-left" size="15" class="me-1" />Précédent
          </button>
          <button v-if="step===1" class="ann-footer-btn ann-footer-btn--gold" @click="goStep2">
            Suivant <VIcon icon="tabler-arrow-right" size="15" class="ms-1" />
          </button>
          <button v-else class="ann-footer-btn ann-footer-btn--navy" :disabled="saving" @click="saveFormule">
            <VProgressCircular v-if="saving" size="14" indeterminate color="#fff" class="me-1" />
            {{ isEditing ? 'Enregistrer' : 'Créer' }}
          </button>
        </div>

      </VCard>
    </VDialog>

    <!-- Modal suppression -->
    <VDialog v-model="deleteDialog" max-width="420">
      <VCard style="border-radius:14px">
        <VCardText class="pa-6 pb-3">
          <div class="text-subtitle-1 font-weight-bold mb-2" style="color:#1a1a2e">Supprimer la formule</div>
          <p style="font-size:13px;color:#666">Voulez-vous vraiment supprimer <strong>{{ current?.name }}</strong> ?</p>
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

export default {
  setup() { return {}; },

  data() {
    return {
      formules: [], total: 0, isLoading: false,
      filterParc: null, filterFranchise: null,
      parcOptions: [], franchiseOptions: [],

      detailsDialog: false, detailTab: 0,
      formDialog: false, deleteDialog: false,
      current: null, isEditing: false, saving: false, deleting: false,
      step: 1,
      form: this.defaultForm(),

      snackVisible: false, snackMsg: "", snackColor: "success",
    };
  },

  computed: {
    grouped() {
      const map = {};
      for (const f of this.formules) {
        const key = f.franchise?.name || 'Sans franchise';
        if (!map[key]) map[key] = [];
        map[key].push(f);
      }
      return Object.entries(map).map(([franchise, items]) => ({ franchise, items }));
    },
  },

  async mounted() {
    // parks & franchises must be ready before loadFormules (used in toDisplay)
    await Promise.all([this.loadParcs(), this.loadFranchises()]);
    await this.loadFormules();
  },

  beforeUnmount() {
    if (this.form.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.form.imagePreview);
  },

  methods: {
    defaultForm() {
      return { franchise_id: null, park_id: null, name: "", titre_secondaire: "",
               prix_personne: "", nb_enfants_min: "", age_min: "", age_max: "",
               adultes_inclus: false,
               horaires: [{ jours: "", heure_debut: "", heure_fin: "" }],
               notes: "", avantages: [""],
               options: [{ label: "", prix: "" }],
               image: null, imagePreview: null };
    },

    // Map backend Birthday item → frontend display format
    toDisplay(item) {
      const park      = this.parcOptions.find(p => p.id === item.park_id) || null;
      const franchise = park ? (this.franchiseOptions.find(f => f.id === park.franchise_id) || null) : null;
      return {
        ...item,
        prix_personne:    item.price_per_person,
        nb_enfants_min:   item.min_kids,
        titre_secondaire: item.second_name,
        age_min:          item.min_kids_age,
        age_max:          item.max_kids_age,
        avantages:        item.advantages || [],
        creneaux:         null,
        park:             park      ? { id: park.id,      name: park.name,      localisation: park.name }      : null,
        franchise:        franchise ? { id: franchise.id, name: franchise.name }                               : null,
      };
    },

    // Map frontend form → backend payload
    toPayload(form) {
      return {
        park_id:          form.park_id,
        name:             form.name,
        second_name:      form.titre_secondaire || null,
        price_per_person: Number(form.prix_personne)  || 0,
        min_kids:         Number(form.nb_enfants_min) || 1,
        min_kids_age:     Number(form.age_min)        || 0,
        max_kids_age:     Number(form.age_max)        || 0,
        notes:            form.notes || null,
        advantages:       (form.avantages || []).filter(a => a?.trim()),
        options:          (form.options  || [])
                            .filter(o => o.label?.trim())
                            .map(o => ({ name: o.label, price: Number(o.prix) || 0 })),
      };
    },

    onImgChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      if (this.form.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.form.imagePreview);
      this.form.image = file;
      this.form.imagePreview = URL.createObjectURL(file);
    },

    async loadFormules() {
      this.isLoading = true;
      try {
        const params = { per_page: 200 };
        if (this.filterParc) params.park_id = this.filterParc;
        const res = await $api("/birthdays", { params });
        let items = (res.data || []).map(item => this.toDisplay(item));
        if (this.filterFranchise) {
          items = items.filter(f => f.franchise?.id === this.filterFranchise);
        }
        this.formules = items;
        this.total    = res.total || 0;
      } catch { this.formules = []; } finally { this.isLoading = false; }
    },

    async loadParcs() {
      try {
        const res = await $api("/parks", { params: { per_page: 200 } });
        this.parcOptions = (res.data || []).map(p => ({
          id:           p.id,
          name:         p.name || p.city || `Parc ${p.id}`,
          franchise_id: p.franchise?.id || p.franchise_id || null,
        }));
      } catch { /* */ }
    },

    async loadFranchises() {
      try {
        const res = await $api("/franchises", { params: { per_page: 100 } });
        this.franchiseOptions = (res.data || []).map(f => ({ id: f.id, name: f.name }));
      } catch { /* */ }
    },

    openDetails(f) { this.current = f; this.detailTab = 0; this.detailsDialog = true; },
    openCreate() {
      if (this.form.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.form.imagePreview);
      this.isEditing = false; this.step = 1; this.form = this.defaultForm(); this.formDialog = true;
    },
    openEdit(f) {
      if (this.form.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.form.imagePreview);
      this.isEditing = true; this.step = 1; this.current = f;
      this.form = {
        ...this.defaultForm(),
        park_id:          f.park_id,
        franchise_id:     f.franchise?.id    || null,
        name:             f.name             || '',
        titre_secondaire: f.titre_secondaire || '',
        prix_personne:    f.prix_personne    ?? '',
        nb_enfants_min:   f.nb_enfants_min   ?? '',
        age_min:          f.age_min          ?? '',
        age_max:          f.age_max          ?? '',
        notes:            f.notes            || '',
        avantages:        f.avantages?.length ? [...f.avantages] : [''],
        options:          f.options?.length
                            ? f.options.map(o => ({ label: o.name || o.label || '', prix: o.price ?? o.prix ?? '' }))
                            : [{ label: '', prix: '' }],
        imagePreview:     f.image_url || null,
        image:            null,
      };
      this.formDialog = true;
    },
    openDelete(f) { this.current = f; this.deleteDialog = true; },

    async goStep2() {
      if (!this.$refs.annivForm) { this.step = 2; return; }
      const { valid } = await this.$refs.annivForm.validate();
      if (valid) this.step = 2;
    },

    async saveFormule() {
      this.saving = true;
      try {
        const fd = new FormData();

        // Champs obligatoires
        fd.append('park_id',          this.form.park_id);
        fd.append('name',             this.form.name);
        fd.append('price_per_person', Number(this.form.prix_personne)  || 0);
        fd.append('min_kids',         Number(this.form.nb_enfants_min) || 1);
        fd.append('min_kids_age',     Number(this.form.age_min)        || 0);
        fd.append('max_kids_age',     Number(this.form.age_max)        || 0);

        // Champs optionnels
        if (this.form.titre_secondaire) fd.append('second_name', this.form.titre_secondaire);
        if (this.form.notes)            fd.append('notes',       this.form.notes);

        // Avantages (tableau)
        const avs = (this.form.avantages || []).filter(a => a?.trim());
        avs.forEach((a, i) => fd.append(`advantages[${i}]`, a));

        // Options (tableau d'objets)
        const opts = (this.form.options || []).filter(o => o.label?.trim());
        opts.forEach((o, i) => {
          fd.append(`options[${i}][name]`,  o.label);
          fd.append(`options[${i}][price]`, Number(o.prix) || 0);
        });

        // Image (fichier réel uniquement)
        if (this.form.image instanceof File) fd.append('image', this.form.image);

        // PUT via method spoofing pour les mises à jour (Laravel + multipart)
        const url = this.isEditing ? `/birthdays/${this.current.id}` : '/birthdays';
        if (this.isEditing) fd.append('_method', 'PUT');

        await $api(url, { method: 'POST', body: fd });
        this.formDialog = false;
        this.showSnack(this.isEditing ? "Formule modifiée" : "Formule créée", "success");
        await this.loadFormules();
      } catch (err) {
        const errData = err?.data || {};
        const errors  = errData?.errors;
        const msg = errors
          ? Object.values(errors).flat().join(" — ")
          : (errData?.message || "Erreur lors de l'enregistrement");
        this.showSnack(msg, "error");
      } finally { this.saving = false; }
    },

    async confirmDelete() {
      this.deleting = true;
      try {
        await $api(`/birthdays/${this.current.id}`, { method: "DELETE" });
        this.formules = this.formules.filter(f => f.id !== this.current.id);
        this.deleteDialog = false;
        this.showSnack("Formule supprimée", "success");
      } catch { this.showSnack("Erreur", "error"); } finally { this.deleting = false; }
    },

    showSnack(msg, color) { this.snackMsg = msg; this.snackColor = color; this.snackVisible = true; },
  },
};
</script>

<style scoped>
.filter-label { font-size:14px; font-weight:600; color:#1a1a2e; }
.apply-btn  { background:#E8A838 !important; color:#1a1a2e !important; border-radius:8px !important; font-weight:700; min-width:110px; }
.create-btn { background:#E8A838 !important; color:#1a1a2e !important; border-radius:8px !important; font-weight:700; }
.btn-prev   { background:#333 !important; color:#fff !important; border-radius:8px !important; font-weight:600; }
.btn-delete { background:#FDECEA !important; color:#c62828 !important; border-radius:8px !important; font-weight:600; }
.btn-modify { background:#E8A838 !important; color:#1a1a2e !important; border-radius:8px !important; font-weight:700; }

/* ── Franchise heading ── */
.franchise-heading {
  font-size:15px; font-weight:700; color:#1a1a2e;
  display:flex; align-items:center;
  padding-bottom:10px;
  border-bottom:2px solid #f0f0f0;
}

/* ── Formule card ── */
.formule-card { border-radius:14px; overflow:hidden; transition:transform 0.15s,box-shadow 0.15s; }
.formule-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,0.12) !important; }
.formule-card__header {
  height:90px;
  background:linear-gradient(135deg,#1a1a2e 0%,#2d3561 100%);
  display:flex; align-items:center; justify-content:center;
  overflow:hidden;
}
.formule-card__header-fallback {
  width:100%; height:90px;
  background:linear-gradient(135deg,#1a1a2e 0%,#2d3561 100%);
  display:flex; align-items:center; justify-content:center;
}
.formule-name { font-size:14px; font-weight:700; color:#1a1a2e; }
.formule-sub  { font-size:11px; color:#9e9e9e; }

/* ── Info row on card ── */
.formule-info { display:flex; align-items:center; gap:8px; }
.formule-info__icon { width:20px; height:20px; display:flex; align-items:center; justify-content:center; background:#f5f5f5; border-radius:5px; flex-shrink:0; }
.formule-info__val  { font-size:12px; color:#555; }

/* ── Card action buttons ── */
.btn-delete-sm { background:#FDECEA !important; color:#c62828 !important; border-radius:8px !important; font-size:11px !important; font-weight:600 !important; }
.btn-modify-sm { background:#E8A838 !important; color:#1a1a2e !important; border-radius:8px !important; font-size:11px !important; font-weight:700 !important; }

/* ── Modal header ── */
.formule-modal-header { background:linear-gradient(135deg,#1a1a2e,#2d3561); }

/* ── Tab toggle ── */
.tab-toggle {
  padding:8px 18px; border-radius:8px; border:none; cursor:pointer;
  font-size:13px; font-weight:600; background:#f5f5f5; color:#666; transition:all 0.15s;
}
.tab-toggle--active { background:#1a1a2e; color:#fff; }

/* ── Info rows in modal ── */
.info-row { display:flex; align-items:center; padding:9px 0; border-bottom:1px solid #f5f5f5; gap:12px; }
.info-row:last-child { border-bottom:none; }
.info-lbl { min-width:150px; font-size:12px; color:#9e9e9e; flex-shrink:0; }

/* ── Avantage item ── */
.avantage-item { display:flex; align-items:center; padding:10px 12px; background:#f9f9f9; border-radius:8px; }

/* ── Stepper (old, kept for details modal) ── */
.stepper-item { display:flex; flex-direction:column; align-items:center; gap:4px; }
.stepper-circle {
  width:32px; height:32px; border-radius:50%; background:#e0e0e0; color:#9e9e9e;
  display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px;
}
.stepper-circle--active { background:#1a1a2e; color:#fff; }
.stepper-circle--gold   { background:#E8A838; color:#1a1a2e; }
.stepper-lbl { font-size:11px; font-weight:600; color:#9e9e9e; white-space:nowrap; }
.stepper-line { flex:1; height:2px; background:#e0e0e0; border-radius:2px; min-width:60px; margin-top:-14px; }

/* ══ Nouvelle Formule Modal ══ */
.ann-modal-header { border-bottom:1px solid #f0f0f0; }
.ann-back-btn {
  width:32px; height:32px; border-radius:8px;
  border:1.5px solid #e0e0e0; background:#f9f9f9;
  display:inline-flex; align-items:center; justify-content:center;
  cursor:pointer; color:#1a1a2e; flex-shrink:0; transition:background 0.15s;
}
.ann-back-btn:hover { background:#f0f0f0; }
.ann-modal-title { font-size:16px; font-weight:700; color:#1a1a2e; }

/* Stepper inline */
.ann-stepper { display:flex; align-items:center; gap:10px; padding-top:16px; }
.ann-stepper-step { display:flex; align-items:center; gap:8px; }
.ann-stepper-num {
  width:28px; height:28px; border-radius:50%; background:#e0e0e0; color:#9e9e9e;
  display:flex; align-items:center; justify-content:center;
  font-size:13px; font-weight:700; flex-shrink:0; transition:background 0.2s;
}
.ann-stepper-num--active { background:#1a1a2e; color:#fff; }
.ann-stepper-num--done   { background:#1a1a2e; color:#fff; }
.ann-stepper-txt { font-size:13px; font-weight:600; color:#aaa; white-space:nowrap; }
.ann-stepper-txt--active { color:#1a1a2e; }

/* Image */
.ann-img-zone {
  border:2px dashed #e0e0e0; border-radius:10px; cursor:pointer;
  overflow:hidden; transition:border-color 0.2s; background:#fafafa;
}
.ann-img-zone:hover { border-color:#E8A838; }
.ann-hint { font-size:11px; color:#aaa; }

/* Labels */
.ann-label { font-size:12px; font-weight:600; color:#1a1a2e; }
.ann-section-title { font-size:13px; font-weight:700; color:#1a1a2e; }

/* Add link */
.ann-add-link {
  display:inline-flex; align-items:center; background:none; border:none;
  font-size:12px; font-weight:600; color:#E8A838; cursor:pointer;
  padding:0; transition:opacity 0.15s;
}
.ann-add-link:hover { opacity:0.75; }

/* Footer */
.ann-modal-footer {
  display:grid; grid-template-columns:1fr 1fr;
  border-top:1px solid #f0f0f0;
}
.ann-footer-btn {
  padding:14px; border:none; cursor:pointer;
  font-size:14px; font-weight:700;
  display:flex; align-items:center; justify-content:center; gap:6px;
  transition:opacity 0.15s;
}
.ann-footer-btn:disabled { opacity:0.55; cursor:not-allowed; }
.ann-footer-btn--brown { background:#8B6B20; color:#fff; }
.ann-footer-btn--brown:hover { opacity:0.88; }
.ann-footer-btn--gold  { background:#E8A838; color:#1a1a2e; }
.ann-footer-btn--gold:hover { background:#d4942b; }
.ann-footer-btn--navy  { background:#1a1a2e; color:#fff; }
.ann-footer-btn--navy:hover:not(:disabled) { opacity:0.88; }
</style>
