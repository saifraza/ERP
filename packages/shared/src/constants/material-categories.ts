// Industry-specific material category mappings

export const MATERIAL_CATEGORIES = {
  // Main categories
  raw_material: 'Raw Material',
  consumable: 'Consumable',
  spare_part: 'Spare Part',
  chemical: 'Chemical',
  packing: 'Packing Material',
  other: 'Other'
} as const

export const DIVISIONS = {
  sugar: 'Sugar',
  ethanol: 'Ethanol',
  power: 'Power',
  feed: 'Animal Feed',
  common: 'Common'
} as const

export const TECHNICAL_GRADES = [
  'AR (Analytical Reagent)',
  'LR (Laboratory Reagent)',
  'Commercial Grade',
  'Food Grade',
  'Pharmaceutical Grade',
  'Technical Grade',
  'Industrial Grade'
] as const

export const COMPLIANCE_STANDARDS = [
  'IS (Indian Standard)',
  'BIS (Bureau of Indian Standards)',
  'FSSAI (Food Safety)',
  'ISO 9001',
  'ISO 14001',
  'ISO 22000',
  'HACCP',
  'GMP',
  'REACH',
  'OHSAS'
] as const

export const HAZARD_CATEGORIES = [
  'Non-Hazardous',
  'Flammable',
  'Corrosive',
  'Toxic',
  'Oxidizing',
  'Explosive',
  'Environmentally Hazardous'
] as const

// Industry-specific subcategories by division and category
export const INDUSTRY_SUBCATEGORIES = {
  sugar: {
    chemical: [
      { value: 'juice_clarification', label: 'Juice Clarification Chemicals' },
      { value: 'color_precipitant', label: 'Color Precipitants' },
      { value: 'flocculant', label: 'Flocculants' },
      { value: 'viscosity_reducer', label: 'Viscosity Reducers' },
      { value: 'biocide', label: 'Biocides & Mill Sanitizers' },
      { value: 'enzyme', label: 'Enzymes (Dextranase, Amylase)' },
      { value: 'antiscalant', label: 'Antiscalants' },
      { value: 'ph_modifier', label: 'pH Modifiers (Lime, Sulphur)' }
    ],
    consumable: [
      { value: 'filter_aid', label: 'Filter Aids' },
      { value: 'filter_cloth', label: 'Filter Cloths' },
      { value: 'lab_reagent', label: 'Lab Reagents' },
      { value: 'testing_kit', label: 'Testing Kits' }
    ],
    spare_part: [
      { value: 'mill_roller', label: 'Mill Rollers & Bearings' },
      { value: 'crystallizer_part', label: 'Crystallizer Parts' },
      { value: 'centrifuge_basket', label: 'Centrifuge Baskets' },
      { value: 'pump_part', label: 'Pump Parts' },
      { value: 'evaporator_tube', label: 'Evaporator Tubes' }
    ],
    raw_material: [
      { value: 'sugarcane', label: 'Sugarcane' },
      { value: 'sulfur', label: 'Sulfur' },
      { value: 'limestone', label: 'Limestone' },
      { value: 'phosphoric_acid', label: 'Phosphoric Acid' }
    ]
  },
  
  ethanol: {
    chemical: [
      { value: 'yeast', label: 'Yeast Strains' },
      { value: 'nutrient', label: 'Fermentation Nutrients' },
      { value: 'antifoam', label: 'Antifoam Agents' },
      { value: 'denaturant', label: 'Denaturants' },
      { value: 'molecular_sieve', label: 'Molecular Sieves' },
      { value: 'cleaning_cip', label: 'CIP Cleaning Chemicals' },
      { value: 'ph_control', label: 'pH Control Chemicals' }
    ],
    consumable: [
      { value: 'lab_chemical', label: 'Lab Analysis Chemicals' },
      { value: 'sampling_bottle', label: 'Sampling Bottles' },
      { value: 'filter_membrane', label: 'Filter Membranes' }
    ],
    spare_part: [
      { value: 'column_internal', label: 'Distillation Column Internals' },
      { value: 'heat_exchanger', label: 'Heat Exchanger Parts' },
      { value: 'pump_seal', label: 'Pump Seals' },
      { value: 'valve_part', label: 'Valve Parts' },
      { value: 'fermenter_part', label: 'Fermenter Parts' }
    ],
    raw_material: [
      { value: 'molasses', label: 'Molasses (B-Heavy, C-Heavy)' },
      { value: 'grain', label: 'Grains (Rice, Maize, Damaged)' },
      { value: 'enzymatic_prep', label: 'Enzymatic Preparations' }
    ]
  },
  
  power: {
    chemical: [
      { value: 'water_treatment', label: 'Boiler Water Treatment Chemicals' },
      { value: 'dm_resin', label: 'DM Plant Resins' },
      { value: 'cooling_chemical', label: 'Cooling Tower Chemicals' },
      { value: 'descalant', label: 'Descaling Chemicals' },
      { value: 'corrosion_inhibitor', label: 'Corrosion Inhibitors' }
    ],
    consumable: [
      { value: 'refractory', label: 'Refractory Materials' },
      { value: 'insulation', label: 'Insulation Materials' },
      { value: 'gasket', label: 'Gaskets & Seals' },
      { value: 'lubricant', label: 'Lubricants & Oils' }
    ],
    spare_part: [
      { value: 'turbine_bearing', label: 'Turbine Bearings' },
      { value: 'boiler_tube', label: 'Boiler Tubes' },
      { value: 'esp_electrode', label: 'ESP Electrodes' },
      { value: 'bag_filter', label: 'Bag Filters' },
      { value: 'control_card', label: 'Control Cards & Electronics' },
      { value: 'valve_actuator', label: 'Valve Actuators' }
    ],
    raw_material: [
      { value: 'bagasse', label: 'Bagasse' },
      { value: 'coal', label: 'Coal (Backup Fuel)' },
      { value: 'biomass', label: 'Alternative Biomass' }
    ]
  },
  
  feed: {
    chemical: [
      { value: 'vitamin_premix', label: 'Vitamin Premixes' },
      { value: 'mineral_premix', label: 'Mineral Premixes' },
      { value: 'probiotic', label: 'Probiotics' },
      { value: 'preservative', label: 'Feed Preservatives' },
      { value: 'mycotoxin_binder', label: 'Mycotoxin Binders' },
      { value: 'acidifier', label: 'Feed Acidifiers' }
    ],
    consumable: [
      { value: 'binding_agent', label: 'Binding Agents (Bentonite)' },
      { value: 'feed_bag', label: 'Feed Packaging Bags' },
      { value: 'label', label: 'Product Labels' },
      { value: 'thread', label: 'Stitching Thread' }
    ],
    spare_part: [
      { value: 'pellet_die', label: 'Pellet Dies' },
      { value: 'hammer_mill_screen', label: 'Hammer Mill Screens' },
      { value: 'mixer_paddle', label: 'Mixer Paddles' },
      { value: 'conveyor_belt', label: 'Conveyor Belts' },
      { value: 'bucket_elevator', label: 'Bucket Elevator Parts' }
    ],
    raw_material: [
      { value: 'molasses_feed', label: 'Feed Grade Molasses' },
      { value: 'bagasse_processed', label: 'Processed Bagasse' },
      { value: 'protein_meal', label: 'Protein Meals (Soya, DDGS)' },
      { value: 'cereal_bran', label: 'Cereal Brans' }
    ]
  },
  
  common: {
    chemical: [
      { value: 'lab_general', label: 'General Lab Chemicals' },
      { value: 'cleaning_general', label: 'General Cleaning Chemicals' },
      { value: 'paint_coating', label: 'Paints & Coatings' },
      { value: 'adhesive', label: 'Adhesives & Sealants' }
    ],
    consumable: [
      { value: 'ppe', label: 'Personal Protective Equipment' },
      { value: 'stationery', label: 'Office Stationery' },
      { value: 'it_consumable', label: 'IT Consumables' },
      { value: 'electrical', label: 'Electrical Items' },
      { value: 'plumbing', label: 'Plumbing Materials' }
    ],
    spare_part: [
      { value: 'motor', label: 'Electric Motors' },
      { value: 'bearing_general', label: 'General Bearings' },
      { value: 'v_belt', label: 'V-Belts & Chains' },
      { value: 'tool', label: 'Tools & Equipment' },
      { value: 'instrument', label: 'Instruments & Gauges' }
    ],
    packing: [
      { value: 'sugar_bag', label: 'Sugar Bags (25kg, 50kg)' },
      { value: 'jumbo_bag', label: 'Jumbo Bags' },
      { value: 'drum', label: 'Drums & Containers' },
      { value: 'pallet', label: 'Pallets' }
    ]
  }
}

