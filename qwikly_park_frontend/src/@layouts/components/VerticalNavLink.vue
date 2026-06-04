<script setup>
import { layoutConfig } from "@layouts";
import { can } from "@layouts/plugins/casl";
import { useLayoutConfigStore } from "@layouts/stores/config";
import {
  getComputedNavLinkToProp,
  getDynamicI18nProps,
  isNavLinkActive
} from "@layouts/utils";
import { useAuthStore } from "@/store/auth";

const props = defineProps({
  item: {
    type: null,
    required: true
  }
});

const configStore = useLayoutConfigStore();
const hideTitleAndBadge = configStore.isVerticalNavMini();
const authStore = useAuthStore();

const check = item => {
  // Pas de restriction d'action → toujours visible (ex: Accueil, Profile)
  if (!item.action) return true;
  // Super Admin et Owner voient tout
  if (authStore.isSuperAdmin || authStore.isOwner) return true;
  // Autres rôles → vérification CASL
  return can(item.action);
};
</script>

<template>
  <li v-if="check(item)" class="nav-link" :class="{ disabled: item.disable }">
    <Component
      :is="item.to ? 'RouterLink' : 'a'"
      v-bind="getComputedNavLinkToProp(item)"
      :class="{ 'router-link-active router-link-exact-active': isNavLinkActive(item, $router) }"
    >
      <Component
        :is="layoutConfig.app.iconRenderer || 'div'"
        v-bind="item.icon || layoutConfig.verticalNav.defaultNavItemIconProps"
        class="nav-item-icon"
      />
      <TransitionGroup name="transition-slide-x">
        <!-- 👉 Title -->
        <Component
          :is="layoutConfig.app.i18n.enable ? 'i18n-t' : 'span'"
          v-show="!hideTitleAndBadge"
          key="title"
          class="nav-item-title"
          v-bind="getDynamicI18nProps(item.title, 'span')"
        >{{ item.title }}</Component>

        <!-- 👉 Badge -->
        <Component
          :is="layoutConfig.app.i18n.enable ? 'i18n-t' : 'span'"
          v-if="item.badgeContent"
          v-show="!hideTitleAndBadge"
          key="badge"
          class="nav-item-badge"
          :class="item.badgeClass"
          v-bind="getDynamicI18nProps(item.badgeContent, 'span')"
        >{{ item.badgeContent }}</Component>
      </TransitionGroup>
    </Component>
  </li>
</template>

<style lang="scss">
.layout-vertical-nav {
  .nav-link a {
    display: flex;
    align-items: center;
  }
}
</style>
