/**
 * Functional Tests — Fidélité & Codes Promo flow
 * Tests: load promos, create/edit/delete promo, toggle, export
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import axios from "axios";
import FidelitePage from "@/pages/fidelite.vue";

const mockPromos = [
  { id:1, code:"SUMMER25", type_remise:"pourcentage", valeur:"25", max_utilisations:100, utilisations_actuelles:12, date_expiration:"2099-12-31", actif:true,  description:"Promo été"   },
  { id:2, code:"WINTER10", type_remise:"montant",     valeur:"10", max_utilisations:50,  utilisations_actuelles:50, date_expiration:"2099-12-31", actif:false, description:"Promo hiver" },
  { id:3, code:"XMAS50",   type_remise:"pourcentage", valeur:"50", max_utilisations:null, utilisations_actuelles:0, date_expiration:"2020-01-01", actif:true,  description:"Noël"        },
];

const mockTopClients = [
  { id:1, nom:"Marie Dupont",  email:"marie@test.fr",  points:1250, last_achat:"2026-03-15" },
  { id:2, nom:"Jean Lefebvre", email:"jean@test.fr",   points:480,  last_achat:"2026-04-01" },
  { id:3, nom:"Sophie Martin", email:"sophie@test.fr", points:80,   last_achat:"2026-02-20" },
];

function mountComponent() {
  return mount(FidelitePage, { global: { stubs: { teleport: true } } });
}

// ════════════════════════════════════════════════════════════════════════════
describe("FideliteFlow — API loading", () => {
  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/promo-codes"))
        return Promise.resolve({ data: { data: mockPromos, total: 3 } });
      if (url.includes("/top-clients"))
        return Promise.resolve({ data: { data: mockTopClients, total: 3 } });
      if (url.includes("/fidelite/stats"))
        return Promise.resolve({ data: { total_clients:150, total_points:25000, points_rachetes:3200, codes_actifs:5 } });
      return Promise.resolve({ data: { data: [], total: 0 } });
    });
  });

  it("calls GET /promo-codes on mount", async () => {
    mountComponent();
    await flushPromises();
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/promo-codes"),
      expect.any(Object)
    );
  });

  it("populates promos after mount", async () => {
    const wrapper = mountComponent();
    await flushPromises();
    expect(wrapper.vm.promos).toHaveLength(3);
  });

  it("populates topClients after mount", async () => {
    const wrapper = mountComponent();
    await flushPromises();
    expect(wrapper.vm.topClients).toHaveLength(3);
  });

  it("handles promos load error gracefully", async () => {
    axios.get.mockRejectedValue(new Error("Network error"));
    const wrapper = mountComponent();
    await flushPromises();
    expect(wrapper.vm.promos).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("FideliteFlow — Create promo flow", () => {
  let wrapper;
  beforeEach(async () => {
    axios.get.mockResolvedValue({ data: { data: [], total: 0 } });
    axios.post.mockResolvedValue({
      data: { data: { id:99, code:"NEWCODE", type_remise:"pourcentage", valeur:"15", actif:true } },
    });
    wrapper = mountComponent();
    await flushPromises();
  });

  it("openCreatePromo() opens form", () => {
    wrapper.vm.openCreatePromo();
    expect(wrapper.vm.showPromoForm).toBe(true);
  });

  it("savePromo() calls POST /promo-codes", async () => {
    wrapper.vm.openCreatePromo();
    wrapper.vm.promoForm.code = "NEWCODE";
    wrapper.vm.promoForm.valeur = "15";
    wrapper.vm.promoForm.type_remise = "pourcentage";
    await wrapper.vm.savePromo();
    await flushPromises();
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/promo-codes"),
      expect.objectContaining({ code: "NEWCODE", valeur: "15" }),
      expect.any(Object)
    );
  });

  it("adds created promo to promos array", async () => {
    wrapper.vm.openCreatePromo();
    wrapper.vm.promoForm.code = "NEWCODE";
    wrapper.vm.promoForm.valeur = "15";
    await wrapper.vm.savePromo();
    await flushPromises();
    expect(wrapper.vm.promos.some(p => p.id === 99)).toBe(true);
  });

  it("closes form on success", async () => {
    wrapper.vm.openCreatePromo();
    wrapper.vm.promoForm.code = "NEWCODE";
    wrapper.vm.promoForm.valeur = "15";
    await wrapper.vm.savePromo();
    await flushPromises();
    expect(wrapper.vm.showPromoForm).toBe(false);
  });

  it("does not call API when code is empty", async () => {
    wrapper.vm.openCreatePromo();
    wrapper.vm.promoForm.code = "";
    wrapper.vm.promoForm.valeur = "15";
    await wrapper.vm.savePromo();
    await flushPromises();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("does not call API when valeur is empty", async () => {
    wrapper.vm.openCreatePromo();
    wrapper.vm.promoForm.code = "VALID";
    wrapper.vm.promoForm.valeur = "";
    await wrapper.vm.savePromo();
    await flushPromises();
    expect(axios.post).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("FideliteFlow — Edit promo flow", () => {
  let wrapper;
  const promo = mockPromos[0];
  beforeEach(async () => {
    axios.get.mockResolvedValue({ data: { data: [...mockPromos], total: 3 } });
    axios.put.mockResolvedValue({ data: { data: { ...promo, description: "Updated" } } });
    wrapper = mountComponent();
    wrapper.vm.promos = [...mockPromos];
    await flushPromises();
  });

  it("openEditPromo() fills form with promo data", () => {
    wrapper.vm.openEditPromo(promo);
    expect(wrapper.vm.promoForm.id).toBe(1);
    expect(wrapper.vm.promoForm.code).toBe("SUMMER25");
    expect(wrapper.vm.promoForm.valeur).toBe("25");
  });

  it("savePromo() calls PUT /promo-codes/{id} for edit", async () => {
    wrapper.vm.openEditPromo(promo);
    wrapper.vm.promoForm.description = "Updated";
    await wrapper.vm.savePromo();
    await flushPromises();
    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining(`/promo-codes/${promo.id}`),
      expect.objectContaining({ id: promo.id }),
      expect.any(Object)
    );
  });

  it("closes form after edit", async () => {
    wrapper.vm.openEditPromo(promo);
    await wrapper.vm.savePromo();
    await flushPromises();
    expect(wrapper.vm.showPromoForm).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("FideliteFlow — Toggle & Delete promo", () => {
  let wrapper;
  beforeEach(async () => {
    axios.get.mockResolvedValue({ data: { data: [], total: 0 } });
    axios.patch.mockResolvedValue({ data: {} });
    axios.delete.mockResolvedValue({ data: {} });
    wrapper = mountComponent();
    await flushPromises();
    wrapper.vm.promos = JSON.parse(JSON.stringify(mockPromos));
  });

  it("togglePromo() calls PATCH /promo-codes/{id}/toggle", async () => {
    const promo = wrapper.vm.promos[0];
    await wrapper.vm.togglePromo(promo);
    await flushPromises();
    expect(axios.patch).toHaveBeenCalledWith(
      expect.stringContaining(`/promo-codes/${promo.id}/toggle`),
      expect.objectContaining({ actif: false }),
      expect.any(Object)
    );
  });

  it("togglePromo() inverts actif state", async () => {
    const promo = wrapper.vm.promos[0]; // actif: true
    await wrapper.vm.togglePromo(promo);
    await flushPromises();
    expect(promo.actif).toBe(false);
  });

  it("deletePromo() calls DELETE /promo-codes/{id}", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const promo = wrapper.vm.promos[0];
    await wrapper.vm.deletePromo(promo);
    await flushPromises();
    expect(axios.delete).toHaveBeenCalledWith(
      expect.stringContaining(`/promo-codes/${promo.id}`),
      expect.any(Object)
    );
    vi.restoreAllMocks();
  });

  it("deletePromo() removes from array", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const promo = wrapper.vm.promos[0];
    await wrapper.vm.deletePromo(promo);
    await flushPromises();
    expect(wrapper.vm.promos.some(p => p.id === promo.id)).toBe(false);
    vi.restoreAllMocks();
  });

  it("deletePromo() does nothing when confirm cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const count = wrapper.vm.promos.length;
    await wrapper.vm.deletePromo(wrapper.vm.promos[0]);
    expect(wrapper.vm.promos).toHaveLength(count);
    vi.restoreAllMocks();
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("FideliteFlow — Programme fidélité save", () => {
  let wrapper;
  beforeEach(async () => {
    axios.get.mockResolvedValue({ data: { data: [], total: 0 } });
    axios.post.mockResolvedValue({ data: {} });
    wrapper = mountComponent();
    await flushPromises();
  });

  it("saveProgramme() calls POST /fidelite/programme", async () => {
    await wrapper.vm.saveProgramme();
    await flushPromises();
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/fidelite/programme"),
      expect.objectContaining({ nom: "Royal Points" }),
      expect.any(Object)
    );
  });

  it("saveProgramme() resets saving flag", async () => {
    await wrapper.vm.saveProgramme();
    await flushPromises();
    expect(wrapper.vm.savingProgramme).toBe(false);
  });
});
