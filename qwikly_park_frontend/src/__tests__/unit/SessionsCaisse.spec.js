/**
 * Unit Tests — Sessions de Caisse (employees/list/List.vue)
 * Tests: edit session, caisse roles, employee optional, sub-tabs
 */
import { describe, it, expect, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import EmployeesList from "@/views/employees/list/List.vue";

function mountComponent() {
  return mount(EmployeesList, { global: { stubs: { teleport: true } } });
}

// ════════════════════════════════════════════════════════════════════════════
describe("SessionsCaisse — sub-tab navigation", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  it("starts on 'sessions' sub-tab", () => {
    expect(wrapper.vm.sessSubTab).toBe("sessions");
  });

  it("can switch to 'roles' sub-tab", () => {
    wrapper.vm.sessSubTab = "roles";
    expect(wrapper.vm.sessSubTab).toBe("roles");
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("SessionsCaisse — openAddSession()", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  it("employee_id starts as null (optional)", () => {
    wrapper.vm.openAddSession();
    expect(wrapper.vm.addSessionData.employee_id).toBeNull();
  });

  it("opens addSessionDialog", () => {
    wrapper.vm.openAddSession();
    expect(wrapper.vm.addSessionDialog).toBe(true);
  });

  it("resets caisse_nom to empty", () => {
    wrapper.vm.addSessionData.caisse_nom = "Caisse 1";
    wrapper.vm.openAddSession();
    expect(wrapper.vm.addSessionData.caisse_nom).toBe("");
  });

  it("sets opened_at to current datetime string", () => {
    wrapper.vm.openAddSession();
    expect(wrapper.vm.addSessionData.opened_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("SessionsCaisse — openEditSession()", () => {
  let wrapper;
  const session = {
    id: 12,
    employee: { id: 3, user: { firstname: "Jean", lastname: "Dupont" } },
    park: { id: 2, localisation: "Paris 15e" },
    caisse: { name: "Caisse principale" },
    montant_ouverture: 200,
    montant: 850,
    status: "open",
    note: "RAS",
  };
  beforeEach(() => { wrapper = mountComponent(); });

  it("opens editSessionDialog", () => {
    wrapper.vm.openEditSession(session);
    expect(wrapper.vm.editSessionDialog).toBe(true);
  });

  it("copies session id", () => {
    wrapper.vm.openEditSession(session);
    expect(wrapper.vm.editSessionData.id).toBe(12);
  });

  it("copies employee_id from employee object", () => {
    wrapper.vm.openEditSession(session);
    expect(wrapper.vm.editSessionData.employee_id).toBe(3);
  });

  it("copies park_id from park object", () => {
    wrapper.vm.openEditSession(session);
    expect(wrapper.vm.editSessionData.park_id).toBe(2);
  });

  it("copies caisse_nom from caisse.name", () => {
    wrapper.vm.openEditSession(session);
    expect(wrapper.vm.editSessionData.caisse_nom).toBe("Caisse principale");
  });

  it("copies montant_ouverture", () => {
    wrapper.vm.openEditSession(session);
    expect(wrapper.vm.editSessionData.montant_ouverture).toBe(200);
  });

  it("copies status", () => {
    wrapper.vm.openEditSession(session);
    expect(wrapper.vm.editSessionData.status).toBe("open");
  });

  it("copies note", () => {
    wrapper.vm.openEditSession(session);
    expect(wrapper.vm.editSessionData.note).toBe("RAS");
  });

  it("handles missing employee gracefully (null)", () => {
    const sessionNoEmp = { ...session, employee: null };
    wrapper.vm.openEditSession(sessionNoEmp);
    expect(wrapper.vm.editSessionData.employee_id).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("SessionsCaisse — Rôles de caisse data", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  it("has 2 caisseRolePresets", () => {
    expect(wrapper.vm.caisseRolePresets).toHaveLength(2);
  });

  it("first preset is Caissier", () => {
    expect(wrapper.vm.caisseRolePresets[0].key).toBe("caissier");
    expect(wrapper.vm.caisseRolePresets[0].name).toContain("Caissier");
  });

  it("second preset is Gestion des produits", () => {
    expect(wrapper.vm.caisseRolePresets[1].key).toBe("gestion_produits");
  });

  it("has 12 caissePermissionsList entries", () => {
    expect(wrapper.vm.caissePermissionsList).toHaveLength(12);
  });

  it("each permission has required fields", () => {
    wrapper.vm.caissePermissionsList.forEach(p => {
      expect(p).toHaveProperty("key");
      expect(p).toHaveProperty("label");
      expect(p).toHaveProperty("icon");
      expect(p).toHaveProperty("description");
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("SessionsCaisse — openAddCaisseRole()", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  it("opens caisseRoleDialog", () => {
    wrapper.vm.openAddCaisseRole();
    expect(wrapper.vm.caisseRoleDialog).toBe(true);
  });

  it("sets caisseRoleEditing to false", () => {
    wrapper.vm.caisseRoleEditing = true;
    wrapper.vm.openAddCaisseRole();
    expect(wrapper.vm.caisseRoleEditing).toBe(false);
  });

  it("resets caisseRoleData", () => {
    wrapper.vm.caisseRoleData = { id: 5, name: "Old", permissions: ["a", "b"] };
    wrapper.vm.openAddCaisseRole();
    expect(wrapper.vm.caisseRoleData.id).toBeNull();
    expect(wrapper.vm.caisseRoleData.name).toBe("");
    expect(wrapper.vm.caisseRoleData.permissions).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("SessionsCaisse — openEditCaisseRole()", () => {
  let wrapper;
  const role = {
    id: 7, name: "Caissier Senior",
    permissions: [{ key: "vente_billets", label: "Vente" }, { key: "paiements", label: "Paiements" }],
  };
  beforeEach(() => { wrapper = mountComponent(); });

  it("sets caisseRoleEditing to true", () => {
    wrapper.vm.openEditCaisseRole(role);
    expect(wrapper.vm.caisseRoleEditing).toBe(true);
  });

  it("sets caisseRoleData.id", () => {
    wrapper.vm.openEditCaisseRole(role);
    expect(wrapper.vm.caisseRoleData.id).toBe(7);
  });

  it("sets caisseRoleData.name", () => {
    wrapper.vm.openEditCaisseRole(role);
    expect(wrapper.vm.caisseRoleData.name).toBe("Caissier Senior");
  });

  it("maps permissions to keys array", () => {
    wrapper.vm.openEditCaisseRole(role);
    expect(wrapper.vm.caisseRoleData.permissions).toContain("vente_billets");
    expect(wrapper.vm.caisseRoleData.permissions).toContain("paiements");
  });
});
