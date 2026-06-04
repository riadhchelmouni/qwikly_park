<script setup>
import navItems from "@/navigation/index";
import { themeConfig } from "@themeConfig";

// Components
import Footer from "@/layouts/components/Footer.vue";
import NavbarThemeSwitcher from "@/layouts/components/NavbarThemeSwitcher.vue";
import UserProfile from "@/layouts/components/UserProfile.vue";
import NavBarI18n from "@core/components/I18n.vue";
import FranchiseSelector from "@/layouts/components/FranchiseSelector.vue";

// @layouts plugin
import { VerticalNavLayout } from "@layouts";
import { useLayoutConfigStore } from "@layouts/stores/config";

const layoutConfig = useLayoutConfigStore();
import { useRoute } from "vue-router";
const route = useRoute();
watch(() => route.name, (newNav) => {
  console.log("NAVIGATED TO:", newNav, route.path);
}, { immediate: true });

// SECTION: Loading Indicator
const isFallbackStateActive = ref(false);
const refLoadingIndicator = ref(null);

watch(
  [isFallbackStateActive, refLoadingIndicator],
  () => {
    if (isFallbackStateActive.value && refLoadingIndicator.value)
      refLoadingIndicator.value.fallbackHandle();
    if (!isFallbackStateActive.value && refLoadingIndicator.value)
      refLoadingIndicator.value.resolveHandle();
  },
  { immediate: true }
);
// !SECTION

function toggleSidebar(toggleOverlay) {
  if (layoutConfig.isLessThanOverlayNavBreakpoint) {
    // Mobile → ouvre l'overlay nav
    toggleOverlay(true);
  } else {
    // Desktop → collapse / expand le sidebar
    layoutConfig.isVerticalNavCollapsed = !layoutConfig.isVerticalNavCollapsed;
  }
}
</script>

<template>
  <VerticalNavLayout :nav-items="navItems">
    <!-- 👉 navbar -->
    <template #navbar="{ toggleVerticalOverlayNavActive }">
      <div class="d-flex h-100 align-center">

        <!-- Toggle sidebar — mobile + desktop -->
        <IconBtn
          class="ms-n2 sidebar-toggle-btn"
          @click="toggleSidebar(toggleVerticalOverlayNavActive)"
        >
          <VIcon
            size="22"
            :icon="layoutConfig.isVerticalNavCollapsed ? 'tabler-layout-sidebar-left-expand' : 'tabler-layout-sidebar-left-collapse'"
          />
        </IconBtn>

        <NavbarThemeSwitcher />
        <FranchiseSelector class="ms-2" />

        <VSpacer />

        <NavBarI18n
          v-if="themeConfig.app.i18n.enable && themeConfig.app.i18n.langConfig?.length"
          :languages="themeConfig.app.i18n.langConfig"
        />
        <UserProfile />
      </div>
    </template>

    <AppLoadingIndicator ref="refLoadingIndicator" />

    <!-- 👉 Pages -->
    <RouterView v-slot="{ Component }">
      <Suspense
        :timeout="0"
        @fallback="isFallbackStateActive = true"
        @resolve="isFallbackStateActive = false"
      >
        <Component :is="Component" />
      </Suspense>
    </RouterView>

    <!-- 👉 Footer -->
    <template #footer>
      <Footer />
    </template>

    <!-- 👉 Customizer -->
    <!-- <TheCustomizer /> -->
  </VerticalNavLayout>
</template>
