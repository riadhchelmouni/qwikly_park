/**
 * Functional Tests — Events flow (UI interactions + API calls)
 * Tests: filter application, modal lifecycle, form submission, deletion
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import axios from "axios";
import EventsList from "@/views/events/tabs/EventsList.vue";

const mockEvents = [
  { id: 1, name: "Fête Printemps",   category: "Anniversaire", status: "active",   date_start: "2026-05-10", park_id: 1 },
  { id: 2, name: "Concert Été",      category: "Concert",      status: "inactive", date_start: "2026-07-20", park_id: 2 },
  { id: 3, name: "Tournoi Automne",  category: "Sport",        status: "full",     date_start: "2026-10-05", park_id: 1 },
];

function mountComponent() {
  return mount(EventsList, {
    global: { stubs: { teleport: true } },
  });
}

// ════════════════════════════════════════════════════════════════════════════
describe("Events — API loading", () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({
      data: { data: mockEvents, total: 3, current_page: 1, per_page: 12 },
    });
  });

  it("calls GET /events on mount", async () => {
    mountComponent();
    await flushPromises();
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/events"),
      expect.any(Object)
    );
  });

  it("loads events into component after mount", async () => {
    const wrapper = mountComponent();
    await flushPromises();
    expect(wrapper.vm.events).toHaveLength(3);
    expect(wrapper.vm.events[0].name).toBe("Fête Printemps");
  });

  it("sets total from API response", async () => {
    const wrapper = mountComponent();
    await flushPromises();
    expect(wrapper.vm.total).toBe(3);
  });

  it("sets isLoading to false after load", async () => {
    const wrapper = mountComponent();
    await flushPromises();
    expect(wrapper.vm.isLoading).toBe(false);
  });

  it("handles API error gracefully — events stays empty", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network error"));
    const wrapper = mountComponent();
    await flushPromises();
    expect(wrapper.vm.events).toEqual([]);
    expect(wrapper.vm.isLoading).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("Events — Create modal lifecycle", () => {
  let wrapper;
  beforeEach(async () => {
    axios.get.mockResolvedValue({ data: { data: [], total: 0 } });
    wrapper = mountComponent();
    await flushPromises();
  });

  it("formDialog is closed by default", () => {
    expect(wrapper.vm.formDialog).toBe(false);
  });

  it("openCreate() sets formDialog to true", () => {
    wrapper.vm.openCreate();
    expect(wrapper.vm.formDialog).toBe(true);
  });

  it("openCreate() resets form fields", () => {
    wrapper.vm.form.name = "existing name";
    wrapper.vm.openCreate();
    expect(wrapper.vm.form.name).toBe("");
  });

  it("openCreate() sets step to 1", () => {
    wrapper.vm.step = 2;
    wrapper.vm.openCreate();
    expect(wrapper.vm.step).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("Events — Edit modal lifecycle", () => {
  let wrapper;
  const eventToEdit = {
    id: 1, name: "Fête Printemps", category: "Anniversaire",
    status: "active", date_start: "2026-05-10",
    park_id: 2, heure_debut: "10:00", heure_fin: "18:00",
    prix_billet: "12.00", quantite_billets: "150",
    vente_sur_place: true, vente_en_ligne: false,
  };

  beforeEach(async () => {
    axios.get.mockResolvedValue({ data: { data: [], total: 0 } });
    wrapper = mountComponent();
    await flushPromises();
  });

  it("openEdit() sets isEditing to true", () => {
    wrapper.vm.openEdit(eventToEdit);
    expect(wrapper.vm.isEditing).toBe(true);
  });

  it("openEdit() populates form.name", () => {
    wrapper.vm.openEdit(eventToEdit);
    expect(wrapper.vm.form.name).toBe("Fête Printemps");
  });

  it("openEdit() populates form.heure_debut and heure_fin", () => {
    wrapper.vm.openEdit(eventToEdit);
    expect(wrapper.vm.form.heure_debut).toBe("10:00");
    expect(wrapper.vm.form.heure_fin).toBe("18:00");
  });

  it("openEdit() populates billetterie fields", () => {
    wrapper.vm.openEdit(eventToEdit);
    expect(wrapper.vm.form.prix_billet).toBe("12.00");
    expect(wrapper.vm.form.quantite_billets).toBe("150");
    expect(wrapper.vm.form.vente_sur_place).toBe(true);
  });

  it("openEdit() opens formDialog", () => {
    wrapper.vm.openEdit(eventToEdit);
    expect(wrapper.vm.formDialog).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("Events — Save (create) API call", () => {
  let wrapper;
  beforeEach(async () => {
    axios.get.mockResolvedValue({ data: { data: [], total: 0 } });
    axios.post.mockResolvedValue({
      data: { event: { id: 99, name: "Nouvel Événement", status: "active", date_start: "2026-06-01" } },
    });
    wrapper = mountComponent();
    await flushPromises();
  });

  it("calls POST /events with FormData", async () => {
    wrapper.vm.openCreate();
    wrapper.vm.form.name = "Nouvel Événement";
    wrapper.vm.form.date_start = "2026-06-01";
    wrapper.vm.form.category = "Sport";
    wrapper.vm.form.park_id = 1;

    await wrapper.vm.saveEvent();
    await flushPromises();

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/events"),
      expect.any(FormData),
      expect.any(Object)
    );
  });

  it("adds new event to events array on success", async () => {
    wrapper.vm.openCreate();
    wrapper.vm.form.name = "Nouvel Événement";
    await wrapper.vm.saveEvent();
    await flushPromises();
    expect(wrapper.vm.events.some(e => e.id === 99)).toBe(true);
  });

  it("closes formDialog on success", async () => {
    wrapper.vm.openCreate();
    await wrapper.vm.saveEvent();
    await flushPromises();
    expect(wrapper.vm.formDialog).toBe(false);
  });

  it("shows error snackbar on API failure", async () => {
    axios.post.mockRejectedValueOnce(new Error("Server error"));
    wrapper.vm.openCreate();
    await wrapper.vm.saveEvent();
    await flushPromises();
    expect(wrapper.vm.snackVisible).toBe(true);
    expect(wrapper.vm.snackColor).toBe("error");
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("Events — Save (edit) API call", () => {
  let wrapper;
  const eventToEdit = { id: 5, name: "Ancien Nom", category: "Concert", status: "active", date_start: "2026-05-01", park_id: 1 };

  beforeEach(async () => {
    axios.get.mockResolvedValue({ data: { data: [eventToEdit], total: 1 } });
    axios.post.mockResolvedValue({
      data: { event: { ...eventToEdit, name: "Nouveau Nom" } },
    });
    wrapper = mountComponent();
    await flushPromises();
  });

  it("uses PUT method via _method field for edit", async () => {
    wrapper.vm.openEdit(eventToEdit);
    await wrapper.vm.saveEvent();
    await flushPromises();

    const callArgs = axios.post.mock.calls.at(-1);
    const fd = callArgs[1];
    expect(fd.get("_method")).toBe("PUT");
  });

  it("updates existing event in the list on success", async () => {
    wrapper.vm.openEdit(eventToEdit);
    wrapper.vm.form.name = "Nouveau Nom";
    await wrapper.vm.saveEvent();
    await flushPromises();
    const updated = wrapper.vm.events.find(e => e.id === 5);
    expect(updated?.name).toBe("Nouveau Nom");
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("Events — Delete flow", () => {
  let wrapper;
  beforeEach(async () => {
    axios.get.mockResolvedValue({
      data: { data: [...mockEvents], total: 3 },
    });
    axios.delete.mockResolvedValue({ data: { message: "Deleted" } });
    wrapper = mountComponent();
    await flushPromises();
  });

  it("openDelete() sets current and opens deleteDialog", () => {
    wrapper.vm.openDelete(mockEvents[0]);
    expect(wrapper.vm.current).toEqual(mockEvents[0]);
    expect(wrapper.vm.deleteDialog).toBe(true);
  });

  it("confirmDelete() calls DELETE /events/{id}", async () => {
    wrapper.vm.openDelete(mockEvents[0]);
    await wrapper.vm.confirmDelete();
    await flushPromises();
    expect(axios.delete).toHaveBeenCalledWith(
      expect.stringContaining(`/events/${mockEvents[0].id}`),
      expect.any(Object)
    );
  });

  it("removes deleted event from events array", async () => {
    wrapper.vm.openDelete(mockEvents[0]);
    await wrapper.vm.confirmDelete();
    await flushPromises();
    expect(wrapper.vm.events.some(e => e.id === mockEvents[0].id)).toBe(false);
  });

  it("closes deleteDialog on success", async () => {
    wrapper.vm.openDelete(mockEvents[0]);
    await wrapper.vm.confirmDelete();
    await flushPromises();
    expect(wrapper.vm.deleteDialog).toBe(false);
  });

  it("shows error snackbar if delete fails", async () => {
    axios.delete.mockRejectedValueOnce(new Error("Forbidden"));
    wrapper.vm.openDelete(mockEvents[0]);
    await wrapper.vm.confirmDelete();
    await flushPromises();
    expect(wrapper.vm.snackVisible).toBe(true);
    expect(wrapper.vm.snackColor).toBe("error");
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe("Events — Filters", () => {
  let wrapper;
  beforeEach(async () => {
    axios.get.mockResolvedValue({ data: { data: [], total: 0 } });
    wrapper = mountComponent();
    await flushPromises();
  });

  it("sets filterParc when applying parc filter", async () => {
    wrapper.vm.filterParc = 2;
    await wrapper.vm.loadEvents();
    await flushPromises();
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/events"),
      expect.objectContaining({
        params: expect.objectContaining({ park_id: 2 }),
      })
    );
  });

  it("sets filterStatut when applying status filter", async () => {
    wrapper.vm.filterStatut = "active";
    await wrapper.vm.loadEvents();
    await flushPromises();
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/events"),
      expect.objectContaining({
        params: expect.objectContaining({ status: "active" }),
      })
    );
  });
});
