<template>
  <VRow no-gutters class="auth-wrapper page-background">
    <VCol :lg="themeConfig.isAppRtl ? 2 : 6" class="d-none d-lg-flex"></VCol>

    <VCol cols="12" lg="4" class="auth-card-v2 d-flex align-center justify-center">
      <VCard flat :max-width="600" class="mt-12 mt-sm-0 pa-4 w-100">
        <VImg
          :src="global.name._value === 'dark' ? pageLogoDark : pageLogoLight"
          class="page-logo mx-auto mt-0 mt-sm-6"
        ></VImg>
        <VCardText>
          <h2
            class="text-h2 mb-1 text-center"
            :class="themeConfig.isAppRtl ? 'text-lg-right' : 'text-lg-left'"
          >Réinitialiser le mot de passe</h2>
        </VCardText>

        <VCardText>
          <VForm ref="refForm" @submit.prevent="reset">
            <VRow>
              <VCol cols="12">
                <AppTextField
                  v-model="password.new"
                  label="Mot de passe"
                  :rules="[
                    requiredValidator,
                    passwordValidator,
                    stringLengthValidator,
                  ]"
                  class="text-h5 text-sm-h4"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="
                    isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'
                  "
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="password.new_confirmation"
                  label="Confirmation du mot de passe"
                  :rules="[
                    requiredValidator,
                    stringLengthValidator,
                    confirmedValidator(password.new_confirmation, password.new),
                  ]"
                  class="text-h5 text-sm-h4"
                  :type="isPasswordConfirmationVisible ? 'text' : 'password'"
                  :append-inner-icon="
                    isPasswordConfirmationVisible
                      ? 'tabler-eye-off'
                      : 'tabler-eye'
                  "
                  @click:append-inner="
                    isPasswordConfirmationVisible =
                      !isPasswordConfirmationVisible
                  "
                />
              </VCol>

              <VCol cols="12">
                <VBtn
                  block
                  type="submit"
                  :loading="loading"
                  :disabled="loading"
                  :key="loading"
                >Envoyer</VBtn>
              </VCol>
              <VCol cols="12" class="pt-0">
                <VBtn block to="login" variant="text">Retour</VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
    <VCol :lg="themeConfig.isAppRtl ? 6 : 2" class="d-none d-lg-flex"></VCol>
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
import { themeConfig } from "@themeConfig";
import { useTheme } from "vuetify";

import { useAuthStore } from "@/store/auth";
import {
  passwordValidator,
  stringLengthValidator,
  confirmedValidator,
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
      stringLengthValidator,
      passwordValidator,
      confirmedValidator,
      themeConfig,
      pageLogoDark,
      pageLogoLight
    };
  },

  data() {
    return {
      token: null,
      email: "",
      password: {
        new: "",
        new_confirmation: ""
      },
      isPasswordVisible: false,
      isPasswordConfirmationVisible: false,

      loading: false,

      rtl: this.themeConfig.isAppRtl,

      isSnackbarVisible: false,
      snackBarDetails: {
        message: "",
        color: ""
      }
    };
  },

  mounted() {
    this.token = this.$route.query.token ? this.$route.query.token : null;
    this.email = decodeURIComponent(this.$route.query.email);
  },

  methods: {
    reset() {
      const data = {
        token: this.token,
        email: this.email,
        password: this.password.new,
        password_confirmation: this.password.new_confirmation
      };
      this.loading = true;
      this.authStore
        .resetPassword(data)
        .then(res => {
          this.$router.push("login");
          this.loading = false;
        })
        .catch(err => {
          this.loading = false;
          this.snackBarDetails.message =
            "Un problème est survenu, veuillez réessayer";
          this.snackBarDetails.color = "error";
          this.isSnackbarVisible = true;
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
