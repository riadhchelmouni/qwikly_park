<template>
  <div>

    <div class="mb-5">
      <h1 class="page-title">Gestion des actualités</h1>
    </div>

    <!-- ══ ALERT ══ -->
    <transition name="slide-down">
      <div v-if="alertVisible" class="alert-banner" :class="alertType==='success'?'alert-success':'alert-warning'">
        <div class="alert-inner">
          <VIcon :icon="alertType==='success'?'tabler-circle-check':'tabler-alert-triangle'" size="20" class="alert-icon" />
          <div class="alert-body">
            <div class="alert-title">{{ alertTitle }}</div>
            <div class="alert-sub">{{ alertSub }}</div>
          </div>
          <button class="alert-close" @click="alertVisible=false"><VIcon icon="tabler-x" size="16" /></button>
        </div>
      </div>
    </transition>

    <!-- ══ FILTRES ══ -->
    <VCard class="mb-4" elevation="0" border>
      <VCardText class="pa-4">
        <div class="filter-label mb-3">Filter</div>
        <div class="d-flex gap-3 flex-wrap align-end">
          <div style="position:relative;min-width:180px">
            <input v-model="filters.date_pub" type="date" placeholder="Date de publication"
              style="width:100%;height:38px;padding:0 36px 0 12px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:13px;color:#333;background:#fff;outline:none;font-family:inherit;box-sizing:border-box" />
            <VIcon icon="tabler-calendar" size="16" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#888;pointer-events:none" />
          </div>
          <div style="position:relative;min-width:160px">
            <select v-model="filters.park_id" style="width:100%;height:38px;padding:0 32px 0 12px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:13px;color:#555;background:#fff;outline:none;font-family:inherit;appearance:none;cursor:pointer">
              <option value="">Parc</option>
              <option v-for="p in parkOptions" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <VIcon icon="tabler-chevron-down" size="15" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#888;pointer-events:none" />
          </div>
          <div style="position:relative;min-width:150px">
            <select v-model="filters.status" style="width:100%;height:38px;padding:0 32px 0 12px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:13px;color:#555;background:#fff;outline:none;font-family:inherit;appearance:none;cursor:pointer">
              <option value="">Statut</option>
              <option value="published">Publié</option>
              <option value="draft">Brouillon</option>
            </select>
            <VIcon icon="tabler-chevron-down" size="15" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#888;pointer-events:none" />
          </div>
          <VBtn class="apply-btn" elevation="0" @click="applyFilters">Appliquer</VBtn>
        </div>
      </VCardText>
    </VCard>

    <!-- ══ LISTE ══ -->
    <VCard elevation="0" border>
      <VCardText class="pa-4">

        <!-- Top bar -->
        <div class="d-flex align-center justify-space-between mb-4 flex-wrap gap-3">
          <span style="font-size:15px;font-weight:700;color:#1a1a2e">Liste des événements</span>
          <div class="d-flex align-center gap-3">
            <div style="position:relative">
              <input v-model="search" placeholder="Rechercher..." style="height:38px;padding:0 12px 0 36px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:13px;color:#333;background:#fff;outline:none;font-family:inherit;width:220px" />
              <VIcon icon="tabler-search" size="15" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#aaa;pointer-events:none" />
            </div>
            <button class="add-btn" @click="openCreate">
              <VIcon icon="tabler-plus" size="15" class="me-1" />Nouvelle Actualité
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="d-flex justify-center align-center py-12">
          <VProgressCircular indeterminate color="#E8A838" size="44" />
        </div>

        <template v-else>
          <!-- Cards grid -->
          <div v-if="paginatedItems.length" class="news-grid">
            <div v-for="item in paginatedItems" :key="item.id" class="news-card">

              <!-- Image -->
              <div class="card-img-wrap">
                <VImg v-if="item.image_url" :src="item.image_url" height="160" cover class="card-img" />
                <div v-else class="card-img-placeholder">
                  <VIcon icon="tabler-photo" size="36" color="#d0d0d0" />
                </div>
                <span class="card-badge" :class="item.status==='published'?'badge-publie':'badge-brouillon'">
                  {{ item.status==='published' ? 'Publié' : 'Brouillon' }}
                </span>
              </div>

              <!-- Content -->
              <div class="card-body">
                <!-- Title -->
                <p class="card-title">{{ item.titre || item.title || '—' }}</p>

                <!-- Parcs -->
                <div class="card-meta">
                  <VIcon icon="tabler-map-pin" size="13" color="#9e9e9e" style="flex-shrink:0;margin-top:2px" />
                  <div>
                    <div style="font-size:11px;color:#9e9e9e;font-weight:600">Associated parc(s)</div>
                    <template v-if="item.parks && item.parks.length">
                      <div v-for="p in item.parks" :key="p.id" style="font-size:12px;color:#555">
                        • {{ p.localisation||p.name||p.numero }}
                      </div>
                    </template>
                    <template v-else-if="item.park_ids && item.park_ids.length">
                      <div v-for="pid in item.park_ids.slice(0,3)" :key="pid" style="font-size:12px;color:#555">
                        • {{ parkName(pid) }}
                      </div>
                    </template>
                    <div v-else style="font-size:12px;color:#aaa">—</div>
                  </div>
                </div>

                <!-- Date -->
                <div class="card-meta" style="margin-top:6px">
                  <VIcon icon="tabler-calendar" size="13" color="#9e9e9e" style="flex-shrink:0" />
                  <span style="font-size:12px;color:#555">{{ formatDate(item.date_pub || item.created_at) }}</span>
                </div>

                <!-- Author -->
                <div class="card-author">
                  <div class="author-avatar">{{ authorInitial(item) }}</div>
                  <div>
                    <div style="font-size:13px;font-weight:700;color:#1a1a2e">{{ item.author_name || item.auteur || 'Admin' }}</div>
                    <div style="font-size:11px;color:#9e9e9e">{{ item.author_email || item.auteur_email || '' }}</div>
                  </div>
                </div>

                <!-- Actions -->
                <div class="card-actions">
                  <button class="ca-btn ca-btn--icon ca-btn--del" @click="openDelete(item)" title="Supprimer">
                    <VIcon icon="tabler-trash" size="15" />
                  </button>
                  <button class="ca-btn ca-btn--detail" @click="openDetail(item)">
                    <VIcon icon="tabler-eye" size="14" class="me-1" />Détail
                  </button>
                  <button class="ca-btn ca-btn--edit" @click="openEdit(item)">
                    <VIcon icon="tabler-edit" size="14" class="me-1" />Modifier
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">Aucune actualité trouvée</div>

          <!-- Pagination -->
          <div class="table-footer mt-4">
            <span class="showing-txt">Showing {{ showingFrom }} to {{ showingTo }} of {{ filteredItems.length }} entries</span>
            <div class="d-flex align-center gap-1">
              <button class="pg-btn" :disabled="page===1" @click="page=1">«</button>
              <button class="pg-btn" :disabled="page===1" @click="page--">‹</button>
              <button v-for="p in visiblePages" :key="p" class="pg-btn" :class="p===page?'pg-btn--active':''" @click="page=p">{{ p }}</button>
              <button class="pg-btn" :disabled="page===totalPages" @click="page++">›</button>
              <button class="pg-btn" :disabled="page===totalPages" @click="page=totalPages">»</button>
            </div>
          </div>
        </template>
      </VCardText>
    </VCard>


    <!-- ══════════════════════════════════════
         MODAL CRÉER / MODIFIER
    ══════════════════════════════════════ -->
    <VDialog v-model="formDialog" max-width="560" persistent scrollable>
      <VCard style="border-radius:16px;overflow:hidden">

        <div style="display:flex;align-items:center;gap:10px;padding:18px 22px 14px;flex-shrink:0">
          <button class="back-btn" @click="formDialog=false">
            <VIcon icon="tabler-arrow-left" size="16" />
          </button>
          <span style="font-size:16px;font-weight:700;color:#1a1a2e">{{ isEditing ? "Modifier l'actualité" : 'Nouvelle actualité' }}</span>
        </div>

        <VCardText style="padding:0 22px 8px;overflow-y:auto;max-height:74vh">

          <!-- Image upload -->
          <p class="field-label mb-2">Image d'actualité</p>
          <div class="img-upload-zone" @click="$refs.imgInput.click()">
            <VImg v-if="form.imagePreview" :src="form.imagePreview" height="150" cover style="width:100%;border-radius:10px" />
            <div v-else class="img-upload-empty"><VIcon icon="tabler-photo" size="36" color="#d0d0d0" /></div>
          </div>
          <p class="img-hint mt-1 mb-2">Formats autorisés : JPG, GIF ou PNG. Taille maximale de 800 Ko</p>
          <input ref="imgInput" type="file" accept="image/*" class="d-none" @change="onImgChange" />
          <div class="d-flex gap-3 mb-4">
            <button class="img-btn img-btn--reset" @click="resetImage">
              <VIcon icon="tabler-refresh" size="13" class="me-1" />Réinitialiser
            </button>
            <button class="img-btn img-btn--upload" @click="$refs.imgInput.click()">
              <VIcon icon="tabler-upload" size="13" class="me-1" />Télécharger Une Nouvelle Photo
            </button>
          </div>

          <!-- Titre + Date -->
          <div class="form-row mb-3">
            <div>
              <p class="field-label mb-1">Titre</p>
              <input v-model="form.titre" placeholder="Entrer le titre d'actualité" class="custom-input" />
            </div>
            <div>
              <p class="field-label mb-1">Date de publication</p>
              <div>
                <input v-model="form.date_pub" type="date" placeholder="JJ/MM/AAAA" class="custom-input" />
              </div>
            </div>
          </div>

          <!-- Publish checkbox -->
          <label class="d-flex align-center gap-2 mb-3" style="cursor:pointer;font-size:13px;color:#555;font-weight:500">
            <input type="checkbox" v-model="form.publier" style="accent-color:#E8A838;width:15px;height:15px" />
            Enregistrer et publier définitivement
          </label>

          <!-- Description -->
          <div class="mb-3">
            <p class="field-label mb-1">Description de l'actualité</p>
            <textarea v-model="form.description" placeholder="Décrivez l'actualité ici..." class="custom-textarea" rows="4"></textarea>
          </div>

          <!-- Parcs -->
          <div class="mb-4">
            <p class="field-label mb-1">Parc(s) Concerné(s)</p>
            <AppSelect
              v-model="form.park_ids"
              :items="parkOptions"
              item-title="name"
              item-value="id"
              multiple
              placeholder="Sélectionner le(s) parc(s)..."
              hide-details
              density="compact"
            />
          </div>
        </VCardText>

        <div style="padding:0 22px 20px;flex-shrink:0">
          <button @click="confirmDialog=true" :disabled="saving" style="
            width:100%;height:46px;border-radius:10px;border:none;
            background:#1a1a2e;color:#fff;font-size:14px;font-weight:700;
            cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px">
            <span v-if="saving">⏳</span>
            {{ isEditing ? 'Enregistrer' : 'Créer' }}
          </button>
        </div>
      </VCard>
    </VDialog>


    <!-- ══ DIALOG CONFIRMATION ══ -->
    <VDialog v-model="confirmDialog" max-width="420">
      <VCard style="border-radius:16px;overflow:hidden">
        <VCardText style="padding:28px 24px 16px">
          <div style="font-size:16px;font-weight:700;color:#1a1a2e;margin-bottom:10px">
            {{ isEditing ? "Modifier cette actualité ?" : 'Créer une nouvelle actualité' }}
          </div>
          <p style="font-size:13px;color:#666;line-height:1.65;margin:0">
            Êtes-vous sûr de vouloir {{ isEditing ? 'modifier' : 'créer' }} cette nouvelle actualité ?<br>
            Les informations saisies seront enregistrées et l'actualité deviendra disponible
            pour la gestion par les administrateurs.
          </p>
        </VCardText>
        <div style="display:flex;gap:12px;padding:8px 24px 24px;justify-content:flex-end">
          <button @click="confirmDialog=false" style="display:inline-flex;align-items:center;justify-content:center;padding:0 28px;height:42px;border-radius:8px;border:2px solid #e53935;background:#fff;color:#e53935;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">Annuler</button>
          <button @click="saveItem" :disabled="saving" style="display:inline-flex;align-items:center;justify-content:center;padding:0 28px;height:42px;border-radius:8px;border:none;background:#E8A838;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
            <span v-if="saving" style="margin-right:6px">⏳</span>Confirmer La Création
          </button>
        </div>
      </VCard>
    </VDialog>


    <!-- ══ MODAL SUPPRIMER ══ -->
    <VDialog v-model="deleteDialog" max-width="420">
      <VCard style="border-radius:16px;overflow:hidden">
        <VCardText style="padding:28px 24px 16px">
          <div style="font-size:16px;font-weight:700;color:#1a1a2e;margin-bottom:10px">Confirmer la suppression</div>
          <p style="font-size:13px;color:#666;line-height:1.65;margin:0">
            Voulez-vous vraiment supprimer cette actualité ?<br>
            Vous ne pourrez pas revenir aux données liées après suppression.
          </p>
        </VCardText>
        <div style="display:flex;gap:12px;padding:8px 24px 24px;justify-content:flex-end">
          <button @click="deleteDialog=false" style="display:inline-flex;align-items:center;justify-content:center;padding:0 28px;height:42px;border-radius:8px;border:2px solid #e53935;background:#fff;color:#e53935;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">Annuler</button>
          <button @click="confirmDelete" :disabled="deleting" style="display:inline-flex;align-items:center;justify-content:center;padding:0 28px;height:42px;border-radius:8px;border:none;background:#e53935;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
            <span v-if="deleting" style="margin-right:6px">⏳</span>Supprimer
          </button>
        </div>
      </VCard>
    </VDialog>

    <!-- ══ MODAL DÉTAIL ══ -->
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
            <div v-if="detailItem.image_url" style="margin-bottom:16px;border-radius:10px;overflow:hidden">
              <img :src="detailItem.image_url" style="width:100%;height:200px;object-fit:cover;display:block" />
            </div>
            <div style="margin-bottom:10px">
              <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px"
                :style="detailItem.status==='published'
                  ? 'background:#e8f5e9;color:#2e7d32'
                  : 'background:#f5f5f5;color:#757575;border:1px solid #e0e0e0'">
                {{ detailItem.status==='published' ? 'Publié' : 'Brouillon' }}
              </span>
            </div>
            <div style="font-size:18px;font-weight:700;color:#1a1a2e;margin-bottom:14px;line-height:1.4">{{ detailItem.titre || detailItem.title }}</div>
            <div v-if="detailItem.description" style="font-size:13px;color:#555;line-height:1.7;margin-bottom:16px;white-space:pre-wrap">{{ detailItem.description }}</div>
            <div v-if="detailItem.parks && detailItem.parks.length" style="margin-bottom:14px">
              <div style="font-size:11px;font-weight:700;color:#9e9e9e;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;display:flex;align-items:center;gap:4px">
                <VIcon icon="tabler-map-pin" size="13" style="color:#E8A838" />Parcs concernés
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:8px">
                <span v-for="park in detailItem.parks" :key="park.id"
                  style="background:#f5f5f5;border:1px solid #e8e8e8;border-radius:6px;padding:3px 10px;font-size:12px;color:#444;font-weight:500">
                  {{ park.localisation || park.name || park.numero }}
                </span>
              </div>
            </div>
            <div v-if="detailItem.created_at" style="font-size:12px;color:#9e9e9e;display:flex;align-items:center;gap:5px">
              <VIcon icon="tabler-calendar" size="13" />
              <span>Créé le {{ formatDate(detailItem.created_at) }}</span>
            </div>
          </VCardText>
          <div style="padding:0 22px 18px;display:flex;justify-content:flex-end;gap:10px">
            <button @click="openEdit(detailItem); detailDialog=false" style="display:inline-flex;align-items:center;height:38px;padding:0 18px;border-radius:8px;border:none;background:#E8A838;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;gap:5px">
              <VIcon icon="tabler-edit" size="14" />Modifier
            </button>
            <button @click="detailDialog=false" style="display:inline-flex;align-items:center;height:38px;padding:0 18px;border-radius:8px;border:1.5px solid #e0e0e0;background:#fff;color:#555;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
              Fermer
            </button>
          </div>
        </template>
      </VCard>
    </VDialog>

  </div>
