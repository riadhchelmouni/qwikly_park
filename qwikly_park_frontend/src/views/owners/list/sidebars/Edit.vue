<template>
  <VNavigationDrawer
    temporary
    :width="500"
    location="end"
    class="scrollable-content"
    :model-value="isOpen"
    @update:model-value="(val) => $emit('update:isOpen', val)"
  >
    <AppDrawerHeaderSection title="Mettre à jour l'élément" @cancel="close" />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <VForm ref="editForm">
            <VRow>
              <VCol cols="12">
                <AppTextField
                  label="Prénom"
                  v-model="employer.firstname"
                  :rules="[requiredValidator, stringLengthValidator]"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  label="Nom de famille"
                  v-model="employer.lastname"
                  :rules="[requiredValidator, stringLengthValidator]"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  label="Entreprise"
                  v-model="employer.company"
                  :rules="[requiredValidator, stringLengthValidator]"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  label="Adresse"
                  v-model="employer.address"
                  :rules="[requiredValidator, stringLengthValidator]"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  label="Adresse e-mail"
                  v-model="employer.email"
                  :rules="[requiredValidator, stringLengthValidator]"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  label="Numéro de téléphone"
                  v-model="employer.phone"
                  :rules="[
                    requiredValidator,
                    stringLengthValidator,
                    frPhoneValidator,
                  ]"
                >
                  <template v-slot:prepend>
                    <AppSelect
                      v-model="employer.countryCode"
                      color="info"
                      :items="countryCodes"
                    />
                  </template>
                </AppTextField>
              </VCol>

              <VCol cols="12">
                <AppDateTimePicker
                  v-model="employer.birthdate"
                  label="Date de naissance"
                  :rules="[requiredValidator]"
                  :config="{
                    maxDate: maxDateFormat(),
                  }"
                />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </PerfectScrollbar>

    <template v-slot:append>
      <VCard flat v-if="current">
        <VCardText>
          <VRow>
            <VCol cols="12">
              <VBtn
                class="me-3"
                @click="save"
                :loading="loading"
                :disabled="changes || loading"
                :key="changes || loading"
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
import { $api } from "@/utils/api";
import dayjs from "dayjs";
import isEqual from "lodash/isEqual";

import { PerfectScrollbar } from "vue3-perfect-scrollbar";

import { requiredValidator, stringLengthValidator, frPhoneValidator } from "@validators";

export default {
  emits: ["update:isOpen"],

  setup() {
    return { requiredValidator, stringLengthValidator, frPhoneValidator };
  },

  props: {
    isOpen: { type: Boolean, required: true },
    current: { type: Object },
  },

  components: { PerfectScrollbar },

  watch: {
    isOpen(val) {
      if (val) {
        const { countryCode, phone } = this.extractPhoneNumber(this.current.user.phone);
        this.employer = {
          firstname: this.current.user.firstname,
          lastname: this.current.user.lastname,
          email: this.current.user.email,
          company: this.current.company,
          address: this.current.user.address,
          phone,
          countryCode,
          birthdate: dayjs(this.current.user.birthdate, "DD/MM/YYYY").format("YYYY-MM-DD"),
        };
      }
      this.$refs.editForm.resetValidation();
    },
  },

  computed: {
    changes() {
      const { countryCode, phone } = this.extractPhoneNumber(this.current.user.phone);
      const oldEmployer = {
        firstname: this.current.user.firstname,
        lastname: this.current.user.lastname,
        company: this.current.company,
        address: this.current.user.address,
        email: this.current.user.email,
        phone,
        countryCode,
        birthdate: this.current.user.birthdate,
      };
      return isEqual(oldEmployer, this.employer);
    },
  },

  data() {
    return {
      employer: {
        firstname: null, lastname: null, company: null,
        address: null, email: null, phone: null,
        countryCode: "+33", birthdate: null,
      },
      countryCodes: ["+33", "+213"],
      loading: false,
      isSnackbarVisible: false,
      snackBarDetails: { message: "", color: "" },
    };
  },

  methods: {
    maxDateFormat() {
      return dayjs().subtract(18, "years").format("YYYY-MM-DD");
    },

    extractPhoneNumber(phoneNumber) {
      const countryCode = this.countryCodes.find(code => phoneNumber.startsWith(code));
      const phone = phoneNumber.slice(countryCode.length);
      return { countryCode, phone };
    },

    close() {
      this.$emit("update:isOpen", false);
    },

    async save() {
      const { valid } = await this.$refs.editForm.validate();
      if (!valid) return;

      this.loading = true;
      const data = { ...this.employer, phone: this.employer.countryCode + this.employer.phone };
      delete data.countryCode;

      try {
        const res = await $api(`/owners/${this.current.id}/update`, { method: "PUT", body: data });
        this.busEmit("update-item", res.owner);
        this.showSnackbar({ message: "Élément mis à jour avec succès", color: "success" });
        this.close();
      } catch (err) {
        const errors = err?.data?.errors;
        let message = "Impossible de mettre à jour l'élément";
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
    },
  },
};
</script>
