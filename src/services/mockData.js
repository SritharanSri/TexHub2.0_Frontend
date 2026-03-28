// ─── Users ────────────────────────────────────────────────────────────────────
export const currentUser = {
  id: 'USR-001',
  name: 'Sivakalaikshan',
  email: 'siva@texhub.com',
  role: 'tailor',
  phone: '+91 99887 76655',
  address: '12, Bharathi Nagar, Chennai - 600 001',
  rating: 4.9,
  totalWorks: 17,
  verificationStatus: 'approved',
  nicStatus: 'verified',
  specialization: 'Kurta & Traditional Wear',
  experience: '5 years',
  joinedDate: '2024-01-15',
}

export const adminUser = {
  id: 'ADMIN-001',
  name: 'Admin User',
  email: 'admin@texhub.com',
  role: 'admin',
}

// ─── Measurements ─────────────────────────────────────────────────────────────
export const sampleMeasurements = {
  orderId: 'ORD-001',
  customer: 'Rahul Sharma',
  item: 'Kurta',
  pocket: 'Yes',
  notes: 'Light stitching preferred',
  shoulder: 17, handLong: 24, straightLong: 42,
  neck: 15.5, chest: 38, armRound: 13, bodyRound: 34,
}

// ─── Categories ───────────────────────────────────────────────────────────────
export const clothingCategories = [
  { id: 'shirts',      label: 'Shirts',               emoji: '👔', gender: 'Men' },
  { id: 'kurta',       label: 'Kurta',                emoji: '🥻', gender: 'Men' },
  { id: 'suits',       label: 'Suits & Blazers',       emoji: '🤵', gender: 'Men' },
  { id: 'pants',       label: 'Pants & Trousers',      emoji: '👖', gender: 'Unisex' },
  { id: 'sherwani',    label: 'Sherwani',              emoji: '👑', gender: 'Men' },
  { id: 'salwar',      label: 'Salwar Kameez',         emoji: '👗', gender: 'Women' },
  { id: 'blouse',      label: 'Blouse & Saree Blouse', emoji: '✨', gender: 'Women' },
  { id: 'lehenga',     label: 'Lehenga',               emoji: '💃', gender: 'Women' },
  { id: 'bridal',      label: 'Bridal Wear',           emoji: '👰', gender: 'Women' },
  { id: 'tshirt',      label: 'T-Shirts',              emoji: '👕', gender: 'Unisex' },
  { id: 'jubba',       label: 'Jubba / Veshti',        emoji: '🌿', gender: 'Men' },
  { id: 'kids',        label: 'Kids Clothing',         emoji: '🧒', gender: 'Unisex' },
]

// AI design styles per category (mock)
export const aiDesignPresets = {
  kurta: [
    { id: 'k1', name: 'Classic White Kurta', tags: ['minimalist', 'formal'], color: '#F8FAFC' },
    { id: 'k2', name: 'Printed Cotton Kurta', tags: ['casual', 'summer'], color: '#DBEAFE' },
    { id: 'k3', name: 'Embroidered Festive', tags: ['festive', 'wedding'], color: '#FEF3C7' },
  ],
  shirts: [
    { id: 's1', name: 'Oxford Formal Shirt', tags: ['office', 'formal'], color: '#EFF6FF' },
    { id: 's2', name: 'Linen Casual Shirt', tags: ['casual', 'beach'], color: '#F0FDF4' },
    { id: 's3', name: 'Mandarin Collar Shirt', tags: ['smart-casual'], color: '#FAF5FF' },
  ],
  suits: [
    { id: 'su1', name: 'Classic Navy Suit', tags: ['formal', 'office'], color: '#1E3A5F' },
    { id: 'su2', name: 'Slim Fit Charcoal', tags: ['modern', 'sleek'], color: '#374151' },
  ],
  default: [
    { id: 'd1', name: 'Classic Design', tags: ['minimalist'], color: '#F3F4F6' },
    { id: 'd2', name: 'Modern Fit', tags: ['trendy'], color: '#EDE9FE' },
    { id: 'd3', name: 'Heritage Style', tags: ['traditional'], color: '#FEF9C3' },
  ],
}

