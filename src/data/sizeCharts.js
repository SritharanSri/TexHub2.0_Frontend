// ─── Size Charts for TexHub ──────────────────────────────────────────────────
// All measurements in inches. Structure: { category: { size: { field: value } } }

export const SIZE_LABELS = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export const SIZE_CHARTS = {
  man: {
    XS:  { chest: 34, waist: 28, shoulder: 16, sleeveLength: 23, shirtLength: 27, hip: 34, collar: 14, inseam: 28, outseam: 38, thigh: 20, neck: 14 },
    S:   { chest: 36, waist: 30, shoulder: 17, sleeveLength: 24, shirtLength: 27, hip: 36, collar: 14.5, inseam: 29, outseam: 39, thigh: 21, neck: 14.5 },
    M:   { chest: 40, waist: 34, shoulder: 18, sleeveLength: 25, shirtLength: 28, hip: 40, collar: 15.5, inseam: 30, outseam: 40, thigh: 23, neck: 15.5 },
    L:   { chest: 44, waist: 38, shoulder: 19, sleeveLength: 26, shirtLength: 29, hip: 44, collar: 16.5, inseam: 31, outseam: 41, thigh: 25, neck: 16.5 },
    XL:  { chest: 48, waist: 42, shoulder: 20, sleeveLength: 27, shirtLength: 30, hip: 48, collar: 17.5, inseam: 32, outseam: 42, thigh: 27, neck: 17.5 },
    XXL: { chest: 52, waist: 46, shoulder: 21, sleeveLength: 28, shirtLength: 31, hip: 52, collar: 18.5, inseam: 33, outseam: 43, thigh: 29, neck: 18.5 },
  },
  woman: {
    XS:  { bust: 32, waist: 24, shoulder: 14, sleeveLength: 21, topLength: 25, hip: 33, dressLength: 34, skirtLength: 22 },
    S:   { bust: 34, waist: 26, shoulder: 14.5, sleeveLength: 22, topLength: 26, hip: 35, dressLength: 35, skirtLength: 23 },
    M:   { bust: 38, waist: 30, shoulder: 15, sleeveLength: 23, topLength: 27, hip: 38, dressLength: 37, skirtLength: 25 },
    L:   { bust: 42, waist: 34, shoulder: 16, sleeveLength: 24, topLength: 28, hip: 43, dressLength: 39, skirtLength: 27 },
    XL:  { bust: 46, waist: 38, shoulder: 17, sleeveLength: 25, topLength: 29, hip: 47, dressLength: 41, skirtLength: 29 },
    XXL: { bust: 50, waist: 42, shoulder: 18, sleeveLength: 26, topLength: 30, hip: 51, dressLength: 43, skirtLength: 31 },
  },
  boy: {
    XS:  { chest: 22, waist: 20, shoulder: 10, sleeveLength: 14, shirtLength: 17, hip: 22, inseam: 16, outseam: 22 },
    S:   { chest: 24, waist: 22, shoulder: 11, sleeveLength: 15, shirtLength: 18, hip: 24, inseam: 18, outseam: 24 },
    M:   { chest: 26, waist: 23, shoulder: 12, sleeveLength: 16, shirtLength: 19, hip: 26, inseam: 20, outseam: 26 },
    L:   { chest: 28, waist: 24, shoulder: 13, sleeveLength: 17, shirtLength: 20, hip: 28, inseam: 22, outseam: 28 },
    XL:  { chest: 30, waist: 26, shoulder: 14, sleeveLength: 18, shirtLength: 21, hip: 30, inseam: 24, outseam: 30 },
    XXL: { chest: 32, waist: 28, shoulder: 15, sleeveLength: 19, shirtLength: 22, hip: 32, inseam: 26, outseam: 32 },
  },
  girl: {
    XS:  { chest: 21, waist: 20, shoulder: 10, sleeveLength: 13, topLength: 16, hip: 22, dressLength: 20, skirtLength: 14 },
    S:   { chest: 23, waist: 21, shoulder: 11, sleeveLength: 14, topLength: 17, hip: 24, dressLength: 22, skirtLength: 16 },
    M:   { chest: 25, waist: 22, shoulder: 12, sleeveLength: 15, topLength: 18, hip: 26, dressLength: 24, skirtLength: 18 },
    L:   { chest: 27, waist: 23, shoulder: 13, sleeveLength: 16, topLength: 19, hip: 28, dressLength: 26, skirtLength: 20 },
    XL:  { chest: 29, waist: 25, shoulder: 14, sleeveLength: 17, topLength: 20, hip: 30, dressLength: 28, skirtLength: 22 },
    XXL: { chest: 31, waist: 27, shoulder: 15, sleeveLength: 18, topLength: 21, hip: 32, dressLength: 30, skirtLength: 24 },
  },
  baby: {
    XS:  { chest: 16, waist: 15, shoulder: 7,  sleeveLength: 9,  bodyLength: 12, hip: 17 },
    S:   { chest: 17, waist: 16, shoulder: 7.5, sleeveLength: 9.5, bodyLength: 12.5, hip: 18 },
    M:   { chest: 18, waist: 17, shoulder: 8,  sleeveLength: 10, bodyLength: 13, hip: 19 },
    L:   { chest: 19, waist: 18, shoulder: 8.5, sleeveLength: 10.5, bodyLength: 13.5, hip: 20 },
    XL:  { chest: 20, waist: 19, shoulder: 9,  sleeveLength: 11, bodyLength: 14, hip: 21 },
    XXL: { chest: 21, waist: 20, shoulder: 9.5, sleeveLength: 11.5, bodyLength: 14.5, hip: 22 },
  },
}

