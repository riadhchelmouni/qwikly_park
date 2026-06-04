/**
 * Unit Tests — Parks List.vue
 * Tests: status helpers, defaultPark, filteredParks computed, tarifs management
 */
import { describe, it, expect, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import ParksList from "@/views/parks/list/List.vue";

function mountComponent() {
  return mount(ParksList, {
    global: { stubs: { teleport: true } },
  });
}

// ════════════════════════════════════════════════════════════════════════════
describe("ParksList — getParkStatusColor()", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  it("returns 'success' for open",       () => expect(wrapper.vm.getParkStatusColor("open")).toBe("success"));
  it("returns 'error' for closed",       () => expect(wrapper.vm.getParkStatusColor("closed")).toBe("error"));
  it("returns 'warning' for maintenance",() => expect(wrapper.vm.getParkStatusColor("maintenance")).toBe("warning"));
  it("returns 'default' for unknown",    () => expect(wrapper.vm.getParkStatusColor("xyz")).toBe("default"));
});

// ════════════════════════════════════════════════════════════════════════════
describe("ParksList — getParkStatusLabel()", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  it("maps 'open' → 'Ouvert'",                 () => expect(wrapper.vm.getParkStatusLabel("open")).toBe("Ouvert"));
  it("maps 'closed' → 'Fermé'",               () => expect(wrapper.vm.getParkStatusLabel("closed")).toBe("Fermé"));
  it("maps 'maintenance' → 'En maintenance'", () => expect(wrapper.vm.getParkStatusLabel("maintenance")).toBe("En maintenance"));
  it("returns the raw value for unknown",      () => expect(wrapper.vm.getParkStatusLabel("draft")).toBe("draft"));
});

