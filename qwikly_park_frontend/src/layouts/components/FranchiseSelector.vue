<template>
  <!-- Super Admin : dropdown franchise sans overlay/scrim -->
  <div v-if="authStore.isSuperAdmin" class="franchise-selector">
    <VMenu v-model="menuOpen" :close-on-content-click="true" location="bottom start" :scrim="false" offset="4">
      <template #activator="{ props: menuProps }">
        <button v-bind="menuProps" class="franchise-btn">
          <VIcon icon="tabler-building-community" size="15" style="color:#9e9e9e" class="me-1" />
          <span class="franchise-btn__label">{{ selectedLabel }}</span>
          <VIcon icon="tabler-chevron-down" size="14" style="color:#9e9e9e" class="ms-1"
            :style="menuOpen ? 'transform:rotate(180deg)' : ''" />
        </button>
      </template>

      <VCard style="border-radius:10px;min-width:210px;overflow:hidden" elevation="4">
        <VList density="compact" nav>
          <!-- Tous les parcs -->
          <VListItem
            prepend-icon="tabler-layout-grid"
            title="Tous les parcs"
            :active="selected === null"
            active-color="#1a1a2e"
            rounded="lg"
            @click="select(null)"
          />
          <VDivider class="my-1" />
          <!-- Chargement -->
          <VListItem v-if="loading">
            <div class="d-flex align-center gap-2 py-1">
              <VProgressCircular size="14" indeterminate color="#E8A838" />
              <span style="font-size:12px;color:#9e9e9e">Chargement…</span>
            </div>
          </VListItem>
          <!-- Liste parcs -->
          <VListItem
            v-for="p in parks"
            :key="p.id"
            :title="p.name"
            prepend-icon="tabler-building"
            :active="selected === p.id"
            active-color="#1a1a2e"
            rounded="lg"
            @click="select(p.id)"
          />
          <VListItem v-if="!loading && !parks.length" disabled>
            <span style="font-size:12px;color:#9e9e9e">Aucun parc</span>
          </VListItem>
        </VList>
      </VCard>
    </VMenu>
  </div>

  <!-- Admin de Franchise : badge simple -->
  <div v-else-if="authStore.user?.franchise" class="franchise-badge d-flex align-center gap-1 px-3 py-1">
    <VIcon icon="tabler-building-community" size="15" color="#E8A838" />
    <span style="font-size:12px;font-weight:600;color:#1a1a2e">
      {{ authStore.user.franchise.name }}
    </span>
  </div>
</template>

<script>
import axios from "axios";
import { useAuthStore } from "@/store/auth";

export default {
  setup() { return { authStore: useAuthStore() }; },

  data() {
    return {
      parks: [],
      selected: this.authStore.selectedParkId ?? null,
      loading: false,
      menuOpen: false,
    };
  },

  computed: {
    selectedLabel() {
      if (!this.selected) return "Tous les parcs";
      const p = this.parks.find(x => x.id === this.selected);
      return p ? p.name : "Tous les parcs";
    },
  },

  mounted() {
    if (this.authStore.isSuperAdmin) {
      this.loadParks();
    }
  },

  methods: {
    async loadParks() {
      this.loading = true;
      try {
        const res = await axios.get(import.meta.env.VITE_BASE_URL + "/parks", {
          headers: {
            Authorization: "Bearer " + this.authStore.token,
            "X-Authorization": import.meta.env.VITE_API_KEY,
          },
          params: { per_page: 200 },
        });
        this.parks = res.data.data || res.data || [];
      } catch { /* silent */ } finally {
        this.loading = false;
      }
    },

    select(id) {
      this.selected = id;
      this.authStore.selectPark(id);
      this.menuOpen = false;
    },
  },
};
</script>

<style scoped>
.franchise-selector { position: relative; }

.franchise-btn {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1.5px solid #e0e0e0;
  background: #f5f5f5;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
  gap: 2px;
  transition: border-color 0.15s, background 0.15s;
}
.franchise-btn:hover { border-color: #E8A838; background: #FFF8E1; }
.franchise-btn__label { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.franchise-badge {
  background: #FFF8EC;
  border: 1px solid #E8A838;
  border-radius: 20px;
}
</style>
