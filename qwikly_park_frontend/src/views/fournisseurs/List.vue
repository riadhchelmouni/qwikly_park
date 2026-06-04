<template>
  <div>

    <!-- ══ PAGE TITLE ══ -->
    <div class="mb-5">
      <h1 class="page-title">Gestion des Commandes Fournisseur</h1>
    </div>

    <!-- ══ ALERT ══ -->
    <transition name="slide-down">
      <div v-if="alertVisible" class="f-alert-banner" :class="alertType==='success'?'f-alert-success':'f-alert-warning'">
        <div class="f-alert-inner">
          <VIcon :icon="alertType==='success'?'tabler-circle-check':'tabler-alert-triangle'" size="20" class="f-alert-icon" />
          <div class="f-alert-body">
            <div class="f-alert-title">{{ alertTitle }}</div>
            <div class="f-alert-sub">{{ alertSub }}</div>
          </div>
          <button class="f-alert-close" @click="alertVisible=false"><VIcon icon="tabler-x" size="16" /></button>
        </div>
      </div>
    </transition>

    <!-- ══ TABS ══ -->
    <VCard class="mb-5" elevation="0" border>
      <VCardText class="pa-0">
        <div class="tab-bar">
          <button
            class="tab-btn"
            :class="activeTab === 'fournisseurs' ? 'tab-btn--active' : 'tab-btn--inactive'"
            @click="activeTab = 'fournisseurs'"
          >
            <VIcon icon="tabler-building-store" size="16" class="me-2" />
            Fournisseurs
          </button>
          <button
            class="tab-btn"
            :class="activeTab === 'commandes' ? 'tab-btn--active' : 'tab-btn--inactive'"
            @click="activeTab = 'commandes'"
          >
            <VIcon icon="tabler-clipboard-list" size="16" class="me-2" />
            Commandes
          </button>
          <button
            class="tab-btn"
            :class="activeTab === 'produits' ? 'tab-btn--active' : 'tab-btn--inactive'"
            @click="activeTab = 'produits'"
          >
            <VIcon icon="tabler-shopping-bag" size="16" class="me-2" />
            Produits/Catégories
          </button>
        </div>
      </VCardText>
    </VCard>

    <!-- ════════════════════════════════════════
         TAB: FOURNISSEURS
    ════════════════════════════════════════ -->
    <template v-if="activeTab==='fournisseurs'">

      <!-- Filter -->
      <VCard class="mb-4" elevation="0" border>
        <VCardText class="pa-4">
          <div class="f-filter-label mb-3">Filter</div>
          <div class="d-flex gap-3 flex-wrap align-end">
            <div style="position:relative;min-width:160px">
              <select v-model="fFilters.park_id" style="width:100%;height:38px;padding:0 32px 0 12px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:13px;color:#555;background:#fff;outline:none;font-family:inherit;appearance:none;cursor:pointer">
                <option value="">Parc</option>
                <option v-for="p in parkOptions" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
              <VIcon icon="tabler-chevron-down" size="15" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#888;pointer-events:none" />
            </div>
            <button class="f-apply-btn" @click="loadFournisseurs">Appliquer</button>
          </div>
        </VCardText>
      </VCard>

      <!-- Table card -->
      <VCard elevation="0" border>
        <VCardText class="pa-4">
          <div class="d-flex align-center justify-space-between mb-4">
            <div class="f-section-title">Liste des fournisseurs</div>
            <div class="d-flex gap-2">
              <button class="f-export-btn" @click="exportFournisseurs">
                <VIcon icon="tabler-download" size="15" class="mr-1" />Export
              </button>
              <button class="f-create-btn" @click="openNewFournisseur">
                <VIcon icon="tabler-plus" size="15" class="mr-1" />Nouveau Fournisseur
              </button>
            </div>
          </div>

          <div style="overflow-x:auto">
            <table class="f-table">
              <thead>
                <tr>
                  <th style="width:40px"><input type="checkbox" v-model="selectAll" @change="toggleSelectAll" style="accent-color:#1a1a2e;cursor:pointer" /></th>
                  <th>NOM</th>
                  <th style="white-space:nowrap">EMAIL & TÉL.</th>
                  <th>LOGO</th>
                  <th>PARCS</th>
                  <th style="white-space:nowrap">DATE AJOUT</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingF">
                  <td colspan="7" style="text-align:center;padding:32px;color:#9e9e9e">Chargement...</td>
                </tr>
                <tr v-else-if="fournisseurs.length===0">
                  <td colspan="7" style="text-align:center;padding:32px;color:#9e9e9e">Aucun fournisseur trouvé</td>
                </tr>
                <tr v-for="f in fournisseurs" :key="f.id">
                  <td><input type="checkbox" v-model="selectedF" :value="f.id" style="accent-color:#1a1a2e;cursor:pointer" /></td>
                  <td>
                    <div class="f-supplier-name">{{ f.name }}</div>
                    <div class="f-supplier-sub">{{ f.type || 'Fournisseur' }}</div>
                  </td>
                  <td>
                    <div class="f-contact-item"><VIcon icon="tabler-mail" size="13" class="mr-1" style="color:#9e9e9e" />{{ f.emails?.[0] || '—' }}</div>
                    <div class="f-contact-item"><VIcon icon="tabler-phone" size="13" class="mr-1" style="color:#9e9e9e" />{{ f.phones?.[0] || '—' }}</div>
                  </td>
                  <td>
                    <div v-if="f.image_url" class="f-logo-wrap">
                      <img :src="f.image_url" alt="logo" class="f-logo-img" />
                    </div>
                    <div v-else class="f-logo-placeholder"><VIcon icon="tabler-building-store" size="20" style="color:#bbb" /></div>
                  </td>
                  <td>
                    <div class="f-parcs-list">
                      <span v-for="p in (f.parks||[])" :key="p.id" class="f-parc-badge">{{ p.name }}</span>
                      <span v-if="!f.parks||f.parks.length===0" style="color:#bbb">—</span>
                    </div>
                  </td>
                  <td style="color:#555;font-size:13px">{{ formatDate(f.created_at) }}</td>
                  <td>
                    <div class="d-flex gap-1 align-center">
                      <button class="f-icon-btn" title="Supprimer" @click="openDeleteF(f)" style="color:#e53935">
                        <VIcon icon="tabler-trash" size="17" />
                      </button>
                      <button class="f-icon-btn" title="Modifier" @click="openEditF(f)" style="color:#1a1a2e">
                        <VIcon icon="tabler-edit" size="17" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </VCardText>
      </VCard>
    </template>


    <!-- ════════════════════════════════════════
         TAB: COMMANDES
    ════════════════════════════════════════ -->
    <template v-if="activeTab==='commandes'">

      <!-- Filter -->
      <VCard class="mb-4" elevation="0" border>
        <VCardText class="pa-4">
          <div class="f-filter-label mb-3">Filter</div>
          <div class="d-flex gap-3 flex-wrap align-end">
            <div style="position:relative;min-width:160px">
              <input v-model="cFilters.period_from" type="date" placeholder="Du"
                style="width:100%;height:38px;padding:0 36px 0 12px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:13px;color:#333;background:#fff;outline:none;font-family:inherit;box-sizing:border-box" />
              <VIcon icon="tabler-calendar" size="16" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#888;pointer-events:none" />
            </div>
            <div style="position:relative;min-width:160px">
              <input v-model="cFilters.period_to" type="date" placeholder="Au"
                style="width:100%;height:38px;padding:0 36px 0 12px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:13px;color:#333;background:#fff;outline:none;font-family:inherit;box-sizing:border-box" />
              <VIcon icon="tabler-calendar" size="16" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#888;pointer-events:none" />
            </div>
            <div style="position:relative;min-width:160px">
              <select v-model="cFilters.park_id" style="width:100%;height:38px;padding:0 32px 0 12px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:13px;color:#555;background:#fff;outline:none;font-family:inherit;appearance:none;cursor:pointer">
                <option value="">Parc</option>
                <option v-for="p in parkOptions" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
              <VIcon icon="tabler-chevron-down" size="15" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#888;pointer-events:none" />
            </div>
            <div style="position:relative;min-width:150px">
              <select v-model="cFilters.status" style="width:100%;height:38px;padding:0 32px 0 12px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:13px;color:#555;background:#fff;outline:none;font-family:inherit;appearance:none;cursor:pointer">
                <option value="">Statut</option>
                <option value="pending">En attente</option>
                <option value="processing">En cours</option>
                <option value="shipped">Expédiée</option>
                <option value="delivered">Livrée</option>
                <option value="cancelled">Annulée</option>
              </select>
              <VIcon icon="tabler-chevron-down" size="15" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#888;pointer-events:none" />
            </div>
            <div style="display:flex;gap:8px;align-items:center">
              <input v-model="cFilters.montant_min" type="number" placeholder="Montant min"
                style="width:120px;height:38px;padding:0 12px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:13px;color:#333;background:#fff;outline:none;font-family:inherit;box-sizing:border-box" />
              <span style="color:#888;font-size:13px">—</span>
              <input v-model="cFilters.montant_max" type="number" placeholder="Montant max"
                style="width:120px;height:38px;padding:0 12px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:13px;color:#333;background:#fff;outline:none;font-family:inherit;box-sizing:border-box" />
            </div>
            <button class="f-apply-btn" @click="loadCommandes">Appliquer</button>
          </div>
        </VCardText>
      </VCard>

      <!-- Table card -->
      <VCard elevation="0" border>
        <VCardText class="pa-4">
          <div class="d-flex align-center justify-space-between mb-4">
            <div class="f-section-title">Liste des commandes</div>
            <div class="d-flex gap-2">
              <button class="f-export-btn" @click="exportCommandes">
                <VIcon icon="tabler-download" size="15" class="mr-1" />Export
              </button>
              <button class="f-create-btn" @click="openNewCommande">
                <VIcon icon="tabler-plus" size="15" class="mr-1" />Nouvelle Commande
              </button>
            </div>
          </div>

          <div style="overflow-x:auto">
            <table class="f-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>FOURNISSEUR</th>
                  <th style="white-space:nowrap">NB. PRODUITS</th>
                  <th style="white-space:nowrap">MONTANT TOTAL</th>
                  <th>STATUT</th>
                  <th style="white-space:nowrap">DATE</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingC">
                  <td colspan="7" style="text-align:center;padding:32px;color:#9e9e9e">Chargement...</td>
                </tr>
                <tr v-else-if="commandes.length===0">
                  <td colspan="7" style="text-align:center;padding:32px;color:#9e9e9e">Aucune commande trouvée</td>
                </tr>
                <tr v-for="c in commandes" :key="c.id">
                  <td style="font-weight:600;color:#1a1a2e;font-size:13px">#{{ c.order_number || c.id }}</td>
                  <td>
                    <div class="f-supplier-name">{{ c.supplier?.name || c.supplier_name || supplierName(c.supplier_id) || '—' }}</div>
                  </td>
                  <td style="font-size:13px;color:#555">{{ c.items?.length || 0 }} produit(s)</td>
                  <td style="font-weight:600;color:#1a1a2e;font-size:13px">{{ formatMoney(c.total_with_tva ?? c.total) }} €</td>
                  <td>
                    <span class="f-status-chip" :class="statusClass(c.status)">{{ statusLabel(c.status) }}</span>
                  </td>
                  <td style="color:#555;font-size:13px">{{ formatDate(c.expected_delivery_date || c.created_at || c.date || c.order_date) }}</td>
                  <td>
                    <div class="d-flex gap-1 align-center">
                      <button class="f-icon-btn" title="Annuler" @click="openCancelC(c)" style="color:#e53935">
                        <VIcon icon="tabler-x" size="17" />
                      </button>
                      <button class="f-icon-btn" title="Détails" @click="openDetailsC(c)" style="color:#1a1a2e">
                        <VIcon icon="tabler-info-circle" size="17" />
                      </button>
                      <VMenu location="bottom end">
                        <template #activator="{ props: menuProps }">
                          <button class="f-icon-btn" v-bind="menuProps" title="Plus d'actions" style="color:#555">
                            <VIcon icon="tabler-dots-vertical" size="17" />
                          </button>
                        </template>
                        <VList density="compact" style="min-width:200px;border-radius:10px">
                          <VListItem @click="changeStatusC(c, 'processing')" style="cursor:pointer">
                            <template #prepend><VIcon icon="tabler-clock" size="16" style="color:#E8A838;margin-right:8px" /></template>
                            <VListItemTitle style="font-size:13px">Marquer En cours</VListItemTitle>
                          </VListItem>
                          <VListItem @click="changeStatusC(c, 'shipped')" style="cursor:pointer">
                            <template #prepend><VIcon icon="tabler-truck" size="16" style="color:#2196F3;margin-right:8px" /></template>
                            <VListItemTitle style="font-size:13px">Marquer Expédiée</VListItemTitle>
                          </VListItem>
                          <VListItem @click="changeStatusC(c, 'delivered')" style="cursor:pointer">
                            <template #prepend><VIcon icon="tabler-circle-check" size="16" style="color:#4CAF50;margin-right:8px" /></template>
                            <VListItemTitle style="font-size:13px">Marquer Livrée</VListItemTitle>
                          </VListItem>
                          <VDivider />
                          <VListItem @click="openCancelC(c)" style="cursor:pointer">
                            <template #prepend><VIcon icon="tabler-x" size="16" style="color:#e53935;margin-right:8px" /></template>
                            <VListItemTitle style="font-size:13px;color:#e53935">Annuler la commande</VListItemTitle>
                          </VListItem>
                        </VList>
                      </VMenu>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </VCardText>
      </VCard>
    </template>

    <!-- ════════════════════════════════════════
         TAB: PRODUITS / CATÉGORIES
    ════════════════════════════════════════ -->
    <template v-if="activeTab==='produits'">

      <!-- Sub-navigation -->
      <div class="pc-nav-bar mb-4">
        <div class="pc-tabs">
          <button
            class="f-sub-tab-btn"
            :class="produitSubTab==='produits' ? 'f-sub-tab-btn--active' : ''"
            @click="produitSubTab='produits'"
          >
            <VIcon icon="tabler-box" size="15" class="me-1" />Produits
          </button>
          <button
            class="f-sub-tab-btn"
            :class="produitSubTab==='categories' ? 'f-sub-tab-btn--active' : ''"
            @click="produitSubTab='categories'"
          >
            <VIcon icon="tabler-tag" size="15" class="me-1" />Catégories
          </button>
        </div>
        <div class="pc-actions">
          <button class="f-create-btn" @click="openAddProduit">
            <VIcon icon="tabler-plus" size="15" class="mr-1" />Ajouter produit
          </button>
          <button class="f-export-btn" @click="openAddCategorie">
            <VIcon icon="tabler-folder-plus" size="15" class="mr-1" />Ajouter catégorie
          </button>
        </div>
      </div>

      <!-- ── SOUS-TAB: PRODUITS ── -->
      <template v-if="produitSubTab==='produits'">
        <VCard elevation="0" border>
          <VCardText class="pa-4">
            <div v-if="loadingP" class="d-flex justify-center py-10">
              <VProgressCircular indeterminate color="#E8A838" />
            </div>
            <template v-else>
              <div class="f-responsive-wrap">
                <table class="f-table">
                  <thead>
                    <tr>
                      <th>NOM PRODUIT</th>
                      <th>CATÉGORIE</th>
                      <th>VENTE EN LIGNE</th>
                      <th>VENTE SUR SITE</th>
                      <th>PRIX DE VENTE</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="produits.length===0">
                      <td colspan="7" style="text-align:center;padding:32px;color:#9e9e9e">Aucun produit trouvé</td>
                    </tr>
                    <tr v-for="p in produits" :key="p.id">
                      <td>
                        <div class="f-supplier-name">{{ p.nom || p.name || '—' }}</div>
                      </td>
                      <td style="font-size:13px;color:#555">
                        {{
                          p.category
                            ? (typeof p.category === 'object' ? (p.category.name || p.category.nom || '—') : p.category)
                            : (p.categorie || '—')
                        }}
                      </td>
                      <td>
                        <span class="f-bool-chip" :class="(p.vente_en_ligne || p.sale_options?.online) ? 'f-bool-yes' : 'f-bool-no'">
                          {{ (p.vente_en_ligne || p.sale_options?.online) ? 'Oui' : 'Non' }}
                        </span>
                      </td>
                      <td>
                        <span class="f-bool-chip" :class="(p.vente_sur_site || p.sale_options?.onsite) ? 'f-bool-yes' : 'f-bool-no'">
                          {{ (p.vente_sur_site || p.sale_options?.onsite) ? 'Oui' : 'Non' }}
                        </span>
                      </td>
                      <td style="font-weight:600;color:#1a1a2e;font-size:13px">
                        {{ (p.price ?? p.prix_vente) != null ? Number(p.price ?? p.prix_vente).toLocaleString('fr-FR') + ' €' : '—' }}
                      </td>
                      <td>
                        <div class="d-flex gap-1 align-center">
                          <button class="f-icon-btn" title="Modifier" @click="openEditProduit(p)" style="color:#1a1a2e">
                            <VIcon icon="tabler-edit" size="17" />
                          </button>
                          <button class="f-icon-btn" title="Supprimer" @click="openDeleteProduit(p)" style="color:#e53935">
                            <VIcon icon="tabler-trash" size="17" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
          </VCardText>
        </VCard>
      </template>

      <!-- ── SOUS-TAB: CATÉGORIES ── -->
      <template v-if="produitSubTab==='categories'">
        <VCard elevation="0" border>
          <VCardText class="pa-4">
            <div v-if="loadingCat" class="d-flex justify-center py-10">
              <VProgressCircular indeterminate color="#E8A838" />
            </div>
            <template v-else>
              <div class="f-responsive-wrap">
                <table class="f-table">
                  <thead>
                    <tr>
                      <th>NOM CATÉGORIE</th>
                      <th>NB. PRODUITS</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="categories.length===0">
                      <td colspan="4" style="text-align:center;padding:32px;color:#9e9e9e">Aucune catégorie trouvée</td>
                    </tr>
                    <tr v-for="cat in categories" :key="cat.id">
                      <td>
                        <div class="f-supplier-name">{{ cat.nom || cat.name || '—' }}</div>
                      </td>
                      <td style="font-size:13px;color:#555">{{ categoryProductCount[cat.id] ?? 0 }}</td>
                      <td>
                        <div class="d-flex gap-1 align-center">
                          <button class="f-icon-btn" title="Modifier" @click="openEditCategorie(cat)" style="color:#1a1a2e">
                            <VIcon icon="tabler-edit" size="17" />
                          </button>
                          <button class="f-icon-btn" title="Supprimer" @click="openDeleteCategorie(cat)" style="color:#e53935">
                            <VIcon icon="tabler-trash" size="17" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
          </VCardText>
        </VCard>
      </template>

    </template>

    <!-- ════════════════════════════════════════
         MODAL: AJOUTER / MODIFIER PRODUIT
    ════════════════════════════════════════ -->
    <VDialog v-model="showProduitForm" max-width="520" persistent>
      <VCard style="border-radius:16px;display:flex;flex-direction:column;max-height:90vh">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px 16px;flex-shrink:0;border-bottom:1px solid #f0f0f0">
          <div>
            <div style="font-size:16px;font-weight:700;color:#1a1a2e">
              {{ produitForm.id ? 'Modifier le produit' : 'Ajouter un produit' }}
            </div>
          </div>
          <button @click="showProduitForm=false" style="background:none;border:none;cursor:pointer;color:#9e9e9e;padding:4px">
            <VIcon icon="tabler-x" size="20" />
          </button>
        </div>
        <div style="overflow-y:auto;flex:1;padding:20px 24px">
          <div class="f-field-label">Nom du produit *</div>
          <input v-model="produitForm.nom" type="text" placeholder="Nom du produit" class="f-input mb-4" />

          <div class="f-field-label">Parc *</div>
          <div style="position:relative;margin-bottom:16px">
            <select v-model="produitForm.park_id" class="f-input" style="appearance:none;cursor:pointer;padding-right:32px">
              <option value="">Sélectionner un parc</option>
              <option v-for="p in parkOptions" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <VIcon icon="tabler-chevron-down" size="15" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#888;pointer-events:none" />
          </div>

          <div class="f-field-label">Catégorie *</div>
          <div style="position:relative;margin-bottom:16px">
            <select v-model="produitForm.categorie" class="f-input" style="appearance:none;cursor:pointer;padding-right:32px">
              <option value="">Sélectionner une catégorie</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.nom || cat.name }}
              </option>
            </select>
            <VIcon icon="tabler-chevron-down" size="15" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#888;pointer-events:none" />
          </div>

          <div class="mb-4">
            <div class="f-field-label">Prix de vente (€)</div>
            <input v-model="produitForm.prix_vente" type="number" step="0.01" min="0" placeholder="0.00" class="f-input" />
          </div>

          <div class="f-field-label mb-2">Disponibilité</div>
          <div class="d-flex gap-4 mb-4">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:#333">
              <input type="checkbox" v-model="produitForm.vente_en_ligne" style="accent-color:#E8A838;cursor:pointer;width:16px;height:16px" />
              Vente en ligne
            </label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:#333">
              <input type="checkbox" v-model="produitForm.vente_sur_site" style="accent-color:#E8A838;cursor:pointer;width:16px;height:16px" />
              Vente sur site
            </label>
          </div>

          <button class="f-submit-btn" :disabled="savingP" @click="saveProduit">
            <span v-if="savingP">...</span>
            <span v-else>{{ produitForm.id ? 'Enregistrer' : 'Ajouter le produit' }}</span>
          </button>
        </div>
      </VCard>
    </VDialog>

    <!-- ════════════════════════════════════════
         MODAL: AJOUTER / MODIFIER CATÉGORIE
    ════════════════════════════════════════ -->
    <VDialog v-model="showCategorieForm" max-width="400" persistent>
      <VCard style="border-radius:16px;padding:28px 24px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
          <div style="font-size:16px;font-weight:700;color:#1a1a2e">
            {{ categorieForm.id ? 'Modifier la catégorie' : 'Ajouter une catégorie' }}
          </div>
          <button @click="showCategorieForm=false" style="background:none;border:none;cursor:pointer;color:#9e9e9e">
            <VIcon icon="tabler-x" size="20" />
          </button>
        </div>
        <div class="f-field-label">Nom de la catégorie *</div>
        <input v-model="categorieForm.nom" type="text" placeholder="Ex: Boissons, Alimentation..." class="f-input mb-4" />
        <div style="display:flex;gap:12px">
          <button @click="showCategorieForm=false" style="flex:1;height:42px;border-radius:10px;border:1.5px solid #e0e0e0;background:#fff;color:#555;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">Annuler</button>
          <button @click="saveCategorie" :disabled="savingCat" style="flex:1;height:42px;border-radius:10px;border:none;background:#1a1a2e;color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">
            {{ savingCat ? '...' : (categorieForm.id ? 'Enregistrer' : 'Ajouter') }}
          </button>
        </div>
      </VCard>
    </VDialog>

    <!-- ════════════════════════════════════════
         MODAL: NOUVEAU FOURNISSEUR
    ════════════════════════════════════════ -->
    <VDialog v-model="showNewF" max-width="560" persistent scrollable>
      <VCard style="border-radius:16px;overflow:hidden">

        <!-- Header -->
        <div class="nf-header">
          <button class="nf-back-btn" @click="showNewF=false">
            <VIcon icon="tabler-arrow-left" size="17" />
          </button>
          <span class="nf-title">{{ fForm.id ? "Modifier le fournisseur" : "Nouveau fournisseur" }}</span>
        </div>

        <!-- Content -->
        <VCardText class="nf-body">

          <!-- Image upload -->
          <div class="nf-img-zone" @click="$refs.fLogoInput.click()" @drop.prevent="dropFLogo" @dragover.prevent>
            <img v-if="fForm.logoPreview" :src="fForm.logoPreview" class="nf-img-preview" />
            <div v-else class="nf-img-placeholder" />
          </div>
          <input ref="fLogoInput" type="file" accept="image/*" style="display:none" @change="onFLogoChange" />
          <p class="nf-img-hint">Formats autorisés : JPG, GIF ou PNG. Taille maximale de 800 Ko</p>
          <div class="nf-img-btns">
            <button class="nf-btn-reset" @click.stop="resetFLogo">Réinitialiser</button>
            <button class="nf-btn-upload" @click.stop="$refs.fLogoInput.click()">Télécharger Une Nouvelle Photo</button>
          </div>

          <!-- 2-column grid -->
          <div class="nf-grid">
            <!-- Nom fournisseur -->
            <div>
              <p class="nf-label">Nom du fournisseur</p>
              <input v-model="fForm.name" type="text" placeholder="Entrer le nom de fournisseur" class="nf-input" />
            </div>
            <!-- Nom contact -->
            <div>
              <p class="nf-label">Nom du contact principal</p>
              <input v-model="fForm.contactName" type="text" placeholder="Entrer le nom du contact principal" class="nf-input" />
            </div>

            <!-- Email -->
            <div>
              <p class="nf-label">Email</p>
              <input v-model="fForm.emails[0]" type="email" placeholder="Entrer l'email de fournisseur" class="nf-input" />
              <button class="nf-add-link" @click="fForm.emails.push('')">
                <VIcon icon="tabler-square-plus" size="14" class="me-1" />Ajouter Un Email
              </button>
              <template v-for="(em,i) in fForm.emails.slice(1)" :key="'em'+i">
                <div class="d-flex gap-1 mt-1">
                  <input v-model="fForm.emails[i+1]" type="email" placeholder="email@exemple.com" class="nf-input" style="flex:1" />
                  <button @click="fForm.emails.splice(i+1,1)" style="background:none;border:none;cursor:pointer;color:#e53935;padding:0 4px">
                    <VIcon icon="tabler-x" size="13" />
                  </button>
                </div>
              </template>
            </div>

            <!-- Téléphone -->
            <div>
              <p class="nf-label">Numéro de téléphone</p>
              <input v-model="fForm.phones[0]" type="tel" placeholder="Entrer le numéro de téléphone de fournisseur" class="nf-input"
                @keypress="(e) => { if (!/[\d+\s\-().]/.test(e.key)) e.preventDefault() }"
                @paste="(e) => { e.preventDefault(); const t = (e.clipboardData || window.clipboardData).getData('text').replace(/[^\d+\s\-().]/g, ''); fForm.phones[0] = (fForm.phones[0] || '') + t }" />
              <button class="nf-add-link" @click="fForm.phones.push('')">
                <VIcon icon="tabler-square-plus" size="14" class="me-1" />Ajouter Un Numéro De Téléphone
              </button>
              <template v-for="(ph,i) in fForm.phones.slice(1)" :key="'ph'+i">
                <div class="d-flex gap-1 mt-1">
                  <input v-model="fForm.phones[i+1]" type="tel" placeholder="+33 6..." class="nf-input" style="flex:1"
                    @keypress="(e) => { if (!/[\d+\s\-().]/.test(e.key)) e.preventDefault() }"
                    @paste="(e) => { e.preventDefault(); const t = (e.clipboardData || window.clipboardData).getData('text').replace(/[^\d+\s\-().]/g, ''); fForm.phones[i+1] = (fForm.phones[i+1] || '') + t }" />
                  <button @click="fForm.phones.splice(i+1,1)" style="background:none;border:none;cursor:pointer;color:#e53935;padding:0 4px">
                    <VIcon icon="tabler-x" size="13" />
                  </button>
                </div>
              </template>
            </div>

            <!-- Adresse -->
            <div>
              <p class="nf-label">Adresse</p>
              <div class="nf-input-wrap">
                <input v-model="fForm.adresse" type="text" placeholder="Entrer l'adresse de fournisseur" class="nf-input nf-input--icon" />
                <VIcon icon="tabler-navigation" size="16" class="nf-input-icon" />
              </div>
            </div>

            <!-- Parcs -->
            <div>
              <p class="nf-label">Parc(s) associé(s)</p>
              <AppSelect
                v-model="fForm.park_ids"
                :items="parkOptions"
                item-title="name"
                item-value="id"
                multiple
                placeholder="Sélectionner un/des parc(s)"
                hide-details
                density="compact"
              />
            </div>
          </div>

        </VCardText>

        <!-- Footer -->
        <div class="nf-footer">
          <button class="nf-submit-btn" @click="confirmNewF">
            {{ fForm.id ? 'Enregistrer' : 'Créer' }}
          </button>
        </div>

      </VCard>
    </VDialog>

    <!-- ════════════════════════════════════════
         CONFIRM: NOUVEAU FOURNISSEUR
    ════════════════════════════════════════ -->
    <VDialog v-model="showConfirmF" max-width="400" persistent>
      <VCard style="border-radius:16px;padding:28px 24px">
        <div style="text-align:center;margin-bottom:20px">
          <div style="width:52px;height:52px;border-radius:50%;background:#FFF8E7;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
            <VIcon icon="tabler-building-store" size="26" style="color:#E8A838" />
          </div>
          <div style="font-size:16px;font-weight:700;color:#1a1a2e;margin-bottom:6px">Créer un nouveau fournisseur</div>
          <div style="font-size:13px;color:#9e9e9e">Voulez-vous vraiment créer ce fournisseur ?</div>
        </div>
        <div style="display:flex;gap:12px">
          <button @click="showConfirmF=false" style="flex:1;height:42px;border-radius:10px;border:2px solid #e53935;background:#fff;color:#e53935;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">Annuler</button>
          <button @click="doCreateF" style="flex:1;height:42px;border-radius:10px;border:none;background:#E8A838;color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">Confirmer</button>
        </div>
      </VCard>
    </VDialog>

    <!-- ════════════════════════════════════════
         CONFIRM: DELETE FOURNISSEUR
    ════════════════════════════════════════ -->
    <VDialog v-model="showDeleteF" max-width="400" persistent>
      <VCard style="border-radius:16px;padding:28px 24px">
        <div style="text-align:center;margin-bottom:20px">
          <div style="width:52px;height:52px;border-radius:50%;background:#FDECEA;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
            <VIcon icon="tabler-trash" size="26" style="color:#e53935" />
          </div>
          <div style="font-size:16px;font-weight:700;color:#1a1a2e;margin-bottom:6px">Confirmer la suppression</div>
          <div style="font-size:13px;color:#9e9e9e">Voulez-vous vraiment supprimer <strong>{{ deletingF?.name }}</strong> ?</div>
        </div>
        <div style="display:flex;gap:12px">
          <button @click="showDeleteF=false" style="flex:1;height:42px;border-radius:10px;border:2px solid #e53935;background:#fff;color:#e53935;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">Annuler</button>
          <button @click="doDeleteF" style="flex:1;height:42px;border-radius:10px;border:none;background:#e53935;color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">Supprimer</button>
        </div>
      </VCard>
    </VDialog>

    <!-- ════════════════════════════════════════
         MODAL: NOUVELLE COMMANDE (2 steps)
    ════════════════════════════════════════ -->
    <VDialog v-model="showNewC" max-width="580" persistent>
      <VCard style="border-radius:16px;display:flex;flex-direction:column;max-height:90vh">
        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px 16px;flex-shrink:0;border-bottom:1px solid #f0f0f0">
          <div>
            <div style="font-size:16px;font-weight:700;color:#1a1a2e">Nouvelle Commande</div>
            <div style="font-size:12px;color:#9e9e9e;margin-top:2px">Étape {{ cStep }} / 2</div>
          </div>
          <button @click="showNewC=false" style="background:none;border:none;cursor:pointer;color:#9e9e9e;padding:4px">
            <VIcon icon="tabler-x" size="20" />
          </button>
        </div>

        <!-- Step indicator -->
        <div style="display:flex;padding:16px 24px 0;gap:8px;flex-shrink:0">
          <div v-for="s in [1,2]" :key="s" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
            <div :style="`width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;transition:all .2s;${cStep>=s?'background:#1a1a2e;color:#fff':'background:#f0f0f0;color:#9e9e9e'}`">{{ s }}</div>
            <div :style="`font-size:11px;font-weight:500;${cStep>=s?'color:#1a1a2e':'color:#bbb'}`">{{ s===1?'Informations':'Produits' }}</div>
          </div>
        </div>
        <div style="height:3px;margin:12px 24px 0;background:#f0f0f0;border-radius:2px;flex-shrink:0">
          <div :style="`height:100%;background:#E8A838;border-radius:2px;transition:width .3s;width:${(cStep-1)*100}%`"></div>
        </div>

        <!-- Content -->
        <div style="overflow-y:auto;flex:1;padding:20px 24px">

          <!-- STEP 1: Informations -->
          <template v-if="cStep===1">
            <div class="f-field-label">Fournisseur *</div>
            <div style="position:relative;margin-bottom:16px">
              <select v-model="cForm.supplier_id" class="f-input" style="appearance:none;cursor:pointer;padding-right:32px">
                <option value="">Sélectionner un fournisseur</option>
                <option v-for="f in fournisseurs" :key="f.id" :value="f.id">{{ f.name }}</option>
              </select>
              <VIcon icon="tabler-chevron-down" size="15" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#888;pointer-events:none" />
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
              <div>
                <div class="f-field-label">Date de livraison</div>
                <div>
                  <input v-model="cForm.delivery_date" type="date" class="f-input" />
                </div>
              </div>
              <div>
                <div class="f-field-label">Mode de paiement</div>
                <div style="position:relative">
                  <select v-model="cForm.payment_method" class="f-input" style="appearance:none;cursor:pointer;padding-right:32px">
                    <option value="">Sélectionner</option>
                    <option value="bank_transfer">Virement bancaire</option>
                    <option value="credit">Chèque</option>
                    <option value="cash">Espèces</option>
                    <option value="card">Carte bancaire</option>
                  </select>
                  <VIcon icon="tabler-chevron-down" size="15" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#888;pointer-events:none" />
                </div>
              </div>
            </div>

            <div class="f-field-label">Parc *</div>
            <div style="position:relative;margin-bottom:16px">
              <select v-model="cForm.park_id" class="f-input" style="appearance:none;cursor:pointer;padding-right:32px">
                <option value="">Sélectionner un parc</option>
                <option v-for="p in parkOptions" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
              <VIcon icon="tabler-chevron-down" size="15" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#888;pointer-events:none" />
            </div>

            <div class="f-field-label">Notes</div>
            <textarea v-model="cForm.notes" rows="3" placeholder="Notes sur la commande..." class="f-textarea mb-4"></textarea>

            <button class="f-submit-btn" @click="cStep=2">Suivant →</button>
          </template>

          <!-- STEP 2: Produits -->
          <template v-if="cStep===2">
            <div class="f-field-label mb-3">Produits commandés</div>

            <div v-for="(item, i) in cForm.items" :key="'ci'+i" class="c-product-row mb-3">
              <!-- Row 1: Catégorie + Produit -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
                <!-- Catégorie -->
                <div>
                  <div class="f-field-label" style="font-size:11px">Catégorie</div>
                  <div style="position:relative">
                    <select
                      v-model="item.category"
                      class="f-input"
                      style="appearance:none;cursor:pointer;padding-right:28px;font-size:13px"
                      @change="item.product_id = ''"
                    >
                      <option :value="null">Toutes les catégories</option>
                      <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                        {{ cat.nom || cat.name }}
                      </option>
                    </select>
                    <VIcon icon="tabler-chevron-down" size="13" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);color:#888;pointer-events:none" />
                  </div>
                </div>
                <!-- Produit -->
                <div>
                  <div class="f-field-label" style="font-size:11px">Produit</div>
                  <div style="position:relative">
                    <select v-model="item.product_id" class="f-input" style="appearance:none;cursor:pointer;padding-right:28px;font-size:13px">
                      <option value="">Choisir un produit</option>
                      <option v-for="p in filteredProducts(item.category)" :key="p.id" :value="p.id">{{ p.name }}</option>
                    </select>
                    <VIcon icon="tabler-chevron-down" size="13" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);color:#888;pointer-events:none" />
                  </div>
                </div>
              </div>
              <!-- Row 2: Qty + Prix + Delete -->
              <div style="display:grid;grid-template-columns:1fr 1fr 36px;gap:8px;align-items:end">
                <div>
                  <div class="f-field-label" style="font-size:11px">Quantité</div>
                  <input v-model.number="item.quantity" type="number" min="1" class="f-input" style="font-size:13px" placeholder="0" />
                </div>
                <div>
                  <div class="f-field-label" style="font-size:11px">Prix (€)</div>
                  <input v-model.number="item.price" type="number" step="0.01" min="0" class="f-input" style="font-size:13px" placeholder="0.00" />
                </div>
                <div>
                  <button v-if="cForm.items.length>1" @click="cForm.items.splice(i,1)" class="f-remove-btn"><VIcon icon="tabler-trash" size="15" /></button>
                </div>
              </div>
            </div>

            <button class="f-add-field-btn mb-4" @click="cForm.items.push({category:null,product_id:'',quantity:1,price:0})">
              <VIcon icon="tabler-plus" size="14" class="mr-1" />Ajouter Un Produit
            </button>

            <!-- Total -->
            <div style="background:#f8f8f8;border-radius:10px;padding:12px 16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:13px;color:#555;font-weight:600">Total estimé</span>
              <span style="font-size:16px;font-weight:700;color:#1a1a2e">{{ cTotalFormatted }} €</span>
            </div>

            <div style="display:flex;gap:12px">
              <button class="f-back-btn" @click="cStep=1">← Retour</button>
              <button class="f-submit-btn" style="flex:1" @click="confirmNewC">Créer la Commande</button>
            </div>
          </template>
        </div>
      </VCard>
    </VDialog>

    <!-- ════════════════════════════════════════
         CONFIRM: NOUVELLE COMMANDE
    ════════════════════════════════════════ -->
    <VDialog v-model="showConfirmC" max-width="400" persistent>
      <VCard style="border-radius:16px;padding:28px 24px">
        <div style="text-align:center;margin-bottom:20px">
          <div style="width:52px;height:52px;border-radius:50%;background:#FFF8E7;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
            <VIcon icon="tabler-shopping-cart" size="26" style="color:#E8A838" />
          </div>
          <div style="font-size:16px;font-weight:700;color:#1a1a2e;margin-bottom:6px">Créer une nouvelle commande</div>
          <div style="font-size:13px;color:#9e9e9e">Voulez-vous vraiment créer cette commande ?</div>
        </div>
        <div style="display:flex;gap:12px">
          <button @click="showConfirmC=false" style="flex:1;height:42px;border-radius:10px;border:2px solid #e53935;background:#fff;color:#e53935;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">Annuler</button>
          <button @click="doCreateC" style="flex:1;height:42px;border-radius:10px;border:none;background:#E8A838;color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">Confirmer La Création</button>
        </div>
      </VCard>
    </VDialog>

    <!-- ════════════════════════════════════════
         CONFIRM: ANNULER COMMANDE
    ════════════════════════════════════════ -->
    <VDialog v-model="showCancelC" max-width="400" persistent>
      <VCard style="border-radius:16px;padding:28px 24px">
        <div style="text-align:center;margin-bottom:20px">
          <div style="width:52px;height:52px;border-radius:50%;background:#FDECEA;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
            <VIcon icon="tabler-x" size="26" style="color:#e53935" />
          </div>
          <div style="font-size:16px;font-weight:700;color:#1a1a2e;margin-bottom:6px">Annuler la commande</div>
          <div style="font-size:13px;color:#9e9e9e">Voulez-vous vraiment annuler la commande <strong>#{{ cancelingC?.id }}</strong> ?</div>
        </div>
        <div style="display:flex;gap:12px">
          <button @click="showCancelC=false" style="flex:1;height:42px;border-radius:10px;border:2px solid #e53935;background:#fff;color:#e53935;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">Retour</button>
          <button @click="doCancelC" style="flex:1;height:42px;border-radius:10px;border:none;background:#e53935;color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">Annuler La Commande</button>
        </div>
      </VCard>
    </VDialog>

    <!-- ════════════════════════════════════════
         MODAL: DÉTAILS COMMANDE
    ════════════════════════════════════════ -->
    <VDialog v-model="showDetailsC" max-width="600" persistent>
      <VCard style="border-radius:16px;display:flex;flex-direction:column;max-height:90vh" v-if="detailsC">
        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px 16px;flex-shrink:0;border-bottom:1px solid #f0f0f0">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:42px;height:42px;border-radius:10px;background:#FFF8E7;display:flex;align-items:center;justify-content:center">
              <VIcon icon="tabler-package" size="22" style="color:#E8A838" />
            </div>
            <div>
              <div style="font-size:16px;font-weight:700;color:#1a1a2e">Détails de la commande</div>
              <div style="font-size:12px;color:#9e9e9e;margin-top:2px">#{{ detailsC.id }}</div>
            </div>
          </div>
          <button @click="showDetailsC=false" style="background:none;border:none;cursor:pointer;color:#9e9e9e;padding:4px">
            <VIcon icon="tabler-x" size="20" />
          </button>
        </div>

        <!-- Inner tabs -->
        <div style="display:flex;border-bottom:1px solid #f0f0f0;flex-shrink:0;padding:0 24px">
          <button class="f-inner-tab" :class="{active:detailTab==='info'}" @click="detailTab='info'">Informations Générales</button>
          <button class="f-inner-tab" :class="{active:detailTab==='products'}" @click="detailTab='products'">Produits</button>
        </div>

        <!-- Content -->
        <div style="overflow-y:auto;flex:1;padding:20px 24px">

          <!-- INFO TAB -->
          <template v-if="detailTab==='info'">
            <div class="d-row mb-3">
              <div class="d-label">ID Commande</div>
              <div class="d-value">#{{ detailsC.id }}</div>
            </div>
            <div class="d-row mb-3">
              <div class="d-label">Fournisseur</div>
              <div class="d-value">{{ detailsC.supplier_name || detailsC.supplier?.name || '—' }}</div>
            </div>
            <div class="d-row mb-3">
              <div class="d-label">Montant total</div>
              <div class="d-value" style="font-weight:700;color:#1a1a2e">{{ formatMoney(detailsC.total_amount ?? detailsC.total) }} €</div>
            </div>
            <div class="d-row mb-3">
              <div class="d-label">Date de commande</div>
              <div class="d-value">{{ formatDate(detailsC.created_at || detailsC.date || detailsC.order_date || detailsC.expected_delivery_date) }}</div>
            </div>
            <div class="d-row mb-3">
              <div class="d-label">Date de livraison</div>
              <div class="d-value">{{ formatDate(detailsC.expected_delivery_date) || '—' }}</div>
            </div>
            <div class="d-row mb-3">
              <div class="d-label">Mode de paiement</div>
              <div class="d-value">{{ detailsC.payment_method || '—' }}</div>
            </div>
            <div class="d-row mb-3">
              <div class="d-label">Parc</div>
              <div class="d-value">{{ detailsC.parks?.[0]?.name || detailsC.park?.name || '—' }}</div>
            </div>
            <div class="d-row mb-3">
              <div class="d-label">Statut</div>
              <div class="d-value">
                <span class="f-status-chip" :class="statusClass(detailsC.status)">{{ statusLabel(detailsC.status) }}</span>
              </div>
            </div>
            <div class="d-row mb-3" style="align-items:flex-start">
              <div class="d-label">Notes</div>
              <div class="d-value" style="white-space:pre-wrap">
                <template v-if="detailsC.notes">
                  <span>{{ detailNotesExpanded ? detailsC.notes : detailsC.notes.slice(0,120) }}</span>
                  <span v-if="!detailNotesExpanded && detailsC.notes.length>120">...</span>
                  <button v-if="detailsC.notes.length>120" @click="detailNotesExpanded=!detailNotesExpanded" style="background:none;border:none;color:#E8A838;font-size:12px;font-weight:600;cursor:pointer;margin-left:4px;padding:0">
                    {{ detailNotesExpanded ? 'Voir moins' : 'Voir plus' }}
                  </button>
                </template>
                <span v-else style="color:#bbb">—</span>
              </div>
            </div>
          </template>

          <!-- PRODUCTS TAB -->
          <template v-if="detailTab==='products'">
            <table class="f-table">
              <thead>
                <tr>
                  <th>PRODUIT</th>
                  <th>QUANTITÉ</th>
                  <th>PRIX UNITAIRE</th>
                  <th>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!detailsC.items || detailsC.items.length===0">
                  <td colspan="4" style="text-align:center;padding:24px;color:#bbb">Aucun produit</td>
                </tr>
                <tr v-for="item in (detailsC.items||[])" :key="item.id">
                  <td style="font-size:13px;color:#1a1a2e;font-weight:500">{{ item.product_name || '—' }}</td>
                  <td style="font-size:13px;color:#555">{{ item.quantity }}</td>
                  <td style="font-size:13px;color:#555">{{ formatMoney(item.price) }} €</td>
                  <td style="font-size:13px;font-weight:600;color:#1a1a2e">{{ formatMoney((item.quantity||0)*(item.price||0)) }} €</td>
                </tr>
              </tbody>
            </table>
            <div style="margin-top:12px;text-align:right">
              <span style="font-size:13px;color:#555;font-weight:600;margin-right:8px">Total :</span>
              <span style="font-size:16px;font-weight:700;color:#1a1a2e">{{ formatMoney(detailsC.total_amount) }} €</span>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div style="padding:16px 24px;border-top:1px solid #f0f0f0;flex-shrink:0">
          <button @click="openCancelFromDetail" style="width:100%;height:44px;border-radius:10px;border:2px solid #e53935;background:#FDECEA;color:#e53935;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px">
            <VIcon icon="tabler-x" size="16" />
            Annuler La Commande
          </button>
        </div>
      </VCard>
    </VDialog>

  </div>
