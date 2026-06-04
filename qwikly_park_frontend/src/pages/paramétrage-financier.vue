<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="pf-title">Paramétrage Financier</h1>
        <p class="pf-sub">Configuration fiscale, modes de paiement et comptabilité</p>
      </div>
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

    <!-- ══ PARAMÉTRAGE ══ -->
    <div v-if="activeTab==='parametrage'">
      <VCard elevation="0" border style="border-radius:12px">
        <VCardText class="pa-6">

          <!-- Informations légales -->
          <div class="d-flex align-center justify-space-between mb-4">
            <div class="pf-section-title">
              <VIcon icon="tabler-building" size="18" class="me-2" style="color:#E8A838"/>Informations légales
            </div>
            <VSelect
              v-if="franchises.length > 1"
              v-model="franchiseId"
              :items="franchises"
              :item-title="f => f.name || f.nom || `Franchise #${f.id}`"
              item-value="id"
              density="compact"
              variant="outlined"
              hide-details
              style="min-width:180px;max-width:220px"
              @update:modelValue="loadParam"
            />
          </div>
          <VRow dense>
            <VCol cols="12" md="6">
              <div class="pf-label">SIRET</div>
              <VTextField v-model="param.siret" density="compact" variant="outlined" placeholder="123 456 789 00012" hide-details class="mb-4"/>
            </VCol>
            <VCol cols="12" md="6">
              <div class="pf-label">SIREN</div>
              <VTextField v-model="param.siren" density="compact" variant="outlined" placeholder="123 456 789" hide-details class="mb-4"/>
            </VCol>
            <VCol cols="12" md="6">
              <div class="pf-label">Numéro de TVA intracommunautaire</div>
              <VTextField v-model="param.numero_tva" density="compact" variant="outlined" placeholder="FR12 123456789" hide-details class="mb-4"/>
            </VCol>
            <VCol cols="12" md="6">
              <div class="pf-label">Raison sociale</div>
              <VTextField v-model="param.raison_sociale" density="compact" variant="outlined" placeholder="Nom de la société" hide-details class="mb-4"/>
            </VCol>
          </VRow>

          <VDivider class="my-5"/>

          <!-- Taux de TVA -->
          <div class="pf-section-title mb-4">
            <VIcon icon="tabler-percentage" size="18" class="me-2" style="color:#E8A838"/>Taux de TVA
          </div>
          <div class="pf-tva-grid mb-2">
            <div v-for="tva in param.taux_tva" :key="tva.id"
              class="pf-tva-card" :class="tva.defaut?'pf-tva-card--active':''">
              <div class="d-flex align-center justify-space-between">
                <span class="pf-tva-val">{{ tva.taux }}%</span>
                <VChip v-if="tva.defaut" color="success" size="x-small">Défaut</VChip>
                <button v-else class="pf-chip-btn" @click="setTvaDefaut(tva)">Définir défaut</button>
              </div>
              <div class="pf-tva-label">{{ tva.label }}</div>
              <div v-if="tva.custom" class="d-flex gap-1 mt-2">
                <button class="pf-icon-btn" @click="editTva(tva)"><VIcon icon="tabler-pencil" size="13"/></button>
                <button class="pf-icon-btn pf-icon-btn--danger" @click="deleteTva(tva)"><VIcon icon="tabler-trash" size="13"/></button>
              </div>
            </div>
            <div class="pf-tva-add" @click="openAddTva">
              <VIcon icon="tabler-plus" size="22" style="color:#E8A838"/>
              <div class="pf-tva-label">Personnalisé</div>
            </div>
          </div>

          <VDivider class="my-5"/>

          <!-- Documents -->
          <div class="pf-section-title mb-4">
            <VIcon icon="tabler-file-text" size="18" class="me-2" style="color:#E8A838"/>Documents modifiables
          </div>
          <VRow dense>
            <VCol cols="12" sm="6" v-for="doc in documents" :key="doc.key">
              <div class="pf-doc-card mb-3">
                <div class="d-flex align-center gap-3">
                  <div class="pf-doc-icon"><VIcon :icon="doc.icon" size="20" style="color:#1a1a2e"/></div>
                  <div class="flex-grow-1">
                    <div class="pf-doc-name">{{ doc.label }}</div>
                    <div class="pf-doc-desc">{{ doc.desc }}</div>
                  </div>
                  <button class="pf-edit-btn" @click="openDocConfig(doc)">
                    <VIcon icon="tabler-pencil" size="13" class="me-1"/>Configurer
                  </button>
                </div>
              </div>
            </VCol>
          </VRow>

          <div class="d-flex justify-end mt-4">
            <VBtn style="background:#E8A838;color:#1a1a2e;border-radius:10px;font-weight:700" :loading="savingParam" @click="saveParam">
              <VIcon icon="tabler-device-floppy" size="16" class="me-1"/>Enregistrer
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </div>

    <!-- ══ MODES DE PAIEMENT ══ -->
    <div v-else-if="activeTab==='paiements'">
      <VCard elevation="0" border style="border-radius:12px" class="mb-4">
        <VCardText class="pa-6">
          <!-- Header with franchise selector -->
          <div class="d-flex align-center justify-space-between mb-4 flex-wrap gap-3">
            <div class="pf-section-title mb-0">
              <VIcon icon="tabler-credit-card" size="18" class="me-2" style="color:#E8A838"/>Méthodes de paiement
            </div>
            <div class="d-flex align-center gap-3">
              <!-- Franchise selector -->
              <VSelect
                v-if="franchises.length > 1"
                v-model="franchiseId"
                :items="franchises"
                :item-title="f => f.name || f.nom || `Franchise #${f.id}`"
                item-value="id"
                density="compact"
                variant="outlined"
                hide-details
                style="min-width:180px;max-width:220px"
                @update:modelValue="loadPaiements"
              />
              <VBtn
                style="background:#E8A838;color:#1a1a2e;border-radius:8px"
                size="small" elevation="0"
                @click="openAddPaiement"
              >
                <VIcon icon="tabler-plus" size="15" class="me-1"/>Ajouter
              </VBtn>
            </div>
          </div>

          <!-- Loading state -->
          <div v-if="loadingPaiements" class="d-flex justify-center align-center py-8">
            <VProgressCircular indeterminate color="#E8A838" size="32"/>
          </div>

          <!-- No franchise -->
          <div v-else-if="!franchiseId" class="text-center py-8" style="color:#9e9e9e;font-size:13px">
            <VIcon icon="tabler-building-estate" size="36" style="color:#e0e0e0" class="d-block mb-2"/>
            Aucune franchise disponible. Créez une franchise d'abord.
          </div>

          <!-- Empty state -->
          <div v-else-if="paiements.length === 0" class="text-center py-8" style="color:#9e9e9e;font-size:13px">
            <VIcon icon="tabler-credit-card" size="36" style="color:#e0e0e0" class="d-block mb-2"/>
            Aucun mode de paiement configuré.
            <button @click="openAddPaiement" style="display:block;margin:8px auto 0;background:none;border:none;color:#E8A838;font-weight:700;cursor:pointer;font-size:13px">
              + Ajouter le premier mode
            </button>
          </div>

          <!-- Payment method cards -->
          <VRow v-else dense>
            <VCol cols="12" sm="6" md="4" v-for="m in paiements" :key="m.id">
              <div class="pf-pay-card mb-3" :class="m.actif ? 'pf-pay-card--active' : 'pf-pay-card--inactive'">
                <div class="d-flex align-center gap-3 mb-3">
                  <div class="pf-pay-icon">
                    <VIcon :icon="m.icon || 'tabler-cash'" size="24" :style="m.actif ? 'color:#1a1a2e' : 'color:#bbb'"/>
                  </div>
                  <div class="flex-grow-1 min-width-0">
                    <div class="pf-pay-name">{{ m.name }}</div>
                    <div class="pf-pay-desc">{{ m.description || '—' }}</div>
                  </div>
                  <VSwitch
                    v-model="m.actif"
                    density="compact" hide-details color="#1a1a2e"
                    @update:modelValue="togglePaiement(m)"
                  />
                </div>
                <div class="d-flex align-center justify-space-between">
                  <VChip
                    :color="m.actif ? 'success' : 'default'"
                    size="x-small" variant="tonal"
                  >
                    {{ m.actif ? 'Actif' : 'Inactif' }}
                  </VChip>
                  <div class="d-flex gap-1">
                    <button class="pf-icon-btn" @click="editPaiement(m)">
                      <VIcon icon="tabler-pencil" size="14"/>
                    </button>
                    <button class="pf-icon-btn pf-icon-btn--danger" @click="deletePaiement(m)">
                      <VIcon icon="tabler-trash" size="14"/>
                    </button>
                  </div>
                </div>
              </div>
            </VCol>
          </VRow>

          <VDivider class="my-5"/>
          <div class="d-flex align-center justify-space-between mb-3">
            <div class="pf-section-title mb-0">
              <VIcon icon="tabler-history" size="18" class="me-2" style="color:#E8A838"/>Historique des paiements
            </div>
            <div class="d-flex gap-2">
              <VSelect v-model="histPerPage" :items="[5,10,25,50]" density="compact" variant="outlined" hide-details style="width:80px"/>
              <VBtn variant="outlined" size="small" style="color:#1a1a2e;border-color:#1a1a2e" @click="exportHist">
                <VIcon icon="tabler-upload" size="14" class="me-1"/>Export
              </VBtn>
            </div>
          </div>
          <VTable>
            <thead>
              <tr>
                <th>DATE</th><th>MÉTHODE</th><th>MONTANT</th><th>PARC</th><th>STATUT</th>
              </tr>
            </thead>
            <tbody v-if="loadingHist">
              <tr><td colspan="5" class="text-center py-6"><VProgressCircular indeterminate color="#E8A838" size="24"/></td></tr>
            </tbody>
            <tbody v-else-if="!histPaiements.length">
              <tr><td colspan="5" class="text-center py-6" style="color:#9e9e9e;font-size:13px">Aucun paiement trouvé</td></tr>
            </tbody>
            <tbody v-else>
              <tr v-for="h in histPaiements" :key="h.id">
                <td style="font-size:13px">{{ fmtDate(h.created_at) }}</td>
                <td style="font-size:13px">{{ h.method }}</td>
                <td style="font-weight:700;color:#1a1a2e">{{ h.amount }} €</td>
                <td style="font-size:13px">{{ h.park?.name || '—' }}</td>
                <td>
                  <VChip :color="h.status==='success'?'success':'error'" size="x-small">
                    {{ h.status==='success'?'Validé':'Échoué' }}
                  </VChip>
                </td>
              </tr>
            </tbody>
          </VTable>
        </VCardText>
      </VCard>
    </div>

    <!-- ══ COMPTABILITÉ ══ -->
    <div v-else-if="activeTab==='comptabilite'">
      <VCard elevation="0" border style="border-radius:12px">
        <VCardText class="pa-6">
          <div class="pf-section-title mb-2">
            <VIcon icon="tabler-mail" size="18" class="me-2" style="color:#E8A838"/>Emails comptables
          </div>
          <p style="font-size:13px;color:#9e9e9e;margin-bottom:16px">
            Ces adresses recevront automatiquement les statistiques financières.
          </p>

          <div v-for="(email, idx) in compta.emails" :key="idx" class="d-flex align-center gap-2 mb-1">
            <VTextField
              v-model="compta.emails[idx]"
              density="compact"
              variant="outlined"
              placeholder="email@exemple.com"
              type="email"
              :error-messages="emailErrors[idx] ? [emailErrors[idx]] : []"
              class="flex-grow-1"
              @blur="validateEmailField(idx)"
              @input="clearEmailError(idx)"
            />
            <VBtn v-if="compta.emails.length > 1" icon variant="text" size="small" color="error" @click="removeEmail(idx)">
              <VIcon icon="tabler-trash" size="16"/>
            </VBtn>
          </div>
          <VBtn variant="text" style="color:#E8A838;font-size:13px;font-weight:600" class="mt-1" @click="addEmail">
            <VIcon icon="tabler-plus" size="15" class="me-1"/>Ajouter un email
          </VBtn>

          <VDivider class="my-5"/>
          <div class="pf-section-title mb-3">
            <VIcon icon="tabler-clock" size="18" class="me-2" style="color:#E8A838"/>Envoi automatique des statistiques
          </div>
          <VRow dense>
            <VCol cols="12" md="5">
              <div class="pf-label">Fréquence d'envoi</div>
              <VSelect v-model="compta.frequence"
                :items="[{title:'Quotidien',value:'daily'},{title:'Hebdomadaire',value:'weekly'},{title:'Mensuel',value:'monthly'}]"
                item-title="title" item-value="value"
                density="compact" variant="outlined" hide-details class="mb-4"/>
            </VCol>
            <VCol cols="12" md="7">
              <div class="pf-label mb-2">Contenu du rapport</div>
              <VCheckbox v-model="compta.include_revenue"  label="Revenus totaux"     density="compact" hide-details color="#1a1a2e"/>
              <VCheckbox v-model="compta.include_sessions" label="Sessions de caisse"  density="compact" hide-details color="#1a1a2e"/>
              <VCheckbox v-model="compta.include_factures" label="Factures émises"     density="compact" hide-details color="#1a1a2e"/>
            </VCol>
          </VRow>

          <div class="d-flex justify-end mt-4">
            <VBtn
              style="background:#E8A838;color:#1a1a2e;border-radius:10px;font-weight:700"
              :loading="savingCompta || loadingPaiements"
              @click="saveCompta"
            >
              <VIcon icon="tabler-device-floppy" size="16" class="me-1"/>
              {{ loadingPaiements ? 'Chargement...' : 'Enregistrer' }}
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </div>

    <!-- ══ MODAL TVA ══ -->
    <VDialog v-model="showTvaDialog" max-width="360" persistent>
      <VCard style="border-radius:12px">
        <VCardText class="pa-5">
          <div class="pf-modal-title mb-4">{{ editingTva?'Modifier le taux':'Nouveau taux TVA' }}</div>
          <div class="pf-label">Taux (%)</div>
          <VTextField v-model="tvaForm.taux" type="number" step="0.1" density="compact" variant="outlined" placeholder="Ex: 8.5" hide-details class="mb-3"/>
          <div class="pf-label">Label</div>
          <VTextField v-model="tvaForm.label" density="compact" variant="outlined" placeholder="Ex: Taux réduit spécial" hide-details/>
        </VCardText>
        <VCardActions class="pa-4 gap-2">
          <VBtn variant="outlined" class="btn-annuler" @click="showTvaDialog=false">Annuler</VBtn>
          <VBtn class="btn-confirm" @click="saveTva">Enregistrer</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- ══ MODAL PAIEMENT ══ -->
    <VDialog v-model="showPaiementDialog" max-width="400" persistent>
      <VCard style="border-radius:12px">
        <VCardText class="pa-5">
          <div class="pf-modal-title mb-4">{{ editingPaiement?'Modifier le mode':'Nouveau mode de paiement' }}</div>
          <div class="pf-label">Nom *</div>
          <VTextField v-model="paiementForm.name" density="compact" variant="outlined" placeholder="Ex: Virement bancaire" hide-details class="mb-3"/>
          <div class="pf-label">Description</div>
          <VTextField v-model="paiementForm.description" density="compact" variant="outlined" placeholder="Courte description..." hide-details class="mb-3"/>
          <div class="pf-label">Icône</div>
          <VSelect v-model="paiementForm.icon" :items="iconOptions" item-title="label" item-value="value" density="compact" variant="outlined" hide-details/>
        </VCardText>
        <VCardActions class="pa-4 gap-2">
          <VBtn variant="outlined" class="btn-annuler" @click="showPaiementDialog=false">Annuler</VBtn>
          <VBtn class="btn-confirm" :loading="savingPaiement" :disabled="savingPaiement || !paiementForm.name.trim()" @click="savePaiement">Enregistrer</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- ══ MODAL CONFIGURER DOCUMENT ══ -->
    <VDialog v-model="showDocDialog" max-width="620" persistent scrollable>
      <VCard style="border-radius:14px;overflow:hidden" v-if="currentDoc">
        <!-- Header -->
        <div style="background:#1a1a2e;padding:16px 20px;display:flex;align-items:center;gap:12px">
          <div style="width:38px;height:38px;border-radius:10px;background:rgba(232,168,56,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <VIcon :icon="currentDoc.icon" size="20" color="#E8A838"/>
          </div>
          <div>
            <div style="color:#fff;font-weight:700;font-size:15px">Configuration — {{ currentDoc.label }}</div>
            <div style="color:rgba(255,255,255,.6);font-size:12px">{{ currentDoc.desc }}</div>
          </div>
          <button @click="showDocDialog=false" style="margin-left:auto;background:none;border:none;cursor:pointer;color:rgba(255,255,255,.7)">
            <VIcon icon="tabler-x" size="20"/>
          </button>
        </div>

        <VCardText class="pa-5" style="max-height:70vh;overflow-y:auto">
          <VRow dense>

            <!-- Numérotation -->
            <VCol cols="12">
              <div style="font-size:12px;font-weight:700;color:#9e9e9e;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px">
                <VIcon icon="tabler-hash" size="13" class="me-1"/>Numérotation
              </div>
            </VCol>
            <VCol cols="12" md="6">
              <div class="pf-label">Préfixe</div>
              <VTextField
                v-model="docForm.prefix"
                density="compact" variant="outlined"
                :placeholder="getDocPlaceholder(currentDoc.key, 'prefix')"
                hide-details class="mb-4"
              />
            </VCol>
            <VCol cols="12" md="6">
              <div class="pf-label">Numéro de départ</div>
              <VTextField
                v-model="docForm.start_number"
                density="compact" variant="outlined"
                type="number" min="1"
                placeholder="1" hide-details class="mb-4"
              />
            </VCol>
            <VCol cols="12">
              <div style="background:#f9f9f9;border-radius:8px;padding:8px 14px;font-size:12px;color:#555;margin-bottom:16px">
                <VIcon icon="tabler-eye" size="13" class="me-1" style="color:#E8A838"/>
                Aperçu : <strong style="color:#1a1a2e">{{ docPreview }}</strong>
              </div>
            </VCol>

            <VCol cols="12"><VDivider/></VCol>

            <!-- En-tête -->
            <VCol cols="12" class="mt-3">
              <div style="font-size:12px;font-weight:700;color:#9e9e9e;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px">
                <VIcon icon="tabler-layout-navbar" size="13" class="me-1"/>En-tête du document
              </div>
            </VCol>
            <VCol cols="12" md="6">
              <div class="pf-label">Raison sociale</div>
              <VTextField v-model="docForm.company_name" density="compact" variant="outlined"
                placeholder="Nom de votre société" hide-details class="mb-4"/>
            </VCol>
            <VCol cols="12" md="6">
              <div class="pf-label">Adresse</div>
              <VTextField v-model="docForm.address" density="compact" variant="outlined"
                placeholder="12 Rue Exemple, 75001 Paris" hide-details class="mb-4"/>
            </VCol>
            <VCol cols="12" md="6">
              <div class="pf-label">Téléphone</div>
              <VTextField v-model="docForm.phone" density="compact" variant="outlined"
                placeholder="+33 1 23 45 67 89" hide-details class="mb-4"/>
            </VCol>
            <VCol cols="12" md="6">
              <div class="pf-label">Email</div>
              <VTextField v-model="docForm.email" density="compact" variant="outlined" type="email"
                placeholder="contact@société.fr" hide-details class="mb-4"/>
            </VCol>

            <VCol cols="12"><VDivider/></VCol>

            <!-- Conditions -->
            <VCol cols="12" class="mt-3" v-if="currentDoc.key === 'devis' || currentDoc.key === 'facture'">
              <div style="font-size:12px;font-weight:700;color:#9e9e9e;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px">
                <VIcon icon="tabler-notes" size="13" class="me-1"/>Conditions
              </div>
            </VCol>
            <VCol cols="12" md="6" v-if="currentDoc.key === 'devis'">
              <div class="pf-label">Validité du devis (jours)</div>
              <VTextField v-model="docForm.validite_jours" density="compact" variant="outlined"
                type="number" min="1" placeholder="30" hide-details class="mb-4"/>
            </VCol>
            <VCol cols="12" md="6" v-if="currentDoc.key === 'facture'">
              <div class="pf-label">Délai de paiement (jours)</div>
              <VTextField v-model="docForm.delai_paiement" density="compact" variant="outlined"
                type="number" min="0" placeholder="30" hide-details class="mb-4"/>
            </VCol>
            <VCol cols="12" v-if="currentDoc.key === 'facture'">
              <div class="pf-label">Pénalités de retard</div>
              <VTextField v-model="docForm.penalites" density="compact" variant="outlined"
                placeholder="Ex: 3 fois le taux légal" hide-details class="mb-4"/>
            </VCol>

            <VCol cols="12"><VDivider/></VCol>

            <!-- Pied de page -->
            <VCol cols="12" class="mt-3">
              <div style="font-size:12px;font-weight:700;color:#9e9e9e;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px">
                <VIcon icon="tabler-layout-bottombar" size="13" class="me-1"/>Pied de page
              </div>
            </VCol>
            <VCol cols="12">
              <div class="pf-label">Mentions légales / Notes</div>
              <VTextarea v-model="docForm.footer_text" density="compact" variant="outlined"
                rows="3" placeholder="Mentions légales, conditions générales..."
                hide-details class="mb-4"/>
            </VCol>

            <!-- Options -->
            <VCol cols="12"><VDivider/></VCol>
            <VCol cols="12" class="mt-3">
              <div style="font-size:12px;font-weight:700;color:#9e9e9e;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px">
                <VIcon icon="tabler-adjustments" size="13" class="me-1"/>Options d'affichage
              </div>
            </VCol>
            <VCol cols="6">
              <VCheckbox v-model="docForm.show_logo" label="Afficher le logo" density="compact" hide-details color="#1a1a2e"/>
            </VCol>
            <VCol cols="6">
              <VCheckbox v-model="docForm.show_tva" label="Afficher le détail TVA" density="compact" hide-details color="#1a1a2e"/>
            </VCol>
            <VCol cols="6">
              <VCheckbox v-model="docForm.show_signature" label="Zone de signature" density="compact" hide-details color="#1a1a2e"/>
            </VCol>
            <VCol cols="6">
              <VCheckbox v-model="docForm.show_qrcode" label="QR Code du document" density="compact" hide-details color="#1a1a2e"/>
            </VCol>

          </VRow>
        </VCardText>

        <!-- Footer actions -->
        <div style="padding:14px 20px 18px;border-top:1px solid #f0f0f0;display:flex;gap:10px">
          <button @click="showDocDialog=false"
            style="flex:1;height:42px;border-radius:10px;border:1.5px solid #e0e0e0;background:#fff;color:#555;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">
            Annuler
          </button>
          <button @click="saveDocConfig" :disabled="savingDoc"
            style="flex:2;height:42px;border-radius:10px;border:none;background:#E8A838;color:#1a1a2e;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px">
            <VProgressCircular v-if="savingDoc" size="14" indeterminate color="#fff"/>
            <VIcon v-else icon="tabler-device-floppy" size="16"/>
            Enregistrer la configuration
          </button>
        </div>
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
  name: "ParamétrageFinancier",
  data() {
    return {
      activeTab: "parametrage",
      tabs: [
        { key: "parametrage",  label: "Paramétrage",       icon: "tabler-settings"     },
        { key: "paiements",    label: "Modes de paiement", icon: "tabler-credit-card"  },
        { key: "comptabilite", label: "Comptabilité",       icon: "tabler-calculator"   },
      ],

      // ── Paramétrage ──
      savingParam: false,
      param: {
        siret: "", siren: "", numero_tva: "", raison_sociale: "",
        taux_tva: [
          { id:1, taux:20,  label:"Taux normal",        defaut:true,  custom:false },
          { id:2, taux:10,  label:"Taux intermédiaire", defaut:false, custom:false },
          { id:3, taux:5.5, label:"Taux réduit",        defaut:false, custom:false },
        ],
      },
      nextTvaId: 10,
      showTvaDialog: false,
      editingTva: null,
      tvaForm: { taux:"", label:"" },

      documents: [
        { key:"devis",     label:"Devis",            icon:"tabler-file-description", desc:"Modèle de devis client"          },
        { key:"facture",   label:"Factures",          icon:"tabler-file-invoice",     desc:"Modèle de facture client"         },
        { key:"commande",  label:"Bons de commande",  icon:"tabler-clipboard-list",   desc:"Bon de commande fournisseur"      },
      ],

      // ── Paiements ──
      franchiseId:     null,
      franchises:      [],
      loadingPaiements: false,
      savingPaiement:  false,
      paiements:       [],
      showPaiementDialog: false,
      editingPaiement: null,
      paiementForm: { name:"", description:"", icon:"tabler-cash" },
      iconOptions: [
        { label:"Espèces",  value:"tabler-cash"          },
        { label:"Carte",    value:"tabler-credit-card"   },
        { label:"Chèque",   value:"tabler-writing"       },
        { label:"Mobile",   value:"tabler-device-mobile" },
        { label:"Ticket",   value:"tabler-ticket"        },
        { label:"Virement", value:"tabler-building-bank" },
        { label:"PayPal",   value:"tabler-brand-paypal"  },
      ],
      loadingHist: false,
      histPaiements: [],
      histPerPage: 25,

      // ── Comptabilité ──
      savingCompta: false,
      accountantSettingsId: null,
      compta: {
        emails:            [""],
        frequence:         "monthly",
        include_revenue:   true,
        include_sessions:  true,
        include_factures:  false,
      },

      emailErrors: [],

      snackVisible: false, snackMsg: "", snackColor: "success",

      histLoaded: false,

      // ── Documents configuration ──
      showDocDialog: false,
      savingDoc:     false,
      currentDoc:    null,
      docForm: {
        prefix:           "",
        start_number:     1,
        company_name:     "",
        address:          "",
        phone:            "",
        email:            "",
        footer_text:      "",
        validite_jours:   30,
        delai_paiement:   30,
        penalites:        "",
        show_logo:        true,
        show_tva:         true,
        show_signature:   false,
        show_qrcode:      false,
      },
      docConfigs: {},
    };
  },

  computed: {
    currentFranchiseName() {
      if (!this.franchiseId || !this.franchises.length) return 'Franchise';
      const f = this.franchises.find(f => f.id === this.franchiseId);
      return f ? (f.name || f.nom || `Franchise #${f.id}`) : 'Franchise';
    },
    docPreview() {
      if (!this.currentDoc) return "";
      const prefix = this.docForm.prefix || this.getDocPlaceholder(this.currentDoc.key, 'prefix');
      const year   = new Date().getFullYear();
      const num    = String(this.docForm.start_number || 1).padStart(4, "0");
      return `${prefix}-${year}-${num}`;
    },
  },

  watch: {
    activeTab(val) {
      if (val === 'paiements' && !this.histLoaded) {
        this.histLoaded = true;
        this.loadHistorique();
      }
    },
    histPerPage() {
      if (this.histLoaded) this.loadHistorique();
    },
  },

  mounted() {
    this.loadFranchisesAndPaiements();
  },

  methods: {
    token() { return useAuthStore().token; },

    async loadParam() {
      if (!this.franchiseId) return;
      try {
        const res = await axios.get(
          `${API()}/franchises/${this.franchiseId}/finance-settings`,
          { headers: hdrs(this.token()) }
        );
        const d = res.data.data ?? res.data;
        if (!d) return;
        if (d.siret)       this.param.siret          = d.siret;
        if (d.siren)       this.param.siren          = d.siren;
        if (d.tva_number)  this.param.numero_tva     = d.tva_number;
        if (d.tva_rates?.length) {
          this.param.taux_tva = d.tva_rates.map(r => ({
            id:     r.id,
            taux:   r.rate,
            label:  r.label,
            defaut: r.is_default,
            custom: false,
          }));
        }
      } catch { /* garder les valeurs par défaut */ }
    },

    async saveParam() {
      if (!this.franchiseId) {
        this.showSnack("Aucune franchise sélectionnée.", "error");
        return;
      }
      this.savingParam = true;
      try {
        const body = {
          siret:        this.param.siret          || undefined,
          siren:        this.param.siren          || undefined,
          vat_number:   this.param.numero_tva     || undefined,
          company_name: this.param.raison_sociale || undefined,
          vat_rates: this.param.taux_tva
            .filter(t => !t.custom)
            .map(t => ({
              id:         t.id,
              rate:       t.taux,
              label:      t.label,
              is_default: t.defaut,
            })),
        };
        const res = await axios.put(
          `${API()}/franchises/${this.franchiseId}/finance-settings`,
          body,
          { headers: hdrs(this.token()) }
        );
        const updated = res.data.data ?? res.data;
        if (updated?.tva_rates?.length) {
          this.param.taux_tva = updated.tva_rates.map(r => ({
            id:     r.id,
            taux:   r.rate,
            label:  r.label,
            defaut: r.is_default,
            custom: false,
          }));
        }
        this.showSnack("Paramètres enregistrés avec succès");
      } catch (err) {
        const msg = err?.response?.data?.message || "Erreur lors de l'enregistrement";
        this.showSnack(msg, "error");
      } finally {
        this.savingParam = false;
      }
    },

    async selectParamFranchise(id) {
      this.franchiseId = id;
      await this.loadParam();
    },

    openAddTva() { this.editingTva = null; this.tvaForm = { taux: "", label: "" }; this.showTvaDialog = true; },
    editTva(tva) { this.editingTva = tva; this.tvaForm = { taux: tva.taux, label: tva.label }; this.showTvaDialog = true; },

    async deleteTva(tva) {
      if (!confirm(`Supprimer le taux ${tva.taux}% ?`)) return;
      const backup = [...this.param.taux_tva];
      this.param.taux_tva = this.param.taux_tva.filter(t => t.id !== tva.id);
      try {
        await axios.delete(
          `${API()}/franchises/${this.franchiseId}/tva-rates/${tva.id}`,
          { headers: hdrs(this.token()) }
        );
        this.showSnack("Taux TVA supprimé.");
      } catch (err) {
        this.param.taux_tva = backup;
        const msg = err?.response?.data?.message || "Impossible de supprimer ce taux.";
        this.showSnack(msg, "error");
      }
    },

    async setTvaDefaut(tva) {
      const backup = this.param.taux_tva.map(t => ({ ...t }));
      this.param.taux_tva.forEach(t => { t.defaut = (t.id === tva.id); });
      try {
        await axios.patch(
          `${API()}/franchises/${this.franchiseId}/tva-rates/set-default`,
          { rate_id: tva.id },
          { headers: hdrs(this.token()) }
        );
      } catch {
        this.param.taux_tva = backup;
        this.showSnack("Impossible de définir le taux par défaut.", "error");
      }
    },

    async saveTva() {
      if (this.tvaForm.taux === "" || this.tvaForm.taux === null) return;
      try {
        if (this.editingTva) {
          const res = await axios.put(
            `${API()}/franchises/${this.franchiseId}/tva-rates/${this.editingTva.id}`,
            { rate: parseFloat(this.tvaForm.taux), label: this.tvaForm.label },
            { headers: hdrs(this.token()) }
          );
          const updated = res.data.data ?? res.data;
          const t = this.param.taux_tva.find(t => t.id === this.editingTva.id);
          if (t) { t.taux = updated.rate ?? parseFloat(this.tvaForm.taux); t.label = updated.label ?? this.tvaForm.label; }
          this.showSnack("Taux TVA modifié.");
        } else {
          this.param.taux_tva.push({
            id: this.nextTvaId++,
            taux: parseFloat(this.tvaForm.taux),
            label: this.tvaForm.label,
            defaut: false,
            custom: true,
          });
        }
      } catch (err) {
        const msg = err?.response?.data?.message || "Erreur lors de l'enregistrement.";
        this.showSnack(msg, "error");
      }
      this.showTvaDialog = false;
    },

    // ── Franchises & Paiements ──
    async loadFranchisesAndPaiements() {
      try {
        const r = await axios.get(`${API()}/franchises/`, {
          headers: hdrs(this.token()),
          params: { per_page: 50 },
        });
        this.franchises = r.data.data || r.data || [];
        if (this.franchises.length > 0) {
          this.franchiseId = this.franchises[0].id;
          await Promise.all([
            this.loadParam(),
            this.loadPaiements(),
            this.loadComptaSettings(),
          ]);
        }
      } catch { /* silent */ }
    },

    async loadComptaSettings() {
      if (!this.franchiseId) return;
      try {
        const r = await axios.get(
          `${API()}/franchises/${this.franchiseId}/accountant-settings`,
          { headers: hdrs(this.token()) }
        );
        const d = r.data.data || r.data;
        if (d && d.id) {
          this.accountantSettingsId = d.id;
          this.compta = {
            emails:           Array.isArray(d.emails) && d.emails.length ? d.emails : [""],
            frequence:        d.sending_frequency || "monthly",
            include_revenue:  d.total_revenue  !== undefined ? d.total_revenue  : true,
            include_sessions: d.pos_sessions   !== undefined ? d.pos_sessions   : true,
            include_factures: d.invoices       !== undefined ? d.invoices       : false,
          };
          this.emailErrors = [];
        }
      } catch { /* garder les valeurs par défaut */ }
    },

    async loadPaiements() {
      if (!this.franchiseId) return;
      this.loadingPaiements = true;
      try {
        const r = await axios.get(
          `${API()}/franchises/${this.franchiseId}/payment-methods`,
          { headers: hdrs(this.token()) }
        );
        const raw = r.data.data || r.data || [];
        this.paiements = raw.map(m => ({
          ...m,
          actif: m.is_active,
          icon:  this.getPaymentIcon(m.name),
        }));
      } catch { this.paiements = []; }
      finally { this.loadingPaiements = false; }
    },

    getPaymentIcon(name) {
      const n = (name || "").toLowerCase();
      if (n.includes("espèce") || n.includes("cash"))       return "tabler-cash";
      if (n.includes("carte") || n.includes("cb"))          return "tabler-credit-card";
      if (n.includes("chèque") || n.includes("cheque"))     return "tabler-writing";
      if (n.includes("mobile") || n.includes("phone"))      return "tabler-device-mobile";
      if (n.includes("vacance") || n.includes("ticket"))    return "tabler-ticket";
      if (n.includes("virement") || n.includes("bank"))     return "tabler-building-bank";
      if (n.includes("paypal"))                              return "tabler-brand-paypal";
      if (n.includes("adyen") || n.includes("terminal"))    return "tabler-device-mobile";
      return "tabler-credit-card";
    },

    openAddPaiement() {
      if (!this.franchiseId) {
        this.showSnack("Aucune franchise disponible. Créez une franchise d'abord.", "error");
        return;
      }
      this.editingPaiement = null;
      this.paiementForm = { name: "", description: "", icon: "tabler-cash" };
      this.showPaiementDialog = true;
    },

    editPaiement(m) {
      this.editingPaiement = m;
      this.paiementForm = { name: m.name, description: m.description || "", icon: m.icon };
      this.showPaiementDialog = true;
    },

    async deletePaiement(m) {
      if (!confirm(`Supprimer "${m.name}" ?`)) return;
      try {
        await axios.delete(
          `${API()}/franchises/${this.franchiseId}/payment-methods/${m.id}`,
          { headers: hdrs(this.token()) }
        );
        this.paiements = this.paiements.filter(p => p.id !== m.id);
        this.showSnack(`"${m.name}" supprimé.`);
      } catch {
        this.showSnack("Impossible de supprimer ce mode de paiement.", "error");
      }
    },

    async togglePaiement(m) {
      const previousState = m.actif;
      try {
        const r = await axios.patch(
          `${API()}/franchises/${this.franchiseId}/payment-methods/${m.id}/change-status`,
          {},
          { headers: hdrs(this.token()) }
        );
        m.is_active = r.data?.data?.is_active ?? !previousState;
        m.actif     = m.is_active;
      } catch {
        // Revert on error
        m.actif = previousState;
        this.showSnack("Impossible de changer le statut.", "error");
      }
    },

    async savePaiement() {
      if (!this.paiementForm.name.trim()) return;
      this.savingPaiement = true;
      try {
        const body = {
          name:        this.paiementForm.name.trim(),
          description: this.paiementForm.description || "",
          is_active:   true,
        };
        if (this.editingPaiement) {
          const r = await axios.put(
            `${API()}/franchises/${this.franchiseId}/payment-methods/${this.editingPaiement.id}`,
            body,
            { headers: hdrs(this.token()) }
          );
          const updated = r.data?.data || r.data;
          const idx = this.paiements.findIndex(p => p.id === this.editingPaiement.id);
          if (idx !== -1) {
            this.paiements[idx] = {
              ...updated,
              actif: updated.is_active,
              icon:  this.getPaymentIcon(updated.name),
            };
          }
          this.showSnack("Mode de paiement mis à jour.");
        } else {
          const r = await axios.post(
            `${API()}/franchises/${this.franchiseId}/payment-methods`,
            body,
            { headers: hdrs(this.token()) }
          );
          const created = r.data?.data || r.data;
          this.paiements.push({
            ...created,
            actif: created.is_active,
            icon:  this.getPaymentIcon(created.name),
          });
          this.showSnack("Mode de paiement ajouté avec succès.");
        }
        this.showPaiementDialog = false;
      } catch (err) {
        const msg = err?.response?.data?.message || "Erreur lors de l'enregistrement.";
        this.showSnack(msg, "error");
      } finally {
        this.savingPaiement = false;
      }
    },

    async loadHistorique() {
      this.loadingHist = true;
      try {
        const res = await axios.get(`${API()}/payments-history`, { params: { per_page: this.histPerPage }, headers: hdrs(this.token()) });
        const raw = res.data.data || res.data || [];
        this.histPaiements = Array.isArray(raw) ? raw.slice(0, 100) : [];
      } catch { this.histPaiements = []; }
      finally { this.loadingHist = false; }
    },

    async saveCompta() {
      // Validate all emails before sending
      this.emailErrors = this.compta.emails.map(e => this.validateEmail(e));
      if (this.emailErrors.some(err => err !== "")) {
        this.showSnack("Veuillez corriger les adresses email invalides.", "error");
        return;
      }

      if (!this.franchiseId) {
        this.savingCompta = true;
        await this.loadFranchisesAndPaiements();
        if (!this.franchiseId) {
          this.showSnack("Impossible de récupérer la franchise. Rechargez la page.", "error");
          this.savingCompta = false;
          return;
        }
      }
      this.savingCompta = true;
      try {
        const body = {
          emails:            this.compta.emails.filter(e => e.trim() !== ""),
          sending_frequency: this.compta.frequence,
          total_revenue:     this.compta.include_revenue,
          pos_sessions:      this.compta.include_sessions,
          invoices:          this.compta.include_factures,
        };
        const r = await axios.put(
          `${API()}/franchises/${this.franchiseId}/accountant-settings`,
          body,
          { headers: hdrs(this.token()) }
        );
        const d = r.data?.data ?? r.data;
        if (d?.id) this.accountantSettingsId = d.id;
        this.showSnack("Configuration comptable enregistrée avec succès !");
      } catch (err) {
        const msg = err?.response?.data?.message || "Erreur lors de l'enregistrement.";
        this.showSnack(msg, "error");
      } finally {
        this.savingCompta = false;
      }
    },

    validateEmail(email) {
      if (!email || !email.trim()) return "";
      const trimmed = email.trim();
      if (!trimmed.includes("@")) return "L'adresse doit contenir @.";
      const parts = trimmed.split("@");
      if (parts.length !== 2 || !parts[0] || !parts[1]) return "Format invalide (ex: nom@domaine.com).";
      if (!parts[1].includes(".")) return "Le domaine doit contenir un point (ex: .com).";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) return "Format d'email invalide.";
      return "";
    },
    validateEmailField(idx) {
      const errors = [...(this.emailErrors || [])];
      errors[idx] = this.validateEmail(this.compta.emails[idx]);
      this.emailErrors = errors;
    },
    clearEmailError(idx) {
      const errors = [...(this.emailErrors || [])];
      errors[idx] = "";
      this.emailErrors = errors;
    },
    addEmail() {
      this.compta.emails.push("");
      this.emailErrors = [...(this.emailErrors || []), ""];
    },
    removeEmail(idx) {
      this.compta.emails.splice(idx, 1);
      const errors = [...(this.emailErrors || [])];
      errors.splice(idx, 1);
      this.emailErrors = errors;
    },

    fmtDate(d) { return d ? new Date(d).toLocaleDateString("fr-FR") : "—"; },
    showSnack(msg,color="success") { this.snackMsg=msg; this.snackColor=color; this.snackVisible=true; },

    // ── Documents configuration ──
    getDocPlaceholder(key, field) {
      const prefixes = {
        devis:     { prefix: "DEV", },
        facture:   { prefix: "FAC", },
        commande:  { prefix: "BC",  },
        livraison: { prefix: "BL",  },
      };
      return field === 'prefix' ? (prefixes[key]?.prefix || "DOC") : "1";
    },

    openDocConfig(doc) {
      this.currentDoc = doc;
      // Load saved config for this document, or use defaults
      const saved = this.docConfigs[doc.key] || {};
      this.docForm = {
        prefix:         saved.prefix         || this.getDocPlaceholder(doc.key, 'prefix'),
        start_number:   saved.start_number   || 1,
        company_name:   saved.company_name   || this.param.raison_sociale || "",
        address:        saved.address        || "",
        phone:          saved.phone          || "",
        email:          saved.email          || "",
        footer_text:    saved.footer_text    || "",
        validite_jours: saved.validite_jours || 30,
        delai_paiement: saved.delai_paiement || 30,
        penalites:      saved.penalites      || "Pénalité de 3 fois le taux légal en cas de retard",
        show_logo:      saved.show_logo      !== undefined ? saved.show_logo      : true,
        show_tva:       saved.show_tva       !== undefined ? saved.show_tva       : true,
        show_signature: saved.show_signature !== undefined ? saved.show_signature : false,
        show_qrcode:    saved.show_qrcode    !== undefined ? saved.show_qrcode    : false,
      };
      this.showDocDialog = true;
    },

    async saveDocConfig() {
      if (!this.currentDoc) return;
      this.savingDoc = true;
      try {
        const payload = {
          document_type: this.currentDoc.key,
          config:        { ...this.docForm },
        };
        await axios.post(
          `${API()}/financial-settings/document`,
          payload,
          { headers: hdrs(this.token()) }
        );
        // Save locally regardless of backend result
        this.docConfigs[this.currentDoc.key] = { ...this.docForm };
        this.showSnack(`Configuration "${this.currentDoc.label}" enregistrée avec succès`);
        this.showDocDialog = false;
      } catch {
        // Backend might not have this endpoint yet — save locally
        this.docConfigs[this.currentDoc.key] = { ...this.docForm };
        this.showSnack(`Configuration "${this.currentDoc.label}" enregistrée localement`);
        this.showDocDialog = false;
      } finally {
        this.savingDoc = false;
      }
    },
  },
};
</script>

