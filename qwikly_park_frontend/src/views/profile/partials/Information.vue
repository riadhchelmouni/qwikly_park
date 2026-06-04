<template>
  <VRow>
    <VCol cols="12">
      <VCard title="Détails du profil">
        <VCardText class="d-flex">
          <VAvatar v-if="user" rounded size="100" class="me-6">
            <VImg
              :src="
                user.image[0]
                  ? displayImage
                  : authStore.user && authStore.user.image
                  ? authStore.user.image
                  : placeholder
              "
              :aspect-ratio="1"
              cover
            ></VImg>
          </VAvatar>

          <form class="d-flex flex-column justify-center gap-4">
            <div class="d-flex flex-wrap gap-2">
              <VBtn color="primary" @click="openChooseImage">
                <VIcon icon="tabler-cloud-upload" class="d-sm-none" />
                <span class="d-none d-sm-block">Télécharger une nouvelle photo</span>
              </VBtn>

              <input
                ref="image"
                type="file"
                name="file"
                accept=".jpeg, .png, .jpg, GIF"
                hidden
                @change="changeImage"
              />

              <VBtn type="reset" color="secondary" variant="tonal" @click="removeImage">
                <span class="d-none d-sm-block">Réinitialiser</span>
                <VIcon icon="tabler-refresh" class="d-sm-none" />
              </VBtn>
            </div>

            <p
              class="text-body-1 mb-0"
            >Il est recommandé que le rapport d'aspect (largeur/hauteur) de l'image soit égal à 1. Par exemple : ( 100px / 100px ).</p>
          </form>
        </VCardText>

        <VDivider />

        <VCardText v-if="user" class="pt-2">
          <VForm class="mt-6" ref="infoForm" @submit.prevent="save">
            <VRow>
              <VCol md="6" cols="12">
                <AppTextField
                  v-model="user.firstname"
                  label="Prénom"
                  :rules="[requiredValidator, stringLengthValidator]"
                />
              </VCol>

              <VCol md="6" cols="12">
                <AppTextField
                  v-model="user.lastname"
                  label="Nom de famille"
                  :rules="[requiredValidator, stringLengthValidator]"
                />
              </VCol>

              <VCol cols="12" md="6">
                <AppTextField
                  v-model="user.email"
                  :rules="[requiredValidator, emailValidator]"
                  label="Adresse e-mail"
                  type="email"
                />
              </VCol>

              <VCol cols="12" md="6">
                <AppTextField
                  v-model="user.phone"
                  label="Numéro de téléphone"
                  :rules="[requiredValidator, phoneValidator]"
                >
                  <template v-slot:prepend>
                    <AppSelect v-model="user.countryCode" color="info" :items="countryCodes" />
                  </template>
                </AppTextField>
              </VCol>

              <VCol cols="12" md="6">
                <AppDateTimePicker
                  v-model="user.birthdate"
                  label="Date de naissance"
                  :rules="[requiredValidator]"
                />
              </VCol>

              <VCol cols="12" class="d-flex flex-wrap gap-4">
                <VBtn
                  type="submit"
                  :loading="loading"
                  :disabled="changes || loading"
                  :key="changes || loading"
                >Sauvegarder</VBtn>

                <VBtn
                  color="secondary"
                  variant="tonal"
                  type="reset"
                  @click.prevent="initialize"
                  :disabled="changes"
                >Réinitialiser</VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <VSnackbar
    :color="snackBarDetails.color"
    location="top"
    :timeout="2000"
    v-model="isSnackbarVisible"
  >
    <div class="w-100 text-center">{{ snackBarDetails.message }}</div>
  </VSnackbar>
</template>

<script>
import { serialize } from "object-to-formdata";
import isEqual from "lodash/isEqual";

import { useAuthStore } from "@/store/auth";

import placeholder from "@images/placeholders/user.svg";

import {
  requiredValidator,
  emailValidator,
  phoneValidator,
  stringLengthValidator
} from "@validators";

