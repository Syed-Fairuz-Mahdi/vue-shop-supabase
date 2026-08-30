-- =====================================================================
-- VueShop — seed data: dummy products & categories
-- =====================================================================
-- These are the SAME 8 placeholder products the frontend shipped with.
-- They are flagged is_dummy = true so they can be found/bulk-removed
-- later in one query: delete from products where is_dummy = true;
-- =====================================================================

insert into public.categories (title, slug, icon) values
  ('Audio', 'audio', '🎧'),
  ('Wearables', 'wearables', '⌚'),
  ('Computers', 'computers', '💻'),
  ('Camera', 'camera', '📷'),
  ('Accessories', 'accessories', '🖱️'),
  ('Tablets', 'tablets', '📱')
on conflict (title) do nothing;

-- Insert products, resolving category_id by title via a CTE per row.
with cat as (select id, title from public.categories)
insert into public.products (slug, title, brand, category_id, price, original_price, stock, badge, featured, flash_sale, description, image, is_dummy, rating, review_count)
values
  ('wireless-headphones', 'Wireless Headphones', 'Sony', (select id from cat where title = 'Audio'), 89.99, 119.99, 15, 'SALE', true, true, 'Premium wireless headphones with active noise cancellation, crystal-clear sound, and up to 30 hours of battery life.', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', true, 4.8, 120),
  ('smart-watch', 'Smart Watch', 'Apple', (select id from cat where title = 'Wearables'), 129.99, 159.99, 20, 'NEW', true, true, 'Modern smartwatch featuring fitness tracking, heart-rate monitoring, GPS, and seamless smartphone connectivity.', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', true, 4.6, 89),
  ('gaming-laptop', 'Gaming Laptop', 'ASUS', (select id from cat where title = 'Computers'), 999.99, 1199.99, 8, 'HOT', true, false, 'Powerful gaming laptop with a high-refresh-rate display, dedicated graphics card, and the latest Intel processor.', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800', true, 4.9, 214),
  ('mirrorless-camera', 'Mirrorless Camera', 'Canon', (select id from cat where title = 'Camera'), 699.99, 799.99, 12, 'SALE', true, true, 'Capture stunning photos and 4K videos with this lightweight mirrorless camera featuring interchangeable lenses.', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800', true, 4.7, 95),
  ('mechanical-keyboard', 'Mechanical Keyboard', 'Keychron', (select id from cat where title = 'Accessories'), 79.99, 99.99, 25, 'NEW', false, true, 'Compact RGB mechanical keyboard with hot-swappable switches for an exceptional typing experience.', 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800', true, 4.7, 140),
  ('gaming-mouse', 'Gaming Mouse', 'Logitech', (select id from cat where title = 'Accessories'), 59.99, 79.99, 30, 'SALE', true, false, 'Ergonomic gaming mouse with programmable buttons, adjustable DPI, and ultra-low latency.', 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=800', true, 4.8, 172),
  ('bluetooth-speaker', 'Bluetooth Speaker', 'JBL', (select id from cat where title = 'Audio'), 99.99, 129.99, 18, 'HOT', false, true, 'Portable Bluetooth speaker with deep bass, waterproof design, and up to 20 hours of battery life.', 'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=800', true, 4.5, 82),
  ('tablet-pro', 'Tablet Pro', 'Samsung', (select id from cat where title = 'Tablets'), 549.99, 649.99, 10, 'NEW', true, false, 'High-performance tablet with a vibrant display, powerful processor, and all-day battery life.', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800', true, 4.7, 101)
on conflict (slug) do nothing;

-- Gallery images for each dummy product (product_images table)
insert into public.product_images (product_id, url, position)
select p.id, img.url, img.position
from public.products p
join (values
  ('wireless-headphones', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', 0),
  ('wireless-headphones', 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800', 1),
  ('wireless-headphones', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800', 2),
  ('smart-watch', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', 0),
  ('smart-watch', 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=800', 1),
  ('smart-watch', 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800', 2),
  ('gaming-laptop', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800', 0),
  ('gaming-laptop', 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=800', 1),
  ('gaming-laptop', 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800', 2),
  ('mirrorless-camera', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800', 0),
  ('mirrorless-camera', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800', 1),
  ('mirrorless-camera', 'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=800', 2),
  ('mechanical-keyboard', 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800', 0),
  ('mechanical-keyboard', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800', 1),
  ('mechanical-keyboard', 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800', 2),
  ('gaming-mouse', 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=800', 0),
  ('gaming-mouse', 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800', 1),
  ('gaming-mouse', 'https://images.unsplash.com/photo-1563297007-0686b7003af7?w=800', 2),
  ('bluetooth-speaker', 'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=800', 0),
  ('bluetooth-speaker', 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800', 1),
  ('bluetooth-speaker', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800', 2),
  ('tablet-pro', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800', 0),
  ('tablet-pro', 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800', 1),
  ('tablet-pro', 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=800', 2)
) as img(slug, url, position) on img.slug = p.slug
on conflict do nothing;