// ─── Tailor Orders (incoming from customers) ──────────────────────────────────
export const incomingOrders = [
  {
    id: 'ORD-C01', customer: 'Rahul Sharma', customerPhone: '+91 98765 43210',
    category: 'kurta', item: 'Kurta', fabric: 'Cotton', color: 'White',
    status: 'pending_quotation', placedOn: '2026-03-13',
    deadline: '2026-03-25', budget: 1500,
    measurements: { shoulder: 17, chest: 38, neck: 15, handLong: 24, straightLong: 42, armRound: 13, bodyRound: 34 },
    designNote: 'Minimalist white kurta, no embroidery, 2 side pockets',
    selectedDesign: { name: 'Classic White Kurta', color: '#F8FAFC' },
  },
  {
    id: 'ORD-C02', customer: 'Priya Mehra', customerPhone: '+91 87654 32109',
    category: 'salwar', item: 'Salwar Kameez', fabric: 'Georgette', color: 'Peach',
    status: 'pending_quotation', placedOn: '2026-03-12',
    deadline: '2026-03-28', budget: 3000,
    measurements: { shoulder: 15, chest: 34, neck: 13.5, handLong: 22, straightLong: 40, armRound: 11, bodyRound: 30 },
    designNote: 'Festive look with light embroidery on neck',
    selectedDesign: { name: 'Embroidered Festive', color: '#FEF3C7' },
  },
  {
    id: 'ORD-C03', customer: 'Arjun Singh', customerPhone: '+91 76543 21098',
    category: 'suits', item: 'Blazer', fabric: 'Wool', color: 'Navy Blue',
    status: 'pending_quotation', placedOn: '2026-03-11',
    deadline: '2026-04-05', budget: 8000,
    measurements: { shoulder: 18, chest: 40, neck: 16, handLong: 25, straightLong: 30, armRound: 14, bodyRound: 36 },
    designNote: '2-button slim fit blazer, satin lapels',
    selectedDesign: { name: 'Classic Navy Suit', color: '#1E3A5F' },
  },
]

// ─── Quotations (tailor → customer) ──────────────────────────────────────────
export const quotations = [
  {
    id: 'QUO-001', orderId: 'ORD-C01', tailorId: 'USR-001', tailorName: 'Sivakalaikshan',
    tailorRating: 4.9, amount: 1200, deliveryDate: '2026-03-24',
    deliveryMethod: 'Home Delivery', message: 'Premium cotton, neat stitching guaranteed.',
    status: 'pending', // pending | accepted | rejected
  },
  {
    id: 'QUO-002', orderId: 'ORD-C01', tailorId: 'USR-002', tailorName: 'Ravi Tailor',
    tailorRating: 4.8, amount: 950, deliveryDate: '2026-03-23',
    deliveryMethod: 'Pickup', message: 'Best price, free alteration included.',
    status: 'pending',
  },
  {
    id: 'QUO-003', orderId: 'ORD-C01', tailorId: 'USR-003', tailorName: 'Suresh Kumar',
    tailorRating: 4.7, amount: 1400, deliveryDate: '2026-03-26',
    deliveryMethod: 'Courier', message: 'High-quality finish, premium cotton sourced.',
    status: 'pending',
  },
]

// ─── Payments ─────────────────────────────────────────────────────────────────
export const payments = [
  { id: 'PAY-001', orderId: 'ORD-C01', amount: 1200, method: 'UPI', status: 'confirmed', date: '2026-03-14' },
]

