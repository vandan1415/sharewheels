export interface LuxuryShowroomSpec {
  id: string;
  orderNumber: string;
  displayBrand: string;
  displayModel: string;
  tagline: string;
  imageUrl: string;
  fallbackCity: string;
  matchKeywords: string[];
  visualScale: number;
  floorOffsetPct: number;
}

export const LUXURY_GARAGE_BACKGROUND = '/images/luxury/garage-bg.webp';

// Canonical 6-vehicle showroom sequence (loops infinitely 01 -> 02 -> 03 -> 04 -> 05 -> 06 -> 01)
export const LUXURY_SHOWROOM_SEQUENCE: LuxuryShowroomSpec[] = [
  {
    id: 'range-rover-autobiography',
    orderNumber: '01',
    displayBrand: 'RANGE ROVER',
    displayModel: 'AUTOBIOGRAPHY',
    tagline: 'THE ART OF ARRIVING.',
    imageUrl: '/images/luxury/range-rover-autobiography.webp',
    fallbackCity: 'Delhi NCR',
    matchKeywords: ['range rover', 'autobiography'],
    visualScale: 1.0,
    floorOffsetPct: 10.5,
  },
  {
    id: 'mercedes-gls',
    orderNumber: '02',
    displayBrand: 'MERCEDES-BENZ',
    displayModel: 'GLS',
    tagline: 'ARCHITECTURAL SERENITY IN MOTION.',
    imageUrl: '/images/luxury/mercedes-gls.webp',
    fallbackCity: 'Delhi NCR',
    matchKeywords: ['mercedes', 'gls'],
    visualScale: 1.0,
    floorOffsetPct: 10.7,
  },
  {
    id: 'rolls-royce-ghost',
    orderNumber: '03',
    displayBrand: 'ROLLS-ROYCE',
    displayModel: 'GHOST',
    tagline: 'POST-OPULENT SILENCE.',
    imageUrl: '/images/luxury/rolls-royce-ghost.webp',
    fallbackCity: 'Chandigarh Tricity',
    matchKeywords: ['rolls-royce', 'rolls royce', 'ghost'],
    visualScale: 1.04,
    floorOffsetPct: 28.9,
  },
  {
    id: 'porsche-911',
    orderNumber: '04',
    displayBrand: 'PORSCHE',
    displayModel: '911 GT3 RS',
    tagline: 'SCULPTED VELOCITY.',
    imageUrl: '/images/luxury/porsche-911.webp',
    fallbackCity: 'Mumbai',
    matchKeywords: ['porsche', '911'],
    visualScale: 1.18,
    floorOffsetPct: 33.1,
  },
  {
    id: 'bmw-z4',
    orderNumber: '05',
    displayBrand: 'BMW',
    displayModel: 'Z4 M40i',
    tagline: 'UNFILTERED OPEN HORIZONS.',
    imageUrl: '/images/luxury/bmw-z4.webp',
    fallbackCity: 'Mumbai',
    matchKeywords: ['bmw z4', 'z4'],
    visualScale: 0.9,
    floorOffsetPct: 30.2,
  },
  {
    id: 'land-rover-defender',
    orderNumber: '06',
    displayBrand: 'LAND ROVER',
    displayModel: 'DEFENDER 110',
    tagline: 'COMPOSED BEYOND THE TARMAC.',
    imageUrl: '/images/luxury/land-rover-defender.webp',
    fallbackCity: 'Bengaluru',
    matchKeywords: ['defender', 'land rover defender'],
    visualScale: 0.98,
    floorOffsetPct: 9.8,
  },
];

export function matchShowroomSpecForVehicle(name: string, brand: string, model: string): LuxuryShowroomSpec | null {
  const hay = `${brand} ${model} ${name}`.toLowerCase();
  for (const spec of LUXURY_SHOWROOM_SEQUENCE) {
    if (spec.matchKeywords.some((kw) => hay.includes(kw))) {
      return spec;
    }
  }
  return null;
}
