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
          <v-img
            class="mx-auto rounded-circle"
            width="100"
            :src="current.user.image ? current.user.image : placeholder"
            aspect-ratio="1"
            cover
          ></v-img>
        </VCardText>
        <VCardText>
          <VList lines="two">
            <VListSubheader class="list-header font-weight-bold">Informations de l'utilisateur</VListSubheader>

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
                current.user.role
                }}
              </p>
              <VListItemSubtitle>Rôle</VListItemSubtitle>
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

            <VListSubheader class="list-header font-weight-bold">Informations sur l'activité</VListSubheader>

            <VListItem class="px-0">
              <p class="font-weight-bold mb-1 text-capitalize">
                {{
                getTitle(current)
                }}
              </p>
              <VListItemSubtitle>Titre</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <p class="font-weight-bold mb-1">{{current.model}}</p>
              <VListItemSubtitle>Modèle</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <v-chip
                :color="getColor(current.action)"
                class="text-capitalize mb-1"
              >{{ current.action }}</v-chip>
              <VListItemSubtitle>Action</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <p class="font-weight-bold mb-1">
                {{
                current.platform
                }}
              </p>
              <VListItemSubtitle>Plateforme</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <p class="font-weight-bold mb-1">
                {{
                current.browser
                }}
              </p>
              <VListItemSubtitle>Navigateur</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <p class="font-weight-bold mb-1">
                {{
                current.created_at
                }}
              </p>
              <VListItemSubtitle>Créé à</VListItemSubtitle>
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
    getTitle(item) {
      switch (item.model) {
        case "Rôle":
          return item.data.name;
        case "Utilisateur":
          return item.data.firstname + " " + item.data.lastname;
        case "Client":
          return item.data.user.firstname + " " + item.data.user.lastname;
        case "Offre":
          return item.data.name;
        case "Achat":
          return item.data.code;
        case "License":
          return item.data.key;
        case "Ad":
          return item.data.title ? item.data.title : item.data;
        case "Propriétaire":
          return item.data.user.firstname + " " + item.data.user.lastname;
      }
    },

    getColor(action) {
      switch (action) {
        case "ajouter":
          return "success";
        case "mettre à jour":
          return "info";
        case "activer":
          return "success";
        case "désactiver":
          return "warning";
        case "supprimer":
          return "error";
        case "bloquer":
          return "error";
        case "réinitialiser":
          return "error";
        case "archiver":
          return "error";
        case "récupérer":
          return "success";
        case "changer l'ordre":
          return "success";
        case "approuver":
          return "success";
        case "refuser":
          return "error";
      }
    },

    close() {
      this.$emit("update:isOpen", false);
    }
  }
};
</script>

<style scoped>
.list-header {
  padding: 0 !important;
}
</style>
