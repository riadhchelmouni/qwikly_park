/**
 * Functional Tests — Parks flow (API calls + modal interactions)
 * Tests: load parks/franchises, create park, edit park, delete, tarifs flow
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import axios from "axios";
import ParksList from "@/views/parks/list/List.vue";

const mockParks = [
  { id: 1, nom: "Royal Kids Paris", localisation: "Paris 15e", status: "open",   franchise_id: 10, tarifs: [] },
  { id: 2, nom: "Fun Zone Lyon",    localisation: "Lyon 2e",   status: "closed", franchise_id: 20, tarifs: [] },
];

const mockFranchises = [
  { id: 10, nom: "Royal Kids Group", parks_count: 1 },
  { id: 20, nom: "Fun Zone Group",   parks_count: 1 },
];

function mountComponent() {
  return mount(ParksList, {
    global: { stubs: { teleport: true } },
  });
}

// ════════════════════════════════════════════════════════════════════════════
describe("Parks — API loading", () => {
  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/parks"))
        return Promise.resolve({ data: { data: mockParks, total: 2 } });
      if (url.includes("/franchises"))
        return Promise.resolve({ data: { data: mockFranchises, total: 2 } });
      return Promise.resolve({ data: { data: [], total: 0 } });
    });
  });

  it("calls GET /parks on mount", async () => {
    mountComponent();
    await flushPromises();
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/parks"),
      expect.any(Object)
    );
  });

  it("populates parks after mount", async () => {
    const wrapper = mountComponent();
    await flushPromises();
    expect(wrapper.vm.parks).toHaveLength(2);
  });

  it("calls GET /franchises on mount", async () => {
    mountComponent();
    await flushPromises();
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/franchises"),
      expect.any(Object)
    );
  });

  it("populates franchises after mount", async () => {
    const wrapper = mountComponent();
    await flushPromises();
    expect(wrapper.vm.franchises).toHaveLength(2);
  });

  it("handles parks load error gracefully", async () => {
    axios.get.mockRejectedValue(new Error("Network error"));
    const wrapper = mountComponent();
    await flushPromises();
    expect(wrapper.vm.parks).toEqual([]);
    expect(wrapper.vm.isParksLoading).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("Parks — Create park flow", () => {
  let wrapper;
  beforeEach(async () => {
    axios.get.mockResolvedValue({ data: { data: [], total: 0 } });
    axios.post.mockResolvedValue({
      data: { park: { id: 99, nom: "Nouveau Parc Test", localisation: "Marseille", status: "open" } },
    });
    wrapper = mountComponent();
    await flushPromises();
  });

  it("openCreateParkModal() opens dialog", () => {
    wrapper.vm.openCreateParkModal();
    expect(wrapper.vm.createParkDialog).toBe(true);
  });

  it("savePark() calls POST /parks", async () => {
    wrapper.vm.openCreateParkModal();
    wrapper.vm.newPark.localisation = "Marseille";
    wrapper.vm.newPark.franchise_id = 10;
    await wrapper.vm.savePark();
    await flushPromises();
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/parks"),
      expect.any(FormData),
      expect.any(Object)
    );
  });

  it("adds created park to parks array", async () => {
    wrapper.vm.openCreateParkModal();
    await wrapper.vm.savePark();
    await flushPromises();
    expect(wrapper.vm.parks.some(p => p.id === 99)).toBe(true);
  });

  it("closes createParkDialog on success", async () => {
    wrapper.vm.openCreateParkModal();
    await wrapper.vm.savePark();
    await flushPromises();
    expect(wrapper.vm.createParkDialog).toBe(false);
  });

  it("shows error snackbar on save failure", async () => {
    axios.post.mockRejectedValueOnce({ response: { data: { message: "Validation error" } } });
    wrapper.vm.openCreateParkModal();
    await wrapper.vm.savePark();
    await flushPromises();
    expect(wrapper.vm.isSnackbarVisible).toBe(true);
    expect(wrapper.vm.snackbar.color).toBe("error");
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("Parks — Edit park flow", () => {
  let wrapper;
  const park = {
    id: 1, nom: "Royal Kids Paris", localisation: "Paris 15e",
    status: "open", franchise_id: 10,
    horaires: {}, tarifs: [],
  };

  beforeEach(async () => {
    axios.get.mockResolvedValue({ data: { data: [park], total: 1 } });
    axios.put.mockResolvedValue({
      data: { park: { ...park, localisation: "Paris 16e" } },
    });
    wrapper = mountComponent();
    await flushPromises();
  });

  it("openEditParkModal() opens editParkDialog", () => {
    wrapper.vm.openEditParkModal(park);
    expect(wrapper.vm.editParkDialog).toBe(true);
  });

  it("openEditParkModal() copies park data into editPark", () => {
    wrapper.vm.openEditParkModal(park);
    expect(wrapper.vm.editPark.id).toBe(1);
    expect(wrapper.vm.editPark.nom).toBe("Royal Kids Paris");
  });

  it("openEditParkModal() initialises tarifs as array", () => {
    wrapper.vm.openEditParkModal(park);
    expect(Array.isArray(wrapper.vm.editPark.tarifs)).toBe(true);
  });

  it("updatePark() calls PUT /parks/{id}/update", async () => {
    wrapper.vm.openEditParkModal(park);
    await wrapper.vm.updatePark();
    await flushPromises();
    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining(`/parks/${park.id}/update`),
      expect.any(Object),
      expect.any(Object)
    );
  });

  it("closes editParkDialog on success", async () => {
    wrapper.vm.openEditParkModal(park);
    await wrapper.vm.updatePark();
    await flushPromises();
    expect(wrapper.vm.editParkDialog).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("Parks — Delete park flow", () => {
  let wrapper;
  beforeEach(async () => {
    axios.get.mockResolvedValue({ data: { data: [...mockParks], total: 2 } });
    axios.patch.mockResolvedValue({ data: { message: "Archived" } });
    wrapper = mountComponent();
    await flushPromises();
  });

  it("openDeleteParkDialog() sets selectedPark and opens dialog", () => {
    wrapper.vm.openDeleteParkDialog(mockParks[0]);
    expect(wrapper.vm.selectedPark).toEqual(mockParks[0]);
    expect(wrapper.vm.deleteParkDialog).toBe(true);
  });

  it("confirmDeletePark() calls PATCH /parks/{id}/archive", async () => {
    wrapper.vm.openDeleteParkDialog(mockParks[0]);
    await wrapper.vm.confirmDeletePark();
    await flushPromises();
    expect(axios.patch).toHaveBeenCalledWith(
      expect.stringContaining(`/parks/${mockParks[0].id}/archive`),
      expect.any(Object),
      expect.any(Object)
    );
  });

  it("removes deleted park from parks array", async () => {
    wrapper.vm.openDeleteParkDialog(mockParks[0]);
    await wrapper.vm.confirmDeletePark();
    await flushPromises();
    expect(wrapper.vm.parks.some(p => p.id === mockParks[0].id)).toBe(false);
  });

  it("closes deleteParkDialog on success", async () => {
    wrapper.vm.openDeleteParkDialog(mockParks[0]);
    await wrapper.vm.confirmDeletePark();
    await flushPromises();
    expect(wrapper.vm.deleteParkDialog).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("Parks — Tarifs management in edit modal", () => {
  let wrapper;
  const park = { id: 1, nom: "Test Park", status: "open", horaires: {}, tarifs: [
    { title: "Enfant", price: "8.00", categorie: "enfants", details: "" },
    { title: "Adulte", price: "12.00", categorie: "adultes", details: "" },
  ]};

  beforeEach(async () => {
    axios.get.mockResolvedValue({ data: { data: [park], total: 1 } });
    wrapper = mountComponent();
    await flushPromises();
    wrapper.vm.openEditParkModal(park);
  });

  it("loads existing tarifs from park", () => {
    expect(wrapper.vm.editPark.tarifs).toHaveLength(2);
    expect(wrapper.vm.editPark.tarifs[0].title).toBe("Enfant");
  });

  it("addEditTarif() adds a new tarif", () => {
    wrapper.vm.addEditTarif();
    expect(wrapper.vm.editPark.tarifs).toHaveLength(3);
    expect(wrapper.vm.editPark.tarifs[2]).toMatchObject({ title: "", price: "", details: "" });
  });

  it("removeEditTarif(0) removes first tarif", () => {
    wrapper.vm.removeEditTarif(0);
    expect(wrapper.vm.editPark.tarifs).toHaveLength(1);
    expect(wrapper.vm.editPark.tarifs[0].title).toBe("Adulte");
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("Parks — Tab switching", () => {
  let wrapper;
  beforeEach(async () => {
    axios.get.mockResolvedValue({ data: { data: [], total: 0 } });
    wrapper = mountComponent();
    await flushPromises();
  });

  it("starts on parks tab", () => {
    expect(wrapper.vm.activeTab).toBe("parks");
  });

  it("can switch to franchises tab", async () => {
    wrapper.vm.activeTab = "franchises";
    expect(wrapper.vm.activeTab).toBe("franchises");
  });
});
