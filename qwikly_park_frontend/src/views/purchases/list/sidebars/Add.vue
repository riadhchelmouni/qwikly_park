<template>
  <VNavigationDrawer
    temporary
    :width="500"
    location="end"
    class="scrollable-content"
    :model-value="isOpen"
    @update:model-value="(val) => $emit('update:isOpen', val)"
  >
    <AppDrawerHeaderSection title="Ajouter un élément" @cancel="close" />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <VForm ref="addForm">
            <VRow>
              <VCol cols="12">
                <AppAutocomplete
                  label="Client"
                  v-model="purchase.client_id"
                  v-model:search="clientsQuery"
                  :loading="searching"
                  item-title="user.firstname"
                  item-value="id"
                  :items="clients"
                  placeholder="Client"
                  clearable
                  no-data-text="Pas de données disponibles"
                >
                  <template v-slot:selection="{ item }">
                    <span class="text-capitalize">
                      {{
                        item.raw.user.firstname + " " + item.raw.user.lastname
                      }}
                    </span>
                  </template>
                  <template v-slot:item="{ item, props }">
                    <VListItem v-bind="props">
                      <template v-slot:title>
                        <span class="text-capitalize">
                          {{
                            item.raw.user.firstname +
                            " " +
                            item.raw.user.lastname
                          }}
                        </span>
                      </template>
                    </VListItem>
                  </template>
                </AppAutocomplete>
              </VCol>

              <VCol cols="12">
                <AppAutocomplete
                  label="Offre"
                  v-model="purchase.offer_id"
                  v-model:search="offersQuery"
                  :loading="searching"
                  item-title="name"
                  item-value="id"
                  :items="offers"
                  placeholder="Offre"
                  clearable
                  no-data-text="Pas de données disponibles"
                ></AppAutocomplete>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </PerfectScrollbar>

    <template v-slot:append>
      <VCard flat>
        <VCardText>
          <VRow>
            <VCol cols="12">
              <VBtn
                class="me-3"
                @click="save"
                :loading="loading"
                :disabled="loading"
                :key="loading"
                >Sauvegarder</VBtn
              >
              <VBtn
                type="reset"
                variant="tonal"
                color="secondary"
                @click="close"
                >Annuler</VBtn
              >
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </template>
  </VNavigationDrawer>

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

import debounce from "lodash/debounce";

import { PerfectScrollbar } from "vue3-perfect-scrollbar";

import {
  requiredValidator,
  stringLengthValidator,
  passwordValidator,
  confirmedValidator,
} from "@validators";

export default {
  emits: ["update:isOpen"],

  setup() {
    return {
      authStore: useAuthStore(),

      requiredValidator,
      stringLengthValidator,
      passwordValidator,
      confirmedValidator,
    };
  },

  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },
  },

  components: { PerfectScrollbar },

  watch: {
    clientsQuery(val) {
      this.debouncedSearchClients();
    },

    offersQuery(val) {
      this.debouncedSearchOffers();
    },

    isOpen(val) {
      if (val) {
        this.purchase = {
          client_id: null,
          offer_id: null,
        };
      }
      this.$refs.addForm.resetValidation();
    },
  },

  data() {
    return {
      clients: [],
      offers: [],

      purchase: {
        client_id: null,
        offer_id: null,
      },

      loading: false,
      searching: false,

      clientsQuery: "",
      offersQuery: "",

      isSnackbarVisible: false,
      snackBarDetails: {
        message: "",
        color: "",
      },
    };
  },

  created() {
    this.debouncedSearchClients = debounce(() => {
      this.getClients();
    }, 500);

    this.debouncedSearchOffers = debounce(() => {
      this.getOffers();
    }, 500);
  },

  async mounted() {
    this.getClients();
    this.getOffers();
  },

  beforeUnmount() {
    this.debouncedSearchClients.cancel();
    this.debouncedSearchOffers.cancel();
  },

  methods: {
    close() {
      this.$emit("update:isOpen", false);
    },

    async getClients() {
      this.searching = true;
      new Promise((resolve, reject) => {
        axios
          .get(import.meta.env.VITE_BASE_URL + "/purchases/clients/", {
            headers: {
              Authorization: "Bearer " + this.authStore.token,
              "X-Authorization": import.meta.env.VITE_API_KEY,
            },
            params: {
              keyword: this.clientsQuery,
            },
          })
          .then((res) => {
            this.clients = res.data.data;
            this.searching = false;
            resolve(res);
          })
          .catch((err) => {
            this.searching = false;
            this.snackBarDetails.message =
              "Impossible de récupérer les données";
            this.snackBarDetails.color = "error";
            this.isSnackbarVisible = true;
            reject(err);
          });
      });
    },

    async getOffers() {
      this.searching = true;
      new Promise((resolve, reject) => {
        axios
          .get(import.meta.env.VITE_BASE_URL + "/purchases/offers/", {
            headers: {
              Authorization: "Bearer " + this.authStore.token,
              "X-Authorization": import.meta.env.VITE_API_KEY,
            },
            params: {
              keyword: this.offersQuery,
            },
          })
          .then((res) => {
            this.searching = false;
            this.offers = res.data.data;
            resolve(res);
          })
          .catch((err) => {
            this.searching = false;
            this.snackBarDetails.message =
              "Impossible de récupérer les données";
            this.snackBarDetails.color = "error";
            this.isSnackbarVisible = true;
            reject(err);
          });
      });
    },

    save() {
      this.$refs.addForm.validate().then(({ valid }) => {
        if (valid) {
          this.loading = true;
          new Promise((resolve, reject) => {
            axios
              .post(
                import.meta.env.VITE_BASE_URL + "/purchases/add",
                this.purchase,
                {
                  headers: {
                    Authorization: "Bearer " + this.authStore.token,
                    "X-Authorization": import.meta.env.VITE_API_KEY,
                  },
                }
              )
              .then((res) => {
                this.loading = false;
                this.busEmit("add-item", res.data.purchase);
                this.snackBarDetails.message = "Élément ajouté avec succès";
                this.snackBarDetails.color = "success";
                this.isSnackbarVisible = true;
                this.close();
                resolve(res);
              })
              .catch((err) => {
                this.loading = false;
                this.snackBarDetails.message = "Impossible d'ajouter l'élément";
                this.snackBarDetails.color = "error";
                this.isSnackbarVisible = true;
                reject(err);
              });
          });
        }
      });
    },
  },
};
</script>
