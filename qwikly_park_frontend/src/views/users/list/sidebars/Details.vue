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
                current.firstname + " " + current.lastname
                }}
              </p>
              <VListItemSubtitle>Nom</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <VListItemTitle class="font-weight-bold text-capitalize">
                {{
                current.role.name
                }}
              </VListItemTitle>
              <VListItemSubtitle>Rôle</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <p class="font-weight-bold mb-1">
                {{
                current.email
                }}
              </p>
              <VListItemSubtitle>Adresse e-mail</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <p class="font-weight-bold mb-1">
                {{
                current.phone
                }}
              </p>
              <VListItemSubtitle>Numéro de téléphone</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <p class="font-weight-bold mb-1">
                {{
                current.birthdate
                }}
              </p>
              <VListItemSubtitle>Date de naissance</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <v-chip
                :color="current.status === 'actif' ? 'success' : 'error'"
                class="text-capitalize mb-1"
              >{{ current.status }}</v-chip>
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
