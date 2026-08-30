import { defineStore } from 'pinia'
import { ref } from 'vue'

import { supabase } from '@/lib/supabase'
import { cloneDefaultHomeSections } from '@/lib/design'

const fallbackSettings = {
  siteName: 'VueShop',
  siteTagline: 'Your one-stop destination for premium shopping.',
  siteLogo: '',
  fontFamily: 'inter',
  baseFontSize: 'base',
  heroBadge: 'New Collection 2026',
  heroTitleLine1: 'Discover',
  heroTitleLine2: 'Your Next',
  heroTitleLine3: 'Favorite Product',
  heroSubtitle:
    'Shop thousands of premium products at unbeatable prices. Fast delivery, secure payment, and quality guaranteed.',
  heroImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
  heroPrimaryButtonText: 'Shop Now',
  heroSecondaryButtonText: 'Explore',
  heroGradientFrom: '#1d4ed8',
  heroGradientTo: '#818cf8',
  heroGradientAngle: 90,
  heroPaddingY: 'lg',
  heroImageSize: 'lg',
  homeSections: cloneDefaultHomeSections(),
  flashSaleEndsAt: '',
  footerAbout: 'Your one-stop destination for premium shopping.',
  footerCopyright: '© 2026 VueShop. All rights reserved.',
  footerCompanyLinks: ['About', 'Contact', 'Careers'],
  footerSupportLinks: ['Help Center', 'Privacy Policy', 'Terms'],
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref({ ...fallbackSettings })
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const error = ref(null)

  // --------------------------------------------------
  // Fetch (public) — settings live as one JSONB blob in a
  // single-row table (id = true), read-only for anon/customer,
  // writable only by admins (see RLS in 0002_rls.sql).
  // --------------------------------------------------

  const fetchSettings = async ({ force = false } = {}) => {
    if (isLoaded.value && !force) return

    isLoading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase.from('settings').select('data').eq('id', true).single()
      if (err) throw err
      settings.value = { ...fallbackSettings, ...(data?.data || {}) }
      isLoaded.value = true
    } catch (err) {
      error.value = err.message
      // Fall back to defaults so the storefront still renders if the API is down.
    } finally {
      isLoading.value = false
    }
  }

  // --------------------------------------------------
  // Update (admin only — enforced by RLS)
  // --------------------------------------------------

  const updateSettings = async (partial) => {
    const merged = { ...settings.value, ...partial }

    const { error: err } = await supabase.from('settings').update({ data: merged }).eq('id', true)
    if (err) throw err

    settings.value = merged
    return settings.value
  }

  return {
    settings,
    isLoaded,
    isLoading,
    error,
    fetchSettings,
    updateSettings,
  }
})