</template>

<script>
import { $api } from "@/utils/api";

export default {
  name: "FournisseursList",
  setup() { return {}; },
  data() {
    return {
      activeTab: "fournisseurs",

      // ── parks ──
      parkOptions: [],

      // ── alert ──
      alertVisible: false,
      alertType: "success",
      alertTitle: "",
      alertSub: "",
      alertTimer: null,

      // ── FOURNISSEURS tab ──
      fFilters: { park_id: "" },
      fournisseurs: [],
      loadingF: false,
      selectAll: false,
      selectedF: [],

      // new fournisseur modal
      showNewF: false,
      fForm: { id: null, name: "", contactName: "", emails: [""], phones: [""], adresse: "", park_ids: [], logo: null, logoPreview: null },
      showConfirmF: false,

      // delete fournisseur
      showDeleteF: false,
      deletingF: null,

      // ── COMMANDES tab ──
      cFilters: { period_from: "", period_to: "", park_id: "", status: "", montant_min: "", montant_max: "" },
      commandes: [],
      loadingC: false,

      // new commande modal
      showNewC: false,
      cStep: 1,
      cForm: { supplier_id: "", delivery_date: "", payment_method: "", park_id: "", notes: "", items: [{ category: null, product_id: "", quantity: 1, price: 0 }] },
      showConfirmC: false,

      // cancel commande
      showCancelC: false,
      cancelingC: null,

      // details commande
      showDetailsC: false,
      detailsC: null,
      detailTab: "info",
      detailNotesExpanded: false,

      // stock items (for commande products)
      stockItems: [],

      // ── PRODUITS / CATÉGORIES tab ──
      produitSubTab: "produits",

      produits: [],
      loadingP: false,

      categories: [],
      loadingCat: false,

      // add/edit produit
      showProduitForm: false,
      savingP: false,
      produitForm: { id: null, nom: "", park_id: null, categorie: "", prix_vente: "", tva: "", vente_en_ligne: false, vente_sur_site: false },

      // add/edit catégorie
      showCategorieForm: false,
      savingCat: false,
      categorieForm: { id: null, nom: "" },
    };
  },

  computed: {
    cTotalFormatted() {
      const total = this.cForm.items.reduce((sum, i) => sum + (i.quantity || 0) * (i.price || 0), 0);
      return total.toFixed(2);
    },
    categoryProductCount() {
      const map = {};
      this.produits.forEach(p => {
        const catId = p.category?.id ?? (typeof p.category === 'number' ? p.category : null);
        if (catId != null) map[catId] = (map[catId] || 0) + 1;
      });
      return map;
    },
  },

  mounted() {
    this.loadParks();
    this.loadFournisseurs();
    this.loadCommandes();
    this.loadStockItems();
    this.loadProduits();
    this.loadCategories();
  },

  beforeUnmount() {
    clearTimeout(this.alertTimer);
    if (this.fForm.logoPreview?.startsWith('blob:')) URL.revokeObjectURL(this.fForm.logoPreview);
  },

  methods: {
    async loadParks() {
      try {
        const res = await $api("/parks", { params: { per_page: 200 } });
        this.parkOptions = (res.data || []).map(p => ({
          id: p.id,
          name: p.name || `Parc ${p.id}`,
        }));
      } catch { this.parkOptions = []; }
    },

    async loadStockItems() {
      try {
        const res = await $api("/products", { params: { per_page: 200 } });
        this.stockItems = (res.data || []).map(p => ({
          id:         p.id,
          name:       p.nom || p.name,
          categoryId: typeof p.category === 'object' ? p.category?.id : (p.category_id ?? null),
        }));
      } catch { this.stockItems = []; }
    },

    filteredProducts(categoryId) {
      if (!categoryId) return this.stockItems;
      return this.stockItems.filter(p => p.categoryId === categoryId);
    },

    async loadProduits() {
      this.loadingP = true;
      try {
        const res = await $api("/products", { params: { per_page: 200 } });
        this.produits = res.data || [];
      } catch { this.produits = []; }
      finally { this.loadingP = false; }
    },

    async loadCategories() {
      this.loadingCat = true;
      try {
        const res = await $api("/categories", { params: { per_page: 200 } });
        this.categories = res.data || [];
      } catch { this.categories = []; }
      finally { this.loadingCat = false; }
    },

    openAddProduit() {
      this.produitForm = { id: null, nom: "", park_id: null, categorie: "", prix_vente: "", tva: "", vente_en_ligne: false, vente_sur_site: false };
      this.showProduitForm = true;
    },

    openEditProduit(p) {
      this.produitForm = {
        id:            p.id,
        nom:           p.nom || p.name || "",
        park_id:       p.parks?.[0]?.id ?? p.park_id ?? null,
        categorie:     p.category?.id ?? (typeof p.category === 'object' ? null : p.category) ?? p.categorie ?? "",
        prix_vente:    p.prix_vente ?? p.price ?? "",
        tva:           p.tva ?? "",
        vente_en_ligne: !!(p.vente_en_ligne || p.sale_options?.online),
        vente_sur_site: !!(p.vente_sur_site || p.sale_options?.onsite),
      };
      this.showProduitForm = true;
    },

    async saveProduit() {
      if (!this.produitForm.nom.trim()) {
        this.showAlert("warning", "Champ requis", "Le nom du produit est obligatoire."); return;
      }
      if (!this.produitForm.park_id) {
        this.showAlert("warning", "Champ requis", "Veuillez sélectionner un parc."); return;
      }
      if (!this.produitForm.categorie) {
        this.showAlert("warning", "Champ requis", "Veuillez sélectionner une catégorie."); return;
      }
      this.savingP = true;
      try {
        const { id, nom, park_id, categorie, prix_vente, vente_en_ligne, vente_sur_site } = this.produitForm;
        const fd = new FormData();
        fd.append("name",        nom);
        fd.append("price",       prix_vente !== "" ? prix_vente : 0);
        fd.append("parks[]",     park_id);
        fd.append("category_id", categorie);
        const saleOpts = { online: !!vente_en_ligne, onsite: !!vente_sur_site };
        if (id) {
          fd.append("_method", "PUT");
          await $api(`/products/${id}`, { method: "POST", body: fd });
          await $api(`/products/${id}/sale-options`, { method: "POST", body: saleOpts });
          this.showAlert("success", "Produit modifié", "Le produit a été mis à jour.");
        } else {
          const res = await $api("/products", { method: "POST", body: fd });
          const created = res.data || res;
          if (created?.id) {
            await $api(`/products/${created.id}/sale-options`, { method: "POST", body: saleOpts });
          }
          this.showAlert("success", "Produit ajouté", "Le produit a été créé avec succès.");
        }
        this.showProduitForm = false;
        this.loadProduits();
      } catch (err) {
        this.showAlert("warning", "Erreur", err?.data?.message || "Impossible d'enregistrer le produit.");
      } finally { this.savingP = false; }
    },

    async openDeleteProduit(p) {
      if (!confirm(`Supprimer le produit "${p.nom || p.name}" ?`)) return;
      try {
        await $api(`/products/${p.id}`, { method: "DELETE" });
        this.produits = this.produits.filter(x => x.id !== p.id);
        this.showAlert("success", "Produit supprimé", "Le produit a été supprimé.");
      } catch {
        this.showAlert("warning", "Erreur", "Impossible de supprimer ce produit.");
      }
    },

    openAddCategorie() {
      this.categorieForm = { id: null, nom: "" };
      this.showCategorieForm = true;
    },

    openEditCategorie(cat) {
      this.categorieForm = { id: cat.id, nom: cat.nom || cat.name || "" };
      this.showCategorieForm = true;
    },

    async saveCategorie() {
      if (!this.categorieForm.nom.trim()) {
        this.showAlert("warning", "Champ requis", "Le nom de la catégorie est obligatoire."); return;
      }
      this.savingCat = true;
      try {
        if (this.categorieForm.id) {
          await $api(`/categories/${this.categorieForm.id}`, { method: "PUT", body: { name: this.categorieForm.nom } });
          this.showAlert("success", "Catégorie modifiée", "La catégorie a été mise à jour.");
        } else {
          await $api("/categories", { method: "POST", body: { name: this.categorieForm.nom } });
          this.showAlert("success", "Catégorie ajoutée", "La catégorie a été créée avec succès.");
        }
        this.showCategorieForm = false;
        this.loadCategories();
      } catch (err) {
        this.showAlert("warning", "Erreur", err?.data?.message || "Impossible d'enregistrer la catégorie.");
      } finally { this.savingCat = false; }
    },

    async openDeleteCategorie(cat) {
      if (!confirm(`Supprimer la catégorie "${cat.nom || cat.name}" ?`)) return;
      try {
        await $api(`/categories/${cat.id}`, { method: "DELETE" });
        this.categories = this.categories.filter(x => x.id !== cat.id);
        this.showAlert("success", "Catégorie supprimée", "La catégorie a été supprimée.");
      } catch {
        this.showAlert("warning", "Erreur", "Impossible de supprimer cette catégorie.");
      }
    },

    async loadFournisseurs() {
      this.loadingF = true;
      try {
        const params = {};
        if (this.fFilters.park_id) params.park_id = this.fFilters.park_id;
        const res = await $api("/suppliers", { params: { ...params, per_page: 200 } });
        this.fournisseurs = res.data || [];
      } catch { this.fournisseurs = []; }
      finally { this.loadingF = false; }
    },

    async loadCommandes() {
      this.loadingC = true;
      try {
        const params = { per_page: 200 };
        if (this.cFilters.park_id)     params.park_id = this.cFilters.park_id;
        if (this.cFilters.status)      params.status  = this.cFilters.status;
        const res = await $api("/supplier-orders", { params });
        this.commandes = res.data || [];
      } catch { this.commandes = []; }
      finally { this.loadingC = false; }
    },

    // ── Fournisseur CRUD ──
    openNewFournisseur() {
      if (this.fForm.logoPreview?.startsWith('blob:')) URL.revokeObjectURL(this.fForm.logoPreview);
      this.fForm = { id: null, name: "", contactName: "", emails: [""], phones: [""], adresse: "", park_ids: [], logo: null, logoPreview: null };
      this.showNewF = true;
    },
    resetFLogo() {
      if (this.fForm.logoPreview?.startsWith('blob:')) URL.revokeObjectURL(this.fForm.logoPreview);
      this.fForm.logo = null; this.fForm.logoPreview = null;
      if (this.$refs.fLogoInput) this.$refs.fLogoInput.value = "";
    },
    onFLogoChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      if (this.fForm.logoPreview?.startsWith('blob:')) URL.revokeObjectURL(this.fForm.logoPreview);
      this.fForm.logo = file;
      this.fForm.logoPreview = URL.createObjectURL(file);
    },
    dropFLogo(e) {
      const file = e.dataTransfer.files[0];
      if (!file) return;
      if (this.fForm.logoPreview?.startsWith('blob:')) URL.revokeObjectURL(this.fForm.logoPreview);
      this.fForm.logo = file;
      this.fForm.logoPreview = URL.createObjectURL(file);
    },
    confirmNewF() {
      if (!this.fForm.name.trim()) { this.showAlert("warning", "Champ requis", "Le nom du fournisseur est obligatoire."); return; }
      if (!this.fForm.park_ids.length) { this.showAlert("warning", "Champ requis", "Veuillez sélectionner au moins un parc."); return; }
      this.showConfirmF = true;
    },
    async doCreateF() {
      this.showConfirmF = false;
      const isUpdate = !!this.fForm.id;
      try {
        const fd = new FormData();
        fd.append("name", this.fForm.name);
        if (this.fForm.contactName) fd.append("contact_name", this.fForm.contactName);
        this.fForm.emails.filter(e => e.trim()).forEach((e, i) => fd.append(`emails[${i}]`, e));
        this.fForm.phones.filter(p => p.trim()).forEach((p, i) => fd.append(`phones[${i}]`, p));
        fd.append("address", this.fForm.adresse);
        this.fForm.park_ids.forEach((id, i) => fd.append(`parks[${i}]`, id));
        if (this.fForm.logo instanceof File) fd.append("image", this.fForm.logo);

        if (isUpdate) {
          fd.append("_method", "PUT");
          await $api(`/suppliers/${this.fForm.id}`, { method: "POST", body: fd });
          this.showAlert("success", "Fournisseur modifié", "Le fournisseur a été mis à jour avec succès.");
        } else {
          await $api("/suppliers", { method: "POST", body: fd });
          this.showAlert("success", "Fournisseur créé", "Le fournisseur a été ajouté avec succès.");
        }
        this.showNewF = false;
        this.loadFournisseurs();
      } catch (err) {
        this.showAlert("warning", "Erreur", err?.data?.message || (isUpdate ? "Impossible de modifier le fournisseur." : "Impossible de créer le fournisseur."));
      }
    },
    openEditF(f) {
      if (this.fForm.logoPreview?.startsWith('blob:')) URL.revokeObjectURL(this.fForm.logoPreview);
      this.fForm = {
        id: f.id,
        name:        f.name                                           || "",
        contactName: f.contact_person || f.contact_name || f.contactName || "",
        emails:      f.emails?.length ? [...f.emails]  : [""],
        phones:      f.phones?.length ? [...f.phones]  : [""],
        adresse:     f.address        || f.adresse     || "",
        park_ids:    f.parks?.map(p => p.id)           || [],
        logo: null,
        logoPreview: f.image_url || null,
      };
      this.showNewF = true;
    },
    openDeleteF(f) {
      this.deletingF = f;
      this.showDeleteF = true;
    },
    async doDeleteF() {
      this.showDeleteF = false;
      try {
        await $api(`/suppliers/${this.deletingF.id}`, { method: "DELETE" });
        this.showAlert("success", "Fournisseur supprimé", "Le fournisseur a été supprimé.");
        this.loadFournisseurs();
      } catch {
        this.showAlert("warning", "Erreur", "Impossible de supprimer ce fournisseur.");
      }
    },
    toggleSelectAll() {
      if (this.selectAll) {
        this.selectedF = this.fournisseurs.map(f => f.id);
      } else {
        this.selectedF = [];
      }
    },
    exportFournisseurs() {
      this.showAlert("success", "Export", "L'export des fournisseurs est en cours...");
    },

    // ── Commande CRUD ──
    openNewCommande() {
      this.cStep = 1;
      this.cForm = { supplier_id: "", delivery_date: "", payment_method: "", park_id: "", notes: "", items: [{ category: null, product_id: "", quantity: 1, price: 0 }] };
      this.showNewC = true;
    },
    confirmNewC() {
      const validItems = this.cForm.items.filter(i => i.product_id);
      if (!this.cForm.supplier_id) { this.showAlert("warning", "Champ requis", "Veuillez sélectionner un fournisseur."); return; }
      if (!this.cForm.park_id) { this.showAlert("warning", "Champ requis", "Veuillez sélectionner un parc."); return; }
      if (validItems.length === 0) { this.showAlert("warning", "Produits manquants", "Ajoutez au moins un produit à la commande."); return; }
      this.showConfirmC = true;
    },
    async doCreateC() {
      this.showConfirmC = false;
      try {
        const body = {
          supplier_id:            this.cForm.supplier_id,
          expected_delivery_date: this.cForm.delivery_date  || undefined,
          park_ids:               this.cForm.park_id ? [this.cForm.park_id] : [],
          parks:                  this.cForm.park_id ? [this.cForm.park_id] : [],
          notes:                  this.cForm.notes          || undefined,
          payment_method:         this.cForm.payment_method || undefined,
          items: this.cForm.items.filter(i => i.product_id).map(i => ({
            product_id: i.product_id,
            quantity:   Number(i.quantity),
            unit_price: Number(i.price),
            price:      Number(i.price),
          })),
        };
        await $api(`/suppliers/${this.cForm.supplier_id}/orders`, { method: "POST", body });
        this.showNewC = false;
        this.showAlert("success", "Commande créée", "La commande a été créée avec succès.");
        this.loadCommandes();
      } catch (err) {
        this.showAlert("warning", "Erreur", err?.data?.message || "Impossible de créer la commande.");
      }
    },
    openCancelC(c) {
      this.cancelingC = c;
      this.showCancelC = true;
    },
    openCancelFromDetail() {
      this.cancelingC = this.detailsC;
      this.showDetailsC = false;
      this.showCancelC = true;
    },
    async doCancelC() {
      this.showCancelC = false;
      try {
        await $api(`/suppliers/${this.cancelingC.supplier?.id}/orders/${this.cancelingC.id}/change-status`, { method: "PATCH", body: { status: 'cancelled' } });
        this.showAlert("success", "Commande annulée", "La commande a été annulée.");
        this.loadCommandes();
      } catch {
        this.showAlert("warning", "Erreur", "Impossible d'annuler cette commande.");
      }
    },
    async openDetailsC(c) {
      const supplierId = c.supplier?.id || c.supplier_id;
      const localSupplier = this.fournisseurs.find(f => f.id === supplierId);
      const localPark = this.parkOptions.find(p => p.id === (c.parks?.[0]?.id || c.park_id));

      this.detailsC = {
        ...c,
        supplier_name: c.supplier_name || c.supplier?.name || localSupplier?.name,
        parks: c.parks?.length ? c.parks : (localPark ? [localPark] : []),
      };
      this.detailTab = "info";
      this.detailNotesExpanded = false;
      this.showDetailsC = true;

      if (!supplierId) return;
      try {
        const res = await $api(`/suppliers/${supplierId}/orders/${c.id}`);
        const detail = res.data || res;
        this.detailsC = {
          ...detail,
          supplier_name: detail.supplier_name || detail.supplier?.name || localSupplier?.name || this.detailsC.supplier_name,
          parks: detail.parks?.length ? detail.parks : this.detailsC.parks,
          created_at: detail.created_at || detail.date || detail.order_date || c.created_at || detail.expected_delivery_date || c.expected_delivery_date,
        };
      } catch { /* silent */ }
    },
    async changeStatusC(c, status) {
      try {
        await $api(`/suppliers/${c.supplier?.id}/orders/${c.id}/change-status`, { method: "PATCH", body: { status } });
        this.showAlert("success", "Statut mis à jour", `La commande a été marquée "${this.statusLabel(status)}".`);
        this.loadCommandes();
      } catch {
        this.showAlert("warning", "Erreur", "Impossible de changer le statut de la commande.");
      }
    },
    exportCommandes() {
      this.showAlert("success", "Export", "L'export des commandes est en cours...");
    },

    // ── Utils ──
    parkName(id) {
      const p = this.parkOptions.find(p => p.id === id);
      return p ? p.name : (id || "—");
    },
    supplierName(id) {
      if (!id) return null;
      const f = this.fournisseurs.find(f => f.id === id);
      return f ? f.name : null;
    },
    formatDate(d) {
      if (!d) return "—";
      try { return new Date(d).toLocaleDateString("fr-FR"); } catch { return d; }
    },
    formatMoney(v) {
      if (v == null) return "0.00";
      return Number(v).toFixed(2);
    },
    statusLabel(s) {
      const map = { pending: "En attente", processing: "En cours", shipped: "Expédiée", delivered: "Livrée", cancelled: "Annulée" };
      return map[s] || s || "—";
    },
    statusClass(s) {
      const map = { pending: "status-pending", processing: "status-pending", shipped: "status-shipped", delivered: "status-delivered", cancelled: "status-cancelled" };
      return map[s] || "status-pending";
    },
    showAlert(type, title, sub) {
      clearTimeout(this.alertTimer);
      this.alertType = type;
      this.alertTitle = title;
      this.alertSub = sub;
      this.alertVisible = true;
      this.alertTimer = setTimeout(() => { this.alertVisible = false; }, 5000);
    },
  },
};
</script>

