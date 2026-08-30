// src/data/products.js

export const products = [
  {
    id: 1,
    slug: "wireless-headphones",
    title: "Wireless Headphones",
    brand: "Sony",
    category: "Audio",

    price: 89.99,
    originalPrice: 119.99,

    rating: 4.8,
    reviews: 120,

    stock: 15,
    badge: "SALE",
    featured: true,
    flashSale: true,

    description:
      "Premium wireless headphones with active noise cancellation, crystal-clear sound, and up to 30 hours of battery life.",

    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",

    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800",
    ],
  },

  {
    id: 2,
    slug: "smart-watch",
    title: "Smart Watch",
    brand: "Apple",
    category: "Wearables",

    price: 129.99,
    originalPrice: 159.99,

    rating: 4.6,
    reviews: 89,

    stock: 20,
    badge: "NEW",
    featured: true,
    flashSale: true,

    description:
      "Modern smartwatch featuring fitness tracking, heart-rate monitoring, GPS, and seamless smartphone connectivity.",

    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",

    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
      "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=800",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800",
    ],
  },

  {
    id: 3,
    slug: "gaming-laptop",
    title: "Gaming Laptop",
    brand: "ASUS",
    category: "Computers",

    price: 999.99,
    originalPrice: 1199.99,

    rating: 4.9,
    reviews: 214,

    stock: 8,
    badge: "HOT",
    featured: true,
    flashSale: false,

    description:
      "Powerful gaming laptop with a high-refresh-rate display, dedicated graphics card, and the latest Intel processor.",

    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800",

    images: [
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800",
      "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=800",
      "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800",
    ],
  },

  {
    id: 4,
    slug: "mirrorless-camera",
    title: "Mirrorless Camera",
    brand: "Canon",
    category: "Camera",

    price: 699.99,
    originalPrice: 799.99,

    rating: 4.7,
    reviews: 95,

    stock: 12,
    badge: "SALE",
    featured: true,
    flashSale: true,

    description:
      "Capture stunning photos and 4K videos with this lightweight mirrorless camera featuring interchangeable lenses.",

    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800",

    images: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800",
      "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=800",
    ],
  },

  {
    id: 5,
    slug: "mechanical-keyboard",
    title: "Mechanical Keyboard",
    brand: "Keychron",
    category: "Accessories",

    price: 79.99,
    originalPrice: 99.99,

    rating: 4.7,
    reviews: 140,

    stock: 25,
    badge: "NEW",
    featured: false,
    flashSale: true,

    description:
      "Compact RGB mechanical keyboard with hot-swappable switches for an exceptional typing experience.",

    image:
      "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800",

    images: [
      "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800",
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800",
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800",
    ],
  },

  {
    id: 6,
    slug: "gaming-mouse",
    title: "Gaming Mouse",
    brand: "Logitech",
    category: "Accessories",

    price: 59.99,
    originalPrice: 79.99,

    rating: 4.8,
    reviews: 172,

    stock: 30,
    badge: "SALE",
    featured: true,
    flashSale: false,

    description:
      "Ergonomic gaming mouse with programmable buttons, adjustable DPI, and ultra-low latency.",

    image:
      "https://images.unsplash.com/photo-1527814050087-3793815479db?w=800",

    images: [
      "https://images.unsplash.com/photo-1527814050087-3793815479db?w=800",
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800",
      "https://images.unsplash.com/photo-1563297007-0686b7003af7?w=800",
    ],
  },

  {
    id: 7,
    slug: "bluetooth-speaker",
    title: "Bluetooth Speaker",
    brand: "JBL",
    category: "Audio",

    price: 99.99,
    originalPrice: 129.99,

    rating: 4.5,
    reviews: 82,

    stock: 18,
    badge: "HOT",
    featured: false,
    flashSale: true,

    description:
      "Portable Bluetooth speaker with deep bass, waterproof design, and up to 20 hours of battery life.",

    image:
      "https://images.unsplash.com/photo-1589003077984-894e133dabab?w=800",

    images: [
      "https://images.unsplash.com/photo-1589003077984-894e133dabab?w=800",
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800",
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800",
    ],
  },

  {
    id: 8,
    slug: "tablet-pro",
    title: "Tablet Pro",
    brand: "Samsung",
    category: "Tablets",

    price: 549.99,
    originalPrice: 649.99,

    rating: 4.7,
    reviews: 101,

    stock: 10,
    badge: "NEW",
    featured: true,
    flashSale: false,

    description:
      "High-performance tablet with a vibrant display, powerful processor, and all-day battery life.",

    image:
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800",

    images: [
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800",
      "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800",
      "https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=800",
    ],
  },
];
