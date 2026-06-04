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
      <VCard flat v-if="current">
        <VCardText>
          <VImg
            :aspect-ratio="aspectRatio"
            v-if="displayImage"
            :src="displayImage"
            width="100%"
            class="mb-4 mx-auto rounded"
            cover
          ></VImg>

          <VForm ref="editForm">
            <VRow>
              <VCol cols="12">
                <AppTextField
                  label="Titre"
                  v-model="ad.title"
                  :rules="[requiredValidator, stringLengthValidator]"
                />
              </VCol>

              <VCol cols="12">
                <CustomRadiosWithImage
                  v-model:selected-radio="ad.app"
                  :radio-content="appOptions"
                  :aspectRatio="2.6"
                  :grid-column="{ sm: '6', cols: '6' }"
                />
              </VCol>

              <VCol cols="12">
                <AppSelect
                  v-model="ad.location"
                  color="info"
                  :items="locationOptions"
                  item-title="label"
                  item-value="value"
                  label="Emplacement"
                  :rules="[requiredValidator]"
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

              <VCol cols="12" v-if="ad.location && isAlertVisible">
                <VAlert
                  v-model="isAlertVisible"
                  closable
                  close-label="Close Alert"
                  variant="outlined"
                  color="primary"
                  class="mb-3"
                >{{alert}}</VAlert>
              </VCol>

              <VCol cols="12">
                <VFileInput
                  v-model="ad.image"
                  label="Télécharger une nouvelle photo"
                  accept=".jpeg, .png, .jpg, .webp"
                />
              </VCol>

              <VCol cols="12">
                <AppSelect
                  v-model="ad.status"
                  color="info"
                  :items="statusOptions"
                  item-title="label"
                  item-value="value"
                  label="Statut"
                  :rules="[requiredValidator]"
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
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </PerfectScrollbar>

    <template v-slot:append>
      <VCard flat>
        <VCardText>
          <VRow>
            <VCol cols="12" v-if="current">
              <VBtn
                class="me-3"
                @click="save"
                :loading="loading"
                :disabled="changes || loading"
                :key="loading"
              >Sauvegarder</VBtn>
              <VBtn type="reset" variant="tonal" color="secondary" @click="close">Annuler</VBtn>
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
  >{{ snackBarDetails.message }}</VSnackbar>
</template>

<script>
import axios from "axios";
import { serialize } from "object-to-formdata";
import { useAuthStore } from "@/store/auth";
import isEqual from "lodash/isEqual";

import { PerfectScrollbar } from "vue3-perfect-scrollbar";

import orderLight from "@images/products/order-light.svg";
import orderNotifyLight from "@images/products/order-notify-light.svg";

import orderDark from "@images/products/order-dark.svg";
import orderNotifyDark from "@images/products/order-notify-dark.svg";

import { requiredValidator, stringLengthValidator } from "@validators";

