<template>
  <div>
    <VRow>
      <VCol cols="12" sm="12" :md="ads.length > 0 && $can('ads-update') ? 9 : 12">
        <VCard>
          <VCardText>
            <VDataTableServer
              class="text-no-wrap"
              :items-length="ads.length"
              :headers="headers"
              :items="ads"
              :loading="isLoading"
            >
              <template v-slot:top>
                <VRow>
                  <VCol class="top" cols="12" sm="6" md="3" v-if="$can('ads-add')">
                    <VBtn variant="flat" block @click="addSideBar = true">Ajouter un élément</VBtn>
                  </VCol>

                  <VCol class="pb-0 top" cols="12" sm="6" :md="$can('ads-add') ? 3: 4">
                    <AppSelect
                      v-model="app"
                      color="info"
                      :items="appOptions"
                      item-title="label"
                      item-value="value"
                      clearable
                      placeholder="Application"
                    >
                      <template v-slot:selection="{ item }">
                        <span class="text-capitalize">
                          {{
                          item.raw.label
                          }}
                        </span>
                      </template>
                      <template v-slot:item="{ item, props }">
                        <VListItem v-bind="props">
                          <template v-slot:title>
                            <span class="text-capitalize">
                              {{
                              item.raw.label
                              }}
                            </span>
                          </template>
                        </VListItem>
                      </template>
                    </AppSelect>
                  </VCol>

                  <VCol class="pb-0 top" cols="12" sm="6" :md="$can('ads-add') ? 3: 4">
                    <AppSelect
                      v-model="location"
                      color="info"
                      :items="locationOptions"
                      clearable
                      item-title="label"
                      item-value="value"
                      placeholder="Emplacement"
                      :disabled="!app"
                    >
                      <template v-slot:selection="{ item }">
                        <span class="text-capitalize">
                          {{
                          item.raw.label
                          }}
                        </span>
                      </template>
                      <template v-slot:item="{ item, props }">
                        <VListItem v-bind="props">
                          <template v-slot:title>
                            <span class="text-capitalize">
                              {{
                              item.raw.label
                              }}
                            </span>
                          </template>
                        </VListItem>
                      </template>
                    </AppSelect>
                  </VCol>

                  <VCol class="top" cols="12" sm="6" :md="$can('ads-add') ? 3: 4">
                    <VBtn
                      variant="flat"
                      block
                      @click="getAds"
                      :disabled="!app || !location"
                    >Actualiser</VBtn>
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

              <template v-slot:item.status="{ item }">
                <v-chip
                  :color="item.status === 'actif' ? 'success' : 'warning'"
                  class="text-capitalize"
                >{{ item.status }}</v-chip>
              </template>

              <template #item.actions="{ item, index }">
                <IconBtn color="info" @click="openDetailsSidebar(item)">
                  <VIcon icon="tabler-eye" />
                  <VTooltip activator="parent" location="top">Détails de l'élément</VTooltip>
                </IconBtn>

                <IconBtn
                  color="success"
                  @click="openEditSidebar(item, index)"
                  v-if="$can('ads-update')"
                >
                  <VIcon icon="tabler-edit" />
                  <VTooltip activator="parent" location="top">Mettre à jour l'élément</VTooltip>
                </IconBtn>

                <IconBtn
                  color="error"
                  @click="openDeleteDialog(item.id)"
                  v-if="$can('ads-archive')"
                >
                  <VIcon icon="tabler-trash" />
                  <VTooltip activator="parent" location="top">Supprimer l'élément</VTooltip>
                </IconBtn>
              </template>

              <template #bottom></template>
            </VDataTableServer>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        v-if="ads.length > 0 && $can('ads-update')"
        cols="12"
        sm="5"
        md="3"
        class="d-none d-md-block"
      >
        <VCard class="mb-4">
          <VCardText>
            <VRow>
              <VCol cols="12" class="pb-0">
                <VBtn
                  :disabled="checkOrder"
                  variant="outlined"
                  class="w-100"
                  append-icon="tabler-reload"
                  @click="openResetDialog"
                >Restart</VBtn>
              </VCol>

              <VCol cols="12">
                <VBtn
                  :disabled="checkOrder"
                  class="w-100"
                  append-icon="tabler-device-floppy"
                  @click="openSaveDialog"
                >Sauvegarder</VBtn>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <draggable v-if="ads.length" v-model="ads" :key="ads.length">
          <template v-slot:item="{ item }">
            <VCard class="mb-4">
              <v-img
                class="mx-auto rounded"
                width="100%"
                :aspect-ratio="1.8"
                :src="item.image"
                cover
              ></v-img>
            </VCard>
          </template>
        </draggable>
        <VCard v-else class="mb-4 text-center py-3">Pas de bannière pour le moment</VCard>
      </VCol>
    </VRow>

    <AddSidebar
      v-model:isOpen="addSideBar"
      :currentApp="app"
      :currentLocation="location"
      v-if="$can('ads-add')"
    />

    <EditSidebar
      v-if="$can('ads-update')"
      v-model:isOpen="editSideBar"
      :currentApp="app"
      :currentLocation="location"
      :current="current"
    />

    <DetailsSidebar v-model:isOpen="detailsSideBar" :current="current" />

    <VDialog v-model="deleteDialog" class="v-dialog-sm" v-if="$can('ads-archive')">
      <VCard title="Confirmer la suppression">
        <VCardText>Voulez-vous vraiment supprimer cet élément ?</VCardText>

        <VCardText class="d-flex justify-end gap-3 flex-wrap">
          <VBtn color="secondary" variant="tonal" @click="deleteDialog = false">Annuler</VBtn>
          <VBtn @click="confirmDelete">Confirmer</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <VDialog v-model="resetOrderDialog" width="500" v-if="$can('ads-update')">
      <VCard title="Confirmer la suppression">
        <VCardText>Etes-vous sûr de vouloir réinitialiser l'ordre des éléments ?</VCardText>
        <VCardText class="d-flex justify-end gap-3 flex-wrap">
          <VBtn @click="resetOrder">Confirmer</VBtn>
          <VBtn variant="outlined" color="error" @click="resetOrderDialog = false">Fermer</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <VDialog v-model="saveOrderDialog" width="500" v-if="$can('ads-update')">
      <VCard title="Confirmer la suppression">
        <VCardText>Etes-vous sûr de vouloir sauvegarder l'ordre des éléments ?</VCardText>
        <VCardText class="d-flex justify-end gap-3 flex-wrap">
          <VBtn @click="saveOrder">Confirmer</VBtn>
          <VBtn variant="outlined" color="error" @click="saveOrderDialog = false">Fermer</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <VSnackbar
      v-model="isSnackbarVisible"
      location="bottom end"
      variant="flat"
      :color="snackBarDetails.color"
    >{{ snackBarDetails.message }}</VSnackbar>
  </div>
