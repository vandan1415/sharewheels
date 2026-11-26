export type VehicleCategory =
  | 'Hatchbacks'
  | 'Sedans'
  | 'SUVs'
  | 'Luxury Cars'
  | 'Electric Vehicles'
  | 'Scooters'
  | 'Motorcycles'
  | 'Off-Road & Adventure Vehicles';

export type OffRoadSubCategory =
  | '4x4 SUVs'
  | '4WD Adventure Vehicles'
  | 'Off-Road Jeeps'
  | 'Adventure SUVs'
  | 'Pickup Trucks'
  | 'Adventure Motorcycles'
  | 'Touring Motorcycles';

export type TerrainType =
  | 'Highway'
  | 'Gravel'
  | 'Dirt Roads'
  | 'Rocky Terrain'
  | 'Sand'
  | 'Mud'
  | 'Snow';

export type RecordSourceLabel =
  | 'Owner Submitted'
  | 'Document Reviewed'
  | 'Independently Verified'
  | 'Platform Recorded';

export interface PassportEvent {
  id: string;
  date: string;
  title: string;
  summary: string;
  sourceLabel: RecordSourceLabel;
}

export interface OffRoadSpecs {
  subCategory: OffRoadSubCategory;
  drivetrain: '2WD' | 'AWD' | '4WD' | '4x4';
  groundClearanceMm: number;
  approachAngleDeg?: number;
  departureAngleDeg?: number;
  tyreType: string;
  terrains: { terrain: TerrainType; sourceLabel: RecordSourceLabel }[];
  modifications: string[];
  recoveryEquipment: string[];
  restrictions: string[];
  permittedRoutes: string;
}

export interface DemoVehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  category: VehicleCategory;
  location: string;
  pricePerDay: number;
  securityDeposit: number;
  transmission: 'Automatic' | 'Manual' | 'Single-Speed';
  fuelType: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
  seats: number;
  rating: number;
  tripsCount: number;
  available: boolean;
  verificationStatus: 'Document Reviewed' | 'Owner Submitted' | 'Independently Verified';
  ownerName: string;
  ownerSince: string;
  image: string;
  gallery: string[];
  highlights: string[];
  rules: string[];
  offRoadSpecs?: OffRoadSpecs;
  passportEvents: PassportEvent[];
  isDemo: true;
}

export const VEHICLE_CATEGORIES: {
  name: VehicleCategory;
  subtitle: string;
  countLabel: string;
}[] = [
  { name: 'Hatchbacks', subtitle: 'Agile urban daily drives', countLabel: 'City Commute' },
  { name: 'Sedans', subtitle: 'Executive highway comfort', countLabel: 'Intercity' },
  { name: 'SUVs', subtitle: 'Family 5 & 7-seater utility', countLabel: 'Tricity & Hills' },
  { name: 'Luxury Cars', subtitle: 'Chauffeur-grade & executive fleet', countLabel: 'Flagship' },
  { name: 'Electric Vehicles', subtitle: 'Zero-tailpipe city & highway EVs', countLabel: 'EV Fleet' },
  { name: 'Scooters', subtitle: 'Quick campus & sector hops', countLabel: 'Two-Wheeler' },
  { name: 'Motorcycles', subtitle: 'Roadsters & highway cruisers', countLabel: 'Two-Wheeler' },
  { name: 'Off-Road & Adventure Vehicles', subtitle: '4x4s, Jeeps, Pickups & ADV Bikes', countLabel: 'Expedition' },
];

export const TERRAIN_CATEGORIES: TerrainType[] = [
  'Highway',
  'Gravel',
  'Dirt Roads',
  'Rocky Terrain',
  'Sand',
  'Mud',
  'Snow',
];