// ─── Customer orders (for MyOrders) ───────────────────────────────────────────
export const customerOrders = [
  {
    id: 'ORD-C01', item: 'Kurta', category: 'kurta', fabric: 'Cotton', color: 'White',
    status: 'quotation_received', placedOn: '2026-03-13', deadline: '2026-03-25',
    selectedTailor: null, amount: null, progress: 0, quotationCount: 3,
  },
  {
    id: 'ORD-C02', item: 'T-shirt', category: 'tshirt', fabric: 'Cotton', color: 'Sky Blue',
    status: 'in_work', placedOn: '2026-03-05', deadline: '2026-03-10',
    selectedTailor: 'Ravi Tailor', amount: 500, progress: 65, quotationCount: 2,
    serviceFee: 10, penaltyApplied: false // default fee percentage
  },
  {
    id: 'ORD-C03', item: 'Wedding Sherwani', category: 'sherwani', fabric: 'Raw Silk', color: 'Ivory',
    status: 'pending_quotation', placedOn: '2026-03-10', deadline: '2026-04-01',
    selectedTailor: null, amount: null, progress: 0, quotationCount: 0,
  },
  {
    id: 'ORD-C04', item: 'Salwar Kameez', category: 'salwar', fabric: 'Georgette', color: 'Peach',
    status: 'delivered', placedOn: '2026-01-15', deadline: '2026-01-25',
    selectedTailor: 'Suresh Kumar', amount: 1400, progress: 100, quotationCount: 3,
    serviceFee: 10, penaltyApplied: false
  },
  {
    id: 'ORD-C05', item: 'Blazer', category: 'suits', fabric: 'Wool', color: 'Charcoal',
    status: 'dispatched', placedOn: '2026-03-08', deadline: '2026-03-25',
    selectedTailor: 'Ravi Tailor', amount: 3200, progress: 90, quotationCount: 2,
  },
]

// Order lifecycle statuses
export const orderStatusFlow = [
  { key: 'pending_quotation',  label: 'Submitted',         desc: 'Waiting for tailor bids' },
  { key: 'quotation_received', label: 'Bids Received',     desc: 'Review and select a tailor' },
  { key: 'payment_pending',    label: 'Payment Pending',   desc: 'Confirm order with payment' },
  { key: 'confirmed',          label: 'Order Confirmed',   desc: 'Tailor has started work' },
  { key: 'in_work',            label: 'In Progress',       desc: 'Tailor is stitching' },
  { key: 'dispatched',         label: 'Dispatched',        desc: 'Order is on the way' },
  { key: 'delivered',          label: 'Delivered',         desc: 'Order delivered' },
]

// ─── Tailor Verification Queue (for admin) ────────────────────────────────────
export const pendingTailors = [
  {
    id: 'TAILOR-001', name: 'Muthu Rajan', email: 'muthu@tailor.com', phone: '+91 93456 78901',
    specialization: 'Traditional Wear', experience: '7 years', city: 'Madurai',
    nicNumber: 'TN12345678', appliedOn: '2026-03-12',
    status: 'pending', // pending | approved | rejected
    nicFront: null, nicBack: null,
  },
  {
    id: 'TAILOR-002', name: 'Lakshmi Devi', email: 'lakshmi@tailor.com', phone: '+91 87654 32109',
    specialization: 'Bridal & Women Wear', experience: '10 years', city: 'Coimbatore',
    nicNumber: 'TN98765432', appliedOn: '2026-03-11',
    status: 'pending',
    nicFront: null, nicBack: null,
  },
  {
    id: 'TAILOR-003', name: 'Selvam Kumar', email: 'selvam@tailor.com', phone: '+91 76543 21098',
    specialization: 'Formal Suits', experience: '4 years', city: 'Chennai',
    nicNumber: 'TN11223344', appliedOn: '2026-03-10',
    status: 'approved',
    nicFront: null, nicBack: null,
  },
]

// ─── Admin Users Table ────────────────────────────────────────────────────────
export const adminUsers = [
  { id: 'USR-001', name: 'Sivakalaikshan', email: 'siva@texhub.com', role: 'tailor', orders: 17, joined: '2024-01-15', status: 'active', nicFront: '/temp_docs/nic_front.png', nicBack: '/temp_docs/nic_back.png' },
  { id: 'USR-002', name: 'Ravi Tailor',    email: 'ravi@texhub.com',  role: 'tailor', orders: 24, joined: '2024-02-20', status: 'active', nicFront: '/temp_docs/nic_front.png', nicBack: '/temp_docs/nic_back.png' },
  { id: 'USR-003', name: 'Suresh Kumar',   email: 'suresh@texhub.com',role: 'tailor', orders: 31, joined: '2023-11-10', status: 'active', nicFront: '/temp_docs/nic_front.png', nicBack: '/temp_docs/nic_back.png' },
  { id: 'USR-004', name: 'Priya Customer', email: 'priya@texhub.com', role: 'customer', orders: 6,  joined: '2025-01-05', status: 'active' },
  { id: 'USR-005', name: 'Rahul Sharma',   email: 'rahul@texhub.com', role: 'customer', orders: 9,  joined: '2025-03-12', status: 'active' },
  { id: 'USR-006', name: 'Arjun Singh',    email: 'arjun@texhub.com', role: 'customer', orders: 2,  joined: '2026-02-01', status: 'suspended' },
]