// ─── Dynamic measurement fields per cloth type ──────────────────────────────
export const CLOTH_TYPE_MEASUREMENTS = {
  // Men
  'Shirts':                  ['chest', 'shoulder', 'sleeveLength', 'collar', 'shirtLength', 'neck'],
  'Jeans':                   ['waist', 'hip', 'thigh', 'inseam', 'outseam'],
  'Basics':                  ['chest', 'waist', 'shoulder', 'shirtLength'],
  'Hoodies & Sweatshirts':   ['chest', 'shoulder', 'sleeveLength', 'shirtLength', 'waist'],
  'T-shirt':                 ['chest', 'shoulder', 'sleeveLength', 'shirtLength'],
  'Trousers':                ['waist', 'hip', 'thigh', 'inseam', 'outseam'],
  'Blazer':                  ['chest', 'shoulder', 'sleeveLength', 'shirtLength', 'waist'],
  'Suit':                    ['chest', 'shoulder', 'sleeveLength', 'shirtLength', 'waist', 'hip', 'inseam', 'outseam'],
  'Jacket':                  ['chest', 'shoulder', 'sleeveLength', 'shirtLength', 'waist'],
  'Waistcoat':               ['chest', 'shoulder', 'waist', 'shirtLength'],
  // Women
  'Tops':                    ['bust', 'shoulder', 'sleeveLength', 'topLength', 'waist'],
  'T-shirts':                ['bust', 'shoulder', 'sleeveLength', 'topLength'],
  'Jeans & Pants':           ['waist', 'hip', 'thigh', 'inseam', 'outseam'],
  'Skirts':                  ['waist', 'hip', 'skirtLength'],
  'Saree Blouse':             ['bust', 'waist', 'shoulder', 'sleeveLength', 'topLength', 'neck'],
  'Kurtis':                  ['bust', 'waist', 'hip', 'shoulder', 'sleeveLength', 'dressLength'],
  'Sportswear':              ['chest', 'waist', 'hip', 'shoulder', 'sleeveLength'],
  // Girl
  'Frock':                   ['bust', 'waist', 'hip', 'dressLength', 'shoulder', 'sleeveLength'],
  'Party Dresses':           ['bust', 'waist', 'hip', 'dressLength', 'shoulder'],
  // Boy
  'Shorts':                  ['waist', 'hip', 'thigh', 'outseam'],
  'Hoodies':                 ['chest', 'shoulder', 'sleeveLength', 'shirtLength'],
  'School Uniforms':         ['chest', 'shoulder', 'sleeveLength', 'shirtLength', 'waist', 'inseam'],
  // Baby
  'Rompers':                 ['chest', 'waist', 'shoulder', 'bodyLength'],
  'Onesies':                 ['chest', 'waist', 'shoulder', 'bodyLength', 'sleeveLength'],
  'Baby T-shirts':           ['chest', 'shoulder', 'sleeveLength', 'bodyLength'],
  'Baby Pants':              ['waist', 'hip', 'bodyLength'],
  'Baby Sleepwear':          ['chest', 'waist', 'shoulder', 'bodyLength', 'sleeveLength'],
}

