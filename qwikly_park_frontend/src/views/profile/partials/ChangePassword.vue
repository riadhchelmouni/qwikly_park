<template>
  <VRow>
    <VCol cols="12">
      <VCard title="Changer le mot de passe">
        <VForm @submit.prevent="save" ref="passwordForm">
          <VCardText class="pt-0">
            <VRow>
              <VCol cols="12" md="6">
                <AppTextField
                  v-model="password.current"
                  :type="isCurrentPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="
                    isCurrentPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'
                  "
                  label="Mot de passe actuel"
                  @click:append-inner="
                    isCurrentPasswordVisible = !isCurrentPasswordVisible
                  "
                  :rules="[
                    requiredValidator,
                    passwordValidator,
                    stringLengthValidator,
                  ]"
                />
              </VCol>
            </VRow>

            <VRow>
              <VCol cols="12" md="6">
                <AppTextField
                  v-model="password.new"
                  :type="isNewPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="
                    isNewPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'
                  "
                  label="Nouveau mot de passe"
                  @click:append-inner="
                    isNewPasswordVisible = !isNewPasswordVisible
                  "
                  :rules="[
                    requiredValidator,
                    passwordValidator,
                    stringLengthValidator,
                  ]"
                />
              </VCol>

              <VCol cols="12" md="6">
                <AppTextField
                  v-model="password.newConfirmation"
                  :type="isConfirmPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="
                    isConfirmPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'
                  "
                  label="Confirmer le nouveau mot de passe"
                  @click:append-inner="
                    isConfirmPasswordVisible = !isConfirmPasswordVisible
                  "
                  :rules="[
                    requiredValidator,
                    stringLengthValidator,
                    confirmedValidator(password.newConfirmation, password.new),
                  ]"
                />
              </VCol>
            </VRow>
          </VCardText>

          <VCardText class="d-flex flex-wrap gap-4">
            <VBtn type="submit" :loading="loading" :disabled="loading" :key="loading">Sauvegarder</VBtn>

            <VBtn
              type="reset"
              color="secondary"
              variant="tonal"
              @click.prevent="reset"
            >Réinitialiser</VBtn>
          </VCardText>
        </VForm>
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
import { useAuthStore } from "@/store/auth";

import {
  requiredValidator,
  stringLengthValidator,
  passwordValidator,
  confirmedValidator
} from "@validators";

export default {
  setup() {
    return {
      authStore: useAuthStore(),

      requiredValidator,
      stringLengthValidator,
      passwordValidator,
      confirmedValidator
    };
  },

  data() {
    return {
      isCurrentPasswordVisible: false,
      isNewPasswordVisible: false,
      isConfirmPasswordVisible: false,

      password: {
        current: null,
        new: null,
        newConfirmation: null
      },

      loading: false,

      isSnackbarVisible: false,
      snackBarDetails: {
        message: "",
        color: ""
      }
    };
  },

  methods: {
    reset() {
      this.password.current = null;
      this.password.new = null;
      this.password.newConfirmation = null;
    },

    save() {
      this.$refs.passwordForm.validate().then(({ valid }) => {
        if (valid) {
          this.loading = true;
          this.authStore
            .changePassword({
              password: this.password.current,
              new_password: this.password.new,
              new_password_confirmation: this.password.newConfirmation
            })
            .then(() => {
              this.loading = false;
              this.token = null;
              this.user = null;
              localStorage.auth = null;
              this.$router.go("/login");
            })
            .catch(() => {
              this.loading = false;
              this.snackBarDetails.message =
                "Un problème est survenu, veuillez réessayer";
              this.snackBarDetails.color = "error";
              this.isSnackbarVisible = true;
              this.reset();
            });
        }
      });
    }
  }
};
</script>
