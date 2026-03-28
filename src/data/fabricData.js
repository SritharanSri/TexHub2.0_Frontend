// ─── Static Fabric ↔ Dress-Type Data for TexHub ─────────────────────────────
// All fabric data is hardcoded. No admin management, no localStorage.

/* ────────────────────────── FABRIC CATALOGUE ─────────────────────────────── */

const FABRICS = {
  // ── Cotton family ──
  'cotton': {
    id: 'cotton',
    name: 'Cotton',
    desc: 'Breathable all-day comfort, soft hand-feel, easy to maintain.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?q=80&w=400&auto=format&fit=crop',
    features: ['Breathable', 'Easy Care', 'All Season'],
  },
  'oxford-cotton': {
    id: 'oxford-cotton',
    name: 'Oxford Cotton',
    desc: 'Basket-weave texture, slightly heavier than poplin. Great for formal shirts.',
    image: 'https://images.unsplash.com/photo-1528459105426-b9548367069b?q=80&w=400&auto=format&fit=crop',
    features: ['Structured', 'Formal', 'Durable'],
  },
  'poplin': {
    id: 'poplin',
    name: 'Poplin',
    desc: 'Tightly woven, crisp finish, lightweight. Classic dress-shirt fabric.',
    image: 'https://images.unsplash.com/photo-1603252109612-24fa03d145c8?q=80&w=400&auto=format&fit=crop',
    features: ['Lightweight', 'Crisp', 'Smooth'],
  },
  'chambray': {
    id: 'chambray',
    name: 'Chambray',
    desc: 'Denim-look with a softer, lighter feel. Versatile casual fabric.',
    image: 'https://images.unsplash.com/photo-1594996344680-c5afc60ccb4a?q=80&w=400&auto=format&fit=crop',
    features: ['Casual', 'Soft', 'Breathable'],
  },
  'cotton-blend': {
    id: 'cotton-blend',
    name: 'Cotton Blend',
    desc: 'Cotton mixed with synthetics for durability with natural comfort.',
    image: 'https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?q=80&w=400&auto=format&fit=crop',
    features: ['Comfortable', 'Durable', 'Easy Care'],
  },
  'cotton-twill': {
    id: 'cotton-twill',
    name: 'Cotton Twill',
    desc: 'Diagonal-rib weave, sturdy yet comfortable. Classic trouser fabric.',
    image: 'https://images.unsplash.com/photo-1558171814-53d7b3b4e4e6?q=80&w=400&auto=format&fit=crop',
    features: ['Sturdy', 'Comfortable', 'Formal'],
  },
  'cotton-spandex': {
    id: 'cotton-spandex',
    name: 'Cotton Spandex',
    desc: 'Stretch cotton with excellent shape retention. Great for fitted wear.',
    image: 'https://images.unsplash.com/photo-1614676471928-2ed0ad1061a4?q=80&w=400&auto=format&fit=crop',
    features: ['Stretchy', 'Fitted', 'Comfortable'],
  },

  // ── Linen ──
  'linen': {
    id: 'linen',
    name: 'Linen',
    desc: 'Cool and textured, perfect for warm weather and relaxed tailoring.',
    image: 'https://images.unsplash.com/photo-1549439602-43ebca2327af?q=80&w=400&auto=format&fit=crop',
    features: ['Cool', 'Natural', 'Textured'],
  },
  'linen-blend': {
    id: 'linen-blend',
    name: 'Linen Blend',
    desc: 'Linen-cotton mix — breathable with fewer wrinkles than pure linen.',
    image: 'https://images.unsplash.com/photo-1590075865003-e48b568a396a?q=80&w=400&auto=format&fit=crop',
    features: ['Breathable', 'Less Wrinkle', 'Summer'],
  },

  // ── Silk family ──
  'silk': {
    id: 'silk',
    name: 'Silk',
    desc: 'Luxurious sheen, ultra-smooth drape, premium occasion fabric.',
    image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=400&auto=format&fit=crop',
    features: ['Premium', 'Elegant', 'Lightweight'],
  },
  'silk-blend': {
    id: 'silk-blend',
    name: 'Silk Blend',
    desc: 'Silk mixed with polyester for durability while retaining a soft sheen.',
    image: 'https://images.unsplash.com/photo-1550639524-a6f58345a2ca?q=80&w=400&auto=format&fit=crop',
    features: ['Sheen', 'Durable', 'Formal'],
  },

  // ── Wool family ──
  'wool': {
    id: 'wool',
    name: 'Wool',
    desc: 'Warm, structured, naturally wrinkle-resistant. Ideal for formal suiting.',
    image: 'https://images.unsplash.com/photo-1616627547584-bf28cee262db?q=80&w=400&auto=format&fit=crop',
    features: ['Warm', 'Structured', 'Premium'],
  },
  'wool-blend': {
    id: 'wool-blend',
    name: 'Wool Blend',
    desc: 'Lighter than pure wool, retains structure. Year-round formal fabric.',
    image: 'https://images.unsplash.com/photo-1616627547584-bf28cee262db?q=80&w=400&auto=format&fit=crop',
    features: ['Structured', 'Formal', 'All Season'],
  },
  'tweed': {
    id: 'tweed',
    name: 'Tweed',
    desc: 'Textured wool blend with a heritage look. Great for structured outerwear.',
    image: 'https://images.unsplash.com/photo-1617952385804-7b326fa0e1c2?q=80&w=400&auto=format&fit=crop',
    features: ['Heritage', 'Textured', 'Warm'],
  },
  'cashmere-blend': {
    id: 'cashmere-blend',
    name: 'Cashmere Blend',
    desc: 'Ultra-soft cashmere wool mix. Luxurious warmth with everyday wearability.',
    image: 'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?q=80&w=400&auto=format&fit=crop',
    features: ['Luxurious', 'Soft', 'Premium'],
  },

  // ── Polyester / Blends ──
  'polyester': {
    id: 'polyester',
    name: 'Polyester',
    desc: 'Durable, wrinkle-resistant, budget-friendly. Easy machine wash.',
    image: 'https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?q=80&w=400&auto=format&fit=crop',
    features: ['Wrinkle-Free', 'Durable', 'Budget'],
  },
  'poly-blend': {
    id: 'poly-blend',
    name: 'Polyester Blend',
    desc: 'Best of both worlds — comfort of cotton with polyester durability.',
    image: 'https://images.unsplash.com/photo-1558171814-53d7b3b4e4e6?q=80&w=400&auto=format&fit=crop',
    features: ['Easy Care', 'Durable', 'Versatile'],
  },
  'poly-viscose': {
    id: 'poly-viscose',
    name: 'Polyester Viscose',
    desc: 'Smooth drape with a premium feel. Wrinkle-resistant suiting fabric.',
    image: 'https://images.unsplash.com/photo-1603252109612-24fa03d145c8?q=80&w=400&auto=format&fit=crop',
    features: ['Smooth', 'Drape', 'Formal'],
  },

  // ── Denim ──
  'denim': {
    id: 'denim',
    name: 'Denim',
    desc: 'Rugged indigo twill, ages beautifully with every wear.',
    image: 'https://images.unsplash.com/photo-1565084888279-aca5ecc8f8e5?q=80&w=400&auto=format&fit=crop',
    features: ['Rugged', 'Classic', 'Long-lasting'],
  },

  // ── Jersey / Knit ──
  'jersey-cotton': {
    id: 'jersey-cotton',
    name: 'Jersey Cotton',
    desc: 'Stretchy, comfortable knit. Ideal for t-shirts and casual tops.',
    image: 'https://images.unsplash.com/photo-1614676471928-2ed0ad1061a4?q=80&w=400&auto=format&fit=crop',
    features: ['Stretchy', 'Comfortable', 'Casual'],
  },
  'bamboo': {
    id: 'bamboo',
    name: 'Bamboo Fabric',
    desc: 'Eco-friendly, antibacterial, silky-smooth. Naturally hypoallergenic.',
    image: 'https://images.unsplash.com/photo-1530092376999-2431865aa8df?q=80&w=400&auto=format&fit=crop',
    features: ['Eco-friendly', 'Antibacterial', 'Soft'],
  },
  'modal': {
    id: 'modal',
    name: 'Modal Fabric',
    desc: 'Beech tree pulp fibre — incredibly soft, colour-fast, and breathable.',
    image: 'https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?q=80&w=400&auto=format&fit=crop',
    features: ['Ultra Soft', 'Colour-fast', 'Breathable'],
  },

  // ── Occasion / Special ──
  'velvet': {
    id: 'velvet',
    name: 'Velvet',
    desc: 'Rich, plush pile fabric with a soft sheen. Statement occasion wear.',
    image: 'https://images.unsplash.com/photo-1572727236225-8e5765023688?q=80&w=400&auto=format&fit=crop',
    features: ['Luxurious', 'Plush', 'Evening'],
  },
  'chiffon': {
    id: 'chiffon',
    name: 'Chiffon',
    desc: 'Sheer, flowing, elegant. Ideal for layered women\'s wear.',
    image: 'https://images.unsplash.com/photo-1553532434-5ab5b6b84993?q=80&w=400&auto=format&fit=crop',
    features: ['Sheer', 'Flowing', 'Elegant'],
  },
  'satin': {
    id: 'satin',
    name: 'Satin',
    desc: 'Glossy surface with a smooth, silky texture. Perfect for occasion wear.',
    image: 'https://images.unsplash.com/photo-1550639524-a6f58345a2ca?q=80&w=400&auto=format&fit=crop',
    features: ['Glossy', 'Smooth', 'Evening'],
  },
  'brocade': {
    id: 'brocade',
    name: 'Brocade',
    desc: 'Rich raised-pattern weave, traditional and ornate. Perfect for ethnic wear.',
    image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=400&auto=format&fit=crop',
    features: ['Ornate', 'Traditional', 'Rich'],
  },
  'net': {
    id: 'net',
    name: 'Net',
    desc: 'Open mesh fabric, perfect for layering and decorative overlays.',
    image: 'https://images.unsplash.com/photo-1558171814-53d7b3b4e4e6?q=80&w=400&auto=format&fit=crop',
    features: ['Layering', 'Decorative', 'Light'],
  },

  // ── Indian traditionals ──
  'rayon': {
    id: 'rayon',
    name: 'Rayon',
    desc: 'Semi-synthetic with a silk-like feel. Drapes beautifully, very breathable.',
    image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=400&auto=format&fit=crop',
    features: ['Silky', 'Breathable', 'Flowy'],
  },
  'khadi': {
    id: 'khadi',
    name: 'Khadi',
    desc: 'Hand-spun, hand-woven Indian heritage fabric. Eco-conscious and unique.',
    image: 'https://images.unsplash.com/photo-1549439602-43ebca2327af?q=80&w=400&auto=format&fit=crop',
    features: ['Handmade', 'Heritage', 'Eco-friendly'],
  },

  // ── Outerwear ──
  'leather': {
    id: 'leather',
    name: 'Leather',
    desc: 'Genuine treated hide — bold, protective, timeless outerwear material.',
    image: 'https://images.unsplash.com/photo-1611241443250-fcc16da15287?q=80&w=400&auto=format&fit=crop',
    features: ['Bold', 'Protective', 'Premium'],
  },
  'corduroy': {
    id: 'corduroy',
    name: 'Corduroy',
    desc: 'Ridged velvet-like pile fabric. Warm, retro, and rugged.',
    image: 'https://images.unsplash.com/photo-1617952385804-7b326fa0e1c2?q=80&w=400&auto=format&fit=crop',
    features: ['Retro', 'Warm', 'Textured'],
  },

  // ── Activewear / Kids ──
  'fleece': {
    id: 'fleece',
    name: 'Fleece',
    desc: 'Soft, warm, lightweight. Perfect for hoodies and winter layers.',
    image: 'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?q=80&w=400&auto=format&fit=crop',
    features: ['Warm', 'Soft', 'Lightweight'],
  },
  'organic-cotton': {
    id: 'organic-cotton',
    name: 'Organic Cotton',
    desc: 'Chemical-free, hypoallergenic, extra-soft. Safe for baby skin.',
    image: 'https://images.unsplash.com/photo-1530092376999-2431865aa8df?q=80&w=400&auto=format&fit=crop',
    features: ['Hypoallergenic', 'Soft', 'Safe'],
  },
}

