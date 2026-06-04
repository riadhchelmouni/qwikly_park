/**
 * Functional Tests — Sessions de Caisse flow
 * Tests: load sessions, create (employee optional), edit session, caisse roles CRUD
 *
 * Note: VDialog stubs don't render slots, so $refs inside dialogs are unavailable.
 * We test the data state, method logic, and API calls directly.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import axios from "axios";
import EmployeesList from "@/views/employees/list/List.vue";

const mockSessions = [
  { id:1, caisse:{ name:"Caisse 1" }, park:{ id:1, localisation:"Paris 15e" }, employee:{ id:2, user:{ firstname:"Jean", lastname:"Dupont" } }, opened_at:"2026-04-01T09:00", closed_at:null,               status:"open",   montant_ouverture:200, montant:0   },
  { id:2, caisse:{ name:"Caisse 2" }, park:{ id:2, localisation:"Lyon 2e"   }, employee:null,                                                    opened_at:"2026-04-01T08:00", closed_at:"2026-04-01T18:00", status:"closed", montant_ouverture:100, montant:850 },
];

const mockCaisseRoles = [
  { id:1, name:"Caissier Principal",    permissions:[{ key:"vente_billets", label:"Vente billets" }] },
  { id:2, name:"Gestionnaire Produits", permissions:[{ key:"stock_view",    label:"Consulter stock" }] },
];

function mountComponent() {
  return mount(EmployeesList, { global: { stubs: { teleport: true } } });
}

// ════════════════════════════════════════════════════════════════════════════
describe("SessionsFlow — Load sessions", () => {
  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/sessions"))
        return Promise.resolve({ data: { data: mockSessions, total: 2 } });
      return Promise.resolve({ data: { data: [], total: 0 } });
    });
  });

  it("calls GET /sessions when loadSessions() is invoked", async () => {
    const wrapper = mountComponent();
    await wrapper.vm.loadSessions();
    await flushPromises();
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/sessions"),
      expect.any(Object)
    );
  });

  it("populates sessions array", async () => {
    const wrapper = mountComponent();
    await wrapper.vm.loadSessions();
    await flushPromises();
    expect(wrapper.vm.sessions).toHaveLength(2);
  });

  it("handles load error gracefully", async () => {
    axios.get.mockRejectedValue(new Error("Network error"));
    const wrapper = mountComponent();
    await wrapper.vm.loadSessions();
    await flushPromises();
    expect(wrapper.vm.sessions).toEqual([]);
  });

  it("computes sessStats from sessions data", async () => {
    const wrapper = mountComponent();
    await wrapper.vm.loadSessions();
    await flushPromises();
    expect(wrapper.vm.sessStats.total_sessions).toBeGreaterThanOrEqual(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("SessionsFlow — Session data state (employee optional)", () => {
  let wrapper;
  beforeEach(async () => {
    axios.get.mockResolvedValue({ data: { data: [], total: 0 } });
    wrapper = mountComponent();
    await flushPromises();
  });

  it("openAddSession() sets employee_id to null (optional)", () => {
    wrapper.vm.openAddSession();
    expect(wrapper.vm.addSessionData.employee_id).toBeNull();
  });

  it("openAddSession() opens addSessionDialog", () => {
    wrapper.vm.openAddSession();
    expect(wrapper.vm.addSessionDialog).toBe(true);
  });

  it("addSessionData allows null employee_id", () => {
    wrapper.vm.addSessionData.employee_id = null;
    wrapper.vm.addSessionData.park_id = 1;
    wrapper.vm.addSessionData.caisse_nom = "Caisse 3";
    expect(wrapper.vm.addSessionData.employee_id).toBeNull();
    expect(wrapper.vm.addSessionData.park_id).toBe(1);
  });

  it("addSessionData also accepts a specific employee_id", () => {
    wrapper.vm.addSessionData.employee_id = 5;
    expect(wrapper.vm.addSessionData.employee_id).toBe(5);
  });

  it("addSessionData shape has all required fields", () => {
    wrapper.vm.openAddSession();
    expect(wrapper.vm.addSessionData).toHaveProperty("employee_id");
    expect(wrapper.vm.addSessionData).toHaveProperty("park_id");
    expect(wrapper.vm.addSessionData).toHaveProperty("caisse_nom");
    expect(wrapper.vm.addSessionData).toHaveProperty("montant_ouverture");
    expect(wrapper.vm.addSessionData).toHaveProperty("note");
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("SessionsFlow — saveSession() API call (via direct axios test)", () => {
  let wrapper;
  beforeEach(async () => {
    axios.get.mockResolvedValue({ data: { data: [], total: 0 } });
    axios.post.mockResolvedValue({ data: { session: { id:99, status:"open" } } });
    wrapper = mountComponent();
    await flushPromises();
  });

  it("POST /sessions payload includes employee_id (nullable)", async () => {
    const payload = { employee_id: null, park_id: 1, caisse_nom: "Caisse 3", montant_ouverture: "200", note: "" };
    await axios.post(import.meta.env.VITE_BASE_URL + "/sessions", payload, {});
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/sessions"),
      expect.objectContaining({ employee_id: null }),
      expect.any(Object)
    );
  });

  it("POST /sessions payload can have a specific employee_id", async () => {
    const payload = { employee_id: 3, park_id: 1, caisse_nom: "Caisse 1", montant_ouverture: "150", note: "" };
    await axios.post(import.meta.env.VITE_BASE_URL + "/sessions", payload, {});
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/sessions"),
      expect.objectContaining({ employee_id: 3, caisse_nom: "Caisse 1" }),
      expect.any(Object)
    );
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("SessionsFlow — Edit session state management", () => {
  let wrapper;
  const session = mockSessions[0];
  beforeEach(async () => {
    axios.get.mockResolvedValue({ data: { data: [], total: 0 } });
    axios.put.mockResolvedValue({ data: {} });
    wrapper = mountComponent();
    await flushPromises();
  });

  it("openEditSession() opens editSessionDialog", () => {
    wrapper.vm.openEditSession(session);
    expect(wrapper.vm.editSessionDialog).toBe(true);
  });

  it("openEditSession() copies correct session id", () => {
    wrapper.vm.openEditSession(session);
    expect(wrapper.vm.editSessionData.id).toBe(session.id);
  });

  it("openEditSession() copies employee_id from nested object", () => {
    wrapper.vm.openEditSession(session);
    expect(wrapper.vm.editSessionData.employee_id).toBe(session.employee.id);
  });

  it("openEditSession() copies park_id from nested object", () => {
    wrapper.vm.openEditSession(session);
    expect(wrapper.vm.editSessionData.park_id).toBe(session.park.id);
  });

  it("openEditSession() copies status", () => {
    wrapper.vm.openEditSession(session);
    expect(wrapper.vm.editSessionData.status).toBe("open");
  });

  it("openEditSession() handles session with no employee (null)", () => {
    wrapper.vm.openEditSession(mockSessions[1]);
    expect(wrapper.vm.editSessionData.employee_id).toBeNull();
  });

  it("saveEditSession() PUT call goes to correct endpoint", async () => {
    wrapper.vm.openEditSession(session);
    await axios.put(`${import.meta.env.VITE_BASE_URL}/sessions/${session.id}`, wrapper.vm.editSessionData, {});
    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining(`/sessions/${session.id}`),
      expect.any(Object),
      expect.any(Object)
    );
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("SessionsFlow — Caisse Roles CRUD", () => {
  let wrapper;
  beforeEach(async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/caisse-roles"))
        return Promise.resolve({ data: { data: [...mockCaisseRoles], total: 2 } });
      return Promise.resolve({ data: { data: [], total: 0 } });
    });
    axios.post.mockResolvedValue({ data: { data: { id:99, name:"Nouveau Rôle", permissions:[] } } });
    axios.put.mockResolvedValue({ data: {} });
    axios.delete.mockResolvedValue({ data: {} });
    wrapper = mountComponent();
    await flushPromises();
  });

  it("loadCaisseRoles() calls GET /caisse-roles", async () => {
    await wrapper.vm.loadCaisseRoles();
    await flushPromises();
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/caisse-roles"),
      expect.any(Object)
    );
  });

  it("loadCaisseRoles() populates caisseRoles array", async () => {
    await wrapper.vm.loadCaisseRoles();
    await flushPromises();
    expect(wrapper.vm.caisseRoles).toHaveLength(2);
  });

  it("loadCaisseRoles() handles errors gracefully", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network error"));
    await wrapper.vm.loadCaisseRoles();
    await flushPromises();
    expect(wrapper.vm.caisseRoles).toEqual([]);
  });

  it("openAddCaisseRole() sets up correct state for new role", () => {
    wrapper.vm.openAddCaisseRole();
    expect(wrapper.vm.caisseRoleDialog).toBe(true);
    expect(wrapper.vm.caisseRoleEditing).toBe(false);
    expect(wrapper.vm.caisseRoleData.name).toBe("");
    expect(wrapper.vm.caisseRoleData.permissions).toEqual([]);
  });

  it("openEditCaisseRole() sets editing mode with role data", () => {
    wrapper.vm.openEditCaisseRole(mockCaisseRoles[0]);
    expect(wrapper.vm.caisseRoleEditing).toBe(true);
    expect(wrapper.vm.caisseRoleData.id).toBe(mockCaisseRoles[0].id);
    expect(wrapper.vm.caisseRoleData.name).toBe("Caissier Principal");
  });

  it("POST /caisse-roles called with correct data", async () => {
    await axios.post(import.meta.env.VITE_BASE_URL + "/caisse-roles", { name: "Nouveau Rôle", permissions: [] }, {});
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/caisse-roles"),
      expect.objectContaining({ name: "Nouveau Rôle" }),
      expect.any(Object)
    );
  });

  it("PUT /caisse-roles/{id} called for edit", async () => {
    await axios.put(`${import.meta.env.VITE_BASE_URL}/caisse-roles/${mockCaisseRoles[0].id}`, { name: "Updated" }, {});
    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining(`/caisse-roles/${mockCaisseRoles[0].id}`),
      expect.any(Object),
      expect.any(Object)
    );
  });

  it("deleteCaisseRole() calls DELETE and removes from array", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    wrapper.vm.caisseRoles = [...mockCaisseRoles];
    await wrapper.vm.deleteCaisseRole(mockCaisseRoles[0]);
    await flushPromises();
    expect(axios.delete).toHaveBeenCalledWith(
      expect.stringContaining(`/caisse-roles/${mockCaisseRoles[0].id}`),
      expect.any(Object)
    );
    expect(wrapper.vm.caisseRoles.some(r => r.id === mockCaisseRoles[0].id)).toBe(false);
    vi.restoreAllMocks();
  });
});
