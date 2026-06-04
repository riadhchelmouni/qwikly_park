<template>
  <VCard
    title="Top propriétaires par employés"
    min-height="480"
    :loading="loading"
    class="d-flex flex-column"
  >
    <VCardText>
      <VTable class="text-no-wrap">
        <thead>
          <tr>
            <th scope="col" class="font-weight-semibold">Nom</th>
            <th scope="col" class="font-weight-semibold">Entreprise</th>
            <th scope="col" class="font-weight-semibold">Employés</th>
          </tr>
        </thead>

        <tbody v-if="owners.length">
          <tr v-for="(owner, index) in owners" :key="index">
            <td>
              <h6
                class="text-base text-medium-emphasis font-weight-semibold"
              >{{ owner.firstname + " " + owner.lastname }}</h6>
            </td>
            <td>
              <h6 class="text-base text-medium-emphasis font-weight-semibold">{{ owner.company }}</h6>
            </td>
            <td>
              <h6
                class="text-base text-medium-emphasis font-weight-semibold"
              >{{ owner.employees_count }}</h6>
            </td>
          </tr>
        </tbody>

        <tfoot v-if="!owners.length">
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
      owners: [],

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
          .get(import.meta.env.VITE_BASE_URL + "/owners/top", {
            headers: {
              Authorization: "Bearer " + this.authStore.token
            },
            params: {
              page: page
            }
          })
          .then(res => {
            this.loading = false;
            this.owners = [...res.data.data];
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