<style scoped>
/* ══ Nouveau Fournisseur Modal ══ */
.nf-header {
  display: flex; align-items: center; gap: 10px;
  padding: 18px 22px 14px; border-bottom: 1px solid #f0f0f0;
}
.nf-back-btn {
  background: none; border: none; cursor: pointer;
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: #1a1a2e; border: 1.5px solid #e0e0e0;
}
.nf-title { font-size: 16px; font-weight: 700; color: #1a1a2e; }

.nf-body { padding: 20px 22px !important; }

.nf-img-zone {
  width: 100%; height: 110px;
  background: #f5f5f5; border: 1.5px solid #e0e0e0;
  border-radius: 10px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; margin-bottom: 8px;
}
.nf-img-placeholder { width: 100%; height: 100%; background: #f0f0f0; }
.nf-img-preview { width: 100%; height: 100%; object-fit: cover; }
.nf-img-hint { font-size: 11px; color: #9e9e9e; margin: 0 0 10px; }

.nf-img-btns { display: flex; gap: 10px; margin-bottom: 16px; }
.nf-btn-reset {
  flex: 0 0 auto; height: 38px; padding: 0 16px;
  background: #3d3520; color: #fff; border: none;
  border-radius: 8px; font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: inherit;
}
.nf-btn-upload {
  flex: 1; height: 38px; padding: 0 16px;
  background: #E8A838; color: #fff; border: none;
  border-radius: 8px; font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: inherit;
}

.nf-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}
.nf-label { font-size: 12px; font-weight: 600; color: #444; margin: 0 0 5px; }
.nf-input {
  width: 100%; height: 38px; padding: 0 12px;
  border: 1.5px solid #e0e0e0; border-radius: 8px;
  font-size: 13px; color: #333; background: #fff;
  outline: none; font-family: inherit; box-sizing: border-box;
  transition: border-color .15s;
}
.nf-input:focus { border-color: #1a1a2e; }
.nf-input--icon { padding-right: 36px; }

.nf-input-wrap { position: relative; }
.nf-input-icon {
  position: absolute; right: 10px; top: 50%;
  transform: translateY(-50%); color: #888; pointer-events: none;
}

.nf-select-wrap { position: relative; }
.nf-select {
  width: 100%; height: 38px; padding: 0 32px 0 12px;
  border: 1.5px solid #e0e0e0; border-radius: 8px;
  font-size: 13px; color: #333; background: #fff;
  outline: none; font-family: inherit;
  appearance: none; cursor: pointer; box-sizing: border-box;
}
.nf-select:focus { border-color: #1a1a2e; }
.nf-select-icon {
  position: absolute; right: 10px; top: 50%;
  transform: translateY(-50%); color: #888; pointer-events: none;
}

.nf-add-link {
  display: inline-flex; align-items: center;
  background: none; border: none; cursor: pointer;
  color: #E8A838; font-size: 12px; font-weight: 600;
  padding: 4px 0; font-family: inherit; margin-top: 4px;
}

.nf-footer {
  padding: 12px 22px 18px; border-top: 1px solid #f0f0f0;
}
.nf-submit-btn {
  width: 100%; height: 46px; border-radius: 10px;
  background: #1a1a2e; color: #fff; border: none;
  font-size: 15px; font-weight: 700; cursor: pointer;
  font-family: inherit;
}

/* ── Page title ── */
.page-title { font-size: 22px; font-weight: 700; color: #1a1a2e; }

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

/* ── Inner tabs (commande details) ── */
.f-inner-tab {
  padding: 12px 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  background: none;
  color: #9e9e9e;
  border-bottom: 3px solid transparent;
  margin-bottom: -1px;
  transition: all .2s;
  font-family: inherit;
}
.f-inner-tab.active { color: #1a1a2e; border-bottom-color: #1a1a2e; }

/* ── Filter ── */
.f-filter-label { font-size: 13px; font-weight: 600; color: #555; }
.f-apply-btn {
  height: 38px;
  padding: 0 20px;
  background: #E8A838;
  color: #1a1a2e;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity .2s;
}
.f-apply-btn:hover { opacity: .85; }

/* ── Section title ── */
.f-section-title { font-size: 16px; font-weight: 700; color: #1a1a2e; }

/* ── Buttons ── */
.f-export-btn {
  height: 38px;
  padding: 0 16px;
  background: #fff;
  color: #1a1a2e;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
}
.f-create-btn {
  height: 38px;
  padding: 0 16px;
  background: #E8A838;
  color: #1a1a2e;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
}
.f-icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: none;
  background: #f5f5f5;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background .15s;
}
.f-icon-btn:hover { background: #eee; }

/* ── Table ── */
.f-table { width: 100%; border-collapse: collapse; }
.f-table th {
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  color: #9e9e9e;
  letter-spacing: .5px;
  padding: 10px 12px;
  border-bottom: 1.5px solid #f0f0f0;
  white-space: nowrap;
}
.f-table td {
  padding: 11px 12px;
  border-bottom: 1px solid #f5f5f5;
  vertical-align: middle;
  font-size: 13px;
}
.f-table tr:last-child td { border-bottom: none; }
.f-table tr:hover td { background: #fafafa; }

/* ── Table content ── */
.f-supplier-name { font-size: 14px; font-weight: 600; color: #1a1a2e; }
.f-supplier-sub { font-size: 12px; color: #9e9e9e; margin-top: 2px; }
.f-contact-item { font-size: 12px; color: #555; display: flex; align-items: center; margin-bottom: 2px; }
.f-logo-wrap { width: 40px; height: 40px; border-radius: 8px; overflow: hidden; border: 1px solid #f0f0f0; }
.f-logo-img { width: 100%; height: 100%; object-fit: contain; }
.f-logo-placeholder { width: 40px; height: 40px; border-radius: 8px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; }
.f-parcs-list { display: flex; flex-wrap: wrap; gap: 4px; }
.f-parc-badge { font-size: 11px; background: #f0f0f0; color: #555; border-radius: 4px; padding: 2px 7px; }

/* ── Status chips ── */
.f-status-chip { font-size: 11px; font-weight: 700; border-radius: 20px; padding: 3px 10px; display: inline-block; }
.status-pending { background: #FFF8E7; color: #E8A838; }
.status-shipped { background: #E3F2FD; color: #1565C0; }
.status-delivered { background: #E8F5E9; color: #2E7D32; }
.status-cancelled { background: #FDECEA; color: #e53935; }

/* ── Modal form elements ── */
.f-field-label { font-size: 12px; font-weight: 600; color: #555; margin-bottom: 6px; }
.f-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  font-size: 13px;
  color: #333;
  background: #fff;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color .2s;
}
.f-input:focus { border-color: #1a1a2e; }
.f-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  font-size: 13px;
  color: #333;
  background: #fff;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  resize: vertical;
  transition: border-color .2s;
}
.f-textarea:focus { border-color: #1a1a2e; }

/* ── Upload zone ── */
.f-upload-zone {
  border: 2px dashed #e0e0e0;
  border-radius: 10px;
  padding: 20px;
  cursor: pointer;
  text-align: center;
  background: #fafafa;
  transition: border-color .2s;
  min-height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.f-upload-zone:hover { border-color: #E8A838; }
.f-upload-text { font-size: 13px; font-weight: 600; color: #555; margin-top: 8px; }
.f-upload-sub { font-size: 11px; color: #bbb; margin-top: 3px; }
.f-reset-btn {
  height: 34px;
  padding: 0 14px;
  background: #4A3526;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
.f-upload-btn {
  height: 34px;
  padding: 0 14px;
  background: #E8A838;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
.f-add-field-btn {
  height: 34px;
  padding: 0 14px;
  background: #f5f5f5;
  color: #555;
  border: 1.5px dashed #ccc;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
}
.f-remove-btn {
  width: 34px;
  height: 40px;
  background: #FDECEA;
  color: #e53935;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.f-checkbox-group { display: flex; flex-direction: column; gap: 8px; }
.f-check-item { display: flex; align-items: center; font-size: 13px; color: #333; cursor: pointer; }
.f-submit-btn {
  width: 100%;
  height: 44px;
  background: #1a1a2e;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: opacity .2s;
}
.f-submit-btn:hover { opacity: .85; }
.f-back-btn {
  height: 44px;
  padding: 0 20px;
  background: #f5f5f5;
  color: #555;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

/* ── Details modal ── */
.d-row { display: flex; gap: 12px; }
.d-label { font-size: 12px; font-weight: 600; color: #9e9e9e; min-width: 140px; padding-top: 2px; }
.d-value { font-size: 13px; color: #333; flex: 1; }

/* ── Alert banner ── */
.f-alert-banner {
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 16px;
}
.f-alert-success { background: #E8F5E9; border-left: 4px solid #43A047; }
.f-alert-warning { background: #FFF8E7; border-left: 4px solid #E8A838; }
.f-alert-inner { display: flex; align-items: flex-start; gap: 10px; }
.f-alert-icon { flex-shrink: 0; margin-top: 1px; }
.f-alert-success .f-alert-icon { color: #43A047 !important; }
.f-alert-warning .f-alert-icon { color: #E8A838 !important; }
.f-alert-body { flex: 1; }
.f-alert-title { font-size: 13px; font-weight: 700; color: #1a1a2e; }
.f-alert-sub { font-size: 12px; color: #666; margin-top: 2px; }
.f-alert-close { background: none; border: none; cursor: pointer; color: #9e9e9e; padding: 0; margin-left: auto; }

/* ── Slide-down transition ── */
.slide-down-enter-active, .slide-down-leave-active { transition: all .3s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-10px); }

/* ── Produits/Catégories nav bar ── */
.pc-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.pc-tabs    { display: flex; gap: 8px; flex-wrap: wrap; }
.pc-actions { display: flex; gap: 8px; flex-wrap: wrap; }

/* ── Produits/Catégories sub-tabs ── */
.f-sub-tab-btn {
  display: inline-flex; align-items: center;
  padding: 8px 18px; border-radius: 8px;
  border: 1.5px solid #e0e0e0; background: #fff;
  font-size: 13px; font-weight: 600; color: #555;
  cursor: pointer; transition: all 0.15s; font-family: inherit;
  white-space: nowrap;
}
.f-sub-tab-btn:hover { border-color: #1a1a2e; color: #1a1a2e; }
.f-sub-tab-btn--active { background: #1a1a2e; border-color: #1a1a2e; color: #fff; }

/* ── Responsive table container ── */
.f-responsive-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.f-responsive-wrap .f-table { min-width: 600px; }

/* ── Bool chips (Oui / Non) ── */
.f-bool-chip {
  display: inline-block; padding: 2px 10px;
  border-radius: 20px; font-size: 11px; font-weight: 700;
  white-space: nowrap;
}
.f-bool-yes { background: #E8F5E9; color: #2E7D32; }
.f-bool-no  { background: #f5f5f5; color: #9e9e9e; }

/* ── Responsive breakpoints ── */
@media (max-width: 600px) {
  .pc-nav-bar    { flex-direction: column; align-items: flex-start; }
  .pc-actions    { width: 100%; }
  .pc-actions .f-create-btn,
  .pc-actions .f-export-btn { flex: 1; justify-content: center; }
  .f-table th, .f-table td  { padding: 8px; font-size: 12px; }
}
</style>
