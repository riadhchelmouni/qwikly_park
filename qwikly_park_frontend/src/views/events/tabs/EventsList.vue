<template>
  <div>
    <!-- ── Barre de filtres ── -->
    <VCard class="mb-5" style="border-radius:12px">
      <VCardText class="pa-4">
        <div class="d-flex align-center gap-3 flex-wrap">
          <span class="filter-label">Filtres</span>
          <VSelect
            v-model="filterCategorie" :items="categorieOptions"
            item-title="title" item-value="value"
            placeholder="Catégorie" hide-details clearable density="compact" variant="outlined"
            style="min-width:150px;max-width:180px;border-radius:8px"
          />
          <VSelect
            v-model="filterParc" :items="parcOptions" item-title="name" item-value="id"
            placeholder="Parc" hide-details clearable density="compact" variant="outlined"
            style="min-width:150px;max-width:180px"
          />
          <VSelect
            v-model="filterStatut" :items="statutOptions" item-title="title" item-value="value"
            placeholder="Statut" hide-details clearable density="compact" variant="outlined"
            style="min-width:130px;max-width:160px"
          />
          <VBtn class="apply-btn" elevation="0" @click="loadEvents">Appliquer</VBtn>
          <VSpacer />
          <VBtn class="create-btn" elevation="0" @click="openCreate">
            <VIcon icon="tabler-plus" size="16" class="me-1" />Nouvel événement
          </VBtn>
        </div>
      </VCardText>
    </VCard>

    <!-- ── Chargement ── -->
    <div v-if="isLoading" class="d-flex justify-center align-center py-16">
      <VProgressCircular indeterminate color="#E8A838" size="48" />
    </div>

    <!-- ── Grille des événements ── -->
    <VRow v-else-if="events.length">
      <VCol v-for="ev in events" :key="ev.id" cols="12" sm="6" md="4" lg="3">
        <VCard class="event-card" elevation="2">
          <!-- Image -->
          <div class="event-img-wrap">
            <VImg :src="ev.image || '/img/event-placeholder.jpg'" height="165" cover>
              <template #error>
                <div class="event-img-fallback d-flex align-center justify-center" style="height:165px;background:linear-gradient(135deg,#1a1a2e 0%,#2d2d5e 100%)">
                  <VIcon icon="tabler-calendar-event" size="48" color="rgba(255,255,255,0.3)" />
                </div>
              </template>
            </VImg>
          </div>

          <VCardText class="pa-3 pb-2">
            <!-- Nom + badge statut -->
            <div class="d-flex align-center justify-space-between mb-1 gap-2">
              <span class="event-name" :title="ev.name || ev.title">{{ ev.name || ev.title }}</span>
              <VChip class="status-chip" :style="statusStyle(ev.status)" size="x-small" label>
                {{ statusLabel(ev.status) }}
              </VChip>
            </div>

            <!-- Catégorie -->
            <div class="event-cat mb-2">{{ categoryLabel(ev.category) }}</div>

            <!-- Date -->
            <div class="d-flex align-center gap-1 mb-3">
              <VIcon icon="tabler-calendar" size="13" color="#9e9e9e" />
              <span class="event-date">{{ formatDate(ev.date_start) }}
                <span v-if="ev.heure_debut"> · {{ ev.heure_debut }}</span>
              </span>
            </div>
          </VCardText>

          <!-- Footer card -->
          <div class="event-footer d-flex align-center justify-space-between px-3 pb-3">
            <div class="d-flex gap-1">
              <button class="icon-action" @click="openEdit(ev)" title="Modifier">
                <VIcon icon="tabler-edit" size="15" />
              </button>
              <button class="icon-action icon-action--danger" @click="openDelete(ev)" title="Supprimer">
                <VIcon icon="tabler-trash" size="15" />
              </button>
            </div>
            <VBtn class="billetterie-btn" size="small" elevation="0" @click="openDetails(ev)">
              Billetterie
            </VBtn>
          </div>
        </VCard>
      </VCol>
    </VRow>

    <!-- Vide -->
    <VCard v-else style="border-radius:12px">
      <VCardText class="text-center py-16 text-medium-emphasis">
        <VIcon icon="tabler-calendar-off" size="52" class="mb-3" style="opacity:0.25" />
        <div style="font-size:14px">Aucun événement trouvé</div>
      </VCardText>
    </VCard>

    <!-- Pagination -->
    <div v-if="events.length && total > perPage" class="d-flex justify-center mt-5">
      <VPagination v-model="page" :length="Math.ceil(total / perPage)" total-visible="6" size="small" />
    </div>


    <!-- ══════════════════════════════════════════════════
         MODAL DÉTAILS ÉVÉNEMENT — 2 onglets
    ══════════════════════════════════════════════════ -->
    <VDialog v-model="detailsDialog" max-width="680" scrollable>
      <VCard v-if="current" style="border-radius:16px;overflow:hidden">
        <!-- Image + bouton retour -->
        <div style="position:relative">
          <VImg :src="current.image || '/img/event-placeholder.jpg'" height="210" cover>
            <template #error>
              <div style="height:210px;background:linear-gradient(135deg,#1a1a2e,#2d2d5e);display:flex;align-items:center;justify-content:center">
                <VIcon icon="tabler-calendar-event" size="64" color="rgba(255,255,255,0.25)" />
              </div>
            </template>
          </VImg>
          <VBtn icon variant="flat" size="small"
            style="position:absolute;top:12px;left:12px;background:rgba(255,255,255,0.92);border-radius:50%"
            @click="detailsDialog=false">
            <VIcon icon="tabler-arrow-left" size="18" />
          </VBtn>
          <VChip
            style="position:absolute;top:12px;right:12px;font-weight:700"
            :style="statusStyle(current.status)" size="small" label>
            {{ statusLabel(current.status) }}
          </VChip>
        </div>

        <!-- Onglets toggle -->
        <div class="d-flex px-5 pt-4 gap-3">
          <button class="tab-toggle" :class="detailTab===0 ? 'tab-toggle--active' : ''" @click="detailTab=0">
            Informations Générales
          </button>
          <button class="tab-toggle" :class="detailTab===1 ? 'tab-toggle--active' : ''" @click="detailTab=1">
            Billetterie
          </button>
        </div>

        <!-- Tab 0 — Informations -->
        <VCardText v-if="detailTab===0" class="pa-5 pt-4">
          <div class="text-h6 font-weight-bold mb-1" style="color:#1a1a2e">{{ current.name || current.title }}</div>
          <div class="d-flex gap-2 flex-wrap mb-4">
            <span class="detail-chip"><VIcon icon="tabler-building-community" size="12" class="me-1" />{{ current.park?.localisation || current.park?.name || '—' }}</span>
            <span class="detail-chip"><VIcon icon="tabler-calendar" size="12" class="me-1" />{{ formatDate(current.date_start) }}</span>
            <span v-if="current.heure_debut" class="detail-chip"><VIcon icon="tabler-clock" size="12" class="me-1" />{{ current.heure_debut }}{{ current.heure_fin ? ' – '+current.heure_fin : '' }}</span>
            <span class="detail-chip"><VIcon icon="tabler-tag" size="12" class="me-1" />{{ categoryLabel(current.category) }}</span>
          </div>
          <p style="font-size:13px;color:#555;line-height:1.65" class="mb-4">
            {{ current.description || 'Aucune description disponible.' }}
          </p>
          <div class="d-flex gap-2 justify-end mt-4">
            <VBtn class="btn-delete" elevation="0" @click="openDelete(current);detailsDialog=false">
              <VIcon icon="tabler-trash" size="14" class="me-1" />Supprimer
            </VBtn>
            <VBtn class="btn-modify" elevation="0" @click="openEdit(current);detailsDialog=false">
              <VIcon icon="tabler-edit" size="14" class="me-1" />Modifier
            </VBtn>
          </div>
        </VCardText>

        <!-- Tab 1 — Billetterie -->
        <VCardText v-else class="pa-5 pt-4">
          <!-- Stats -->
          <VRow class="mb-4">
            <VCol cols="4">
              <div class="stat-card">
                <div class="stat-val">{{ current.tickets_generes || 0 }}</div>
                <div class="stat-lbl">Générés</div>
              </div>
            </VCol>
            <VCol cols="4">
              <div class="stat-card">
                <div class="stat-val" style="color:#4CAF50">{{ current.tickets_vendus || 0 }}</div>
                <div class="stat-lbl">Vendus</div>
              </div>
            </VCol>
            <VCol cols="4">
              <div class="stat-card">
                <div class="stat-val" style="color:#E8A838">{{ (current.tickets_generes||0) - (current.tickets_vendus||0) }}</div>
                <div class="stat-lbl">Disponibles</div>
              </div>
            </VCol>
          </VRow>
          <!-- Infos billet de l'événement -->
          <div class="billet-info-row mb-4">
            <div class="billet-info-item">
              <span class="billet-info-label">Prix</span>
              <span class="billet-info-val">{{ current.prix_billet ? current.prix_billet + ' €' : '—' }}</span>
            </div>
            <div class="billet-info-item">
              <span class="billet-info-label">Quantité</span>
              <span class="billet-info-val">{{ current.quantite_billets || '—' }}</span>
            </div>
            <div class="billet-info-item">
              <span class="billet-info-label">Vente sur place</span>
              <VIcon :icon="current.vente_sur_place ? 'tabler-circle-check' : 'tabler-circle-x'"
                :color="current.vente_sur_place ? '#4CAF50' : '#e53935'" size="18" />
            </div>
            <div class="billet-info-item">
              <span class="billet-info-label">Vente en ligne</span>
              <VIcon :icon="current.vente_en_ligne ? 'tabler-circle-check' : 'tabler-circle-x'"
                :color="current.vente_en_ligne ? '#4CAF50' : '#e53935'" size="18" />
            </div>
            <div class="billet-info-item">
              <span class="billet-info-label">Portique scan</span>
              <VIcon :icon="current.portique_scan ? 'tabler-circle-check' : 'tabler-circle-x'"
                :color="current.portique_scan ? '#4CAF50' : '#e53935'" size="18" />
            </div>
          </div>

          <!-- QR Code du billet -->
          <div class="qr-section mb-4">
            <div class="qr-section-title">QR Code billet</div>
            <div class="qr-box">
              <div class="qr-inner">
                <VIcon icon="tabler-qrcode" size="80" color="#1a1a2e" />
              </div>
              <div class="qr-info">
                <div class="qr-event-name">{{ current.name || current.title }}</div>
                <div class="qr-event-date">
                  <VIcon icon="tabler-calendar" size="12" class="me-1" />{{ formatDate(current.date_start) }}
                  <span v-if="current.heure_debut"> · {{ current.heure_debut }}</span>
                </div>
                <div class="qr-actions mt-3 d-flex gap-2">
                  <button class="qr-btn qr-btn--download">
                    <VIcon icon="tabler-download" size="14" class="me-1" />Télécharger
                  </button>
                  <button class="qr-btn qr-btn--print">
                    <VIcon icon="tabler-printer" size="14" class="me-1" />Imprimer
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Table billets (si ticket_types définis) -->
          <div v-if="current.ticket_types && current.ticket_types.length">
            <div class="qr-section-title mb-2">Types de billets</div>
            <VTable density="compact">
              <thead>
                <tr>
                  <th class="th">TYPE</th>
                  <th class="th">PRIX</th>
                  <th class="th">QTÉ</th>
                  <th class="th">STATUT</th>
                  <th class="th">QR</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tt in current.ticket_types" :key="tt.id">
                  <td style="font-size:13px;font-weight:600">{{ tt.name }}</td>
                  <td style="font-size:13px">{{ tt.price }} €</td>
                  <td style="font-size:13px">{{ tt.quantity }}</td>
                  <td>
                    <VChip size="x-small" :color="tt.status==='available' ? 'success' : 'error'" label>
                      {{ tt.status==='available' ? 'Disponible' : 'Épuisée' }}
                    </VChip>
                  </td>
                  <td>
                    <button class="icon-action" title="Voir QR">
                      <VIcon icon="tabler-qrcode" size="16" color="#1a1a2e" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </VTable>
          </div>
        </VCardText>
      </VCard>
    </VDialog>


    <!-- ══════════════════════════════════════════════════
         MODAL CRÉER / MODIFIER — stepper 2 étapes
    ══════════════════════════════════════════════════ -->
    <VDialog v-model="formDialog" max-width="700" scrollable persistent>
      <VCard style="border-radius:14px;overflow:hidden">

        <!-- ── Header ── -->
        <div class="form-modal-header d-flex align-center gap-2 px-5 py-4">
          <button class="modal-back-btn" @click="formDialog=false">
            <VIcon icon="tabler-arrow-left" size="17" />
          </button>
          <span class="modal-title">{{ isEditing ? 'Modifier l\'évènement' : 'Nouveau évènement' }}</span>
        </div>

        <!-- ── Stepper ── -->
        <div class="form-stepper px-5 pb-4">
          <div class="stepper-step" :class="step===1 ? 'stepper-step--active':''">
            <div class="stepper-num" :class="step===1 ? 'stepper-num--active' : step>1 ? 'stepper-num--done':''">1</div>
            <span class="stepper-txt" :class="step===1?'stepper-txt--active':''">Informations générales</span>
          </div>
          <VIcon icon="tabler-chevron-right" size="16" style="color:#ccc;flex-shrink:0" />
          <div class="stepper-step" :class="step===2 ? 'stepper-step--active':''">
            <div class="stepper-num" :class="step===2 ? 'stepper-num--active':''">2</div>
            <span class="stepper-txt" :class="step===2?'stepper-txt--active':''">Billetterie</span>
          </div>
        </div>

        <VCardText class="px-5 pt-0 pb-2">
          <VForm ref="evForm">

            <!-- ══ ÉTAPE 1 ══ -->
            <div v-if="step===1">

              <!-- Zone image -->
              <div class="field-label mb-1">Image d'évènement</div>
              <div class="img-upload-zone" @click="$refs.imgInput.click()">
                <VImg v-if="form.imagePreview" :src="form.imagePreview" height="140" cover style="border-radius:8px" />
                <div v-else class="img-upload-placeholder">
                  <VIcon icon="tabler-photo-up" size="36" color="#ccc" />
                  <span class="img-upload-placeholder-text">Cliquer pour ajouter une image</span>
                </div>
              </div>
              <div class="img-hint mt-1 mb-3">Formats autorisés : JPG, GIF ou PNG. Taille maximale de 800 Ko</div>
              <input ref="imgInput" type="file" accept="image/*" class="d-none" @change="onImageChange" />

              <!-- Boutons image -->
              <div class="d-flex gap-3 mb-5">
                <button class="img-btn img-btn--dark flex-1" @click="resetImage">
                  Réinitialiser
                </button>
                <button class="img-btn img-btn--gold flex-1" @click="$refs.imgInput.click()">
                  Télécharger Une Nouvelle Photo
                </button>
              </div>

              <!-- Champs -->
              <VRow dense>
                <VCol cols="12" md="6">
                  <div class="field-label mb-1">Nom de l'évènement <span class="req">*</span></div>
                  <VTextField v-model="form.name" placeholder="Entrer le nom de l'évènement"
                    density="compact" variant="outlined" hide-details :rules="[v=>!!v||'Requis']" />
                </VCol>
                <VCol cols="12" md="6">
                  <div class="field-label mb-1">Catégorie <span class="req">*</span></div>
                  <VSelect v-model="form.category" :items="categorieOptions"
                    item-title="title" item-value="value"
                    placeholder="Entrer une catégorie"
                    density="compact" variant="outlined" hide-details
                    :rules="[v=>!!v||'Requis']" />
                </VCol>
                <VCol cols="12" md="4" class="mt-3">
                  <div class="field-label mb-1">Date <span class="req">*</span></div>
                  <VTextField v-model="form.date_start" placeholder="DD/MM/YYYY" type="date"
                    density="compact" variant="outlined" hide-details :rules="[v=>!!v||'Requis']" />
                </VCol>
                <VCol cols="12" md="4" class="mt-3">
                  <div class="field-label mb-1">Heure de début</div>
                  <VTextField v-model="form.heure_debut" placeholder="09:00" type="time"
                    density="compact" variant="outlined" hide-details />
                </VCol>
                <VCol cols="12" md="4" class="mt-3">
                  <div class="field-label mb-1">Heure de fin</div>
                  <VTextField v-model="form.heure_fin" placeholder="18:00" type="time"
                    density="compact" variant="outlined" hide-details />
                </VCol>
                <VCol cols="12" md="4" class="mt-3">
                  <div class="field-label mb-1">Capacité</div>
                  <VTextField v-model="form.capacite" placeholder="Entrer la capacité" type="number"
                    density="compact" variant="outlined" hide-details />
                </VCol>
                <VCol cols="12" md="8" class="mt-3">
                  <div class="field-label mb-1">Parc(s) associé(s) <span class="req">*</span></div>
                  <VSelect v-model="form.park_id" :items="parcOptions" item-title="name" item-value="id"
                    placeholder="Entrer une/des parc(s)"
                    density="compact" variant="outlined" hide-details
                    :rules="[v=>!!v||'Requis']" />
                </VCol>
                <VCol cols="12" class="mt-3">
                  <div class="field-label mb-1">Description de l'évènement</div>
                  <VTextarea v-model="form.description" placeholder="Décrivez l'évènement ici..."
                    rows="4" density="compact" variant="outlined" hide-details />
                </VCol>
              </VRow>
            </div>

            <!-- ══ ÉTAPE 2 ══ -->
            <div v-else>
              <!-- ── Aperçu du billet ── -->
              <div class="field-label mb-2">Aperçu de billet</div>
              <div class="ticket-preview mb-4">
                <div class="ticket-preview__card">
                  <div class="ticket-preview__left">
                    <div class="ticket-preview__brand">QWIKLY</div>
                    <div class="ticket-preview__name">{{ form.name || 'Nom d\'Évènement' }}</div>
                    <div class="ticket-preview__date">
                      <VIcon icon="tabler-calendar" size="11" class="me-1" />{{ form.date_start || '—' }}
                    </div>
                    <div class="ticket-preview__parc">
                      <VIcon icon="tabler-map-pin" size="11" class="me-1" />{{ parcName(form.park_id) || 'Parc' }}
                    </div>
                  </div>
                  <div class="ticket-preview__qr">
                    <VIcon icon="tabler-qrcode" size="64" color="#1a1a2e" />
                  </div>
                </div>
              </div>

              <!-- ── Billet 1 ── -->
              <div class="d-flex align-center gap-2 mb-3">
                <span class="field-label" style="font-size:14px">Billet 1</span>
                <VIcon icon="tabler-circle-plus" size="16" color="#9e9e9e" />
              </div>

              <!-- Prix + Quantité -->
              <div class="d-flex gap-3 mb-4">
                <div style="flex:1">
                  <div class="field-label mb-1">Prix de billet</div>
                  <VTextField v-model="form.prix_billet" placeholder="Ex: 12.00" type="number"
                    prefix="€" density="compact" variant="outlined" hide-details />
                </div>
                <div style="flex:1">
                  <div class="field-label mb-1">Quantité de billets</div>
                  <VTextField v-model="form.quantite_billets" placeholder="Ex: 100" type="number"
                    density="compact" variant="outlined" hide-details />
                </div>
              </div>

              <!-- Méthode + Portique + Scans — une seule ligne -->
              <div class="toggles-row">
                <!-- Méthode de réservation -->
                <div class="toggle-group">
                  <div class="toggle-group__label">Méthode de réservation</div>
                  <div class="d-flex gap-3 mt-1">
                    <VCheckbox v-model="form.vente_sur_place" label="Sur place"
                      color="#1a1a2e" hide-details density="compact" />
                    <VCheckbox v-model="form.vente_en_ligne" label="En ligne"
                      color="#1a1a2e" hide-details density="compact" />
                  </div>
                </div>

                <!-- Portique Scan -->
                <div class="toggle-group">
                  <div class="toggle-group__label">Portique Scan</div>
                  <div class="d-flex align-center gap-2 mt-1">
                    <VSwitch v-model="form.portique_scan" color="#E8A838" hide-details density="compact" inset />
                    <span class="toggle-sub">{{ form.portique_scan ? 'Activé' : 'Désactivé' }}</span>
                  </div>
                </div>

                <!-- Scans multiples -->
                <div class="toggle-group">
                  <div class="toggle-group__label">Scans multiples</div>
                  <div class="d-flex align-center gap-2 mt-1">
                    <VSwitch v-model="form.scans_multiples" color="#E8A838" hide-details density="compact" inset />
                    <span class="toggle-sub">{{ form.scans_multiples ? 'Activé' : 'Désactivé' }}</span>
                  </div>
                </div>
              </div>

              <!-- Max scans si activé -->
              <div v-if="form.scans_multiples" class="mt-3">
                <div class="field-label mb-1">Nombre maximum de scans</div>
                <VTextField v-model="form.max_scans" placeholder="Ex: 3" type="number"
                  density="compact" variant="outlined" hide-details style="max-width:200px" />
              </div>
            </div>

          </VForm>
        </VCardText>

        <!-- ── Boutons bas ── -->
        <div class="form-modal-footer">
          <button class="footer-btn footer-btn--dark" @click="step===1 ? formDialog=false : step=1">
            <VIcon icon="tabler-arrow-left" size="15" class="me-1" />Précédent
          </button>
          <!-- Step 1 → Suivant (gold) / Step 2 → Créer (navy) -->
          <button v-if="step===1"
            class="footer-btn footer-btn--gold"
            @click="goStep2()">
            Suivant <VIcon icon="tabler-arrow-right" size="15" class="ms-1" />
          </button>
          <button v-else
            class="footer-btn footer-btn--navy"
            :disabled="saving"
            @click="saveEvent()">
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
          <div class="text-subtitle-1 font-weight-bold mb-2" style="color:#1a1a2e">Supprimer l'événement</div>
          <p style="font-size:13px;color:#666">Voulez-vous vraiment supprimer <strong>{{ current?.name || current?.title }}</strong> ? Cette action est irréversible.</p>
        </VCardText>
        <VCardText class="d-flex justify-end gap-2 pb-5">
          <VBtn variant="outlined" style="border-color:#e0e0e0;color:#555;border-radius:8px" @click="deleteDialog=false">Annuler</VBtn>
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
      events: [], total: 0, page: 1, perPage: 12, isLoading: false,
      filterParc: null, filterCategorie: null, filterStatut: null,
      parcOptions: [],
      categorieOptions: [
        { title: "Concert",   value: "concert"  },
        { title: "Sport",     value: "sport"    },
        { title: "Atelier",   value: "workshop" },
        { title: "Sortie",    value: "outing"   },
        { title: "Spectacle", value: "show"     },
        { title: "Autre",     value: "other"    },
      ],
      statutOptions: [
        { title: "Actif",    value: "active"   },
        { title: "Inactif",  value: "inactive" },
        { title: "Complet",  value: "full"     },
        { title: "Terminé",  value: "ended"    },
      ],

      // Dialogs
      detailsDialog: false, detailTab: 0,
      formDialog: false, deleteDialog: false,
      current: null,
      isEditing: false, saving: false, deleting: false,
      step: 1,

      form: this.defaultForm(),
      snackVisible: false, snackMsg: "", snackColor: "success",
    };
  },

  watch: { page() { this.loadEvents(); } },

  async mounted() {
    await Promise.all([this.loadEvents(), this.loadParcs()]);
  },

  beforeUnmount() {
    if (this.form.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.form.imagePreview);
  },

  methods: {
    defaultForm() {
      return {
        name: "", park_id: null, category: null, status: "active",
        date_start: "", date_end: "", heure_debut: "", heure_fin: "",
        duree: "", capacite: "",
        description: "", image: null, imagePreview: null,
        prix_billet: "", quantite_billets: "",
        vente_sur_place: true, vente_en_ligne: false,
        portique_scan: false, scans_multiples: false, max_scans: "",
      };
    },

    async loadEvents() {
      this.isLoading = true;
      try {
        const params = { page: this.page, per_page: this.perPage };
        if (this.filterParc)      params.park_id  = this.filterParc;
        if (this.filterCategorie) params.category = this.filterCategorie;
        if (this.filterStatut)    params.status   = this.filterStatut;
        const res = await $api("/events", { params });
        this.events = (res.data || []).map(ev => this.normalizeEvent(ev));
        this.total  = res.total || 0;
      } catch (err) {
        console.error('[loadEvents]', err?.data || err);
        this.events = [];
        this.showSnack(err?.data?.message || 'Erreur de chargement des événements', 'error');
      } finally { this.isLoading = false; }
    },

    async loadParcs() {
      try {
        const res = await $api("/parks", { params: { per_page: 200 } });
        this.parcOptions = (res.data || []).map(p => ({ id: p.id, name: p.name + (p.city ? ' — ' + p.city : '') }));
      } catch { /* silent */ }
    },

    parcName(id) {
      const p = this.parcOptions.find(x => x.id === id);
      return p ? p.name : '—';
    },

    normalizeEvent(ev) {
      const parseTime = t => { if (!t) return ""; const m = String(t).match(/(\d{2}:\d{2})/); return m ? m[1] : ""; };
      const parseDate = d => { if (!d) return ""; return String(d).substring(0, 10); };
      return {
        ...ev,
        image:            ev.image_url    || ev.image    || null,
        date_start:       parseDate(ev.date     || ev.date_start),
        heure_debut:      parseTime(ev.start_time || ev.heure_debut),
        heure_fin:        parseTime(ev.end_time   || ev.heure_fin),
        prix_billet:      ev.price        ?? ev.prix_billet ?? "",
        quantite_billets: ev.quantity     ?? ev.quantite_billets ?? "",
        capacite:         ev.capacity     ?? ev.capacite ?? "",
      };
    },

    categoryLabel(val) {
      const map = { concert:'Concert', sport:'Sport', workshop:'Atelier', outing:'Sortie', show:'Spectacle', other:'Autre' };
      return map[val] || val || 'Général';
    },

    openDetails(ev) { this.current = ev; this.detailTab = 0; this.detailsDialog = true; },

    openCreate() {
      if (this.form.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.form.imagePreview);
      this.isEditing = false; this.step = 1;
      this.form = this.defaultForm();
      this.formDialog = true;
    },

    openEdit(ev) {
      if (this.form.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.form.imagePreview);
      this.isEditing = true; this.step = 1;
      this.current = ev;
      this.form = {
        ...this.defaultForm(),
        name:             ev.name || ev.title || "",
        park_id:          ev.park_id || ev.park?.id,
        category:         ev.category || null,
        status:           ev.status,
        date_start:       ev.date_start || "",
        heure_debut:      ev.heure_debut || "",
        heure_fin:        ev.heure_fin || "",
        description:      ev.description || "",
        imagePreview:     ev.image || null,
        prix_billet:      ev.prix_billet ?? "",
        quantite_billets: ev.quantite_billets ?? "",
        capacite:         ev.capacite ?? "",
        vente_sur_place:  ev.vente_sur_place ?? true,
        vente_en_ligne:   ev.vente_en_ligne ?? false,
        portique_scan:    ev.portique_scan ?? false,
        scans_multiples:  ev.scans_multiples ?? false,
        max_scans:        ev.max_scans || "",
      };
      this.formDialog = true;
    },

    openDelete(ev) { this.current = ev; this.deleteDialog = true; },

    async goStep2() {
      const { valid } = await this.$refs.evForm.validate();
      if (valid) this.step = 2;
    },

    resetImage() {
      if (this.form.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.form.imagePreview);
      this.form.image = null;
      this.form.imagePreview = null;
    },

    onImageChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      if (this.form.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.form.imagePreview);
      this.form.image = file;
      this.form.imagePreview = URL.createObjectURL(file);
    },

    async saveEvent() {
      this.saving = true;
      try {
        const fd = new FormData();

        // Required fields — always sent (backend validates these)
        fd.append('name',       this.form.name);
        fd.append('park_id',    this.form.park_id);
        fd.append('category',   this.form.category);
        fd.append('date',       this.form.date_start);
        fd.append('start_time', this.form.heure_debut || '00:00');
        fd.append('capacity',   this.form.capacite   || 1);

        // duration: calculate from heure_debut/heure_fin, fallback to 60 min
        let duration = 60;
        if (this.form.heure_debut && this.form.heure_fin) {
          const [h1, m1] = this.form.heure_debut.split(':').map(Number);
          const [h2, m2] = this.form.heure_fin.split(':').map(Number);
          const calc = (h2 * 60 + m2) - (h1 * 60 + m1);
          if (calc > 0) duration = calc;
        }
        fd.append('duration', duration);

        // Optional fields
        if (this.form.description) fd.append('description', this.form.description);
        if (this.form.prix_billet !== "" && this.form.prix_billet != null)
          fd.append('price',    this.form.prix_billet);
        if (this.form.quantite_billets !== "" && this.form.quantite_billets != null)
          fd.append('quantity', this.form.quantite_billets);

        // Image file
        if (this.form.image instanceof File) fd.append('image', this.form.image);

        // Laravel method spoofing for PUT (FormData + real PUT unreliable in PHP)
        if (this.isEditing) fd.append('_method', 'PUT');

        const url = this.isEditing ? `/events/${this.current.id}` : `/events`;
        await $api(url, { method: 'POST', body: fd });

        this.formDialog = false;
        this.showSnack(this.isEditing ? "Événement modifié" : "Événement créé", "success");

        // Reload fresh data from backend to display correct info
        if (!this.isEditing) this.page = 1;
        await this.loadEvents();
      } catch (err) {
        console.error('[saveEvent]', err?.data || err);
        const apiErrors = err?.data?.errors;
        const apiMsg    = err?.data?.message;
        let msg = "Erreur lors de l'enregistrement";
        if (apiErrors) {
          msg = Object.values(apiErrors).flat()[0] || msg;
        } else if (apiMsg) {
          msg = apiMsg;
        }
        this.showSnack(msg, "error");
      } finally { this.saving = false; }
    },

    async confirmDelete() {
      this.deleting = true;
      try {
        await $api(`/events/${this.current.id}`, { method: "DELETE" });
        this.events = this.events.filter(e => e.id !== this.current.id);
        this.deleteDialog = false;
        this.showSnack("Événement supprimé", "success");
      } catch { this.showSnack("Erreur", "error"); } finally { this.deleting = false; }
    },

    statusStyle(s) {
      const map = {
        active:   "background:#E8F5E9;color:#2E7D32",
        inactive: "background:#FDECEA;color:#c62828",
        full:     "background:#FFF3E0;color:#E65100",
        ended:    "background:#f5f5f5;color:#757575",
      };
      return map[s] || map.ended;
    },
    statusLabel(s) {
      return { active:"Actif", inactive:"Inactif", full:"Complet", ended:"Terminé" }[s] || s;
    },
    formatDate(d) {
      if (!d) return "—";
      const dt = new Date(d);
      return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()}`;
    },
    showSnack(msg, color) { this.snackMsg = msg; this.snackColor = color; this.snackVisible = true; },
  },
};
</script>

<style scoped>
/* ── Filter bar ── */
.filter-label { font-size:14px; font-weight:600; color:#1a1a2e; min-width:45px; }
.apply-btn  { background:#E8A838 !important; color:#1a1a2e !important; border-radius:8px !important; font-weight:700; min-width:110px; }
.create-btn { background:#E8A838 !important; color:#1a1a2e !important; border-radius:8px !important; font-weight:700; }
.btn-prev   { background:#333 !important; color:#fff !important; border-radius:8px !important; font-weight:600; }
.btn-delete { background:#FDECEA !important; color:#c62828 !important; border-radius:8px !important; font-weight:600; }
.btn-modify { background:#E8A838 !important; color:#1a1a2e !important; border-radius:8px !important; font-weight:700; }

/* ── Event card ── */
.event-card { border-radius:14px; overflow:hidden; transition:transform 0.15s,box-shadow 0.15s; }
.event-card:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(0,0,0,0.13) !important; }
.event-img-wrap { overflow:hidden; }
.event-name { font-size:13px; font-weight:700; color:#1a1a2e; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:150px; }
.event-cat  { font-size:11px; color:#9e9e9e; }
.event-date { font-size:11px; color:#9e9e9e; }
.status-chip { border-radius:6px !important; font-weight:700 !important; font-size:10px !important; }

/* ── Event footer ── */
.event-footer { border-top:1px solid #f0f0f0; }
.billetterie-btn { background:#E8A838 !important; color:#1a1a2e !important; border-radius:8px !important; font-weight:700; font-size:12px !important; min-width:90px; }
.icon-action {
  width:28px; height:28px; border-radius:7px; border:1.5px solid #e0e0e0;
  display:inline-flex; align-items:center; justify-content:center;
  cursor:pointer; background:#fff; color:#555; transition:all 0.15s;
}
.icon-action:hover { background:#f0f0f0; border-color:#bbb; }
.icon-action--danger { color:#e53935; }
.icon-action--danger:hover { background:#FDECEA; border-color:#ef9a9a; }

/* ── Detail tabs ── */
.tab-toggle {
  padding:8px 18px; border-radius:8px; border:none; cursor:pointer;
  font-size:13px; font-weight:600; background:#f5f5f5; color:#666;
  transition:all 0.15s;
}
.tab-toggle--active { background:#1a1a2e; color:#fff; }

/* ── Detail chip ── */
.detail-chip {
  display:inline-flex; align-items:center; font-size:11px; color:#555;
  background:#f5f5f5; padding:3px 10px; border-radius:20px;
}

/* ── Stat cards ── */
.stat-card { background:#fafafa; border:1px solid #f0f0f0; border-radius:10px; padding:14px; text-align:center; }
.stat-val { font-size:22px; font-weight:700; color:#1a1a2e; }
.stat-lbl { font-size:11px; color:#9e9e9e; margin-top:2px; }

/* ── Table ── */
.th { font-size:11px !important; font-weight:700 !important; color:#9e9e9e !important; text-transform:uppercase; padding:8px 10px !important; background:#fafafa; }

/* ── Stepper ── */
.stepper-item { display:flex; flex-direction:column; align-items:center; gap:4px; }
.stepper-circle {
  width:32px; height:32px; border-radius:50%; background:#e0e0e0; color:#9e9e9e;
  display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px;
}
.stepper-circle--active { background:#1a1a2e; color:#fff; }
.stepper-circle--gold   { background:#E8A838; color:#1a1a2e; }
.stepper-lbl { font-size:11px; font-weight:600; color:#9e9e9e; white-space:nowrap; }
.stepper-line { flex:1; height:2px; background:#e0e0e0; border-radius:2px; min-width:60px; margin-top:-14px; }

/* ── Ticket preview ── */
.ticket-preview { display:flex; justify-content:center; }
.ticket-preview__card {
  background:linear-gradient(135deg,#E8A838,#f5c842);
  border-radius:14px; padding:20px 24px;
  display:flex; align-items:center; justify-content:space-between;
  width:100%; max-width:400px; gap:20px;
  box-shadow:0 4px 20px rgba(232,168,56,0.35);
}
.ticket-preview__name { font-size:16px; font-weight:700; color:#1a1a2e; margin-bottom:4px; }
.ticket-preview__date { font-size:12px; color:#1a1a2e; opacity:0.75; margin-bottom:2px; }
.ticket-preview__parc { font-size:12px; color:#1a1a2e; opacity:0.6; }
.ticket-preview__qr { flex-shrink:0; }

/* ── Upload zone ── */
.img-upload-zone {
  border:2px dashed #e0e0e0; border-radius:10px; cursor:pointer;
  overflow:hidden; transition:border-color 0.2s; min-height:140px;
  display:flex; align-items:center; justify-content:center;
}
.img-upload-zone:hover { border-color:#E8A838; }
.img-upload-placeholder {
  display:flex; flex-direction:column; align-items:center; gap:8px;
  padding:24px;
}
.img-upload-placeholder-text {
  font-size:12px; color:#aaa; font-weight:500;
}

/* ── Border bottom ── */
.border-bottom { border-bottom:1px solid #f0f0f0; }

/* ══ Form modal header ══ */
.form-modal-header {
  border-bottom: 1px solid #f0f0f0;
}
.modal-back-btn {
  width: 32px; height: 32px; border-radius: 8px;
  border: 1.5px solid #e0e0e0; background: #f9f9f9;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; color: #1a1a2e; transition: background 0.15s;
  flex-shrink: 0;
}
.modal-back-btn:hover { background: #f0f0f0; }
.modal-title { font-size: 16px; font-weight: 700; color: #1a1a2e; }

/* ══ Inline stepper ══ */
.form-stepper {
  display: flex; align-items: center; gap: 10px;
  padding-top: 16px;
}
.stepper-step { display: flex; align-items: center; gap: 8px; }
.stepper-num {
  width: 28px; height: 28px; border-radius: 50%;
  background: #e0e0e0; color: #9e9e9e;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; flex-shrink: 0;
  transition: background 0.2s, color 0.2s;
}
.stepper-num--active { background: #1a1a2e; color: #fff; }
.stepper-num--done   { background: #E8A838; color: #1a1a2e; }
.stepper-txt { font-size: 13px; font-weight: 600; color: #aaa; white-space: nowrap; }
.stepper-txt--active { color: #1a1a2e; }

/* ══ Image hint ══ */
.img-hint { font-size: 11px; color: #aaa; }

/* ══ Image buttons ══ */
.img-btn {
  padding: 11px 22px; border-radius: 8px; border: none;
  font-size: 13px; font-weight: 700; cursor: pointer;
  transition: opacity 0.15s; flex: 1; text-align: center;
}
.img-btn:hover { opacity: 0.85; }
.img-btn--dark { background: #8B6B20; color: #fff; }
.img-btn--gold { background: #E8A838; color: #1a1a2e; }

/* ══ Field label ══ */
.field-label { font-size: 12px; font-weight: 600; color: #1a1a2e; }
.req { color: #e53935; font-weight: 700; }

/* ══ Ticket brand ══ */
.ticket-preview__brand {
  font-size: 11px; font-weight: 700; letter-spacing: 1.5px;
  color: #1a1a2e; opacity: 0.55; margin-bottom: 6px; text-transform: uppercase;
}
.ticket-preview__left { flex: 1; min-width: 0; }

/* ══ Toggle rows ══ */
.toggle-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 0; border-bottom: 1px solid #f5f5f5;
}
.toggle-title { font-size: 13px; font-weight: 600; color: #1a1a2e; }
.toggle-sub   { font-size: 11px; color: #aaa; margin-top: 2px; }

/* ══ Form modal footer ══ */
.form-modal-footer {
  display: grid; grid-template-columns: 1fr 1fr;
  border-top: 1px solid #f0f0f0;
}
.footer-btn {
  padding: 15px; border: none; cursor: pointer;
  font-size: 14px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: opacity 0.15s;
}
.footer-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.footer-btn--dark { background: #8B6B20; color: #fff; }
.footer-btn--dark:hover:not(:disabled) { opacity: 0.88; }
.footer-btn--gold { background: #E8A838; color: #1a1a2e; }
.footer-btn--gold:hover:not(:disabled) { background: #d4942b; }
.footer-btn--navy { background: #1a1a2e; color: #fff; }
.footer-btn--navy:hover:not(:disabled) { opacity: 0.88; }

/* ══ Toggles row ══ */
.toggles-row {
  display: flex; gap: 16px; align-items: flex-start;
  padding: 12px 0; border-top: 1px solid #f0f0f0;
}
.toggle-group { flex: 1; }
.toggle-group__label { font-size: 12px; font-weight: 600; color: #1a1a2e; }

/* ══ Billetterie details ══ */
.billet-info-row {
  display: flex; gap: 0; flex-wrap: wrap;
  background: #fafafa; border-radius: 10px; overflow: hidden;
  border: 1px solid #f0f0f0;
}
.billet-info-item {
  flex: 1; min-width: 80px;
  display: flex; flex-direction: column; align-items: center;
  padding: 12px 8px; border-right: 1px solid #f0f0f0; gap: 4px;
}
.billet-info-item:last-child { border-right: none; }
.billet-info-label { font-size: 10px; color: #aaa; text-transform: uppercase; font-weight: 600; }
.billet-info-val { font-size: 15px; font-weight: 700; color: #1a1a2e; }

/* ══ QR Section ══ */
.qr-section-title { font-size: 12px; font-weight: 700; color: #1a1a2e; text-transform: uppercase; letter-spacing: 0.5px; }
.qr-box {
  display: flex; align-items: center; gap: 20px;
  background: #fafafa; border: 1.5px solid #f0f0f0;
  border-radius: 12px; padding: 16px 20px;
}
.qr-inner {
  background: #fff; border: 1px solid #e8e8e8; border-radius: 8px;
  padding: 8px; flex-shrink: 0;
}
.qr-event-name { font-size: 14px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
.qr-event-date { font-size: 12px; color: #9e9e9e; display: flex; align-items: center; }
.qr-btn {
  padding: 7px 14px; border-radius: 8px; border: none; cursor: pointer;
  font-size: 12px; font-weight: 600; display: inline-flex; align-items: center;
  transition: opacity 0.15s;
}
.qr-btn:hover { opacity: 0.82; }
.qr-btn--download { background: #1a1a2e; color: #fff; }
.qr-btn--print { background: #f5f5f5; color: #555; border: 1px solid #e0e0e0; }
</style>
