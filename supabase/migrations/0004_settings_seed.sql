-- =====================================================================
-- VueShop — default settings payload (same defaults the old
-- localStorage-only version shipped with, so Admin > Settings/Design
-- looks identical the first time it loads)
-- =====================================================================

update public.settings
set data = '{
  "siteName": "VueShop",
  "siteTagline": "Your one-stop destination for premium shopping.",
  "siteLogo": "",
  "fontFamily": "inter",
  "baseFontSize": "base",
  "heroBadge": "New Collection 2026",
  "heroTitleLine1": "Discover",
  "heroTitleLine2": "Your Next",
  "heroTitleLine3": "Favorite Product",
  "heroSubtitle": "Shop thousands of premium products at unbeatable prices. Fast delivery, secure payment, and quality guaranteed.",
  "heroImage": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
  "heroPrimaryButtonText": "Shop Now",
  "heroSecondaryButtonText": "Explore",
  "heroGradientFrom": "#1d4ed8",
  "heroGradientTo": "#818cf8",
  "heroGradientAngle": 90,
  "heroPaddingY": "lg",
  "heroImageSize": "lg",
  "homeSections": [
    { "key": "hero", "label": "Hero Banner", "visible": true },
    { "key": "categories", "label": "Shop by Category", "visible": true },
    { "key": "flashSale", "label": "Flash Sale", "visible": true },
    { "key": "featuredProducts", "label": "Featured Products", "visible": true },
    { "key": "whyChooseUs", "label": "Why Choose Us", "visible": true }
  ],
  "flashSaleEndsAt": "",
  "footerAbout": "Your one-stop destination for premium shopping.",
  "footerCopyright": "© 2026 VueShop. All rights reserved.",
  "footerCompanyLinks": ["About", "Contact", "Careers"],
  "footerSupportLinks": ["Help Center", "Privacy Policy", "Terms"]
}'::jsonb
where id = true;
