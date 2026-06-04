<script>
import axios from "axios";

import Echo from "laravel-echo";
import Pusher from "pusher-js";

import { useAuthStore } from "@store/auth";

import ScrollToTop from "@core/components/ScrollToTop.vue";
import { useTheme } from "vuetify";
import initCore from "@core/initCore";
import { initConfigStore, useConfigStore } from "@core/stores/config";
import { hexToRgb } from "@layouts/utils";

export default {
  setup() {
    const { global } = useTheme();

    // ℹ️ Sync current theme with initial loader theme
    initCore();
    initConfigStore();

    const configStore = useConfigStore();

    return {
      authStore: useAuthStore(),
      configStore,
      global,
      hexToRgb
    };
  },

  created() {
    if (this.authStore.user) {
      this.getUser();
    } else {
      this.refreshed = true;
    }
  },

  data() {
    return {
      refreshed: false
    };
  },

  methods: {
    getUser() {
      this.authStore
        .getUser()
        .then(async () => {
          await this.getPermissions();
          this.listenToUserStatusChanges();
          this.refreshed = true;
        })
        .catch(err => {
          // Handle any auth failure — clear session and go to login
          this.refreshed = true;
          this.authStore.user = null;
          this.authStore.token = null;
          this.$router.push({ name: "login" });
        });
    },

    listenToUserStatusChanges() {
      window.Pusher = Pusher;

      window.Echo = new Echo({
        broadcaster: "pusher",
        key: import.meta.env.VITE_PUSHER_APP_KEY,
        cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
        authEndpoint:
          import.meta.env.VITE_API_BASE_URL + "/api/broadcasting/auth",
        auth: {
          headers: {
            Authorization: "Bearer " + this.authStore.token
          }
        }
      });

      window.Echo.listen(
        "private-blocked-users." + this.authStore.user.id,
        ".blocked",
        async () => {
          this.authStore.user = null;
          this.authStore.token = null;
          this.$router.go("/login");
        }
      );
    },

    async getPermissions() {
      new Promise((resolve, reject) => {
        axios
          .get(`${import.meta.env.VITE_BASE_URL}/permissions`, {
            headers: {
              Authorization: "Bearer " + this.authStore.token,
              "X-Authorization": import.meta.env.VITE_API_KEY
            }
          })
          .then(res => {
            this.$ability.update(res.data);
            localStorage.userAbilities = JSON.stringify(res.data);
            resolve(res);
          })
          .catch(err => {
            reject(err);
          });
      });
    }
  }
};
</script>

<template>
  <VLocaleProvider :rtl="configStore.isAppRTL">
    <!-- ℹ️ This is required to set the background color of active nav link based on currently active global theme's primary -->
    <VApp :style="`--v-global-theme-primary: ${hexToRgb(global.current.value.colors.primary)}`">
      <RouterView v-if="refreshed" />

      <ScrollToTop />
    </VApp>
  </VLocaleProvider>
</template>