export const DEMO_VEHICLES: DemoVehicle[] = [
  {
    id: 'bmw-530i-m-sport',
    name: 'BMW 530i M Sport',
    brand: 'BMW',
    model: '5 Series',
    year: 2023,
    category: 'Luxury Cars',
    location: 'Sector 17, Chandigarh',
    pricePerDay: 9500,
    securityDeposit: 25000,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    seats: 5,
    rating: 4.9,
    tripsCount: 18,
    available: true,
    verificationStatus: 'Document Reviewed',
    ownerName: 'Vikramaditya S. (Demo Owner)',
    ownerSince: '2025',
    image:
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?auto=format&fit=crop&w=1200&q=80',
    ],
    highlights: ['2.0L TwinPower Turbo', 'Harman Kardon Audio', 'Adaptive Suspension'],
    rules: ['Highway & paved roads only', 'Minimum driver age 25 with valid DL', 'No smoking inside cabin'],
    passportEvents: [
      {
        id: 'p1',
        date: 'Oct 2026',
        title: 'Scheduled 20,000 km Service Logged',
        summary: 'Brake fluid, synthetic oil & diagnostics logged by owner.',
        sourceLabel: 'Owner Submitted',
      },
      {
        id: 'p2',
        date: 'Sep 2026',
        title: 'RC, Comprehensive Insurance & PUC Checked',
        summary: 'Registration and policy validity cross-checked for prototype record.',
        sourceLabel: 'Document Reviewed',
      },
      {
        id: 'p3',
        date: 'Aug 2026',
        title: 'Zero-Claim Return Inspection #18',
        summary: '360-degree pickup/return check completed without new marks.',
        sourceLabel: 'Platform Recorded',
      },
    ],
    isDemo: true,
  },
  {
    id: 'mahindra-thar-4x4',
    name: 'Mahindra Thar LX 4x4 Hard Top',
    brand: 'Mahindra',
    model: 'Thar LX 4x4',
    year: 2024,
    category: 'Off-Road & Adventure Vehicles',
    location: 'Sector 8, Panchkula',
    pricePerDay: 4500,
    securityDeposit: 15000,
    transmission: 'Automatic',
    fuelType: 'Diesel',
    seats: 4,
    rating: 4.8,
    tripsCount: 24,
    available: true,
    verificationStatus: 'Independently Verified',
    ownerName: 'Harpreet G. (Demo Owner)',
    ownerSince: '2025',
    image:
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80',
    ],
    highlights: ['Low-Range 4x4 Transfer Case', 'Mechanical Locking Differential', 'All-Terrain Tyres'],
    rules: ['Explicit owner approval required for high-altitude trails', 'River crossings strictly prohibited', 'Standard rental insurance does not auto-cover extreme off-roading'],
    offRoadSpecs: {
      subCategory: 'Off-Road Jeeps',
      drivetrain: '4x4',
      groundClearanceMm: 226,
      approachAngleDeg: 41.2,
      departureAngleDeg: 36,
      tyreType: 'BFGoodrich All-Terrain T/A KO2 (255/65 R18)',
      terrains: [
        { terrain: 'Highway', sourceLabel: 'Platform Recorded' },
        { terrain: 'Gravel', sourceLabel: 'Owner Submitted' },
        { terrain: 'Dirt Roads', sourceLabel: 'Owner Submitted' },
        { terrain: 'Rocky Terrain', sourceLabel: 'Document Reviewed' },
        { terrain: 'Mud', sourceLabel: 'Owner Submitted' },
        { terrain: 'Snow', sourceLabel: 'Owner Submitted' },
      ],
      modifications: ['Underbody aluminium skid plate', 'Front steel recovery hooks'],
      recoveryEquipment: ['8-ton kinetic tow strap', 'Portable 12V dual-cylinder compressor', 'Folding shovel'],
      restrictions: ['No deep water fording above 500 mm', 'Snow chains required beyond Narkanda/Atal Tunnel in winter'],
      permittedRoutes: 'Shimla, Kinnaur, Spiti Highway & approved Himachal gravel trails',
    },
    passportEvents: [
      {
        id: 't1',
        date: 'Nov 2026',
        title: '4x4 Transfer Case & Differential Inspection',
        summary: '4L/4H engagement and axle oil verified at local workshop.',
        sourceLabel: 'Independently Verified',
      },
      {
        id: 't2',
        date: 'Oct 2026',
        title: 'RC, Insurance & PUC Reviewed',
        summary: 'Valid private-to-prototype record on file.',
        sourceLabel: 'Document Reviewed',
      },
    ],
    isDemo: true,
  },
  {
    id: 'toyota-hilux-4x4',
    name: 'Toyota Hilux High 4x4',
    brand: 'Toyota',
    model: 'Hilux',
    year: 2024,
    category: 'Off-Road & Adventure Vehicles',
    location: 'Phase 7, Mohali',
    pricePerDay: 7200,
    securityDeposit: 25000,
    transmission: 'Automatic',
    fuelType: 'Diesel',
    seats: 5,
    rating: 4.9,
    tripsCount: 14,
    available: true,
    verificationStatus: 'Independently Verified',
    ownerName: 'Kabir M. (Demo Owner)',
    ownerSince: '2025',
    image:
      'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80',
    ],
    highlights: ['2.8L Turbo Diesel (500 Nm)', 'Electronic Rear Diff Lock', 'Lockable Deck Cargo'],
    rules: ['Minimum 3 years driving experience', 'Trip itinerary must be disclosed prior to approval'],
    offRoadSpecs: {
      subCategory: 'Pickup Trucks',
      drivetrain: '4x4',
      groundClearanceMm: 216,
      approachAngleDeg: 29,
      departureAngleDeg: 26,
      tyreType: 'Yokohama Geolandar A/T G015',
      terrains: [
        { terrain: 'Highway', sourceLabel: 'Platform Recorded' },
        { terrain: 'Gravel', sourceLabel: 'Independently Verified' },
        { terrain: 'Dirt Roads', sourceLabel: 'Independently Verified' },
        { terrain: 'Rocky Terrain', sourceLabel: 'Document Reviewed' },
        { terrain: 'Sand', sourceLabel: 'Owner Submitted' },
        { terrain: 'Mud', sourceLabel: 'Owner Submitted' },
      ],
      modifications: ['Roller shutter deck lid', 'Heavy-duty roof crossbars'],
      recoveryEquipment: ['Recovery traction boards (pair)', 'Rated D-shackles & tow strap', 'Tyre inflator + puncture kit'],
      restrictions: ['Payload limit 470 kg in deck', 'Commercial hauling prohibited'],
      permittedRoutes: 'Tricity, Himachal Pradesh, Uttarakhand & Rajasthan desert circuits',
    },
    passportEvents: [
      {
        id: 'h1',
        date: 'Nov 2026',
        title: 'Tyre Tread & Suspension Check (9.5mm)',
        summary: 'Workshop measurement documented before winter season.',
        sourceLabel: 'Independently Verified',
      },
      {
        id: 'h2',
        date: 'Sep 2026',
        title: 'Spiti 6-Day Expedition Returned Clean',
        summary: 'Zero exterior body damage; underbody wash completed.',
        sourceLabel: 'Platform Recorded',
      },
    ],
    isDemo: true,
  },
  {
    id: 'maruti-jimny-alpha',
    name: 'Maruti Suzuki Jimny Alpha 4x4',
    brand: 'Maruti Suzuki',
    model: 'Jimny Alpha',
    year: 2024,
    category: 'Off-Road & Adventure Vehicles',
    location: 'Sector 35, Chandigarh',
    pricePerDay: 3600,
    securityDeposit: 12000,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    seats: 4,
    rating: 4.8,
    tripsCount: 19,
    available: true,
    verificationStatus: 'Document Reviewed',
    ownerName: 'Rohan B. (Demo Owner)',
    ownerSince: '2025',
    image:
      'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1400&q=80',
    ],
    highlights: ['AllGrip Pro 4WD', 'Compact Mountain Width', 'Ladder-Frame Chassis'],
    rules: ['Narrow-trail friendly', 'Respect payload limits with 4 adults + luggage'],
    offRoadSpecs: {
      subCategory: '4WD Adventure Vehicles',
      drivetrain: '4WD',
      groundClearanceMm: 210,
      approachAngleDeg: 36,
      departureAngleDeg: 50,
      tyreType: 'Bridgestone Dueler A/T',
      terrains: [
        { terrain: 'Highway', sourceLabel: 'Platform Recorded' },
        { terrain: 'Gravel', sourceLabel: 'Owner Submitted' },
        { terrain: 'Dirt Roads', sourceLabel: 'Owner Submitted' },
        { terrain: 'Rocky Terrain', sourceLabel: 'Owner Submitted' },
        { terrain: 'Snow', sourceLabel: 'Owner Submitted' },
      ],
      modifications: ['Roof luggage basket'],
      recoveryEquipment: ['Tow rope', 'First-aid & altitude emergency kit'],
      restrictions: ['No aftermarket winch fitted', 'Avoid deep mud bogs'],
      permittedRoutes: 'Shimla, Chanshal Pass, Tirthan Valley & Kinnaur paved/gravel roads',
    },
    passportEvents: [
      {
        id: 'j1',
        date: 'Oct 2026',
        title: '10,000 km Inspection & Alignment',
        summary: 'Owner uploaded dealership invoice.',
        sourceLabel: 'Owner Submitted',
      },
    ],
    isDemo: true,
  },
  {
    id: 'force-gurkha-4x4',
    name: 'Force Gurkha 4x4 Expedition',
    brand: 'Force',
    model: 'Gurkha 4x4',
    year: 2023,
    category: 'Off-Road & Adventure Vehicles',
    location: 'Sector 22, Chandigarh',
    pricePerDay: 4800,
    securityDeposit: 18000,
    transmission: 'Manual',
    fuelType: 'Diesel',
    seats: 4,
    rating: 4.7,
    tripsCount: 9,
    available: true,
    verificationStatus: 'Document Reviewed',
    ownerName: 'Aarav K. (Demo Owner)',
    ownerSince: '2026',
    image:
      'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1400&q=80',
    ],
    highlights: ['Front & Rear Mechanical Diff Locks', 'Factory Snorkel', '700mm Water Wading'],
    rules: ['Manual 4x4 experience required', 'Owner briefing mandatory at pickup'],
    offRoadSpecs: {
      subCategory: '4x4 SUVs',
      drivetrain: '4x4',
      groundClearanceMm: 233,
      approachAngleDeg: 39,
      departureAngleDeg: 37,
      tyreType: 'Apollo Apterra AT2',
      terrains: [
        { terrain: 'Highway', sourceLabel: 'Platform Recorded' },
        { terrain: 'Gravel', sourceLabel: 'Document Reviewed' },
        { terrain: 'Dirt Roads', sourceLabel: 'Document Reviewed' },
        { terrain: 'Rocky Terrain', sourceLabel: 'Document Reviewed' },
        { terrain: 'Mud', sourceLabel: 'Owner Submitted' },
        { terrain: 'Snow', sourceLabel: 'Owner Submitted' },
      ],
      modifications: ['Factory air intake snorkel', 'Heavy-duty steel bumper'],
      recoveryEquipment: ['Recovery straps', 'High-lift jack', 'Air compressor'],
      restrictions: ['Maximum highway cruising speed 95 km/h recommended'],
      permittedRoutes: 'Lahaul, Spiti, Sach Pass (seasonal) & Shivalik trails',
    },
    passportEvents: [
      {
        id: 'g1',
        date: 'Oct 2026',
        title: 'Diff-Lock Actuator & Snorkel Seal Checked',
        summary: 'Verified prior to autumn listings.',
        sourceLabel: 'Document Reviewed',
      },
    ],
    isDemo: true,
  },
  {
    id: 'toyota-fortuner-awd',
    name: 'Toyota Fortuner Legender 4x4',
    brand: 'Toyota',
    model: 'Fortuner',
    year: 2024,
    category: 'SUVs',
    location: 'Sector 9, Chandigarh',
    pricePerDay: 6400,
    securityDeposit: 20000,
    transmission: 'Automatic',
    fuelType: 'Diesel',
    seats: 7,
    rating: 4.9,
    tripsCount: 22,
    available: true,
    verificationStatus: 'Independently Verified',
    ownerName: 'Simranjeet P. (Demo Owner)',
    ownerSince: '2025',
    image:
      'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1400&q=80',
    ],
    highlights: ['7-Seater Family Flagship', 'AWD / 4x4 Dual Mode', 'Dual-Zone Climate'],
    rules: ['Ideal for family mountain tours', 'No roof loading over 50 kg'],
    offRoadSpecs: {
      subCategory: 'Adventure SUVs',
      drivetrain: 'AWD',
      groundClearanceMm: 225,
      approachAngleDeg: 29,
      departureAngleDeg: 25,
      tyreType: 'Bridgestone Dueler H/T',
      terrains: [
        { terrain: 'Highway', sourceLabel: 'Platform Recorded' },
        { terrain: 'Gravel', sourceLabel: 'Owner Submitted' },
        { terrain: 'Dirt Roads', sourceLabel: 'Owner Submitted' },
      ],
      modifications: ['OEM scuff plates'],
      recoveryEquipment: ['12V tyre inflator', 'Reflective warning kit'],
      restrictions: ['Highway-terrain tyres fitted — not cleared for deep mud or boulders'],
      permittedRoutes: 'Chandigarh, Delhi NCR, Manali, Dharamshala, Shimla highways',
    },
    passportEvents: [
      {
        id: 'f1',
        date: 'Nov 2026',
        title: 'Toyota Authorised Service Record',
        summary: '30,000 km maintenance reviewed.',
        sourceLabel: 'Document Reviewed',
      },
    ],
    isDemo: true,
  },
  {
    id: 'himalayan-450',
    name: 'Royal Enfield Himalayan 450',
    brand: 'Royal Enfield',
    model: 'Himalayan 450',
    year: 2024,
    category: 'Off-Road & Adventure Vehicles',
    location: 'Sector 15, Chandigarh',
    pricePerDay: 2200,
    securityDeposit: 8000,
    transmission: 'Manual',
    fuelType: 'Petrol',
    seats: 2,
    rating: 4.9,
    tripsCount: 31,
    available: true,
    verificationStatus: 'Independently Verified',
    ownerName: 'Devansh T. (Demo Owner)',
    ownerSince: '2025',
    image:
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1400&q=80',
    ],
    highlights: ['Sherpa 452cc Liquid Cooled', 'Switchable Rear ABS', 'Long-Travel Showa USD Forks'],
    rules: ['ECE/ISI full-face helmet mandatory', 'Two-wheeler DL + riding gear check'],
    offRoadSpecs: {
      subCategory: 'Adventure Motorcycles',
      drivetrain: '2WD',
      groundClearanceMm: 230,
      tyreType: 'CEAT Gripp XL Dual-Sport Tube/Tubeless',
      terrains: [
        { terrain: 'Highway', sourceLabel: 'Platform Recorded' },
        { terrain: 'Gravel', sourceLabel: 'Independently Verified' },
        { terrain: 'Dirt Roads', sourceLabel: 'Independently Verified' },
        { terrain: 'Rocky Terrain', sourceLabel: 'Owner Submitted' },
        { terrain: 'Sand', sourceLabel: 'Owner Submitted' },
      ],
      modifications: ['Aluminium bash plate', 'Barkbusters handguards', 'Rear luggage rack'],
      recoveryEquipment: ['Chain lube & portable tool roll', 'Tubeless puncture repair kit'],
      restrictions: ['Pillion weight + luggage must stay below 165 kg'],
      permittedRoutes: 'Chandigarh–Ladakh, Spiti Valley, Leh-Manali & Uttarakhand routes',
    },
    passportEvents: [
      {
        id: 're1',
        date: 'Nov 2026',
        title: 'Chain Sprocket & Fork Seal Replaced',
        summary: 'Invoice verified by platform checklist.',
        sourceLabel: 'Document Reviewed',
      },
    ],
    isDemo: true,
  },
  {
    id: 'bmw-r1250gs',
    name: 'BMW F 850 GS Touring',
    brand: 'BMW Motorrad',
    model: 'F 850 GS',
    year: 2023,
    category: 'Motorcycles',
    location: 'IT Park, Chandigarh',
    pricePerDay: 5200,
    securityDeposit: 20000,
    transmission: 'Manual',
    fuelType: 'Petrol',
    seats: 2,
    rating: 4.8,
    tripsCount: 8,
    available: true,
    verificationStatus: 'Document Reviewed',
    ownerName: 'Arjun V. (Demo Owner)',
    ownerSince: '2026',
    image:
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1400&q=80',
    ],
    highlights: ['Enduro Pro Ride Modes', 'Cruise Control & Heated Grips', 'Aluminium Panniers'],
    rules: ['Prior >500cc motorcycle riding experience required', 'Full riding jacket & boots mandatory'],
    offRoadSpecs: {
      subCategory: 'Touring Motorcycles',
      drivetrain: '2WD',
      groundClearanceMm: 225,
      tyreType: 'Metzeler Karoo Street (80/20)',
      terrains: [
        { terrain: 'Highway', sourceLabel: 'Platform Recorded' },
        { terrain: 'Gravel', sourceLabel: 'Owner Submitted' },
        { terrain: 'Dirt Roads', sourceLabel: 'Owner Submitted' },
      ],
      modifications: ['Crash bars', 'Auxiliary fog lights', 'Top box'],
      recoveryEquipment: ['BMW toolkit & tyre pressure monitor'],
      restrictions: ['No extreme single-track trails'],
      permittedRoutes: 'All national highways & paved Himalayan passes',
    },
    passportEvents: [
      {
        id: 'bm1',
        date: 'Oct 2026',
        title: 'Annual Motorrad Service Completed',
        summary: 'Submitted by owner.',
        sourceLabel: 'Owner Submitted',
      },
    ],
    isDemo: true,
  },
  {
    id: 'tata-nexon-ev',
    name: 'Tata Nexon.ev Empowered+ LR',
    brand: 'Tata',
    model: 'Nexon.ev',
    year: 2024,
    category: 'Electric Vehicles',
    location: 'Sector 43, Chandigarh',
    pricePerDay: 2800,
    securityDeposit: 10000,
    transmission: 'Single-Speed',
    fuelType: 'Electric',
    seats: 5,
    rating: 4.8,
    tripsCount: 27,
    available: true,
    verificationStatus: 'Document Reviewed',
    ownerName: 'Neha R. (Demo Owner)',
    ownerSince: '2025',
    image:
      'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1400&q=80',
    ],
    highlights: ['465 km ARAI Certified Range', '360° Surround Camera', 'Portable 3.3kW Charger Included'],
    rules: ['Return with minimum 30% battery charge', 'Fast-charging receipts self-settled'],
    passportEvents: [
      {
        id: 'ev1',
        date: 'Oct 2026',
        title: 'HV Battery Health Report (98% SoH)',
        summary: 'Diagnostic report uploaded by owner.',
        sourceLabel: 'Owner Submitted',
      },
    ],
    isDemo: true,
  },
  {
    id: 'hyundai-creta-sx',
    name: 'Hyundai Creta SX(O) IVT',
    brand: 'Hyundai',
    model: 'Creta',
    year: 2024,
    category: 'SUVs',
    location: 'Zirakpur, Mohali',
    pricePerDay: 3000,
    securityDeposit: 10000,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    seats: 5,
    rating: 4.7,
    tripsCount: 35,
    available: true,
    verificationStatus: 'Document Reviewed',
    ownerName: 'Manish D. (Demo Owner)',
    ownerSince: '2025',
    image:
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1400&q=80',
    ],
    highlights: ['Panoramic Sunroof', 'Level 2 ADAS', 'Ventilated Front Seats'],
    rules: ['Paved urban & highway trips', 'FASTag recharge deducted at actuals'],
    passportEvents: [
      {
        id: 'cr1',
        date: 'Oct 2026',
        title: 'RC & Zero-Dep Insurance Reviewed',
        summary: 'Documents checked for prototype showcase.',
        sourceLabel: 'Document Reviewed',
      },
    ],
    isDemo: true,
  },
  {
    id: 'honda-city-zx',
    name: 'Honda City ZX e:HEV',
    brand: 'Honda',
    model: 'City Hybrid',
    year: 2023,
    category: 'Sedans',
    location: 'Sector 11, Chandigarh',
    pricePerDay: 2600,
    securityDeposit: 8000,
    transmission: 'Automatic',
    fuelType: 'Hybrid',
    seats: 5,
    rating: 4.8,
    tripsCount: 29,
    available: true,
    verificationStatus: 'Document Reviewed',
    ownerName: 'Pranav S. (Demo Owner)',
    ownerSince: '2025',
    image:
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1400&q=80',
    ],
    highlights: ['27 km/l Hybrid Efficiency', 'Honda Sensing ADAS', 'Executive Rear Legroom'],
    rules: ['Clean interior policy', 'Chandigarh–Delhi–Shimla corridors'],
    passportEvents: [
      {
        id: 'hc1',
        date: 'Sep 2026',
        title: '15,000 km Service Logged',
        summary: 'Routine hybrid check completed.',
        sourceLabel: 'Owner Submitted',
      },
    ],
    isDemo: true,
  },
  {
    id: 'suzuki-swift-zxi',
    name: 'Maruti Swift ZXi+ AMT',
    brand: 'Maruti Suzuki',
    model: 'Swift',
    year: 2024,
    category: 'Hatchbacks',
    location: 'Sector 14 (PU Campus), Chandigarh',
    pricePerDay: 1450,
    securityDeposit: 5000,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    seats: 5,
    rating: 4.6,
    tripsCount: 41,
    available: true,
    verificationStatus: 'Document Reviewed',
    ownerName: 'Riya G. (Demo Owner)',
    ownerSince: '2025',
    image:
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1400&q=80',
    ],
    highlights: ['Student-Friendly Daily Rate', 'Wireless CarPlay', 'Compact Tricity Parking'],
    rules: ['Valid DL required (min 1 year)', 'Fuel level matched at return'],
    passportEvents: [
      {
        id: 'sw1',
        date: 'Oct 2026',
        title: 'PUC & Insurance Validated',
        summary: 'Prototype document review logged.',
        sourceLabel: 'Document Reviewed',
      },
    ],
    isDemo: true,
  },
  {
    id: 'ather-450x-pro',
    name: 'Ather 450X 3.7 kWh',
    brand: 'Ather',
    model: '450X',
    year: 2024,
    category: 'Scooters',
    location: 'Sector 34, Chandigarh',
    pricePerDay: 650,
    securityDeposit: 2500,
    transmission: 'Single-Speed',
    fuelType: 'Electric',
    seats: 2,
    rating: 4.7,
    tripsCount: 48,
    available: true,
    verificationStatus: 'Document Reviewed',
    ownerName: 'Karanjot L. (Demo Owner)',
    ownerSince: '2025',
    image:
      'https://images.unsplash.com/photo-1558980394-4c7c9299fe96?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1558980394-4c7c9299fe96?auto=format&fit=crop&w=1400&q=80',
    ],
    highlights: ['110 km TrueRange', 'Google Maps Dashboard', 'Ather Grid Fast-Charge Ready'],
    rules: ['City & Tricity limits only', 'ISI helmet included at pickup'],
    passportEvents: [
      {
        id: 'at1',
        date: 'Nov 2026',
        title: 'Brake Pad & Belt Check',
        summary: 'Submitted by owner.',
        sourceLabel: 'Owner Submitted',
      },
    ],
    isDemo: true,
  },
];
