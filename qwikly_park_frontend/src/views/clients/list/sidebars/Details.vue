<template>
  <VNavigationDrawer
    temporary
    :width="500"
    location="end"
    class="scrollable-content"
    :model-value="isOpen"
    @update:model-value="(val) => $emit('update:isOpen', val)"
  >
    <AppDrawerHeaderSection title="Détails de l'élément" @cancel="close" />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat v-if="current">
        <VCardText>
          <VList lines="two" class="py-0">
            <VImg
              :src="current.image ? current.image : placeholder"
              aspect-ratio="1"
              class="w-25 rounded-circle mx-auto"
              cover
            />

            <VListItem class="px-0">
              <p class="font-weight-bold mb-1">
                {{
                current.user.firstname + " " + current.user.lastname
                }}
              </p>
              <VListItemSubtitle>Nom</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <p class="font-weight-bold mb-1">
                {{
                current.user.email
                }}
              </p>
              <VListItemSubtitle>Adresse e-mail</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <p class="font-weight-bold mb-1">
                {{
                current.user.phone
                }}
              </p>
              <VListItemSubtitle>Numéro de téléphone</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <p class="font-weight-bold mb-1">
                {{
                current.user.birthdate
                }}
              </p>
              <VListItemSubtitle>Date de naissance</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <v-chip
                :color="getColor(current.status)"
                class="text-capitalize mb-1"
              >{{ getStatus(current.status) }}</v-chip>
              <VListItemSubtitle>Statut</VListItemSubtitle>
            </VListItem>
          </VList>
        </VCardText>
      </VCard>
    </PerfectScrollbar>

    <template v-slot:append>
      <VCard flat>
        <VCardText>
          <VRow>
            <VCol cols="12">
              <VBtn type="reset" variant="tonal" color="secondary" @click="close">Fermer</VBtn>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </template>
  </VNavigationDrawer>
</template>

<script>
import { PerfectScrollbar } from "vue3-perfect-scrollbar";

import placeholder from "@images/placeholders/user.svg";

export default {
  emits: ["update:isOpen"],

  setup() {
    return {
      placeholder
    };
  },

  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    current: {
      type: Object
    }
  },

  components: { PerfectScrollbar },

  methods: {
    close() {
      this.$emit("update:isOpen", false);
    },

    getColor(status) {
      switch (status) {
        case "refused":
          return "error";
        case "waiting":
          return "warning";
        case "approved":
          return "success";
      }
    },

    getStatus(status) {
      switch (status) {
        case "refused":
          return "refusé";
        case "waiting":
          return "en attente";
        case "approved":
          return "approuvé";
      }
    }
  }
};
</script>

<style scoped>
.logo {
  top: 50%;
  transform: translateY(-50%);
}

.list-header {
  padding: 0 !important;
}
</style>
