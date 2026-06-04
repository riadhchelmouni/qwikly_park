<template>
  <VRow>
    <VCol cols="12">
      <h2>Statistiques des employés</h2>
    </VCol>
    <VCol cols="12">
      <CountCard />
    </VCol>
  </VRow>
</template>

<script>
import CountCard from "./cards/CountEmployees.vue";

export default {
  components: {
    CountCard
  }
};
</script>./cards/CountOwners.vue