</template>

<script>
import { $api } from "@/utils/api";

export default {
  setup() { return {}; },

  data() {
    return {
      items: [], isLoading: false,
      filters: { date_pub: "", park_id: "", status: "" },
      appliedFilters: { date_pub: "", park_id: "", status: "" },
      search: "", page: 1, perPage: 6,
      parkOptions: [],
      formDialog: false, deleteDialog: false, confirmDialog: false, detailDialog: false,
      isEditing: false, saving: false, deleting: false,
      current: null, detailItem: null,
      form: this.defaultForm(),
      alertVisible: false, alertType: "success", alertTitle: "", alertSub: "",
      alertTimer: null,
    };
  },

  computed: {
    filteredItems() {
      let r = [...this.items];
      const q = (this.search || "").toLowerCase();
      if (q.length >= 2) r = r.filter(i => (i.titre||i.title||"").toLowerCase().includes(q));
      if (this.appliedFilters.park_id) r = r.filter(i => (i.park_ids||[]).includes(Number(this.appliedFilters.park_id)) || i.park_id === Number(this.appliedFilters.park_id));
      if (this.appliedFilters.status)  r = r.filter(i => i.status === this.appliedFilters.status);
      if (this.appliedFilters.date_pub) r = r.filter(i => (i.date_pub||"").startsWith(this.appliedFilters.date_pub));
      return r;
    },
    totalPages()    { return Math.max(1, Math.ceil(this.filteredItems.length / this.perPage)); },
    paginatedItems(){ const s=(this.page-1)*this.perPage; return this.filteredItems.slice(s,s+this.perPage); },
    showingFrom()   { return this.filteredItems.length===0?0:(this.page-1)*this.perPage+1; },
    showingTo()     { return Math.min(this.page*this.perPage, this.filteredItems.length); },
    visiblePages() {
      const pages=[],total=this.totalPages;
      let start=Math.max(1,this.page-2),end=Math.min(total,start+4);
      if(end-start<4) start=Math.max(1,end-4);
      for(let i=start;i<=end;i++) pages.push(i);
      return pages;
    },
  },

  watch: {
    search() { this.page=1; },
    filteredItems() { if(this.page>this.totalPages) this.page=1; },
  },

  async mounted() {
    await Promise.all([this.loadItems(), this.loadParks()]);
  },

  beforeUnmount() {
    clearTimeout(this.alertTimer);
    if (this.form.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.form.imagePreview);
  },

  methods: {
    defaultForm() {
      return { titre:"", date_pub:"", publier:false, description:"", park_ids:[], image:null, imagePreview:null };
    },

    formatDate(d) {
      if (!d) return "—";
      try { return new Date(d).toLocaleDateString("fr-FR"); } catch { return d; }
    },
    authorInitial(item) {
      const n = item.author_name || item.auteur || "A";
      return n.charAt(0).toUpperCase();
    },
    parkName(id) {
      const p = this.parkOptions.find(p => p.id === id || p.id === Number(id));
      return p ? p.name : `Parc ${id}`;
    },

    showAlert(type, title, sub) {
      clearTimeout(this.alertTimer);
      this.alertType=type; this.alertTitle=title; this.alertSub=sub; this.alertVisible=true;
      this.alertTimer=setTimeout(()=>{this.alertVisible=false;},5000);
    },
    applyFilters() { this.appliedFilters={...this.filters}; this.page=1; },

    resetImage() {
      if (this.form.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.form.imagePreview);
      this.form.image = null; this.form.imagePreview = null;
      if (this.$refs.imgInput) this.$refs.imgInput.value = "";
    },

    onImgChange(e) {
      const file = e.target.files[0]; if (!file) return;
      if (this.form.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.form.imagePreview);
      this.form.image = file; this.form.imagePreview = URL.createObjectURL(file);
    },

    async loadItems() {
      this.isLoading=true;
      try {
        const res=await $api("/news",{params:{per_page:200}});
        this.items=res.data||[];
      } catch { this.showAlert("warning","Erreur","Impossible de charger les actualités"); }
      finally { this.isLoading=false; }
    },
    async loadParks() {
      try {
        const res=await $api("/parks",{params:{per_page:200}});
        this.parkOptions=(res.data||res.parks||[]).map(p=>({id:p.id,name:p.nom||p.name||p.localisation||`Parc ${p.id}`}));
      } catch {}
    },

    openCreate() {
      if (this.form.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.form.imagePreview);
      this.isEditing=false; this.form=this.defaultForm(); this.formDialog=true;
    },
    openEdit(item) {
      if (this.form.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.form.imagePreview);
      this.isEditing=true; this.current=item;
      this.form={
        titre:item.titre||item.title||"", date_pub:(item.created_at||"").substring(0,10),
        publier:item.status==="published", description:item.description||"",
        park_ids:(item.parks||[]).map(p=>p.id??p), image:null, imagePreview:item.image_url||null,
      };
      this.formDialog=true;
    },

    async saveItem() {
      this.saving=true;
      try {
        const fd=new FormData();
        fd.append("title", this.form.titre);
        fd.append("description", this.form.description);
        fd.append("status", this.form.publier ? "published" : "draft");
        (this.form.park_ids||[]).forEach((id,i)=>fd.append(`parks[${i}]`,id));
        if(this.form.image instanceof File) fd.append("image",this.form.image);

        let res;
        if(this.isEditing) {
          fd.append("_method", "PUT");
          res=await $api(`/news/${this.current.id}`,{method:"POST",body:fd});
          const updated=res.data||res;
          const idx=this.items.findIndex(i=>i.id===this.current.id);
          if(idx!==-1) this.items.splice(idx,1,{ ...this.items[idx], ...updated });
          this.showAlert("success","Actualité modifiée",`L'actualité « ${this.form.titre} » a été modifiée.`);
        } else {
          res=await $api("/news",{method:"POST",body:fd});
          const created=res.data||res;
          if(created?.id) this.items.unshift(created);
          else await this.loadItems();
          this.showAlert("success","Actualité ajoutée",`L'actualité « ${this.form.titre} » a été ajoutée.`);
        }
        this.formDialog=false; this.confirmDialog=false;
      } catch(err) {
        this.showAlert("warning","Erreur",err?.data?.message||"Erreur lors de l'enregistrement");
        this.confirmDialog=false;
      } finally { this.saving=false; }
    },

    openDetail(item) { this.detailItem={ ...item }; this.detailDialog=true; },

    openDelete(item) { this.current=item; this.deleteDialog=true; },
    async confirmDelete() {
      this.deleting=true;
      const title=this.current?.titre||this.current?.title;
      try {
        await $api(`/news/${this.current.id}`,{method:"DELETE"});
        this.items=this.items.filter(i=>i.id!==this.current.id);
        this.deleteDialog=false;
        this.showAlert("warning","Actualité supprimée",`L'actualité « ${title} » a été supprimée.`);
      } catch(err) {
        this.showAlert("warning","Impossible de supprimer",err?.data?.message||"Erreur");
      } finally { this.deleting=false; }
    },
  },
};
</script>

