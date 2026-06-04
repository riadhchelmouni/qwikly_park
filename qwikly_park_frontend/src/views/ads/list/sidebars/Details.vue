<template>
  <VNavigationDrawer
    temporary
    :width="600"
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
            class="mx-auto rounded"
            width="100%"
            :aspect-ratio="location.aspectRatio"
            :src="current.image"
            cover
          ></v-img>
        </VCardText>
        <VCardText>
          <VList lines="two">
            <VListItem class="px-0">
              <p class="font-weight-bold mb-1">
                {{
                current.title
                }}
              </p>
              <VListItemSubtitle>Titre</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <p class="font-weight-bold mb-1">{{ app.label }}</p>
              <VListItemSubtitle>Application</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <p class="font-weight-bold mb-1">{{ location.label }}</p>
              <VListItemSubtitle>Emplacement</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <v-chip
                :color="current.status === 'actif' ? 'success' : 'warning'"
                class="text-capitalize mb-1"
              >{{ current.status }}</v-chip>
              <VListItemSubtitle>Status</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <p class="font-weight-bold mb-1">{{current.created_at}}</p>
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

  components: { PerfectScrollbar },

  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    current: {
      type: Object
    }
  },

  computed: {
    app() {
      return this.appOptions.find(app => this.current?.app === app.value);
    },

    location() {
      return this.app?.locationOptions.find(
        location => this.current?.location === location.value
      );
    }
  },

  data() {
    return {
      appOptions: [
        {
          label: "Qwikly Order",
          value: "qwikly-order",
          locationOptions: [
            {
              label: "Bas",
              value: "bottom",
              aspectRatio: 3.73
            }
          ]
        },
        {
          label: "Qwikly Order Notify",
          value: "qwikly-order-notify",
          locationOptions: [
            {
              label: "Haut",
              value: "top",
              aspectRatio: 1.77
            },
            {
              label: "Bas",
              value: "bottom",
              aspectRatio: 8.77
            }
          ]
        }
      ]
    };
  },

  methods: {
    close() {
      this.$emit("update:isOpen", false);
    }
  }
};
</script>
