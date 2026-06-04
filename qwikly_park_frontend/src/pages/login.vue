<template>
  <VRow no-gutters class="auth-wrapper page-background">
    <VCol :lg="rtl ? 2 : 6" class="d-none d-lg-flex"></VCol>

    <VCol cols="12" lg="4" class="auth-card-v2 d-flex align-center justify-center">
      <VCard flat :max-width="600" class="pa-4 w-100">
        <VImg
          :src="global.name._value === 'dark' ? pageLogoDark : pageLogoLight"
          class="page-logo mx-auto mt-0 mt-sm-6"
        ></VImg>
        <VCardText>
          <h2
            class="text-h2 mb-1 text-center"
            :class="rtl ? 'text-lg-right' : 'text-lg-left'"
          >S’identifier</h2>
        </VCardText>

        <VCardText>
          <VForm ref="refForm" @submit.prevent="login">
            <VRow>
              <VCol cols="12">
                <AppTextField
                  v-model="identifier"
                  label="Adresse e-mail ou numéro de téléphone"
                  type="text"
                  :rules="[requiredValidator, IdentifierValidator(identifier)]"
                  autofocus
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="password"
                  label="Mot de passe"
                  :type="showPassword ? 'text' : 'password'"
                  :append-inner-icon="
                    showPassword ? 'tabler-eye-off' : 'tabler-eye'
                  "
                  @click:append-inner="showPassword = !showPassword"
                  :rules="[requiredValidator, passwordValidator]"
                />
              </VCol>

              <VCol cols="12">
                <div class="mt-2 mb-4">
                  <a
                    class="text-primary mb-1"
                    @click="this.$router.push('/forgot-password')"
                    role="button"
                  >Mot de passe oublié ?</a>
                </div>

                <VBtn block type="submit" :loading="loading" :disabled="loading">S’identifier</VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>

    <VCol :lg="rtl ? 6 : 2" class="d-none d-lg-flex"></VCol>
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
import { useAuthStore } from "@/store/auth";
import { themeConfig } from "@themeConfig";
import { useTheme } from "vuetify";

import {
  IdentifierValidator,
  passwordValidator,
  requiredValidator
} from "@validators";

import pageLogoDark from "@images/pages/page-logo-dark.svg";
import pageLogoLight from "@images/pages/page-logo-light.svg";

export default {
  setup() {
    const { global } = useTheme();
    return {
      global,
      authStore: useAuthStore(),
      requiredValidator,
      IdentifierValidator,
      passwordValidator,
      pageLogoDark,
      pageLogoLight,
      themeConfig
    };
  },

  data() {
    return {
      showPassword: false,
      identifier: "",
      password: "",

      rtl: this.themeConfig.isAppRtl,

      loading: false,

      isSnackbarVisible: false,
      snackBarDetails: {
        message: "",
        color: ""
      }
    };
  },

  methods: {
    login() {
      this.$refs.refForm.validate().then(({ valid }) => {
        if (valid) {
          this.loading = true;
          this.authStore
            .login(this.identifier, this.password)
            .then(() => {
              this.loading = false;
              this.$router.go("/");
            })
            .catch(err => {
              this.loading = false;
              if (err.response.status === 401) {
                if (err.response.data.status == "blocked") {
                  this.snackBarDetails.message =
                    "Vous avez été bloqué, pour plus d'informations contactez le support";
                } else if (err.response.data.status == "error") {
                  this.snackBarDetails.message =
                    "Veuillez vérifier vos informations";
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

<style lang="scss">
@use "@core-scss/template/pages/page-auth.scss";

.page-logo {
  display: none;
}

@media (max-width: 1024px) {
  .page-logo {
    display: block;
    width: 30%;
  }
}

@media (max-width: 600px) {
  .page-logo {
    display: block;
    width: 45%;
  }
}
</style>

<route lang="yaml">
meta:
  layout: blank
</route>

