/**
 * Unit Tests — EventsList.vue
 * Tests isolated logic: pure functions, computed values, form defaults
 */
import { describe, it, expect, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import EventsList from "@/views/events/tabs/EventsList.vue";

// ── Helper : mount minimal component ────────────────────────────────────────
function mountComponent() {
  return mount(EventsList, {
    global: { stubs: { teleport: true } },
  });
}

// ════════════════════════════════════════════════════════════════════════════
describe("EventsList — defaultForm()", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  it("returns an object with all required fields", () => {
    const form = wrapper.vm.defaultForm();
    expect(form).toHaveProperty("name", "");
    expect(form).toHaveProperty("park_id", null);
    expect(form).toHaveProperty("category", null);
    expect(form).toHaveProperty("status", "active");
    expect(form).toHaveProperty("date_start", "");
    expect(form).toHaveProperty("heure_debut", "");
    expect(form).toHaveProperty("heure_fin", "");
    expect(form).toHaveProperty("image", null);
    expect(form).toHaveProperty("imagePreview", null);
    expect(form).toHaveProperty("prix_billet", "");
    expect(form).toHaveProperty("quantite_billets", "");
    expect(form).toHaveProperty("vente_sur_place", true);
    expect(form).toHaveProperty("vente_en_ligne", false);
    expect(form).toHaveProperty("portique_scan", false);
    expect(form).toHaveProperty("scans_multiples", false);
    expect(form).toHaveProperty("max_scans", "");
  });

  it("returns a fresh object each call (no shared reference)", () => {
    const form1 = wrapper.vm.defaultForm();
    const form2 = wrapper.vm.defaultForm();
    form1.name = "changed";
    expect(form2.name).toBe("");
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("EventsList — statusLabel()", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  it("maps 'active' → 'Actif'",    () => expect(wrapper.vm.statusLabel("active")).toBe("Actif"));
  it("maps 'inactive' → 'Inactif'",() => expect(wrapper.vm.statusLabel("inactive")).toBe("Inactif"));
  it("maps 'full' → 'Complet'",    () => expect(wrapper.vm.statusLabel("full")).toBe("Complet"));
  it("maps 'ended' → 'Terminé'",   () => expect(wrapper.vm.statusLabel("ended")).toBe("Terminé"));
  it("returns unknown status as-is",() => expect(wrapper.vm.statusLabel("unknown")).toBe("unknown"));
});

// ════════════════════════════════════════════════════════════════════════════
describe("EventsList — statusStyle()", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  it("returns green for 'active'",   () => expect(wrapper.vm.statusStyle("active")).toContain("#2E7D32"));
  it("returns red for 'inactive'",   () => expect(wrapper.vm.statusStyle("inactive")).toContain("#c62828"));
  it("returns orange for 'full'",    () => expect(wrapper.vm.statusStyle("full")).toContain("#E65100"));
  it("returns grey for 'ended'",     () => expect(wrapper.vm.statusStyle("ended")).toContain("#757575"));
  it("fallback to grey for unknown", () => expect(wrapper.vm.statusStyle("xyz")).toContain("#757575"));
});

// ════════════════════════════════════════════════════════════════════════════
describe("EventsList — formatDate()", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  it("formats ISO date to DD/MM/YYYY", () => {
    expect(wrapper.vm.formatDate("2026-05-10")).toBe("10/05/2026");
  });

  it("returns '—' for null", () => {
    expect(wrapper.vm.formatDate(null)).toBe("—");
  });

  it("returns '—' for empty string", () => {
    expect(wrapper.vm.formatDate("")).toBe("—");
  });

  it("pads single-digit day and month", () => {
    expect(wrapper.vm.formatDate("2026-01-05")).toBe("05/01/2026");
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("EventsList — parcName()", () => {
  let wrapper;
  beforeEach(async () => {
    wrapper = mountComponent();
    await flushPromises(); // wait for mounted() async calls to finish
    wrapper.vm.parcOptions = [
      { id: 1, name: "Parc Paris" },
      { id: 2, name: "Parc Lyon"  },
    ];
  });

  it("returns the correct park name by id", () => {
    expect(wrapper.vm.parcName(1)).toBe("Parc Paris");
    expect(wrapper.vm.parcName(2)).toBe("Parc Lyon");
  });

  it("returns '—' for unknown id", () => {
    expect(wrapper.vm.parcName(99)).toBe("—");
  });

  it("returns '—' for null id", () => {
    expect(wrapper.vm.parcName(null)).toBe("—");
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("EventsList — openCreate()", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  it("opens formDialog", async () => {
    expect(wrapper.vm.formDialog).toBe(false);
    wrapper.vm.openCreate();
    expect(wrapper.vm.formDialog).toBe(true);
  });

  it("resets form to default", async () => {
    wrapper.vm.form.name = "old event";
    wrapper.vm.openCreate();
    expect(wrapper.vm.form.name).toBe("");
  });

  it("sets step to 1", async () => {
    wrapper.vm.step = 2;
    wrapper.vm.openCreate();
    expect(wrapper.vm.step).toBe(1);
  });

  it("sets isEditing to false", async () => {
    wrapper.vm.isEditing = true;
    wrapper.vm.openCreate();
    expect(wrapper.vm.isEditing).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("EventsList — openDelete()", () => {
  let wrapper;
  const fakeEvent = { id: 5, name: "Fête Printemps", status: "active" };
  beforeEach(() => { wrapper = mountComponent(); });

  it("sets current event", () => {
    wrapper.vm.openDelete(fakeEvent);
    expect(wrapper.vm.current).toEqual(fakeEvent);
  });

  it("opens deleteDialog", () => {
    wrapper.vm.openDelete(fakeEvent);
    expect(wrapper.vm.deleteDialog).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("EventsList — openEdit()", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  const fakeEvent = {
    id: 3, name: "Concert Été", category: "Concert", status: "active",
    date_start: "2026-07-15T00:00:00.000Z", park_id: 2,
    heure_debut: "20:00", heure_fin: "23:00",
    vente_sur_place: false, vente_en_ligne: true,
    portique_scan: true, scans_multiples: false,
    prix_billet: "15.00", quantite_billets: "200",
  };

  it("sets isEditing to true", () => {
    wrapper.vm.openEdit(fakeEvent);
    expect(wrapper.vm.isEditing).toBe(true);
  });

  it("populates form with event data", () => {
    wrapper.vm.openEdit(fakeEvent);
    expect(wrapper.vm.form.name).toBe("Concert Été");
    expect(wrapper.vm.form.category).toBe("Concert");
    expect(wrapper.vm.form.park_id).toBe(2);
    expect(wrapper.vm.form.heure_debut).toBe("20:00");
    expect(wrapper.vm.form.heure_fin).toBe("23:00");
    expect(wrapper.vm.form.vente_en_ligne).toBe(true);
    expect(wrapper.vm.form.vente_sur_place).toBe(false);
    expect(wrapper.vm.form.prix_billet).toBe("15.00");
  });

  it("opens formDialog", () => {
    wrapper.vm.openEdit(fakeEvent);
    expect(wrapper.vm.formDialog).toBe(true);
  });

  it("sets step to 1", () => {
    wrapper.vm.step = 2;
    wrapper.vm.openEdit(fakeEvent);
    expect(wrapper.vm.step).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("EventsList — data initialization", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  it("initializes events as empty array", () => {
    expect(wrapper.vm.events).toEqual([]);
  });

  it("initializes page to 1", () => {
    expect(wrapper.vm.page).toBe(1);
  });

  it("initializes perPage to 12", () => {
    expect(wrapper.vm.perPage).toBe(12);
  });

  it("initializes all dialogs as closed", () => {
    expect(wrapper.vm.formDialog).toBe(false);
    expect(wrapper.vm.deleteDialog).toBe(false);
    expect(wrapper.vm.detailsDialog).toBe(false);
  });

  it("has correct categorie options", () => {
    expect(wrapper.vm.categorieOptions).toContain("Anniversaire");
    expect(wrapper.vm.categorieOptions).toContain("Concert");
    expect(wrapper.vm.categorieOptions).toContain("Sport");
  });

  it("has correct statut options with 4 items", () => {
    expect(wrapper.vm.statutOptions).toHaveLength(4);
    const values = wrapper.vm.statutOptions.map(o => o.value);
    expect(values).toContain("active");
    expect(values).toContain("inactive");
    expect(values).toContain("full");
    expect(values).toContain("ended");
  });
});
