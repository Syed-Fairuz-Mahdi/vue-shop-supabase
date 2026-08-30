import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { supabase } from '@/lib/supabase'

// --------------------------------------------------
// Existing views read authStore.user.name / .email / .id — map the
// Supabase session + profiles row into that same shape so LoginView,
// RegisterView, ProfileView, navbar.vue didn't need template changes.
// --------------------------------------------------
const mapUser = (session, profile) => {
  if (!session?.user) return null

  return {
    id: session.user.id,
    email: session.user.email,
    name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email,
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isReady = ref(false)

  const isLoggedIn = computed(() => user.value !== null)

  const loadProfile = async (session) => {
    if (!session?.user) {
      user.value = null
      return
    }

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()

    user.value = mapUser(session, profile)
  }

  // --------------------------------------------------
  // Call once on app startup (see App.vue) — restores any existing
  // session and keeps `user` in sync with sign-in/out from any tab.
  // --------------------------------------------------

  let initPromise = null

  const init = () => {
    if (initPromise) return initPromise

    initPromise = (async () => {
      const { data } = await supabase.auth.getSession()
      await loadProfile(data.session)
      isReady.value = true

      supabase.auth.onAuthStateChange((_event, session) => {
        loadProfile(session)
      })
    })()

    return initPromise
  }

  // --------------------------------------------------
  // Register
  // --------------------------------------------------

  const register = async (userData) => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: { full_name: userData.name },
      },
    })

    if (error) throw new Error(error.message)

    // If email confirmation is enabled on the project there is no
    // session yet — the caller (RegisterView) should tell the user to
    // check their inbox rather than assuming they're logged in.
    if (data.session) {
      await loadProfile(data.session)
    }

    return { confirmationRequired: !data.session }
  }

  // --------------------------------------------------
  // Login
  // --------------------------------------------------

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) return false

    await loadProfile(data.session)
    return true
  }

  // --------------------------------------------------
  // Password recovery
  // --------------------------------------------------

  const sendPasswordReset = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw new Error(error.message)
  }

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw new Error(error.message)
  }

  // --------------------------------------------------
  // Profile update (name / email)
  // --------------------------------------------------

  const updateProfile = async ({ name, email }) => {
    if (!user.value) return

    if (email && email !== user.value.email) {
      const { error: authErr } = await supabase.auth.updateUser({ email })
      if (authErr) throw new Error(authErr.message)
    }

    const { error: profileErr } = await supabase.from('profiles').update({ full_name: name }).eq('id', user.value.id)
    if (profileErr) throw new Error(profileErr.message)

    user.value = { ...user.value, name, email: email || user.value.email }
  }

  // --------------------------------------------------
  // Logout
  // --------------------------------------------------

  const logout = async () => {
    await supabase.auth.signOut()
    user.value = null
  }

  return {
    user,
    isReady,
    isLoggedIn,
    init,
    register,
    login,
    logout,
    sendPasswordReset,
    updatePassword,
    updateProfile,
  }
})
