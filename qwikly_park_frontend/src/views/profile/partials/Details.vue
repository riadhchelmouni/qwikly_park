<template>
  <VRow>
    <VCol cols="12">
      <VCard v-if="user">
        <VCardText class="text-center pt-15">
          <VAvatar rounded :size="100">
            <VImg :src="user.image ? user.image : placeholder" cover></VImg>
          </VAvatar>

          <h6 class="text-h4 mt-4">{{ user.firstname + " " + user.lastname }}</h6>

          <VChip
            label
            color="success"
            size="small"
            class="text-capitalize mt-3"
          >{{ user.role.name }}</VChip>
        </VCardText>

        <VDivider />

        <VCardText>
          <p class="text-sm text-uppercase text-disabled">Détails</p>

          <VList class="card-list mt-2">
            <VListItem>
              <VListItemTitle>
                <h6 class="text-h6">
                  Adresse e-mail:
                  <span class="text-body-1">{{ user.email }}</span>
                </h6>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle>
                <h6 class="text-h6">
                  Numéro de téléphone:
                  <span class="text-body-1">{{ user.phone }}</span>
                </h6>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle>
                <h6 class="text-h6">
                  Rôle:
                  <span class="text-capitalize text-body-1">
                    {{
                    user.role.name
                    }}
                  </span>
                </h6>
              </VListItemTitle>
            </VListItem>
          </VList>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<script>
import { useAuthStore } from "@/store/auth";

import placeholder from "@images/placeholders/user.svg";

export default {
  setup() {
    return {
      authStore: useAuthStore(),
      placeholder
    };
  },

  data() {
    return {
      user: this.authStore.user
    };
  },

  methods: {
    avatarText(value) {
      if (!value) return "";
      const nameArray = value.split(" ");

      return nameArray.map(word => word.charAt(0).toUpperCase()).join("");
    }
  }
};
</script>
