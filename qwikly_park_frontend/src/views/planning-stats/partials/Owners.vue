<template>
  <VRow>
    <VCol cols="12">
      <h2>Statistiques des propriétaires</h2>
    </VCol>
    <VCol cols="12">
      <CountCard />
    </VCol>
  </VRow>
  <VRow>
    <VCol cols="12">
      <TopOWners />
    </VCol>
  </VRow>
</template>

<script>
import CountCard from "./cards/CountOwners.vue";
import TopOWners from "./tables/TopOWners.vue";

export default {
  components: {
    CountCard,
    TopOWners
  }
};
</script>./cards/CountOwners.vue
