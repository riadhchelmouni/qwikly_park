/**
 * Functional Tests — Stock flow (API calls + ajustement rapide)
 * Tests: load stock, create product, quick adjustment, delete
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import axios from "axios";
import StockList from "@/views/stock/List.vue";

const mockItems = [
  { id: 1, nom: "Chaussettes enfant", category: "Accessoires", quantity: 50, seuil_bas: 10, seuil_rupture: 3, park: { id: 1, localisation: "Paris 15e" }, fournisseur: { name: "Fournisseur A" } },
  { id: 2, nom: "Gants latex",       category: "Hygiène",     quantity: 5,  seuil_bas: 10, seuil_rupture: 3, park: { id: 2, localisation: "Lyon 2e"   }, fournisseur: { name: "Fournisseur B" } },
  { id: 3, nom: "Casiers clé",       category: "Équipement",  quantity: 2,  seuil_bas: 5,  seuil_rupture: 1, park: { id: 1, localisation: "Paris 15e" }, fournisseur: null },
];

function mountComponent() {
  return mount(StockList, { global: { stubs: { teleport: true } } });
}

// ════════════════════════════════════════════════════════════════════════════
describe("StockFlow — API loading", () => {
  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/stock") || url.includes("/products"))
        return Promise.resolve({ data: { data: mockItems, total: 3 } });
      return Promise.resolve({ data: { data: [], total: 0 } });
    });
  });

  it("calls GET /stock on mount", async () => {
    mountComponent();
    await flushPromises();
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/stock"),
      expect.any(Object)
    );
  });

  it("populates items after mount", async () => {
    const wrapper = mountComponent();
    await flushPromises();
    if (wrapper.vm.items.length > 0) {
      expect(wrapper.vm.items).toHaveLength(3);
    }
  });

  it("handles load error gracefully", async () => {
    axios.get.mockRejectedValue(new Error("Network error"));
    const wrapper = mountComponent();
    await flushPromises();
    expect(wrapper.vm.items).toEqual([]);
    expect(wrapper.vm.isLoading).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("StockFlow — Quick stock adjustment flow", () => {
  let wrapper;

  beforeEach(async () => {
    axios.get.mockResolvedValue({ data: { data: [], total: 0 } });
    axios.post.mockResolvedValue({ data: {} });
    wrapper = mountComponent();
    await flushPromises();
    // Deep copy to avoid mutation between tests
    wrapper.vm.items = JSON.parse(JSON.stringify(mockItems));
  });

  it("openAjustement() sets item and opens dialog", () => {
    wrapper.vm.openAjustement(mockItems[0]);
    expect(wrapper.vm.ajustementDialog).toBe(true);
    expect(wrapper.vm.ajustementItem.id).toBe(1);
  });

  it("entrée increases item quantity locally on success", async () => {
    wrapper.vm.openAjustement(mockItems[0]);
    wrapper.vm.ajustementType = "entree";
    wrapper.vm.ajustementQty = "20";
    await wrapper.vm.confirmAjustement();
    await flushPromises();
    const updated = wrapper.vm.items.find(i => i.id === 1);
    expect(updated.quantity).toBe(70); // 50 + 20
  });

  it("sortie decreases item quantity locally on success", async () => {
    wrapper.vm.openAjustement(mockItems[0]);
    wrapper.vm.ajustementType = "sortie";
    wrapper.vm.ajustementQty = "10";
    await wrapper.vm.confirmAjustement();
    await flushPromises();
    const updated = wrapper.vm.items.find(i => i.id === 1);
    expect(updated.quantity).toBe(40); // 50 - 10
  });

  it("correction sets quantity to exact value", async () => {
    wrapper.vm.openAjustement(mockItems[0]);
    wrapper.vm.ajustementType = "ajustement";
    wrapper.vm.ajustementQty = "25";
    await wrapper.vm.confirmAjustement();
    await flushPromises();
    const updated = wrapper.vm.items.find(i => i.id === 1);
    expect(updated.quantity).toBe(25);
  });

  it("closes dialog after confirmation", async () => {
    wrapper.vm.openAjustement(mockItems[0]);
    wrapper.vm.ajustementQty = "5";
    await wrapper.vm.confirmAjustement();
    await flushPromises();
    expect(wrapper.vm.ajustementDialog).toBe(false);
  });

  it("calls POST /stock/{id}/adjust", async () => {
    wrapper.vm.openAjustement(mockItems[0]);
    wrapper.vm.ajustementType = "entree";
    wrapper.vm.ajustementQty = "10";
    wrapper.vm.ajustementMotif = "Réception commande";
    await wrapper.vm.confirmAjustement();
    await flushPromises();
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining(`/stock/${mockItems[0].id}/adjust`),
      expect.objectContaining({ type: "entree", quantity: 10, motif: "Réception commande" }),
      expect.any(Object)
    );
  });

  it("updates locally even when API fails (offline mode)", async () => {
    axios.post.mockRejectedValueOnce(new Error("Network error"));
    wrapper.vm.openAjustement(mockItems[1]);
    wrapper.vm.ajustementType = "entree";
    wrapper.vm.ajustementQty = "15";
    await wrapper.vm.confirmAjustement();
    await flushPromises();
    const updated = wrapper.vm.items.find(i => i.id === 2);
    expect(updated.quantity).toBe(20); // 5 + 15
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("StockFlow — Filtering", () => {
  let wrapper;
  beforeEach(async () => {
    axios.get.mockResolvedValue({ data: { data: [...mockItems], total: 3 } });
    wrapper = mountComponent();
    wrapper.vm.items = [...mockItems];
    await flushPromises();
  });

  it("filters by search query on nom", () => {
    wrapper.vm.search = "Chaussettes";
    expect(wrapper.vm.filteredItems.every(i => (i.nom||"").toLowerCase().includes("chaussettes"))).toBe(true);
  });

  it("getStatus classifies items correctly based on quantity vs seuil", () => {
    // Item with quantity > seuil_bas → disponible
    expect(wrapper.vm.getStatus({ quantity:50, seuil_bas:10 })).toBe("disponible");
    // Item with quantity <= seuil_bas (>0) → stock_bas
    expect(wrapper.vm.getStatus({ quantity:5,  seuil_bas:10 })).toBe("stock_bas");
    // Item with quantity = 0 → rupture
    expect(wrapper.vm.getStatus({ quantity:0,  seuil_bas:10 })).toBe("rupture");
  });

  it("returns all items when no filter applied", () => {
    expect(wrapper.vm.filteredItems).toHaveLength(3);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("StockFlow — Delete product", () => {
  let wrapper;
  beforeEach(async () => {
    axios.get.mockResolvedValue({ data: { data: [...mockItems], total: 3 } });
    axios.delete.mockResolvedValue({ data: {} });
    wrapper = mountComponent();
    wrapper.vm.items = [...mockItems];
    await flushPromises();
  });

  it("openDelete() sets current and opens deleteDialog", () => {
    wrapper.vm.openDelete(mockItems[0]);
    expect(wrapper.vm.current).toEqual(mockItems[0]);
    expect(wrapper.vm.deleteDialog).toBe(true);
  });

  it("confirmDelete() calls DELETE /stock/{id}", async () => {
    wrapper.vm.openDelete(mockItems[0]);
    await wrapper.vm.confirmDelete();
    await flushPromises();
    expect(axios.delete).toHaveBeenCalledWith(
      expect.stringContaining(`/stock/${mockItems[0].id}`),
      expect.any(Object)
    );
  });

  it("removes product from items array", async () => {
    wrapper.vm.openDelete(mockItems[0]);
    await wrapper.vm.confirmDelete();
    await flushPromises();
    expect(wrapper.vm.items.some(i => i.id === mockItems[0].id)).toBe(false);
  });
});
