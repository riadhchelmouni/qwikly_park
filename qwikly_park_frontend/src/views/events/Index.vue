<template>
  <div>
    <!-- ══ Titre ══ -->
    <div class="mb-4">
      <h1 class="text-h5 font-weight-bold" style="color:#1a1a2e">Évènements & Billetterie</h1>
      <span style="font-size:13px;color:#9e9e9e">Gestion centralisée multi-parcs</span>
    </div>

    <!-- ══ TAB BAR — pleine largeur ══ -->
    <div class="tab-bar mb-5">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="activeTab === tab.key ? 'tab-btn--active' : 'tab-btn--inactive'"
        @click="activeTab = tab.key"
      >
        <VIcon :icon="tab.icon" size="15" class="me-2" />
        {{ tab.label }}
      </button>
    </div>

    <!-- ══ Contenu ══ -->
    <EventsList       v-if="activeTab === 'events'" />
    <CreneauxList     v-else-if="activeTab === 'creneaux'" />
    <AnniversairesList v-else-if="activeTab === 'anniversaires'" />
  </div>
</template>

<script>
import EventsList        from "./tabs/EventsList.vue";
import CreneauxList      from "./tabs/CreneauxList.vue";
import AnniversairesList from "./tabs/AnniversairesList.vue";

export default {
  components: { EventsList, CreneauxList, AnniversairesList },
  data() {
    return {
      activeTab: "events",
      tabs: [
        { key: "events",        label: "Évènements & Billetterie", icon: "tabler-calendar-event" },
        { key: "creneaux",      label: "Créneaux Et Réservations", icon: "tabler-clock"          },
        { key: "anniversaires", label: "Formules D'anniversaires", icon: "tabler-cake"           },
      ],
    };
  },
};
</script>

<style scoped>
/* ── Tab bar pleine largeur ── */
.tab-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #E8A838;
}

.tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 13px 16px;
  border: none;
  cursor: pointer;
  font-weight: 700;
  font-size: 13px;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
  gap: 6px;
}

/* Actif → navy foncé */
.tab-btn--active {
  background: #1a1a2e;
  color: #fff;
}

/* Inactif → or/doré */
.tab-btn--inactive {
  background: #E8A838;
  color: #1a1a2e;
}

.tab-btn--inactive:hover {
  background: #d4942b;
}
</style>
