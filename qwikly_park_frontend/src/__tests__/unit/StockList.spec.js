/**
 * Unit Tests — Stock List.vue
 * Tests: ajustement rapide, calcul quantité, statuts stock
 */
import { describe, it, expect, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import StockList from "@/views/stock/List.vue";

function mountComponent() {
  return mount(StockList, { global: { stubs: { teleport: true } } });
}

// ════════════════════════════════════════════════════════════════════════════
describe("StockList — initial state", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  it("starts with empty items array", () => {
    expect(wrapper.vm.items).toEqual([]);
  });

  it("starts with all dialogs closed", () => {
    expect(wrapper.vm.formDialog).toBe(false);
    expect(wrapper.vm.detailDialog).toBe(false);
    expect(wrapper.vm.deleteDialog).toBe(false);
    expect(wrapper.vm.ajustementDialog).toBe(false);
  });

  it("starts with ajustementType = 'entree'", () => {
    expect(wrapper.vm.ajustementType).toBe("entree");
  });

  it("starts with empty ajustementQty", () => {
    expect(wrapper.vm.ajustementQty).toBe("");
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("StockList — openAjustement()", () => {
  let wrapper;
  const item = { id: 5, nom: "Chaussettes", quantity: 20, seuil_bas: 10, seuil_rupture: 3 };
  beforeEach(() => { wrapper = mountComponent(); });

  it("opens ajustementDialog", () => {
    wrapper.vm.openAjustement(item);
    expect(wrapper.vm.ajustementDialog).toBe(true);
  });

  it("sets ajustementItem", () => {
    wrapper.vm.openAjustement(item);
    expect(wrapper.vm.ajustementItem).toEqual(item);
  });

  it("resets ajustementQty to empty", () => {
    wrapper.vm.ajustementQty = "50";
    wrapper.vm.openAjustement(item);
    expect(wrapper.vm.ajustementQty).toBe("");
  });

  it("resets type to 'entree'", () => {
    wrapper.vm.ajustementType = "sortie";
    wrapper.vm.openAjustement(item);
    expect(wrapper.vm.ajustementType).toBe("entree");
  });

  it("resets motif to empty", () => {
    wrapper.vm.ajustementMotif = "Test";
    wrapper.vm.openAjustement(item);
    expect(wrapper.vm.ajustementMotif).toBe("");
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("StockList — calcNewQty computed", () => {
  let wrapper;
  const item = { id: 1, quantity: 30 };
  beforeEach(() => {
    wrapper = mountComponent();
    wrapper.vm.ajustementItem = item;
  });

  it("returns current + qty for entrée", () => {
    wrapper.vm.ajustementType = "entree";
    wrapper.vm.ajustementQty = "10";
    expect(wrapper.vm.calcNewQty).toBe(40);
  });

  it("returns current - qty for sortie", () => {
    wrapper.vm.ajustementType = "sortie";
    wrapper.vm.ajustementQty = "5";
    expect(wrapper.vm.calcNewQty).toBe(25);
  });

  it("returns 0 minimum for sortie (no negative)", () => {
    wrapper.vm.ajustementType = "sortie";
    wrapper.vm.ajustementQty = "100";
    expect(wrapper.vm.calcNewQty).toBe(0);
  });

  it("returns qty directly for ajustement/correction", () => {
    wrapper.vm.ajustementType = "ajustement";
    wrapper.vm.ajustementQty = "15";
    expect(wrapper.vm.calcNewQty).toBe(15);
  });

  it("returns current quantity for empty qty", () => {
    wrapper.vm.ajustementType = "entree";
    wrapper.vm.ajustementQty = "";
    expect(wrapper.vm.calcNewQty).toBe(30);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("StockList — statusLabel() & statusClass()", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  it("returns 'Disponible' when quantity > seuil_bas", () => {
    const item = { quantity: 50, seuil_bas: 10, seuil_rupture: 3 };
    expect(wrapper.vm.statusLabel(item)).toBe("Disponible");
  });

  it("returns 'Stock bas' when quantity <= seuil_bas", () => {
    const item = { quantity: 8, seuil_bas: 10, seuil_rupture: 3 };
    expect(wrapper.vm.statusLabel(item)).toBe("Stock bas");
  });

  it("returns 'Rupture' when quantity is 0", () => {
    const item = { quantity: 0, seuil_bas: 10, seuil_rupture: 3 };
    expect(wrapper.vm.statusLabel(item)).toBe("Rupture");
  });

  it("returns 'Stock bas' when quantity > 0 but <= seuil_bas", () => {
    const item = { quantity: 2, seuil_bas: 10, seuil_rupture: 3 };
    expect(wrapper.vm.statusLabel(item)).toBe("Stock bas");
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("StockList — openCreate()", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  it("opens formDialog", () => {
    wrapper.vm.openCreate();
    expect(wrapper.vm.formDialog).toBe(true);
  });

  it("sets isEditing to false", () => {
    wrapper.vm.isEditing = true;
    wrapper.vm.openCreate();
    expect(wrapper.vm.isEditing).toBe(false);
  });

  it("resets form fields", () => {
    wrapper.vm.form.nom = "Old product";
    wrapper.vm.openCreate();
    expect(wrapper.vm.form.nom).toBe("");
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("StockList — openDetail()", () => {
  let wrapper;
  const item = { id: 3, nom: "Gants", quantity: 15 };
  beforeEach(() => { wrapper = mountComponent(); });

  it("sets current item", () => {
    wrapper.vm.openDetail(item);
    expect(wrapper.vm.current).toEqual(item);
  });

  it("opens detailDialog", () => {
    wrapper.vm.openDetail(item);
    expect(wrapper.vm.detailDialog).toBe(true);
  });
});
