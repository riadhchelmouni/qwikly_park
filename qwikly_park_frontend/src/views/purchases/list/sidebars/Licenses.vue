<template>
  <VNavigationDrawer
    temporary
    :width="600"
    location="end"
    class="scrollable-content"
    :model-value="isOpen"
    @update:model-value="(val) => $emit('update:isOpen', val)"
  >
    <AppDrawerHeaderSection title="Licenses" @cancel="close" />
    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat v-if="current">
        <VCardText
          class="d-flex flex-column licenses"
          v-if="current.licenses.length"
        >
          <VCard
            variant="tonal"
            v-for="(license, index) in current.licenses"
            :key="index"
          >
            <VCardText class="pb-5">
              <VRow>
                <VCol cols="12">
                  <div class="d-flex">
                    <h6 class="text-base mb-2 me-4">{{ license.key }}</h6>

                    <v-chip
                      :color="license.status === 'active' ? 'success' : 'error'"
                      class="text-capitalize"
                      >{{ license.status }}</v-chip
                    >
                  </div>
                  <h6 class="text-base mb-2 me-4">{{ license.price }} DA</h6>
                </VCol>
              </VRow>
              <VRow>
                <VCol cols="12" md="6">
                  <VListItem class="py-0 px-0">
                    <VListItemTitle class="font-weight-bold">{{
                      license.started_at
                    }}</VListItemTitle>
                    <v-list-item-subtitle>Commencé à</v-list-item-subtitle>
                  </VListItem>
                </VCol>

                <VCol cols="12" md="6">
                  <VListItem class="py-0 px-0">
                    <VListItemTitle class="font-weight-bold">{{
                      license.expires_at ? license.expires_at : "À vie"
                    }}</VListItemTitle>
                    <v-list-item-subtitle>Expire à</v-list-item-subtitle>
                  </VListItem>
                </VCol>
              </VRow>

              <div
                class="d-flex flex-column flex-md-row align-center justify-end mt-2"
                v-if="$can('licenses-update')"
              >
                <div class="d-flex align-center justify-space-between">
                  <VBtn
                    variant="text"
                    color="success"
                    prepend-icon="tabler-check"
                    @click="openChangeStatusDialog(license.id)"
                    v-if="
                      license.status === 'inactive' &&
                      checkDate(license.expires_at)
                    "
                    >Activer</VBtn
                  >
                  <VBtn
                    variant="text"
                    color="error"
                    prepend-icon="tabler-circle-x"
                    @click="openChangeStatusDialog(license.id)"
                    v-if="
                      license.status === 'active' &&
                      checkDate(license.expires_at)
                    "
                    >Désactiver</VBtn
                  >
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCardText>
        <VCardText v-else class="text-center" cols="12"
          >Pas de données disponibles</VCardText
        >

        <VCardText v-if="$can('licenses-add') && canAddLicense">
          <VRow>
            <VCol cols="12">
              <VBtn @click="openAddLicenseDialog"
                >Créer une nouvelle license</VBtn
              >
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </PerfectScrollbar>
  </VNavigationDrawer>

  <VDialog
    v-model="addLicenseDialog"
    class="v-dialog-sm"
    v-if="$can('licenses-add')"
  >
    <VCard title="Confirmez la création d'une nouvelle licence">
      <VCardText>Voulez-vous vraiment créer une nouvelle license ?</VCardText>

      <VCardText class="d-flex justify-end gap-3 flex-wrap">
        <VBtn
          color="secondary"
          variant="tonal"
          @click="addLicenseDialog = false"
          >Annuler</VBtn
        >
        <VBtn @click="confirmAddLicense" :loading="addingLicense"
          >Confirmer</VBtn
        >
      </VCardText>
    </VCard>
  </VDialog>

  <VDialog
    v-model="changeStatusDialog"
    class="v-dialog-sm"
    v-if="$can('licenses-update')"
  >
    <VCard title="Confirmer le changement de statut">
      <VCardText
        >Voulez-vous vraiment changer l'état de cet élément ?</VCardText
      >

      <VCardText class="d-flex justify-end gap-3 flex-wrap">
        <VBtn
          color="secondary"
          variant="tonal"
          @click="changeStatusDialog = false"
          >Annuler</VBtn
        >
        <VBtn @click="confirmChangeStatus" :loading="changingStatus"
          >Confirmer</VBtn
        >
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
</template>

