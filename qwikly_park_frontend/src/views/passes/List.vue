<template>
  <div>

    <!-- ══ TITRE ══ -->
    <div class="mb-5">
      <h1 class="page-title">Gestion des passes</h1>
    </div>

    <!-- ══ ALERT BANNER ══ -->
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
          <AppSelect v-model="filters.type" :items="typeOptions" item-title="label" item-value="value"
            placeholder="type de pass" clearable hide-details density="compact" style="min-width:200px;max-width:280px" />
          <AppSelect v-model="filters.status" :items="statusOptions" item-title="label" item-value="value"
            placeholder="Statut" clearable hide-details density="compact" style="min-width:140px;max-width:180px" />
          <VBtn class="apply-btn" elevation="0" @click="applyFilters">Appliquer</VBtn>
        </div>
      </VCardText>
    </VCard>

    <!-- ══ BARRE SEARCH + ACTIONS ══ -->
    <VCard elevation="0" border>
      <VCardText class="pa-4">
        <div class="d-flex align-center gap-3 mb-4">
          <div class="d-flex align-center gap-2">
            <span style="font-size:13px;font-weight:600;color:#444">Filters</span>
            <AppSelect v-model="perPage" :items="[10,25,50,100]" hide-details density="compact"
              style="width:72px" @update:modelValue="page=1" />
          </div>
          <AppTextField v-model="search" placeholder="Rechercher par nom de pass, code, client..."
            prepend-inner-icon="tabler-search" hide-details clearable density="compact" class="flex-grow-1" />
          <button class="add-btn" @click="openCreate">
            <VIcon icon="tabler-plus" size="15" class="me-1" />Nouveau Pass
          </button>
        </div>

        <!-- TABLE -->
        <div v-if="isLoading" class="d-flex justify-center align-center py-12">
          <VProgressCircular indeterminate color="#E8A838" size="44" />
        </div>

        <template v-else>
          <div class="table-wrap">
            <table class="passes-table">
              <thead>
                <tr>
                  <th>NOM</th>
                  <th>DURÉE / VALIDITÉ</th>
                  <th>CONDITIONS</th>
                  <th>TARIF</th>
                  <th>STATUT</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!paginatedItems.length">
                  <td colspan="6" class="empty-row">Aucun pass trouvé</td>
                </tr>
                <tr v-for="item in paginatedItems" :key="item.id">
                  <td class="td-nom">{{ truncate(item.name || item.nom, 18) }}</td>
                  <td>{{ item.duration || item.duree || '—' }}</td>
                  <td>{{ truncate(item.category || item.categorie, 18) }}</td>
                  <td>{{ (item.price ?? item.prix) != null ? (item.price ?? item.prix) + ' €' : '—' }}</td>
                  <td><span class="status-chip" :class="statusClass(item)">{{ statusLabel(item) }}</span></td>
                  <td class="td-actions">
                    <button class="act-btn act-edit"   @click="openEdit(item)"   title="Modifier"><VIcon icon="tabler-edit" size="15" /></button>
                    <button class="act-btn act-delete" @click="openDelete(item)" title="Supprimer"><VIcon icon="tabler-trash" size="15" /></button>
                    <button class="act-btn act-detail" @click="openDetail(item)" title="Détails"><VIcon icon="tabler-info-circle" size="15" /></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="table-footer">
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
    <VDialog v-model="formDialog" max-width="600" persistent scrollable>
      <VCard style="border-radius:16px;overflow:hidden">

        <!-- Header -->
        <div style="display:flex;align-items:center;gap:10px;padding:18px 22px 14px;flex-shrink:0">
          <button class="back-btn" @click="formDialog=false">
            <VIcon icon="tabler-arrow-left" size="16" />
          </button>
          <span style="font-size:16px;font-weight:700;color:#1a1a2e">{{ isEditing ? 'Modifier le pass' : 'Nouveau pass' }}</span>
        </div>

        <VCardText style="padding:0 22px 8px;overflow-y:auto;max-height:72vh">

          <!-- Image upload -->
          <p class="field-label mb-2">Image de pass</p>
          <div class="img-upload-zone" @click="$refs.imgInput.click()">
            <VImg v-if="form.imagePreview" :src="form.imagePreview" height="130" cover style="width:100%;border-radius:10px" />
            <div v-else class="img-upload-empty">
              <VIcon icon="tabler-photo" size="36" color="#d0d0d0" />
            </div>
          </div>
          <p class="img-hint mt-1 mb-4">Formats autorisés : JPG, GIF ou PNG. Taille maximale de 800 Ko</p>
          <input ref="imgInput" type="file" accept="image/*" class="d-none" @change="onImgChange" />

          <!-- Franchise + Parc -->
          <div class="form-row mb-3">
            <div class="form-col">
              <p class="field-label mb-1">Franchise</p>
              <div class="custom-select-wrap">
                <select v-model="form.franchise_id" class="custom-select">
                  <option value="">Sélectionner la franchise</option>
                  <option v-for="f in franchiseOptions" :key="f.id" :value="f.id">{{ f.name }}</option>
                </select>
                <VIcon icon="tabler-chevron-down" size="16" class="select-arrow" />
              </div>
            </div>
            <div class="form-col">
              <p class="field-label mb-1">Parc</p>
              <div class="custom-select-wrap">
                <select v-model="form.park_id" class="custom-select">
                  <option value="">Tous Les Parcs</option>
                  <option v-for="p in parkOptions" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
                <VIcon icon="tabler-chevron-down" size="16" class="select-arrow" />
              </div>
            </div>
          </div>

          <!-- Nom + Prix -->
          <div class="form-row mb-3">
            <div class="form-col">
              <p class="field-label mb-1">Nom de pass</p>
              <input v-model="form.nom" placeholder="Entrer le nom de pass" class="custom-input" />
            </div>
            <div class="form-col">
              <p class="field-label mb-1">Prix</p>
              <div class="price-wrap">
                <input v-model="form.prix" placeholder="Entrer le tarif du pass" type="number" class="custom-input" />
                <span class="price-euro">€</span>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="mb-3">
            <p class="field-label mb-1">Description du pass</p>
            <textarea v-model="form.description" placeholder="Décrivez l'événement ici..." class="custom-textarea" rows="3"></textarea>
          </div>

          <!-- Type + Catégorie -->
          <div class="form-row mb-3">
            <div class="form-col">
              <p class="field-label mb-1">Type</p>
              <div class="custom-select-wrap">
                <select v-model="form.type" class="custom-select">
                  <option value="">Type</option>
                  <option v-for="t in typeOptions" :key="t.value" :value="t.value">{{ t.label }}</option>
                </select>
                <VIcon icon="tabler-chevron-down" size="16" class="select-arrow" />
              </div>
            </div>
            <div class="form-col">
              <p class="field-label mb-1">Catégorie</p>
              <div class="custom-select-wrap">
                <select v-model="form.categorie" class="custom-select">
                  <option value="">Sélectionner un/des parc(s)</option>
                  <option v-for="c in categorieOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
                </select>
                <VIcon icon="tabler-chevron-down" size="16" class="select-arrow" />
              </div>
            </div>
          </div>

          <!-- Durée + Validité -->
          <div class="form-row mb-3">
            <div class="form-col">
              <p class="field-label mb-1">Durée du pass</p>
              <div class="number-wrap">
                <input v-model="form.duree" placeholder="Entrer la durée du pass" type="number" class="custom-input" />
                <div class="number-arrows">
                  <button type="button" class="num-arrow" @click="form.duree = (+form.duree||0)+1">▲</button>
                  <button type="button" class="num-arrow" @click="form.duree = Math.max(0,(+form.duree||0)-1)">▼</button>
                </div>
              </div>
            </div>
            <div class="form-col">
              <p class="field-label mb-1">Validité du pass</p>
              <div class="date-wrap">
                <input v-model="form.validite" type="date" placeholder="Sélectionner une date" class="custom-input" />
                <VIcon icon="tabler-calendar" size="16" class="date-icon" />
              </div>
            </div>
          </div>

          <!-- Nombre + Max + Âge -->
          <div class="form-row-3 mb-4">
            <div>
              <p class="field-label mb-1">Nombre d'entrées</p>
              <input v-model="form.nb_entrees" placeholder="—" type="number" class="custom-input" />
            </div>
            <div>
              <p class="field-label mb-1">Maximum par utilisateur</p>
              <input v-model="form.max_user" placeholder="—" type="number" class="custom-input" />
            </div>
            <div>
              <p class="field-label mb-1">Âge</p>
              <input v-model="form.age_min" placeholder="—" type="number" class="custom-input" />
            </div>
          </div>
        </VCardText>

        <!-- Créer button -->
        <div style="padding:0 22px 20px;flex-shrink:0">
          <button @click="confirmDialog = true" :disabled="saving" style="
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
            {{ isEditing ? 'Modifier ce pass ?' : 'Créer un nouveau pass' }}
          </div>
          <p style="font-size:13px;color:#666;line-height:1.65;margin:0">
            Êtes-vous sûr de vouloir {{ isEditing ? 'modifier' : 'créer' }} un nouveau pass ?<br>
            Les informations saisies seront enregistrées et l'événement deviendra
            disponible sous la gestion par les administrateurs.
          </p>
        </VCardText>
        <div style="display:flex;gap:12px;padding:8px 24px 24px;justify-content:flex-end">
          <button @click="confirmDialog=false" style="
            display:inline-flex;align-items:center;justify-content:center;
            padding:0 28px;height:42px;border-radius:8px;
            border:2px solid #e53935;background:#fff;
            color:#e53935;font-size:13px;font-weight:700;
            cursor:pointer;font-family:inherit">Annuler</button>
          <button @click="saveItem" :disabled="saving" style="
            display:inline-flex;align-items:center;justify-content:center;
            padding:0 28px;height:42px;border-radius:8px;
            border:none;background:#E8A838;
            color:#fff;font-size:13px;font-weight:700;
            cursor:pointer;font-family:inherit">
            <span v-if="saving" style="margin-right:6px">⏳</span>
            {{ isEditing ? 'Confirmer la Modification' : 'Confirmer La Création' }}
          </button>
        </div>
      </VCard>
    </VDialog>


    <!-- ══ MODAL DÉTAILS ══ -->
    <VDialog v-model="detailDialog" max-width="560">
      <VCard v-if="current" style="border-radius:16px;overflow:hidden;display:flex;flex-direction:column;max-height:92vh">

        <!-- Header -->
        <div style="display:flex;align-items:center;gap:10px;padding:16px 22px 14px;flex-shrink:0">
          <button class="back-btn" @click="detailDialog=false"><VIcon icon="tabler-arrow-left" size="16" /></button>
          <span style="font-size:16px;font-weight:700;color:#1a1a2e">Détails du pass</span>
        </div>

        <!-- Usage summary -->
        <div style="display:flex;align-items:center;gap:14px;padding:0 22px 16px;flex-shrink:0">
          <div style="width:44px;height:44px;background:#FFF3E0;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <VIcon icon="tabler-ticket" size="22" color="#E8A838" />
          </div>
          <div>
            <div style="font-size:20px;font-weight:800;color:#1a1a2e">{{ current.utilisations ?? 0 }} Client</div>
            <div style="font-size:12px;color:#9e9e9e">Utilisation du pass</div>
          </div>
        </div>

        <VDivider />

        <!-- Scrollable rows -->
        <div style="overflow-y:auto;flex:1;padding:6px 22px 12px">

          <div class="dinfo-row">
            <span class="dinfo-lbl">Nom du pass</span>
            <span class="dinfo-val">{{ current.nom||current.name||'—' }}</span>
          </div>

          <!-- Description with Voir plus -->
          <div class="dinfo-row dinfo-row--col">
            <span class="dinfo-lbl">Description</span>
            <div style="margin-top:6px">
              <p style="font-size:13px;color:#333;line-height:1.6;margin:0">
                {{ descExpanded || !current.description || current.description.length <= 100
                   ? (current.description || '/')
                   : current.description.slice(0,100) + '...' }}
              </p>
              <button v-if="current.description && current.description.length > 100"
                @click="descExpanded = !descExpanded"
                style="background:none;border:none;color:#E8A838;font-size:12px;font-weight:700;cursor:pointer;padding:4px 0 0;display:flex;align-items:center;gap:4px">
                <VIcon :icon="descExpanded ? 'tabler-chevron-up' : 'tabler-chevron-down'" size="14" />
                {{ descExpanded ? 'Voir moins' : 'Voir plus' }}
              </button>
            </div>
          </div>

          <div class="dinfo-row">
            <span class="dinfo-lbl">Prix</span>
            <span class="dinfo-val">{{ (current.price ?? current.prix) != null ? (current.price ?? current.prix)+' €' : '—' }}</span>
          </div>
          <div class="dinfo-row">
            <span class="dinfo-lbl">Durée</span>
            <span class="dinfo-val">{{ (current.duration || current.duree) ? (current.duration || current.duree)+' jours' : '—' }}</span>
          </div>
          <div class="dinfo-row">
            <span class="dinfo-lbl">Validité</span>
            <span class="dinfo-val">{{ current.validite || '—' }}</span>
          </div>
          <div class="dinfo-row">
            <span class="dinfo-lbl">Type</span>
            <span class="dinfo-val">{{ current.type||'—' }}</span>
          </div>
          <div class="dinfo-row">
            <span class="dinfo-lbl">Catégorie</span>
            <span class="dinfo-val">{{ current.category || current.categorie || '—' }}</span>
          </div>
          <div class="dinfo-row">
            <span class="dinfo-lbl">Nombre d'entrées</span>
            <span class="dinfo-val">{{ current.max_entries || current.nb_entrees || '—' }}</span>
          </div>
          <div class="dinfo-row">
            <span class="dinfo-lbl">Max Par Utilisateur</span>
            <span class="dinfo-val">{{ current.max_per_user || current.max_user || '—' }}</span>
          </div>
          <div class="dinfo-row">
            <span class="dinfo-lbl">Âge de</span>
            <span class="dinfo-val">{{ (current.min_age || current.age_min) ? (current.min_age || current.age_min)+' à '+((current.max_age || current.age_max) || '∞') : '—' }}</span>
          </div>

          <!-- Parcs associés -->
          <div class="dinfo-row dinfo-row--col">
            <span class="dinfo-lbl">Parc(s) associés</span>
            <div style="margin-top:6px">
              <template v-if="current.parks && current.parks.length">
                <div v-for="p in current.parks" :key="p.id"
                  style="font-size:13px;color:#333;padding:2px 0">
                  • {{ p.name||p.localisation||p.numero }}
                </div>
              </template>
              <div v-else-if="current.park_id" style="font-size:13px;color:#333">
                • {{ parkName(current.park_id) }}
              </div>
              <div v-else style="font-size:13px;color:#aaa">—</div>
            </div>
          </div>

          <div class="dinfo-row">
            <span class="dinfo-lbl">Statut</span>
            <span class="status-chip" :class="statusClass(current)">{{ statusLabel(current) }}</span>
          </div>
          <div class="dinfo-row" style="border-bottom:none">
            <span class="dinfo-lbl">Notes</span>
            <span class="dinfo-val">{{ current.notes||'/' }}</span>
          </div>
        </div>

        <!-- 3 action buttons -->
        <div style="display:flex;gap:10px;padding:12px 22px 18px;flex-shrink:0;border-top:1px solid #f0f0f0">
          <button @click="openDelete(current);detailDialog=false" style="
            flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;
            height:42px;border-radius:8px;border:none;
            background:#FDECEA;color:#e53935;font-size:12px;font-weight:700;
            cursor:pointer;font-family:inherit">
            <VIcon icon="tabler-trash" size="14" />Supprimer Le Pass
          </button>
          <button @click="suspendPass(current)" style="
            flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;
            height:42px;border-radius:8px;border:none;
            background:#FDECEA;color:#e53935;font-size:12px;font-weight:700;
            cursor:pointer;font-family:inherit">
            <VIcon icon="tabler-player-pause" size="14" />Suspendre Le Pass
          </button>
          <button @click="openEdit(current);detailDialog=false" style="
            flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;
            height:42px;border-radius:8px;border:none;
            background:#E8A838;color:#fff;font-size:12px;font-weight:700;
            cursor:pointer;font-family:inherit">
            <VIcon icon="tabler-edit" size="14" />Modifier Le Pass
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
            Voulez-vous vraiment supprimer <strong>{{ current?.nom||current?.name }}</strong> ?<br>
            Cette action est irréversible.
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

  </div>
