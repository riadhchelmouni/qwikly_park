<template>
  <VRow>
    <VCol v-for="item in statistics" :key="item.title" cols="12" sm="6" md="3">
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
          title: "Nombre total d'achats",
          stats: "0",
          icon: "tabler-shopping-cart",
          color: "info"
        },
        {
          title: "Nombre total de licences",
          stats: "0",
          icon: "tabler-license",
          color: "info"
        },
        {
          title: "Nombre de licenses actives",
          stats: "0",
          icon: "tabler-license",
          color: "success"
        },
        {
          title: "Nombre de licenses inactives",
          stats: "0",
          icon: "tabler-license-off",
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
          .get(import.meta.env.VITE_BASE_URL + "/purchases/count", {
            headers: {
              Authorization: "Bearer " + this.authStore.token
            }
          })
          .then(res => {
            this.statistics[0].stats = res.data.purchases_count.toString();
            this.statistics[1].stats = res.data.licenses_count
              .reduce((accumulator, status) => {
                return accumulator + status.count;
              }, 0)
              .toString();
            const approved = res.data.licenses_count.find(
              status => status.status
            );
            const refused = res.data.licenses_count.find(
              status => !status.status
            );
            this.statistics[2].stats = approved
              ? approved.count.toString()
              : "0";
            this.statistics[3].stats = refused ? refused.count.toString() : "0";
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