<script>
import axios from "axios";
import { useAuthStore } from "@/store/auth";

import { PerfectScrollbar } from "vue3-perfect-scrollbar";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

export default {
  emits: ["update:isOpen"],

  setup() {
    return {
      authStore: useAuthStore(),
    };
  },

  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },

    current: {
      type: Object,
    },
  },

  components: { PerfectScrollbar },

  computed: {
    canAddLicense() {
      return (
        this.current.licenses.length === 0 ||
        (this.current.licenses[this.current.licenses.length - 1].expires_at &&
          dayjs().isAfter(
            dayjs(
              this.current.licenses[this.current.licenses.length - 1].expires_at,
              "DD/MM/YYYY",
              true
            )
          ))
      );
    },
  },

  data() {
    return {
      statusOptions: [
        {
          label: "Actif",
          value: true,
        },
        {
          label: "Inactif",
          value: false,
        },
      ],

      addLicenseDialog: false,
      changeStatusDialog: false,
      currentIndex: null,

      addingLicense: false,
      changingStatus: false,

      isSnackbarVisible: false,
      snackBarDetails: {
        message: "",
        color: "",
      },
    };
  },

  methods: {
    close() {
      this.$emit("update:isOpen", false);
    },

    checkDate(date) {
      return !date || dayjs().isBefore(dayjs(date, "DD/MM/YYYY", true));
    },

    openAddLicenseDialog() {
      this.addLicenseDialog = true;
    },

    confirmAddLicense() {
      this.addingLicense = true;
      new Promise((resolve, reject) => {
        axios
          .post(
            `${import.meta.env.VITE_BASE_URL}/purchases/${
              this.current.id
            }/licenses/add`,
            {},
            {
              headers: {
                Authorization: "Bearer " + this.authStore.token,
                "X-Authorization": import.meta.env.VITE_API_KEY,
              },
            }
          )
          .then((res) => {
            this.busEmit("add-license", res.data.license);
            this.showSnackbar({
              message: "License renouvelé avec succès",
              color: "success",
            });
            this.addingLicense = false;
            this.addLicenseDialog = false;
            resolve(res);
          })
          .catch((err) => {
            this.showSnackbar({
              message: "Impossible de renouveler la license",
              color: "error",
            });
            this.addingLicense = false;
            this.addLicenseDialog = false;
            reject(err);
          });
      });
    },

    openChangeStatusDialog(index) {
      this.currentIndex = index;
      this.changeStatusDialog = true;
    },

    confirmChangeStatus() {
      this.changingStatus = true;
      new Promise((resolve, reject) => {
        axios
          .patch(
            `${import.meta.env.VITE_BASE_URL}/purchases/${
              this.current.id
            }/licenses/${this.currentIndex}/change-status`,
            {},
            {
              headers: {
                Authorization: "Bearer " + this.authStore.token,
                "X-Authorization": import.meta.env.VITE_API_KEY,
              },
            }
          )
          .then((res) => {
            this.busEmit("update-purchase", res.data.purchase);
            this.currentIndex = null;
            this.showSnackbar({
              message: "Le statut de la license a bien été changé",
              color: "success",
            });
            this.changingStatus = false;
            this.changeStatusDialog = false;
            this.$emit("update:isOpen", false);
            resolve(res);
          })
          .catch((err) => {
            this.currentIndex = null;
            this.showSnackbar({
              message: "Impossible de changer l'état de la license",
              color: "error",
            });
            this.changingStatus = false;
            this.changeStatusDialog = false;
            reject(err);
          });
      });
    },

    showSnackbar({ message, color }) {
      this.isSnackbarVisible = true;
      this.snackBarDetails.message = message;
      this.snackBarDetails.color = color;
    },
  },
};
</script>

<style scoped>
.licenses {
  gap: 16px;
}
</style>
