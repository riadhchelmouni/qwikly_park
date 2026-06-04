<template>
  <VRow>
    <VCol cols="12" md="5" lg="4">
      <Details />
    </VCol>

    <VCol cols="12" md="7" lg="8">
      <VTabs v-model="tab" class="v-tabs-pill mb-4">
        <VTab v-for="tab in tabs" :key="tab.icon" :value="tab.value">
          <VIcon :size="18" :icon="tab.icon" class="me-1" />
          <span>{{ tab.title }}</span>
        </VTab>
      </VTabs>
      <v-window v-model="tab">
        <v-window-item value="account">
          <Information />
        </v-window-item>
        <v-window-item value="security">
          <ChangePassword />
        </v-window-item>
      </v-window>
    </VCol>
  </VRow>
</template>

<script>
import { useAuthStore } from "@/store/auth";

import Details from "./partials/Details.vue";
import Information from "./partials/Information.vue";
import ChangePassword from "./partials/ChangePassword.vue";

export default {
  setup() {
    return {
      authStore: useAuthStore()
    };
  },

  components: {
    Details,
    Information,
    ChangePassword
  },

  data() {
    return {
      user: this.authStore.user,

      tab: "account",

      tabs: [
        {
          icon: "tabler-user-cog",
          title: "Compte",
          value: "account"
        },
        {
          icon: "tabler-lock",
          title: "Sécurité",
          value: "security"
        }
      ]
    };
  }
};
</script>
