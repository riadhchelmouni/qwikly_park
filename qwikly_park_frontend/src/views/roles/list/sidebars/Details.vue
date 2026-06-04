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
            <VListItem class="px-0">
              <VListItemTitle class="font-weight-bold text-capitalize">
                {{
                current.name
                }}
              </VListItemTitle>
              <VListItemSubtitle>Rôle</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <v-chip
                :color="current.status === 'actif' ? 'success' : 'warning'"
                class="text-capitalize mb-1"
              >{{ current.status }}</v-chip>
              <VListItemSubtitle>Statut</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <p class="font-weight-bold mb-1">
                {{
                current.users_count
                }}
              </p>
              <VListItemSubtitle>Nombre d'utilisateurs</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0" v-for="(item, index) in permissions" :key="index">
              <v-chip
                v-for="(permission, index) in item.permissions"
                :key="index"
                :color="getColor(permission.permission)"
                class="text-capitalize mb-1 me-1"
              >{{ permission.permission }}</v-chip>
              <VListItemSubtitle>{{ item.type }}</VListItemSubtitle>
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

export default {
  emits: ["update:isOpen"],

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

  computed: {
    permissions() {
      const groupedPermission = {};
      this.current?.permissions.forEach(item => {
        const type = item.type;
        const { label, id } = item;
        if (!groupedPermission[type]) {
          groupedPermission[type] = { type, permissions: [] };
        }
        groupedPermission[type].permissions.push({ permission: label, id });
      });
      return Object.values(groupedPermission);
    }
  },

  methods: {
    close() {
      this.$emit("update:isOpen", false);
    },

    getColor(permission) {
      switch (permission) {
        case "voir":
          return "info";
        case "ajouter":
          return "success";
        case "mettre à jour":
          return "info";
        case "changer le statut":
          return "info";
        case "archiver":
          return "warning";
        case "récupérer":
          return "success";
        case "réinitialiser":
          return "error";
        case "supprimer":
          return "error";
        case "statistiques":
          return "info";
      }
    }
  }
};
</script>
