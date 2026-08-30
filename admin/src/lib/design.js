// --------------------------------------------------------------
// Site-wide design options
// --------------------------------------------------------------
// Central source of truth for the customization choices exposed in
// Admin > Design, and applied live on the storefront (App.vue, Hero).
// --------------------------------------------------------------

export const FONT_OPTIONS = [
  {
    id: 'inter',
    label: 'Inter (Default)',
    google: 'Inter:wght@400;500;600;700;800',
    family: '"Inter", ui-sans-serif, system-ui, sans-serif',
  },
  {
    id: 'poppins',
    label: 'Poppins',
    google: 'Poppins:wght@400;500;600;700;800',
    family: '"Poppins", ui-sans-serif, system-ui, sans-serif',
  },
  {
    id: 'roboto',
    label: 'Roboto',
    google: 'Roboto:wght@400;500;700;900',
    family: '"Roboto", ui-sans-serif, system-ui, sans-serif',
  },
  {
    id: 'montserrat',
    label: 'Montserrat',
    google: 'Montserrat:wght@400;500;600;700;800',
    family: '"Montserrat", ui-sans-serif, system-ui, sans-serif',
  },
  {
    id: 'playfair',
    label: 'Playfair Display (Serif)',
    google: 'Playfair+Display:wght@400;500;600;700;800',
    family: '"Playfair Display", ui-serif, Georgia, serif',
  },
  {
    id: 'lora',
    label: 'Lora (Serif)',
    google: 'Lora:wght@400;500;600;700',
    family: '"Lora", ui-serif, Georgia, serif',
  },
  {
    id: 'system',
    label: 'System Default',
    google: null,
    family:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
]

export const FONT_SIZE_OPTIONS = [
  { id: 'sm', label: 'Small', px: 15 },
  { id: 'base', label: 'Default', px: 16 },
  { id: 'lg', label: 'Large', px: 17 },
  { id: 'xl', label: 'Extra Large', px: 18 },
]

export const HERO_SIZE_OPTIONS = [
  { id: 'sm', label: 'Compact', py: 48 },
  { id: 'md', label: 'Medium', py: 64 },
  { id: 'lg', label: 'Large (Default)', py: 80 },
  { id: 'xl', label: 'Extra Large', py: 112 },
]

export const HERO_IMAGE_SIZE_OPTIONS = [
  { id: 'sm', label: 'Small', width: 320 },
  { id: 'md', label: 'Medium', width: 400 },
  { id: 'lg', label: 'Large (Default)', width: 512 },
  { id: 'xl', label: 'Extra Large', width: 600 },
]

export const HERO_GRADIENT_ANGLE_OPTIONS = [
  { id: '90', label: 'Left → Right' },
  { id: '270', label: 'Right → Left' },
  { id: '180', label: 'Top → Bottom' },
  { id: '0', label: 'Bottom → Top' },
  { id: '135', label: 'Diagonal ↘' },
  { id: '45', label: 'Diagonal ↗' },
]

export const DEFAULT_HOME_SECTIONS = [
  { key: 'hero', label: 'Hero Banner', visible: true },
  { key: 'categories', label: 'Shop by Category', visible: true },
  { key: 'flashSale', label: 'Flash Sale', visible: true },
  { key: 'featuredProducts', label: 'Featured Products', visible: true },
  { key: 'whyChooseUs', label: 'Why Choose Us', visible: true },
]

export const cloneDefaultHomeSections = () => DEFAULT_HOME_SECTIONS.map((section) => ({ ...section }))

const GOOGLE_FONT_LINK_ID = 'app-google-font'

// Applies the chosen font family to the whole storefront by setting a CSS
// variable on the root element and swapping in the matching Google Fonts
// stylesheet (skipped entirely for the "System Default" option).
export const applySiteFont = (fontId) => {
  const font = FONT_OPTIONS.find((option) => option.id === fontId) || FONT_OPTIONS[0]

  document.documentElement.style.setProperty('--app-font-family', font.family)

  let link = document.getElementById(GOOGLE_FONT_LINK_ID)

  if (!font.google) {
    if (link) link.remove()
    return
  }

  const href = `https://fonts.googleapis.com/css2?family=${font.google}&display=swap`

  if (!link) {
    link = document.createElement('link')
    link.id = GOOGLE_FONT_LINK_ID
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }

  if (link.href !== href) link.href = href
}

// Scales the whole site (Tailwind's rem-based spacing/typography included)
// by changing the root font-size.
export const applyBaseFontSize = (sizeId) => {
  const size = FONT_SIZE_OPTIONS.find((option) => option.id === sizeId) || FONT_SIZE_OPTIONS[1]
  document.documentElement.style.fontSize = `${size.px}px`
}