/* ─── DRESS TYPE → FABRIC MAPPING ─────────────────────────────────────────── */

const DRESS_TYPE_FABRICS = {
  // ── User-specified 10 core types ──
  'Shirts':              ['cotton', 'linen', 'poplin', 'oxford-cotton', 'chambray', 'cotton-blend'],
  'T-shirts & Tops':     ['jersey-cotton', 'poly-blend', 'cotton-spandex', 'bamboo', 'modal'],
  'Blazer':              ['wool', 'tweed', 'cashmere-blend', 'poly-blend', 'linen-blend'],
  'Suit':                ['wool', 'wool-blend', 'poly-viscose', 'linen-blend', 'cotton-blend'],
  'Trousers':            ['cotton-twill', 'wool-blend', 'poly-blend', 'denim', 'linen'],
  'Skirts':              ['cotton', 'polyester', 'chiffon', 'satin', 'denim'],
  'Kurtis':              ['cotton', 'linen', 'silk', 'rayon', 'khadi'],
  'Saree Blouse':        ['silk', 'cotton', 'brocade', 'satin', 'velvet', 'net'],
  'Jacket':              ['denim', 'leather', 'wool', 'polyester', 'corduroy'],
  'Waistcoat':           ['wool', 'poly-blend', 'cotton-blend', 'silk-blend'],

  // ── Other men's types ──
  'Jeans':               ['denim', 'cotton-twill'],
  'Basics':              ['cotton', 'jersey-cotton', 'cotton-blend', 'bamboo'],
  'Hoodies & Sweatshirts': ['fleece', 'jersey-cotton', 'poly-blend', 'cotton-spandex'],

  // ── Women's types ──
  'Tops':                ['cotton', 'chiffon', 'silk', 'linen', 'rayon'],
  'T-shirts':            ['jersey-cotton', 'poly-blend', 'cotton-spandex', 'bamboo', 'modal'],
  'Jeans & Pants':       ['denim', 'cotton-twill', 'poly-blend', 'linen'],
  'Sportswear':          ['polyester', 'poly-blend', 'cotton-spandex', 'jersey-cotton'],

  // ── Girl ──
  'Dresses':             ['cotton', 'chiffon', 'silk', 'satin', 'rayon'],
  'Party Dresses':       ['silk', 'satin', 'velvet', 'chiffon', 'brocade'],

  // ── Boy ──
  'Shorts':              ['cotton-twill', 'denim', 'poly-blend', 'cotton'],
  'Hoodies':             ['fleece', 'jersey-cotton', 'poly-blend'],
  'School Uniforms':     ['cotton', 'poly-blend', 'cotton-twill', 'polyester'],

  // ── Baby ──
  'Rompers':             ['organic-cotton', 'jersey-cotton', 'cotton'],
  'Onesies':             ['organic-cotton', 'jersey-cotton', 'cotton', 'bamboo'],
  'Baby Dresses':        ['organic-cotton', 'cotton', 'jersey-cotton'],
  'Baby T-shirts':       ['organic-cotton', 'cotton', 'jersey-cotton', 'bamboo'],
  'Baby Pants':          ['organic-cotton', 'cotton', 'jersey-cotton'],
  'Baby Sleepwear':      ['organic-cotton', 'fleece', 'jersey-cotton', 'bamboo'],
}

/* ─────────────────────────── PUBLIC API ───────────────────────────────────── */

/**
 * Get fabrics suitable for a given cloth type name.
 * Returns all fabrics if no mapping exists for that type.
 */
export function getFabricsForClothType(clothTypeName) {
  const ids = DRESS_TYPE_FABRICS[clothTypeName]
  if (!ids) return Object.values(FABRICS)
  return ids.map(id => FABRICS[id]).filter(Boolean)
}

/** Get a single fabric by its id */
export function getFabricById(id) {
  return FABRICS[id] || null
}