// ─── Complaints ───────────────────────────────────────────────────────────────
export const complaints = [
  {
    id: 'CMP-001', type: 'complaint', from: 'Priya Customer', fromRole: 'customer',
    against: 'Ravi Tailor', subject: 'Delayed delivery',
    message: "Tailor promised delivery by 15th March but it's now 18th with no update.",
    orderId: 'ORD-C02', date: '2026-03-13', status: 'open', // open | resolved | escalated
  },
  {
    id: 'CMP-002', type: 'report', from: 'Rahul Sharma', fromRole: 'customer',
    against: 'System', subject: 'Wrong measurements taken',
    message: 'The measurement guide was confusing and my order has wrong dimensions.',
    orderId: 'ORD-C01', date: '2026-03-12', status: 'resolved',
  },
  {
    id: 'CMP-003', type: 'complaint', from: 'Sivakalaikshan', fromRole: 'tailor',
    against: 'Arjun Singh', subject: 'Payment not received after order completion',
    message: 'Customer received the order but payment is still pending.',
    orderId: 'ORD-C03', date: '2026-03-11', status: 'open',
  },
]

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export const dashboardStats = {
  totalWorks: 17, 
  revenue: 42800, 
  pendingAmount: 12500,
  rating: 4.9, 
  reviewRate: 98,
  completionRate: '94%',
  newOrders: 3,
  myOrders: 5
}

export const adminDashboardStats = {
  totalUsers: 156, totalTailors: 48, totalCustomers: 108,
  pendingApprovals: 2, totalOrders: 342, ordersToday: 14,
  revenue: 'Rs.8.4L', openComplaints: 3,
}

// ─── Legacy tailor order lists (kept for backward compat) ──────────────────
export const onProcessOrders = [
  { id: 'ORD-001', customer: 'Rahul Sharma', item: 'Kurta', fabric: 'Cotton', status: 'in_work', progress: 60, dueDate: '2026-03-17', amount: 1200 },
  { id: 'ORD-002', customer: 'Priya Mehra',  item: 'Salwar Kameez', fabric: 'Georgette', status: 'in_work', progress: 30, dueDate: '2026-03-20', amount: 2500 },
  { id: 'ORD-003', customer: 'Arjun Singh',  item: 'Blazer', fabric: 'Wool', status: 'in_work', progress: 85, dueDate: '2026-03-25', amount: 6500 },
]

export const completedOrders = [
  { id: 'ORD-010', customer: 'Meena Devi',   item: 'Lehenga',  fabric: 'Silk',   status: 'delivered', amount: 8000, rating: 5, completedDate: '2026-03-01' },
  { id: 'ORD-011', customer: 'Karthik P',    item: 'Suit',     fabric: 'Wool',   status: 'delivered', amount: 7000, rating: 4, completedDate: '2026-02-25' },
  { id: 'ORD-012', customer: 'Supriya R',    item: 'Saree Blouse', fabric: 'Cotton', status: 'delivered', amount: 900, rating: 5, completedDate: '2026-02-20' },
]

export const biddingOrders = [
  { id: 'BID-001', customer: 'Nisha V',      item: 'Anarkali Suit', fabric: 'Georgette', budget: 3500, deadline: '2026-04-01', status: 'open',   placedOn: '2026-03-10' },
  { id: 'BID-002', customer: 'Rajan K',      item: 'Kurta Set',    fabric: 'Linen',      budget: 2000, deadline: '2026-03-30', status: 'open',   placedOn: '2026-03-11' },
  { id: 'BID-003', customer: 'Deepa S',      item: 'Party Dress',  fabric: 'Chiffon',    budget: 4000, deadline: '2026-04-10', status: 'quoted', placedOn: '2026-03-08' },
]
