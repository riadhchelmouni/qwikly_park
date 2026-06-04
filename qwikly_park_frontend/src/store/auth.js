import { ofetch } from 'ofetch'
import { defineStore } from 'pinia'
import { Ability } from '@casl/ability'

import ability from '@/plugins/casl/ability'

// ── Détection du type de rôle ────────────────────────────────────────────────
const ROLE_SUPER_ADMIN_ID = 1

function getRoleType(user) {
  if (!user?.role) return 'super_admin'
  const name = (user.role.name || '').toLowerCase().trim()
  if (user.role.id === ROLE_SUPER_ADMIN_ID || name === 'super-admin' || name === 'super_admin') return 'super_admin'
  if (name.includes('owner') || name.includes('franchise')) return 'owner'
  if (name.includes('admin-parc') || name.includes('admin parc') || name.includes('admin_parc') || name.includes('park-admin')) return 'admin_parc'
  return 'other'
}

const ADMIN_PARC_ABILITIES = [
  'employees', 'parks', 'clients', 'stock', 'events',
  'passes', 'news', 'fournisseurs', 'caisse-stats',
  'paramétrage-financier', 'fidelite', 'roles', 'users', 'franchise-view',
].map(action => ({ action, subject: 'all' }))

function buildAbilities(user) {
  const roleType = getRoleType(user)

  if (roleType === 'super_admin') {
    return [{ action: 'manage', subject: 'all' }]
  }

  if (roleType === 'owner') {
    return [{ action: 'manage', subject: 'all' }]
  }

  if (roleType === 'admin_parc') {
    return ADMIN_PARC_ABILITIES
  }

  const abilities = []
  const permissions = user.role.permissions || []
  permissions.forEach((p) => {
    if (p.type && !abilities.find((a) => a.action === p.type)) {
      abilities.push({ action: p.type, subject: 'all' })
    }
    if (p.label) {
      abilities.push({ action: p.label, subject: 'all' })
    }
  })
  if (abilities.find(a => a.action === 'owners-stats' || a.action === 'employees-stats')) {
    abilities.push({ action: 'planning-stats', subject: 'all' })
  }
  return abilities
}

const authApi = ofetch.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  headers: {
    'X-Authorization': import.meta.env.VITE_API_KEY,
  },
})

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    selectedFranchiseId: null,
    selectedParkId: null,
  }),

  getters: {
    isSuperAdmin: (state) => getRoleType(state.user) === 'super_admin',
    isOwner:      (state) => getRoleType(state.user) === 'owner',
    isAdminParc:  (state) => getRoleType(state.user) === 'admin_parc',
    roleType:     (state) => getRoleType(state.user),

    franchiseId: (state) =>
      getRoleType(state.user) === 'super_admin'
        ? state.selectedFranchiseId
        : (state.user?.franchise_id ?? null),

    roleName: (state) => state.user?.role?.name ?? '—',
  },

  persist: {
    enabled: true,
    strategies: [{ storage: localStorage }],
  },

  actions: {
    _applyAbilities() {
      const abilities = buildAbilities(this.user)
      localStorage.setItem('userAbilities', JSON.stringify(abilities))
      ability.update(abilities)
    },

    selectFranchise(franchiseId) {
      this.selectedFranchiseId = franchiseId
    },

    selectPark(parkId) {
      this.selectedParkId = parkId
    },

    async login(identifier, password) {
      const res = await authApi('/login', {
        method: 'POST',
        body: { identifier, password },
      })
      this.token = res.authorisation.token
      this.user = res.user
      localStorage.locale = res.user.language
      localStorage.setItem('Qwikly-isRtl', res.user.language === 'ar')
      this._applyAbilities()
      return res
    },

    async getUser() {
      const res = await authApi('/get', {
        method: 'GET',
        headers: this._authHeaders(),
      })
      this.user = res.user
      localStorage.locale = res.user.language
      localStorage.setItem('Qwikly-isRtl', res.user.language === 'ar')
      return res
    },

    async update(formdata) {
      return authApi('/update', {
        method: 'POST',
        body: formdata,
        headers: this._authHeaders(),
      })
    },

    async logout() {
      try {
        await authApi('/logout', {
          method: 'POST',
          headers: this._authHeaders(),
        })
      } finally {
        this._clearSession()
      }
    },

    async changePassword(payload) {
      return authApi('/change-password', {
        method: 'POST',
        body: payload,
        headers: this._authHeaders(),
      })
    },

    async sendPasswordLink(email) {
      return authApi('/forget-password', {
        method: 'POST',
        body: { email },
      })
    },

    async resetPassword({ email, password, password_confirmation, token }) {
      return authApi('/reset-password', {
        method: 'POST',
        body: { email, password, password_confirmation, token },
      })
    },

    _authHeaders() {
      return {
        Authorization: `Bearer ${this.token}`,
      }
    },

    _clearSession() {
      this.token = null
      this.user = null
      this.selectedFranchiseId = null
      this.selectedParkId = null
      localStorage.removeItem('auth')
      localStorage.removeItem('userAbilities')
      ability.update([{ action: 'read', subject: 'Auth' }])
    },
  },
})
