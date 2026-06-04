<template>
  <VRow>
    <VCol cols="12">
      <h2>Statistiques des offres</h2>
    </VCol>
    <VCol cols="12">
      <CountCard />
    </VCol>
    <VCol cols="6">
      <TopEarnings />
    </VCol>
    <VCol cols="6">
      <TopPurchases />
    </VCol>
  </VRow>
</template>

<script>
import CountCard from "./cards/Count.vue";
import TopEarnings from "./tables/TopEarnings.vue";
import TopPurchases from "./tables/TopPurchases.vue";

export default {
  components: {
    CountCard,
    TopEarnings,
    TopPurchases
  }
};
</script>
