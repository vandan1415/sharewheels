import type { RouteWaypoint } from '@/lib/googleMaps';

export interface CuratedJourney {
  id: string;
  title: string;
  subtitle: string;
  originCitySlug: string;
  origin: RouteWaypoint;
  destination: RouteWaypoint;
  suggestedStops: RouteWaypoint[];
  recommendedDays: number;
  recommendedCategory: string;
  terrainSummary: string;
  bestSeason: string;
  heroImage: string;
  placesToVisit: string[];
  routeNotes: string;
}

export const CURATED_JOURNEYS: readonly CuratedJourney[] = [
  {
    id: 'chandigarh-manali',
    title: 'Chandigarh → Manali',
    subtitle: 'Beas Valley & High-Altitude Himalayan Drive',
    originCitySlug: 'chandigarh-tricity',
    origin: { id: 'o-chd', label: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
    destination: { id: 'd-manali', label: 'Manali, Himachal Pradesh', lat: 32.2432, lng: 77.1892 },
    suggestedStops: [
      { id: 's-bilaspur', label: 'Bilaspur', lat: 31.3266, lng: 76.7623 },
      { id: 's-mandi', label: 'Mandi', lat: 31.7088, lng: 76.932 },
      { id: 's-kullu', label: 'Kullu', lat: 31.9579, lng: 77.1095 },
    ],
    recommendedDays: 4,
    recommendedCategory: 'Off-Road & Adventure',
    terrainSummary: '4-lane hill expressway & mountain hairpins',
    bestSeason: 'Mar–Jun & Sep–Dec',
    heroImage: '/images/vehicles/mahindra-thar-roxx-2025.jpg',
    placesToVisit: ['Pandoh Dam', 'Kasol Side Valley', 'Solang Valley', 'Atal Tunnel Approach'],
    routeNotes:
      'Highway NH-154 & NH-3 corridor through Kiratpur, Bilaspur, Sundernagar, Mandi, and Kullu along the Beas River.',
  },
  {
    id: 'delhi-jaipur',
    title: 'Delhi → Jaipur',
    subtitle: 'Royal Rajasthan Heritage Expressway',
    originCitySlug: 'delhi-ncr',
    origin: { id: 'o-del', label: 'New Delhi', lat: 28.6139, lng: 77.209 },
    destination: { id: 'd-jpr', label: 'Jaipur, Rajasthan', lat: 26.9124, lng: 75.7873 },
    suggestedStops: [
      { id: 's-gurugram', label: 'Gurugram', lat: 28.4595, lng: 77.0266 },
      { id: 's-neemrana', label: 'Neemrana Fort', lat: 27.9888, lng: 76.3883 },
      { id: 's-amer', label: 'Amer Fort', lat: 26.9855, lng: 75.8513 },
    ],
    recommendedDays: 3,
    recommendedCategory: 'Luxury Vehicles',
    terrainSummary: 'Multi-lane NH-48 / Delhi–Mumbai Expressway spur',
    bestSeason: 'Oct–Mar',
    heroImage: '/images/vehicles/bmw-330li-m-sport-2024.jpg',
    placesToVisit: ['Neemrana Stepwell', 'Amer Fort', 'Hawa Mahal', 'Nahargarh Sunset Point'],
    routeNotes:
      'Smooth expressway cruising suited to executive sedans, EVs with DC fast charging along NH-48, and family SUVs.',
  },
  {
    id: 'mumbai-goa',
    title: 'Mumbai → Goa',
    subtitle: 'Konkan Coast & Western Ghats Grand Tour',
    originCitySlug: 'mumbai',
    origin: { id: 'o-bom', label: 'Mumbai, Maharashtra', lat: 19.076, lng: 72.8777 },
    destination: { id: 'd-goa', label: 'Panaji, Goa', lat: 15.4909, lng: 73.8278 },
    suggestedStops: [
      { id: 's-pune-exp', label: 'Lonavala', lat: 18.7557, lng: 73.4091 },
      { id: 's-kolhapur', label: 'Kolhapur', lat: 16.705, lng: 74.2433 },
      { id: 's-amboli', label: 'Amboli Ghat', lat: 15.9647, lng: 74.0036 },
    ],
    recommendedDays: 5,
    recommendedCategory: 'Compact SUVs',
    terrainSummary: 'Expressway + Sahyadri ghat climbs & coastal highways',
    bestSeason: 'Oct–Feb',
    heroImage: '/images/vehicles/hyundai-creta-2024.jpg',
    placesToVisit: ['Lonavala Bhushi Dam Ridge', 'Kolhapur Heritage Precinct', 'Amboli Waterfalls', 'Fontainhas Panaji'],
    routeNotes:
      'Popular Mumbai–Pune Expressway to Kolhapur and down Amboli Ghat into North Goa.',
  },
  {
    id: 'bengaluru-coorg',
    title: 'Bengaluru → Coorg',
    subtitle: 'Coffee Estates & Mist-Covered Kodagu Hills',
    originCitySlug: 'bengaluru',
    origin: { id: 'o-blr', label: 'Bengaluru, Karnataka', lat: 12.9716, lng: 77.5946 },
    destination: { id: 'd-coorg', label: 'Madikeri, Coorg', lat: 12.4244, lng: 75.7382 },
    suggestedStops: [
      { id: 's-mysuru', label: 'Mysuru', lat: 12.2958, lng: 76.6394 },
      { id: 's-kushalnagar', label: 'Kushalnagar', lat: 12.4602, lng: 75.9597 },
    ],
    recommendedDays: 3,
    recommendedCategory: 'Full-Size SUVs',
    terrainSummary: 'Mysuru Expressway followed by winding Kodagu plantation roads',
    bestSeason: 'Sep–May',
    heroImage: '/images/vehicles/toyota-fortuner-legender-2024.jpg',
    placesToVisit: ['Mysore Palace Bypass', 'Namdroling Monastery', 'Abbey Falls', 'Raja’s Seat'],
    routeNotes:
      'High-speed Bengaluru–Mysuru Access-Controlled Highway before ascending shaded estate roads into Madikeri.',
  },
  {
    id: 'pune-mahabaleshwar',
    title: 'Pune → Mahabaleshwar',
    subtitle: 'Sahyadri Plateau & Strawberry Ridge Run',
    originCitySlug: 'pune',
    origin: { id: 'o-pnq', label: 'Pune, Maharashtra', lat: 18.5204, lng: 73.8567 },
    destination: { id: 'd-mahab', label: 'Mahabaleshwar, Maharashtra', lat: 17.9307, lng: 73.6477 },
    suggestedStops: [
      { id: 's-wai', label: 'Wai', lat: 17.9532, lng: 73.8919 },
      { id: 's-panchgani', label: 'Panchgani', lat: 17.924, lng: 73.7987 },
    ],
    recommendedDays: 2,
    recommendedCategory: 'Electric Vehicles',
    terrainSummary: 'NH-48 expressway + Pasarni Ghat plateau ascent',
    bestSeason: 'All Year',
    heroImage: '/images/vehicles/tata-nexon-ev-2024.jpg',
    placesToVisit: ['Panchgani Table Land', 'Arthur’s Seat', 'Mapro Garden', 'Venna Lake'],
    routeNotes:
      'Ideal weekend getaway reachable comfortably on a single EV charge with fast chargers available along NH-48.',
  },
  {
    id: 'hyderabad-hampi',
    title: 'Hyderabad → Hampi',
    subtitle: 'Deccan Plateau & UNESCO Vijayanagara Heritage Trail',
    originCitySlug: 'hyderabad',
    origin: { id: 'o-hyd', label: 'Hyderabad, Telangana', lat: 17.385, lng: 78.4867 },
    destination: { id: 'd-hampi', label: 'Hampi, Karnataka', lat: 15.335, lng: 76.46 },
    suggestedStops: [
      { id: 's-raichur', label: 'Raichur', lat: 16.2076, lng: 77.3463 },
      { id: 's-hospet', label: 'Hosapete', lat: 15.2689, lng: 76.3909 },
    ],
    recommendedDays: 3,
    recommendedCategory: 'Family MPVs',
    terrainSummary: 'Open Deccan rural highways and boulder-strewn temple valleys',
    bestSeason: 'Oct–Feb',
    heroImage: '/images/vehicles/toyota-innova-hycross-2024.jpg',
    placesToVisit: ['Virupaksha Temple', 'Vittala Stone Chariot', 'Tungabhadra Dam', 'Matanga Hill'],
    routeNotes:
      'Spacious highway cruiser route across Telangana into North Karnataka heritage sites.',
  },
  {
    id: 'delhi-rishikesh',
    title: 'Delhi → Rishikesh',
    subtitle: 'Upper Ganga Foothills Weekend Escape',
    originCitySlug: 'delhi-ncr',
    origin: { id: 'o-del2', label: 'New Delhi', lat: 28.6139, lng: 77.209 },
    destination: { id: 'd-rishi', label: 'Rishikesh, Uttarakhand', lat: 30.0869, lng: 78.2676 },
    suggestedStops: [
      { id: 's-meerut', label: 'Meerut Bypass', lat: 28.9845, lng: 77.7064 },
      { id: 's-haridwar', label: 'Haridwar', lat: 29.9457, lng: 78.1642 },
    ],
    recommendedDays: 3,
    recommendedCategory: 'Sedans',
    terrainSummary: 'Delhi–Meerut Expressway & Shivalik foothills',
    bestSeason: 'Sep–May',
    heroImage: '/images/vehicles/volkswagen-virtus-2024.jpg',
    placesToVisit: ['Har Ki Pauri', 'Lakshman Jhula Precinct', 'Triveni Ghat', 'Neelkanth Ridge'],
    routeNotes:
      'Direct NH-334 highway via Roorkee and Haridwar right up to the Ganga foothills.',
  },
  {
    id: 'chandigarh-amritsar',
    title: 'Chandigarh → Amritsar',
    subtitle: 'Grand Trunk Heritage & Golden Temple Corridor',
    originCitySlug: 'chandigarh-tricity',
    origin: { id: 'o-chd2', label: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
    destination: { id: 'd-asr', label: 'Amritsar, Punjab', lat: 31.634, lng: 74.8723 },
    suggestedStops: [
      { id: 's-ludhiana', label: 'Ludhiana', lat: 30.901, lng: 75.8573 },
      { id: 's-jalandhar', label: 'Jalandhar', lat: 31.326, lng: 75.5762 },
    ],
    recommendedDays: 2,
    recommendedCategory: 'Hatchbacks',
    terrainSummary: 'Flat multi-lane Punjab plains highway',
    bestSeason: 'All Year',
    heroImage: '/images/vehicles/maruti-swift-2024.jpg',
    placesToVisit: ['Sri Harmandir Sahib', 'Jallianwala Bagh', 'Partition Museum', 'Attari–Wagah Border'],
    routeNotes:
      'Smooth 4-lane highway drive via Kharar, Phagwara, and Jalandhar with plentiful dhabas and fuel stations.',
  },
];

export function findCuratedJourney(id: string | undefined): CuratedJourney | undefined {
  if (!id) return undefined;
  return CURATED_JOURNEYS.find((j) => j.id === id);
}
