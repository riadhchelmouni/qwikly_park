<template>
  <VCard
    title="Meilleurs achats par revenus"
    min-height="480"
    :loading="loading"
    class="d-flex flex-column"
  >
    <VCardText>
      <VTable class="text-no-wrap">
        <thead>
          <tr>
            <th scope="col" class="font-weight-semibold">Code</th>
            <th scope="col" class="font-weight-semibold">Client</th>
            <th scope="col" class="font-weight-semibold">Offre</th>
            <th scope="col" class="font-weight-semibold">Nombre des licenses</th>
            <th scope="col" class="font-weight-semibold">Total</th>
          </tr>
        </thead>

        <tbody v-if="purchases.length">
          <tr v-for="(purchase, index) in purchases" :key="index">
            <td>
              <h6 class="text-base text-medium-emphasis font-weight-semibold">{{ purchase.code }}</h6>
            </td>
            <td>
              <h6
                class="text-base text-medium-emphasis font-weight-semibold"
              >{{ purchase.client.user.firstname + " " + purchase.client.user.lastname }}</h6>
            </td>
            <td>
              <h6
                class="text-base text-medium-emphasis font-weight-semibold"
              >{{ purchase.offer.name }}</h6>
            </td>
            <td>
              <h6
                class="text-base text-medium-emphasis font-weight-semibold"
              >{{ purchase.licenses }}</h6>
            </td>
            <td>
              <h6
                class="text-base text-medium-emphasis font-weight-semibold"
              >{{ purchase.total }} DA</h6>
            </td>
          </tr>
        </tbody>

        <tfoot v-if="!purchases.length">
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
      purchases: [],

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
          .get(import.meta.env.VITE_BASE_URL + "/purchases/top-earnings", {
            headers: {
              Authorization: "Bearer " + this.authStore.token
            },
            params: {
              page: page
            }
          })
          .then(res => {
            this.loading = false;
            this.purchases = [...res.data.data];
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
