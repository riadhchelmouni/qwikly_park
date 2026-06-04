import { setupLayouts } from "virtual:generated-layouts";
// eslint-disable-next-line import/no-unresolved
import { createRouter, createWebHistory } from "vue-router/auto";

import { isUserLoggedIn } from "./utils";
import { canNavigate } from "@layouts/plugins/casl";

import { useAuthStore } from "@store/auth";

function recursiveLayouts(route) {
  if (route.children) {
    for (let i = 0; i < route.children.length; i++)
      route.children[i] = recursiveLayouts(route.children[i]);

    return route;
  }

  return setupLayouts([route])[0];
}

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, behavior: "smooth", top: 60 };

    return { top: 0 };
  },
  extendRoutes: (pages) => [
    ...[...pages].map((route) => recursiveLayouts(route)),
  ],
});

router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  if (to.name === "terms" || to.name === "privacy") {
    next();
  } else if (
    to.name !== "login" &&
    to.name !== "forgot-password" &&
    to.name !== "reset-password"
  ) {
    if (isUserLoggedIn(auth)) {
      if (
        to.name === "root" ||
        to.name === "planning-stats" ||
        to.name === "profile" ||
        to.name === "clients" ||
        to.name === "services-clients" ||
        to.name === "parks" ||
        to.name === "events" ||
        to.name === "stock" ||
        to.name === "passes" ||
        to.name === "news" ||
        to.name === "fournisseurs" ||
        to.name === "caisse-stats" ||
        to.name === "fidelite" ||
        to.name === "paramétrage-financier" ||
        to.name === "users-planning" ||
        to.name === "roles-planning" ||
        to.name === "programs" ||
        to.name === "demandes-planning" ||
        canNavigate(to.name)
      ) {
        next();
      } else {
        next("/");
      }
    } else {
      next({ name: "login" });
    }
  } else {
    if (isUserLoggedIn(auth)) {
      next("/");
    } else {
      next();
    }
  }
});

export { router };
export default function (app) {
  app.use(router);
}
