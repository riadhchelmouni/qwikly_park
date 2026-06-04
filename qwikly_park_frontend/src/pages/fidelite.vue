<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="fl-title">Fidélité & Codes Promo</h1>
      <p class="fl-sub">Gérez les offres fidélité et les codes promotionnels</p>
    </div>

    <!-- Tabs -->
    <VCard class="mb-6" elevation="0" border>
      <VCardText class="pa-0">
        <div class="tab-bar">
          <button v-for="tab in tabs" :key="tab.key"
            class="tab-btn" :class="activeTab===tab.key?'tab-btn--active':'tab-btn--inactive'"
            @click="activeTab=tab.key">
            <VIcon :icon="tab.icon" size="16" class="me-2"/>{{ tab.label }}
          </button>
        </div>
      </VCardText>
    </VCard>

    <!-- ══ PROGRAMME FIDÉLITÉ ══ -->
    <div v-if="activeTab==='fidelite'">

      <!-- KPIs -->
      <VRow class="mb-5">
        <VCol cols="12" sm="6" md="3" v-for="k in kpis" :key="k.key">
          <VCard elevation="0" border style="border-radius:12px">
            <VCardText class="pa-4">
              <div class="d-flex align-center gap-3">
                <div class="fl-kpi-icon" :style="`background:${k.bg}`">
                  <VIcon :icon="k.icon" :color="k.color" size="20"/>
                </div>
                <div>
                  <div class="fl-kpi-val">{{ loadingOffers ? '…' : k.value }}</div>
                  <div class="fl-kpi-lbl">{{ k.label }}</div>
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Toolbar -->
      <VCard elevation="0" border style="border-radius:12px" class="mb-4">
        <VCardText class="pa-4">
          <div class="d-flex align-center gap-3 flex-wrap">
            <VTextField
              v-model="offerSearch"
              placeholder="Rechercher une offre…"
              prepend-inner-icon="tabler-search"
              hide-details clearable density="compact"
              style="min-width:220px;max-width:300px"
            />
            <VSelect
              v-model="offerFilterStatus"
              :items="[{title:'Tous',value:''},{title:'Actif',value:'actif'},{title:'Inactif',value:'inactif'}]"
              item-title="title" item-value="value"
              density="compact" variant="outlined" hide-details
              style="min-width:140px;max-width:160px"
            />
            <VSpacer/>
            <VBtn
              elevation="0"
              style="background:#1a1a2e;color:#fff;border-radius:10px;font-weight:700"
              @click="openCreateOffer"
            >
              <VIcon icon="tabler-plus" size="16" class="me-2"/>Nouvelle offre
            </VBtn>
          </div>
        </VCardText>
      </VCard>

      <!-- Loading -->
      <div v-if="loadingOffers" class="d-flex justify-center align-center pa-10">
        <VProgressCircular indeterminate color="#E8A838" size="32"/>
      </div>

      <!-- Empty -->
      <VCard v-else-if="!filteredOffers.length" elevation="0" border style="border-radius:12px">
        <VCardText class="pa-10 text-center">
          <VIcon icon="tabler-gift-off" size="48" style="color:#d0d0d0;margin-bottom:12px;display:block"/>
          <div style="font-weight:700;font-size:15px;color:#1a1a2e;margin-bottom:6px">
            {{ offerSearch || offerFilterStatus ? 'Aucun résultat' : 'Aucune offre fidélité' }}
          </div>
          <div style="font-size:13px;color:#9e9e9e;margin-bottom:16px">
            {{ offerSearch || offerFilterStatus ? 'Modifiez vos filtres' : 'Créez votre première offre que les clients pourront acheter avec leurs points' }}
          </div>
          <VBtn v-if="!offerSearch && !offerFilterStatus"
            elevation="0"
            style="background:#1a1a2e;color:#fff;border-radius:10px;font-weight:700"
            @click="openCreateOffer">
            <VIcon icon="tabler-plus" size="16" class="me-2"/>Créer une offre
          </VBtn>
        </VCardText>
      </VCard>

      <!-- Offers Grid -->
      <VRow v-else>
        <VCol
          v-for="offer in filteredOffers" :key="offer.id"
          cols="12" sm="6" md="6" lg="4"
        >
          <VCard elevation="0" border style="border-radius:12px;overflow:hidden;display:flex;flex-direction:column;height:100%">
            <!-- Image area -->
            <div style="position:relative;height:140px;background:#f5f5f5;flex-shrink:0">
              <img
                v-if="offer.image_url"
                :src="offer.image_url"
                style="width:100%;height:100%;object-fit:cover"
                :alt="offer.name"
              />
              <div v-else class="d-flex align-center justify-center" style="height:100%">
                <VIcon icon="tabler-gift" size="44" style="color:#d0d0d0"/>
              </div>

              <!-- Status badge -->
              <div style="position:absolute;top:8px;right:8px">
                <span :style="`padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;
                  background:${offer.is_active ? '#e8f5e9' : '#f5f5f5'};
                  color:${offer.is_active ? '#2e7d32' : '#9e9e9e'}`">
                  {{ offer.is_active ? 'Actif' : 'Inactif' }}
                </span>
              </div>

              <!-- Points cost badge -->
              <div style="position:absolute;bottom:8px;left:8px;background:rgba(26,26,46,0.9);color:#fff;border-radius:8px;padding:4px 11px;font-size:13px;font-weight:700;display:flex;align-items:center;gap:4px">
                <VIcon icon="tabler-star" size="12" style="color:#E8A838"/>
                {{ offer.points_cost }} pts
              </div>
            </div>

            <!-- Content -->
            <VCardText class="pa-4" style="flex:1;display:flex;flex-direction:column">
              <div style="font-weight:700;font-size:14px;color:#1a1a2e;margin-bottom:4px;line-height:1.35">
                {{ offer.name }}
              </div>
              <div
                v-if="offer.description"
                style="font-size:12px;color:#9e9e9e;margin-bottom:10px;line-height:1.5;flex:1;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical"
              >
                {{ offer.description }}
              </div>
              <div v-else style="flex:1;margin-bottom:10px"/>

              <!-- Meta -->
              <div class="d-flex flex-wrap gap-x-3 gap-y-1 mb-3" style="font-size:11px;color:#555">
                <div class="d-flex align-center gap-1">
                  <VIcon icon="tabler-package" size="12" style="color:#9e9e9e"/>
                  Stock:
                  <strong style="color:#1a1a2e">{{ offer.remaining_stock === null ? '∞' : offer.remaining_stock }}</strong>
                  <span style="color:#bbb"> / {{ offer.stock === null ? '∞' : offer.stock }}</span>
                </div>
                <div class="d-flex align-center gap-1">
                  <VIcon icon="tabler-shopping-cart" size="12" style="color:#9e9e9e"/>
                  Rachats: <strong style="color:#1a1a2e">{{ offer.redeemed_count }}</strong>
                </div>
                <div v-if="offer.expires_at" class="d-flex align-center gap-1">
                  <VIcon icon="tabler-calendar-x" size="12" style="color:#e53935"/>
                  <span style="color:#e53935">Exp: {{ fmtDate(offer.expires_at) }}</span>
                </div>
              </div>

              <!-- Out of stock warning -->
              <div v-if="offer.remaining_stock === 0"
                style="background:#fff3e0;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:600;color:#e65100;margin-bottom:10px;display:flex;align-items:center;gap:5px">
                <VIcon icon="tabler-alert-triangle" size="12"/>Épuisé
              </div>

              <!-- Actions -->
              <div class="d-flex align-center gap-1">
                <VBtn
                  size="x-small" variant="outlined"
                  style="border-color:#1a1a2e;color:#1a1a2e;font-size:11px;font-weight:600"
                  @click="viewRedemptions(offer)"
                >
                  <VIcon icon="tabler-list" size="12" class="me-1"/>Rachats
                </VBtn>
                <VSpacer/>
                <IconBtn size="small" style="color:#555" @click="openEditOffer(offer)">
                  <VIcon icon="tabler-pencil" size="15"/>
                  <VTooltip activator="parent" location="top">Modifier</VTooltip>
                </IconBtn>
                <IconBtn
                  size="small"
                  :style="`color:${offer.is_active ? '#E8A838' : '#4CAF50'}`"
                  @click="toggleOfferStatus(offer)"
                >
                  <VIcon :icon="offer.is_active ? 'tabler-pause' : 'tabler-player-play'" size="15"/>
                  <VTooltip activator="parent" location="top">{{ offer.is_active ? 'Désactiver' : 'Activer' }}</VTooltip>
                </IconBtn>
                <IconBtn size="small" style="color:#e53935" @click="deleteOffer(offer)">
                  <VIcon icon="tabler-trash" size="15"/>
                  <VTooltip activator="parent" location="top">Supprimer</VTooltip>
                </IconBtn>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </div>

    <!-- ══ CODES PROMO ══ -->
    <div v-else-if="activeTab==='promo'">

      <!-- Toolbar -->
      <VCard elevation="0" border style="border-radius:12px" class="mb-4">
        <VCardText class="pa-4">
          <div class="d-flex align-center gap-3">
            <VTextField v-model="promoSearch" placeholder="Rechercher un code…" prepend-inner-icon="tabler-search"
              hide-details clearable density="compact" class="flex-grow-1"/>
            <VSelect v-model="promoFilterStatut"
              :items="[{title:'Tous',value:''},{title:'Actif',value:'actif'},{title:'Inactif',value:'inactif'},{title:'Expiré',value:'expire'}]"
              item-title="title" item-value="value"
              density="compact" variant="outlined" hide-details style="min-width:140px;max-width:160px"/>
            <button class="fl-export-btn" @click="exportPromos">
              <VIcon icon="tabler-download" size="14" class="me-1"/>Export
            </button>
            <VBtn style="background:#1a1a2e;color:#fff;border-radius:8px;font-size:13px" size="small"
              elevation="0" @click="openCreatePromo">
              <VIcon icon="tabler-plus" size="15" class="me-1"/>Nouveau code
            </VBtn>
          </div>
        </VCardText>
      </VCard>

      <!-- Table codes promo -->
      <VCard elevation="0" border style="border-radius:12px">
        <VCardText class="pa-0">
          <VTable>
            <thead>
              <tr>
                <th>CODE</th><th>REMISE</th><th>TYPE</th><th>UTILISATIONS</th>
                <th>EXPIRE LE</th><th>STATUT</th><th>ACTIONS</th>
              </tr>
            </thead>
            <tbody v-if="loadingPromos">
              <tr><td colspan="7" class="text-center py-6"><VProgressCircular indeterminate color="#E8A838" size="24"/></td></tr>
            </tbody>
            <tbody v-else-if="!filteredPromos.length">
              <tr><td colspan="7" class="text-center py-6" style="color:#9e9e9e;font-size:13px">Aucun code promo</td></tr>
            </tbody>
            <tbody v-else>
              <tr v-for="p in filteredPromos" :key="p.id">
                <td>
                  <div class="fl-code-badge">{{ p.code }}</div>
                </td>
                <td style="font-weight:700;font-size:14px;color:#1a1a2e">
                  {{ p.type_remise==='pourcentage' ? p.valeur+'%' : p.valeur+' €' }}
                </td>
                <td style="font-size:13px">{{ p.type_remise==='pourcentage' ? 'Pourcentage' : 'Montant fixe' }}</td>
                <td>
                  <div style="font-size:13px">{{ p.utilisations_actuelles || 0 }} / {{ p.max_utilisations || '∞' }}</div>
                  <div style="height:4px;background:#f0f0f0;border-radius:2px;margin-top:4px;min-width:60px">
                    <div :style="`height:100%;background:#E8A838;border-radius:2px;width:${p.max_utilisations ? Math.min(100, (p.utilisations_actuelles||0)/p.max_utilisations*100) : 0}%`"></div>
                  </div>
                </td>
                <td style="font-size:13px">{{ p.date_expiration ? fmtDate(p.date_expiration) : '—' }}</td>
                <td>
                  <VChip :color="getPromoStatutColor(p)" size="small">{{ getPromoStatutLabel(p) }}</VChip>
                </td>
                <td>
                  <div class="d-flex gap-1">
                    <IconBtn size="small" color="success" @click="openEditPromo(p)">
                      <VIcon icon="tabler-pencil" size="16"/>
                    </IconBtn>
                    <IconBtn size="small" :color="p.actif?'warning':'success'" @click="togglePromo(p)">
                      <VIcon :icon="p.actif?'tabler-pause':'tabler-player-play'" size="16"/>
                      <VTooltip activator="parent" location="top">{{ p.actif?'Désactiver':'Activer' }}</VTooltip>
                    </IconBtn>
                    <IconBtn size="small" color="error" @click="deletePromo(p)">
                      <VIcon icon="tabler-trash" size="16"/>
                    </IconBtn>
                  </div>
                </td>
              </tr>
            </tbody>
          </VTable>
        </VCardText>
      </VCard>

      <!-- Modal créer / modifier code promo -->
      <VDialog v-model="showPromoForm" max-width="520" persistent>
        <VCard style="border-radius:14px;overflow:hidden;display:flex;flex-direction:column;max-height:90vh">
          <div style="background:#1a1a2e;padding:16px 20px;display:flex;align-items:center;justify-content:space-between">
            <span style="color:#fff;font-weight:700;font-size:15px">{{ promoForm.id ? 'Modifier le code' : 'Nouveau code promo' }}</span>
            <button @click="showPromoForm=false" style="background:none;border:none;cursor:pointer;color:#fff">
              <VIcon icon="tabler-x" size="20"/>
            </button>
          </div>
          <VCardText class="pa-5" style="overflow-y:auto;flex:1">
            <VRow dense>
              <VCol v-if="!promoForm.id && !authStore.selectedParkId" cols="12">
                <div class="fl-label">Parc <span style="color:#e53935">*</span></div>
                <VSelect v-model="promoForm.park_id"
                  :items="parks" item-title="name" item-value="id"
                  :loading="loadingParks"
                  placeholder="Sélectionner un parc"
                  density="compact" variant="outlined" hide-details class="mb-3"/>
              </VCol>
              <VCol cols="12" md="8">
                <div class="fl-label">Code promo *</div>
                <div class="d-flex gap-2 mb-3">
                  <VTextField v-model="promoForm.code" density="compact" variant="outlined"
                    placeholder="Ex: SUMMER25" hide-details style="text-transform:uppercase"
                    @update:model-value="v => promoForm.code = v.toUpperCase()"/>
                  <VBtn variant="outlined" size="small" style="height:38px" @click="generateCode">
                    <VIcon icon="tabler-refresh" size="15"/>
                  </VBtn>
                </div>
              </VCol>
              <VCol cols="12" md="4">
                <div class="fl-label">Type de remise</div>
                <VSelect v-model="promoForm.type_remise"
                  :items="[{title:'Pourcentage %',value:'pourcentage'},{title:'Montant € fixe',value:'montant'}]"
                  item-title="title" item-value="value"
                  density="compact" variant="outlined" hide-details class="mb-3"/>
              </VCol>
              <VCol cols="12" md="6">
                <div class="fl-label">Valeur de la remise *</div>
                <VTextField v-model="promoForm.valeur" type="number" step="0.01"
                  density="compact" variant="outlined"
                  :placeholder="promoForm.type_remise==='pourcentage'?'Ex: 15':'Ex: 10.00'"
                  :suffix="promoForm.type_remise==='pourcentage'?'%':'€'"
                  hide-details class="mb-3"/>
              </VCol>
              <VCol cols="12" md="6">
                <div class="fl-label">Nombre max d'utilisations</div>
                <VTextField v-model="promoForm.max_utilisations" type="number"
                  density="compact" variant="outlined"
                  placeholder="Laisser vide = illimité" hide-details class="mb-3"/>
              </VCol>
              <VCol cols="12" md="6">
                <div class="fl-label">Date d'expiration</div>
                <VTextField v-model="promoForm.date_expiration" type="date"
                  density="compact" variant="outlined" hide-details class="mb-3"/>
              </VCol>
              <VCol cols="12" md="6">
                <div class="fl-label">Montant minimum d'achat (€)</div>
                <VTextField v-model="promoForm.min_achat" type="number" step="0.5"
                  density="compact" variant="outlined"
                  placeholder="Laisser vide = aucun" hide-details class="mb-3"/>
              </VCol>
              <!-- Applicable sur -->
              <VCol cols="12">
                <div class="fl-label mb-2">Applicable sur</div>
                <div class="d-flex gap-2 flex-wrap">
                  <button
                    v-for="opt in applicableSurOptions" :key="opt.value"
                    @click="promoForm.applicable_sur = promoForm.applicable_sur === opt.value ? '' : opt.value"
                    :style="`height:36px;padding:0 14px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;
                      border:1.5px solid ${promoForm.applicable_sur===opt.value ? '#1a1a2e' : '#e0e0e0'};
                      background:${promoForm.applicable_sur===opt.value ? '#1a1a2e' : '#fff'};
                      color:${promoForm.applicable_sur===opt.value ? '#fff' : '#555'}`"
                  >
                    <VIcon :icon="opt.icon" size="14" class="me-1"/>{{ opt.label }}
                  </button>
                </div>
                <div style="font-size:11px;color:#9e9e9e;margin-top:4px">Laisser vide = applicable sur tout</div>
              </VCol>

              <!-- Disponibilité -->
              <VCol cols="12">
                <div class="fl-label mb-2">Disponibilité</div>
                <div class="d-flex gap-4">
                  <label class="d-flex align-center gap-2" style="cursor:pointer;font-size:13px;color:#333">
                    <input type="checkbox" v-model="promoForm.disponibilite_online"
                      style="accent-color:#1a1a2e;cursor:pointer;width:16px;height:16px" />
                    Online
                  </label>
                  <label class="d-flex align-center gap-2" style="cursor:pointer;font-size:13px;color:#333">
                    <input type="checkbox" v-model="promoForm.disponibilite_sur_site"
                      style="accent-color:#1a1a2e;cursor:pointer;width:16px;height:16px" />
                    Sur site
                  </label>
                </div>
              </VCol>

              <VCol cols="12">
                <VCheckbox v-model="promoForm.actif" label="Code actif dès la création"
                  density="compact" hide-details color="#1a1a2e"/>
              </VCol>
            </VRow>
          </VCardText>
          <div style="padding:12px 20px 20px;display:flex;gap:10px;border-top:1px solid #f0f0f0;flex-shrink:0">
            <button @click="showPromoForm=false"
              style="flex:1;height:42px;border-radius:10px;border:2px solid #e0e0e0;background:#fff;color:#555;font-size:13px;font-weight:600;cursor:pointer">
              Annuler
            </button>
            <button @click="savePromo" :disabled="savingPromo"
              style="flex:2;height:42px;border-radius:10px;border:none;background:#1a1a2e;color:#fff;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">
              <VProgressCircular v-if="savingPromo" size="14" indeterminate color="#fff"/>
              <VIcon v-else icon="tabler-device-floppy" size="16"/>
              {{ promoForm.id ? 'Mettre à jour' : 'Créer le code' }}
            </button>
          </div>
        </VCard>
      </VDialog>
    </div>

    <!-- ══ DIALOG: OFFRE FIDÉLITÉ (Créer / Modifier) ══ -->
    <VDialog v-model="showOfferForm" max-width="560" persistent>
      <VCard style="border-radius:14px;overflow:hidden;display:flex;flex-direction:column;max-height:92vh">
        <div style="background:#1a1a2e;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
          <div>
            <div style="color:#fff;font-weight:700;font-size:15px">
              {{ offerForm.id ? 'Modifier l\'offre' : 'Nouvelle offre fidélité' }}
            </div>
            <div style="color:#E8A838;font-size:11px;margin-top:2px">
              Les clients pourront racheter cette offre avec leurs points
            </div>
          </div>
          <button @click="showOfferForm=false" style="background:none;border:none;cursor:pointer;color:#fff">
            <VIcon icon="tabler-x" size="20"/>
          </button>
        </div>

        <VCardText class="pa-5" style="overflow-y:auto;flex:1">
          <VRow dense>
            <!-- Park selector -->
            <VCol v-if="!offerForm.id && !authStore.selectedParkId" cols="12">
              <div class="fl-label">Parc <span style="color:#e53935">*</span></div>
              <VSelect
                v-model="offerForm.park_id"
                :items="parks" item-title="name" item-value="id"
                :loading="loadingParks"
                placeholder="Sélectionner un parc"
                density="compact" variant="outlined" hide-details class="mb-4"
              />
            </VCol>

            <!-- Name -->
            <VCol cols="12">
              <div class="fl-label">Nom de l'offre <span style="color:#e53935">*</span></div>
              <VTextField
                v-model="offerForm.name"
                density="compact" variant="outlined"
                placeholder="Ex: Pack Entrée + Dîner + Boissons"
                hide-details class="mb-4"
              />
            </VCol>

            <!-- Description -->
            <VCol cols="12">
              <div class="fl-label">Description</div>
              <VTextarea
                v-model="offerForm.description"
                density="compact" variant="outlined"
                placeholder="Décrivez ce que le client reçoit…"
                rows="3" hide-details class="mb-4"
              />
            </VCol>

            <!-- Points cost -->
            <VCol cols="12" md="6">
              <div class="fl-label">Coût en points <span style="color:#e53935">*</span></div>
              <VTextField
                v-model="offerForm.points_cost"
                type="number" min="1"
                density="compact" variant="outlined"
                placeholder="Ex: 500"
                suffix="pts"
                hide-details class="mb-4"
              />
            </VCol>

            <!-- Stock -->
            <VCol cols="12" md="6">
              <div class="fl-label">Stock disponible</div>
              <VTextField
                v-model="offerForm.stock"
                type="number" min="1"
                density="compact" variant="outlined"
                placeholder="Vide = illimité"
                hide-details class="mb-4"
              />
            </VCol>

            <!-- Expiry date -->
            <VCol cols="12" md="6">
              <div class="fl-label">Date d'expiration</div>
              <VTextField
                v-model="offerForm.expires_at"
                type="date"
                density="compact" variant="outlined"
                hide-details class="mb-4"
              />
            </VCol>

            <!-- Active -->
            <VCol cols="12" md="6" class="d-flex align-end pb-1">
              <VCheckbox
                v-model="offerForm.is_active"
                label="Offre active"
                density="compact" hide-details color="#1a1a2e"
                class="mb-4"
              />
            </VCol>

            <!-- Image upload -->
            <VCol cols="12">
              <div class="fl-label mb-2">Image de l'offre</div>
              <input
                ref="imageInput"
                type="file"
                accept="image/jpg,image/jpeg,image/png,image/webp"
                style="display:none"
                @change="handleImageChange"
              />
              <div v-if="offerForm.imagePreview" style="margin-bottom:10px;position:relative;display:inline-block">
                <img :src="offerForm.imagePreview" style="height:80px;border-radius:8px;object-fit:cover;border:1px solid #e0e0e0"/>
                <button
                  @click="removeImage"
                  style="position:absolute;top:-7px;right:-7px;background:#e53935;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;line-height:1">
                  ×
                </button>
              </div>
              <div>
                <VBtn variant="outlined" size="small" style="border-color:#1a1a2e;color:#1a1a2e" @click="$refs.imageInput.click()">
                  <VIcon icon="tabler-upload" size="14" class="me-1"/>
                  {{ offerForm.imagePreview ? 'Changer l\'image' : 'Ajouter une image' }}
                </VBtn>
                <span style="font-size:11px;color:#9e9e9e;margin-left:8px">JPG, PNG, WEBP — max 2 Mo</span>
              </div>
            </VCol>
          </VRow>
        </VCardText>

        <div style="padding:12px 20px 20px;display:flex;gap:10px;border-top:1px solid #f0f0f0;flex-shrink:0">
          <button
            @click="showOfferForm=false"
            style="flex:1;height:42px;border-radius:10px;border:2px solid #e0e0e0;background:#fff;color:#555;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">
            Annuler
          </button>
          <button
            @click="saveOffer"
            :disabled="savingOffer"
            style="flex:2;height:42px;border-radius:10px;border:none;background:#1a1a2e;color:#fff;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;font-family:inherit">
            <VProgressCircular v-if="savingOffer" size="14" indeterminate color="#fff"/>
            <VIcon v-else icon="tabler-device-floppy" size="16"/>
            {{ offerForm.id ? 'Mettre à jour' : 'Créer l\'offre' }}
          </button>
        </div>
      </VCard>
    </VDialog>

    <!-- ══ DIALOG: RACHATS ══ -->
    <VDialog v-model="showRedemptions" max-width="700" scrollable>
      <VCard style="border-radius:14px;overflow:hidden;display:flex;flex-direction:column;max-height:85vh">
        <div style="background:#1a1a2e;padding:16px 20px;display:flex;align-items:flex-start;justify-content:space-between;flex-shrink:0">
          <div>
            <div style="color:#fff;font-weight:700;font-size:15px">Rachats — {{ selectedOffer?.name }}</div>
            <div style="color:#E8A838;font-size:12px;margin-top:3px;display:flex;align-items:center;gap:5px">
              <VIcon icon="tabler-star" size="12"/>
              {{ selectedOffer?.points_cost }} pts par rachat
              <span style="color:#9e9e9e;margin-left:4px">·</span>
              <span style="color:#9e9e9e">{{ selectedOffer?.redeemed_count }} rachat(s) total</span>
            </div>
          </div>
          <button @click="showRedemptions=false" style="background:none;border:none;cursor:pointer;color:#fff;flex-shrink:0">
            <VIcon icon="tabler-x" size="20"/>
          </button>
        </div>

        <!-- Filter bar -->
        <div style="padding:10px 16px;border-bottom:1px solid #f0f0f0;flex-shrink:0">
          <div class="d-flex gap-2">
            <button
              v-for="s in redemptionStatusOptions" :key="s.value"
              @click="redemptionFilter = s.value; loadRedemptions(selectedOffer)"
              :style="`height:30px;padding:0 12px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;
                border:1.5px solid ${redemptionFilter===s.value ? '#1a1a2e' : '#e0e0e0'};
                background:${redemptionFilter===s.value ? '#1a1a2e' : '#fff'};
                color:${redemptionFilter===s.value ? '#fff' : '#555'}`"
            >
              {{ s.label }}
            </button>
          </div>
        </div>

        <VCardText class="pa-0" style="overflow-y:auto;flex:1">
          <div v-if="loadingRedemptions" class="d-flex justify-center pa-8">
            <VProgressCircular indeterminate color="#E8A838" size="28"/>
          </div>
          <div v-else-if="!redemptions.length" class="text-center pa-8" style="color:#9e9e9e;font-size:13px">
            <VIcon icon="tabler-inbox" size="36" style="color:#d0d0d0;display:block;margin-bottom:8px"/>
            Aucun rachat{{ redemptionFilter ? ' pour ce statut' : '' }}
          </div>
          <VTable v-else>
            <thead>
              <tr>
                <th>CLIENT ID</th>
                <th>POINTS DÉPENSÉS</th>
                <th>QR CODE</th>
                <th>STATUT</th>
                <th>DATE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in redemptions" :key="r.id">
                <td style="font-weight:600;font-size:13px;color:#1a1a2e">Client #{{ r.client_id }}</td>
                <td>
                  <div class="d-flex align-center gap-1">
                    <VIcon icon="tabler-star" size="13" style="color:#E8A838"/>
                    <span style="font-weight:700;color:#1a1a2e">{{ r.points_spent }}</span>
                  </div>
                </td>
                <td style="font-size:11px;color:#9e9e9e;font-family:monospace">
                  {{ r.qr_token ? r.qr_token.slice(0, 12) + '…' : '—' }}
                </td>
                <td>
                  <span :style="`padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;
                    background:${redemptionBg(r.status)};color:${redemptionColor(r.status)}`">
                    {{ redemptionLabel(r.status) }}
                  </span>
                </td>
                <td style="font-size:12px;color:#9e9e9e">{{ fmtDate(r.created_at) }}</td>
                <td>
                  <div v-if="r.status === 'pending'" class="d-flex gap-1">
                    <VBtn size="x-small" variant="tonal" color="success" @click="redeemRedemption(r)">
                      <VIcon icon="tabler-check" size="12" class="me-1"/>Valider
                    </VBtn>
                    <VBtn size="x-small" variant="tonal" color="error" @click="cancelRedemption(r)">
                      <VIcon icon="tabler-x" size="12" class="me-1"/>Annuler
                    </VBtn>
                  </div>
                  <span v-else style="font-size:11px;color:#9e9e9e">—</span>
                </td>
              </tr>
            </tbody>
          </VTable>
        </VCardText>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackVisible" location="bottom end" :color="snackColor" variant="flat">{{ snackMsg }}</VSnackbar>
  </div>
</template>

<script>
import axios from "axios";
import { useAuthStore } from "@/store/auth";

const API  = () => import.meta.env.VITE_BASE_URL;
const hdrs = (t) => ({ Authorization:`Bearer ${t}`, "X-Authorization": import.meta.env.VITE_API_KEY });

export default {
  name: "FideliteCodesPromo",
  setup() {
    return { authStore: useAuthStore() };
  },
  data() {
    return {
      activeTab: "fidelite",
      tabs: [
        { key:"fidelite", label:"Programme Fidélité", icon:"tabler-gift"   },
        { key:"promo",    label:"Codes Promo",        icon:"tabler-ticket" },
      ],

      // ── KPIs ──
      kpis: [
        { key:"total",   value:"—", label:"Total offres",    icon:"tabler-gift",          bg:"#EBF5FB", color:"#1a1a2e" },
        { key:"actifs",  value:"—", label:"Offres actives",  icon:"tabler-circle-check",  bg:"#EAFAF1", color:"#4CAF50" },
        { key:"rachats", value:"—", label:"Total rachats",   icon:"tabler-shopping-cart", bg:"#FEF9E7", color:"#E8A838" },
        { key:"epuises", value:"—", label:"Offres épuisées", icon:"tabler-alert-triangle", bg:"#FFF3E0", color:"#E65100" },
      ],

      // ── Loyalty Offers ──
      loyaltyOffers: [],
      loadingOffers: false,
      offerSearch: "",
      offerFilterStatus: "",
      showOfferForm: false,
      savingOffer: false,
      offerForm: {
        id: null, park_id: null,
        name: "", description: "",
        points_cost: "", stock: "",
        expires_at: "", is_active: true,
        imageFile: null, imagePreview: null,
      },

      // ── Redemptions ──
      showRedemptions: false,
      selectedOffer: null,
      redemptions: [],
      loadingRedemptions: false,
      redemptionFilter: "",
      redemptionStatusOptions: [
        { label: "Tous",     value: ""          },
        { label: "En attente", value: "pending" },
        { label: "Utilisés",   value: "used"    },
        { label: "Annulés",    value: "cancelled"},
      ],

      // ── Parks ──
      parks: [],
      loadingParks: false,

      // ── Codes promo ──
      loadingPromos: false,
      promos: [],
      promoSearch: "",
      promoFilterStatut: "",
      showPromoForm: false,
      savingPromo: false,
      promoForm: {
        id: null, park_id: null, code: "", type_remise: "pourcentage", valeur: "",
        max_utilisations: "", date_expiration: "", starts_at: "", min_achat: "",
        description: "", actif: true,
        applicable_sur: "", disponibilite_online: true, disponibilite_sur_site: true,
      },
      applicableSurOptions: [
        { label: "Catégorie",   value: "categorie",  icon: "tabler-tag"            },
        { label: "Ticket",      value: "ticket",     icon: "tabler-ticket"         },
        { label: "Pass",        value: "pass",       icon: "tabler-id-badge"       },
        { label: "Entrée",      value: "entree",     icon: "tabler-door-enter"     },
        { label: "Événement",   value: "evenement",  icon: "tabler-calendar-event" },
        { label: "Anniversaire",value: "birthday",   icon: "tabler-cake"           },
      ],

      snackVisible: false, snackMsg: "", snackColor: "success",

      fideliteLoaded: false,
      promosLoaded: false,
    };
  },

  computed: {
    filteredOffers() {
      let r = [...this.loyaltyOffers];
      const q = (this.offerSearch || "").toLowerCase();
      if (q) r = r.filter(o => (o.name || "").toLowerCase().includes(q) || (o.description || "").toLowerCase().includes(q));
      if (this.offerFilterStatus === "actif")   r = r.filter(o => o.is_active);
      if (this.offerFilterStatus === "inactif") r = r.filter(o => !o.is_active);
      return r;
    },
    filteredPromos() {
      let r = [...this.promos];
      const q = (this.promoSearch || "").toLowerCase();
      if (q) r = r.filter(p => (p.code || "").toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q));
      if (this.promoFilterStatut) r = r.filter(p => this.getPromoStatut(p) === this.promoFilterStatut);
      return r;
    },
  },

  watch: {
    'authStore.selectedParkId'() {
      this.promosLoaded = false;
      this.fideliteLoaded = false;
      if (this.activeTab === 'promo')    { this.promosLoaded  = true; this.loadPromos(); }
      if (this.activeTab === 'fidelite') { this.fideliteLoaded = true; this.loadLoyaltyOffers(); }
    },
    activeTab(val) {
      if (val === 'fidelite' && !this.fideliteLoaded) {
        this.fideliteLoaded = true;
        this.loadLoyaltyOffers();
      }
      if (val === 'promo' && !this.promosLoaded) {
        this.promosLoaded = true;
        this.loadPromos();
      }
    },
  },

  mounted() {
    this.fideliteLoaded = true;
    this.loadLoyaltyOffers();
  },

  methods: {
    token() { return this.authStore.token; },

    // ── Loyalty Offers ─────────────────────────────
    async loadLoyaltyOffers() {
      this.loadingOffers = true;
      try {
        const params = { per_page: 100 };
        if (this.authStore.selectedParkId) params.park_id = this.authStore.selectedParkId;
        const res = await axios.get(`${API()}/loyalty-offers`, { params, headers: hdrs(this.token()) });
        const raw = res.data.data || [];
        this.loyaltyOffers = Array.isArray(raw) ? raw.map(o => this.mapOffer(o)) : [];
        this.updateKpisFromOffers();
      } catch {
        this.loyaltyOffers = [];
      } finally {
        this.loadingOffers = false;
      }
    },

    mapOffer(o) {
      return {
        id:              o.id,
        park_id:         o.park_id,
        name:            o.name,
        description:     o.description || "",
        points_cost:     o.points_cost,
        stock:           o.stock ?? null,
        redeemed_count:  o.redeemed_count || 0,
        remaining_stock: o.remaining_stock ?? null,
        expires_at:      o.expires_at ? o.expires_at.split('T')[0] : null,
        is_active:       o.is_active,
        is_available:    o.is_available,
        image_url:       o.image_url || null,
      };
    },

    updateKpisFromOffers() {
      this.kpis[0].value = this.loyaltyOffers.length;
      this.kpis[1].value = this.loyaltyOffers.filter(o => o.is_active).length;
      this.kpis[2].value = this.loyaltyOffers.reduce((s, o) => s + (o.redeemed_count || 0), 0);
      this.kpis[3].value = this.loyaltyOffers.filter(o => o.remaining_stock === 0).length;
    },

    openCreateOffer() {
      if (!this.parks.length) this.loadParks();
      this.offerForm = {
        id: null,
        park_id: this.authStore.selectedParkId || null,
        name: "", description: "",
        points_cost: "", stock: "",
        expires_at: "", is_active: true,
        imageFile: null, imagePreview: null,
      };
      this.showOfferForm = true;
    },

    openEditOffer(offer) {
      this.offerForm = {
        id:          offer.id,
        park_id:     offer.park_id,
        name:        offer.name,
        description: offer.description,
        points_cost: offer.points_cost,
        stock:       offer.stock ?? "",
        expires_at:  offer.expires_at ?? "",
        is_active:   offer.is_active,
        imageFile:   null,
        imagePreview: offer.image_url || null,
      };
      this.showOfferForm = true;
    },

    handleImageChange(e) {
      const file = e.target.files?.[0];
      if (!file) return;
      this.offerForm.imageFile = file;
      const reader = new FileReader();
      reader.onload = (ev) => { this.offerForm.imagePreview = ev.target.result; };
      reader.readAsDataURL(file);
    },

    removeImage() {
      this.offerForm.imageFile = null;
      this.offerForm.imagePreview = null;
      if (this.$refs.imageInput) this.$refs.imageInput.value = "";
    },

    async saveOffer() {
      const name = (this.offerForm.name || "").trim();
      const pts  = this.offerForm.points_cost;
      if (!name || !pts) {
        this.showSnack("Veuillez remplir le nom et le coût en points", "error");
        return;
      }
      const parkId = this.offerForm.park_id || this.authStore.selectedParkId;
      if (!this.offerForm.id && !parkId) {
        this.showSnack("Veuillez sélectionner un parc", "error");
        return;
      }

      this.savingOffer = true;
      try {
        const fd = new FormData();
        if (!this.offerForm.id) fd.append('park_id', parkId);
        fd.append('name', name);
        if (this.offerForm.description) fd.append('description', this.offerForm.description);
        fd.append('points_cost', parseInt(pts));
        if (this.offerForm.stock) fd.append('stock', parseInt(this.offerForm.stock));
        if (this.offerForm.expires_at) fd.append('expires_at', this.offerForm.expires_at);
        fd.append('is_active', this.offerForm.is_active ? '1' : '0');
        if (this.offerForm.imageFile) fd.append('image', this.offerForm.imageFile);

        let res;
        if (this.offerForm.id) {
          fd.append('_method', 'PUT');
          res = await axios.post(`${API()}/loyalty-offers/${this.offerForm.id}`, fd, { headers: hdrs(this.token()) });
        } else {
          res = await axios.post(`${API()}/loyalty-offers`, fd, { headers: hdrs(this.token()) });
        }

        const offer = this.mapOffer(res.data.data || res.data);
        if (this.offerForm.id) {
          const idx = this.loyaltyOffers.findIndex(o => o.id === offer.id);
          if (idx !== -1) this.loyaltyOffers.splice(idx, 1, offer);
        } else {
          this.loyaltyOffers.unshift(offer);
        }
        this.updateKpisFromOffers();
        this.showOfferForm = false;
        this.showSnack(this.offerForm.id ? "Offre mise à jour" : "Offre créée avec succès");
      } catch (err) {
        const msg = err?.response?.data?.message || "Erreur lors de l'enregistrement";
        this.showSnack(msg, "error");
      } finally {
        this.savingOffer = false;
      }
    },

    async toggleOfferStatus(offer) {
      try {
        const res = await axios.patch(`${API()}/loyalty-offers/${offer.id}/change-status`, {}, { headers: hdrs(this.token()) });
        const updated = this.mapOffer(res.data.data || res.data);
        const idx = this.loyaltyOffers.findIndex(o => o.id === offer.id);
        if (idx !== -1) this.loyaltyOffers.splice(idx, 1, updated);
        this.updateKpisFromOffers();
        this.showSnack(updated.is_active ? "Offre activée" : "Offre désactivée");
      } catch {
        this.showSnack("Erreur lors du changement de statut", "error");
      }
    },

    async deleteOffer(offer) {
      if (!confirm(`Supprimer l'offre "${offer.name}" ?`)) return;
      try {
        await axios.delete(`${API()}/loyalty-offers/${offer.id}`, { headers: hdrs(this.token()) });
        this.loyaltyOffers = this.loyaltyOffers.filter(o => o.id !== offer.id);
        this.updateKpisFromOffers();
        this.showSnack("Offre supprimée");
      } catch {
        this.showSnack("Erreur lors de la suppression", "error");
      }
    },

    // ── Redemptions ────────────────────────────────
    viewRedemptions(offer) {
      this.selectedOffer  = offer;
      this.redemptions    = [];
      this.redemptionFilter = "";
      this.showRedemptions = true;
      this.loadRedemptions(offer);
    },

    async loadRedemptions(offer) {
      if (!offer) return;
      this.loadingRedemptions = true;
      try {
        const params = { per_page: 100 };
        if (this.redemptionFilter) params.status = this.redemptionFilter;
        const res = await axios.get(
          `${API()}/loyalty-offers/${offer.id}/redemptions`,
          { params, headers: hdrs(this.token()) }
        );
        this.redemptions = res.data.data || [];
      } catch {
        this.redemptions = [];
      } finally {
        this.loadingRedemptions = false;
      }
    },

    async redeemRedemption(r) {
      try {
        const res = await axios.patch(
          `${API()}/loyalty-offers/${r.loyalty_offer_id}/redemptions/${r.id}/redeem`,
          {},
          { headers: hdrs(this.token()) }
        );
        const idx = this.redemptions.findIndex(x => x.id === r.id);
        if (idx !== -1) this.redemptions.splice(idx, 1, res.data.data || res.data);
        // update redeemed_count on the offer
        const offerIdx = this.loyaltyOffers.findIndex(o => o.id === r.loyalty_offer_id);
        if (offerIdx !== -1) {
          this.loyaltyOffers[offerIdx].redeemed_count++;
          if (this.selectedOffer?.id === r.loyalty_offer_id) this.selectedOffer.redeemed_count++;
        }
        this.updateKpisFromOffers();
        this.showSnack("Rachat validé");
      } catch (err) {
        this.showSnack(err?.response?.data?.message || "Erreur", "error");
      }
    },

    async cancelRedemption(r) {
      try {
        const res = await axios.patch(
          `${API()}/loyalty-offers/${r.loyalty_offer_id}/redemptions/${r.id}/cancel`,
          {},
          { headers: hdrs(this.token()) }
        );
        const idx = this.redemptions.findIndex(x => x.id === r.id);
        if (idx !== -1) this.redemptions.splice(idx, 1, res.data.data || res.data);
        this.showSnack("Rachat annulé");
      } catch (err) {
        this.showSnack(err?.response?.data?.message || "Erreur", "error");
      }
    },

    redemptionLabel(status) {
      return { pending: "En attente", used: "Utilisé", cancelled: "Annulé" }[status] || status;
    },
    redemptionColor(status) {
      return { pending: "#E65100", used: "#2e7d32", cancelled: "#9e9e9e" }[status] || "#555";
    },
    redemptionBg(status) {
      return { pending: "#fff3e0", used: "#e8f5e9", cancelled: "#f5f5f5" }[status] || "#f5f5f5";
    },

    // ── Parks ──────────────────────────────────────
    async loadParks() {
      this.loadingParks = true;
      try {
        const res = await axios.get(`${API()}/parks`, { params: { per_page: 200 }, headers: hdrs(this.token()) });
        this.parks = res.data.data || res.data || [];
      } catch { this.parks = []; }
      finally { this.loadingParks = false; }
    },

    // ── Codes promo ─────────────────────────────────
    mapPromo(o) {
      return {
        id:                     o.id,
        code:                   o.code,
        type_remise:            o.type === 'percentage' ? 'pourcentage' : 'montant',
        valeur:                 o.value,
        max_utilisations:       o.max_uses   || null,
        utilisations_actuelles: o.used_count || 0,
        date_expiration:        o.expires_at  ? o.expires_at.split('T')[0]  : null,
        starts_at:              o.starts_at   ? o.starts_at.split('T')[0]   : null,
        min_achat:              o.min_order_amount || null,
        actif:                  o.is_active,
        park_id:                o.park_id,
      };
    },

    async loadPromos() {
      this.loadingPromos = true;
      try {
        const params = { per_page: 100 };
        if (this.authStore.selectedParkId) params.park_id = this.authStore.selectedParkId;
        const res = await axios.get(`${API()}/promo-codes`, { params, headers: hdrs(this.token()) });
        const raw = res.data.data || [];
        this.promos = Array.isArray(raw) ? raw.map(o => this.mapPromo(o)) : [];
      } catch { this.promos = []; }
      finally { this.loadingPromos = false; }
    },

    openCreatePromo() {
      if (!this.parks.length) this.loadParks();
      this.promoForm = {
        id: null,
        park_id: this.authStore.selectedParkId || null,
        code: "", type_remise: "pourcentage", valeur: "",
        max_utilisations: "", date_expiration: "", starts_at: "", min_achat: "",
        description: "", actif: true,
        applicable_sur: "", disponibilite_online: true, disponibilite_sur_site: true,
      };
      this.showPromoForm = true;
    },
    openEditPromo(p) {
      this.promoForm = {
        ...p,
        max_utilisations: p.max_utilisations ?? "",
        date_expiration:  p.date_expiration  ?? "",
        starts_at:        p.starts_at        ?? "",
        min_achat:        p.min_achat        ?? "",
        description:      "",
        applicable_sur:   "",
        disponibilite_online:   true,
        disponibilite_sur_site: true,
      };
      this.showPromoForm = true;
    },
    generateCode() {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      this.promoForm.code = Array.from({ length:8 }, () => chars[Math.floor(Math.random()*chars.length)]).join("");
    },

    async savePromo() {
      if (!this.promoForm.code || this.promoForm.valeur === "" || this.promoForm.valeur === null) return;
      const parkId = this.promoForm.park_id || this.authStore.selectedParkId;
      if (!this.promoForm.id && !parkId) {
        this.showSnack("Veuillez sélectionner un parc", "error");
        return;
      }
      this.savingPromo = true;
      try {
        const body = {
          code:      this.promoForm.code,
          type:      this.promoForm.type_remise === 'pourcentage' ? 'percentage' : 'fixed',
          value:     parseFloat(this.promoForm.valeur),
          is_active: this.promoForm.actif,
        };
        if (this.promoForm.max_utilisations) body.max_uses         = parseInt(this.promoForm.max_utilisations);
        if (this.promoForm.min_achat)        body.min_order_amount = parseFloat(this.promoForm.min_achat);
        if (this.promoForm.date_expiration)  body.expires_at       = this.promoForm.date_expiration;
        if (this.promoForm.starts_at)        body.starts_at        = this.promoForm.starts_at;

        if (this.promoForm.id) {
          const res = await axios.put(`${API()}/promo-codes/${this.promoForm.id}`, body, { headers: hdrs(this.token()) });
          const updated = res.data.data || res.data;
          const idx = this.promos.findIndex(p => p.id === this.promoForm.id);
          if (idx !== -1) this.promos.splice(idx, 1, this.mapPromo(updated));
          this.showSnack("Code promo mis à jour");
        } else {
          body.park_id = parkId;
          const res = await axios.post(`${API()}/promo-codes`, body, { headers: hdrs(this.token()) });
          const created = res.data.data || res.data;
          this.promos.unshift(this.mapPromo(created));
          this.showSnack("Code promo créé avec succès");
        }
        this.showPromoForm = false;
      } catch (err) {
        const msg = err?.response?.data?.message || "Erreur lors de l'enregistrement";
        this.showSnack(msg, "error");
      }
      finally { this.savingPromo = false; }
    },

    async togglePromo(p) {
      try {
        const res = await axios.patch(`${API()}/promo-codes/${p.id}/change-status`, {}, { headers: hdrs(this.token()) });
        p.actif = res.data?.data?.is_active ?? !p.actif;
        this.showSnack(p.actif ? "Code activé" : "Code désactivé");
      } catch { this.showSnack("Erreur", "error"); }
    },

    async deletePromo(p) {
      if (!confirm(`Supprimer le code "${p.code}" ?`)) return;
      try {
        await axios.delete(`${API()}/promo-codes/${p.id}`, { headers: hdrs(this.token()) });
        this.promos = this.promos.filter(x => x.id !== p.id);
        this.showSnack("Code supprimé");
      } catch { this.showSnack("Erreur lors de la suppression", "error"); }
    },

    getPromoStatut(p) {
      if (!p.actif) return "inactif";
      if (p.date_expiration && new Date(p.date_expiration) < new Date()) return "expire";
      return "actif";
    },
    getPromoStatutLabel(p) { return { actif:"Actif", inactif:"Inactif", expire:"Expiré" }[this.getPromoStatut(p)]; },
    getPromoStatutColor(p) { return { actif:"success", inactif:"default", expire:"error" }[this.getPromoStatut(p)]; },

    exportPromos() {
      const rows = [
        ["Code","Type","Valeur","Utilisations","Expire le","Statut"],
        ...this.filteredPromos.map(p => [
          p.code,
          p.type_remise==="pourcentage"?"Pourcentage":"Montant fixe",
          p.type_remise==="pourcentage"?p.valeur+"%":p.valeur+"€",
          `${p.utilisations_actuelles||0}/${p.max_utilisations||"∞"}`,
          p.date_expiration ? this.fmtDate(p.date_expiration) : "—",
          this.getPromoStatutLabel(p),
        ]),
      ];
      this.downloadCsv(rows, "codes-promo.csv");
    },

    // ── Utils ───────────────────────────────────────
    fmtDate(d) { return d ? new Date(d).toLocaleDateString("fr-FR") : "—"; },
    showSnack(msg, color="success") { this.snackMsg=msg; this.snackColor=color; this.snackVisible=true; },
    downloadCsv(rows, filename) {
      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
      const a = document.createElement("a");
      a.href = "data:text/csv;charset=utf-8,﻿" + encodeURIComponent(csv);
      a.download = filename;
      a.click();
    },
  },
};
</script>

