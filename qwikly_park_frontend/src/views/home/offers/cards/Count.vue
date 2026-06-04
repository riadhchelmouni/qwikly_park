<template>
  <VRow>
    <VCol v-for="item in statistics" :key="item.title" cols="12" sm="6" md="4">
      <CardStatisticsHorizontal
        :title="item.title"
        :color="item.color"
        :stats="item.stats"
        :icon="item.icon"
      />
    </VCol>
  </VRow>

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
      statistics: [
        {
          title: "Nombre total d'offres",
          stats: "0",
          icon: "tabler-discount-2",
          color: "info"
        },
        {
          title: "Nombre d'offres actives",
          stats: "0",
          icon: "tabler-discount-check",
          color: "success"
        },
        {
          title: "Nombre d'offres inactives",
          stats: "0",
          icon: "tabler-discount-2-off",
          color: "error"
        }
      ],

      isSnackbarVisible: false,
      snackBarDetails: {
        message: "",
        color: ""
      }
    };
  },

  async created() {
    await this.getCount();
  },

  methods: {
    async getCount() {
      new Promise((resolve, reject) => {
        axios
          .get(import.meta.env.VITE_BASE_URL + "/offers/count", {
            headers: {
              Authorization: "Bearer " + this.authStore.token
            }
          })
          .then(res => {
            this.statistics[0].stats = res.data.count
              .reduce((accumulator, status) => {
                return accumulator + status.count;
              }, 0)
              .toString();
            const approved = res.data.count.find(status => status.status);
            const refused = res.data.count.find(status => !status.status);
            this.statistics[1].stats = approved
              ? approved.count.toString()
              : "0";
            this.statistics[2].stats = refused ? refused.count.toString() : "0";
            resolve(res);
          })
          .catch(err => {
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
