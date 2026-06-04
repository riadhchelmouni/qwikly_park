export default [
  // ── Accueil ──────────────────────────────────────────
  {
    title: "Accueil",
    to: { name: "root" },
    icon: { icon: "tabler-smart-home" },
  },

  // ── SERVICES (Admin Caisse / Planning) ───────────────
  { heading: "Services" },
  {
    title: "Offres",
    to: { name: "offers" },
    icon: { icon: "tabler-ticket" },
    action: "offers",
  },
  {
    title: "Clients",
    to: { name: "services-clients" },
    icon: { icon: "tabler-users" },
    action: "clients",
  },
  {
    title: "Achats",
    to: { name: "purchases" },
    icon: { icon: "tabler-shopping-cart" },
    action: "purchases",
  },

  // ── QWIKLY PLANNING ──────────────────────────────────
  { heading: "Qwikly Planning" },
  {
    title: "Statistiques",
    to: { name: "planning-stats" },
    icon: { icon: "tabler-device-desktop-analytics" },
    action: "planning-stats",
  },
  {
    title: "Propriétaires",
    to: { name: "owners" },
    icon: { icon: "tabler-users" },
    action: "owners",
  },

  // ── PARC ─────────────────────────────────────────────
  { heading: "Parc" },
  {
    title: "Gestion des parcs",
    to: { name: "parks" },
    icon: { icon: "tabler-building-community" },
    action: "parks",
  },
  {
    title: "Clients",
    to: { name: "clients" },
    icon: { icon: "tabler-users" },
    action: "clients",
    _key: "clients-parc",
  },
  {
    title: "Employés",
    to: { name: "employees" },
    icon: { icon: "tabler-users" },
    action: "employees",
  },
  {
    title: "Gestion du Stock",
    to: { name: "stock" },
    icon: { icon: "tabler-package" },
    action: "stock",
  },
  {
    title: "Événement & Billetterie",
    to: { name: "events" },
    icon: { icon: "tabler-calendar-event" },
    action: "events",
  },
  {
    title: "Gestion des passes",
    to: { name: "passes" },
    icon: { icon: "tabler-id-badge" },
    action: "passes",
  },
  {
    title: "Gestion des news",
    to: { name: "news" },
    icon: { icon: "tabler-news" },
    action: "news",
  },
  {
    title: "Fournisseurs & Commandes",
    to: { name: "fournisseurs" },
    icon: { icon: "tabler-truck-delivery" },
    action: "fournisseurs",
  },
  {
    title: "Statistiques & Caisse sessions",
    to: { name: "caisse-stats" },
    icon: { icon: "tabler-chart-bar" },
    action: "caisse-stats",
  },
  {
    title: "Paramétrage Financier",
    to: { name: "paramétrage-financier" },
    icon: { icon: "tabler-settings-dollar" },
    action: "paramétrage-financier",
  },
  {
    title: "Fidélité & Codes Promo",
    to: { name: "fidelite" },
    icon: { icon: "tabler-gift" },
    action: "fidelite",
  },
  // ── PUBLICITÉ ────────────────────────────────────────
  { heading: "Publicité" },
  {
    title: "Panneau Publicitaire",
    to: { name: "ads" },
    icon: { icon: "tabler-ad-circle" },
    action: "ads",
  },

  // ── ADMINISTRATION ───────────────────────────────────
  { heading: "Administration" },
  {
    title: "Rôles",
    to: { name: "roles" },
    icon: { icon: "tabler-user-check" },
    action: "roles",
  },
  {
    title: "Utilisateurs",
    to: { name: "users" },
    icon: { icon: "tabler-users" },
    action: "users",
  },
  {
    title: "Profile",
    to: { name: "profile" },
    icon: { icon: "tabler-user" },
  },
];
