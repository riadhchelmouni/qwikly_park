<template>
  <div>
    <!-- Tab Toggle -->
    <VCard class="mb-4" elevation="0">
      <VCardText class="pa-0">
        <div class="tab-bar">
          <button
            class="tab-btn"
            :class="activeTab === 'franchises' ? 'tab-btn--active' : 'tab-btn--inactive'"
            @click="activeTab = 'franchises'"
          >
            <VIcon icon="tabler-building-estate" size="15" class="me-2" />
            Franchises
          </button>
          <button
            class="tab-btn"
            :class="activeTab === 'parks' ? 'tab-btn--active' : 'tab-btn--inactive'"
            @click="activeTab = 'parks'"
          >
            <VIcon icon="tabler-building-community" size="15" class="me-2" />
            Parcs
          </button>
        </div>
      </VCardText>
    </VCard>

    <!-- ===== PARCS TAB ===== -->
    <div v-if="activeTab === 'parks'">
      <!-- Filters -->
      <VCard class="mb-4" elevation="0" border>
        <VCardText>
          <VRow align="end" no-gutters class="gap-3 flex-wrap">
            <VCol cols="12" sm="3">
              <AppSelect
                v-model="parkFilter.franchise_id"
                :items="franchiseOptions"
                item-title="nom"
                item-value="id"
                label="Franchise"
                clearable
                hide-details
                density="compact"
              />
            </VCol>
            <VCol cols="12" sm="3">
              <AppSelect
                v-model="parkFilter.status"
                :items="statusOptions"
                item-title="label"
                item-value="value"
                label="Statut"
                clearable
                hide-details
                density="compact"
              />
            </VCol>
            <VCol cols="12" sm="3">
              <AppTextField
                v-model="parkFilter.localisation"
                label="Localisation"
                hide-details
                clearable
                density="compact"
              />
            </VCol>
            <VCol cols="auto">
              <VBtn
                style="background-color:#E8A838; color:#1a1a2e; min-width:120px; height:38px;"
                size="small"
                @click="applyParkFilters"
              >
                Appliquer
              </VBtn>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

      <!-- Search + Add -->
      <VCard class="mb-4" elevation="0" border>
        <VCardText>
          <div class="d-flex align-center gap-3">
            <AppTextField
              v-model="parkSearch"
              placeholder="Rechercher un parc..."
              prepend-inner-icon="tabler-search"
              hide-details
              clearable
              density="compact"
              class="flex-grow-1"
              @click:clear="parkSearch = ''"
            />
            <VBtn
              style="background-color:#E8A838; color:#1a1a2e; min-width:160px; height:38px; white-space:nowrap;"
              size="small"
              prepend-icon="tabler-plus"
              @click="openCreateParkModal"
            >
              Nouveau Parc
            </VBtn>
          </div>
        </VCardText>
      </VCard>

      <!-- Park Cards Grid -->
      <div v-if="isParksLoading" class="d-flex justify-center pa-8">
        <VProgressCircular indeterminate color="primary" />
      </div>

      <VRow v-else-if="filteredParks.length">
        <VCol
          v-for="park in filteredParks"
          :key="park.id"
          cols="12"
          sm="6"
          md="4"
        >
          <VCard class="h-100">
            <!-- Park Image -->
            <VImg
              :src="getImageUrl(park.image || park.photo || park.thumbnail || park.cover_image || park.image_url) || parkPlaceholder"
              height="180"
              cover
            >
              <template #placeholder>
                <div class="d-flex align-center justify-center h-100 bg-grey-lighten-3">
                  <VIcon icon="tabler-building-community" size="48" color="grey" />
                </div>
              </template>
              <!-- Status Badge -->
              <div class="pa-2">
                <VChip
                  :color="getParkStatusColor(park.status)"
                  size="small"
                  label
                >
                  {{ getParkStatusLabel(park.status) }}
                </VChip>
              </div>
            </VImg>

            <VCardTitle class="pt-3 pb-1">{{ park.nom || park.name }}</VCardTitle>

            <VCardText class="pb-2">
              <!-- Location -->
              <div class="d-flex align-center gap-1 mb-2">
                <VIcon icon="tabler-map-pin" size="16" color="grey" />
                <span class="text-body-2 text-medium-emphasis">{{ park.localisation || park.location || park.address || park.adresse || '—' }}</span>
              </div>

              <!-- Franchise -->
              <div class="d-flex align-center gap-1 mb-2">
                <span class="text-body-2 font-weight-medium">Franchise :</span>
                <span class="text-body-2 text-medium-emphasis">{{ park.franchise ? (park.franchise.nom || park.franchise.name) : '—' }}</span>
              </div>

              <!-- Admin associé(s) -->
              <div class="d-flex align-center gap-1 mb-2">
                <span class="text-body-2 font-weight-medium">Admin associé(s) :</span>
                <span class="text-body-2 text-medium-emphasis">
                  {{
                    park.admin
                      ? (
                          park.admin.user
                            ? (park.admin.user.firstname + ' ' + park.admin.user.lastname)
                            : (park.admin.firstname
                                ? (park.admin.firstname + ' ' + (park.admin.lastname || ''))
                                : (park.admin.name || `Admin #${park.admin.id}`))
                        )
                      : (park.admins?.length
                          ? (park.admins[0].user
                              ? (park.admins[0].user.firstname + ' ' + park.admins[0].user.lastname)
                              : park.admins[0].name || '')
                          : (park.admin_id
                              ? (adminOptions.find(a => a.id === park.admin_id)?.name || `Admin #${park.admin_id}`)
                              : '—'))
                  }}
                </span>
              </div>

              <!-- Numéro(s) -->
              <div v-if="park.numeros && park.numeros.filter(n => n).length" class="d-flex align-center gap-1 mb-2">
                <span class="text-body-2 font-weight-medium">Numéro(s) :</span>
                <span class="text-body-2 text-medium-emphasis">{{ park.numeros.filter(n => n).join(', ') }}</span>
              </div>

            </VCardText>

            <!-- Action Buttons -->
            <VCardActions class="px-3 pb-3 pt-0">
              <IconBtn color="info" @click="openParkDetails(park)">
                <VIcon icon="tabler-eye" />
                <VTooltip activator="parent" location="top">Détails</VTooltip>
              </IconBtn>
              <IconBtn color="error" @click="openDeleteParkDialog(park)">
                <VIcon icon="tabler-trash" />
                <VTooltip activator="parent" location="top">Supprimer</VTooltip>
              </IconBtn>
              <IconBtn color="success" @click="openEditParkModal(park)">
                <VIcon icon="tabler-edit" />
                <VTooltip activator="parent" location="top">Modifier</VTooltip>
              </IconBtn>
            </VCardActions>
          </VCard>
        </VCol>
      </VRow>

      <VCard v-else>
        <VCardText class="text-center pa-8 text-medium-emphasis">
          Aucun parc trouvé
        </VCardText>
      </VCard>
    </div>

    <!-- ===== FRANCHISES TAB ===== -->
    <div v-if="activeTab === 'franchises'">
      <VCard elevation="0" border>
        <VCardText>
          <div class="d-flex align-center gap-3 mb-4">
            <AppTextField
              v-model="franchiseSearch"
              placeholder="Rechercher une franchise..."
              prepend-inner-icon="tabler-search"
              hide-details
              clearable
              density="compact"
              class="flex-grow-1"
            />
            <VBtn
              style="background-color:#1a1a2e; color:#fff; min-width:180px; height:38px; white-space:nowrap;"
              size="small"
              prepend-icon="tabler-plus"
              @click="openCreateFranchiseModal"
            >
              Nouveau franchisé
            </VBtn>
          </div>

          <VDataTableServer
            class="text-no-wrap"
            :items-length="franchiseTotal"
            :headers="franchiseHeaders"
            :items="franchises"
            :loading="isFranchisesLoading"
          >
            <template v-slot:no-data>
              <span>Pas de données disponibles</span>
            </template>

            <template v-slot:loading>
              <span>Chargement des données</span>
            </template>

            <template v-slot:headers="{ columns }">
              <tr>
                <template v-for="column in columns" :key="column.key">
                  <td><span class="font-weight-bold">{{ column.title }}</span></td>
                </template>
              </tr>
            </template>

            <template v-slot:item.logo="{ item }">
              <VAvatar size="40" class="my-2" rounded>
                <VImg :src="item.logo || item.image || parkPlaceholder" cover />
              </VAvatar>
            </template>

            <template v-slot:item.nom="{ item }">
              <span class="font-weight-medium">{{ item.nom || item.name }}</span>
            </template>

            <template v-slot:item.parks_count="{ item }">
              <VChip color="primary" size="small">{{
                parks.filter(p => Number(p.franchise?.id ?? p.franchise_id) === Number(item.id)).length
              }}</VChip>
            </template>

            <template #item.actions="{ item }">
              <IconBtn color="info" @click="openFranchiseDetails(item)">
                <VIcon icon="tabler-eye" />
                <VTooltip activator="parent" location="top">Détails</VTooltip>
              </IconBtn>
              <IconBtn color="success" @click="openEditFranchiseModal(item)">
                <VIcon icon="tabler-edit" />
                <VTooltip activator="parent" location="top">Modifier</VTooltip>
              </IconBtn>
              <IconBtn color="error" @click="openDeleteFranchiseDialog(item)">
                <VIcon icon="tabler-trash" />
                <VTooltip activator="parent" location="top">Supprimer</VTooltip>
              </IconBtn>
            </template>

            <template #bottom>
              <VRow class="pt-2" justify="end" align="center">
                <VCol lg="2" cols="3" />
                <VCol ms="auto" cols="auto" class="d-flex align-center justify-center gap-3">
                  <VPagination
                    v-model="franchisePage"
                    total-visible="3"
                    size="small"
                    :length="Math.ceil(franchiseTotal / franchisePerPage)"
                    class="flex-shrink-0"
                  />
                  <AppSelect
                    v-model="franchisePerPage"
                    :items="[{ value: 5, title: '5' }, { value: 10, title: '10' }, { value: 25, title: '25' }]"
                    style="min-width: 4.7rem; max-width: 6rem;"
                    hide-details
                    density="compact"
                    class="flex-shrink-0"
                  />
                </VCol>
              </VRow>
            </template>
          </VDataTableServer>
        </VCardText>
      </VCard>
    </div>

    <!-- ==================== MODALS ==================== -->

    <!-- CREATE PARK MODAL -->
    <VDialog v-model="createParkDialog" max-width="780" persistent scrollable>
      <VCard>

        <!-- Header -->
        <div class="modal-header px-5 pt-4 pb-2">
          <button class="modal-back-btn" @click="createParkDialog = false">
            <VIcon icon="tabler-arrow-left" size="18" />
          </button>
          <span class="modal-title">Nouveau parc</span>
        </div>

        <!-- Stepper -->
        <div class="modal-stepper px-5 pb-3">
          <div class="stepper-row">
            <template v-for="(step, i) in parkSteps" :key="i">
              <div class="stepper-item">
                <div
                  class="stepper-circle"
                  :class="createParkStep > i+1 ? 'stepper-done' : createParkStep === i+1 ? 'stepper-active' : 'stepper-pending'"
                >
                  <VIcon v-if="createParkStep > i+1" icon="tabler-check" size="14" />
                  <span v-else>{{ i+1 }}</span>
                </div>
                <span class="stepper-label" :class="createParkStep === i+1 ? 'stepper-label--active' : ''">{{ step }}</span>
              </div>
              <VIcon v-if="i < parkSteps.length - 1" icon="tabler-chevron-right" size="16" color="grey" class="stepper-arrow" />
            </template>
          </div>
        </div>

        <VDivider />

        <!-- ─── STEP 1 : Informations principales ─── -->
        <VCardText v-if="createParkStep === 1" class="px-5 py-4" style="max-height:62vh; overflow-y:auto;">
          <VForm ref="createParkForm1">

            <!-- Image -->
            <p class="field-label mb-1">Image de parc</p>
            <div class="image-upload-zone mb-1" @click="$refs.parkImageInput.click()">
              <VImg v-if="newPark.imagePreview" :src="newPark.imagePreview" height="80" contain />
              <div v-else class="image-upload-placeholder">
                <VIcon icon="tabler-upload" size="22" color="grey" />
                <span style="font-size:11px;color:#9e9e9e;margin-top:4px">Cliquer pour ajouter une image</span>
              </div>
            </div>
            <input ref="parkImageInput" type="file" accept="image/jpg,image/jpeg,image/png,image/gif" class="d-none" @change="onParkImageChange" />
            <p class="text-caption text-medium-emphasis mb-4">JPG, GIF ou PNG — max 800 Ko</p>

            <VRow dense>
              <!-- Nom -->
              <VCol cols="12">
                <p class="field-label">Nom du parc <span class="req">*</span></p>
                <AppTextField
                  v-model="newPark.nom"
                  placeholder="Ex: Royal Kids Paris"
                  density="compact"
                  :rules="[v => !!v || 'Le nom du parc est requis']"
                />
              </VCol>

              <!-- Franchise -->
              <VCol cols="6" class="mt-2">
                <p class="field-label">Franchise <span class="req">*</span></p>
                <AppSelect
                  v-model="newPark.franchise_id"
                  :items="franchiseOptions"
                  item-title="nom"
                  item-value="id"
                  placeholder="Sélectionner une franchise"
                  density="compact"
                  :no-data-text="franchiseOptions.length ? 'Aucun résultat' : 'Chargement...'"
                  :rules="[v => !!v || 'La franchise est requise']"
                />
              </VCol>

              <!-- Statut -->
              <VCol cols="6" class="mt-2">
                <p class="field-label">Statut</p>
                <AppSelect
                  v-model="newPark.status"
                  :items="statusOptions"
                  item-title="label"
                  item-value="value"
                  hide-details
                  density="compact"
                />
              </VCol>

              <!-- Localisation -->
              <VCol cols="6" class="mt-2">
                <p class="field-label">Localisation <span class="req">*</span></p>
                <AppTextField
                  v-model="newPark.localisation"
                  placeholder="Ville / Coordonnées GPS"
                  density="compact"
                  append-inner-icon="tabler-navigation"
                  :rules="[v => !!v || 'La localisation est requise']"
                />
              </VCol>

              <!-- Adresse -->
              <VCol cols="6" class="mt-2">
                <p class="field-label">Adresse complète</p>
                <AppTextField
                  v-model="newPark.adresse"
                  placeholder="Ex: 12 Rue de la Paix, 75001 Paris"
                  hide-details
                  density="compact"
                  prepend-inner-icon="tabler-map-pin"
                />
              </VCol>

              <!-- RIB / IBAN -->
              <VCol cols="12" class="mt-2">
                <p class="field-label">RIB / IBAN</p>
                <AppTextField
                  v-model="newPark.iban"
                  placeholder="Ex: FR76 3000 6000 0112 3456 7890 189"
                  hide-details
                  density="compact"
                  prepend-inner-icon="tabler-building-bank"
                />
              </VCol>

              <!-- Description -->
              <VCol cols="12" class="mt-2">
                <p class="field-label">Description</p>
                <AppTextarea
                  v-model="newPark.description"
                  placeholder="Décrivez le parc..."
                  hide-details
                  density="compact"
                  rows="2"
                />
              </VCol>

              <!-- Réseaux sociaux -->
              <VCol cols="12" class="mt-2">
                <p class="field-label">Réseaux sociaux</p>
              </VCol>
              <VCol cols="6">
                <AppTextField v-model="newPark.facebook"  placeholder="Facebook"  hide-details density="compact" prepend-inner-icon="tabler-brand-facebook" />
              </VCol>
              <VCol cols="6">
                <AppTextField v-model="newPark.instagram" placeholder="Instagram" hide-details density="compact" prepend-inner-icon="tabler-brand-instagram" />
              </VCol>
              <VCol cols="6" class="mt-2">
                <AppTextField v-model="newPark.tiktok"    placeholder="TikTok"    hide-details density="compact" prepend-inner-icon="tabler-brand-tiktok" />
              </VCol>
              <VCol cols="6" class="mt-2">
                <AppTextField v-model="newPark.youtube"   placeholder="Youtube"   hide-details density="compact" prepend-inner-icon="tabler-brand-youtube" />
              </VCol>

              <!-- Admin / Numéros -->
              <VCol cols="6" class="mt-2">
                <p class="field-label">Admin associé</p>
                <AppSelect
                  v-model="newPark.admin_id"
                  :items="adminOptions"
                  item-title="name"
                  item-value="id"
                  placeholder="Sélectionner un admin"
                  clearable hide-details density="compact"
                />
              </VCol>
              <VCol cols="6" class="mt-2">
                <p class="field-label">Numéro(s)</p>
                <div v-for="(_, idx) in (newPark.numeros || [''])" :key="idx" class="d-flex align-center gap-1 mb-1">
                  <AppTextField
                    v-model="newPark.numeros[idx]"
                    placeholder="Entrer le numéro de parc"
                    hide-details density="compact" class="flex-grow-1"
                  />
                  <button
                    v-if="newPark.numeros && newPark.numeros.length > 1"
                    class="add-numero-btn"
                    style="color:#e53935;padding:0 4px"
                    @click.prevent="newPark.numeros.splice(idx, 1)"
                  >
                    <VIcon icon="tabler-x" size="13" />
                  </button>
                </div>
                <button class="add-numero-btn mt-1" @click.prevent="newPark.numeros ? newPark.numeros.push('') : newPark.numeros = ['']">
                  <VIcon icon="tabler-plus" size="13" /> Ajouter Un Numéro
                </button>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>

        <!-- ─── STEP 2 : Services ─── -->
        <VCardText v-else-if="createParkStep === 2" class="px-5 py-4" style="max-height:62vh; overflow-y:auto;">

          <!-- Horaires -->
          <p class="section-title mb-3">
            <VIcon icon="tabler-clock" size="15" class="me-1" />Horaires d'ouverture
          </p>
          <div class="horaires-row mb-2">
            <div v-for="day in workDays" :key="day.key" class="horaire-day">
              <p class="horaire-day-label">{{ day.label }}</p>
              <div class="horaire-inputs">
                <div class="hour-box">
                  <input v-model="newPark.horaires[day.key].open"  class="hour-input" type="number" min="0" max="23" />
                  <span class="hour-suffix">h</span>
                </div>
                <span class="hour-sep">-</span>
                <div class="hour-box">
                  <input v-model="newPark.horaires[day.key].close" class="hour-input" type="number" min="0" max="23" />
                  <span class="hour-suffix">h</span>
                </div>
              </div>
            </div>
          </div>
          <div class="mb-4">
            <p class="horaire-day-label">Vacances &amp; jours fériés</p>
            <div class="horaire-inputs">
              <div class="hour-box">
                <input v-model="newPark.horaires.vacances.open"  class="hour-input" type="number" min="0" max="23" />
                <span class="hour-suffix">h</span>
              </div>
              <span class="hour-sep">-</span>
              <div class="hour-box">
                <input v-model="newPark.horaires.vacances.close" class="hour-input" type="number" min="0" max="23" />
                <span class="hour-suffix">h</span>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <p class="section-title mb-2">
            <VIcon icon="tabler-clipboard-list" size="15" class="me-1" />Notes
          </p>
          <div class="notes-grid mb-4">
            <label class="note-check"><input type="checkbox" v-model="newPark.notes.chaussettes" /> Chaussettes Obligatoire</label>
            <label class="note-check"><input type="checkbox" v-model="newPark.notes.pique_nique" /> Pique nique interdite</label>
            <label class="note-check"><input type="checkbox" v-model="newPark.notes.wifi"        /> Wifi Zone</label>
            <label class="note-check"><input type="checkbox" v-model="newPark.notes.climatise"   /> Espace Climatisé</label>
            <label class="note-check note-check--with-input">
              <input type="checkbox" v-model="newPark.notes.note1_enabled" />
              <input type="text" v-model="newPark.notes.note1" class="note-text-input" placeholder="Note personnalisée 1" />
            </label>
            <label class="note-check note-check--with-input">
              <input type="checkbox" v-model="newPark.notes.note2_enabled" />
              <input type="text" v-model="newPark.notes.note2" class="note-text-input" placeholder="Note personnalisée 2" />
            </label>
          </div>

          <!-- Les Jeux -->
          <p class="section-title mb-2">
            <VIcon icon="tabler-device-gamepad" size="15" class="me-1" />Les Jeux
          </p>
          <div class="jeux-grid">
            <div>
              <p class="jeux-col-title">Pour Les Petits</p>
              <div class="d-flex align-center gap-1 mb-1">
                <span class="text-caption">Moins de</span>
                <input v-model="newPark.jeux.petits.age_max" type="number" class="age-input" placeholder="0" />
                <span class="text-caption">ans</span>
              </div>
              <textarea v-model="newPark.jeux.petits.description" class="jeux-textarea" placeholder="Description..."></textarea>
            </div>
            <div>
              <p class="jeux-col-title">Pour Les Grands</p>
              <div class="d-flex align-center gap-1 mb-1">
                <span class="text-caption">de</span>
                <input v-model="newPark.jeux.grands.age_min" type="number" class="age-input" placeholder="0" />
                <span class="text-caption">à</span>
                <input v-model="newPark.jeux.grands.age_max" type="number" class="age-input" placeholder="0" />
                <span class="text-caption">ans</span>
              </div>
              <textarea v-model="newPark.jeux.grands.description" class="jeux-textarea" placeholder="Description..."></textarea>
            </div>
            <div>
              <p class="jeux-col-title">Pour Les Parents</p>
              <textarea v-model="newPark.jeux.parents.description" class="jeux-textarea jeux-textarea--tall" placeholder="Services pour les parents..."></textarea>
            </div>
          </div>
        </VCardText>

        <!-- ─── STEP 3 : Tarifs ─── -->
        <VCardText v-else-if="createParkStep === 3" class="px-5 py-4" style="max-height:62vh; overflow-y:auto;">
          <div class="d-flex align-center justify-space-between mb-4">
            <div>
              <p class="section-title mb-0">
                <VIcon icon="tabler-ticket" size="15" class="me-1" />Tarifs
              </p>
              <p class="text-caption text-medium-emphasis mb-0">Ces tarifs seront enregistrés avec le parc</p>
            </div>
            <button class="add-tarif-btn" @click="addTarif">
              <span class="add-tarif-icon"><VIcon icon="tabler-plus" size="13" /></span>
              Ajouter un tarif
            </button>
          </div>

          <div v-if="!newPark.tarifs.length" class="tarif-empty-state">
            <VIcon icon="tabler-ticket" size="36" color="grey" />
            <p class="text-body-2 text-medium-emphasis mt-2 mb-1">Aucun tarif ajouté</p>
            <p class="text-caption text-medium-emphasis mb-0">Optionnel — vous pouvez continuer sans tarifs</p>
          </div>

          <VRow dense>
            <VCol cols="6" v-for="(tarif, idx) in newPark.tarifs" :key="idx">
              <div class="nt-card">
                <div class="nt-card-header">
                  <span class="nt-card-num">Tarif {{ idx + 1 }}</span>
                  <button class="tarif-delete-btn" @click="removeTarif(idx)" title="Supprimer">
                    <VIcon icon="tabler-trash" size="13" />
                  </button>
                </div>
                <p style="font-size:11px;color:#666;margin:0 0 2px">Titre</p>
                <input v-model="tarif.title" class="nt-input" placeholder="Ex: Enfant, Adulte..." />
                <p style="font-size:11px;color:#666;margin:4px 0 2px">Prix</p>
                <div class="nt-price-row">
                  <span class="nt-euro">€</span>
                  <input v-model="tarif.price" class="nt-price-input" type="number" min="0" step="0.01" placeholder="0.00" />
                </div>
                <p style="font-size:11px;color:#666;margin:4px 0 2px">Détails</p>
                <textarea v-model="tarif.details" class="nt-textarea" placeholder="Ex: De 3 à 12 ans..."></textarea>
              </div>
            </VCol>
          </VRow>
        </VCardText>

        <!-- Footer -->
        <VDivider />
        <div v-if="parkSaveError" class="px-5 pt-2 pb-1" style="background:#fff3f3;border-top:1px solid #ffd0d0;">
          <div class="d-flex align-center gap-2" style="color:#c62828;font-size:13px;">
            <VIcon icon="tabler-alert-circle" size="16" color="#c62828" />
            {{ parkSaveError }}
          </div>
        </div>
        <div class="modal-footer px-5 py-3">
          <button
            class="modal-btn"
            :class="createParkStep === 1 ? 'modal-btn--prev-disabled' : 'modal-btn--prev'"
            :disabled="createParkStep === 1"
            @click="prevParkStep"
          >
            ← Précédent
          </button>
          <button
            v-if="createParkStep < 3"
            class="modal-btn modal-btn--next"
            @click="nextParkStep"
          >
            Suivant →
          </button>
          <button
            v-else
            class="modal-btn modal-btn--create"
            :disabled="isSavingPark"
            @click="savePark"
          >
            <span v-if="isSavingPark" class="d-flex align-center justify-center gap-2">
              <VProgressCircular size="14" width="2" indeterminate color="#fff" />
              Création en cours...
            </span>
            <span v-else>Créer le parc</span>
          </button>
        </div>

      </VCard>
    </VDialog>

    <!-- EDIT PARK MODAL -->
    <VDialog v-model="editParkDialog" max-width="700" persistent scrollable>
      <VCard>
        <!-- Header -->
        <div class="modal-header px-5 pt-4 pb-2">
          <button class="modal-back-btn" @click="editParkDialog = false">
            <VIcon icon="tabler-arrow-left" size="18" />
          </button>
          <span class="modal-title">Modifié le parc</span>
        </div>

        <!-- Tab bar -->
        <div class="ep-tab-bar px-5 pt-2 pb-3">
          <button
            v-for="tab in editParkTabs"
            :key="tab.key"
            class="ep-tab-btn"
            :class="editParkTab === tab.key ? 'ep-tab-btn--active' : 'ep-tab-btn--inactive'"
            @click="editParkTab = tab.key"
          >{{ tab.label }}</button>
        </div>

        <VDivider />

        <!-- Content -->
        <VCardText class="px-5 py-4" style="max-height:62vh;overflow-y:auto;">

          <!-- ── Info Générales ── -->
          <VForm ref="editParkForm" v-if="editParkTab === 'info'">
            <VRow dense>
              <VCol cols="6">
                <p class="field-label">Franchise</p>
                <AppSelect
                  v-model="editPark.franchise_id"
                  :items="franchiseOptions"
                  item-title="nom"
                  item-value="id"
                  placeholder="Sélectionner une franchise"
                  hide-details density="compact"
                />
              </VCol>

              <VCol cols="6">
                <p class="field-label">Numéro</p>
                <div v-for="(_, idx) in (editPark.numeros || [''])" :key="idx" class="d-flex align-center gap-1 mb-1">
                  <AppTextField
                    v-model="editPark.numeros[idx]"
                    placeholder="Entrer le numéro de parc"
                    hide-details density="compact" class="flex-grow-1"
                  />
                  <button
                    v-if="editPark.numeros && editPark.numeros.length > 1"
                    class="add-numero-btn"
                    style="color:#e53935;padding:0 4px"
                    @click.prevent="editPark.numeros.splice(idx,1)"
                  >
                    <VIcon icon="tabler-x" size="13" />
                  </button>
                </div>
                <button class="add-numero-btn mt-1" @click.prevent="editPark.numeros ? editPark.numeros.push('') : editPark.numeros = ['']">
                  <VIcon icon="tabler-plus" size="13" /> Ajouter Un Numéro
                </button>
              </VCol>

              <VCol cols="6" class="mt-2">
                <p class="field-label">Adresse complète</p>
                <AppTextField
                  v-model="editPark.adresse"
                  placeholder="Ex: 12 Rue de la Paix, 75001 Paris"
                  hide-details density="compact"
                  prepend-inner-icon="tabler-map-pin"
                />
              </VCol>

              <VCol cols="6" class="mt-2">
                <p class="field-label">Localisation (Adresse)</p>
                <AppTextField
                  v-model="editPark.localisation"
                  placeholder="Entrer la localisation du parc"
                  hide-details density="compact"
                  append-inner-icon="tabler-navigation"
                />
              </VCol>

              <VCol cols="12" class="mt-2">
                <p class="field-label">Description de Parc</p>
                <AppTextarea v-model="editPark.description" placeholder="écrire quelque chose..." hide-details density="compact" rows="3" />
              </VCol>

              <VCol cols="3" class="mt-2">
                <p class="field-label">Facebook</p>
                <AppTextField v-model="editPark.facebook" placeholder="@RoyalKidsFR" hide-details density="compact" prepend-inner-icon="tabler-brand-facebook" />
              </VCol>
              <VCol cols="3" class="mt-2">
                <p class="field-label">Instagram</p>
                <AppTextField v-model="editPark.instagram" placeholder="@RoyalKidsFR" hide-details density="compact" prepend-inner-icon="tabler-brand-instagram" />
              </VCol>
              <VCol cols="3" class="mt-2">
                <p class="field-label">TikTok</p>
                <AppTextField v-model="editPark.tiktok" placeholder="@RoyalKidsFR" hide-details density="compact" prepend-inner-icon="tabler-brand-tiktok" />
              </VCol>
              <VCol cols="3" class="mt-2">
                <p class="field-label">Youtube</p>
                <AppTextField v-model="editPark.youtube" placeholder="@RoyalKidsFR" hide-details density="compact" prepend-inner-icon="tabler-brand-youtube" />
              </VCol>

              <VCol cols="6" class="mt-2">
                <p class="field-label">Admin associé</p>
                <AppSelect
                  v-model="editPark.admin_id"
                  :items="adminOptions"
                  item-title="name"
                  item-value="id"
                  placeholder="Sélectionner un admin"
                  clearable hide-details density="compact"
                />
              </VCol>

              <VCol cols="6" class="mt-2">
                <p class="field-label">Statut</p>
                <AppSelect
                  v-model="editPark.status"
                  :items="statusOptions"
                  item-title="label"
                  item-value="value"
                  hide-details density="compact"
                />
              </VCol>

              <!-- RIB / IBAN -->
              <VCol cols="6" class="mt-2">
                <p class="field-label">RIB / IBAN</p>
                <AppTextField
                  v-model="editPark.iban"
                  placeholder="Ex: FR76 3000 6000 0112 3456 7890 189"
                  hide-details
                  density="compact"
                  prepend-inner-icon="tabler-building-bank"
                />
              </VCol>

              <!-- Image du parc -->
              <VCol cols="12" class="mt-2">
                <p class="field-label">Image de parc</p>
                <div class="image-upload-zone mb-1" style="cursor:pointer" @click="$refs.editParkImageInput.click()">
                  <VImg v-if="editPark.imagePreview" :src="editPark.imagePreview" height="80" contain />
                  <VImg v-else-if="editPark.image_url || editPark.image" :src="getImageUrl(editPark.image_url || editPark.image)" height="80" contain />
                  <div v-else class="image-upload-placeholder">
                    <VIcon icon="tabler-upload" size="22" color="grey" />
                    <span style="font-size:11px;color:#9e9e9e;margin-top:4px">Cliquer pour changer l'image</span>
                  </div>
                </div>
                <input ref="editParkImageInput" type="file" accept="image/jpg,image/jpeg,image/png,image/gif" class="d-none" @change="onEditParkImageChange" />
                <p class="text-caption text-medium-emphasis">JPG, GIF ou PNG — max 800 Ko</p>
              </VCol>
            </VRow>
          </VForm>

          <!-- ── Services + Jeux ── -->
          <div v-else-if="editParkTab === 'services'">

            <!-- Horaires d'ouverture -->
            <p class="section-title mb-2">Horaires d'ouverture</p>
            <div class="horaires-row mb-2">
              <div v-for="day in workDays" :key="day.key" class="horaire-day">
                <p class="horaire-day-label">{{ day.label }}</p>
                <div class="horaire-inputs">
                  <div class="hour-box">
                    <input v-model="editPark.horaires[day.key].open" class="hour-input" type="number" min="0" max="23" />
                    <span class="hour-suffix">h</span>
                  </div>
                  <span class="hour-sep">-</span>
                  <div class="hour-box">
                    <input v-model="editPark.horaires[day.key].close" class="hour-input" type="number" min="0" max="23" />
                    <span class="hour-suffix">h</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Vacances et jours fériés -->
            <div class="mb-3">
              <p class="horaire-day-label">Vacances et jours fériés</p>
              <div class="horaire-inputs">
                <div class="hour-box">
                  <input v-model="editPark.horaires.vacances.open" class="hour-input" type="number" min="0" max="23" />
                  <span class="hour-suffix">h</span>
                </div>
                <span class="hour-sep">-</span>
                <div class="hour-box">
                  <input v-model="editPark.horaires.vacances.close" class="hour-input" type="number" min="0" max="23" />
                  <span class="hour-suffix">h</span>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <p class="section-title mb-2">Notes</p>
            <div class="notes-grid mb-3">
              <label class="note-check">
                <input type="checkbox" v-model="editPark.notes.chaussettes" /> Chaussettes Obligatoire
              </label>
              <label class="note-check">
                <input type="checkbox" v-model="editPark.notes.pique_nique" /> Pique nique interdite
              </label>
              <label class="note-check">
                <input type="checkbox" v-model="editPark.notes.wifi" /> Wifi Zone
              </label>
              <label class="note-check">
                <input type="checkbox" v-model="editPark.notes.climatise" /> Espace Climatisé
              </label>
              <label class="note-check note-check--with-input">
                <input type="checkbox" v-model="editPark.notes.note1_enabled" />
                <input type="text" v-model="editPark.notes.note1" class="note-text-input" placeholder="Note 1" />
              </label>
              <label class="note-check note-check--with-input">
                <input type="checkbox" v-model="editPark.notes.note2_enabled" />
                <input type="text" v-model="editPark.notes.note2" class="note-text-input" placeholder="Note 2" />
              </label>
            </div>

            <!-- Services -->
            <p class="section-title mb-2">Services</p>
            <div class="jeux-grid mb-4">
              <div>
                <p class="jeux-col-title">Pour Les Petits</p>
                <div class="d-flex align-center gap-1 mb-1">
                  <span class="text-caption">de</span>
                  <input v-model="editPark.jeux.petits.age_max" type="number" class="age-input" placeholder="0" />
                  <span class="text-caption">- à</span>
                </div>
                <textarea v-model="editPark.jeux.petits.description" class="jeux-textarea" placeholder="écrire quelque chose..."></textarea>
              </div>
              <div>
                <p class="jeux-col-title">Pour Les Grands</p>
                <div class="d-flex align-center gap-1 mb-1">
                  <span class="text-caption">de</span>
                  <input v-model="editPark.jeux.grands.age_min" type="number" class="age-input" placeholder="0" />
                  <span class="text-caption">-</span>
                  <span class="text-caption">à</span>
                  <input v-model="editPark.jeux.grands.age_max" type="number" class="age-input" placeholder="0" />
                </div>
                <textarea v-model="editPark.jeux.grands.description" class="jeux-textarea" placeholder="écrire quelque chose..."></textarea>
              </div>
              <div class="d-flex flex-column">
                <p class="jeux-col-title">Pour Les Parents</p>
                <textarea v-model="editPark.jeux.parents.description" class="jeux-textarea jeux-textarea--tall" placeholder="écrire quelque chose..."></textarea>
              </div>
            </div>


          </div>

          <!-- ── Tarifs ── -->
          <div v-else-if="editParkTab === 'tarifs'">
            <div class="d-flex align-center justify-space-between mb-3">
              <p class="section-title mb-0">Tarifs</p>
              <button class="add-tarif-btn" @click="addEditTarif">
                <span class="add-tarif-icon"><VIcon icon="tabler-plus" size="13" /></span>
                Ajouter Un Tarif
              </button>
            </div>
            <VRow>
              <VCol cols="12" sm="6" v-for="(tarif, idx) in editPark.tarifs" :key="idx">
                <VCard variant="outlined" class="pa-3">
                  <div class="d-flex justify-end mb-2">
                    <IconBtn size="small" color="error" @click="removeEditTarif(idx)">
                      <VIcon icon="tabler-x" size="16" />
                    </IconBtn>
                  </div>
                  <AppTextField v-model="tarif.title" label="Titre" class="mb-2" density="compact" />
                  <AppTextField v-model="tarif.price" label="Prix (€)" type="number" class="mb-2" density="compact" />
                  <AppTextarea v-model="tarif.details" label="Détails" rows="2" density="compact" />
                </VCard>
              </VCol>
            </VRow>
          </div>

        </VCardText>

        <VDivider />
        <div class="px-5 py-3">
          <button
            class="modal-btn modal-btn--create"
            style="width:100%"
            :disabled="isSavingPark || !editParkDirty"
            :style="editParkDirty && !isSavingPark ? '' : 'opacity:0.5;cursor:not-allowed'"
            @click="updatePark"
          >
            {{ isSavingPark ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </VCard>
    </VDialog>

    <!-- PARK DETAILS MODAL -->
    <VDialog v-model="parkDetailsDialog" max-width="700">
      <VCard v-if="selectedPark">
        <VCardTitle class="d-flex align-center justify-space-between pa-4">
          <span>Détails du parc</span>
          <IconBtn @click="parkDetailsDialog = false"><VIcon icon="tabler-x" /></IconBtn>
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-4">
          <VImg
            :src="getImageUrl(selectedPark.image || selectedPark.photo || selectedPark.thumbnail) || parkPlaceholder"
            height="200"
            cover
            class="rounded mb-4"
          />
          <VRow>
            <VCol cols="12" sm="6">
              <p class="text-caption text-medium-emphasis mb-0">Nom</p>
              <p class="text-body-1 font-weight-medium">{{ selectedPark.nom || selectedPark.name || '—' }}</p>
            </VCol>
            <VCol cols="12" sm="6">
              <p class="text-caption text-medium-emphasis mb-0">Statut</p>
              <VChip :color="getParkStatusColor(selectedPark.status)" size="small">
                {{ getParkStatusLabel(selectedPark.status) }}
              </VChip>
            </VCol>
            <VCol cols="12" sm="6">
              <p class="text-caption text-medium-emphasis mb-0">Localisation</p>
              <p class="text-body-1">{{ selectedPark.localisation || selectedPark.location || '—' }}</p>
            </VCol>
            <VCol cols="12" sm="6">
              <p class="text-caption text-medium-emphasis mb-0">Numéro(s)</p>
              <p class="text-body-1">
                {{
                  selectedPark.numeros && selectedPark.numeros.length
                    ? selectedPark.numeros.join(', ')
                    : (selectedPark.numero || '—')
                }}
              </p>
            </VCol>
            <VCol cols="12" sm="6">
              <p class="text-caption text-medium-emphasis mb-0">Adresse complète</p>
              <p class="text-body-1">{{ selectedPark.adresse || selectedPark.address || '—' }}</p>
            </VCol>
            <VCol cols="12" sm="6">
              <p class="text-caption text-medium-emphasis mb-0">Franchise</p>
              <p class="text-body-1">
                {{
                  (selectedPark.franchise && (selectedPark.franchise.nom || selectedPark.franchise.name))
                  || (franchiseOptions.find(f => f.id === selectedPark.franchise_id)?.nom)
                  || '—'
                }}
              </p>
            </VCol>
            <VCol cols="12" sm="6" v-if="selectedPark.iban">
              <p class="text-caption text-medium-emphasis mb-0">IBAN / RIB</p>
              <p class="text-body-1">{{ selectedPark.iban }}</p>
            </VCol>
            <VCol cols="12" v-if="selectedPark.description">
              <p class="text-caption text-medium-emphasis mb-0">Description</p>
              <p class="text-body-1">{{ selectedPark.description }}</p>
            </VCol>
            <VCol cols="12" v-if="selectedPark.tarifs && selectedPark.tarifs.length">
              <p class="text-caption text-medium-emphasis mb-2">Tarifs</p>
              <div class="d-flex flex-wrap gap-2">
                <VChip
                  v-for="tarif in selectedPark.tarifs"
                  :key="tarif.id || tarif.title"
                  size="small"
                  variant="outlined"
                  color="primary"
                >
                  {{ tarif.title }} — {{ tarif.price }}€
                </VChip>
              </div>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- DELETE PARK DIALOG -->
    <VDialog v-model="deleteParkDialog" max-width="450">
      <VCard>
        <VCardTitle class="pa-4">Confirmer la suppression</VCardTitle>
        <VCardText>
          Voulez-vous vraiment supprimer le parc <strong>{{ selectedPark ? (selectedPark.nom || selectedPark.name) : '' }}</strong> ? Cette action est irréversible.
        </VCardText>
        <VCardActions class="pa-4 gap-3">
          <VSpacer />
          <VBtn variant="tonal" color="secondary" @click="deleteParkDialog = false">Annuler</VBtn>
          <VBtn color="error" :loading="isDeletingPark" @click="confirmDeletePark">Supprimer</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- CREATE FRANCHISE MODAL (2-step stepper) -->
    <VDialog v-model="createFranchiseDialog" max-width="700" persistent>
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between pa-5" style="background:#1a1a2e;color:#fff">
          <span class="font-weight-bold">Nouvelle Franchise</span>
          <IconBtn @click="createFranchiseDialog = false" color="#fff"><VIcon icon="tabler-x" /></IconBtn>
        </VCardTitle>
        <VDivider />

        <VCardText class="pa-4">
          <!-- Stepper Header -->
          <div class="d-flex gap-2 mb-6 align-center">
            <template v-for="(step, i) in franchiseSteps" :key="i">
              <div class="d-flex align-center gap-2">
                <div
                  class="d-flex align-center justify-center rounded-circle text-body-2 font-weight-bold"
                  style="width:30px; height:30px; flex-shrink:0; transition: all 0.3s ease"
                  :style="createFranchiseStep > i + 1 ? 'background:#E8A838; color:#1a1a2e;' : createFranchiseStep === i + 1 ? 'background:#1a1a2e; color:#fff; border:2px solid #E8A838' : 'background:#f0f0f0; color:#9e9e9e;'"
                >
                  <VIcon v-if="createFranchiseStep > i + 1" icon="tabler-check" size="14" />
                  <span v-else>{{ i + 1 }}</span>
                </div>
                <span class="text-body-2 font-weight-bold" :style="createFranchiseStep === i + 1 ? 'color:#1a1a2e' : 'color:#9e9e9e'">{{ step }}</span>
              </div>
              <VIcon v-if="i < franchiseSteps.length - 1" icon="tabler-chevron-right" size="16" color="#E8A838" class="mx-1" />
            </template>
          </div>

          <!-- Step 1: Owner franchisé -->
          <VForm ref="createFranchiseForm1" v-if="createFranchiseStep === 1">
            <p class="text-body-1 font-weight-medium mb-4">
              <VIcon icon="tabler-user-shield" size="18" class="me-2" style="color:#E8A838" />
              Créer le compte Owner franchisé
            </p>
            <VRow>
              <VCol cols="12" sm="6">
                <AppTextField
                  v-model="newFranchise.owner.username"
                  label="Nom d'utilisateur *"
                  placeholder="ex: john_doe"
                  :rules="[requiredValidator]"
                />
              </VCol>
              <VCol cols="12" sm="6">
                <AppTextField
                  v-model="newFranchise.owner.email"
                  label="Email *"
                  type="email"
                  placeholder="owner@example.com"
                  :rules="[requiredValidator, emailValidator]"
                />
              </VCol>
              <VCol cols="12" sm="6">
                <AppTextField
                  v-model="newFranchise.owner.password"
                  label="Mot de passe *"
                  type="password"
                  placeholder="••••••••"
                  :rules="[requiredValidator, v => v.length >= 8 || 'Min. 8 caractères']"
                />
              </VCol>
              <VCol cols="12" sm="6">
                <AppTextField
                  v-model="newFranchise.owner.role"
                  label="Rôle"
                  readonly
                  style="background:#f9f9f9"
                />
              </VCol>
            </VRow>
          </VForm>

          <!-- Step 2: Informations -->
          <VForm ref="createFranchiseForm2" v-if="createFranchiseStep === 2">
            <VRow>
              <VCol cols="12">
                <div
                  class="border rounded pa-4 text-center cursor-pointer"
                  style="border-style: dashed !important; min-height:100px;"
                  @click="$refs.franchiseLogoInput.click()"
                >
                  <VImg v-if="newFranchise.logoPreview" :src="newFranchise.logoPreview" height="80" contain class="mb-1" />
                  <div v-else>
                    <VIcon icon="tabler-upload" size="28" class="mb-1" color="grey" />
                    <p class="text-body-2 text-medium-emphasis mb-0">Upload logo</p>
                  </div>
                </div>
                <input ref="franchiseLogoInput" type="file" accept="image/*" class="d-none" @change="onFranchiseLogoChange" />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="newFranchise.name"
                  label="Nom de la franchise *"
                  :rules="[
                    v => (!!v && v.trim().length > 0)     || 'Le nom est requis',
                    v => v.trim().length >= 2              || 'Minimum 2 caractères',
                    v => v.trim().length <= 100            || 'Maximum 100 caractères',
                    v => !/^\s+$/.test(v)                  || 'Le nom ne peut pas être composé uniquement d\'espaces',
                    v => /[a-zA-ZÀ-ÿ0-9]/.test(v.trim())  || 'Le nom doit contenir au moins une lettre ou un chiffre',
                  ]"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <AppSelect
                  v-model="newFranchise.status"
                  :items="[{title:'Active', value:'active'},{title:'Suspendue', value:'suspended'}]"
                  item-title="title"
                  item-value="value"
                  label="Statut *"
                  :rules="[requiredValidator]"
                />
              </VCol>

              <VCol cols="12">
                <AppTextarea v-model="newFranchise.description" label="Description" rows="2" />
              </VCol>

              <VCol cols="12" sm="4">
                <AppTextField
                  v-model="newFranchise.siret"
                  label="SIRET"
                  :disabled="!!newFranchise.siren"
                  :rules="[() => !!(newFranchise.siret || newFranchise.siren) || 'Veuillez renseigner SIRET ou SIREN']"
                />
              </VCol>

              <VCol cols="12" sm="4">
                <AppTextField
                  v-model="newFranchise.siren"
                  label="SIREN"
                  :disabled="!!newFranchise.siret"
                  :rules="[() => !!(newFranchise.siret || newFranchise.siren) || 'Veuillez renseigner SIRET ou SIREN']"
                />
              </VCol>

              <VCol cols="12" sm="4">
                <AppTextField
                  v-model="newFranchise.tva"
                  label="Numéro de TVA"
                  @keypress="(e) => { if (!/\d/.test(e.key)) e.preventDefault() }"
                  @paste="(e) => { e.preventDefault(); const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, ''); newFranchise.tva = (newFranchise.tva || '') + text }"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField v-model="newFranchise.rib_iban" label="RIB / IBAN" placeholder="ex: FR76 3000 6000 0112 3456 7890 189" />
              </VCol>
            </VRow>
          </VForm>

          <!-- Step 3: Décharges -->
          <div v-if="createFranchiseStep === 3">
            <p class="text-body-1 font-weight-medium mb-3">Décharges & Clauses</p>
            <AppTextarea
              v-model="newFranchise.decharges"
              label="Contenu des décharges et clauses"
              rows="8"
              class="mb-4"
            />
            <VCheckbox
              v-model="newFranchise.signature_obligatoire"
              label="Signature obligatoire du client"
              density="compact"
            />
          </div>
        </VCardText>

        <VDivider />
        <VCardActions class="pa-4 gap-3">
          <VBtn variant="tonal" color="secondary" @click="prevFranchiseStep" :disabled="createFranchiseStep === 1">
            Précédent
          </VBtn>
          <VSpacer />
          <VBtn variant="tonal" color="secondary" @click="createFranchiseDialog = false">Annuler</VBtn>
          <VBtn v-if="createFranchiseStep < 3" color="primary" @click="nextFranchiseStep">Suivant</VBtn>
          <VBtn v-else class="btn-create-franchise" elevation="0" :loading="isSavingFranchise" @click="saveFranchise">
            Créer la franchise
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- EDIT FRANCHISE MODAL -->
    <VDialog v-model="editFranchiseDialog" max-width="700" persistent>
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between pa-4" style="background:#1a1a2e;color:#fff">
          <span class="font-weight-bold">Modifier la franchise</span>
          <IconBtn @click="editFranchiseDialog = false" color="#fff"><VIcon icon="tabler-x" /></IconBtn>
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-4">
          <VForm ref="editFranchiseForm">
            <VRow>
              <!-- Logo -->
              <VCol cols="12">
                <div
                  class="border rounded pa-4 text-center cursor-pointer"
                  style="border-style: dashed !important; min-height:100px;"
                  @click="$refs.editFranchiseLogoInput.click()"
                >
                  <VImg v-if="editFranchise.logoPreview || editFranchise.logo || editFranchise.image" :src="editFranchise.logoPreview || editFranchise.logo || editFranchise.image" height="80" contain class="mb-1" />
                  <div v-else>
                    <VIcon icon="tabler-upload" size="28" class="mb-1" color="grey" />
                    <p class="text-body-2 text-medium-emphasis mb-0">Changer le logo</p>
                  </div>
                </div>
                <input ref="editFranchiseLogoInput" type="file" accept="image/*" class="d-none" @change="onEditFranchiseLogoChange" />
              </VCol>

              <!-- Nom -->
              <VCol cols="12">
                <AppTextField v-model="editFranchise.nom" label="Nom de la franchise *" :rules="[requiredValidator]" />
              </VCol>

              <!-- Statut -->
              <VCol cols="12" sm="6">
                <AppSelect
                  v-model="editFranchise.status"
                  :items="[{title:'Active', value:'active'},{title:'Suspendue', value:'suspended'}]"
                  item-title="title"
                  item-value="value"
                  label="Statut"
                />
              </VCol>

              <!-- Description -->
              <VCol cols="12">
                <AppTextarea v-model="editFranchise.description" label="Description" rows="2" />
              </VCol>

              <!-- SIRET / SIREN / TVA -->
              <VCol cols="12" sm="4">
                <AppTextField
                  v-model="editFranchise.siret"
                  label="SIRET"
                  :disabled="!!editFranchise.siren"
                  :rules="[() => !!(editFranchise.siret || editFranchise.siren) || 'Veuillez renseigner SIRET ou SIREN']"
                />
              </VCol>
              <VCol cols="12" sm="4">
                <AppTextField
                  v-model="editFranchise.siren"
                  label="SIREN"
                  :disabled="!!editFranchise.siret"
                  :rules="[() => !!(editFranchise.siret || editFranchise.siren) || 'Veuillez renseigner SIRET ou SIREN']"
                />
              </VCol>
              <VCol cols="12" sm="4">
                <AppTextField
                  v-model="editFranchise.tva"
                  label="Numéro de TVA"
                  @keypress="(e) => { if (!/\d/.test(e.key)) e.preventDefault() }"
                  @paste="(e) => { e.preventDefault(); const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, ''); editFranchise.tva = (editFranchise.tva || '') + text }"
                />
              </VCol>

              <!-- RIB / IBAN -->
              <VCol cols="12">
                <AppTextField v-model="editFranchise.rib_iban" label="RIB / IBAN" placeholder="ex: FR76 3000 6000 0112 3456 7890 189" />
              </VCol>

              <!-- Décharges -->
              <VCol cols="12">
                <AppTextarea v-model="editFranchise.decharges" label="Décharges & Clauses" rows="3" />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
        <VDivider />
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn variant="tonal" color="secondary" @click="editFranchiseDialog = false">Annuler</VBtn>
          <VBtn color="success" :loading="isSavingFranchise" @click="updateFranchise">Enregistrer</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- FRANCHISE DETAILS MODAL -->
    <VDialog v-model="franchiseDetailsDialog" max-width="650">
      <VCard v-if="selectedFranchise">
        <VCardTitle class="d-flex align-center justify-space-between pa-4" style="background:#1a1a2e;color:#fff">
          <span class="font-weight-bold">Détails de la franchise</span>
          <IconBtn @click="franchiseDetailsDialog = false" color="#fff"><VIcon icon="tabler-x" /></IconBtn>
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-4">
          <!-- Logo + Nom + Statut -->
          <div class="d-flex align-center gap-4 mb-4">
            <VAvatar size="72" rounded>
              <VImg :src="selectedFranchise.logo || selectedFranchise.image || parkPlaceholder" cover />
            </VAvatar>
            <div class="flex-grow-1">
              <p class="text-h6 mb-1 font-weight-bold">{{ selectedFranchise.nom || selectedFranchise.name }}</p>
              <div class="d-flex align-center gap-2">
                <VChip
                  :color="selectedFranchise.status === 'active' ? 'success' : 'warning'"
                  size="small"
                  label
                >
                  {{ selectedFranchise.status === 'active' ? 'Active' : 'Suspendue' }}
                </VChip>
                <span class="text-body-2 text-medium-emphasis">{{ selectedFranchise.parks_count ?? 0 }} parc(s)</span>
              </div>
            </div>
          </div>
          <VDivider class="mb-4" />
          <VRow>
            <!-- Description -->
            <VCol cols="12">
              <p class="text-caption text-medium-emphasis mb-0">Description</p>
              <p class="text-body-1">{{ selectedFranchise.description || '—' }}</p>
            </VCol>

            <!-- SIRET -->
            <VCol cols="12" sm="4">
              <p class="text-caption text-medium-emphasis mb-0">SIRET</p>
              <p class="text-body-1">{{ selectedFranchise.siret || '—' }}</p>
            </VCol>

            <!-- SIREN -->
            <VCol cols="12" sm="4">
              <p class="text-caption text-medium-emphasis mb-0">SIREN</p>
              <p class="text-body-1">{{ selectedFranchise.siren || '—' }}</p>
            </VCol>

            <!-- TVA -->
            <VCol cols="12" sm="4">
              <p class="text-caption text-medium-emphasis mb-0">N° TVA</p>
              <p class="text-body-1">{{ selectedFranchise.tva || '—' }}</p>
            </VCol>

            <!-- RIB / IBAN -->
            <VCol cols="12">
              <p class="text-caption text-medium-emphasis mb-0">RIB / IBAN</p>
              <p class="text-body-1">{{ selectedFranchise.rib_iban || '—' }}</p>
            </VCol>

            <!-- Owner franchisé -->
            <VCol cols="12" v-if="selectedFranchise.owner">
              <p class="text-caption text-medium-emphasis mb-0">Owner franchisé</p>
              <p class="text-body-1">
                {{ selectedFranchise.owner.username || (selectedFranchise.owner.firstname ? selectedFranchise.owner.firstname + ' ' + selectedFranchise.owner.lastname : '') || '—' }}
                <span v-if="selectedFranchise.owner.email" class="text-medium-emphasis"> — {{ selectedFranchise.owner.email }}</span>
              </p>
            </VCol>

            <!-- Décharges & Clauses -->
            <VCol cols="12" v-if="selectedFranchise.decharges">
              <p class="text-caption text-medium-emphasis mb-0">Décharges & Clauses</p>
              <p class="text-body-1" style="white-space: pre-wrap;">{{ selectedFranchise.decharges }}</p>
            </VCol>

            <!-- Signature obligatoire -->
            <VCol cols="12">
              <p class="text-caption text-medium-emphasis mb-1">Signature obligatoire</p>
              <VChip :color="selectedFranchise.signature_obligatoire ? 'success' : 'default'" size="small" label>
                {{ selectedFranchise.signature_obligatoire ? 'Oui' : 'Non' }}
              </VChip>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- DELETE FRANCHISE DIALOG -->
    <VDialog v-model="deleteFranchiseDialog" max-width="420">
      <VCard>
        <VCardTitle class="pa-4 d-flex align-center gap-2">
          <VIcon icon="tabler-alert-triangle" color="error" />
          Confirmer la suppression
        </VCardTitle>
        <VCardText>
          Voulez-vous vraiment supprimer la franchise <strong>{{ selectedFranchise ? (selectedFranchise.nom || selectedFranchise.name) : '' }}</strong> ? Cette action est irréversible.
        </VCardText>
        <VCardActions class="pa-4 gap-3">
          <VSpacer />
          <VBtn variant="tonal" color="secondary" @click="deleteFranchiseDialog = false">Annuler</VBtn>
          <VBtn color="error" :loading="isDeletingFranchise" @click="confirmDeleteFranchise">Supprimer</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Snackbar -->
    <VSnackbar
      v-model="isSnackbarVisible"
      location="bottom end"
      variant="flat"
      :color="snackbar.color"
    >
      {{ snackbar.message }}
    </VSnackbar>
  </div>
</template>

<script>
import { $api } from "@/utils/api";
import debounce from "lodash/debounce";
import { VDataTableServer } from "vuetify/labs/VDataTable";
import { requiredValidator, emailValidator } from "@validators";

export default {
  components: { VDataTableServer },

  setup() {
    return {
      requiredValidator,
      emailValidator,
      parkPlaceholder: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239e9e9e' font-size='12'%3EImage%3C/text%3E%3C/svg%3E",
    };
  },

  data() {
    return {
      activeTab: "parks",

      frenchRegions: [
        "Auvergne-Rhône-Alpes","Bourgogne-Franche-Comté","Bretagne",
        "Centre-Val de Loire","Corse","Grand Est","Hauts-de-France",
        "Île-de-France","Normandie","Nouvelle-Aquitaine","Occitanie",
        "Pays de la Loire","Provence-Alpes-Côte d'Azur",
        "Guadeloupe","Martinique","Guyane","La Réunion","Mayotte",
      ],

      // ---- Parks ----
      parks: [],
      parkSearch: "",
      isParksLoading: false,
      parkFilter: { franchise_id: null, status: null, localisation: "" },
      appliedParkFilter: { franchise_id: null, status: null, localisation: "" },

      // ---- Franchises ----
      franchises: [],
      franchiseSearch: "",
      isFranchisesLoading: false,
      franchisePage: 1,
      franchisePerPage: 10,
      franchiseTotal: 0,

      // ---- Options ----
      franchiseOptions: [],
      adminOptions: [],
      ownerOptions: [],
      caisseOptions: [],
      statusOptions: [
        { label: "Ouvert", value: "open" },
        { label: "Fermé", value: "closed" },
        { label: "En maintenance", value: "maintenance" },
      ],
      workDays: [
        { key: "monday",    label: "Lundi" },
        { key: "tuesday",   label: "Mardi" },
        { key: "wednesday", label: "Mercredi" },
        { key: "thursday",  label: "Jeudi" },
        { key: "friday",    label: "Vendredi" },
      ],

      // ---- Franchise Table Headers ----
      franchiseHeaders: [
        { title: "LOGO", key: "logo", sortable: false },
        { title: "FRANCHISE", key: "nom", sortable: false },
        { title: "NOMBRES DES PARCS", key: "parks_count", sortable: false },
        { title: "ACTION", key: "actions", sortable: false },
      ],

      // ---- Tarif Categories ----
      tarifCategories: [
        { label: "Enfants", value: "enfants" },
        { label: "Adultes", value: "adultes" },
        { label: "Groupes", value: "groupes" },
        { label: "VIP", value: "vip" },
      ],

      // ---- Create Park ----
      createParkDialog: false,
      createParkStep: 1,
      isSavingPark: false,
      parkSaveError: "",
      parkSteps: ["Informations principales", "Services", "Tarifs"],
      newPark: this.getDefaultPark(),

      // ---- Edit Park ----
      editParkDialog: false,
      editParkTab: "info",
      editPark: {},
      editParkDirty: false,
      editParkTabs: [
        { key: "info",     label: "Info Générales"  },
        { key: "services", label: "Services + Jeux"  },
        { key: "tarifs",   label: "Tarifs"           },
      ],

      // ---- Park Details ----
      parkDetailsDialog: false,
      selectedPark: null,

      // ---- Delete Park ----
      deleteParkDialog: false,
      isDeletingPark: false,

      // ---- Create Franchise ----
      createFranchiseDialog: false,
      createFranchiseStep: 1,
      isSavingFranchise: false,
      franchiseSteps: ["Owner franchisé", "Informations", "Décharges & Clauses"],
      newFranchise: this.getDefaultFranchise(),
      franchiseCache: {},

      // ---- Edit Franchise ----
      editFranchiseDialog: false,
      editFranchise: {},
      selectedFranchise: null,

      // ---- Franchise Details ----
      franchiseDetailsDialog: false,

      // ---- Delete Franchise ----
      deleteFranchiseDialog: false,
      isDeletingFranchise: false,
      deletePassword: "",
      showDeletePassword: false,

      // ---- Snackbar ----
      isSnackbarVisible: false,
      snackbar: { message: "", color: "success" },
    };
  },

  computed: {
    filteredParks() {
      let result = [...this.parks];
      const q = this.parkSearch.toLowerCase();
      if (q.length >= 2) {
        result = result.filter(p =>
          (p.nom || p.name || "").toLowerCase().includes(q) ||
          (p.localisation || "").toLowerCase().includes(q)
        );
      }
      if (this.appliedParkFilter.franchise_id) {
        result = result.filter(p => p.franchise_id === this.appliedParkFilter.franchise_id);
      }
      if (this.appliedParkFilter.status) {
        result = result.filter(p => p.status === this.appliedParkFilter.status);
      }
      if (this.appliedParkFilter.localisation) {
        result = result.filter(p =>
          (p.localisation || "").toLowerCase().includes(this.appliedParkFilter.localisation.toLowerCase())
        );
      }
      return result;
    },
  },

  watch: {
    editPark: {
      deep: true,
      handler() { this.editParkDirty = true; },
    },
    franchiseSearch() {
      this.debouncedFranchiseSearch();
    },
    franchisePage() {
      this.getFranchises();
    },
    franchisePerPage() {
      this.franchisePage = 1;
      this.getFranchises();
    },
    activeTab(val) {
      if (val === "franchises" && !this.franchises.length) this.getFranchises();
    },
  },

  created() {
    this.debouncedFranchiseSearch = debounce(() => {
      this.franchisePage = 1;
      this.getFranchises();
    }, 500);
  },

  async mounted() {
    await Promise.all([
      this.getParks(),
      this.loadFranchiseOptions(),
      this.loadOwnerOptions(),
      this.loadAdminOptions(),
      this.loadCaisses(),
    ]);
  },

  beforeUnmount() {
    this.debouncedFranchiseSearch.cancel();
    if (this.newPark.imagePreview) URL.revokeObjectURL(this.newPark.imagePreview);
    if (this.newFranchise.logoPreview) URL.revokeObjectURL(this.newFranchise.logoPreview);
  },

  methods: {
    getImageUrl(path) {
      if (!path) return null;
      if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
      const base = (import.meta.env.VITE_BASE_URL || '').replace(/\/api.*$/, '');
      return base + (path.startsWith('/') ? path : '/' + path);
    },

    parseLatLng(str) {
      if (!str) return { lat: null, lng: null };
      const parts = str.split(',').map(s => parseFloat(s.trim()));
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { lat: parts[0], lng: parts[1] };
      }
      return { lat: null, lng: null };
    },

    // ---- Helpers ----
    getDefaultPark() {
      const horaires = {};
      ["monday","tuesday","wednesday","thursday","friday"].forEach(d => {
        horaires[d] = { open: 10, close: 19 };
      });
      horaires.vacances = { open: 10, close: 19 };
      return {
        nom: "",
        franchise_id: null, numeros: [""], region: "", localisation: "",
        adresse: "", iban: "",
        description: "", status: "open",
        admin_id: null, caisses: [],
        facebook: "", instagram: "", tiktok: "", youtube: "",
        image: null, imagePreview: null,
        horaires,
        notes: {
          chaussettes: false, pique_nique: false,
          wifi: false, climatise: false,
          note1_enabled: false, note1: "",
          note2_enabled: false, note2: "",
        },
        jeux: {
          petits:  { age_max: "", description: "" },
          grands:  { age_min: "", age_max: "", description: "" },
          parents: { description: "" },
        },
        tarifs: [],
      };
    },

    getDefaultFranchise() {
      return {
        name: "", description: "", owner_id: null, status: "active",
        siret: "", siren: "", tva: "", rib_iban: "", logo: null, logoPreview: null,
        decharges: "", signature_obligatoire: false,
        owner: { username: "", password: "", email: "", role: "owner_franchisé" },
      };
    },

    showSnackbar(message, color = "success") {
      this.snackbar = { message, color };
      this.isSnackbarVisible = true;
    },

    getParkStatusColor(status) {
      const map = { open: "success", closed: "error", maintenance: "warning" };
      return map[status] || "default";
    },

    getParkStatusLabel(status) {
      const map = { open: "Ouvert", closed: "Fermé", maintenance: "En maintenance" };
      return map[status] || status;
    },

    // ---- Data Loading ----
    async getParks() {
      this.isParksLoading = true;
      try {
        const res = await $api("/parks", { params: { per_page: 200 } });
        const parkList = res.data || res.parks || [];

        // Charger les caisses de chaque parc depuis l'API en parallèle
        const caisseResults = await Promise.allSettled(
          parkList.map(p => $api(`/cash-registers/park/${p.id}`, { params: { per_page: 200 } }))
        );

        this.parks = parkList.map((p, i) => {
          const extra = this.loadParkExtra(p.id);

          // Caisses depuis l'API (priorité), sinon localStorage
          let apiCaisses = null;
          if (caisseResults[i]?.status === 'fulfilled') {
            apiCaisses = (caisseResults[i].value.data || []).map(c => c.id);
          }
          const caisses = (apiCaisses && apiCaisses.length)
            ? apiCaisses
            : ((p.caisses && p.caisses.length)
              ? p.caisses.map(c => typeof c === 'object' ? c.id : c)
              : (extra.caisses || []));

          return {
            ...p,
            nom:          p.nom          || p.name                               || "",
            localisation: (p.latitude != null && p.longitude != null)
              ? `${p.latitude}, ${p.longitude}`
              : (p.localisation || p.city || p.location || p.address || ""),
            image:        p.image_url    || p.image   || p.photo    || p.thumbnail || null,
            social_links: p.social_links || {},
            facebook:  p.social_links?.facebook  || p.facebook  || "",
            instagram: p.social_links?.instagram || p.instagram || "",
            tiktok:    p.social_links?.tiktok    || p.tiktok    || "",
            youtube:   p.social_links?.youtube   || p.youtube   || "",
            region:    p.region   || extra.region   || "",
            numeros:   (p.numeros && p.numeros.length) ? p.numeros : (extra.numeros || []),
            admin_id:  extra.admin_id != null ? extra.admin_id : (p.admin_id || null),
            iban:      p.iban || extra.iban || "",
            caisses,
            caisses_count: apiCaisses ? apiCaisses.length : (p.caisses_count ?? caisses.length),
            jeux:      p.jeux || extra.jeux || null,
          };
        });
      } catch {
        this.showSnackbar("Impossible de charger les parcs", "error");
      } finally {
        this.isParksLoading = false;
      }
    },

    async getFranchises() {
      this.isFranchisesLoading = true;
      try {
        const res = await $api("/franchises", {
          params: {
            page: this.franchisePage,
            per_page: this.franchisePerPage,
            keyword: this.franchiseSearch.length >= 2 ? this.franchiseSearch : "",
          },
        });
        this.franchises = (res.data || []).map(f => ({ ...f, logo: f.logo_url || f.logo || null }));
        this.franchiseTotal = res.total || this.franchises.length;
      } catch {
        this.showSnackbar("Impossible de charger les franchises", "error");
      } finally {
        this.isFranchisesLoading = false;
      }
    },

    async loadFranchiseOptions() {
      try {
        const res = await $api("/franchises", { params: { per_page: 100 } });
        this.franchiseOptions = (res.data || []).map(f => ({ ...f, nom: f.nom || f.name }));
      } catch { /* silent */ }
    },

    async loadOwnerOptions() {
      try {
        const res = await $api("/owners", { params: { per_page: 200 } });
        this.ownerOptions = (res.data || []).map(o => ({
          id: o.id,
          name: o.user ? `${o.user.firstname} ${o.user.lastname}` : `Owner #${o.id}`,
        }));
      } catch { /* silent */ }
    },

    async loadAdminOptions() {
      try {
        const res = await $api("/users", { params: { per_page: 200 } });
        this.adminOptions = (res.data || [])
          .filter(u => u.role && (u.role.name === 'park-admin' || u.role.id === 6))
          .map(u => ({
            id: u.id,
            name: `${u.firstname} ${u.lastname}`,
          }));
      } catch { /* silent */ }
    },

    async loadCaisses() {
      try {
        const res = await $api("/cash-registers", { params: { per_page: 200 } });
        this.caisseOptions = (res.data || []).map(c => ({
          id: c.id,
          name: c.name || `Caisse #${c.id}`,
        }));
      } catch { /* silent */ }
    },

    // ---- Park Filters ----
    applyParkFilters() {
      this.appliedParkFilter = { ...this.parkFilter };
    },

    // ---- Park Modal Actions ----
    openCreateParkModal() {
      if (this.newPark.imagePreview) URL.revokeObjectURL(this.newPark.imagePreview);
      this.newPark = this.getDefaultPark();
      this.parkSaveError = "";
      this.createParkStep = 1;
      this.createParkDialog = true;
      this.$nextTick(() => {
        this.$refs.createParkForm1?.resetValidation();
        if (this.$refs.parkImageInput) this.$refs.parkImageInput.value = "";
      });
    },

    async nextParkStep() {
      if (this.createParkStep === 1) {
        // Validation manuelle des champs requis (fallback si VForm indisponible)
        if (!this.newPark.nom) {
          this.parkSaveError = "Le nom du parc est requis.";
          return;
        }
        if (!this.newPark.franchise_id) {
          this.parkSaveError = "Veuillez sélectionner une franchise.";
          return;
        }
        if (!this.newPark.localisation) {
          this.parkSaveError = "La localisation est requise.";
          return;
        }
        if (this.$refs.createParkForm1) {
          const { valid } = await this.$refs.createParkForm1.validate();
          if (!valid) return;
        }
        this.parkSaveError = "";
      }
      if (this.createParkStep < 3) this.createParkStep++;
    },

    prevParkStep() {
      if (this.createParkStep > 1) this.createParkStep--;
    },

    onParkImageChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      if (this.newPark.imagePreview) URL.revokeObjectURL(this.newPark.imagePreview);
      this.newPark.image = file;
      this.newPark.imagePreview = URL.createObjectURL(file);
    },

    onEditParkImageChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      if (this.editPark.imagePreview) URL.revokeObjectURL(this.editPark.imagePreview);
      this.editPark.image = file;
      this.editPark.imagePreview = URL.createObjectURL(file);
    },

    async savePark() {
      this.parkSaveError = "";

      if (!this.newPark.franchise_id) {
        this.parkSaveError = "Veuillez sélectionner une franchise (étape 1).";
        this.createParkStep = 1;
        return;
      }
      if (!this.newPark.nom) {
        this.parkSaveError = "Veuillez saisir le nom du parc (étape 1).";
        this.createParkStep = 1;
        return;
      }
      if (!this.newPark.localisation) {
        this.parkSaveError = "Veuillez saisir la localisation (étape 1).";
        this.createParkStep = 1;
        return;
      }

      this.isSavingPark = true;
      try {
        const social = {};
        if (this.newPark.facebook)  social.facebook  = this.newPark.facebook;
        if (this.newPark.instagram) social.instagram = this.newPark.instagram;
        if (this.newPark.tiktok)    social.tiktok    = this.newPark.tiktok;
        if (this.newPark.youtube)   social.youtube   = this.newPark.youtube;

        const ctrl  = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 60000);
        let res;
        try {
          if (this.newPark.image instanceof File) {
            // ── FormData uniquement si une image est fournie ──
            const fd = new FormData();
            fd.append("franchise_id", this.newPark.franchise_id);
            fd.append("name",         this.newPark.nom);
            fd.append("status",       this.newPark.status || "open");
            if (this.newPark.description) fd.append("description", this.newPark.description);
            if (this.newPark.localisation) fd.append("city", this.newPark.localisation);
            if (this.newPark.adresse)      fd.append("address", this.newPark.adresse);
            const _llFD = this.parseLatLng(this.newPark.localisation);
            if (_llFD.lat !== null) fd.append("latitude",  _llFD.lat);
            if (_llFD.lng !== null) fd.append("longitude", _llFD.lng);
            if (social.facebook)  fd.append("social_links[facebook]",  social.facebook);
            if (social.instagram) fd.append("social_links[instagram]", social.instagram);
            if (social.tiktok)    fd.append("social_links[tiktok]",    social.tiktok);
            if (social.youtube)   fd.append("social_links[youtube]",   social.youtube);
            fd.append("image", this.newPark.image);
            res = await $api("/parks", { method: "POST", body: fd, signal: ctrl.signal });
          } else {
            // ── JSON quand pas d'image (cas le plus courant) ──
            const _ll = this.parseLatLng(this.newPark.localisation);
            res = await $api("/parks", {
              method: "POST",
              body: {
                franchise_id: this.newPark.franchise_id,
                name:         this.newPark.nom,
                status:       this.newPark.status || "open",
                description:  this.newPark.description  || null,
                city:         this.newPark.localisation || null,
                address:      this.newPark.adresse      || null,
                social_links: Object.keys(social).length ? social : null,
                latitude:     _ll.lat,
                longitude:    _ll.lng,
              },
              signal: ctrl.signal,
            });
          }
        } finally { clearTimeout(timer); }

        const created = res.park || res.data || res;
        const parkId  = created?.id;

        if (!parkId) {
          this.parkSaveError = "Erreur lors de la création du parc. Veuillez réessayer.";
          this.isSavingPark = false;
          return;
        }

        // ── Associer les caisses sélectionnées au parc via l'API ──
        if (Array.isArray(this.newPark.caisses) && this.newPark.caisses.length) {
          await Promise.allSettled(
            this.newPark.caisses.map(caisseId =>
              $api(`/cash-registers/${caisseId}/update`, {
                method: 'PUT',
                body: { park_id: parkId },
              })
            )
          );
        }

        // ── Sauvegarder Région, Numéros, Admin, Caisses et Jeux en localStorage ──
        this.saveParkExtra(parkId, {
          region:   this.newPark.region   || "",
          numeros:  this.newPark.numeros  || [],
          admin_id: this.newPark.admin_id != null ? this.newPark.admin_id : null,
          caisses:  Array.isArray(this.newPark.caisses) ? this.newPark.caisses : [],
          jeux:     this.newPark.jeux     || null,
          iban:     this.newPark.iban     || "",
        });

        // ── Horaires → GET existants, puis PUT (update) ou POST (create) ──
        try {
          const schExisting = await $api(`/parks/${parkId}/schedules`, { params: { per_page: 10 } });
          const existingSchedules = schExisting.data || [];
          const toCreate = [];
          for (const [day, h] of Object.entries(this.newPark.horaires)) {
            if (day === 'vacances') continue;
            const open_time  = String(h.open  ?? 10).padStart(2, "0") + ":00";
            const close_time = String(h.close ?? 19).padStart(2, "0") + ":00";
            const found = existingSchedules.find(s => s.day === day);
            if (found) {
              await $api(`/parks/${parkId}/schedules/${found.id}`, {
                method: "PUT",
                body: { open_time, close_time, is_closed: false },
              });
            } else {
              toCreate.push({ day, open_time, close_time, is_closed: false });
            }
          }
          if (toCreate.length) {
            await $api(`/parks/${parkId}/schedules`, { method: "POST", body: { days: toCreate } });
          }
        } catch (schErr) {
          console.warn("Horaires save error:", schErr?.status, schErr?.data || schErr?.message);
        }

        // ── Notes → GET existantes, POST si activée et manquante ──
        try {
          const rulesExisting = await $api(`/parks/${parkId}/rules`);
          const existingRules = rulesExisting.data || [];
          const noteMap = [
            { key: "chaussettes", text: "Chaussettes Obligatoire" },
            { key: "pique_nique", text: "Pique nique interdite"   },
            { key: "wifi",        text: "Wifi Zone"               },
            { key: "climatise",   text: "Espace Climatisé"        },
          ];
          for (const n of noteMap) {
            if (this.newPark.notes[n.key] && !existingRules.some(r => r.description === n.text)) {
              await $api(`/parks/${parkId}/rules`, { method: "POST", body: { title: "Note", description: n.text } });
            }
          }
          if (this.newPark.notes.note1_enabled && this.newPark.notes.note1 && !existingRules.some(r => r.description === this.newPark.notes.note1)) {
            await $api(`/parks/${parkId}/rules`, { method: "POST", body: { title: "Note", description: this.newPark.notes.note1 } });
          }
          if (this.newPark.notes.note2_enabled && this.newPark.notes.note2 && !existingRules.some(r => r.description === this.newPark.notes.note2)) {
            await $api(`/parks/${parkId}/rules`, { method: "POST", body: { title: "Note", description: this.newPark.notes.note2 } });
          }
        } catch (ruleErr) {
          console.warn("Notes save error:", ruleErr?.status, ruleErr?.data || ruleErr?.message);
        }

        // ── Tarifs → POST /parks/{id}/tickets ──
        for (const tarif of this.newPark.tarifs) {
          if (!tarif.title || tarif.price === "" || tarif.price === null) continue;
          await $api(`/parks/${parkId}/tickets`, {
            method: "POST",
            body: { name: tarif.title, price: parseFloat(tarif.price) || 0, type: "entry" },
          }).catch(() => {});
        }

        // ── Affichage local immédiat ──
        // La réponse API de add() ne charge pas les relations → on les résout depuis les options locales
        const localFranchise = this.franchiseOptions.find(f => f.id === this.newPark.franchise_id) || null;
        const localAdmin     = this.newPark.admin_id
          ? (this.adminOptions.find(a => a.id === this.newPark.admin_id) || null)
          : null;

        this.parks.unshift({
          ...this.newPark,
          ...created,
          id:           parkId,
          nom:          created.name || this.newPark.nom,
          localisation: this.newPark.localisation,
          image:        created.image_url || null,
          image_url:    created.image_url || null,
          region:       this.newPark.region  || "",
          numeros:      this.newPark.numeros || [],
          admin_id:     this.newPark.admin_id != null ? this.newPark.admin_id : null,
          caisses:      Array.isArray(this.newPark.caisses) ? this.newPark.caisses : [],
          imagePreview: null,
          franchise:    localFranchise
            ? { id: localFranchise.id, nom: localFranchise.nom, name: localFranchise.nom || localFranchise.name }
            : (created.franchise || null),
          admin: localAdmin
            ? { id: localAdmin.id, name: localAdmin.name }
            : null,
        });
        this.createParkDialog = false;
        this.showSnackbar("Parc créé avec succès");
      } catch (err) {
        if (err?.name === "AbortError" || err?.message?.includes("abort")) {
          this.parkSaveError = "Le serveur ne répond pas (timeout 15s).";
        } else {
          const errData = err?.data || {};
          const errors  = errData?.errors;
          this.parkSaveError = errors
            ? Object.values(errors).flat().join(" — ")
            : (errData?.message || err?.message || `Erreur création parc (${err?.status || "réseau"})`);
        }
      } finally {
        this.isSavingPark = false;
      }
    },

    buildEditPark(park) {
      const toH = v => typeof v === 'string' && v.includes(':') ? parseInt(v.split(':')[0]) : parseInt(v);
      const horaires = {};
      ["monday","tuesday","wednesday","thursday","friday"].forEach(d => {
        const src = park.horaires?.[d] || {};
        horaires[d] = { open: toH(src.open) || 10, close: toH(src.close) || 19 };
      });
      const srcVac = park.horaires?.vacances || {};
      horaires.vacances = { open: toH(srcVac.open) || 10, close: toH(srcVac.close) || 19 };

      const rawNotes = park.notes;
      let notes;
      if (Array.isArray(rawNotes)) {
        const _ntm = {
          "Chaussettes Obligatoire": "chaussettes",
          "Pique nique interdite":   "pique_nique",
          "Wifi Zone":               "wifi",
          "Espace Climatisé":        "climatise",
        };
        notes = { chaussettes: false, pique_nique: false, wifi: false, climatise: false,
                  note1_enabled: false, note1: "", note2_enabled: false, note2: "" };
        rawNotes.forEach(rule => {
          const key = _ntm[rule.description];
          if (key) { notes[key] = true; }
          else if (!notes.note1_enabled) { notes.note1_enabled = true; notes.note1 = rule.description || ""; }
          else if (!notes.note2_enabled) { notes.note2_enabled = true; notes.note2 = rule.description || ""; }
        });
      } else {
        const srcNotes = rawNotes || {};
        notes = {
          chaussettes:   srcNotes.chaussettes   ?? false,
          pique_nique:   srcNotes.pique_nique   ?? false,
          wifi:          srcNotes.wifi          ?? false,
          climatise:     srcNotes.climatise     ?? false,
          note1_enabled: srcNotes.note1_enabled ?? false,
          note1:         srcNotes.note1         ?? "",
          note2_enabled: srcNotes.note2_enabled ?? false,
          note2:         srcNotes.note2         ?? "",
        };
      }

      const srcJeux = park.jeux || {};

      // franchise_id : peut arriver comme objet { id, name } ou directement comme number
      const franchise_id = park.franchise_id
        ?? park.franchise?.id
        ?? null;

      // admin_id : peut arriver comme objet { id, ... } ou directement comme number
      const admin_id = park.admin_id
        ?? park.admin?.id
        ?? null;

      // status : normaliser
      const status = park.status || "open";

      return {
        ...park,
        nom:          park.nom         || park.name        || "",
        franchise_id,
        admin_id,
        status,
        localisation: (park.latitude != null && park.longitude != null)
          ? `${park.latitude}, ${park.longitude}`
          : (park.localisation || park.location || ""),
        region:       park.region       || "",
        description:  park.description  || "",
        adresse:      park.adresse      || park.address    || "",
        facebook:     park.facebook  || park.social_links?.facebook  || "",
        instagram:    park.instagram || park.social_links?.instagram || "",
        tiktok:       park.tiktok    || park.social_links?.tiktok    || "",
        youtube:      park.youtube   || park.social_links?.youtube   || "",
        horaires,
        notes,
        jeux: {
          petits:  { age_max: srcJeux.petits?.age_max ?? "",  description: srcJeux.petits?.description  ?? "" },
          grands:  { age_min: srcJeux.grands?.age_min ?? "",  age_max: srcJeux.grands?.age_max ?? "", description: srcJeux.grands?.description ?? "" },
          parents: { description: srcJeux.parents?.description ?? "" },
        },
        tarifs:  Array.isArray(park.tarifs)  ? [...park.tarifs]  : [],
        numeros: Array.isArray(park.numeros) ? [...park.numeros] : (park.numero ? [park.numero] : [""]),
        caisses: Array.isArray(park.caisses) ? [...park.caisses] : [],
      };
    },

    async openEditParkModal(park) {
      this.editPark      = this.buildEditPark(park);
      this.editParkDirty = false;
      this.editParkTab   = "info";

      const [parkRes, schRes, caisseRes, tarifsRes] = await Promise.allSettled([
        $api(`/parks/${park.id}`),
        $api(`/parks/${park.id}/schedules`, { params: { per_page: 10 } }),
        $api(`/cash-registers/park/${park.id}`, { params: { per_page: 200 } }),
        $api(`/parks/${park.id}/tickets`),
      ]);

      if (parkRes.status === 'fulfilled') {
        const full   = parkRes.value.park || parkRes.value.data || parkRes.value;
        const merged = { ...park, ...full };
        const extra  = this.loadParkExtra(park.id);
        if (!merged.region) merged.region = park.region || extra.region || "";
        if (!merged.numeros || !merged.numeros.length) {
          merged.numeros = (park.numeros && park.numeros.length) ? park.numeros : (extra.numeros || [""]);
        }
        if (!merged.iban) merged.iban = park.iban || extra.iban || "";
        this.editPark = this.buildEditPark(merged);
      }

      if (schRes.status === 'fulfilled') {
        const existingSchedules = schRes.value.data || [];
        if (existingSchedules.length) {
          const parseHour = (t, def) => {
            if (!t) return def;
            const str = t.includes("T") ? t.split("T")[1] : t;
            return parseInt(str) || def;
          };
          const loadedHoraires = { ...this.editPark.horaires };
          existingSchedules.forEach(s => {
            if (s.day && loadedHoraires[s.day] !== undefined) {
              loadedHoraires[s.day] = {
                open:  parseHour(s.open_time,  10),
                close: parseHour(s.close_time, 19),
              };
            }
          });
          this.editPark = { ...this.editPark, horaires: loadedHoraires };
        }
      } else {
        console.warn("Schedule load error:", schRes.reason?.status, schRes.reason?.data || schRes.reason?.message);
      }

      // Charger les caisses associées depuis l'API, fallback localStorage
      if (caisseRes.status === 'fulfilled') {
        const apiCaisses  = (caisseRes.value.data || []).map(c => c.id);
        const extraCaisses = this.loadParkExtra(park.id).caisses || [];
        const caisses     = apiCaisses.length ? apiCaisses : extraCaisses;
        this.editPark = { ...this.editPark, caisses };
      }

      // Charger les tarifs depuis l'API
      if (tarifsRes.status === 'fulfilled') {
        const tarifs = (tarifsRes.value.data || []).map(t => ({
          id:      t.id,
          title:   t.name || "",
          price:   t.price ?? "",
          details: t.description || t.details || "",
        }));
        this.editPark = { ...this.editPark, tarifs };
      }

      // Afficher le dialog uniquement après que toutes les données sont chargées
      this.editParkDialog = true;
      this.editParkDirty  = false;
    },

    addEditTarif() {
      this.editPark.tarifs.push({ title: "", price: "", details: "" });
    },

    removeEditTarif(idx) {
      this.editPark.tarifs.splice(idx, 1);
    },

    async updatePark() {
      // Validation locale avant envoi API
      if (!this.editPark.franchise_id) {
        this.showSnackbar("La franchise est requise.", "error");
        return;
      }
      if (!this.editPark.nom && !this.editPark.name) {
        this.showSnackbar("Le nom du parc est requis.", "error");
        return;
      }

      this.isSavingPark = true;
      try {
        const p = this.editPark;
        let res;

        // Construire les social_links (objet vide si tout effacé → null pour vider en DB)
        const social = {};
        if (p.facebook)  social.facebook  = p.facebook;
        if (p.instagram) social.instagram = p.instagram;
        if (p.tiktok)    social.tiktok    = p.tiktok;
        if (p.youtube)   social.youtube   = p.youtube;
        const socialLinks = Object.keys(social).length ? social : null;

        if (p.image instanceof File) {
          // FormData POST + _method:PUT : seul moyen d'uploader un fichier via PUT en Laravel
          const fd = new FormData();
          fd.append("_method",      "PUT");
          fd.append("name",         p.nom || p.name || "");
          fd.append("status",       p.status || "open");
          fd.append("franchise_id", p.franchise_id);
          // Champs nullable : toujours inclus pour permettre l'effacement
          if (p.localisation !== undefined) fd.append("city", p.localisation || "");
          if (p.adresse      !== undefined) fd.append("address",     p.adresse      || "");
          const _llUp = this.parseLatLng(p.localisation);
          if (_llUp.lat !== null) fd.append("latitude",  _llUp.lat);
          if (_llUp.lng !== null) fd.append("longitude", _llUp.lng);
          if (p.description  !== undefined) fd.append("description", p.description  || "");
          if (p.facebook)  fd.append("social_links[facebook]",  p.facebook);
          if (p.instagram) fd.append("social_links[instagram]", p.instagram);
          if (p.tiktok)    fd.append("social_links[tiktok]",    p.tiktok);
          if (p.youtube)   fd.append("social_links[youtube]",   p.youtube);
          fd.append("image", p.image);
          res = await $api(`/parks/${p.id}`, { method: "POST", body: fd });
        } else {
          // JSON PUT : champs requis toujours présents, nullable inclus pour permettre l'effacement
          const _llJ = this.parseLatLng(p.localisation);
          const body = {
            name:         p.nom || p.name || "",
            status:       p.status || "open",
            franchise_id: p.franchise_id,
            description:  p.description  || null,
            city:         p.localisation || null,
            address:      p.adresse      || null,
            social_links: socialLinks,
            latitude:     _llJ.lat,
            longitude:    _llJ.lng,
          };
          res = await $api(`/parks/${p.id}`, { method: "PUT", body });
        }

        // Sauvegarder région, numéros, admin, caisses et jeux en localStorage
        this.saveParkExtra(p.id, {
          region:   p.region   || "",
          numeros:  p.numeros  || [],
          admin_id: p.admin_id != null ? p.admin_id : null,
          caisses:  Array.isArray(p.caisses) ? p.caisses : [],
          jeux:     p.jeux     || null,
          iban:     p.iban     || "",
        });

        // ── Mettre à jour les caisses associées au parc via l'API ──
        if (Array.isArray(p.caisses) && p.caisses.length) {
          await Promise.allSettled(
            p.caisses.map(caisseId =>
              $api(`/cash-registers/${caisseId}/update`, {
                method: 'PUT',
                body: { park_id: p.id },
              })
            )
          );
        }

        // ── Horaires → GET schedules existants, puis PUT (update) ou POST (create) ──
        try {
          const schRes = await $api(`/parks/${p.id}/schedules`, { params: { per_page: 10 } });
          const existingSchedules = schRes.data || [];
          const toCreate = [];
          for (const [day, h] of Object.entries(p.horaires || {})) {
            if (day === 'vacances') continue;
            const open_time  = String(h.open  ?? 10).padStart(2, "0") + ":00";
            const close_time = String(h.close ?? 19).padStart(2, "0") + ":00";
            const found = existingSchedules.find(s => s.day === day);
            if (found) {
              await $api(`/parks/${p.id}/schedules/${found.id}`, {
                method: "PUT",
                body: { open_time, close_time, is_closed: false },
              });
            } else {
              toCreate.push({ day, open_time, close_time, is_closed: false });
            }
          }
          if (toCreate.length) {
            await $api(`/parks/${p.id}/schedules`, { method: "POST", body: { days: toCreate } });
          }
        } catch (schErr) {
          console.warn("Horaires update error:", schErr?.status, schErr?.data || schErr?.message);
        }

        // ── Notes → GET règles existantes, POST si activée et manquante, DELETE si désactivée et existante ──
        try {
          const rulesRes = await $api(`/parks/${p.id}/rules`);
          const ruleList = rulesRes.data || [];
          const noteMap = [
            { key: "chaussettes", text: "Chaussettes Obligatoire" },
            { key: "pique_nique", text: "Pique nique interdite"   },
            { key: "wifi",        text: "Wifi Zone"               },
            { key: "climatise",   text: "Espace Climatisé"        },
          ];
          for (const n of noteMap) {
            const existing = ruleList.find(r => r.description === n.text);
            if (p.notes?.[n.key]) {
              if (!existing) {
                await $api(`/parks/${p.id}/rules`, { method: "POST", body: { title: "Note", description: n.text } });
              }
            } else {
              if (existing) {
                await $api(`/parks/${p.id}/rules/${existing.id}`, { method: "DELETE" });
              }
            }
          }
          if (p.notes?.note1_enabled && p.notes?.note1 && !ruleList.some(r => r.description === p.notes.note1)) {
            await $api(`/parks/${p.id}/rules`, { method: "POST", body: { title: "Note", description: p.notes.note1 } });
          }
          if (p.notes?.note2_enabled && p.notes?.note2 && !ruleList.some(r => r.description === p.notes.note2)) {
            await $api(`/parks/${p.id}/rules`, { method: "POST", body: { title: "Note", description: p.notes.note2 } });
          }
        } catch (ruleErr) {
          console.warn("Notes update error:", ruleErr?.status, ruleErr?.data || ruleErr?.message);
        }

        // ── Tarifs → Delete removed, update existing, create new ──
        try {
          const existingTarifsRes = await $api(`/parks/${p.id}/tickets`);
          const existingTarifs    = existingTarifsRes.data || [];
          const currentIds        = p.tarifs.filter(t => t.id).map(t => t.id);

          await Promise.allSettled(
            existingTarifs
              .filter(t => !currentIds.includes(t.id))
              .map(t => $api(`/parks/${p.id}/tickets/${t.id}`, { method: 'DELETE' }))
          );
          await Promise.allSettled(
            p.tarifs.filter(t => t.id && t.title).map(t =>
              $api(`/parks/${p.id}/tickets/${t.id}`, {
                method: 'PUT',
                body: { name: t.title, price: parseFloat(t.price) || 0, type: 'entry' },
              })
            )
          );
          await Promise.allSettled(
            p.tarifs.filter(t => !t.id && t.title).map(t =>
              $api(`/parks/${p.id}/tickets`, {
                method: 'POST',
                body: { name: t.title, price: parseFloat(t.price) || 0, type: 'entry' },
              })
            )
          );
        } catch (tarErr) {
          console.warn("Tarifs update error:", tarErr);
        }

        const updated = res.park || res.data || res;
        // Résoudre franchise depuis options si la réponse API ne la charge pas
        const updatedFranchise = updated.franchise
          || (this.franchiseOptions.find(f => f.id === p.franchise_id)
              ? { id: p.franchise_id, nom: this.franchiseOptions.find(f => f.id === p.franchise_id)?.nom, name: this.franchiseOptions.find(f => f.id === p.franchise_id)?.nom }
              : p.franchise || null);
        const updatedAdmin = p.admin
          || (p.admin_id ? this.adminOptions.find(a => a.id === p.admin_id) || null : null);

        const richUpdated = {
          ...p, ...updated,
          nom:          updated.name || p.nom,
          localisation: p.localisation,
          facebook:     p.facebook,
          instagram:    p.instagram,
          tiktok:       p.tiktok,
          youtube:      p.youtube,
          region:       p.region  || "",
          numeros:      p.numeros || [],
          image:        updated.image_url || p.image_url || null,
          image_url:    updated.image_url || p.image_url || null,
          franchise:    updatedFranchise,
          admin:        updatedAdmin,
          admin_id:     p.admin_id != null ? p.admin_id : null,
          caisses:      Array.isArray(p.caisses) ? p.caisses : [],
        };
        const idx = this.parks.findIndex(f => f.id === p.id);
        if (idx !== -1) this.parks.splice(idx, 1, richUpdated);
        this.editParkDialog = false;
        this.showSnackbar("Parc mis à jour avec succès");
        await this.getParks();
      } catch (err) {
        const errData = err?.data || {};
        const errors  = errData?.errors;
        const msg = errors
          ? Object.values(errors).flat().join(" — ")
          : (errData?.message || err?.message || "Impossible de modifier le parc");
        this.showSnackbar(msg, "error");
      } finally {
        this.isSavingPark = false;
      }
    },

    async openParkDetails(park) {
      const extra = this.loadParkExtra(park.id);
      this.selectedPark = {
        ...park,
        region:  park.region  || extra.region  || "",
        numeros: (park.numeros && park.numeros.length) ? park.numeros : (extra.numeros || []),
        tarifs:  Array.isArray(park.tarifs) ? park.tarifs : [],
      };
      this.parkDetailsDialog = true;

      const [tarifsRes, caisseRes] = await Promise.allSettled([
        $api(`/parks/${park.id}/tickets`),
        $api(`/cash-registers/park/${park.id}`, { params: { per_page: 200 } }),
      ]);

      if (tarifsRes.status === 'fulfilled') {
        const tarifs = (tarifsRes.value.data || []).map(t => ({
          id:      t.id,
          title:   t.name || "",
          price:   t.price ?? "",
          details: t.description || t.details || "",
        }));
        this.selectedPark = { ...this.selectedPark, tarifs };
      }

      if (caisseRes.status === 'fulfilled') {
        const apiCaisses   = (caisseRes.value.data || []).map(c => c.id);
        const extraCaisses = this.loadParkExtra(park.id).caisses || [];
        const caisses      = apiCaisses.length ? apiCaisses : extraCaisses;
        this.selectedPark  = { ...this.selectedPark, caisses };
      }
    },

    openDeleteParkDialog(park) {
      this.selectedPark = park;
      this.deleteParkDialog = true;
    },

    async confirmDeletePark() {
      this.isDeletingPark = true;
      try {
        await $api(`/parks/${this.selectedPark.id}/archive`, { method: "PATCH" });
        this.parks = this.parks.filter(p => p.id !== this.selectedPark.id);
        this.deleteParkDialog = false;
        this.showSnackbar("Parc supprimé avec succès");
      } catch (err) {
        const msg = err?.data?.message || "Impossible de supprimer le parc";
        this.showSnackbar(msg, "error");
      } finally {
        this.isDeletingPark = false;
      }
    },

    addTarif() {
      this.newPark.tarifs.push({ title: "", price: "", categorie: "", details: "", _confirmed: false });
    },

    removeTarif(idx) {
      this.newPark.tarifs.splice(idx, 1);
    },

    // ---- Franchise Modal Actions ----
    openCreateFranchiseModal() {
      this.newFranchise = this.getDefaultFranchise();
      this.createFranchiseStep = 1;
      this.createFranchiseDialog = true;
    },

    async nextFranchiseStep() {
      if (this.createFranchiseStep === 1 && this.$refs.createFranchiseForm1) {
        const { valid } = await this.$refs.createFranchiseForm1.validate();
        if (!valid) return;
      }
      if (this.createFranchiseStep === 2 && this.$refs.createFranchiseForm2) {
        const { valid } = await this.$refs.createFranchiseForm2.validate();
        if (!valid) return;
      }
      this.createFranchiseStep++;
    },

    prevFranchiseStep() {
      if (this.createFranchiseStep > 1) this.createFranchiseStep--;
    },

    onFranchiseLogoChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      if (this.newFranchise.logoPreview) URL.revokeObjectURL(this.newFranchise.logoPreview);
      this.newFranchise.logo = file;
      this.newFranchise.logoPreview = URL.createObjectURL(file);
    },

    async saveFranchise() {
      this.isSavingFranchise = true;
      try {
        const formData = new FormData();
        const apiFields = ["name", "description", "status", "owner_id"];
        apiFields.forEach(k => {
          const v = this.newFranchise[k];
          if (v !== null && v !== undefined && v !== "") formData.append(k, v);
        });
        if (this.newFranchise.logo instanceof File) formData.append("logo", this.newFranchise.logo);
        // Owner franchisé
        if (this.newFranchise.owner?.username) {
          formData.append("owner[username]", this.newFranchise.owner.username);
          formData.append("owner[email]",    this.newFranchise.owner.email);
          formData.append("owner[password]", this.newFranchise.owner.password);
          formData.append("owner[role]",     this.newFranchise.owner.role);
        }

        const res = await $api("/franchises", { method: "POST", body: formData });
        const created = res.franchise || res.data || res;
        const nom = created.nom || created.name || this.newFranchise.name;
        const richFranchise = { ...this.newFranchise, ...created, nom, logoPreview: null, logo: created.logo_url || null };
        // Persist extra fields in localStorage (survives page refresh)
        if (created.id) this.saveFranchiseExtra(created.id, this.newFranchise);
        this.franchises.unshift(richFranchise);
        this.franchiseOptions = [{ id: richFranchise.id, nom }, ...this.franchiseOptions];
        this.franchiseTotal++;
        this.createFranchiseDialog = false;
        this.showSnackbar("Franchise créée avec succès");
      } catch (err) {
        const msg = err?.data?.errors
          ? Object.values(err.data.errors).flat().join(" — ")
          : err?.data?.message || "Impossible de créer la franchise";
        this.showSnackbar(msg, "error");
      } finally {
        this.isSavingFranchise = false;
      }
    },

    openFranchiseDetails(franchise) {
      const extra = this.loadFranchiseExtra(franchise.id);
      const apiMapped = {
        siret: franchise.siren_siret || '',
        siren: franchise.siren_siret ? franchise.siren_siret.substring(0, 9) : '',
        tva: franchise.tva_number || '',
        rib_iban: franchise.iban_rip || '',
        decharges: franchise.clauses || '',
        signature_obligatoire: franchise.signature ?? false,
      };
      const filteredExtra = Object.fromEntries(
        Object.entries(extra).filter(([, v]) => v !== '' && v !== null && v !== undefined)
      );
      this.selectedFranchise = { ...franchise, ...apiMapped, ...filteredExtra };
      this.franchiseDetailsDialog = true;
    },

    openEditFranchiseModal(franchise) {
      const extra = this.loadFranchiseExtra(franchise.id);
      const apiMapped = {
        siret: franchise.siren_siret || '',
        siren: franchise.siren_siret ? franchise.siren_siret.substring(0, 9) : '',
        tva: franchise.tva_number || '',
        rib_iban: franchise.iban_rip || '',
        decharges: franchise.clauses || '',
        signature_obligatoire: franchise.signature ?? false,
      };
      const filteredExtra = Object.fromEntries(
        Object.entries(extra).filter(([, v]) => v !== '' && v !== null && v !== undefined)
      );
      const merged = { ...franchise, ...apiMapped, ...filteredExtra };
      this.editFranchise = { ...merged, nom: merged.nom || merged.name || "" };
      this.editFranchiseDialog = true;
    },

    onEditFranchiseLogoChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      if (this.editFranchise.logoPreview) URL.revokeObjectURL(this.editFranchise.logoPreview);
      this.editFranchise.logo = file;
      this.editFranchise.logoPreview = URL.createObjectURL(file);
    },

    async updateFranchise() {
      this.isSavingFranchise = true;
      try {
        const { id, logoPreview, nom, logo, image, ...rest } = this.editFranchise;
        let res;

        if (logo instanceof File) {
          // FormData + POST + _method:PUT (Laravel method override — seul moyen d'uploader un fichier via PUT)
          const formData = new FormData();
          formData.append("_method",     "PUT");
          if (nom)                       formData.append("name",        nom);
          if (rest.description != null)  formData.append("description", rest.description);
          if (rest.status)               formData.append("status",      rest.status);
          if (rest.owner_id != null)     formData.append("owner_id",    rest.owner_id);
          formData.append("logo", logo);
          res = await $api(`/franchises/${id}/update`, { method: "POST", body: formData });
        } else {
          // JSON PUT : Laravel lit correctement le corps JSON pour les requêtes PUT
          const body = {
            name:        nom                 || undefined,
            description: rest.description   ?? null,
            status:      rest.status        || undefined,
            owner_id:    rest.owner_id      ?? null,
          };
          res = await $api(`/franchises/${id}/update`, { method: "PUT", body });
        }
        const updated = res.franchise || res;
        // Merge API response with local form data to keep all fields
        const richUpdated = {
          ...this.editFranchise,
          ...updated,
          nom: updated.nom || updated.name || nom,
          logoPreview: null,
        };
        this.saveFranchiseExtra(id, this.editFranchise);
        const idx = this.franchises.findIndex(f => f.id === id);
        if (idx !== -1) this.franchises[idx] = richUpdated;
        this.editFranchiseDialog = false;
        this.showSnackbar("Franchise mise à jour avec succès");
      } catch (err) {
        const msg = err?.data?.message || "Impossible de modifier la franchise";
        this.showSnackbar(msg, "error");
      } finally {
        this.isSavingFranchise = false;
      }
    },

    saveFranchiseExtra(id, data) {
      try {
        const extra = {
          siret: data.siret || "",
          siren: data.siren || "",
          tva: data.tva || "",
          rib_iban: data.rib_iban || "",
          decharges: data.decharges || "",
          signature_obligatoire: data.signature_obligatoire || false,
        };
        localStorage.setItem(`franchise_extra_${id}`, JSON.stringify(extra));
      } catch {}
    },

    loadFranchiseExtra(id) {
      try {
        return JSON.parse(localStorage.getItem(`franchise_extra_${id}`) || "{}");
      } catch { return {}; }
    },

    saveParkExtra(id, data) {
      try {
        const extra = {
          region:   data.region   || "",
          numeros:  Array.isArray(data.numeros)  ? data.numeros.filter(n => n)  : [],
          admin_id: data.admin_id != null        ? data.admin_id                : null,
          caisses:  Array.isArray(data.caisses)  ? data.caisses.filter(c => c)  : [],
          jeux:     data.jeux     != null        ? data.jeux                    : null,
          iban:     data.iban     || "",
        };
        localStorage.setItem(`park_extra_${id}`, JSON.stringify(extra));
      } catch {}
    },

    loadParkExtra(id) {
      try {
        return JSON.parse(localStorage.getItem(`park_extra_${id}`) || "{}");
      } catch { return {}; }
    },

    openDeleteFranchiseDialog(franchise) {
      this.selectedFranchise = franchise;
      this.deleteFranchiseDialog = true;
    },

    async confirmDeleteFranchise() {
      this.isDeletingFranchise = true;
      try {
        await $api(`/franchises/${this.selectedFranchise.id}/archive`, {
          method: "PATCH",
        });
        this.franchises = this.franchises.filter(f => f.id !== this.selectedFranchise.id);
        this.franchiseTotal--;
        this.deleteFranchiseDialog = false;
        this.showSnackbar("Franchise supprimée avec succès");
      } catch (err) {
        const msg = err?.data?.message || "Impossible de supprimer la franchise";
        this.showSnackbar(msg, "error");
      } finally {
        this.isDeletingFranchise = false;
      }
    },
  },
};
</script>