<style scoped>
.fl-title { font-size:22px; font-weight:800; color:#1a1a2e; margin:0; }
.fl-sub   { font-size:13px; color:#9e9e9e; margin:0; }

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

.fl-label { font-size:12px; font-weight:600; color:#555; margin-bottom:4px; }

.fl-kpi-icon { width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.fl-kpi-val  { font-size:22px; font-weight:800; color:#1a1a2e; line-height:1.2; }
.fl-kpi-lbl  { font-size:11px; color:#9e9e9e; margin-top:2px; }

.fl-code-badge { display:inline-block; background:#1a1a2e; color:#fff; border-radius:6px; padding:3px 10px; font-size:12px; font-weight:700; letter-spacing:1px; font-family:monospace; }

.fl-export-btn { display:inline-flex; align-items:center; height:36px; padding:0 14px; border:1.5px solid #1a1a2e; border-radius:8px; background:#fff; color:#1a1a2e; font-size:13px; font-weight:700; cursor:pointer; }
.fl-export-btn:hover { background:#f5f5f5; }

:deep(.v-table thead th) {
  font-size: 11px !important;
  font-weight: 700 !important;
  color: #9e9e9e !important;
  text-transform: uppercase;
  white-space: nowrap;
  background: #fafafa !important;
  padding: 11px 14px !important;
}
:deep(.v-table tbody td) {
  font-size: 13px !important;
  padding: 10px 14px !important;
  vertical-align: middle;
  border-bottom: 1px solid #f5f5f5 !important;
}
</style>