<style scoped>
.pf-title { font-size:22px; font-weight:800; color:#1a1a2e; margin:0; }
.pf-sub   { font-size:13px; color:#9e9e9e; margin:0; }

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

.pf-section-title { display:flex; align-items:center; font-weight:700; font-size:15px; color:#1a1a2e; }
.pf-modal-title   { font-weight:700; font-size:15px; color:#1a1a2e; }
.pf-label         { font-size:12px; font-weight:600; color:#555; margin-bottom:4px; }

.pf-tva-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(120px,1fr)); gap:10px; }
.pf-tva-card { border:1.5px solid #e0e0e0; border-radius:10px; padding:14px; background:#fff; transition:all .2s; }
.pf-tva-card--active { border-color:#1a1a2e; background:#f7f8ff; }
.pf-tva-val  { font-size:22px; font-weight:800; color:#1a1a2e; }
.pf-tva-label{ font-size:11px; color:#9e9e9e; margin-top:4px; }
.pf-tva-add  { border:2px dashed #E8A838; border-radius:10px; padding:14px; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; min-height:78px; }
.pf-chip-btn { font-size:10px; background:#f0f0f0; border:none; border-radius:4px; padding:2px 6px; cursor:pointer; }

.pf-pay-card  { border:1.5px solid #e0e0e0; border-radius:12px; padding:16px; transition:all .2s; }
.pf-pay-card--active  { border-color:#1a1a2e; }
.pf-pay-card--inactive{ opacity:.6; }
.pf-pay-icon { width:44px; height:44px; border-radius:10px; background:#f5f5f5; display:flex; align-items:center; justify-content:center; }
.pf-pay-name { font-weight:700; font-size:13px; color:#1a1a2e; }
.pf-pay-desc { font-size:11px; color:#9e9e9e; }

.pf-doc-card { border:1px solid #f0f0f0; border-radius:10px; padding:14px; }
.pf-doc-icon { width:40px; height:40px; border-radius:8px; background:#f5f5f5; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.pf-doc-name { font-weight:700; font-size:13px; color:#1a1a2e; }
.pf-doc-desc { font-size:11px; color:#9e9e9e; }
.pf-edit-btn { display:flex; align-items:center; gap:4px; padding:6px 12px; border-radius:8px; border:1.5px solid #1a1a2e; background:transparent; color:#1a1a2e; font-size:12px; font-weight:600; cursor:pointer; white-space:nowrap; }
.pf-edit-btn:hover { background:#1a1a2e; color:#fff; }

.pf-icon-btn        { padding:4px 6px; border-radius:6px; border:1px solid #e0e0e0; background:#fff; cursor:pointer; }
.pf-icon-btn--danger{ color:#e53935; border-color:#fecdd2; }

.btn-confirm {
  background: #E8A838 !important;
  color: #1a1a2e !important;
  border-radius: 8px !important;
}
.btn-confirm :deep(.v-btn__content) { color: #1a1a2e !important; }

.btn-annuler {
  border-color: #1a1a2e !important;
  color: #fff !important;
  background: #374151 !important;
  border-radius: 8px !important;
}
.btn-annuler :deep(.v-btn__content) { color: #fff !important; }
</style>
