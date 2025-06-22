// Animal Feed division exports
export * from './production'
export * from './types'

// Mock feed data
export const mockFeedData = {
  production: {
    today: 89, // MT
    month: 890, // MT
    year: 10680, // MT
  },
  formulation: {
    proteinContent: 18.2, // %
    moistureContent: 12.5, // %
    fiberContent: 25.8, // %
  },
  packaging: {
    bags50kg: 1200,
    bags25kg: 800,
    bulk: 150, // MT
  },
  quality: {
    passRate: 98.5, // %
    averageProtein: 18.2, // %
  },
}