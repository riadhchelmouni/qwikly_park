<template>
  <VCard
    title="Meilleures offres par achats"
    min-height="480"
    :loading="loading"
    class="d-flex flex-column"
  >
    <VCardText>
      <VTable class="text-no-wrap">
        <thead>
          <tr>
            <th scope="col" class="font-weight-semibold">Nom</th>
            <th scope="col" class="font-weight-semibold">Achats</th>
            <th scope="col" class="font-weight-semibold">Licences</th>
          </tr>
        </thead>

        <tbody v-if="offers.length">
          <tr v-for="(offer, index) in offers" :key="index">
            <td>
              <h6 class="text-base text-medium-emphasis font-weight-semibold">{{ offer.name }}</h6>
            </td>
            <td>
              <h6
                class="text-base text-medium-emphasis font-weight-semibold"
              >{{ offer.purchases_count }}</h6>
            </td>
            <td>
              <h6
                class="text-base text-medium-emphasis font-weight-semibold"
              >{{ offer.licenses_count }}</h6>
            </td>
          </tr>
        </tbody>

        <tfoot v-if="!offers.length">
          <tr>
            <td colspan="8" class="text-center text-body-1">Pas de données disponibles</td>
          </tr>
        </tfoot>
      </VTable>
    </VCardText>

    <VDivider />

    <VCardActions class="d-flex align-center justify-space-between pagination">
      <div></div>
      <VPagination
        v-model="page"
        size="small"
        :total-visible="3"
        :length="totalPages"
        @update:modelValue="getTopEarnings"
      />
    </VCardActions>
  </VCard>

  <VSnackbar
    v-model="isSnackbarVisible"
    location="bottom end"
    variant="flat"
    :color="snackBarDetails.color"
  >{{ snackBarDetails.message }}</VSnackbar>
</template>

<script>
import axios from "axios";
import { useAuthStore } from "@/store/auth";

export default {
  setup() {
    return {
      authStore: useAuthStore()
    };
  },

  data() {
    return {
      offers: [],

      page: 1,
      totalPages: 1,
      loading: false,

      isSnackbarVisible: false,
      snackBarDetails: {
        message: "",
        color: ""
      }
    };
  },

  async mounted() {
    await this.getTopEarnings();
  },

  methods: {
    async getTopEarnings(page = 1) {
      this.loading = true;
      new Promise((resolve, reject) => {
        axios
          .get(import.meta.env.VITE_BASE_URL + "/offers/top-purchases", {
            headers: {
              Authorization: "Bearer " + this.authStore.token
            },
            params: {
              page: page
            }
          })
          .then(res => {
            this.loading = false;
            this.offers = [...res.data.data];
            this.totalPages = res.data.total_pages;
            resolve(res);
          })
          .catch(err => {
            this.loading = false;
            this.showSnackbar({
              message: "Impossible de récupérer les données",
              color: "error"
            });
            reject(err);
          });
      });
    },

    showSnackbar({ message, color }) {
      this.isSnackbarVisible = true;
      this.snackBarDetails.message = message;
      this.snackBarDetails.color = color;
    }
  }
};
</script>
