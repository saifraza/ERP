import { Hono } from 'hono'

const divisions = new Hono()

// Get all divisions data
divisions.get('/', (c) => {
  return c.json({
    sugar: {
      id: 'sugar',
      name: 'Sugar Division',
      production: {
        today: 245,
        month: 2450,
        year: 28900,
        unit: 'MT',
      },
      efficiency: 92.5,
      status: 'operational',
    },
    power: {
      id: 'power',
      name: 'Power Division',
      generation: {
        current: 12.5,
        exported: 8.5,
        internal: 4.0,
        unit: 'MW',
      },
      efficiency: 88.3,
      status: 'operational',
    },
    ethanol: {
      id: 'ethanol',
      name: 'Ethanol Division',
      production: {
        today: 4500,
        month: 45000,
        year: 540000,
        unit: 'L',
      },
      efficiency: 95.2,
      status: 'operational',
    },
    feed: {
      id: 'feed',
      name: 'Animal Feed Division',
      production: {
        today: 89,
        month: 890,
        year: 10680,
        unit: 'MT',
      },
      efficiency: 91.7,
      status: 'operational',
    },
  })
})

// Get specific division data
divisions.get('/:division', (c) => {
  const division = c.req.param('division')
  
  // Mock data for each division
  const divisionData: any = {
    sugar: {
      id: 'sugar',
      name: 'Sugar Division',
      metrics: {
        production: { value: 2450, unit: 'MT', trend: 'up' },
        recovery: { value: 11.2, unit: '%', trend: 'stable' },
        quality: { value: 'A Grade', trend: 'stable' },
      },
      equipment: [
        { id: 'mill-1', name: 'Mill 1', status: 'running', efficiency: 94 },
        { id: 'mill-2', name: 'Mill 2', status: 'running', efficiency: 91 },
      ],
    },
    power: {
      id: 'power',
      name: 'Power Division',
      metrics: {
        generation: { value: 12.5, unit: 'MW', trend: 'up' },
        export: { value: 8.5, unit: 'MW', trend: 'stable' },
        steamPressure: { value: 87, unit: 'kg/cm²', trend: 'stable' },
      },
      equipment: [
        { id: 'boiler-1', name: 'Boiler 1', status: 'running', efficiency: 89 },
        { id: 'turbine-1', name: 'Turbine 1', status: 'running', efficiency: 92 },
      ],
    },
    ethanol: {
      id: 'ethanol',
      name: 'Ethanol Division',
      metrics: {
        production: { value: 45000, unit: 'L', trend: 'up' },
        fermentation: { value: 96.5, unit: '%', trend: 'stable' },
        purity: { value: 99.8, unit: '%', trend: 'stable' },
      },
      tanks: [
        { id: 'ferm-1', name: 'Fermentation Tank 1', status: 'active', level: 78 },
        { id: 'ferm-2', name: 'Fermentation Tank 2', status: 'active', level: 65 },
      ],
    },
    feed: {
      id: 'feed',
      name: 'Animal Feed Division',
      metrics: {
        production: { value: 890, unit: 'MT', trend: 'up' },
        moisture: { value: 12.5, unit: '%', trend: 'stable' },
        protein: { value: 18.2, unit: '%', trend: 'stable' },
      },
      lines: [
        { id: 'line-1', name: 'Production Line 1', status: 'running', output: 45 },
        { id: 'line-2', name: 'Production Line 2', status: 'maintenance', output: 0 },
      ],
    },
  }

  const data = divisionData[division]
  if (!data) {
    return c.json({ error: 'Division not found' }, 404)
  }

  return c.json(data)
})

export default divisions