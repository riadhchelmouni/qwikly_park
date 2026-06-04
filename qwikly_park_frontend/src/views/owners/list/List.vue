<template>
  <div>
    <VCard>
      <VCardText>
        <VDataTableServer
          class="text-no-wrap"
          :items-length="total"
          :headers="headers"
          :items="owners"
          :loading="isLoading"
        >
          <template v-slot:top>
            <VRow>
              <VCol cols="12" sm="6" md="4" v-if="$can('owners-add')">
                <VBtn variant="flat" block @click="addSideBar = true"
                  >Ajouter un élément</VBtn
                >
              </VCol>
              <VCol cols="12" sm="6" md="4">
                <VBtn variant="flat" block @click="getOwners">Actualiser</VBtn>
              </VCol>
              <VCol
                v-if="!$can('owners-add')"
                md="4"
                class="d-none d-md-block"
              ></VCol>
              <VCol cols="12" sm="6" md="4">
                <AppTextField
                  v-model="searchQuery"
                  placeholder="Recherche"
                  append-inner-icon="tabler-search"
                  single-line
                  hide-details
                  outlined
                  clearable
                  @click:clear="searchQuery = ''"
                />
              </VCol>
            </VRow>
          </template>

          <template v-slot:no-data>
            <span>Pas de données disponibles</span>
          </template>

          <template v-slot:loading>
            <span>Chargement des données</span>
          </template>

          <template v-slot:headers="{ columns }">
            <tr>
              <template v-for="column in columns" :key="column.key">
                <td>
                  <span class="font-weight-bold">{{ column.title }}</span>
                </td>
              </template>
            </tr>
          </template>

          <template v-slot:item.image="{ item }">
            <VImg
              :src="item.user.image ? item.user.image : placeholder"
              aspect-ratio="1"
              :width="60"
              cover
              class="rounded-circle my-2"
            />
          </template>

          <template v-slot:item.name="{ item }">{{
            item.user.firstname + " " + item.user.lastname
          }}</template>
          <template v-slot:item.company="{ item }">{{
            item.company ? item.company : "Non spécifié"
          }}</template>

          <template v-slot:item.status="{ item }">
            <v-chip :color="getColor(item.status)" class="text-capitalize">{{
              getStatus(item.status)
            }}</v-chip>
          </template>

          <template #item.actions="{ item, index }">
            <IconBtn color="info" @click="openDetailsSidebar(item)">
              <VIcon icon="tabler-eye" />
              <VTooltip activator="parent" location="top"
                >Détails de l'élément</VTooltip
              >
            </IconBtn>

            <IconBtn
              color="success"
              @click="openEditSidebar(item, index)"
              v-if="$can('owners-update')"
            >
              <VIcon icon="tabler-edit" />
              <VTooltip activator="parent" location="top"
                >Mettre à jour l'élément</VTooltip
              >
            </IconBtn>

            <VBtn
              icon
              variant="text"
              size="small"
              color="medium-emphasis"
              v-if="
                ($can('owners-change-status') || $can('owners-update')) &&
                checkInformation(item)
              "
            >
              <VIcon size="24" icon="tabler-dots-vertical" />

              <VMenu activator="parent">
                <VList>
                  <VListItem
                    @click="openApproveDialog(item.id)"
                    :disabled="item.status === 'approved'"
                    v-if="$can('owners-change-status')"
                  >
                    <template #prepend>
                      <VIcon icon="tabler-user-check" />
                    </template>
                    <VListItemTitle>Approuver</VListItemTitle>
                  </VListItem>

                  <VListItem
                    @click="openRefuseDialog(item.id)"
                    :disabled="item.status === 'refused'"
                    v-if="$can('owners-change-status')"
                  >
                    <template #prepend>
                      <VIcon icon="tabler-user-cancel" />
                    </template>
                    <VListItemTitle>Refuser</VListItemTitle>
                  </VListItem>

                  <VListItem
                    @click="openEnableSmsDialog(item.id)"
                    :disabled="item.sms || item.status !== 'approved'"
                    v-if="$can('owners-update')"
                  >
                    <template #prepend>
                      <VIcon icon="tabler-user-check" />
                    </template>
                    <VListItemTitle>Activer réception des SMS</VListItemTitle>
                  </VListItem>

                  <VListItem
                    @click="openDisableSmsDialog(item.id)"
                    :disabled="!item.sms || item.status !== 'approved'"
                    v-if="$can('owners-update')"
                  >
                    <template #prepend>
                      <VIcon icon="tabler-user-cancel" />
                    </template>
                    <VListItemTitle
                      >Désactiver réception des SMS</VListItemTitle
                    >
                  </VListItem>
                </VList>
              </VMenu>
            </VBtn>
          </template>

          <template #bottom>
            <VRow class="pt-2" justify="end" align="center">
              <VCol lg="2" cols="3" />
              <VCol ms="auto" cols="auto" class="d-flex align-center justify-center gap-3">
                <VPagination
                v-model="page"
                total-visible="3"
                size="small"
                :length="Math.ceil(total / perPage)"
                class="flex-shrink-0"
                />
                <AppSelect
                  v-model="perPage"
                  :items="[
                    { value: 5, title: '5' },
                    { value: 10, title: '10' },
                    { value: 25, title: '25' },
                    { value: 50, title: '50' },
                    ]"
                    style="min-width: 4.7rem; max-width: 6rem"
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

    <AddSidebar v-model:isOpen="addSideBar" v-if="$can('owners-add')" />

    <EditSidebar
      v-model:isOpen="editSideBar"
      :current="current"
      v-if="$can('owners-update')"
    />

    <DetailsSidebar v-model:isOpen="detailsSideBar" :current="current" />

    <VDialog
      v-model="approveDialog"
      class="v-dialog-sm"
      v-if="$can('owners-change-status')"
    >
      <VCard title="Confirmer l'approbation du propriétaire">
        <VCardText>Voulez-vous vraiment approuver ce propriétaire ?</VCardText>

        <VCardText class="d-flex justify-end gap-3 flex-wrap">
          <VBtn color="secondary" variant="tonal" @click="approveDialog = false"
            >Annuler</VBtn
          >
          <VBtn @click="confirmApprove">Confirmer</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <VDialog
      v-model="refuseDialog"
      class="v-dialog-sm"
      v-if="$can('owners-change-status')"
    >
      <VCard title="Confirmer le refus du propriétaire">
        <VCardText>Voulez-vous vraiment refuser ce propriétaire ?</VCardText>

        <VCardText class="d-flex justify-end gap-3 flex-wrap">
          <VBtn color="secondary" variant="tonal" @click="refuseDialog = false"
            >Annuler</VBtn
          >
          <VBtn @click="confirmRefuse">Confirmer</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <VDialog
      v-model="enableSmsDialog"
      class="v-dialog-sm"
      v-if="$can('owners-change-status')"
    >
      <VCard title="Confirmez l'activation de la réception de rappels par SMS">
        <VCardText
          >Voulez-vous vraiment activer la réception de rappels par SMS
          ?</VCardText
        >

        <VCardText class="d-flex justify-end gap-3 flex-wrap">
          <VBtn
            color="secondary"
            variant="tonal"
            @click="enableSmsDialog = false"
            >Annuler</VBtn
          >
          <VBtn @click="confirmEnableSms">Confirmer</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <VDialog
      v-model="disableSmsDialog"
      class="v-dialog-sm"
      v-if="$can('owners-change-status')"
    >
      <VCard
        title="Confirmez la désactivation de la réception de rappels par SMS"
      >
        <VCardText
          >Voulez-vous vraiment désactiver la réception de rappels par SMS
          ?</VCardText
        >

        <VCardText class="d-flex justify-end gap-3 flex-wrap">
          <VBtn
            color="secondary"
            variant="tonal"
            @click="disableSmsDialog = false"
            >Annuler</VBtn
          >
          <VBtn @click="confirmDisableSms">Confirmer</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <VSnackbar
      v-model="isSnackbarVisible"
      location="bottom end"
      variant="flat"
      :color="snackBarDetails.color"
      >{{ snackBarDetails.message }}</VSnackbar
    >
  </div>
