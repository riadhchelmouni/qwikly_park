<template>
  <div>

    <!-- ══ TITRE ══ -->
    <div class="mb-5" v-if="!isComponent">
      <h1 class="page-title">Stock</h1>
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
          <AppSelect v-model="filters.park_id" :items="parkOptions" item-title="name" item-value="id"
            placeholder="Parc" clearable hide-details density="compact" style="min-width:140px;max-width:160px" />
          <AppSelect v-model="filters.category" :items="categoryOptions"
            item-title="name" item-value="name"
            placeholder="Catégories"
            clearable hide-details density="compact" style="min-width:140px;max-width:160px" />
          <AppSelect v-model="filters.fournisseur_id" :items="fournisseurOptions" item-title="name" item-value="id"
            placeholder="Fournisseurs" clearable hide-details density="compact" style="min-width:150px;max-width:170px" />
          <AppSelect v-model="filters.status" :items="statusOptions" item-title="label" item-value="value"
            placeholder="Statut" clearable hide-details density="compact" style="min-width:130px;max-width:150px" />
          <AppTextField v-model="filters.qty_min" placeholder="Quantité min" type="number"
            hide-details density="compact" style="min-width:120px;max-width:140px" />
          <AppTextField v-model="filters.qty_max" placeholder="Quantité max" type="number"
            hide-details density="compact" style="min-width:120px;max-width:140px" />
          <VBtn class="apply-btn" elevation="0" @click="applyFilters">Appliquer</VBtn>
        </div>
      </VCardText>
    </VCard>

    <!-- ══ BARRE SEARCH + ACTIONS ══ -->
    <VCard class="mb-4" elevation="0" border>
      <VCardText class="pa-4">
        <div class="d-flex align-center gap-3">
          <AppTextField v-model="search" placeholder="Rechercher..." prepend-inner-icon="tabler-search"
            hide-details clearable density="compact" class="flex-grow-1" />
          <button class="export-btn" @click="exportCSV">
            <VIcon icon="tabler-download" size="15" class="me-1" />Export
          </button>
          <VBtn color="#E8A838" style="border-radius:8px;font-weight:700;height:38px;color:#1a1a2e" @click="openCreate">
            <VIcon icon="tabler-plus" size="15" class="me-1" />Nouveau Produit
          </VBtn>
        </div>
      </VCardText>
    </VCard>

    <!-- ══ TABLE ══ -->
    <VCard elevation="0" border>
      <VCardText class="pa-0">
        <div v-if="isLoading" class="d-flex justify-center align-center py-12">
          <VProgressCircular indeterminate color="#E8A838" size="44" />
        </div>

        <template v-else>
          <div class="table-wrap">
            <table class="stock-table">
              <thead>
                <tr>
                  <th class="th-check"><input type="checkbox" :checked="allSelected" @change="toggleAll" /></th>
                  <th>NOM</th>
                  <th>IMAGE</th>
                  <th>CATÉGORIE</th>
                  <th>PARC</th>
                  <th>QTÉ</th>
                  <th>STATUT</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!paginatedItems.length">
                  <td colspan="8" class="empty-row">Aucun produit trouvé</td>
                </tr>
                <tr v-for="item in paginatedItems" :key="item.id" :class="{ 'tr-selected': selectedIds.includes(item.id) }">
                  <td class="td-check">
                    <input type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggleOne(item.id)" />
                  </td>
                  <td class="td-nom">
                    <div style="font-weight:600;color:#1a1a2e;font-size:13px">{{ item.nom || item.name || '—' }}</div>
                  </td>
                  <td class="td-img">
                    <div class="item-img-wrap">
                      <VImg v-if="item.image_url" :src="item.image_url" width="36" height="36" cover style="border-radius:6px" />
                      <div v-else class="img-placeholder"><VIcon icon="tabler-photo" size="18" color="#ccc" /></div>
                    </div>
                  </td>
                  <td class="td-cat">
                    <span v-if="item.category" style="background:#f0f4ff;color:#3b5bdb;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:600">
                      {{ item.category?.name || item.category }}
                    </span>
                    <span v-else style="color:#bbb">—</span>
                  </td>
                  <td class="td-parc" style="font-size:13px;color:#555">
                    {{ item.parks?.[0]?.name || item.park?.name || '—' }}
                  </td>
                  <td class="td-qty">
                    <span class="qty-badge" :class="(item.total_stock_quantity ?? item.quantity ?? 0) <= 0 ? 'qty-badge--zero' : item.stock?.[0]?.alert_threshold && (item.total_stock_quantity ?? item.quantity ?? 0) <= item.stock[0].alert_threshold ? 'qty-badge--low' : 'qty-badge--ok'">
                      {{ item.total_stock_quantity ?? item.quantity ?? 0 }}
                    </span>
                  </td>
                  <td class="td-status">
                    <span class="status-chip" :class="statusClass(item)">{{ statusLabel(item) }}</span>
                  </td>
                  <td class="td-actions">
                    <button class="act-btn act-edit"   @click="openEdit(item)"   title="Modifier"><VIcon icon="tabler-edit" size="15" /></button>
                    <button class="act-btn act-delete" @click="openDelete(item)" title="Supprimer"><VIcon icon="tabler-trash" size="15" /></button>
                    <button class="act-btn act-detail" @click="openDetail(item)" title="Détails"><VIcon icon="tabler-info-circle" size="15" /></button>
                    <button class="act-btn act-stock"  @click="openAjustement(item)" title="Ajuster le stock"><VIcon icon="tabler-stack-push" size="15" /></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="table-footer">
            <span class="showing-txt">Showing {{ showingFrom }} to {{ showingTo }} of {{ filteredItems.length }} entries</span>
            <div class="d-flex align-center gap-1">
              <button class="pg-btn" :disabled="page === 1" @click="page = 1">«</button>
              <button class="pg-btn" :disabled="page === 1" @click="page--">‹</button>
              <button v-for="p in visiblePages" :key="p" class="pg-btn" :class="p === page ? 'pg-btn--active' : ''" @click="page = p">{{ p }}</button>
              <button class="pg-btn" :disabled="page === totalPages" @click="page++">›</button>
              <button class="pg-btn" :disabled="page === totalPages" @click="page = totalPages">»</button>
            </div>
          </div>
        </template>
      </VCardText>
    </VCard>


    <!-- ══ DIALOG CHOIX : PRODUIT EXISTANT / NOUVEAU ══ -->
    <VDialog v-model="choiceDialog" max-width="440">
      <VCard style="border-radius:16px;overflow:hidden">
        <div class="modal-header px-6 pt-5 pb-3 d-flex align-center gap-3">
          <button class="back-btn" @click="choiceDialog=false">
            <VIcon icon="tabler-arrow-left" size="16" />
          </button>
          <span class="modal-title">Ajouter au stock</span>
        </div>
        <VCardText class="pa-6">
          <p style="font-size:13px;color:#666;margin-bottom:20px">
            Sélectionnez le type d'opération à effectuer :
          </p>
          <div class="d-flex flex-column gap-3">
            <button class="choice-card-btn" @click="openChoiceExisting">
              <div class="choice-card-icon" style="background:#E8F5E9">
                <VIcon icon="tabler-stack-push" size="22" color="#4CAF50" />
              </div>
              <div class="choice-card-content">
                <div class="choice-card-title">Produit existant</div>
                <div class="choice-card-desc">Ajouter de la quantité à un produit déjà en stock</div>
              </div>
              <VIcon icon="tabler-chevron-right" size="18" color="#ccc" />
            </button>
            <button class="choice-card-btn" @click="openChoiceNew">
              <div class="choice-card-icon" style="background:#FFF8E1">
                <VIcon icon="tabler-circle-plus" size="22" color="#E8A838" />
              </div>
              <div class="choice-card-content">
                <div class="choice-card-title">Nouveau produit</div>
                <div class="choice-card-desc">Créer un nouveau produit dans le catalogue</div>
              </div>
              <VIcon icon="tabler-chevron-right" size="18" color="#ccc" />
            </button>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- ══ MODAL AJOUTER QUANTITÉ — PRODUIT EXISTANT ══ -->
    <VDialog v-model="addQtyDialog" max-width="460" persistent>
      <VCard style="border-radius:16px;overflow:hidden">
        <div class="modal-header px-6 pt-5 pb-3 d-flex align-center gap-3">
          <button class="back-btn" @click="addQtyDialog=false; choiceDialog=true">
            <VIcon icon="tabler-arrow-left" size="16" />
          </button>
          <span class="modal-title">Ajouter quantité</span>
        </div>
        <VCardText class="px-6 py-5">
          <p class="field-label mb-1">
            Catégorie
            <span style="color:#9e9e9e;font-weight:400;font-size:11px;margin-left:4px">(optionnel)</span>
          </p>
          <AppSelect
            v-model="addQtyCategory"
            :items="categoryOptions"
            item-title="name"
            item-value="name"
            placeholder="Filtrer par catégorie..."
            hide-details density="compact" clearable
            class="mb-4"
            @update:model-value="addQtyItemId = null"
          />

          <p class="field-label mb-1">Produit <span style="color:#e53935">*</span></p>
          <AppSelect
            v-model="addQtyItemId"
            :items="filteredAddQtyItems"
            item-title="label"
            item-value="id"
            placeholder="Sélectionner un produit existant..."
            hide-details density="compact" clearable
            class="mb-4"
          />

          <template v-if="addQtySelectedItem">
            <div class="d-flex align-center gap-3 mb-5 pa-3" style="background:#f9f9f9;border-radius:10px">
              <div style="width:44px;height:44px;border-radius:8px;background:#e8e8e8;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">
                <VImg v-if="addQtySelectedItem.image" :src="addQtySelectedItem.image" width="44" height="44" cover />
                <VIcon v-else icon="tabler-box" size="22" color="#bbb" />
              </div>
              <div>
                <div style="font-weight:700;font-size:14px;color:#1a1a2e">
                  {{ addQtySelectedItem.nom || addQtySelectedItem.name }}
                </div>
                <div style="font-size:12px;color:#9e9e9e">
                  Stock actuel : <strong>{{ addQtySelectedItem.total_stock_quantity ?? addQtySelectedItem.quantity ?? 0 }}</strong> unités
                </div>
              </div>
            </div>

            <p class="field-label mb-1">Nouvelle quantité <span style="color:#e53935">*</span></p>
            <AppTextField v-model="addQtyQty" type="number" min="0" density="compact"
              placeholder="Ex: 50" hide-details class="mb-4" />

            <p class="field-label mb-1">
              Motif
              <span style="color:#9e9e9e;font-weight:400;font-size:11px;margin-left:4px">(optionnel)</span>
            </p>
            <AppTextField v-model="addQtyMotif" density="compact"
              placeholder="Ex: Réception commande #BC-00042" hide-details />
          </template>
        </VCardText>
        <div class="modal-footer">
          <button class="nav-btn nav-btn--prev" @click="addQtyDialog=false; choiceDialog=true">Annuler</button>
          <button
            class="nav-btn nav-btn--create"
            :disabled="!addQtyItemId || Number(addQtyQty) <= 0 || addQtySaving"
            @click="confirmAddQty"
          >
            <VProgressCircular v-if="addQtySaving" size="13" indeterminate color="#fff" class="me-1" />
            Confirmer
          </button>
        </div>
      </VCard>
    </VDialog>

    <!-- ══════════════════════════════════════
         MODAL CRÉER / MODIFIER — 3 ÉTAPES
    ══════════════════════════════════════ -->
    <VDialog v-model="formDialog" max-width="660" persistent scrollable>
      <VCard style="border-radius:16px;overflow:hidden">

        <!-- ── Header ── -->
        <div class="modal-header px-6 pt-5 pb-3 d-flex align-center gap-3">
          <button class="back-btn" @click="onModalBack">
            <VIcon icon="tabler-arrow-left" size="16" />
          </button>
          <span class="modal-title">{{ isEditing ? 'Modifier le produit' : 'Nouveau produit' }}</span>
        </div>

        <!-- ── Stepper bar ── -->
        <div class="stepper-bar px-6 pb-4">
          <div class="stepper-row">
            <!-- Step 1 -->
            <div class="step-item" :class="{ 'step-active': formStep === 1, 'step-done': formStep > 1 }">
              <div class="step-circle">
                <VIcon v-if="formStep > 1" icon="tabler-check" size="13" />
                <span v-else>1</span>
              </div>
              <span class="step-label">Informations principales</span>
            </div>
            <div class="step-line" :class="formStep > 1 ? 'step-line--done' : ''"></div>
            <!-- Step 2 -->
            <div class="step-item" :class="{ 'step-active': formStep === 2 }">
              <div class="step-circle"><span>2</span></div>
              <span class="step-label">Options de vente</span>
            </div>
          </div>
        </div>

        <VDivider />

        <!-- ─────────────────── ÉTAPE 1 ─────────────────── -->
        <VCardText v-if="formStep === 1" class="px-6 py-5" style="max-height:68vh;overflow-y:auto">
          <VForm ref="createProductForm1" v-if="formStep === 1">
            <!-- Image upload -->
            <p class="field-label mb-2">Image du produit</p>
            <div class="img-upload-zone" @click="$refs.imgInput.click()">
              <VImg v-if="form.imagePreview" :src="form.imagePreview" height="160" cover style="border-radius:10px;width:100%" />
              <div v-else class="img-upload-empty">
                <VIcon icon="tabler-photo" size="40" color="#d0d0d0" />
              </div>
            </div>
            <p class="img-hint mt-2 mb-3">Formats autorisés : JPG, GIF ou PNG. Taille maximale de 800 Ko</p>
            <input ref="imgInput" type="file" accept="image/*" class="d-none" @change="onImgChange" />
            <div class="d-flex gap-3 mb-5">
              <button class="img-btn img-btn--reset" @click="resetImage">
                <VIcon icon="tabler-refresh" size="14" class="me-1" />Réinitialiser
              </button>
              <button class="img-btn img-btn--upload" @click="$refs.imgInput.click()">
                <VIcon icon="tabler-upload" size="14" class="me-1" />Télécharger Une Nouvelle Photo
              </button>
            </div>

            <!-- Fields grid -->
            <VRow dense class="mb-1">
              <VCol cols="12">
                <p class="field-label mb-1">Nom <span style="color:#e53935">*</span></p>
                <AppTextField v-model="form.nom" placeholder="Entrer le nom complet du produit"
                  hide-details density="compact" :rules="[v=>!!v||'Requis']" />
              </VCol>
            </VRow>
            <VRow dense class="mt-3">
              <VCol cols="12" md="6">
                <p class="field-label mb-1">Parc(s) associé(s) <span style="color:#e53935">*</span></p>
                <AppSelect v-model="form.park_id" :items="parkOptions" item-title="name" item-value="id"
                  placeholder="Sélectionner un/des parc(s)" hide-details density="compact" clearable
                  :rules="[v=>!!v||'Requis']" />
              </VCol>
              <VCol cols="12" md="6">
                <p class="field-label mb-1">Prix unitaire (HT) <span style="color:#e53935">*</span></p>
                <div class="price-wrap">
                  <AppTextField v-model="form.prix_unitaire" placeholder="Entrer le prix unitaire du produit"
                    hide-details density="compact" type="number" :rules="[v=>!!v||'Requis']" />
                  <span class="price-suffix">€</span>
                </div>
              </VCol>
            </VRow>
            <VRow dense class="mt-3">
              <VCol cols="12" md="6">
                <p class="field-label mb-1">Catégorie <span style="color:#e53935">*</span></p>
                <AppSelect v-model="form.category" :items="categoryOptions"
                  item-title="name" item-value="id"
                  placeholder="Sélectionner une catégorie" hide-details density="compact"
                  :rules="[v=>!!v||'Requis']" />
              </VCol>
              <VCol cols="12" md="6">
                <p class="field-label mb-1">TVA (%) <span style="color:#e53935">*</span></p>
                <AppSelect v-model="form.tva" :items="tvaOptions" item-title="label" item-value="value"
                  placeholder="20%" hide-details density="compact" :rules="[v=>v!==null&&v!==undefined||'Requis']" />
              </VCol>
            </VRow>

            <!-- Seuils et alertes -->
            <div class="seuils-section mt-4">
              <p class="seuils-title mb-3">Seuils et alertes</p>
              <VRow dense>
                <VCol cols="12" md="6">
                  <p class="field-label mb-1">Quantité</p>
                  <AppTextField v-model="form.quantity"
                    :placeholder="isEditing && current ? `Actuel : ${current.total_stock_quantity ?? 0}` : 'Ex: 0'"
                    hide-details density="compact" type="number" />
                </VCol>
                <VCol cols="12" md="6">
                  <p class="field-label mb-1" style="color:#E8A838">Stock bas <span style="color:#e53935">*</span></p>
                  <AppTextField v-model="form.seuil_bas" placeholder="Entrer un nombre"
                    hide-details density="compact" type="number" class="input-orange"
                    :rules="[v=>v!==''&&v!==null||'Requis']" />
                </VCol>
              </VRow>
            </div>
          </VForm>
        </VCardText>

        <!-- ─────────────────── ÉTAPE 2 ─────────────────── -->
        <VCardText v-else-if="formStep === 2" class="px-6 py-5" style="max-height:68vh;overflow-y:auto">

          <!-- Options de vente -->
          <p class="section-title mb-4">Options de vente</p>
          <div class="options-grid mb-5">
            <div v-for="opt in venteOptions" :key="opt.key" class="option-row">
              <span class="option-label">{{ opt.label }}</span>
              <div class="toggle-wrap" :class="form.options[opt.key] ? 'toggle-on' : 'toggle-off'"
                @click="form.options[opt.key] = !form.options[opt.key]">
                <div class="toggle-thumb"></div>
              </div>
            </div>
          </div>

          <!-- TVA section — visible only when TVA Spécifique is ON -->
          <transition name="fade-down">
            <div v-if="form.options.tva_specifique">
              <p class="section-title mb-3">TVA</p>
              <div class="tva-rows">
            <div v-for="row in tvaRows" :key="row.key" class="tva-row">
              <span class="tva-label">{{ row.label }}</span>
              <span class="tva-pct">{{ row.pct }}</span>
              <div class="tva-input-wrap">
                <AppTextField v-model="form.tvaValues[row.key]" placeholder="0"
                  type="number" hide-details density="compact" class="tva-input" />
              </div>
              <span class="tva-symbol">%</span>
              <div class="tva-code-wrap">
                <AppTextField v-model="form.tvaCodes[row.key]" placeholder="Code comptable"
                  hide-details density="compact" class="tva-code" />
              </div>
            </div>
              </div><!-- /.tva-rows -->
            </div><!-- /v-if tva_specifique -->
          </transition>
        </VCardText>

        <VDivider />

        <!-- ── Footer navigation ── -->
        <div class="modal-footer">
          <button class="nav-btn nav-btn--prev" @click="prevStep">
            <VIcon icon="tabler-arrow-left" size="14" class="me-1" />Précédent
          </button>
          <button v-if="formStep < 2" class="nav-btn nav-btn--next" @click="nextStep">
            Suivant<VIcon icon="tabler-arrow-right" size="14" class="ms-1" />
          </button>
          <button v-else class="nav-btn nav-btn--create" :disabled="saving" @click="isEditing ? saveItem() : (confirmCreateDialog = true)">
            <VProgressCircular v-if="saving" size="13" indeterminate color="#fff" class="me-1" />
            {{ isEditing ? 'Enregistrer' : 'Créer' }}
          </button>
        </div>
      </VCard>
    </VDialog>


    <!-- ══ DIALOG CONFIRMATION CRÉER ══ -->
    <VDialog v-model="confirmCreateDialog" max-width="440">
      <VCard style="border-radius:16px">
        <VCardText class="pa-6">
          <div class="confirm-title mb-2">Créer une nouvelle clause ?</div>
          <p class="confirm-body">
            Êtes-vous sûr de vouloir créer une nouvelle clause ?<br>
            Les informations saisies seront enregistrées définitivement et le produit deviendra disponible
            dans la gestion de votre stock.
          </p>
        </VCardText>
        <div style="display:flex;gap:12px;padding:8px 24px 24px;justify-content:flex-end">
          <button @click="confirmCreateDialog = false" style="
            display:inline-flex;align-items:center;justify-content:center;
            padding:0 28px;height:42px;border-radius:8px;
            border:2px solid #e53935;background:#fff;
            color:#e53935;font-size:13px;font-weight:700;
            cursor:pointer;font-family:inherit;
          ">Annuler</button>
          <button @click="saveItem" :disabled="saving" style="
            display:inline-flex;align-items:center;justify-content:center;
            padding:0 28px;height:42px;border-radius:8px;
            border:none;background:#E8A838;
            color:#fff;font-size:13px;font-weight:700;
            cursor:pointer;font-family:inherit;opacity:1;
          ">
            <span v-if="saving" style="margin-right:6px">⏳</span>
            Confirmer La Création
          </button>
        </div>
      </VCard>
    </VDialog>


    <!-- ══ MODAL ÉDITION (réutilise même stepper) ══ -->
    <!-- already handled by formDialog + isEditing -->


    <!-- ══ MODAL DÉTAILS ══ -->
    <VDialog v-model="detailDialog" max-width="500">
      <VCard v-if="current" style="border-radius:16px;overflow:hidden;display:flex;flex-direction:column;max-height:90vh">

        <!-- Header — fixed -->
        <div style="display:flex;align-items:center;gap:10px;padding:16px 20px 12px;flex-shrink:0;border-bottom:1px solid #f0f0f0">
          <button class="back-btn" @click="detailDialog = false">
            <VIcon icon="tabler-arrow-left" size="16" />
          </button>
          <span style="font-size:16px;font-weight:700;color:#1a1a2e">Détails du produit</span>
        </div>

        <!-- Scrollable content -->
        <div style="overflow-y:auto;flex:1;padding:16px 20px 12px">
          <!-- Image -->
          <div style="border:1.5px solid #e8e8e8;border-radius:10px;overflow:hidden;height:140px;display:flex;align-items:center;justify-content:center;background:#fafafa;margin-bottom:16px">
            <VImg
              v-if="current.image || current.image_url || current.photo || current.category?.image_url"
              :src="getImageUrl(current.image || current.image_url || current.photo || current.category?.image_url)"
              height="140" cover style="width:100%"
            />
            <VIcon v-else icon="tabler-photo" size="40" color="#d0d0d0" />
          </div>

          <!-- Info rows -->
          <div class="dinfo-row">
            <span class="dinfo-lbl">Nom du produit</span>
            <span class="dinfo-val">{{ current.nom || current.name || '—' }}</span>
          </div>
          <div class="dinfo-row">
            <span class="dinfo-lbl">Catégorie</span>
            <span class="dinfo-val">
              {{
                current.category
                  ? (typeof current.category === 'object'
                      ? (current.category.name || current.category.nom || '—')
                      : current.category)
                  : '—'
              }}
            </span>
          </div>
          <div v-if="current.prix_unitaire != null || current.price != null" class="dinfo-row">
            <span class="dinfo-lbl">Prix unitaire</span>
            <span class="dinfo-val">
              {{ current.prix_unitaire != null ? current.prix_unitaire + ' €' : current.price + ' €' }}
            </span>
          </div>
          <div v-if="current.tva != null" class="dinfo-row">
            <span class="dinfo-lbl">TVA</span>
            <span class="dinfo-val">{{ current.tva }} %</span>
          </div>
          <div class="dinfo-row">
            <span class="dinfo-lbl">Fournisseur associé</span>
            <span class="dinfo-val">
              {{ current.fournisseur?.name || current.fournisseur?.nom || current.fournisseur_name || '—' }}
            </span>
          </div>
          <div class="dinfo-row">
            <span class="dinfo-lbl">Quantité disponible</span>
            <span class="dinfo-val">{{ current.total_stock_quantity ?? current.quantity ?? 0 }}</span>
          </div>
          <div v-if="current.seuil_bas != null" class="dinfo-row">
            <span class="dinfo-lbl">Seuil stock bas</span>
            <span class="dinfo-val">{{ current.seuil_bas }}</span>
          </div>
          <div v-if="current.seuil_rupture != null" class="dinfo-row">
            <span class="dinfo-lbl">Seuil rupture</span>
            <span class="dinfo-val">{{ current.seuil_rupture }}</span>
          </div>
          <div class="dinfo-row">
            <span class="dinfo-lbl">Statut</span>
            <span class="status-chip" :class="statusClass(current)">{{ statusLabel(current) }}</span>
          </div>
          <div v-if="current.park" class="dinfo-row" style="border-bottom:none">
            <span class="dinfo-lbl">Parc(s) associé(s)</span>
            <span class="dinfo-val">
              {{ current.parks?.[0]?.name || current.park?.name || '—' }}
            </span>
          </div>
        </div>

        <!-- Footer buttons — always visible -->
        <div style="display:flex;gap:12px;padding:12px 20px 18px;flex-shrink:0;border-top:1px solid #f0f0f0">
          <button
            style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;
                   height:42px;border-radius:8px;border:none;
                   background:#FDECEA;color:#e53935;font-size:13px;font-weight:700;
                   cursor:pointer;font-family:inherit"
            @click="openDelete(current); detailDialog = false"
          >
            <VIcon icon="tabler-trash" size="15" />
            Supprimer Le Produit
          </button>
          <button
            style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;
                   height:42px;border-radius:8px;border:none;
                   background:#E8A838;color:#fff;font-size:13px;font-weight:700;
                   cursor:pointer;font-family:inherit"
            @click="openEdit(current); detailDialog = false"
          >
            <VIcon icon="tabler-edit" size="15" />
            Modifier Le Produit
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
            Voulez-vous vraiment supprimer ce produit ?<br>
            Vous ne pourrez pas revenir aux données liées aux données sélectionnées après suppression.
          </p>
        </VCardText>
        <div style="display:flex;gap:12px;padding:8px 24px 24px;justify-content:flex-end">
          <button
            @click="deleteDialog = false"
            style="display:inline-flex;align-items:center;justify-content:center;
                   padding:0 28px;height:42px;border-radius:8px;
                   border:2px solid #e53935;background:#fff;
                   color:#e53935;font-size:13px;font-weight:700;
                   cursor:pointer;font-family:inherit"
          >Annuler</button>
          <button
            @click="confirmDelete"
            :disabled="deleting"
            style="display:inline-flex;align-items:center;justify-content:center;
                   padding:0 28px;height:42px;border-radius:8px;
                   border:none;background:#e53935;
                   color:#fff;font-size:13px;font-weight:700;
                   cursor:pointer;font-family:inherit"
          >
            <span v-if="deleting" style="margin-right:6px">⏳</span>
            Supprimer
          </button>
        </div>
      </VCard>
    </VDialog>

    <!-- ══ MODAL AJUSTEMENT RAPIDE STOCK ══ -->
    <VDialog v-model="ajustementDialog" max-width="420" persistent>
      <VCard v-if="ajustementItem" style="border-radius:16px;overflow:hidden">
        <div style="background:#1a1a2e;padding:16px 20px;display:flex;align-items:center;gap:10px">
          <button @click="ajustementDialog=false" style="background:none;border:none;cursor:pointer;color:#fff">
            <VIcon icon="tabler-arrow-left" size="18" />
          </button>
          <span style="color:#fff;font-weight:700;font-size:15px">Ajustement de stock</span>
        </div>
        <VCardText class="pa-5">
          <!-- Produit info -->
          <div class="d-flex align-center gap-3 mb-4 pa-3" style="background:#f9f9f9;border-radius:10px">
            <VImg v-if="ajustementItem.image" :src="ajustementItem.image" width="44" height="44" cover style="border-radius:8px;flex-shrink:0" />
            <div v-else style="width:44px;height:44px;border-radius:8px;background:#e0e0e0;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <VIcon icon="tabler-box" size="22" color="#bbb" />
            </div>
            <div>
              <div style="font-weight:700;font-size:14px;color:#1a1a2e">{{ ajustementItem.nom || ajustementItem.name }}</div>
              <div style="font-size:12px;color:#9e9e9e">Stock actuel : <strong>{{ ajustementItem.total_stock_quantity ?? ajustementItem.quantity ?? 0 }}</strong> unités</div>
            </div>
          </div>

          <!-- Type de mouvement -->
          <div style="font-size:12px;font-weight:600;color:#555;margin-bottom:8px">Type de mouvement</div>
          <div class="d-flex gap-2 mb-4">
            <button
              v-for="type in ajustementTypes" :key="type.value"
              @click="ajustementType = type.value"
              :style="`flex:1;height:40px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;
                       border:2px solid ${ajustementType===type.value ? type.color : '#e0e0e0'};
                       background:${ajustementType===type.value ? type.color : '#fff'};
                       color:${ajustementType===type.value ? '#fff' : '#555'};`"
            >
              <VIcon :icon="type.icon" size="15" class="me-1" />{{ type.label }}
            </button>
          </div>

          <!-- Quantité -->
          <div style="font-size:12px;font-weight:600;color:#555;margin-bottom:6px">Quantité</div>
          <VTextField v-model="ajustementQty" type="number" min="1" density="compact" variant="outlined"
            placeholder="Ex: 10" hide-details class="mb-3" />

          <!-- Motif -->
          <div style="font-size:12px;font-weight:600;color:#555;margin-bottom:6px">Motif (optionnel)</div>
          <VTextField v-model="ajustementMotif" density="compact" variant="outlined"
            placeholder="Ex: Réception commande #BC-00042" hide-details />

          <!-- Aperçu résultat -->
          <div class="mt-3 pa-3" style="background:#f0f0f0;border-radius:8px;text-align:center">
            <div style="font-size:12px;color:#777">Nouveau stock estimé</div>
            <div style="font-size:22px;font-weight:800;color:#1a1a2e">
              {{ calcNewQty }} unités
            </div>
          </div>
        </VCardText>
        <div style="padding:12px 20px 20px;display:flex;gap:10px">
          <button @click="ajustementDialog=false"
            style="flex:1;height:42px;border-radius:8px;border:2px solid #e0e0e0;background:#fff;color:#555;font-size:13px;font-weight:700;cursor:pointer">
            Annuler
          </button>
          <button @click="confirmAjustement" :disabled="ajustementSaving"
            style="flex:2;height:42px;border-radius:8px;border:none;background:#1a1a2e;color:#fff;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">
            <VProgressCircular v-if="ajustementSaving" size="14" indeterminate color="#fff" />
            <VIcon v-else icon="tabler-check" size="16" />
            Confirmer
          </button>
        </div>
      </VCard>
    </VDialog>

  </div>
</template>

<script>
import { $api } from "@/utils/api";

export default {
  props: { isComponent: { type: Boolean, default: false } },
  setup() { return {}; },

  data() {
    return {
      // ── Data ──
      items: [], isLoading: false,

      // ── Filters ──
      filters: { park_id: null, category: null, fournisseur_id: null, status: null, qty_min: "", qty_max: "" },
      appliedFilters: { park_id: null, category: null, fournisseur_id: null, status: null, qty_min: "", qty_max: "" },
      search: "",

      // ── Options ──
      parkOptions: [],
      fournisseurOptions: [],
      categoryOptions: [],
      statusOptions: [
        { label: "Disponible", value: "disponible" },
        { label: "Stock bas",  value: "stock_bas"  },
        { label: "Rupture",    value: "rupture"    },
      ],
      tvaOptions: [
        { label: "20%", value: 20 },
        { label: "10%", value: 10 },
        { label: "5.5%", value: 5.5 },
        { label: "0%", value: 0 },
      ],
      venteOptions: [
        { key: "vente_place",    label: "Vente sur place"    },
        { key: "vente_ligne",    label: "Vente en ligne"     },
        { key: "imprimer_cui",   label: "Imprimer en cuisine"},
        { key: "controle_acces", label: "Contrôle d'accès"  },
        { key: "vente_borne",    label: "Vente à borne"      },
        { key: "tva_specifique", label: "TVA Spécifique"     },
      ],
      tvaRows: [
        { key: "t20",  label: "TVA 20",  pct: "20%" },
        { key: "t10",  label: "TVA 10",  pct: "10%" },
        { key: "t55",  label: "TVA 5.5", pct: "5.5%"},
      ],

      // ── Pagination ──
      page: 1, perPage: 10,

      // ── Selection ──
      selectedIds: [],

      // ── Catalog ──
      selectedCatalogItem: null,
      catalogItems: [
        { id:1, name:"Coca Cola 33cl", category:"Boissons", brand:"Coca-Cola", price:1.5, tva:20 },
        { id:2, name:"Eau Cristaline 50cl", category:"Boissons", brand:"Cristaline", price:0.8, tva:5.5 },
        { id:3, name:"Chips Lay's Salées", category:"Alimentation", brand:"Lay's", price:1.2, tva:5.5 },
        { id:4, name:"M&M's 45g", category:"Alimentation", brand:"Mars", price:1.0, tva:20 },
      ],

      // ── Dialogs ──
      choiceDialog: false,
      addQtyDialog: false,
      addQtyItemId: null,
      addQtyCategory: null,
      addQtyQty: "",
      addQtyMotif: "",
      addQtySaving: false,
      formDialog: false, detailDialog: false, deleteDialog: false,
      ajustementDialog: false, ajustementSaving: false,
      ajustementItem: null, ajustementType: "ajustement", ajustementQty: "", ajustementMotif: "",
      ajustementTypes: [
        { value: "entree",     label: "Entrée",     icon: "tabler-arrow-bar-to-down", color: "#4CAF50" },
        { value: "sortie",     label: "Sortie",     icon: "tabler-arrow-bar-up",      color: "#e53935" },
        { value: "ajustement", label: "Correction", icon: "tabler-refresh",            color: "#E8A838" },
      ],
      confirmCreateDialog: false,
      isEditing: false, saving: false, deleting: false,
      formStep: 1,
      current: null,

      form: this.defaultForm(),

      // ── Alert ──
      alertVisible: false, alertType: "success", alertTitle: "", alertSub: "",
      alertTimer: null,
    };
  },

  computed: {
    filteredItems() {
      let r = [...this.items];
      const q = (this.search || "").toLowerCase();
      if (q.length >= 2) {
        r = r.filter(i =>
          (i.nom || i.name || "").toLowerCase().includes(q) ||
          (i.category?.name || i.category || "").toLowerCase().includes(q) ||
          (i.fournisseur?.name || i.fournisseur_name || "").toLowerCase().includes(q)
        );
      }
      if (this.appliedFilters.park_id)        r = r.filter(i => i.park_id === this.appliedFilters.park_id);
      if (this.appliedFilters.category)       r = r.filter(i => (i.category?.name || i.category) === this.appliedFilters.category);
      if (this.appliedFilters.fournisseur_id) r = r.filter(i => i.fournisseur_id === this.appliedFilters.fournisseur_id);
      if (this.appliedFilters.status)         r = r.filter(i => this.getStatus(i) === this.appliedFilters.status);
      if (this.appliedFilters.qty_min !== "") r = r.filter(i => (i.total_stock_quantity ?? i.quantity ?? 0) >= Number(this.appliedFilters.qty_min));
      if (this.appliedFilters.qty_max !== "") r = r.filter(i => (i.total_stock_quantity ?? i.quantity ?? 0) <= Number(this.appliedFilters.qty_max));
      return r;
    },
    totalPages()    { return Math.max(1, Math.ceil(this.filteredItems.length / this.perPage)); },
    paginatedItems(){ const s = (this.page - 1) * this.perPage; return this.filteredItems.slice(s, s + this.perPage); },
    showingFrom()   { return this.filteredItems.length === 0 ? 0 : (this.page - 1) * this.perPage + 1; },
    showingTo()     { return Math.min(this.page * this.perPage, this.filteredItems.length); },
    visiblePages() {
      const pages = [], total = this.totalPages;
      let start = Math.max(1, this.page - 2), end = Math.min(total, start + 4);
      if (end - start < 4) start = Math.max(1, end - 4);
      for (let i = start; i <= end; i++) pages.push(i);
      return pages;
    },
    allSelected() {
      return this.paginatedItems.length > 0 && this.paginatedItems.every(i => this.selectedIds.includes(i.id));
    },
    stockItemOptions() {
      return this.items.map(i => ({
        id: i.id,
        label: i.nom || i.name || `Produit #${i.id}`,
      }));
    },
    filteredAddQtyItems() {
      const list = this.addQtyCategory
        ? this.items.filter(i => (i.category?.name || i.category) === this.addQtyCategory)
        : this.items;
      return list.map(i => ({ id: i.id, label: i.nom || i.name || `Produit #${i.id}` }));
    },
    addQtySelectedItem() {
      if (!this.addQtyItemId) return null;
      return this.items.find(i => i.id === this.addQtyItemId) || null;
    },
    calcNewQty() {
      if (!this.ajustementItem) return 0;
      const current = Number(this.ajustementItem.total_stock_quantity ?? this.ajustementItem.quantity ?? 0);
      const qty = parseInt(this.ajustementQty) || 0;
      if (this.ajustementType === 'entree')     return current + qty;
      if (this.ajustementType === 'sortie')     return Math.max(0, current - qty);
      if (this.ajustementType === 'ajustement') return qty;
      return current;
    },
  },

  watch: {
    search() { this.page = 1; },
    filteredItems() { if (this.page > this.totalPages) this.page = 1; },
  },

  async mounted() {
    await Promise.all([this.loadItems(), this.loadParks(), this.loadFournisseurs(), this.loadCategories()]);
  },

  beforeUnmount() {
    clearTimeout(this.alertTimer);
    if (this.form.imagePreview && this.form.imagePreview.startsWith('blob:')) URL.revokeObjectURL(this.form.imagePreview);
    if (this.form.newFournisseur.logoPreview && this.form.newFournisseur.logoPreview.startsWith('blob:')) URL.revokeObjectURL(this.form.newFournisseur.logoPreview);
  },

  methods: {
    getImageUrl(path) {
      if (!path) return null;
      if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
      const base = (import.meta.env.VITE_BASE_URL || '').replace(/\/api.*$/, '');
      return base + (path.startsWith('/') ? path : '/' + path);
    },

    defaultForm() {
      return {
        nom: "", category: null, park_id: null,
        fournisseur_id: null, fournisseurMode: "none",
        quantity: "", seuil_bas: "", seuil_rupture: "",
        prix_unitaire: "", tva: 20, description: "",
        image: null, imagePreview: null,
        newFournisseur: {
          name: "", contactName: "", emails: [""], phones: [""],
          adresse: "", park_id: null, logo: null, logoPreview: null,
        },
        options: {
          vente_place: true, vente_ligne: true, imprimer_cui: true,
          controle_acces: false, vente_borne: true, tva_specifique: false,
        },
        tvaValues: { t20: "", t10: "", t55: "" },
        tvaCodes:  { t20: "", t10: "", t55: "" },
      };
    },

    // ── Helpers ──
    getStatus(item) {
      const qty = item.total_stock_quantity ?? item.quantity ?? 0, seuil = item.stock?.[0]?.alert_threshold ?? item.seuil_bas ?? 0;
      if (qty <= 0) return "rupture";
      if (seuil > 0 && qty <= seuil) return "stock_bas";
      return "disponible";
    },
    statusLabel(item) {
      const s = item.status || this.getStatus(item);
      return { disponible: "Disponible", stock_bas: "Stock bas", rupture: "Rupture" }[s] || s;
    },
    statusClass(item) {
      const s = item.status || this.getStatus(item);
      return { disponible: "chip-green", stock_bas: "chip-orange", rupture: "chip-red" }[s] || "";
    },
    truncate(str, n) { if (!str) return "—"; return str.length > n ? str.slice(0, n) + "..." : str; },

    showAlert(type, title, sub) {
      clearTimeout(this.alertTimer);
      this.alertType = type; this.alertTitle = title; this.alertSub = sub; this.alertVisible = true;
      this.alertTimer = setTimeout(() => { this.alertVisible = false; }, 5000);
    },

    toggleAll() {
      if (this.allSelected) this.selectedIds = this.selectedIds.filter(id => !this.paginatedItems.find(i => i.id === id));
      else this.paginatedItems.forEach(i => { if (!this.selectedIds.includes(i.id)) this.selectedIds.push(i.id); });
    },
    toggleOne(id) {
      const idx = this.selectedIds.indexOf(id);
      if (idx === -1) this.selectedIds.push(id); else this.selectedIds.splice(idx, 1);
    },

    onCatalogSelect(item) {
      if (!item) return;
      const found = this.catalogItems.find(i => i.id === item);
      if (found) {
        this.form.nom = found.name;
        this.form.category = found.category;
        this.form.prix_unitaire = found.price;
        this.form.tva = found.tva;
      }
    },

    // ── Loading ──
    async loadItems() {
      this.isLoading = true;
      try {
        const res = await $api("/products", { params: { per_page: 200 } });
        this.items = res.data || [];
      } catch { this.showAlert("warning", "Erreur de chargement", "Impossible de charger le stock"); }
      finally { this.isLoading = false; }
    },
    async loadParks() {
      try {
        const res = await $api("/parks", { params: { per_page: 200 } });
        this.parkOptions = (res.data || []).map(p => ({ id: p.id, name: p.name || `Parc ${p.id}` }));
      } catch { /* silent */ }
    },
    async loadFournisseurs() {
      try {
        const res = await $api("/suppliers", { params: { per_page: 200 } });
        const raw = res.data || res.suppliers || res || [];
        this.fournisseurOptions = (Array.isArray(raw) ? raw : []).map(f => ({
          id:   f.id,
          name: f.name || f.nom || f.company_name || `Fournisseur #${f.id}`,
        }));
      } catch { /* silent */ }
    },
    async loadCategories() {
      try {
        const res = await $api("/categories", { params: { per_page: 200 } });
        const raw = res.data || res.categories || res || [];
        this.categoryOptions = (Array.isArray(raw) ? raw : []).map(c => ({
          id:   c.id,
          name: c.name || c.nom || c.label || `Catégorie #${c.id}`,
        }));
      } catch { /* silent */ }
    },

    applyFilters() { this.appliedFilters = { ...this.filters }; this.page = 1; },

    exportCSV() {
      const headers = ["Nom","Catégorie","Parc","Fournisseur","Quantité","Statut"];
      const rows = this.filteredItems.map(i => [
        i.nom || i.name, i.category || "", i.parks?.[0]?.name || "",
        i.fournisseur?.name || "", i.total_stock_quantity ?? i.quantity ?? 0, this.statusLabel(i),
      ]);
      const csv = [headers, ...rows].map(r => r.join(";")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "stock.csv"; a.click();
      URL.revokeObjectURL(url);
    },

    // ── Modal navigation ──
    openCreate() {
      this.choiceDialog = true;
    },

    openChoiceNew() {
      this.choiceDialog = false;
      if (this.form.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.form.imagePreview);
      if (this.form.newFournisseur.logoPreview?.startsWith('blob:')) URL.revokeObjectURL(this.form.newFournisseur.logoPreview);
      this.isEditing = false;
      this.form = this.defaultForm();
      this.formStep = 1;
      this.formDialog = true;
    },

    openChoiceExisting() {
      this.choiceDialog    = false;
      this.addQtyItemId    = null;
      this.addQtyCategory  = null;
      this.addQtyQty       = "";
      this.addQtyMotif     = "";
      this.addQtyDialog    = true;
    },

    async confirmAddQty() {
      const newQty = parseInt(this.addQtyQty);
      if (!this.addQtyItemId || isNaN(newQty) || newQty < 0) {
        this.showAlert("warning", "Données invalides", "Veuillez sélectionner un produit et saisir une quantité valide.");
        return;
      }
      this.addQtySaving = true;
      const targetIdx = this.items.findIndex(i => i.id === this.addQtyItemId);
      try {
        const threshold = this.items[targetIdx]?.stock?.[0]?.alert_threshold ?? 0;
        await $api(`/products/${this.addQtyItemId}/stock`, {
          method: "PUT",
          body: { quantity: newQty, alert_threshold: threshold },
        });
        if (targetIdx !== -1) this.items[targetIdx].total_stock_quantity = newQty;
        this.addQtyDialog = false;
        this.showAlert("success", "Quantité mise à jour", `La quantité a été définie à ${newQty} unités.`);
      } catch {
        this.addQtyDialog = false;
        this.showAlert("warning", "Erreur", "Impossible de mettre à jour le stock.");
      } finally { this.addQtySaving = false; }
    },
    openEdit(item) {
      if (this.form.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.form.imagePreview);
      if (this.form.newFournisseur.logoPreview?.startsWith('blob:')) URL.revokeObjectURL(this.form.newFournisseur.logoPreview);
      this.isEditing = true; this.current = item;
      const so = item.sale_options || {};
      const tvaOpts = so.tva_options || [];
      const t20 = tvaOpts.find(t => Number(t.rate) === 20)   || {};
      const t10 = tvaOpts.find(t => Number(t.rate) === 10)   || {};
      const t55 = tvaOpts.find(t => Number(t.rate) === 5.5)  || {};
      this.form = {
        ...this.defaultForm(),
        nom:           item.name        || item.nom        || "",
        category:      item.category?.id ?? item.category  ?? null,
        park_id:       item.parks?.[0]?.id ?? item.park_id ?? item.park?.id ?? null,
        fournisseur_id: item.supplier?.id ?? item.fournisseur_id ?? null,
        quantity:      "",
        seuil_bas:     item.stock?.[0]?.alert_threshold ?? item.seuil_bas ?? "",
        prix_unitaire: item.price       ?? item.prix_unitaire ?? "",
        description:   item.description || "",
        imagePreview:  item.image_url   || item.image || null,
        tva:           item.tva         || 20,
        options: {
          vente_place:    so.onsite          ?? true,
          vente_ligne:    so.online          ?? true,
          imprimer_cui:   so.kitchen         ?? true,
          controle_acces: so.access_control  ?? false,
          vente_borne:    so.self_service     ?? true,
          tva_specifique: so.tva_specifics   ?? false,
        },
        tvaValues: {
          t20: t20.value ?? "",
          t10: t10.value ?? "",
          t55: t55.value ?? "",
        },
        tvaCodes: {
          t20: t20.code_accountant ?? "",
          t10: t10.code_accountant ?? "",
          t55: t55.code_accountant ?? "",
        },
      };
      this.formStep = 1; this.formDialog = true;
    },
    onModalBack() {
      if (this.formStep > 1) { this.formStep--; }
      else { this.formDialog = false; }
    },
    async nextStep() {
      if (this.formStep === 1 && this.$refs.createProductForm1) {
        const { valid } = await this.$refs.createProductForm1.validate();
        if (!valid) return;
      }
      if (this.formStep < 2) this.formStep++;
    },
    prevStep() { if (this.formStep > 1) this.formStep--; },

    onImgChange(e) {
      const file = e.target.files[0]; if (!file) return;
      if (this.form.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.form.imagePreview);
      this.form.image = file; this.form.imagePreview = URL.createObjectURL(file);
    },
    onLogoChange(e) {
      const file = e.target.files[0]; if (!file) return;
      if (this.form.newFournisseur.logoPreview?.startsWith('blob:')) URL.revokeObjectURL(this.form.newFournisseur.logoPreview);
      this.form.newFournisseur.logo = file;
      this.form.newFournisseur.logoPreview = URL.createObjectURL(file);
    },
    resetImage() {
      if (this.form.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.form.imagePreview);
      this.form.image = null; this.form.imagePreview = null;
      if (this.$refs.imgInput) this.$refs.imgInput.value = "";
    },

    async saveItem() {
      if (!this.form.nom) { this.showAlert("warning","Champ requis","Le nom du produit est obligatoire."); return; }
      if (!this.form.category) { this.showAlert("warning","Champ requis","Veuillez sélectionner une catégorie."); return; }
      if (!this.form.park_id) { this.showAlert("warning","Champ requis","Veuillez sélectionner un parc."); return; }
      if (!this.form.prix_unitaire) { this.showAlert("warning","Champ requis","Le prix est obligatoire."); return; }
      this.saving = true;
      const editing = this.isEditing;
      try {
        const fd = new FormData();
        fd.append("name",     this.form.nom);
        fd.append("price",    this.form.prix_unitaire);
        const parkId = this.form.park_id?.id ?? this.form.park_id;
        fd.append("parks[]",  parkId);
        const catId = this.form.category?.id ?? this.form.category;
        if (catId) fd.append("category_id", catId);
        if (this.form.fournisseur_id) fd.append("supplier_id", this.form.fournisseur_id);
        if (this.form.description)    fd.append("description",  this.form.description);
        if (this.form.image instanceof File) fd.append("image", this.form.image);

        let productId;
        if (editing) {
          fd.append("_method", "PUT");
          const res = await $api(`/products/${this.current.id}`, { method: "POST", body: fd });
          const updated = res.data || res.item || res;
          productId = this.current.id;
          const idx = this.items.findIndex(i => i.id === productId);
          if (idx !== -1) this.items.splice(idx, 1, updated);
        } else {
          const res = await $api("/products", { method: "POST", body: fd });
          const created = res.data || res.item || res;
          productId = created.id;
          this.items.unshift(created);
        }

        // Sauvegarder les options de vente
        const salePayload = {
          onsite:         !!this.form.options.vente_place,
          online:         !!this.form.options.vente_ligne,
          kitchen:        !!this.form.options.imprimer_cui,
          access_control: !!this.form.options.controle_acces,
          self_service:   !!this.form.options.vente_borne,
          tva_specifics:  !!this.form.options.tva_specifique,
        };
        if (this.form.options.tva_specifique) {
          salePayload.tva_options = [
            ...(this.form.tvaValues.t20 !== "" ? [{ rate: 20,  value: Number(this.form.tvaValues.t20), code_accountant: this.form.tvaCodes.t20 || "" }] : []),
            ...(this.form.tvaValues.t10 !== "" ? [{ rate: 10,  value: Number(this.form.tvaValues.t10), code_accountant: this.form.tvaCodes.t10 || "" }] : []),
            ...(this.form.tvaValues.t55 !== "" ? [{ rate: 5.5, value: Number(this.form.tvaValues.t55), code_accountant: this.form.tvaCodes.t55 || "" }] : []),
          ];
        }
        await $api(`/products/${productId}/sale-options`, {
          method: "POST",
          body: salePayload,
        });

        // Sauvegarder la quantité et le seuil dans stock
        if (productId && this.form.quantity !== "" && this.form.quantity !== null) {
          await $api(`/products/${productId}/stock`, {
            method: "PUT",
            body: {
              quantity:        Number(this.form.quantity)  || 0,
              alert_threshold: Number(this.form.seuil_bas) || 0,
            },
          });
          const idx = this.items.findIndex(i => i.id === productId);
          if (idx !== -1) {
            this.items[idx].total_stock_quantity = Number(this.form.quantity) || 0;
            if (this.items[idx].stock?.[0]) {
              this.items[idx].stock[0].alert_threshold = Number(this.form.seuil_bas) || 0;
            }
          }
        }

        this.formDialog = false; this.confirmCreateDialog = false;
        this.showAlert("success",
          editing ? "Le produit a été modifié" : "Le produit a été ajouté",
          `Le produit « ${this.form.nom} » a été ${editing ? 'modifié' : 'ajouté'}.`
        );
      } catch (err) {
        this.showAlert("warning", "Erreur", err?.data?.message || "Erreur lors de l'enregistrement");
        this.confirmCreateDialog = false;
      } finally { this.saving = false; }
    },

    async openDetail(item) {
      this.current = { ...item };
      this.detailDialog = true;
      try {
        const res  = await $api(`/products/${item.id}`);
        const full = res.data || res.product || res;
        this.current = { ...item, ...full };
      } catch { /* garder les données de la liste */ }
    },
    openDelete(item) { this.current = item; this.deleteDialog = true; },

    async confirmDelete() {
      this.deleting = true;
      const name = this.current?.nom || this.current?.name;
      try {
        await $api(`/products/${this.current.id}`, { method: "DELETE" });
        this.items = this.items.filter(i => i.id !== this.current.id);
        this.deleteDialog = false;
        this.showAlert("warning", "Le produit a été supprimé.", `Le produit « ${name} » a été supprimé.`);
      } catch (err) {
        this.showAlert("warning", "Impossible de supprimer", err?.data?.message || "Erreur");
      } finally { this.deleting = false; }
    },

    // ── Ajustement rapide stock ───────────────────────
    openAjustement(item) {
      this.ajustementItem  = item;
      this.ajustementType  = "ajustement";
      this.ajustementQty   = "";
      this.ajustementMotif = "";
      this.ajustementDialog = true;
    },

    async confirmAjustement() {
      const qty = parseInt(this.ajustementQty);
      if (!qty || qty <= 0) {
        this.showAlert("warning", "Quantité invalide", "Veuillez saisir une quantité supérieure à 0.");
        return;
      }
      this.ajustementSaving = true;
      try {
        const threshold = this.ajustementItem.stock?.[0]?.alert_threshold ?? 0;
        await $api(`/products/${this.ajustementItem.id}/stock`, {
          method: "PUT",
          body: { quantity: this.calcNewQty, alert_threshold: threshold },
        });
        const idx = this.items.findIndex(i => i.id === this.ajustementItem.id);
        if (idx !== -1) this.items[idx].total_stock_quantity = this.calcNewQty;
        this.ajustementDialog = false;
        this.showAlert("success", "Stock mis à jour",
          `Mouvement enregistré : ${this.ajustementType === 'entree' ? '+' : this.ajustementType === 'sortie' ? '-' : '='}${qty} unités`);
      } catch {
        this.ajustementDialog = false;
        this.showAlert("error", "Erreur", "Impossible de mettre à jour le stock.");
      } finally { this.ajustementSaving = false; }
    },
  },
};
</script>