// ─── Field label & metadata ─────────────────────────────────────────────────
export const MEASUREMENT_FIELD_META = {
  chest:        { label: 'Chest',         unit: 'in', icon: '📏', hint: 'Measure around the fullest part of your chest' },
  bust:         { label: 'Bust',          unit: 'in', icon: '📏', hint: 'Measure around the fullest part of the bust' },
  waist:        { label: 'Waist',         unit: 'in', icon: '🔁', hint: 'Measure around your natural waistline' },
  hip:          { label: 'Hip',           unit: 'in', icon: '🔁', hint: 'Measure around the widest part of your hips' },
  shoulder:     { label: 'Shoulder',      unit: 'in', icon: '↔️',  hint: 'Measure from one shoulder point to the other' },
  sleeveLength: { label: 'Sleeve Length', unit: 'in', icon: '📐', hint: 'Measure from shoulder point to wrist' },
  shirtLength:  { label: 'Shirt Length',  unit: 'in', icon: '📏', hint: 'Measure from the highest shoulder point to desired length' },
  topLength:    { label: 'Top Length',    unit: 'in', icon: '📏', hint: 'Measure from shoulder to desired hemline' },
  collar:       { label: 'Collar',        unit: 'in', icon: '🔘', hint: 'Measure around the base of your neck' },
  neck:         { label: 'Neck',          unit: 'in', icon: '🔘', hint: 'Measure around the neck relaxed' },
  thigh:        { label: 'Thigh',         unit: 'in', icon: '🦵', hint: 'Measure around the fullest part of your thigh' },
  inseam:       { label: 'Inseam',        unit: 'in', icon: '📏', hint: 'Measure from crotch to ankle bone' },
  outseam:      { label: 'Outseam',       unit: 'in', icon: '📏', hint: 'Measure from waist to ankle along the outside' },
  dressLength:  { label: 'Dress Length',  unit: 'in', icon: '📏', hint: 'Measure from shoulder to desired dress hemline' },
  skirtLength:  { label: 'Skirt Length',  unit: 'in', icon: '📏', hint: 'Measure from waist to desired skirt hemline' },
  bodyLength:   { label: 'Body Length',   unit: 'in', icon: '📏', hint: 'Full body length of the garment' },
}

// Helper: get measurement fields for a specific cloth type
export function getMeasurementFields(clothType) {
  const keys = CLOTH_TYPE_MEASUREMENTS[clothType] || ['chest', 'waist', 'shoulder', 'sleeveLength', 'hip']
  return keys.map(key => ({ key, ...MEASUREMENT_FIELD_META[key] }))
}

// Helper: get empty measurements object
export function getEmptyMeasurements() {
  return Object.keys(MEASUREMENT_FIELD_META).reduce((acc, key) => {
    acc[key] = ''
    return acc
  }, {})
}

// Legacy compat
export const EMPTY_MEASUREMENTS = getEmptyMeasurements()

export const MEASUREMENT_FIELDS = Object.entries(MEASUREMENT_FIELD_META).map(([key, meta]) => ({
  key,
  ...meta,
}))

