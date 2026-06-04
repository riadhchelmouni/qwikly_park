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
                />
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
    roles: { type: Array, required: true },
    current: { type: Object }
  },

  components: { PerfectScrollbar },

  watch: {
    isOpen(val) {
      if (val) {
        const { countryCode, phone } = this.extractPhoneNumber(this.current.phone);
        this.user = {
          firstname: this.current.firstname,
          lastname: this.current.lastname,
          email: this.current.email,
          phone,
          countryCode,
          birthdate: this.current.birthdate,
          role_id: this.current.role.id,
          status: this.current.status === "actif"
        };
      }
      this.$refs.editForm.resetValidation();
    }
  },

  computed: {
    changes() {
      const { countryCode, phone } = this.extractPhoneNumber(this.current.phone);
      const oldUser = {
        firstname: this.current.firstname,
        lastname: this.current.lastname,
        email: this.current.email,
        phone,
        countryCode,
        birthdate: this.current.birthdate,
        role_id: this.current.role.id,
        status: this.current.status === "actif"
      };
      return isEqual(oldUser, this.user);
    }
  },

  data() {
    return {
      statusOptions: [
        { label: "actif", value: true },
        { label: "bloqué", value: false }
      ],
      user: {
        firstname: null, lastname: null, email: null,
        phone: null, countryCode: null, birthdate: null,
        status: true, role_id: null
      },
      countryCodes: ["+213"],
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
      const data = { ...this.user, phone: this.user.countryCode + this.user.phone };
      delete data.countryCode;

      try {
        const res = await $api(`/users/${this.current.id}/update`, { method: "PUT", body: data });
        this.busEmit("update-item", res.user);
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
    }
  }
};
</script>
