/**
 * Unit Tests — Paramétrage Financier page
 * Tests: TVA management, paiements CRUD, compta emails, tabs
 */
import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import ParamétrageFinancier from "@/pages/paramétrage-financier.vue";

function mountComponent() {
  return mount(ParamétrageFinancier, { global: { stubs: { teleport: true } } });
}

// ════════════════════════════════════════════════════════════════════════════
describe("ParamétrageFinancier — initial state", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  it("starts on 'parametrage' tab", () => {
    expect(wrapper.vm.activeTab).toBe("parametrage");
  });

  it("has 3 tabs", () => {
    expect(wrapper.vm.tabs).toHaveLength(3);
  });

  it("has 3 default TVA rates", () => {
    expect(wrapper.vm.param.taux_tva).toHaveLength(3);
  });

  it("TVA 20% is default", () => {
    const defaut = wrapper.vm.param.taux_tva.find(t => t.defaut);
    expect(defaut.taux).toBe(20);
  });

  it("has 5 default payment methods", () => {
    expect(wrapper.vm.paiements).toHaveLength(5);
  });

  it("Espèces is active", () => {
    const especes = wrapper.vm.paiements.find(p => p.name.includes("Espèces"));
    expect(especes.actif).toBe(true);
  });

  it("Adyen is inactive by default", () => {
    const adyen = wrapper.vm.paiements.find(p => p.name === "Adyen");
    expect(adyen.actif).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("ParamétrageFinancier — TVA management", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  it("openAddTva() opens dialog with empty form", () => {
    wrapper.vm.openAddTva();
    expect(wrapper.vm.showTvaDialog).toBe(true);
    expect(wrapper.vm.editingTva).toBeNull();
    expect(wrapper.vm.tvaForm.taux).toBe("");
  });

  it("editTva() opens dialog with pre-filled data", () => {
    const tva = wrapper.vm.param.taux_tva[0];
    wrapper.vm.editTva(tva);
    expect(wrapper.vm.showTvaDialog).toBe(true);
    expect(wrapper.vm.editingTva).toEqual(tva);
    expect(wrapper.vm.tvaForm.taux).toBe(20);
  });

  it("setTvaDefaut() changes default to selected tva", () => {
    const tva10 = wrapper.vm.param.taux_tva[1];
    wrapper.vm.setTvaDefaut(tva10);
    expect(tva10.defaut).toBe(true);
    expect(wrapper.vm.param.taux_tva[0].defaut).toBe(false);
  });

  it("saveTva() adds new custom tva", () => {
    wrapper.vm.openAddTva();
    wrapper.vm.tvaForm = { taux: "8.5", label: "Taux spécial" };
    wrapper.vm.saveTva();
    const found = wrapper.vm.param.taux_tva.find(t => t.taux === 8.5);
    expect(found).toBeDefined();
    expect(found.custom).toBe(true);
    expect(found.defaut).toBe(false);
  });

  it("saveTva() does nothing when taux is empty", () => {
    const count = wrapper.vm.param.taux_tva.length;
    wrapper.vm.openAddTva();
    wrapper.vm.tvaForm = { taux: "", label: "" };
    wrapper.vm.saveTva();
    expect(wrapper.vm.param.taux_tva).toHaveLength(count);
  });

  it("deleteTva() removes custom tva", () => {
    wrapper.vm.param.taux_tva.push({ id: 99, taux: 8.5, label: "Custom", defaut: false, custom: true });
    const before = wrapper.vm.param.taux_tva.length;
    wrapper.vm.deleteTva({ id: 99 });
    expect(wrapper.vm.param.taux_tva).toHaveLength(before - 1);
  });

  it("saveTva() updates existing tva when editing", () => {
    const tva = wrapper.vm.param.taux_tva[0];
    wrapper.vm.editTva(tva);
    wrapper.vm.tvaForm.label = "Nouveau label";
    wrapper.vm.saveTva();
    expect(wrapper.vm.param.taux_tva[0].label).toBe("Nouveau label");
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("ParamétrageFinancier — paiements CRUD", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  it("openAddPaiement() opens dialog with empty form", () => {
    wrapper.vm.openAddPaiement();
    expect(wrapper.vm.showPaiementDialog).toBe(true);
    expect(wrapper.vm.editingPaiement).toBeNull();
    expect(wrapper.vm.paiementForm.name).toBe("");
  });

  it("editPaiement() opens dialog with pre-filled data", () => {
    const m = wrapper.vm.paiements[0];
    wrapper.vm.editPaiement(m);
    expect(wrapper.vm.showPaiementDialog).toBe(true);
    expect(wrapper.vm.editingPaiement).toEqual(m);
    expect(wrapper.vm.paiementForm.name).toBe(m.name);
  });

  it("savePaiement() adds new method when no editing", () => {
    const count = wrapper.vm.paiements.length;
    wrapper.vm.openAddPaiement();
    wrapper.vm.paiementForm.name = "PayPal";
    wrapper.vm.paiementForm.description = "Paiement en ligne";
    wrapper.vm.savePaiement();
    expect(wrapper.vm.paiements).toHaveLength(count + 1);
    expect(wrapper.vm.paiements.at(-1).name).toBe("PayPal");
  });

  it("savePaiement() does nothing when name is empty", () => {
    const count = wrapper.vm.paiements.length;
    wrapper.vm.openAddPaiement();
    wrapper.vm.paiementForm.name = "";
    wrapper.vm.savePaiement();
    expect(wrapper.vm.paiements).toHaveLength(count);
  });

  it("savePaiement() updates existing method when editing", () => {
    const m = wrapper.vm.paiements[0];
    wrapper.vm.editPaiement(m);
    wrapper.vm.paiementForm.description = "Updated description";
    wrapper.vm.savePaiement();
    expect(m.description).toBe("Updated description");
  });

  it("deletePaiement() removes the method", () => {
    const count = wrapper.vm.paiements.length;
    const m = { id: 999, name: "Test", actif: true };
    wrapper.vm.paiements.push(m);
    // vi.spyOn to avoid confirm dialog
    vi.spyOn(window, "confirm").mockReturnValue(true);
    wrapper.vm.deletePaiement(m);
    expect(wrapper.vm.paiements).toHaveLength(count);
    vi.restoreAllMocks();
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("ParamétrageFinancier — comptabilité emails", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  it("starts with one empty email", () => {
    expect(wrapper.vm.compta.emails).toHaveLength(1);
    expect(wrapper.vm.compta.emails[0]).toBe("");
  });

  it("can add an email", () => {
    wrapper.vm.compta.emails.push("compta@example.com");
    expect(wrapper.vm.compta.emails).toHaveLength(2);
  });

  it("can remove an email by index", () => {
    wrapper.vm.compta.emails = ["a@test.com", "b@test.com"];
    wrapper.vm.compta.emails.splice(0, 1);
    expect(wrapper.vm.compta.emails).toHaveLength(1);
    expect(wrapper.vm.compta.emails[0]).toBe("b@test.com");
  });

  it("frequence defaults to 'monthly'", () => {
    expect(wrapper.vm.compta.frequence).toBe("monthly");
  });

  it("include_revenue defaults to true", () => {
    expect(wrapper.vm.compta.include_revenue).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("ParamétrageFinancier — documents list", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  it("has 4 document types", () => {
    expect(wrapper.vm.documents).toHaveLength(4);
  });

  it("includes Devis, Factures, Bons de commande, Bons de livraison", () => {
    const keys = wrapper.vm.documents.map(d => d.key);
    expect(keys).toContain("devis");
    expect(keys).toContain("facture");
    expect(keys).toContain("commande");
    expect(keys).toContain("livraison");
  });
});
