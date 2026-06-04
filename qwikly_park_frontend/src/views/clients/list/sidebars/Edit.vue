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
import isEqual from "lodash/isEqual";

import { PerfectScrollbar } from "vue3-perfect-scrollbar";

import { requiredValidator, stringLengthValidator } from "@validators";

export default {
  emits: ["update:isOpen"],

  setup() {
    return { requiredValidator, stringLengthValidator };
  },

  props: {
    isOpen: { type: Boolean, required: true },
    current: { type: Object }
  },

  components: { PerfectScrollbar },

  watch: {
    isOpen(val) {
      if (val) {
        const { countryCode, phone } = this.extractPhoneNumber(this.current?.user?.phone || '');
        this.client = {
          firstname: this.current?.user?.firstname,
          lastname: this.current?.user?.lastname,
          email: this.current?.user?.email,
          address: this.current?.address,
          phone,
          countryCode,
          birthdate: this.current?.user?.birthdate
        };
        this.$nextTick(() => this.$refs.editForm?.resetValidation());
      }
    }
  },

  computed: {
    changes() {
      if (!this.current || !this.current.user) return false;
      const { countryCode, phone } = this.extractPhoneNumber(this.current.user.phone);
      const oldClient = {
        firstname: this.current.user.firstname,
        lastname: this.current.user.lastname,
        email: this.current.user.email,
        address: this.current.address,
        phone,
        countryCode,
        birthdate: this.current.user.birthdate
      };
      return isEqual(oldClient, this.client);
    }
  },

  data() {
    return {
      client: {
        firstname: null, lastname: null, address: null,
        email: null, phone: null, countryCode: null, birthdate: null
      },
      countryCodes: ["+213", "+33"],
      loading: false,
      isSnackbarVisible: false,
      snackBarDetails: { message: "", color: "" }
    };
  },

  methods: {
    maxDateFormat() {
      return dayjs().subtract(18, "years").format("YYYY-MM-DD");
    },

    extractPhoneNumber(phoneNumber) {
      if (!phoneNumber) return { countryCode: '+213', phone: '' };
      const countryCode = this.countryCodes.find(code => phoneNumber.startsWith(code)) || '+213';
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
      const rawPhone = (this.client.phone || '').replace(/^0+/, '');
      const data = { ...this.client, phone: this.client.countryCode + rawPhone };
      delete data.countryCode;

      try {
        await $api(`/clients/${this.current.id}/update`, { method: "PUT", body: data });
        const updatedClient = {
          ...this.current,
          address: this.client.address,
          user: {
            ...this.current.user,
            firstname: this.client.firstname,
            lastname: this.client.lastname,
            email: this.client.email,
            phone: data.phone,
            birthdate: this.client.birthdate,
          }
        };
        this.busEmit("update-item", updatedClient);
        this.showSnackbar({ message: "Élément mis à jour avec succès", color: "success" });
        this.close();
      } catch (err) {
        const errors = err?.data?.errors;
        let message = "Impossible de mettre à jour l'élément";
        if (errors?.phone && errors?.email) {
          message = "L'adresse e-mail et le numéro de téléphone sont invalides ou déjà pris";
        } else if (errors?.phone) {
          const phoneMsg = Array.isArray(errors.phone) ? errors.phone[0] : errors.phone;
          message = phoneMsg?.includes('format') || phoneMsg?.includes('regex') || phoneMsg?.includes('invalid')
            ? "Format du téléphone invalide. Ex: 770123456 (sans le 0 initial)"
            : "Ce numéro de téléphone est déjà pris";
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