export default {
  emits: ["update:isOpen"],

  setup() {
    return {
      authStore: useAuthStore(),
      requiredValidator,
      stringLengthValidator
    };
  },

  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    current: {
      type: Object
    },

    currentApp: {
      required: true
    },

    currentLocation: {
      required: true
    }
  },

  computed: {
    displayImage() {
      return this.ad.image && this.ad.image[0]
        ? URL.createObjectURL(this.ad.image[0])
        : null;
    },

    aspectRatio() {
      return this.ad.location
        ? this.appOptions
            .find(app => this.ad.app === app.value)
            .locationOptions.find(
              location => this.ad.location === location.value
            ).aspectRatio
        : 1;
    },

    locationOptions() {
      return this.ad.app
        ? this.appOptions.find(app => this.ad.app === app.value).locationOptions
        : [];
    },

    alert() {
      return this.locationOptions.find(
        location => this.ad.location === location.value
      )?.alert;
    },

    changes() {
      const oldValue = {
        title: this.current.title,
        app: this.current.app,
        location: this.current.location,
        status: this.current.status === "actif" ? true : false
      };

      const newValue = {
        title: this.ad.title,
        app: this.ad.app,
        location: this.ad.location,
        status: this.ad.status
      };

      return (
        isEqual(oldValue, newValue) && !(this.ad.image && this.ad.image[0])
      );
    }
  },

  components: { PerfectScrollbar },

  watch: {
    isOpen(val) {
      if (val) {
        this.ad.title = this.current.title;
        this.ad.app = this.current.app;
        this.ad.location = this.current.location;
        this.ad.image = null;
        this.ad.status = this.current.status === "actif" ? true : false;
      }
    },

    "ad.position"() {
      this.isAlertVisible = true;
    },

    "ad.placement"() {
      this.isAlertVisible = true;
      this.ad.location = null;
    }
  },

  data() {
    return {
      statusOptions: [
        {
          label: "actif",
          value: true
        },
        {
          label: "bloqué",
          value: false
        }
      ],

      appOptions: [
        {
          bgImage: orderLight,
          bgImageDark: orderDark,
          value: "qwikly-order",
          locationOptions: [
            {
              label: "Bas",
              alert:
                "Le rapport hauteur/largeur de l'image doit être égal à 1 Exemple : ( 1260px / 330px )",
              value: "bottom"
            }
          ]
        },
        {
          bgImage: orderNotifyLight,
          bgImageDark: orderNotifyDark,
          value: "qwikly-order-notify",
          locationOptions: [
            {
              label: "Haut",
              alert:
                "Le rapport hauteur/largeur de l'image doit être égal à 1 Exemple : ( 1920px / 1080px )",
              value: "top"
            },
            {
              label: "Bas",
              alert:
                "Le rapport hauteur/largeur de l'image doit être égal à 1 Exemple : ( 1826px / 208px )",
              value: "bottom"
            }
          ]
        }
      ],

      locationOrderOptions: [
        {
          label: "Bas",
          value: "bottom"
        }
      ],

      locationNotifyOptions: [
        {
          label: "Haut",
          value: "top"
        },
        {
          label: "Bas",
          value: "bottom"
        }
      ],

      ad: {
        title: "",
        app: "",
        status: true,
        image: null,
        location: "bottom"
      },

      isAlertVisible: true,

      loading: false,

      isSnackbarVisible: false,
      snackBarDetails: {
        message: "",
        color: ""
      }
    };
  },

  methods: {
    close() {
      this.$emit("update:isOpen", false);
      this.$refs.editForm.resetValidation();
    },

    save() {
      this.$refs.editForm.validate().then(({ valid }) => {
        if (valid) {
          this.loading = true;
          let data = {
            ...this.ad
          };

          delete data.image;

          if (this.ad.image && this.ad.image[0]) {
            data = {
              ...data,
              image: this.ad.image[0]
            };
          }

          const formData = serialize(data, {
            indices: true,
            booleansAsIntegers: true
          });
          formData.append("_method", "PUT");

          new Promise((resolve, reject) => {
            axios
              .post(
                `${import.meta.env.VITE_BASE_URL}/ads/${
                  this.current.id
                }/update`,
                formData,
                {
                  headers: {
                    Authorization: "Bearer " + this.authStore.token,
                    "X-Authorization": import.meta.env.VITE_API_KEY
                  }
                }
              )
              .then(res => {
                this.loading = false;
                if (
                  res.data.ad.app === this.currentApp &&
                  res.data.ad.location === this.currentLocation
                ) {
                  this.busEmit("update-item", res.data.ad);
                }
                this.showSnackbar({
                  message: "Élément mis à jour avec succès",
                  color: "success"
                });
                this.close();
                resolve(res);
              })
              .catch(err => {
                this.loading = false;
                this.showSnackbar({
                  message: "Impossible de mettre à jour l'élément",
                  color: "error"
                });
                reject(err);
              });
          });
        }
      });
    },

    showSnackbar({ message, color }) {
      this.isSnackbarVisible = true;
      this.snackBarDetails.message = message;
      this.snackBarDetails.color = color;
    }
  }
};
</script>

