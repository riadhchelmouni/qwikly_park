<script setup>
import { layoutConfig } from "@layouts";
import { can } from "@layouts/plugins/casl";
import { useLayoutConfigStore } from "@layouts/stores/config";
import { getDynamicI18nProps } from "@layouts/utils";
import { useAuthStore } from "@/store/auth";

const props = defineProps({
  item: {
    type: null,
    required: true
  }
});

const configStore = useLayoutConfigStore();
const shallRenderIcon = configStore.isVerticalNavMini();
const authStore = useAuthStore();

const canDisplayTitle = heading => {
  // Super Admin et Owner voient toutes les sections
  if (authStore.isSuperAdmin || authStore.isOwner) return true;

  switch (heading) {
    case "Services":
      return can("offers") || can("clients") || can("purchases");
    case "Historique des activités":
      return can("activity-histories") || can("archive");
    case "Publicités":
    case "Publicité":
      return can("ads");
    case "Qwikly Planning":
      return can("owners") || can("employees") || can("planning-stats");
    case "Parc":
      return (
        can("parks") || can("stock") || can("events") || can("passes") ||
        can("news") || can("fournisseurs") || can("devis") ||
        can("caisse-stats") || can("paramétrage-financier") || can("fidelite")
      );
    case "Administration":
      return true;
    default:
      return true;
  }
};
</script>

<template>
  <li v-if="canDisplayTitle(item.heading)" class="nav-section-title">
    <div class="title-wrapper">
      <Transition name="vertical-nav-section-title" mode="out-in">
        <Component
          :is="shallRenderIcon ? layoutConfig.app.iconRenderer : layoutConfig.app.i18n.enable ? 'i18n-t' : 'span'"
          :key="shallRenderIcon"
          :class="shallRenderIcon ? 'placeholder-icon' : 'title-text'"
          v-bind="{ ...layoutConfig.icons.sectionTitlePlaceholder, ...getDynamicI18nProps(item.heading, 'span') }"
        >{{ !shallRenderIcon ? item.heading : null }}</Component>
      </Transition>
    </div>
  </li>
</template>