<style scoped>
.page-title   { font-size:22px;font-weight:700;color:#1a1a2e; }
.filter-label { font-size:13px;font-weight:700;color:#1a1a2e; }
.field-label  { font-size:12px;font-weight:600;color:#444;margin:0; }

/* Alert */
.alert-banner  { border-radius:10px;margin-bottom:16px; }
.alert-success { background:#F0FFF4;border:1px solid #B7E4C7; }
.alert-warning  { background:#FFF8F0;border:1px solid #F7C59F; }
.alert-inner   { display:flex;align-items:flex-start;gap:12px;padding:14px 16px; }
.alert-icon    { flex-shrink:0;margin-top:2px; }
.alert-success .alert-icon { color:#2E7D32; }
.alert-warning  .alert-icon { color:#E65100; }
.alert-body    { flex:1; }
.alert-title   { font-size:14px;font-weight:700; }
.alert-success .alert-title { color:#1B5E20; }
.alert-warning  .alert-title { color:#BF360C; }
.alert-sub     { font-size:12px;color:#555;margin-top:2px; }
.alert-close   { background:none;border:none;cursor:pointer;color:#999;display:inline-flex;align-items:center; }
.slide-down-enter-active,.slide-down-leave-active { transition:all 0.25s ease; }
.slide-down-enter-from,.slide-down-leave-to       { opacity:0;transform:translateY(-8px); }

/* Buttons */
.apply-btn { background:#E8A838 !important;color:#1a1a2e !important;border-radius:8px !important;font-weight:700;min-width:110px;height:38px; }
.add-btn   { display:inline-flex;align-items:center;padding:8px 18px;border-radius:8px;border:none;background:#E8A838;font-size:13px;font-weight:700;color:#1a1a2e;cursor:pointer;white-space:nowrap; }
.add-btn:hover { opacity:0.88; }

/* News cards grid */
.news-grid { display:grid;grid-template-columns:repeat(2,1fr);gap:18px; }
@media(max-width:700px){ .news-grid { grid-template-columns:1fr; } }

.news-card {
  border:1.5px solid #f0f0f0;border-radius:14px;overflow:hidden;
  display:flex;flex-direction:column;transition:box-shadow 0.15s;
}
.news-card:hover { box-shadow:0 4px 18px rgba(0,0,0,.08); }

/* Card image */
.card-img-wrap { position:relative;height:160px;background:#f5f5f5; }
.card-img      { width:100%;height:160px; }
.card-img-placeholder { width:100%;height:160px;display:flex;align-items:center;justify-content:center;background:#f5f5f5; }
.card-badge {
  position:absolute;top:10px;right:10px;
  padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;
}
.badge-publie    { background:#E8F5E9;color:#2E7D32; }
.badge-brouillon { background:#F5F5F5;color:#757575; }

/* Card body */
.card-body   { padding:14px;display:flex;flex-direction:column;gap:8px;flex:1; }
.card-title  { font-size:14px;font-weight:700;color:#1a1a2e;line-height:1.4;margin:0; }
.card-meta   { display:flex;align-items:flex-start;gap:6px; }

/* Author */
.card-author { display:flex;align-items:center;gap:10px;margin-top:4px; }
.author-avatar {
  width:34px;height:34px;border-radius:50%;background:#E8A838;
  display:flex;align-items:center;justify-content:center;
  font-size:14px;font-weight:700;color:#fff;flex-shrink:0;
}

/* Card action buttons */
.card-actions { display:flex;align-items:center;gap:8px;margin-top:6px; }
.ca-btn { display:inline-flex;align-items:center;justify-content:center;cursor:pointer;border:none;border-radius:8px;font-family:inherit;transition:opacity 0.15s; }
.ca-btn--icon  { width:34px;height:34px;border:1.5px solid #e8e8e8;background:#fff;color:#555; }
.ca-btn--del:hover  { background:#FDECEA;border-color:#ef9a9a;color:#e53935; }
.ca-btn--detail { height:34px;padding:0 12px;border:1.5px solid #E8A838;background:#fff;color:#E8A838;font-size:12px;font-weight:700;gap:5px; }
.ca-btn--detail:hover { background:#fff8ec; }
.ca-btn--edit  { height:34px;padding:0 14px;background:#E8A838;color:#fff;font-size:12px;font-weight:700;gap:5px; }
.ca-btn--edit:hover { opacity:0.88; }

/* Pagination */
.empty-state  { text-align:center;color:#9e9e9e;padding:40px;font-size:13px; }
.table-footer { display:flex;align-items:center;justify-content:space-between; }
.showing-txt  { font-size:12px;color:#9e9e9e; }
.pg-btn       { min-width:30px;height:30px;border-radius:6px;border:1.5px solid #e8e8e8;background:#fff;font-size:12px;font-weight:600;color:#555;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0 6px;transition:all 0.12s; }
.pg-btn:hover:not(:disabled) { border-color:#1a1a2e;color:#1a1a2e; }
.pg-btn:disabled { opacity:0.35;cursor:not-allowed; }
.pg-btn--active  { background:#1a1a2e;border-color:#1a1a2e;color:#fff; }

/* Modal */
.back-btn { width:32px;height:32px;border-radius:8px;border:1.5px solid #e0e0e0;background:#f9f9f9;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;color:#1a1a2e;flex-shrink:0; }
.back-btn:hover { background:#f0f0f0; }

.img-upload-zone { border:1.5px solid #e8e8e8;border-radius:10px;overflow:hidden;min-height:150px;cursor:pointer;display:flex;align-items:center;justify-content:center;background:#fafafa; }
.img-upload-zone:hover { border-color:#E8A838; }
.img-upload-empty { display:flex;align-items:center;justify-content:center;width:100%;min-height:150px; }
.img-hint { font-size:11px;color:#aaa; }
.img-btn { display:inline-flex;align-items:center;justify-content:center;padding:9px 20px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;border:none;transition:opacity 0.15s;flex:1; }
.img-btn--reset  { background:#4A3526;color:#fff; }
.img-btn--upload { background:#E8A838;color:#fff; }
.img-btn:hover { opacity:0.88; }

.form-row { display:grid;grid-template-columns:1fr 1fr;gap:14px; }
.custom-input {
  width:100%;height:38px;padding:0 12px;border:1.5px solid #e0e0e0;border-radius:8px;
  font-size:13px;color:#333;background:#fff;outline:none;font-family:inherit;box-sizing:border-box;
}
.custom-input:focus { border-color:#E8A838; }
.custom-input::placeholder { color:#aaa; }
.custom-textarea {
  width:100%;padding:10px 12px;border:1.5px solid #e0e0e0;border-radius:8px;
  font-size:13px;color:#333;background:#fff;outline:none;font-family:inherit;
  resize:vertical;box-sizing:border-box;
}
.custom-textarea:focus { border-color:#E8A838; }
.custom-textarea::placeholder { color:#aaa; }
.custom-select {
  width:100%;height:38px;padding:0 32px 0 12px;border:1.5px solid #e0e0e0;border-radius:8px;
  font-size:13px;color:#333;background:#fff;outline:none;font-family:inherit;
  appearance:none;-webkit-appearance:none;cursor:pointer;box-sizing:border-box;
}
.custom-select:focus { border-color:#E8A838; }
</style>
