/**
 * Unit Tests — Employees List.vue
 * Tests: form defaults, session timer, dialog state management
 */
import { describe, it, expect, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import EmployeesList from "@/views/employees/list/List.vue";

function mountComponent() {
  return mount(EmployeesList, {
    global: { stubs: { teleport: true } },
  });
}

// ════════════════════════════════════════════════════════════════════════════
describe("EmployeesList — initial data state", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  it("starts with empty employees array", () => {
    expect(wrapper.vm.employees).toEqual([]);
  });

  it("starts with all dialogs closed", () => {
    expect(wrapper.vm.addEmpDialog).toBe(false);
    expect(wrapper.vm.deleteEmpDialog).toBe(false);
    expect(wrapper.vm.barcodeDialog).toBe(false);
    expect(wrapper.vm.badgeDialog).toBe(false);
    expect(wrapper.vm.addSessionDialog).toBe(false);
  });

  it("starts with correct addEmpData defaults", () => {
    expect(wrapper.vm.addEmpData).toMatchObject({
      firstname: "", lastname: "", email: "",
      phone: "", birthdate: "", password: "",
    });
  });

  it("starts with correct addSessionData defaults", () => {
    expect(wrapper.vm.addSessionData).toMatchObject({
      employee_id: null, park_id: null, caisse_nom: "",
      montant_ouverture: "", opened_at: "", note: "",
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("EmployeesList — openAddEmp()", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  it("opens addEmpDialog", () => {
    wrapper.vm.openAddEmp();
    expect(wrapper.vm.addEmpDialog).toBe(true);
  });

  it("resets addEmpData to empty strings", () => {
    wrapper.vm.addEmpData.firstname = "Jean";
    wrapper.vm.addEmpData.email = "jean@test.com";
    wrapper.vm.openAddEmp();
    expect(wrapper.vm.addEmpData.firstname).toBe("");
    expect(wrapper.vm.addEmpData.email).toBe("");
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("EmployeesList — openDeleteEmp()", () => {
  let wrapper;
  const emp = { id: 7, firstname: "Sophie", lastname: "Martin" };
  beforeEach(() => { wrapper = mountComponent(); });

  it("sets deleteEmpTarget", () => {
    wrapper.vm.openDeleteEmp(emp);
    expect(wrapper.vm.deleteEmpTarget).toEqual(emp);
  });

  it("opens deleteEmpDialog", () => {
    wrapper.vm.openDeleteEmp(emp);
    expect(wrapper.vm.deleteEmpDialog).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("EmployeesList — openGenerateBarcode()", () => {
  let wrapper;
  const emp = { id: 3, firstname: "Marc", lastname: "Dupont" };
  beforeEach(() => { wrapper = mountComponent(); });

  it("sets barcodeEmp", () => {
    wrapper.vm.openGenerateBarcode(emp);
    expect(wrapper.vm.barcodeEmp).toEqual(emp);
  });

  it("opens barcodeDialog", () => {
    wrapper.vm.openGenerateBarcode(emp);
    expect(wrapper.vm.barcodeDialog).toBe(true);
  });

  it("resets barcodeValue to empty", () => {
    wrapper.vm.barcodeValue = "OLD_CODE";
    wrapper.vm.openGenerateBarcode(emp);
    expect(wrapper.vm.barcodeValue).toBe("");
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("EmployeesList — openPrintBadge()", () => {
  let wrapper;
  const emp = { id: 4, firstname: "Lucie", lastname: "Bernard" };
  beforeEach(() => { wrapper = mountComponent(); });

  it("sets badgeEmp", () => {
    wrapper.vm.openPrintBadge(emp);
    expect(wrapper.vm.badgeEmp).toEqual(emp);
  });

  it("opens badgeDialog", () => {
    wrapper.vm.openPrintBadge(emp);
    expect(wrapper.vm.badgeDialog).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("EmployeesList — openAddSession()", () => {
  let wrapper;
  beforeEach(() => { wrapper = mountComponent(); });

  it("opens addSessionDialog", () => {
    wrapper.vm.openAddSession();
    expect(wrapper.vm.addSessionDialog).toBe(true);
  });

  it("resets addSessionData to defaults", () => {
    wrapper.vm.addSessionData.caisse_nom = "Caisse 3";
    wrapper.vm.addSessionData.montant_ouverture = "500";
    wrapper.vm.openAddSession();
    expect(wrapper.vm.addSessionData.caisse_nom).toBe("");
    expect(wrapper.vm.addSessionData.montant_ouverture).toBe("");
  });

  it("sets employee_id to null", () => {
    wrapper.vm.addSessionData.employee_id = 5;
    wrapper.vm.openAddSession();
    expect(wrapper.vm.addSessionData.employee_id).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("EmployeesList — authStore access", () => {
  let wrapper;
  beforeEach(async () => {
    wrapper = mountComponent();
    await flushPromises();
  });

  it("has authStore with a token", () => {
    expect(wrapper.vm.authStore).toBeDefined();
    expect(wrapper.vm.authStore.token).toBe("fake-test-token");
  });

  it("authStore user is defined", () => {
    expect(wrapper.vm.authStore.user).toBeDefined();
    expect(wrapper.vm.authStore.user.id).toBe(1);
  });
});
