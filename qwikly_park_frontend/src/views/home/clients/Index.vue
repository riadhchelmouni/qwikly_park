<template>
  <VRow>
    <VCol cols="12">
      <h2>Statistiques des clients</h2>
    </VCol>
    <VCol cols="12">
      <CountCard />
    </VCol>
  </VRow>
</template>

<script>
import CountCard from "./cards/Count.vue";

export default {
  components: {
    CountCard
  }
};
</script>
