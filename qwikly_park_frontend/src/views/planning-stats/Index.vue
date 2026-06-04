<template>
  <Employees v-if="$can('employees-stats')" />
  <Owners v-if="$can('owners-stats')" />
</template>

<script>
import Owners from "./partials/Owners.vue";
import Employees from "./partials/Employees.vue";

export default {
  components: {
    Owners,
    Employees
  }
};
</script>