// ════════════════════════════════════════════════════════════════════════════
describe("ParksList — getDefaultPark()", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  it("returns all required top-level fields", () => {
    const p = wrapper.vm.getDefaultPark();
    expect(p).toHaveProperty("franchise_id", null);
    expect(p).toHaveProperty("localisation", "");
    expect(p).toHaveProperty("status", "open");
    expect(p).toHaveProperty("image", null);
    expect(p).toHaveProperty("imagePreview", null);
    expect(p.tarifs).toEqual([]);
  });

  it("initialises horaires for all weekdays", () => {
    const p = wrapper.vm.getDefaultPark();
    ["monday","tuesday","wednesday","thursday","friday"].forEach(day => {
      expect(p.horaires).toHaveProperty(day);
      expect(p.horaires[day]).toHaveProperty("open");
      expect(p.horaires[day]).toHaveProperty("close");
    });
  });

  it("initialises horaires.vacances", () => {
    const p = wrapper.vm.getDefaultPark();
    expect(p.horaires.vacances).toHaveProperty("open");
    expect(p.horaires.vacances).toHaveProperty("close");
  });

  it("initialises notes with correct boolean defaults", () => {
    const { notes } = wrapper.vm.getDefaultPark();
    expect(notes.chaussettes).toBe(false);
    expect(notes.wifi).toBe(false);
    expect(notes.climatise).toBe(false);
    expect(notes.pique_nique).toBe(false);
  });

  it("initialises jeux sections", () => {
    const { jeux } = wrapper.vm.getDefaultPark();
    expect(jeux).toHaveProperty("petits");
    expect(jeux).toHaveProperty("grands");
    expect(jeux).toHaveProperty("parents");
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("ParksList — addTarif() / removeTarif()", () => {
  let wrapper;
  beforeEach(async () => { wrapper = mountComponent(); await flushPromises(); });

  it("addTarif() pushes a new tarif with all fields", () => {
    expect(wrapper.vm.newPark.tarifs).toHaveLength(0);
    wrapper.vm.addTarif();
    expect(wrapper.vm.newPark.tarifs).toHaveLength(1);
    expect(wrapper.vm.newPark.tarifs[0]).toMatchObject({
      title: "", price: "", categorie: "", details: "",
    });
  });

  it("addTarif() can add multiple tarifs", () => {
    wrapper.vm.addTarif();
    wrapper.vm.addTarif();
    wrapper.vm.addTarif();
    expect(wrapper.vm.newPark.tarifs).toHaveLength(3);
  });

  it("removeTarif(idx) removes the correct tarif", () => {
    wrapper.vm.addTarif();
    wrapper.vm.addTarif();
    wrapper.vm.newPark.tarifs[0].title = "Enfant";
    wrapper.vm.newPark.tarifs[1].title = "Adulte";
    wrapper.vm.removeTarif(0);
    expect(wrapper.vm.newPark.tarifs).toHaveLength(1);
    expect(wrapper.vm.newPark.tarifs[0].title).toBe("Adulte");
  });

  it("removeTarif() on last tarif leaves empty array", () => {
    wrapper.vm.addTarif();
    wrapper.vm.removeTarif(0);
    expect(wrapper.vm.newPark.tarifs).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("ParksList — filteredParks computed", () => {
  let wrapper;

  const parks = [
    { id: 1, nom: "Royal Kids Paris",  localisation: "Paris",    status: "open",   franchise_id: 10 },
    { id: 2, nom: "Fun Zone Lyon",     localisation: "Lyon",     status: "closed", franchise_id: 20 },
    { id: 3, nom: "Jump Arena Lille",  localisation: "Lille",    status: "open",   franchise_id: 10 },
  ];

  beforeEach(async () => {
    wrapper = mountComponent();
    await flushPromises(); // wait for mounted() async calls to complete
    wrapper.vm.parks = [...parks];
    wrapper.vm.appliedParkFilter = { franchise_id: null, status: null, localisation: "" };
    wrapper.vm.parkSearch = "";
  });

  it("returns all parks when no filter/search applied", () => {
    expect(wrapper.vm.filteredParks).toHaveLength(3);
  });

  it("filters by parkSearch (nom)", async () => {
    wrapper.vm.parkSearch = "royal";
    expect(wrapper.vm.filteredParks).toHaveLength(1);
    expect(wrapper.vm.filteredParks[0].id).toBe(1);
  });

  it("filters by parkSearch (localisation)", async () => {
    wrapper.vm.parkSearch = "lyon";
    expect(wrapper.vm.filteredParks).toHaveLength(1);
    expect(wrapper.vm.filteredParks[0].id).toBe(2);
  });

  it("search is case-insensitive", () => {
    wrapper.vm.parkSearch = "PARIS";
    expect(wrapper.vm.filteredParks).toHaveLength(1);
  });

  it("ignores search shorter than 2 characters", () => {
    wrapper.vm.parkSearch = "P";
    expect(wrapper.vm.filteredParks).toHaveLength(3);
  });

  it("filters by status (closed)", () => {
    wrapper.vm.appliedParkFilter = { franchise_id: null, status: "closed", localisation: "" };
    expect(wrapper.vm.filteredParks).toHaveLength(1);
    expect(wrapper.vm.filteredParks[0].id).toBe(2);
  });

  it("filters by franchise_id", () => {
    wrapper.vm.appliedParkFilter = { franchise_id: 10, status: null, localisation: "" };
    expect(wrapper.vm.filteredParks).toHaveLength(2);
  });

  it("filters by localisation", () => {
    wrapper.vm.appliedParkFilter = { franchise_id: null, status: null, localisation: "Lille" };
    expect(wrapper.vm.filteredParks).toHaveLength(1);
    expect(wrapper.vm.filteredParks[0].id).toBe(3);
  });

  it("combines status + franchise_id filters", () => {
    wrapper.vm.appliedParkFilter = { franchise_id: 10, status: "open", localisation: "" };
    expect(wrapper.vm.filteredParks).toHaveLength(2);
  });

  it("returns empty array when no park matches", () => {
    wrapper.vm.parkSearch = "nonexistent_park_xyz";
    expect(wrapper.vm.filteredParks).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("ParksList — createPark modal steps", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  it("openCreateParkModal() opens dialog at step 1", () => {
    wrapper.vm.createParkStep = 3;
    wrapper.vm.openCreateParkModal();
    expect(wrapper.vm.createParkDialog).toBe(true);
    expect(wrapper.vm.createParkStep).toBe(1);
  });

  it("nextParkStep() increments step", () => {
    wrapper.vm.createParkStep = 1;
    wrapper.vm.nextParkStep();
    expect(wrapper.vm.createParkStep).toBe(2);
  });

  it("prevParkStep() decrements step", () => {
    wrapper.vm.createParkStep = 2;
    wrapper.vm.prevParkStep();
    expect(wrapper.vm.createParkStep).toBe(1);
  });

  it("prevParkStep() does not go below 1", () => {
    wrapper.vm.createParkStep = 1;
    wrapper.vm.prevParkStep();
    expect(wrapper.vm.createParkStep).toBe(1);
  });

  it("openCreateParkModal() resets newPark to default", () => {
    wrapper.vm.newPark.localisation = "old location";
    wrapper.vm.openCreateParkModal();
    expect(wrapper.vm.newPark.localisation).toBe("");
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("ParksList — tarifCategories", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  it("has exactly 4 categories", () => {
    expect(wrapper.vm.tarifCategories).toHaveLength(4);
  });

  it("includes Enfants, Adultes, Groupes, VIP", () => {
    const values = wrapper.vm.tarifCategories.map(c => c.value);
    expect(values).toContain("enfants");
    expect(values).toContain("adultes");
    expect(values).toContain("groupes");
    expect(values).toContain("vip");
  });
});
