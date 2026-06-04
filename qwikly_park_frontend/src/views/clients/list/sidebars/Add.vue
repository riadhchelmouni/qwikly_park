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
                <AppTextField
                  label="Prénom"
                  v-model="client.firstname"
                  :rules="[requiredValidator, stringLengthValidator]"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  label="Nom de famille"
                  v-model="client.lastname"
                  :rules="[requiredValidator, stringLengthValidator]"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  label="Adresse e-mail"
                  v-model="client.email"
                  :rules="[requiredValidator, stringLengthValidator]"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  label="Numéro de téléphone"
                  v-model="client.phone"
                  :rules="[requiredValidator, stringLengthValidator]"
                >
                  <template v-slot:prepend>
                    <AppSelect v-model="client.countryCode" color="info" :items="countryCodes" />
                  </template>
                </AppTextField>
              </VCol>

              <VCol cols="12">
                <AppDateTimePicker
                  v-model="client.birthdate"
                  label="Date de naissance"
                  :rules="[requiredValidator]"
                  :config="{
                    maxDate: maxDateFormat(),
                  }"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  label="Adresse"
                  v-model="client.address"
                  :rules="[requiredValidator, stringLengthValidator]"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="client.password"
                  label="Mot de passe"
                  :type="showPassword ? 'text' : 'password'"
                  :append-inner-icon="
                    showPassword ? 'tabler-eye-off' : 'tabler-eye'
                  "
                  @click:append-inner="showPassword = !showPassword"
                  :rules="[
                    requiredValidator,
                    stringLengthValidator,
                    passwordValidator,
                  ]"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="client.password_confirmation"
                  label="Confirmation du mot de passe"
                  :type="showPasswordConfirmation ? 'text' : 'password'"
                  :append-inner-icon="
                    showPasswordConfirmation ? 'tabler-eye-off' : 'tabler-eye'
                  "
                  @click:append-inner="
                    showPasswordConfirmation = !showPasswordConfirmation
                  "
                  :rules="[
                    requiredValidator,
                    stringLengthValidator,
                    confirmedValidator(
                      client.password,
                      client.password_confirmation
                    ),
                  ]"
                />
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
import { $api } from "@/utils/api";
import dayjs from "dayjs";

import { PerfectScrollbar } from "vue3-perfect-scrollbar";

import {
  requiredValidator,
  stringLengthValidator,
  passwordValidator,
  confirmedValidator
} from "@validators";

export default {
  emits: ["update:isOpen"],

  setup() {
    return { requiredValidator, stringLengthValidator, passwordValidator, confirmedValidator };
  },

  props: {
    isOpen: { type: Boolean, required: true }
  },

  components: { PerfectScrollbar },

  watch: {
    isOpen(val) {
      if (val) {
        this.client = {
          firstname: null, lastname: null, email: null,
          phone: null, countryCode: "+213", birthdate: null,
          address: null, password: null, password_confirmation: null
        };
        this.$nextTick(() => this.$refs.addForm?.resetValidation());
      }
    }
  },

  data() {
    return {
      client: {
        firstname: null, lastname: null, email: null,
        phone: null, countryCode: "+213", birthdate: null,
        address: null, password: null, password_confirmation: null
      },
      countryCodes: ["+213", "+33"],
      showPassword: false,
      showPasswordConfirmation: false,
      loading: false,
      isSnackbarVisible: false,
      snackBarDetails: { message: "", color: "" }
    };
  },

  methods: {
    maxDateFormat() {
      return dayjs().subtract(18, "years").format("YYYY-MM-DD");
    },

    close() {
      this.$emit("update:isOpen", false);
    },

    async save() {
      const { valid } = await this.$refs.addForm.validate();
      if (!valid) return;

      this.loading = true;
      const rawPhone = (this.client.phone || '').replace(/^0+/, '');
      const data = { ...this.client, phone: this.client.countryCode + rawPhone };
      delete data.countryCode;

      try {
        const res = await $api("/clients/add", { method: "POST", body: data });
        const newClient = (res?.client && res.client.id) ? res.client : {
          id: res?.id ?? res?.client?.id ?? Date.now(),
          address: this.client.address,
          status: 'waiting',
          has_decharge: false,
          parks: [],
          children: [],
          children_count: 0,
          user: {
            firstname: this.client.firstname,
            lastname: this.client.lastname,
            email: this.client.email,
            phone: data.phone,
            birthdate: this.client.birthdate,
          }
        };
        this.busEmit("add-item", newClient);
        this.showSnackbar({ message: "Élément ajouté avec succès", color: "success" });
        this.close();
      } catch (err) {
        const errors = err?.data?.errors;
        let message = "Impossible d'ajouter l'élément";
        if (errors?.phone && errors?.email) {
          message = "L'adresse e-mail et le numéro de téléphone sont pris";
        } else if (errors?.phone) {
          message = "Ce numéro de téléphone est déjà pris";
        } else if (errors?.email) {
          message = "Cette adresse e-mail est déjà prise";
        }
        this.showSnackbar({ message, color: "error" });
      } finally {
        this.loading = false;
      }
    },

    showSnackbar({ message, color }) {
      this.isSnackbarVisible = true;
      this.snackBarDetails.message = message;
      this.snackBarDetails.color = color;
    }
  }
};
</script>