export default {
  setup() {
    return {
      authStore: useAuthStore(),

      placeholder,

      requiredValidator,
      emailValidator,
      phoneValidator,
      stringLengthValidator
    };
  },

  computed: {
    displayImage() {
      return this.user.image[0]
        ? URL.createObjectURL(this.user.image[0])
        : null;
    },

    changes() {
      const oldUser = {
        firstname: this.authStore.user?.firstname,
        lastname: this.authStore.user?.lastname,
        email: this.authStore.user?.email,
        phone: this.authStore.user
          ? this.extractPhoneNumber(this.authStore.user.phone).phone
          : null,
        countryCode: this.authStore.user
          ? this.extractPhoneNumber(this.authStore.user.phone).countryCode
          : null,
        birthdate: this.authStore.user?.birthdate
      };
      const newUser = {
        firstname: this.user.firstname,
        lastname: this.user.lastname,
        email: this.user.email,
        phone: this.user.phone,
        countryCode: this.user.countryCode,
        birthdate: this.user.birthdate
      };
      return isEqual(oldUser, newUser) && !this.user.image[0];
    }
  },

  data() {
    return {
      user: {
        image: [],
        firstname: null,
        lastname: null,
        email: null,
        phone: null,
        birthdate: null,
        countryCode: "+213"
      },

      countryCodes: ["+213", "+33"],

      loading: false,

      isSnackbarVisible: false,
      snackBarDetails: {
        message: "",
        color: ""
      }
    };
  },

  mounted() {
    this.initialize();
  },

  methods: {
    initialize() {
      this.user.firstname = this.authStore.user?.firstname;
      this.user.lastname = this.authStore.user?.lastname;
      this.user.email = this.authStore.user?.email;
      this.user.phone = this.extractPhoneNumber(
        this.authStore.user?.phone
      ).phone;
      this.user.countryCode = this.extractPhoneNumber(
        this.authStore.user?.phone
      ).countryCode;
      this.user.birthdate = this.authStore.user?.birthdate;
      this.user.image = [];
    },

    extractPhoneNumber(phoneNumber) {
      let countryCode = this.countryCodes.find(code =>
        phoneNumber.startsWith(code)
      );
      let phone = phoneNumber.slice(countryCode.length);
      return { countryCode, phone };
    },

    openChooseImage() {
      this.$refs.image.click();
    },

    removeImage() {
      this.user.image = [];
      this.$refs.image.value = null;
    },

    changeImage(file) {
      this.user.image[0] = file.target.files[0];
    },

    save() {
      this.$refs.infoForm.validate().then(({ valid }) => {
        if (valid) {
          this.loading = true;
          const data = {
            firstname: this.user.firstname,
            lastname: this.user.lastname,
            birthdate: this.user.birthdate,
            email: this.user.email,
            phone: this.user.countryCode + this.user.phone,
            image: this.user.image[0]
          };
          const formData = serialize(data, {
            indices: true,
            booleansAsIntegers: true
          });
          formData.append("_method", "PUT");

          this.authStore
            .update(formData)
            .then(() => {
              this.loading = false;
              this.removeImage();
              this.token = null;
              this.user = null;
              localStorage.auth = null;
              this.$router.go("/login");
            })
            .catch(err => {
              this.loading = false;
              if (err.response) {
                if (
                  err.response.data.errors.phone &&
                  err.response.data.errors.email
                ) {
                  this.snackBarDetails.message =
                    "L'adresse e-mail et le numéro de téléphone sont pris";
                } else if (err.response.data.errors.phone) {
                  this.snackBarDetails.message =
                    "Ce numéro de téléphone est déjà pris";
                } else if (err.response.data.errors.email) {
                  this.snackBarDetails.message =
                    "Cette adresse e-mail est déjà prise";
                } else {
                  this.snackBarDetails.message =
                    "Un problème est survenu, veuillez réessayer";
                }
              } else {
                this.snackBarDetails.message =
                  "Un problème est survenu, veuillez réessayer";
              }
              this.snackBarDetails.color = "error";
              this.isSnackbarVisible = true;
            });
        }
      });
    }
  }
};
</script>
