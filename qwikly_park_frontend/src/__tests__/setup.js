import { vi } from "vitest";
import { config } from "@vue/test-utils";


// ── Mock Vuetify labs modules (avoid CSS imports from node_modules) ──────────
vi.mock("vuetify/labs/VDataTable", () => ({
  VDataTableServer: { name: "VDataTableServer", template: "<div><slot /></div>" },
  VDataTable:       { name: "VDataTable",       template: "<div><slot /></div>" },
}));

// ── Mock axios globally ──────────────────────────────────────────────────────
vi.mock("axios", () => ({
  default: {
    get:    vi.fn().mockResolvedValue({ data: { data: [], total: 0 } }),
    post:   vi.fn().mockResolvedValue({ data: {} }),
    put:    vi.fn().mockResolvedValue({ data: {} }),
    patch:  vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

// ── Mock Pinia auth store ────────────────────────────────────────────────────
vi.mock("@/store/auth", () => ({
  useAuthStore: () => ({
    token: "fake-test-token",
    user:  { id: 1, name: "Test Admin" },
  }),
}));

// ── Mock import.meta.env ─────────────────────────────────────────────────────
vi.stubEnv("VITE_BASE_URL", "http://localhost:8000/api/admin");
vi.stubEnv("VITE_API_KEY",  "test-api-key");

// ── Stub Vuetify/Tabler components globally ──────────────────────────────────
// Avoids "Failed to resolve component" warnings without mounting full Vuetify
// Components that render their slot unconditionally
const slotComponents = [
  "VCard","VCardText","VCardTitle","VCardActions",
  "VBtn","VIcon","VChip","VRow","VCol","VDivider",
  "VTextField","VTextarea","VSelect","VForm","VImg",
  "VSnackbar","VSwitch","VCheckbox","VProgressCircular",
  "VPagination","VTable","VTabs","VTab","VAvatar","VSpacer",
  "VTooltip","VMenu","VList","VListItem","VNavigationDrawer",
  "IconBtn","AppTextField","AppSelect","AppTextarea","AppDateTimePicker",
  "PerfectScrollbar","AppDrawerHeaderSection",
  "VDataTableServer",
];

// Components that MUST NOT render slot content
const emptyComponents = [
  "VDialog","VWindow","VWindowItem",
];

// VForm stub with validate() always passing — avoids needing real Vuetify form
const VFormStub = {
  template: `<form class="stub-vform"><slot /></form>`,
  methods: {
    validate: async () => ({ valid: true }),
    reset: () => {},
    resetValidation: () => {},
  },
};

const stubs = {};
slotComponents.forEach(name => {
  stubs[name] = { template: `<div class="stub-${name.toLowerCase()}"><slot /></div>` };
});
emptyComponents.forEach(name => {
  stubs[name] = { template: `<div class="stub-${name.toLowerCase()}"></div>` };
});

// Override VForm with the validate-capable stub
stubs["VForm"] = VFormStub;

config.global.stubs = stubs;
