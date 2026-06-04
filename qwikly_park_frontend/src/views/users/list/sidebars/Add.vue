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
                <AppSelect
                  v-model="user.role_id"
                  color="info"
                  :items="roles"
                  item-title="name"
                  item-value="id"
                  label="Rôle"
                  :rules="[requiredValidator]"
                />
              </VCol>

              <!-- Franchise : visible uniquement si Super Admin crée un Admin de franchise -->
              <VCol cols="12" v-if="showFranchiseField">
                <AppSelect
                  v-model="user.franchise_id"
                  color="info"
                  :items="franchises"
                  item-title="name"
                  item-value="id"
                  label="Franchise associée"
                  clearable
                  :rules="[requiredValidator]"
                >
                  <template #prepend-inner>
                    <VIcon icon="tabler-building-community" size="16" color="#E8A838" />
                  </template>
                </AppSelect>
              </VCol>

              <VCol cols="12">
                <AppTextField
                  label="Prénom"
                  v-model="user.firstname"
                  :rules="[requiredValidator, stringLengthValidator]"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  label="Nom de famille"
                  v-model="user.lastname"
                  :rules="[requiredValidator, stringLengthValidator]"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  label="Adresse e-mail"
                  v-model="user.email"
                  :rules="[requiredValidator, stringLengthValidator]"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  label="Numéro de téléphone"
                  v-model="user.phone"
                  :rules="[requiredValidator, stringLengthValidator]"
                >
                  <template v-slot:prepend>
                    <AppSelect v-model="user.countryCode" color="info" :items="countryCodes" />
                  </template>
                </AppTextField>
              </VCol>

              <VCol cols="12">
                <AppDateTimePicker
                  v-model="user.birthdate"
                  label="Date de naissance"
                  :rules="[requiredValidator]"
                  :config="{
                    maxDate: maxDateFormat(),
                  }"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="user.password"
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
                  v-model="user.password_confirmation"
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
                      user.password,
                      user.password_confirmation
                    ),
                  ]"
                />
              </VCol>

              <VCol cols="12">
                <AppSelect
                  v-model="user.status"
                  color="info"
                  :items="statusOptions"
                  item-title="label"
                  item-value="value"
                  label="Statut"
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
import { useAuthStore } from "@/store/auth";
import dayjs from "dayjs";

import { PerfectScrollbar } from "vue3-perfect-scrollbar";

import {
  requiredValidator,
  stringLengthValidator,
  passwordValidator,
  confirmedValidator
} from "@validators";

const SUPER_ADMIN_ROLE_ID = 1;

export default {
  emits: ["update:isOpen"],

  setup() {
    return {
      authStore: useAuthStore(),
      requiredValidator,
      stringLengthValidator,
      passwordValidator,
      confirmedValidator
    };
  },

  computed: {
    isSuperAdmin() { return this.authStore.isSuperAdmin; },
    showFranchiseField() {
      return this.isSuperAdmin && this.user.role_id && this.user.role_id !== SUPER_ADMIN_ROLE_ID;
    },
  },

  props: {
    isOpen: { type: Boolean, required: true },
    roles: { type: Array, required: true }
  },

  components: { PerfectScrollbar },

  watch: {
    isOpen(val) {
      if (val) {
        this.user = {
          firstname: null, lastname: null, email: null,
          phone: null, countryCode: "+213", birthdate: null,
          status: true, role_id: null, franchise_id: null,
          password: null, password_confirmation: null,
        };
        this.loadFranchises();
      }
      this.$refs.addForm.resetValidation();
    },
  },

  data() {
    return {
      statusOptions: [
        { label: "actif", value: true },
        { label: "bloqué", value: false },
      ],
      user: {
        firstname: null, lastname: null, email: null,
        phone: null, countryCode: "+213", birthdate: null,
        status: true, role_id: null, franchise_id: null,
        password: null, password_confirmation: null,
      },
      franchises: [],
      countryCodes: ["+213", "+33"],
      showPassword: false,
      showPasswordConfirmation: false,
      loading: false,
      isSnackbarVisible: false,
      snackBarDetails: { message: "", color: "" },
    };
  },

  methods: {
    maxDateFormat() {
      return dayjs().subtract(18, "years").format("YYYY-MM-DD");
    },

    async loadFranchises() {
      if (!this.isSuperAdmin || this.franchises.length) return;
      try {
        const res = await $api("/franchises/", { params: { per_page: 200 } });
        this.franchises = res.data || [];
      } catch { /* ignore */ }
    },

    close() {
      this.$emit("update:isOpen", false);
    },

    async save() {
      const { valid } = await this.$refs.addForm.validate();
      if (!valid) return;

      this.loading = true;
      const data = { ...this.user, phone: this.user.countryCode + this.user.phone };
      delete data.countryCode;

      try {
        const res = await $api("/users/add", { method: "POST", body: data });
        this.busEmit("add-item", res.user);
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
