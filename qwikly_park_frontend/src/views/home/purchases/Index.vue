<template>
  <VRow>
    <VCol cols="12">
      <h2>Statistiques d'achats et de licences</h2>
    </VCol>
    <VCol cols="12">
      <CountCard />
    </VCol>
    <VCol cols="12">
      <TopEarnings />
    </VCol>
  </VRow>
</template>

<script>
import CountCard from "./cards/Count.vue";
import TopEarnings from "./tables/TopEarnings.vue";

export default {
  components: {
    CountCard,
    TopEarnings
  }
};
</script>