</template>

<script>
import axios from "axios";
import { useAuthStore } from "@/store/auth";

import Draggable from "vue3-draggable";

import isEqual from "lodash/isEqual";

import { VDataTableServer } from "vuetify/labs/VDataTable";

import AddSidebar from "./sidebars/Add.vue";
import EditSidebar from "./sidebars/Edit.vue";
import DetailsSidebar from "./sidebars/Details.vue";

export default {
  setup() {
    return {
      authStore: useAuthStore()
    };
  },

  computed: {
    locationOptions() {
      return this.app
        ? this.appOptions.find(app => this.app === app.value).locationOptions
        : [];
    },

    checkOrder() {
      const ads = this.ads.map(ad => {
        return {
          id: ad.id,
          rank: ad.rank
        };
      });
      const oldAds = this.oldAds.map(ad => {
        return {
          id: ad.id,
          rank: ad.rank
        };
      });
      return isEqual(ads, oldAds);
    }
  },

  watch: {
    app() {
      this.location = null;
      this.ads = [];
      this.oldAds = [];
    }
  },

  components: {
    VDataTableServer,
    AddSidebar,
    EditSidebar,
    DetailsSidebar,
    Draggable
  },

  data() {
    return {
      headers: [
        {
          title: "Titre",
          key: "title",
          sortable: false
        },
        {
          title: "Statut",
          key: "status",
          sortable: false
        },
        {
          title: "Créé À",
          key: "created_at",
          sortable: false
        },
        {
          title: "Actions",
          key: "actions",
          sortable: false
        }
      ],

      appOptions: [
        {
          label: "Qwikly Order",
          value: "qwikly-order",
          locationOptions: [
            {
              label: "Bas",
              value: "bottom"
            }
          ]
        },
        {
          label: "Qwikly Order Notify",
          value: "qwikly-order-notify",
          locationOptions: [
            {
              label: "Haut",
              value: "top"
            },
            {
              label: "Bas",
              value: "bottom"
            }
          ]
        }
      ],

      ads: [],
      oldAds: [],

      location: null,
      app: null,

      isLoading: false,

      deleteDialog: false,

      resetOrderDialog: false,
      saveOrderDialog: false,

      detailsSideBar: false,
      addSideBar: false,
      editSideBar: false,

      current: null,
      currentIndex: null,

      isSnackbarVisible: false,
      snackBarDetails: {
        message: "",
        color: ""
      }
    };
  },

  async mounted() {
    this.busOn("add-item", this.getAds);
    this.busOn("update-item", this.getAds);
  },

  methods: {
    openResetDialog() {
      this.resetOrderDialog = true;
    },

    openSaveDialog() {
      this.saveOrderDialog = true;
    },

    async getAds() {
      this.ads = [];
      this.oldAds = [];
      this.isLoading = true;
      new Promise((resolve, reject) => {
        axios
          .get(import.meta.env.VITE_BASE_URL + "/ads", {
            headers: {
              Authorization: "Bearer " + this.authStore.token,
              "X-Authorization": import.meta.env.VITE_API_KEY
            },
            params: {
              app: this.app,
              location: this.location
            }
          })
          .then(res => {
            this.isLoading = false;
            this.ads = [...res.data.data];
            this.oldAds = [...res.data.data];
            resolve(res);
          })
          .catch(err => {
            this.isLoading = false;
            this.showSnackbar({
              message: "Impossible de récupérer les données",
              color: "error"
            });
            reject(err);
          });
      });
    },

    resetOrder() {
      this.ads = [...this.oldAds];
      this.resetOrderDialog = false;
    },

    saveOrder() {
      this.saveOrderDialog = false;
      this.isLoading = true;
      const ads = this.ads
        .map((ad, index) => {
          return {
            id: ad.id,
            rank: index + 1
          };
        })
        .filter(ad => {
          const old = this.oldAds.find(item => item.id === ad.id);
          return ad.rank !== old.rank;
        });

      return new Promise((resolve, reject) => {
        axios
          .post(
            import.meta.env.VITE_BASE_URL + "/ads/order",
            { app: this.app, location: this.location, ads },
            {
              headers: {
                Authorization: "Bearer " + this.authStore.token
              }
            }
          )
          .then(async res => {
            this.isLoading = false;
            this.showSnackbar({
              message: "Nouveau ordonnancement enregistré avec succès",
              color: "success"
            });
            await this.getAds();
            resolve(res);
          })
          .catch(err => {
            this.isLoading = false;
            this.showSnackbar({
              message: "Impossible d'enregistrer l'ordonnancement",
              color: "error"
            });
            reject(err);
          });
      });
    },

    openDeleteDialog(index) {
      this.currentIndex = index;
      this.deleteDialog = true;
    },

    confirmDelete() {
      this.isLoading = true;
      this.deleteDialog = false;
      new Promise((resolve, reject) => {
        axios
          .patch(
            `${import.meta.env.VITE_BASE_URL}/ads/${this.currentIndex}/archive`,
            {},
            {
              headers: {
                Authorization: "Bearer " + this.authStore.token,
                "X-Authorization": import.meta.env.VITE_API_KEY
              }
            }
          )
          .then(async res => {
            const index = this.ads.findIndex(
              category => category.id === this.currentIndex
            );
            this.ads.splice(index, 1);
            this.currentIndex = null;
            this.showSnackbar({
              message: "Élément supprimé avec succès",
              color: "success"
            });
            this.isLoading = false;
            await this.getAds();
            resolve(res);
          })
          .catch(err => {
            this.currentIndex = null;
            if (err.response.status === 404) {
              this.showSnackbar({
                message:
                  "Impossible de supprimer l'élément car il a des relations avec d'autres données",
                color: "error"
              });
            } else {
              this.showSnackbar({
                message: "Impossible de supprimer l'élément",
                color: "error"
              });
            }
            this.isLoading = false;
            reject(err);
          });
      });
    },

    openDetailsSidebar(ad) {
      this.current = ad;
      this.detailsSideBar = true;
    },

    openEditSidebar(ad, index) {
      this.currentIndex = index;
      this.current = ad;
      this.editSideBar = true;
    },

    showSnackbar({ message, color }) {
      this.isSnackbarVisible = true;
      this.snackBarDetails.message = message;
      this.snackBarDetails.color = color;
    }
  }
};
</script>

<style scoped>
.btn {
  width: 90%;
  margin: 2%;
}

@media screen and (max-width: 1500px) {
  .top {
    flex: 0 0 50% !important;
    max-width: 50% !important;
  }
}
</style>