<style scoped>
/* ---- Tab Bar ---- */
.tab-bar {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #E8A838;
}

.tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 13px 16px;
  border: none;
  cursor: pointer;
  font-weight: 700;
  font-size: 13px;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
  gap: 6px;
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

/* ---- Modal Header ---- */
.modal-header {
  display: flex;
  align-items: center;
  gap: 10px;
}
.modal-back-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  color: #333;
  border-radius: 4px;
}
.modal-back-btn:hover {
  background: #f0f0f0;
}
.modal-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a2e;
}

/* ---- Stepper ---- */
.modal-stepper {
  padding-top: 4px;
}
.stepper-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.stepper-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.stepper-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}
.stepper-done {
  background-color: #E8A838;
  color: #fff;
}
.stepper-active {
  background-color: #1a1a2e;
  color: #fff;
}
.stepper-pending {
  background-color: #e0e0e0;
  color: #9e9e9e;
}
.stepper-label {
  font-size: 13px;
  color: #9e9e9e;
  white-space: nowrap;
}
.stepper-label--active {
  color: #1a1a2e;
  font-weight: 600;
}
.stepper-arrow {
  flex-shrink: 0;
}

/* ── Edit Park Tabs ── */
/* ── New Tarif Cards (step 3) ── */
.nt-card {
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px;
  background: #fff;
}
.nt-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.nt-card-num {
  font-size: 12px;
  font-weight: 700;
  color: #1a1a2e;
}
.nt-input {
  width: 100%;
  height: 32px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 0 8px;
  font-size: 12px;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  margin-bottom: 6px;
  color: #1a1a2e;
}
.nt-input:focus { border-color: #1a1a2e; }
.nt-price-row {
  display: flex;
  align-items: center;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  height: 32px;
  padding: 0 8px;
  margin-bottom: 6px;
  box-sizing: border-box;
}
.nt-price-row:focus-within { border-color: #1a1a2e; }
.nt-euro {
  font-size: 13px;
  color: #555;
  margin-right: 4px;
  flex-shrink: 0;
}
.nt-price-input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 12px;
  font-family: inherit;
  color: #1a1a2e;
  background: transparent;
}
.nt-textarea {
  width: 100%;
  height: 52px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 12px;
  font-family: inherit;
  outline: none;
  resize: none;
  box-sizing: border-box;
  color: #1a1a2e;
}
.nt-textarea:focus { border-color: #1a1a2e; }

/* ── Edit Park Tabs ── */
.ep-tab-bar {
  display: flex;
  border-radius: 10px;
  overflow: hidden;
}
.ep-tab-btn {
  flex: 1;
  height: 42px;
  border-radius: 0;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  font-family: inherit;
}
.ep-tab-btn--active {
  background: #1a1a2e;
  color: #fff;
}
.ep-tab-btn--inactive {
  background: #E8A838;
  color: #1a1a2e;
}
.ep-tab-btn--inactive:hover {
  background: #d4942b;
}

/* ---- Form Fields ---- */
.field-label {
  font-size: 12px;
  font-weight: 600;
  color: #444;
  margin-bottom: 4px;
}
.req {
  color: #e53935;
  font-weight: 700;
}
.image-upload-zone {
  border: 1.5px dashed #ccc;
  border-radius: 8px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #fafafa;
  overflow: hidden;
}
.image-upload-zone:hover {
  border-color: #E8A838;
  background: #fffdf7;
}
.image-upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.btn-create-franchise {
  background-color: #1a1a2e !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  min-width: 160px;
}
.btn-create-franchise:hover { opacity: 0.9; }
.btn-create-franchise :deep(.v-btn__content) { color: #ffffff !important; }

.add-numero-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: #E8A838;
  font-weight: 600;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 3px;
}
.add-numero-btn:hover {
  text-decoration: underline;
}

/* ---- Modal Footer ---- */
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.modal-btn {
  flex: 1;
  height: 42px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  letter-spacing: 0.3px;
}
.modal-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.modal-btn--prev {
  background-color: #ffffff;
  color: #1a1a2e;
  border: 1.5px solid #1a1a2e;
}
.modal-btn--prev:hover:not(:disabled) {
  background-color: #f0f0f0;
}
.modal-btn--prev-disabled {
  background-color: #ffffff;
  color: #bbb;
  border: 1.5px solid #ddd;
}
.modal-btn--next {
  background-color: #E8A838;
  color: #ffffff;
  border: none;
}
.modal-btn--next:hover:not(:disabled) {
  background-color: #d4972e;
}
.modal-btn--create {
  background-color: #1a1a2e;
  color: #ffffff;
  border: none;
}
.modal-btn--create:hover:not(:disabled) {
  background-color: #121220;
}
.modal-btn--create:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ---- Tarifs Cards Grid ---- */
.tarifs-cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.tarif-card {
  border: 1.5px solid #e8e8e8;
  border-radius: 10px;
  padding: 12px 14px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.tarif-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.tarif-card-num {
  font-size: 12px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: 0.3px;
}
.tarif-delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #e53935;
  padding: 2px;
  border-radius: 4px;
  display: flex;
  align-items: center;
}
.tarif-delete-btn:hover {
  background: #fdecea;
}
.tarif-field {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.tarif-field--grow {
  flex: 1;
}
.tarif-field-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}
.tarif-field-label {
  font-size: 11px;
  font-weight: 600;
  color: #666;
}
.tarif-input {
  width: 100%;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 12px;
  outline: none;
  color: #333;
  font-family: inherit;
  background: #fff;
}
.tarif-input:focus {
  border-color: #1a1a2e;
}
.tarif-price-wrap {
  display: flex;
  align-items: center;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  background: #fff;
  padding: 0 8px;
  gap: 4px;
}
.tarif-price-wrap:focus-within {
  border-color: #1a1a2e;
}
.tarif-currency {
  font-size: 13px;
  font-weight: 600;
  color: #555;
  flex-shrink: 0;
}
.tarif-input--price {
  border: none;
  border-radius: 0;
  padding: 6px 0;
  flex: 1;
  -moz-appearance: textfield;
  appearance: textfield;
}
.tarif-input--price::-webkit-outer-spin-button,
.tarif-input--price::-webkit-inner-spin-button {
  -webkit-appearance: none;
}
.tarif-input--price:focus {
  border: none;
  outline: none;
}
.tarif-cat-row {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}
.tarif-cat-btn {
  padding: 3px 9px;
  border-radius: 20px;
  border: 1.5px solid #d0d0d0;
  background: #f7f7f7;
  font-size: 11px;
  font-weight: 600;
  color: #555;
  cursor: pointer;
  transition: all 0.15s;
}
.tarif-cat-btn:hover {
  border-color: #E8A838;
  color: #E8A838;
}
.tarif-cat-btn--active {
  background: #1a1a2e;
  border-color: #1a1a2e;
  color: #fff;
}
.tarif-textarea {
  width: 100%;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 12px;
  outline: none;
  color: #333;
  font-family: inherit;
  background: #fff;
  resize: vertical;
  min-height: 52px;
}
.tarif-textarea:focus {
  border-color: #1a1a2e;
}
.tarif-empty-state {
  text-align: center;
  padding: 32px 16px;
  border: 1.5px dashed #ddd;
  border-radius: 10px;
  background: #fafafa;
  margin-bottom: 12px;
}
.add-tarif-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #555;
  padding: 4px 0;
}
.add-tarif-btn:hover {
  color: #1a1a2e;
}
.add-tarif-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background-color: #E8A838;
  border-radius: 4px;
  color: #fff;
}