</template>

<script>
import { $api } from "@/utils/api";

export default {
  setup() { return {}; },

  data() {
    return {
      items: [], isLoading: false,

      filters: { type: null, status: null },
      appliedFilters: { type: null, status: null },
      search: "",
      page: 1, perPage: 10,

      parkOptions: [],
      franchiseOptions: [],

      typeOptions: [
        { label: "Standard",  value: "standard"  },
        { label: "VIP",       value: "vip"        },
        { label: "Group",     value: "group"      },
        { label: "Gift-Card", value: "gift_card"  },
      ],
      categorieOptions: [
        { label: "Enfants",  value: "kids"    },
        { label: "Adultes",  value: "adults"  },
        { label: "Famille",  value: "family"  },
        { label: "Groupes",  value: "groups"  },
      ],
      statusOptions: [
        { label: "Actif",   value: "actif"   },
        { label: "Expiré",  value: "expire"  },
        { label: "Inactif", value: "inactif" },
      ],

      formDialog: false, detailDialog: false, deleteDialog: false, confirmDialog: false,
      isEditing: false, saving: false, deleting: false,
      current: null,
      form: this.defaultForm(),

      alertVisible: false, alertType: "success", alertTitle: "", alertSub: "",
      alertTimer: null,
      descExpanded: false,
    };
  },

  computed: {
    filteredItems() {
      let r = [...this.items];
      const q = (this.search || "").toLowerCase();
      if (q.length >= 2) r = r.filter(i => (i.nom||i.name||"").toLowerCase().includes(q) || (i.code||"").toLowerCase().includes(q));
      if (this.appliedFilters.type)   r = r.filter(i => i.type === this.appliedFilters.type);
      if (this.appliedFilters.status) r = r.filter(i => i.status === this.appliedFilters.status);
      return r;
    },
    totalPages()    { return Math.max(1, Math.ceil(this.filteredItems.length / this.perPage)); },
    paginatedItems(){ const s=(this.page-1)*this.perPage; return this.filteredItems.slice(s,s+this.perPage); },
    showingFrom()   { return this.filteredItems.length===0 ? 0 : (this.page-1)*this.perPage+1; },
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
    await Promise.all([this.loadItems(), this.loadParks(), this.loadFranchises()]);
  },

  beforeUnmount() {
    clearTimeout(this.alertTimer);
    if (this.form.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.form.imagePreview);
  },

  methods: {
    defaultForm() {
      return {
        nom:"", prix:"", description:"", type:"", categorie:"",
        duree:"", validite:"", nb_entrees:"", max_user:"", age_min:"",
        franchise_id:"", park_id:"",
        image: null, imagePreview: null,
      };
    },

    statusLabel(item) { return {actif:"Actif",expire:"Expiré",inactif:"Inactif"}[item.status]||item.status||"—"; },
    statusClass(item) { return {actif:"chip-green",expire:"chip-red",inactif:"chip-gray"}[item.status]||"chip-gray"; },
    truncate(str,n)   { if(!str) return "—"; return str.length>n?str.slice(0,n)+"...":str; },

    showAlert(type,title,sub) {
      clearTimeout(this.alertTimer);
      this.alertType=type;this.alertTitle=title;this.alertSub=sub;this.alertVisible=true;
      this.alertTimer=setTimeout(()=>{this.alertVisible=false;},5000);
    },
    applyFilters() { this.appliedFilters={...this.filters}; this.page=1; },

    onImgChange(e) {
      const file = e.target.files[0]; if (!file) return;
      if (this.form.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.form.imagePreview);
      this.form.image = file; this.form.imagePreview = URL.createObjectURL(file);
    },

    async loadItems() {
      this.isLoading=true;
      try {
        const res=await $api("/passes",{params:{per_page:200}});
        this.items=(res.data||[]).map(i=>({...i,status:this.normalizePassStatus(i.status)}));
      } catch { this.showAlert("warning","Erreur de chargement","Impossible de charger les passes"); }
      finally { this.isLoading=false; }
    },
    async loadParks() {
      try {
        const res=await $api("/parks",{params:{per_page:200}});
        this.parkOptions=(res.data||[]).map(p=>({id:p.id,name:p.name||p.localisation||p.numero||`Parc ${p.id}`}));
      } catch {}
    },
    async loadFranchises() {
      try {
        const res=await $api("/franchises",{params:{per_page:200}});
        this.franchiseOptions=(res.data||[]).map(f=>({id:f.id,name:f.name||f.nom}));
      } catch {}
    },

    openCreate() {
      if (this.form.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.form.imagePreview);
      this.isEditing=false; this.form=this.defaultForm(); this.formDialog=true;
    },
    openEdit(item) {
      if (this.form.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.form.imagePreview);
      this.isEditing=true; this.current=item;
      const firstPark = item.parks?.[0]?.id || item.park_id || "";
      this.form={
        nom:         item.name         || item.nom         || "",
        prix:        item.price        || item.prix        || "",
        description: item.description  || "",
        type:        item.type         || "",
        categorie:   item.category     || item.categorie   || "",
        duree:       item.duration     || item.duree       || "",
        validite:    item.valid_until  || item.validite    || item.expires_at?.split('T')[0] || "",
        nb_entrees:  item.max_entries  || item.nb_entrees  || "",
        max_user:    item.max_per_user || item.max_user    || "",
        age_min:     item.min_age      || item.age_min     || "",
        franchise_id:item.franchise_id || item.franchise?.id || "",
        park_id:     firstPark,
        image:null, imagePreview: item.image_url || item.image || null,
      };
      this.formDialog=true;
    },

    async saveItem() {
      if (!this.form.park_id) { this.showAlert("warning","Champ requis","Veuillez sélectionner un parc."); return; }
      this.saving=true;
      try {
        const fd=new FormData();
        // Map frontend field names to backend expected names
        if (this.form.nom)          fd.append("name",         this.form.nom);
        if (this.form.prix)         fd.append("price",        this.form.prix);
        if (this.form.description)  fd.append("description",  this.form.description);
        if (this.form.type)         fd.append("type",         this.form.type);
        if (this.form.categorie)    fd.append("category",     this.form.categorie);
        if (this.form.duree)        fd.append("duration",     this.form.duree);
        if (this.form.validite)     fd.append("valid_until",  this.form.validite);
        if (this.form.nb_entrees)   fd.append("max_entries",  this.form.nb_entrees);
        if (this.form.max_user)     fd.append("max_per_user", this.form.max_user);
        if (this.form.age_min)      fd.append("min_age",      this.form.age_min);
        if (this.form.franchise_id) fd.append("franchise_id", this.form.franchise_id);
        fd.append("parks[0]", this.form.park_id);
        if (this.form.image instanceof File) fd.append("image", this.form.image);

        let res;
        if(this.isEditing) {
          fd.append("_method","PUT");
          res=await $api(`/passes/${this.current.id}`,{method:"POST",body:fd});
          const updated={...(res.data||res.item||res)};
          updated.status=this.normalizePassStatus(updated.status);
          const idx=this.items.findIndex(i=>i.id===this.current.id);
          if(idx!==-1) this.items.splice(idx,1,updated);
          this.showAlert("success","Pass modifié",`Le pass « ${this.form.nom} » a été modifié.`);
        } else {
          res=await $api("/passes",{method:"POST",body:fd});
          const newItem={...(res.data||res.item||res)};
          newItem.status=this.normalizePassStatus(newItem.status);
          this.items.unshift(newItem);
          this.showAlert("success","Un pass a été ajouté.",`Le pass « ${this.form.nom} » a été ajouté.`);
        }
        this.formDialog=false; this.confirmDialog=false;
      } catch(err) {
        this.showAlert("warning","Erreur",err?.data?.message||"Erreur lors de l'enregistrement");
        this.confirmDialog=false;
      } finally { this.saving=false; }
    },

    openDetail(item) { this.current=item; this.descExpanded=false; this.detailDialog=true; },
    parkName(id) { const p=this.parkOptions.find(p=>p.id===id); return p?p.name:`Parc ${id}`; },
    normalizePassStatus(s) {
      if (!s) return s;
      const map = { active:"actif", inactive:"inactif", inactif:"inactif", expired:"expire", suspended:"inactif" };
      return map[s.toLowerCase()] || s;
    },

    async suspendPass(item) {
      this.detailDialog=false;
      try {
        const res     = await $api(`/passes/${item.id}/change-status`,{method:"PATCH"});
        const updated = res.data || res;
        // Normalize API status (EN) to display status (FR)
        if (updated.status) updated.status = this.normalizePassStatus(updated.status);
        const idx = this.items.findIndex(i=>i.id===item.id);
        if (idx!==-1) this.items.splice(idx, 1, { ...this.items[idx], ...updated });
        const newStatus = updated.status === "actif" ? "activé" : "suspendu";
        this.showAlert("success","Statut modifié",`Le pass « ${item.name||item.nom} » a été ${newStatus}.`);
      } catch(err) {
        this.showAlert("warning","Erreur",err?.data?.message||"Impossible de changer le statut.");
      }
    },
    openDelete(item) { this.current=item; this.deleteDialog=true; },

    async confirmDelete() {
      this.deleting=true;
      const name=this.current?.nom||this.current?.name;
      try {
        await $api(`/passes/${this.current.id}`,{method:"DELETE"});
        this.items=this.items.filter(i=>i.id!==this.current.id);
        this.deleteDialog=false;
        this.showAlert("warning","Pass supprimé",`Le pass « ${name} » a été supprimé.`);
      } catch(err) {
        this.showAlert("warning","Impossible de supprimer",err?.data?.message||"Erreur");
      } finally { this.deleting=false; }
    },
  },
};
</script>

