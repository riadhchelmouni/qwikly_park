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
          title: "Nombre total de clients",
          stats: "0",
          icon: "tabler-users",
          color: "success"
        },
        {
          title: "Nombre de clients approuvés",
          stats: "0",
          icon: "tabler-user-check",
          color: "info"
        },
        {
          title: "Nombre de clients en attente",
          stats: "0",
          icon: "tabler-user-pause",
          color: "warning"
        },
        {
          title: "Nombre de clients refusés",
          stats: "0",
          icon: "tabler-user-cancel",
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
          .get(import.meta.env.VITE_BASE_URL + "/clients/count", {
            headers: {
              Authorization: "Bearer " + this.authStore.token,
              "X-Authorization": import.meta.env.VITE_API_KEY
            }
          })
          .then(res => {
            this.statistics[0].stats = res.data.count
              .reduce((accumulator, status) => {
                return accumulator + status.count;
              }, 0)
              .toString();
            const approved = res.data.count.find(
              status => status.status === "approved"
            );
            const waiting = res.data.count.find(
              status => status.status === "waiting"
            );
            const refused = res.data.count.find(
              status => status.status === "refused"
            );
            this.statistics[1].stats = approved
              ? approved.count.toString()
              : "0";
            this.statistics[2].stats = waiting ? waiting.count.toString() : "0";
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