<style scoped>
/* ─── Page ─── */
.page-title { font-size: 22px; font-weight: 700; color: #1a1a2e; }
.filter-label { font-size: 13px; font-weight: 700; color: #1a1a2e; }

/* ─── Alert banner ─── */
.alert-banner {
  border-radius: 10px; margin-bottom: 16px;
  padding: 0; overflow: hidden;
}
.alert-success { background: #F0FFF4; border: 1px solid #B7E4C7; }
.alert-warning  { background: #FFF8F0; border: 1px solid #F7C59F; }
.alert-inner {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px 16px;
}
.alert-icon { flex-shrink: 0; margin-top: 2px; }
.alert-success .alert-icon { color: #2E7D32; }
.alert-warning  .alert-icon { color: #E65100; }
.alert-body { flex: 1; }
.alert-title { font-size: 14px; font-weight: 700; }
.alert-success .alert-title { color: #1B5E20; }
.alert-warning  .alert-title { color: #BF360C; }
.alert-sub { font-size: 12px; color: #555; margin-top: 2px; }
.alert-close {
  background: none; border: none; cursor: pointer; color: #999;
  display: inline-flex; align-items: center; flex-shrink: 0;
}
.alert-close:hover { color: #555; }
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.25s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }

/* ─── Top buttons ─── */
.apply-btn { background: #E8A838 !important; color: #1a1a2e !important; border-radius: 8px !important; font-weight: 700; min-width: 110px; height: 38px; }
.export-btn {
  display: inline-flex; align-items: center; padding: 8px 18px;
  border-radius: 8px; border: 1.5px solid #1a1a2e; background: #fff;
  font-size: 13px; font-weight: 700; color: #1a1a2e; cursor: pointer; white-space: nowrap;
}
.export-btn:hover { background: #f5f5f5; }
.add-btn {
  display: inline-flex; align-items: center; padding: 8px 18px;
  border-radius: 8px; border: none; background: #1a1a2e;
  font-size: 13px; font-weight: 700; color: #fff; cursor: pointer; white-space: nowrap;
}
.add-btn:hover { opacity: 0.88; }

/* ─── Table ─── */
.table-wrap { overflow-x: auto; }
.stock-table { width: 100%; border-collapse: collapse; font-size: 13px; color: #333; }
.stock-table thead tr { background: #fafafa; border-bottom: 1.5px solid #f0f0f0; }
.stock-table th { padding: 11px 14px; text-align: left; font-size: 11px; font-weight: 700; color: #9e9e9e; text-transform: uppercase; white-space: nowrap; background: #fafafa; }
.stock-table tbody tr { border-bottom: 1px solid #f5f5f5; transition: background 0.12s; }
.stock-table tbody tr:hover { background: #fafafa; }
.tr-selected { background: #fffdf5 !important; }
.stock-table td { padding: 10px 14px; vertical-align: middle; }
.th-check, .td-check { width: 40px; text-align: center; }
.td-nom { font-weight: 600; color: #1a1a2e; max-width: 140px; }
.td-img { width: 60px; }
.td-qty { font-weight: 600; }
.qty-badge {
  display: inline-block; padding: 3px 10px;
  border-radius: 20px; font-size: 12px; font-weight: 700;
}
.qty-badge--ok   { background: #E8F5E9; color: #2E7D32; }
.qty-badge--low  { background: #FFF3E0; color: #E65100; }
.qty-badge--zero { background: #FDECEA; color: #c62828; }
.empty-row { text-align: center; color: #9e9e9e; padding: 40px; }
.item-img-wrap { width: 36px; height: 36px; border-radius: 6px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f5f5f5; }
.img-placeholder { width: 36px; height: 36px; border-radius: 6px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; }
.status-chip { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; white-space: nowrap; }
.chip-green  { background: #E8F5E9; color: #2E7D32; }
.chip-orange { background: #FFF3E0; color: #E65100; }
.chip-red    { background: #FDECEA; color: #c62828; }
.act-btn { width: 28px; height: 28px; border-radius: 6px; border: 1.5px solid #e8e8e8; background: #fff; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: #555; transition: all 0.12s; margin-right: 4px; }
.act-btn:hover { border-color: #bbb; background: #f5f5f5; }
.act-edit:hover   { color: #1a1a2e; border-color: #1a1a2e; }
.act-delete       { color: #e53935; }
.act-delete:hover { background: #FDECEA; border-color: #ef9a9a; }
.act-detail:hover { color: #E8A838; border-color: #E8A838; }
.act-stock        { color: #4CAF50; }
.act-stock:hover  { background: #E8F5E9; border-color: #4CAF50; }

/* ─── Pagination ─── */
.table-footer { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-top: 1px solid #f0f0f0; }
.showing-txt { font-size: 12px; color: #9e9e9e; }
.pg-btn { min-width: 30px; height: 30px; border-radius: 6px; border: 1.5px solid #e8e8e8; background: #fff; font-size: 12px; font-weight: 600; color: #555; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding: 0 6px; transition: all 0.12s; }
.pg-btn:hover:not(:disabled) { border-color: #1a1a2e; color: #1a1a2e; }
.pg-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.pg-btn--active { background: #1a1a2e; border-color: #1a1a2e; color: #fff; }

/* ─── Modal header ─── */
.modal-header { background: #fff; }
.modal-title { font-size: 16px; font-weight: 700; color: #1a1a2e; }
.back-btn { width: 32px; height: 32px; border-radius: 8px; border: 1.5px solid #e0e0e0; background: #f9f9f9; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: #1a1a2e; flex-shrink: 0; }
.back-btn:hover { background: #f0f0f0; }

/* ─── Stepper ─── */
.stepper-bar { background: #fff; padding-top: 4px; }
.stepper-row { display: flex; align-items: center; }
.step-item { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.step-circle {
  width: 26px; height: 26px; border-radius: 50%;
  background: #e0e0e0; color: #999; font-size: 12px; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center;
  transition: all 0.2s; flex-shrink: 0;
}
.step-active .step-circle { background: #1a1a2e; color: #fff; }
.step-done   .step-circle { background: #ccc; color: #fff; }
.step-label { font-size: 12px; font-weight: 600; color: #9e9e9e; white-space: nowrap; }
.step-active .step-label { color: #1a1a2e; }
.step-done   .step-label { color: #aaa; }
.step-line { flex: 1; height: 2px; background: #e8e8e8; margin: 0 10px; border-radius: 1px; }
.step-line--done { background: #c5c5c5; }

/* ─── Image upload ─── */
.img-upload-zone {
  border: 2px dashed #ddd; border-radius: 12px; overflow: hidden;
  min-height: 160px; cursor: pointer; display: flex; align-items: center;
  justify-content: center; transition: border-color 0.2s; background: #fafafa;
}
.img-upload-zone:hover { border-color: #E8A838; }
.img-upload-zone--sm   { min-height: 90px; }
.img-upload-empty      { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; min-height: 160px; }
.img-upload-empty--sm  { min-height: 90px; }
.img-hint { font-size: 11px; color: #aaa; }

/* ─── Image action buttons ─── */
.img-btn {
  display: inline-flex; align-items: center; padding: 9px 20px;
  border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; border: none;
  transition: opacity 0.15s; flex: 1; justify-content: center;
}
.img-btn--reset  { background: #4A3526; color: #fff; }
.img-btn--upload { background: #E8A838; color: #fff; }
.img-btn:hover { opacity: 0.88; }

/* ─── Field labels ─── */
.field-label { font-size: 12px; font-weight: 600; color: #444; margin: 0; }

/* ─── Price field ─── */
.price-wrap { position: relative; display: flex; align-items: center; }
.price-suffix {
  position: absolute; right: 12px; font-size: 14px; color: #888; font-weight: 600;
  pointer-events: none; z-index: 1;
}

/* ─── Seuils section ─── */
.seuils-section { background: #fafafa; border-radius: 10px; padding: 16px; }
.seuils-title { font-size: 13px; font-weight: 700; color: #1a1a2e; margin: 0; }

/* ─── Radio options ─── */
.radio-option {
  display: flex; align-items: center; gap: 10px; cursor: pointer;
  padding: 10px 14px; border-radius: 10px; border: 1.5px solid #e8e8e8;
  transition: border-color 0.15s;
}
.radio-option--active { border-color: #E8A838; background: #FFFBF0; }
.radio-input { accent-color: #E8A838; width: 16px; height: 16px; cursor: pointer; }
.radio-label { font-size: 13px; font-weight: 600; color: #333; }

/* ─── Add field button ─── */
.add-field-btn {
  display: inline-flex; align-items: center; background: none; border: none;
  color: #E8A838; font-size: 12px; font-weight: 700; cursor: pointer; padding: 0;
}
.add-field-btn:hover { opacity: 0.8; }

/* ─── Options de vente ─── */
.section-title { font-size: 14px; font-weight: 700; color: #1a1a2e; margin: 0; }
.options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; }
.option-row { display: flex; align-items: center; justify-content: space-between; }
.option-label { font-size: 13px; color: #333; }
.toggle-wrap {
  width: 42px; height: 23px; border-radius: 12px; position: relative;
  cursor: pointer; transition: background 0.2s; flex-shrink: 0;
}
.toggle-on  { background: #E8A838; }
.toggle-off { background: #d0d0d0; }
.toggle-thumb {
  position: absolute; width: 17px; height: 17px; border-radius: 50%; background: #fff;
  top: 3px; transition: left 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,.2);
}
.toggle-on  .toggle-thumb { left: 22px; }
.toggle-off .toggle-thumb { left: 3px; }

/* ─── TVA toggle transition ─── */
.fade-down-enter-active { transition: all 0.25s ease; }
.fade-down-leave-active { transition: all 0.2s ease; }
.fade-down-enter-from, .fade-down-leave-to { opacity: 0; transform: translateY(-8px); }

/* ─── TVA rows ─── */
.tva-rows { display: flex; flex-direction: column; gap: 10px; }
.tva-row { display: flex; align-items: center; gap: 10px; }
.tva-label { font-size: 13px; font-weight: 600; color: #333; min-width: 52px; }
.tva-pct   { font-size: 13px; color: #555; min-width: 38px; }
.tva-input-wrap { width: 70px; }
.tva-symbol { font-size: 14px; color: #888; }
.tva-code-wrap { flex: 1; }

/* ─── Modal footer ─── */
.modal-footer {
  display: flex; gap: 12px; padding: 16px 24px;
  border-top: 1px solid #f0f0f0; justify-content: space-between; align-items: center;
  background: #fff;
}
.nav-btn {
  display: inline-flex; align-items: center; padding: 10px 28px;
  border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; border: none;
  transition: opacity 0.15s;
}
.nav-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.nav-btn--prev   { background: #4A3526; color: #fff; }
.nav-btn--next   { background: #E8A838; color: #fff; }
.nav-btn--create { background: #1a1a2e; color: #fff; }
.nav-btn:hover:not(:disabled) { opacity: 0.88; }

/* ─── Confirm dialog ─── */
.confirm-title { font-size: 16px; font-weight: 700; color: #1a1a2e; }
.confirm-body  { font-size: 13px; color: #666; line-height: 1.6; }
.confirm-footer {
  display: flex; gap: 12px; padding: 0 24px 24px; justify-content: flex-end;
}
.cf-btn {
  display: inline-flex; align-items: center; padding: 10px 24px;
  border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; border: none;
  transition: opacity 0.15s;
}
.cf-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.cf-btn--cancel  { background: #f5f5f5; color: #555; border: 1.5px solid #e0e0e0; }
.cf-btn--cancel:hover { background: #eee; }
.cf-btn--confirm { background: #E8A838; color: #fff; }
.cf-btn--delete  { background: #e53935; color: #fff; }
.cf-btn--confirm:hover:not(:disabled), .cf-btn--delete:hover:not(:disabled) { opacity: 0.88; }

/* ─── Detail modal ─── */
.form-header { border-bottom: none; }
.detail-img-wrap { width: 80px; height: 80px; border-radius: 10px; overflow: hidden; flex-shrink: 0; background: #f5f5f5; display: flex; align-items: center; justify-content: center; }
.detail-img-placeholder { width: 80px; height: 80px; border-radius: 10px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; }
.detail-cat { font-size: 12px; color: #9e9e9e; }
.detail-row { display: flex; flex-direction: column; gap: 2px; padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
.detail-lbl { font-size: 11px; color: #aaa; text-transform: uppercase; font-weight: 600; }
.detail-val { font-size: 13px; color: #333; font-weight: 500; }

/* ─── Detail info rows ─── */
.dinfo-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 11px 0; border-bottom: 1px solid #f0f0f0;
}
.dinfo-lbl { font-size: 13px; color: #888; font-weight: 500; flex-shrink: 0; }
.dinfo-val { font-size: 13px; color: #1a1a2e; font-weight: 600; text-align: right; }

/* ─── Choice cards ─── */
.choice-card-btn {
  display: flex; align-items: center; gap: 14px;
  width: 100%; padding: 14px 16px;
  border: 1.5px solid #e8e8e8; border-radius: 12px;
  background: #fff; cursor: pointer;
  text-align: left; transition: border-color 0.15s, background 0.15s;
  font-family: inherit;
}
.choice-card-btn:hover { border-color: #E8A838; background: #fffdf7; }
.choice-card-icon {
  width: 44px; height: 44px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.choice-card-content { flex: 1; }
.choice-card-title { font-size: 14px; font-weight: 700; color: #1a1a2e; }
.choice-card-desc  { font-size: 12px; color: #9e9e9e; margin-top: 2px; }
</style>

<!-- Global override — not scoped so Vuetify can't win -->
<style>
.btn-gold-force,
.btn-gold-force.v-btn,
.btn-gold-force.v-btn--variant-flat {
  background-color: #E8A838 !important;
  color: #fff !important;
  border-radius: 8px !important;
  font-weight: 700 !important;
  font-size: 13px !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
  min-width: 0 !important;
  padding: 0 24px !important;
  height: 40px !important;
}
</style>