// Helper function to get subcategories
export function getSubcategories(division: string, category: string) {
  const divisionCategories = INDUSTRY_SUBCATEGORIES[division as keyof typeof INDUSTRY_SUBCATEGORIES]
  if (!divisionCategories) return []
  
  return divisionCategories[category as keyof typeof divisionCategories] || []
}

// Storage condition presets
export const STORAGE_CONDITIONS = {
  'room_temp': 'Store at room temperature (15-30°C)',
  'cool_dry': 'Store in cool, dry place (<25°C, <60% RH)',
  'refrigerated': 'Store refrigerated (2-8°C)',
  'frozen': 'Store frozen (-20°C)',
  'controlled': 'Store under controlled conditions',
  'flammable_cabinet': 'Store in flammable storage cabinet',
  'acid_cabinet': 'Store in acid storage cabinet',
  'outdoor_covered': 'Can be stored outdoor under cover'
}

// Quality parameter templates by material type
export const QUALITY_TEMPLATES = {
  'chemical': {
    purity: { min: 0, max: 100, unit: '%' },
    moisture: { max: 1, unit: '%' },
    ph: { min: 0, max: 14 },
    density: { unit: 'g/ml' }
  },
  'sugar_juice_chemical': {
    active_content: { min: 0, max: 100, unit: '%' },
    color: { type: 'visual' },
    solubility: { type: 'complete/partial' },
    dosage: { unit: 'ppm' }
  },
  'spare_part': {
    dimension_tolerance: { unit: 'mm' },
    material_grade: { type: 'text' },
    hardness: { unit: 'HRC' },
    surface_finish: { unit: 'Ra' }
  },
  'feed_ingredient': {
    protein: { min: 0, unit: '%' },
    moisture: { max: 12, unit: '%' },
    fiber: { max: 0, unit: '%' },
    ash: { max: 0, unit: '%' }
  }
}