/* ---- Step 2: Horaires ---- */
.section-title {
  font-size: 13px;
  font-weight: 700;
  color: #1a1a2e;
}
.horaires-row {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
}
.horaire-day {
  flex: 1;
  min-width: 0;
}
.horaire-day-label {
  font-size: 12px;
  font-weight: 600;
  color: #555;
  margin-bottom: 4px;
}
.horaire-inputs {
  display: flex;
  align-items: center;
  gap: 4px;
}
.hour-box {
  display: flex;
  align-items: center;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  padding: 4px 6px;
  background: #fff;
  gap: 1px;
}
.hour-input {
  width: 24px;
  border: none;
  outline: none;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  color: #1a1a2e;
  background: transparent;
  -moz-appearance: textfield;
  appearance: textfield;
}
.hour-input::-webkit-outer-spin-button,
.hour-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.hour-suffix {
  font-size: 12px;
  color: #555;
  font-weight: 600;
}
.hour-sep {
  font-size: 13px;
  color: #aaa;
}

/* ---- Step 2: Notes ---- */
.notes-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px 16px;
}
.note-check {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
}
.note-check input[type="checkbox"] {
  width: 15px;
  height: 15px;
  cursor: pointer;
  flex-shrink: 0;
}
.note-check--with-input {
  grid-column: span 1;
}
.note-text-input {
  border: 1px solid #d0d0d0;
  border-radius: 5px;
  padding: 3px 8px;
  font-size: 12px;
  width: 100%;
  outline: none;
}
.note-text-input:focus {
  border-color: #E8A838;
}

/* ---- Step 2: Les Jeux ---- */
.jeux-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  align-items: start;
}
.jeux-col-title {
  font-size: 12px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 6px;
}
.age-input {
  width: 42px;
  border: 1px solid #d0d0d0;
  border-radius: 5px;
  padding: 3px 5px;
  font-size: 12px;
  text-align: center;
  outline: none;
  -moz-appearance: textfield;
  appearance: textfield;
}
.age-input::-webkit-outer-spin-button,
.age-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}
.jeux-textarea {
  width: 100%;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 12px;
  resize: none;
  height: 68px;
  outline: none;
  color: #333;
  font-family: inherit;
}
.jeux-textarea--tall {
  height: 105px;
}
.jeux-textarea:focus {
  border-color: #E8A838;
}
</style>
