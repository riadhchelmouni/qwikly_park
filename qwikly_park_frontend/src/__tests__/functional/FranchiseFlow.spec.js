/**
 * Functional Tests — Franchise creation flow (bug fix validation)
 * Tests: correct field names, Content-Type fix, status required, owner_id, validation
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import axios from "axios";
import ParksList from "@/views/parks/list/List.vue";

const mockFranchise = {
  id: 1, name: "Royal Kids Group", description: "Franchise test",
  owner_id: 2, status: "active", logo: null, siret: "12345678900012", siren: "123456789", tva: "FR12123456789",
};

function mountComponent() {
  return mount(ParksList, { global: { stubs: { teleport: true } } });
}

// ════════════════════════════════════════════════════════════════════════════
describe("FranchiseFlow — getDefaultFranchise()", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  it("uses 'name' field (not 'nom')", () => {
    const def = wrapper.vm.getDefaultFranchise();
    expect(def).toHaveProperty("name");
    expect(def).not.toHaveProperty("nom");
  });

  it("uses 'owner_id' field (not 'admin_id')", () => {
    const def = wrapper.vm.getDefaultFranchise();
    expect(def).toHaveProperty("owner_id");
    expect(def).not.toHaveProperty("admin_id");
  });

  it("has 'status' field with default 'active'", () => {
    const def = wrapper.vm.getDefaultFranchise();
    expect(def).toHaveProperty("status");
    expect(def.status).toBe("active");
  });

  it("has 'siret' and 'siren' fields", () => {
    const def = wrapper.vm.getDefaultFranchise();
    expect(def).toHaveProperty("siret");
    expect(def).toHaveProperty("siren");
  });

  it("has 'tva' field", () => {
    const def = wrapper.vm.getDefaultFranchise();
    expect(def).toHaveProperty("tva");
  });

  it("does NOT have 'adresse' field (removed)", () => {
    const def = wrapper.vm.getDefaultFranchise();
    expect(def).not.toHaveProperty("adresse");
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("FranchiseFlow — openCreateFranchiseModal()", () => {
  let wrapper;
  beforeEach(async () => {
    axios.get.mockResolvedValue({ data: { data: [], total: 0 } });
    wrapper = mountComponent();
    await flushPromises();
  });

  it("opens createFranchiseDialog", () => {
    wrapper.vm.openCreateFranchiseModal();
    expect(wrapper.vm.createFranchiseDialog).toBe(true);
  });

  it("resets to step 1", () => {
    wrapper.vm.createFranchiseStep = 2;
    wrapper.vm.openCreateFranchiseModal();
    expect(wrapper.vm.createFranchiseStep).toBe(1);
  });

  it("resets newFranchise with correct field names", () => {
    wrapper.vm.newFranchise.name = "Old Name";
    wrapper.vm.openCreateFranchiseModal();
    expect(wrapper.vm.newFranchise.name).toBe("");
    expect(wrapper.vm.newFranchise.owner_id).toBeNull();
    expect(wrapper.vm.newFranchise.status).toBe("active");
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("FranchiseFlow — saveFranchise() — FormData correctness", () => {
  let wrapper;
  let capturedFormData;

  beforeEach(async () => {
    axios.get.mockResolvedValue({ data: { data: [], total: 0 } });
    axios.post.mockImplementation((url, data) => {
      capturedFormData = data;
      return Promise.resolve({ data: { franchise: mockFranchise } });
    });
    wrapper = mountComponent();
    await flushPromises();
    wrapper.vm.openCreateFranchiseModal();
    wrapper.vm.newFranchise.name = "Royal Kids Group";
    wrapper.vm.newFranchise.owner_id = 2;
    wrapper.vm.newFranchise.status = "active";
    wrapper.vm.newFranchise.siret = "12345678900012";
    wrapper.vm.newFranchise.siren = "123456789";
  });

  it("calls POST /franchises", async () => {
    await wrapper.vm.saveFranchise();
    await flushPromises();
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/franchises"),
      expect.any(FormData),
      expect.any(Object)
    );
  });

  it("does NOT set Content-Type in headers (lets axios handle boundary)", async () => {
    await wrapper.vm.saveFranchise();
    await flushPromises();
    const call = axios.post.mock.calls[0];
    const options = call[2];
    expect(options.headers["Content-Type"]).toBeUndefined();
  });

  it("FormData contains 'name' key (not 'nom')", async () => {
    await wrapper.vm.saveFranchise();
    await flushPromises();
    expect(capturedFormData instanceof FormData).toBe(true);
    expect(capturedFormData.get("name")).toBe("Royal Kids Group");
  });

  it("FormData contains 'status' key", async () => {
    await wrapper.vm.saveFranchise();
    await flushPromises();
    expect(capturedFormData.get("status")).toBe("active");
  });

  it("FormData does NOT contain 'nom' key", async () => {
    await wrapper.vm.saveFranchise();
    await flushPromises();
    expect(capturedFormData.get("nom")).toBeNull();
  });

  it("adds created franchise to franchises array", async () => {
    await wrapper.vm.saveFranchise();
    await flushPromises();
    expect(wrapper.vm.franchises.some(f => f.id === mockFranchise.id)).toBe(true);
  });

  it("closes dialog on success", async () => {
    await wrapper.vm.saveFranchise();
    await flushPromises();
    expect(wrapper.vm.createFranchiseDialog).toBe(false);
  });

  it("shows error snackbar on failure", async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { errors: { name: ["Le nom est requis"] } } },
    });
    await wrapper.vm.saveFranchise();
    await flushPromises();
    expect(wrapper.vm.isSnackbarVisible).toBe(true);
    expect(wrapper.vm.snackbar.color).toBe("error");
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("FranchiseFlow — updateFranchise()", () => {
  let wrapper;
  beforeEach(async () => {
    axios.get.mockResolvedValue({ data: { data: [mockFranchise], total: 1 } });
    axios.put.mockResolvedValue({ data: { franchise: { ...mockFranchise, name: "Updated Name" } } });
    wrapper = mountComponent();
    await flushPromises();
  });

  it("openEditFranchiseModal() copies franchise data", () => {
    wrapper.vm.openEditFranchiseModal(mockFranchise);
    expect(wrapper.vm.editFranchise.id).toBe(mockFranchise.id);
    expect(wrapper.vm.editFranchise.name).toBe(mockFranchise.name);
  });

  it("updateFranchise() calls PUT /franchises/{id}/update", async () => {
    wrapper.vm.openEditFranchiseModal(mockFranchise);
    await wrapper.vm.updateFranchise();
    await flushPromises();
    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining(`/franchises/${mockFranchise.id}/update`),
      expect.any(Object),
      expect.any(Object)
    );
  });

  it("closes editFranchiseDialog on success", async () => {
    wrapper.vm.openEditFranchiseModal(mockFranchise);
    await wrapper.vm.updateFranchise();
    await flushPromises();
    expect(wrapper.vm.editFranchiseDialog).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("FranchiseFlow — loadOwnerOptions()", () => {
  let wrapper;
  beforeEach(async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/owners"))
        return Promise.resolve({ data: { data: [
          { id:1, user:{ firstname:"Jean", lastname:"Dupont" } },
          { id:2, user:{ firstname:"Marie", lastname:"Martin" } },
        ], total: 2 } });
      return Promise.resolve({ data: { data: [], total: 0 } });
    });
    wrapper = mountComponent();
    await flushPromises();
  });

  it("calls GET /owners on mount", () => {
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/owners"),
      expect.any(Object)
    );
  });

  it("populates ownerOptions with name field", () => {
    expect(wrapper.vm.ownerOptions).toHaveLength(2);
    expect(wrapper.vm.ownerOptions[0].name).toContain("Jean");
    expect(wrapper.vm.ownerOptions[0].name).toContain("Dupont");
  });

  it("each ownerOption has id and name", () => {
    wrapper.vm.ownerOptions.forEach(opt => {
      expect(opt).toHaveProperty("id");
      expect(opt).toHaveProperty("name");
    });
  });
});