</template>

<script>
import { $api } from "@/utils/api";

import debounce from "lodash/debounce";

import { VDataTableServer } from "vuetify/labs/VDataTable";

import AddSidebar from "./sidebars/Add.vue";
import EditSidebar from "./sidebars/Edit.vue";
import DetailsSidebar from "./sidebars/Details.vue";

import placeholder from "@images/placeholders/user.svg";

export default {
  setup() {
    return { placeholder };
  },

  components: {
    VDataTableServer,
    DetailsSidebar,
    AddSidebar,
    EditSidebar,
  },

  data() {
    return {
      headers: [
        {
          title: "Image",
          key: "image",
          sortable: false,
        },
        {
          title: "Nom",
          key: "name",
          sortable: false,
        },
        {
          title: "Entreprise",
          key: "company",
          sortable: false,
        },
        {
          title: "Adresse e-mail",
          key: "user.email",
          sortable: false,
        },
        {
          title: "Numéro de téléphone",
          key: "user.phone",
          sortable: false,
        },
        {
          title: "Employés",
          key: "employees_count",
          sortable: false,
        },
        {
          title: "Statut",
          key: "status",
          sortable: false,
        },
        {
          title: "Actions",
          key: "actions",
          sortable: false,
        },
      ],

      owners: [],

      searchQuery: "",
      total: 10,
      page: 1,
      perPage: 5,
      isLoading: true,

      approveDialog: false,
      refuseDialog: false,
      enableSmsDialog: false,
      disableSmsDialog: false,

      detailsSideBar: false,
      addSideBar: false,
      editSideBar: false,

      current: null,
      currentIndex: null,

      isSnackbarVisible: false,
      snackBarDetails: {
        message: "",
        color: "",
      },
    };
  },

  watch: {
    searchQuery() {
      this.debouncedSearch();
    },

    perPage(val) {
      this.page = 1;
      this.getOwners();
    },

    page() {
      this.getOwners();
    },
  },

  created() {
    this.debouncedSearch = debounce(() => {
      this.getOwners();
    }, 500);
  },

  beforeUnmount() {
    this.debouncedSearch.cancel();
  },

  async mounted() {
    await this.getOwners();
    this.busOn("add-item", this.addItem);
    this.busOn("update-item", this.editItem);
  },

  methods: {
    getColor(status) {
      switch (status) {
        case "refused":
          return "error";
        case "waiting":
          return "warning";
        case "approved":
          return "success";
      }
    },

    getStatus(status) {
      switch (status) {
        case "refused":
          return "refusé";
        case "waiting":
          return "en attente";
        case "approved":
          return "approuvé";
      }
    },

    async getOwners() {
      this.isLoading = true;
      try {
        const res = await $api("/owners", {
          params: {
            page: this.page,
            per_page: this.perPage,
            keyword: this.searchQuery.length >= 3 ? this.searchQuery : "",
          },
        });
        this.owners = res.data;
        this.total = res.total;
      } catch {
        this.showSnackbar({ message: "Impossible de récupérer les données", color: "error" });
      } finally {
        this.isLoading = false;
      }
    },

    checkInformation(item) {
      return item.company && item.company_id;
    },

    openApproveDialog(index) { this.currentIndex = index; this.approveDialog = true; },
    openRefuseDialog(index) { this.currentIndex = index; this.refuseDialog = true; },
    openEnableSmsDialog(index) { this.currentIndex = index; this.enableSmsDialog = true; },
    openDisableSmsDialog(index) { this.currentIndex = index; this.disableSmsDialog = true; },

    async _patchOwner(endpoint, successMsg, errorMsg) {
      this.isLoading = true;
      try {
        const res = await $api(`/owners/${this.currentIndex}/${endpoint}`, { method: "PATCH" });
        const index = this.owners.findIndex(o => o.id === this.currentIndex);
        this.owners[index] = res.owner;
        this.showSnackbar({ message: successMsg, color: "success" });
      } catch {
        this.showSnackbar({ message: errorMsg, color: "error" });
      } finally {
        this.currentIndex = null;
        this.isLoading = false;
      }
    },

    confirmApprove() {
      this.approveDialog = false;
      this._patchOwner("approve", "Propriétaire approuvé avec succès", "Impossible d'approuver le propriétaire");
    },
    confirmRefuse() {
      this.refuseDialog = false;
      this._patchOwner("refuse", "Propriétaire refusé avec succès", "Impossible de refuser le propriétaire");
    },
    confirmEnableSms() {
      this.enableSmsDialog = false;
      this._patchOwner("enable-sms", "Réception des rappels par SMS activé avec succès", "Impossible d'activer la réception de rappels par SMS");
    },
    confirmDisableSms() {
      this.disableSmsDialog = false;
      this._patchOwner("disable-sms", "Réception des rappels par SMS désactivé avec succès", "Impossible de désactiver la réception de rappels par SMS");
    },

    openDetailsSidebar(seller) {
      this.current = seller;
      this.detailsSideBar = true;
    },

    openEditSidebar(owner, index) {
      this.currentIndex = index;
      this.current = owner;
      this.editSideBar = true;
    },

    addItem(owner) {
      this.owners.unshift(owner);
    },

    editItem(owner) {
      this.owners[this.currentIndex] = { ...owner };
    },

    showSnackbar({ message, color }) {
      this.isSnackbarVisible = true;
      this.snackBarDetails.message = message;
      this.snackBarDetails.color = color;
    },
  },
};
</script>
