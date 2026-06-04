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
              <VCol cols="12" v-if="isAlertVisible">
                <VAlert
                  v-model="isAlertVisible"
                  closable
                  close-label="Close Alert"
                  variant="outlined"
                  color="primary"
                  class="mb-3"
                >Le nom de l'entreprise est utilisé pour générer l'identifiant de l'entreprise, qui ne peut pas être modifié.</VAlert>
              </VCol>

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
                  :rules="[requiredValidator, stringLengthValidator, frPhoneValidator]"
                >
                  <template v-slot:prepend>
                    <AppSelect v-model="employer.countryCode" color="info" :items="countryCodes" />
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

import { requiredValidator, stringLengthValidator, frPhoneValidator } from "@validators";

export default {
  emits: ["update:isOpen"],

  setup() {
    return { requiredValidator, stringLengthValidator, frPhoneValidator };
  },

  props: {
    isOpen: { type: Boolean, required: true }
  },

  components: { PerfectScrollbar },

  watch: {
    isOpen(val) {
      if (val) {
        this.isAlertVisible = true;
        this.employer = {
          firstname: null, lastname: null, company: null,
          address: null, email: null, phone: null,
          countryCode: "+33", birthdate: null
        };
      }
      this.$refs.addForm.resetValidation();
    }
  },

  data() {
    return {
      employer: {
        firstname: null, lastname: null, company: null,
        address: null, email: null, phone: null,
        countryCode: "+33", birthdate: null
      },
      isAlertVisible: true,
      countryCodes: ["+33", "+213"],
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
      const data = { ...this.employer, phone: this.employer.countryCode + this.employer.phone };
      delete data.countryCode;

      try {
        const res = await $api("/owners/add", { method: "POST", body: data });
        this.busEmit("add-item", res.owner);
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
