import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { supabase } from '@/lib/supabase'

export const useAdminAuthStore = defineStore('adminAuth', () => {
  const user = ref(null)
  const role = ref(null)
  const isReady = ref(false)

  // isAdmin reflects the `role` column read back from the `profiles`
  // table under RLS — a customer account will simply get role=null
  // here (or the read itself returns nothing) no matter what they do
  // client-side. This is never decided by comparing an email string.
  const isAdmin = computed(() => role.value === 'admin')

  const loadRole = async (session) => {
    if (!session?.user) {
      user.value = null
      role.value = null
      return
    }

    const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()

    if (error || !profile) {
      user.value = null
      role.value = null
      return
    }

    user.value = { id: session.user.id, email: session.user.email }
    role.value = profile.role
  }

  let initPromise = null

  const init = () => {
    if (initPromise) return initPromise

    initPromise = (async () => {
      const { data } = await supabase.auth.getSession()
      await loadRole(data.session)
      isReady.value = true

      supabase.auth.onAuthStateChange((_event, session) => {
        loadRole(session)
      })
    })()

    return initPromise
  }

  // --------------------------------------------------
  // Login — signs in with normal Supabase Auth, then checks role.
  // A customer's credentials will authenticate fine (it's the same
  // auth.users table) but isAdmin will be false, so the router guard
  // (see router/index.js) sends them straight back out.
  // --------------------------------------------------

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) return { success: false, error: error.message }

    await loadRole(data.session)

    if (role.value !== 'admin') {
      await supabase.auth.signOut()
      user.value = null
      role.value = null
      return { success: false, error: 'This account does not have admin access.' }
    }

    return { success: true }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    user.value = null
    role.value = null
  }

  return {
    user,
    role,
    isReady,
    isAdmin,
    init,
    login,
    logout,
  }
})
