<template>
  <VBadge
    dot
    location="bottom right"
    offset-x="3"
    offset-y="3"
    bordered
    color="success"
  >
    <VAvatar
      class="cursor-pointer"
      color="primary"
      variant="tonal"
      v-if="authStore.user"
    >
      <VImg
        :src="authStore.user?.image ? authStore.user.image : placeholder"
        cover
      />

      <VMenu activator="parent" width="230" location="bottom end" offset="14px">
        <VList>
          <VListItem>
            <template #prepend>
              <VListItemAction start>
                <VBadge
                  dot
                  location="bottom right"
                  offset-x="3"
                  offset-y="3"
                  color="success"
                >
                  <VAvatar color="primary" variant="tonal">
                    <VImg
                      :src="
                        authStore.user?.image
                          ? authStore.user.image
                          : placeholder
                      "
                      cover
                    />
                  </VAvatar>
                </VBadge>
              </VListItemAction>
            </template>

            <VListItemTitle class="font-weight-semibold text-capitalize">{{
              authStore.user.firstname + " " + authStore.user.lastname
            }}</VListItemTitle>
            <VListItemSubtitle class="text-capitalize">
              {{
                Array.isArray(authStore.user?.roles)
                  ? authStore.user.roles.map((role) => role.name).join(", ")
                  : authStore.user?.roles
                  ? authStore.user.roles.name
                  : ""
              }}</VListItemSubtitle
            >
          </VListItem>

          <VDivider class="my-2" />

          <VListItem to="/profile">
            <template #prepend>
              <VIcon class="me-2" icon="tabler-user" size="22" />
            </template>

            <VListItemTitle>Profile</VListItemTitle>
          </VListItem>

          <VListItem @click="confirmLogout">
            <template #prepend>
              <VIcon class="me-2" icon="tabler-logout" size="22" />
            </template>

            <VListItemTitle>Logout</VListItemTitle>
          </VListItem>
        </VList>
      </VMenu>
    </VAvatar>
  </VBadge>

  <VDialog v-model="logoutDialog" class="v-dialog-sm">
    <VCard title="Confirmer la déconnexion">
      <VCardText>Voulez-vous vraiment déconnecter ?</VCardText>

      <VCardText class="d-flex justify-end gap-3 flex-wrap">
        <VBtn color="secondary" variant="tonal" @click="logoutDialog = false"
          >Annuler</VBtn
        >
        <VBtn @click="logout" :loading="loading" :disabled="loading"
          >Confirmer</VBtn
        >
      </VCardText>
    </VCard>
  </VDialog>
</template>

<script>
import { useAuthStore } from "@/store/auth";

import placeholder from "@images/placeholders/user.svg";

export default {
  setup() {
    return {
      authStore: useAuthStore(),
      placeholder,
    };
  },

  data() {
    return {
      logoutDialog: false,
      loading: false,
    };
  },

  methods: {
    confirmLogout() {
      this.logoutDialog = true;
    },

    logout() {
      this.loading = true;
      this.authStore
        .logout()
        .then(() => {
          this.loading = false;
          this.$router.go("/login");
        })
        .catch(() => {
          this.loading = false;
          this.$router.go("/login");
        });
    },
  },
};
</script>