<style scoped>
.page-title  { font-size:22px;font-weight:700;color:#1a1a2e; }
.filter-label{ font-size:13px;font-weight:700;color:#1a1a2e; }
.field-label { font-size:12px;font-weight:600;color:#444;margin:0; }
.req         { color:#e53935;font-weight:700; }

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

/* Top buttons */
.apply-btn { background:#E8A838 !important;color:#1a1a2e !important;border-radius:8px !important;font-weight:700;min-width:110px;height:38px; }
.add-btn   { display:inline-flex;align-items:center;padding:8px 18px;border-radius:8px;border:none;background:#E8A838;font-size:13px;font-weight:700;color:#1a1a2e;cursor:pointer;white-space:nowrap; }
.add-btn:hover { opacity:0.88; }

/* Table */
.table-wrap  { overflow-x:auto; }
.passes-table{ width:100%;border-collapse:collapse;font-size:13px;color:#333; }
.passes-table thead tr { background:#fafafa;border-bottom:1.5px solid #f0f0f0; }
.passes-table th  { padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#9e9e9e;text-transform:uppercase;white-space:nowrap; }
.passes-table tbody tr { border-bottom:1px solid #f5f5f5;transition:background 0.12s; }
.passes-table tbody tr:hover { background:#fafafa; }
.passes-table td  { padding:10px 14px;vertical-align:middle; }
.td-nom      { font-weight:600;color:#1a1a2e; }
.empty-row   { text-align:center;color:#9e9e9e;padding:40px; }
.status-chip { display:inline-block;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap; }
.chip-green  { background:#E8F5E9;color:#2E7D32; }
.chip-red    { background:#FDECEA;color:#c62828; }
.chip-gray   { background:#f5f5f5;color:#757575; }
.act-btn     { width:28px;height:28px;border-radius:6px;border:1.5px solid #e8e8e8;background:#fff;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;color:#555;transition:all 0.12s;margin-right:4px; }
.act-btn:hover       { border-color:#bbb;background:#f5f5f5; }
.act-edit:hover      { color:#1a1a2e;border-color:#1a1a2e; }
.act-delete          { color:#e53935; }
.act-delete:hover    { background:#FDECEA;border-color:#ef9a9a; }
.act-detail:hover    { color:#E8A838;border-color:#E8A838; }
.table-footer        { display:flex;align-items:center;justify-content:space-between;padding:14px 0 4px; }
.showing-txt         { font-size:12px;color:#9e9e9e; }
.pg-btn              { min-width:30px;height:30px;border-radius:6px;border:1.5px solid #e8e8e8;background:#fff;font-size:12px;font-weight:600;color:#555;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0 6px;transition:all 0.12s; }
.pg-btn:hover:not(:disabled) { border-color:#1a1a2e;color:#1a1a2e; }
.pg-btn:disabled     { opacity:0.35;cursor:not-allowed; }
.pg-btn--active      { background:#1a1a2e;border-color:#1a1a2e;color:#fff; }

/* Modal form */
.back-btn { width:32px;height:32px;border-radius:8px;border:1.5px solid #e0e0e0;background:#f9f9f9;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;color:#1a1a2e;flex-shrink:0; }
.back-btn:hover { background:#f0f0f0; }

/* Image zone */
.img-upload-zone { border:1.5px solid #e8e8e8;border-radius:10px;overflow:hidden;min-height:130px;cursor:pointer;display:flex;align-items:center;justify-content:center;background:#fafafa; }
.img-upload-zone:hover { border-color:#E8A838; }
.img-upload-empty { display:flex;align-items:center;justify-content:center;width:100%;min-height:130px; }
.img-hint { font-size:11px;color:#aaa; }

/* Form grid */
.form-row   { display:grid;grid-template-columns:1fr 1fr;gap:14px; }
.form-row-3 { display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px; }

/* Custom inputs */
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

/* Custom select */
.custom-select-wrap { position:relative; }
.custom-select {
  width:100%;height:38px;padding:0 36px 0 12px;border:1.5px solid #e0e0e0;border-radius:8px;
  font-size:13px;color:#333;background:#fff;outline:none;font-family:inherit;
  appearance:none;-webkit-appearance:none;cursor:pointer;box-sizing:border-box;
}
.custom-select:focus { border-color:#E8A838; }
.select-arrow { position:absolute;right:10px;top:50%;transform:translateY(-50%);pointer-events:none;color:#888; }

/* Price field */
.price-wrap  { position:relative; }
.price-euro  { position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:14px;color:#888;font-weight:600;pointer-events:none; }

/* Number field */
.number-wrap { position:relative;display:flex;align-items:center; }
.number-arrows { position:absolute;right:4px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:1px; }
.num-arrow { background:none;border:none;cursor:pointer;padding:0;font-size:8px;color:#999;line-height:1; }
.num-arrow:hover { color:#1a1a2e; }

/* Date field */
.date-wrap  { position:relative; }
.date-icon  { position:absolute;right:10px;top:50%;transform:translateY(-50%);pointer-events:none;color:#888; }

/* Detail rows */
.dinfo-row { display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid #f0f0f0; }
.dinfo-row--col { flex-direction:column;align-items:flex-start; }
.dinfo-lbl { font-size:13px;color:#888;font-weight:500;flex-shrink:0; }
.dinfo-val { font-size:13px;color:#1a1a2e;font-weight:600;text-align:right; }
</style>
