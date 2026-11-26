-- SHAREWHEELS Luxury Collection: 24 city-specific luxury showroom listings (3 per Indian city across 8 cities)
-- Uses exact Luxury Vehicles category UUID and local optimized transparent WebP showroom assets.

INSERT INTO public.vehicles (
  slug, owner_id, category_id, location_id, city_slug,
  name, brand, model, variant, year, registration_city, location,
  price_per_day_paise, security_deposit_paise,
  transmission, fuel_type, seats, drivetrain, mileage_or_range,
  rating, trips_count, available, verification_status, listing_status,
  owner_display_name, owner_since, image_url, gallery_urls,
  highlights, rules, description, is_demo
) VALUES
  -- DELHI NCR (3)
  (
    'lux-del-range-rover-autobiography', NULL,
    '957b7ff5-82dd-4945-bdca-8c74918e60f5', 'b93fa9c5-ff5f-4c01-9cfd-26ec77c8baa4', 'delhi-ncr',
    'Range Rover Autobiography', 'Land Rover', 'Range Rover', 'Autobiography LWB', 2024, 'New Delhi', 'Khan Market / Lutyens, Delhi NCR',
    2850000, 6500000,
    'Automatic', 'Diesel', 5, 'AWD', NULL,
    4.9, 14, true, 'Sample Prototype Listing', 'APPROVED',
    'Sample Listing', '2025', '/images/luxury/range-rover-autobiography.webp',
    ARRAY['/images/luxury/range-rover-autobiography.webp'],
    ARRAY['Executive Rear Lounge', 'Meridian Signature Sound', 'Electronic Air Suspension'],
    ARRAY['Paved highways & urban zones only', 'Verified licence & 25+ driver age required'],
    'Flagship long-wheelbase SUV presented in the SHAREWHEELS Private Showroom across Delhi NCR.',
    true
  ),
  (
    'lux-del-mercedes-gls', NULL,
    '957b7ff5-82dd-4945-bdca-8c74918e60f5', 'b93fa9c5-ff5f-4c01-9cfd-26ec77c8baa4', 'delhi-ncr',
    'Mercedes-Benz GLS', 'Mercedes-Benz', 'GLS', '450d 4MATIC Maybach Edition Spec', 2024, 'New Delhi', 'Vasant Vihar, Delhi NCR',
    2400000, 5500000,
    'Automatic', 'Diesel', 7, 'AWD', NULL,
    4.9, 18, true, 'Sample Prototype Listing', 'APPROVED',
    'Sample Listing', '2025', '/images/luxury/mercedes-gls.webp',
    ARRAY['/images/luxury/mercedes-gls.webp'],
    ARRAY['4MATIC All-Wheel Drive', 'Burmester Surround Audio', 'Three-Row Executive Cabin'],
    ARRAY['Paved expressways & city drives only', 'Verified licence & 25+ driver age required'],
    'Full-size flagship Mercedes-Benz GLS grand tourer available in Delhi NCR.',
    true
  ),
  (
    'lux-del-rolls-royce-ghost', NULL,
    '957b7ff5-82dd-4945-bdca-8c74918e60f5', 'b93fa9c5-ff5f-4c01-9cfd-26ec77c8baa4', 'delhi-ncr',
    'Rolls-Royce Ghost', 'Rolls-Royce', 'Ghost', 'Extended Sanctuary Edition', 2023, 'New Delhi', 'Chanakyapuri, Delhi NCR',
    5800000, 12000000,
    'Automatic', 'Petrol', 4, 'RWD', NULL,
    5.0, 7, true, 'Sample Prototype Listing', 'APPROVED',
    'Sample Listing', '2025', '/images/luxury/rolls-royce-ghost.webp',
    ARRAY['/images/luxury/rolls-royce-ghost.webp'],
    ARRAY['Planar Suspension Architecture', 'Starlight Headliner', 'Rear Theatre Configuration'],
    ARRAY['Prior route disclosure required', 'Verified licence & 28+ driver age or chauffeur protocol'],
    'Bespoke V12 presence crafted for formal arrivals across Delhi NCR.',
    true
  ),

  -- MUMBAI (3)
  (
    'lux-mum-porsche-911', NULL,
    '957b7ff5-82dd-4945-bdca-8c74918e60f5', '87bd0a6e-2c74-4bb5-8b9b-1e1d2c75bff8', 'mumbai',
    'Porsche 911', 'Porsche', '911', 'GT3 RS Track Coupe', 2024, 'Mumbai', 'Worli Sea Face, Mumbai',
    3600000, 8000000,
    'Automatic', 'Petrol', 2, 'RWD', NULL,
    4.9, 11, true, 'Sample Prototype Listing', 'APPROVED',
    'Sample Listing', '2025', '/images/luxury/porsche-911.webp',
    ARRAY['/images/luxury/porsche-911.webp'],
    ARRAY['PDK Dual-Clutch Gearbox', 'Active Aerodynamics', 'Carbon-Ceramic Braking System'],
    ARRAY['No track days or speed contests', 'Paved coastal & expressway routes only'],
    'Precision flat-six sports coupe staged in South Mumbai for grand coastal drives.',
    true
  ),
  (
    'lux-mum-bmw-z4', NULL,
    '957b7ff5-82dd-4945-bdca-8c74918e60f5', '87bd0a6e-2c74-4bb5-8b9b-1e1d2c75bff8', 'mumbai',
    'BMW Z4', 'BMW', 'Z4', 'M40i Open-Top Roadster', 2024, 'Mumbai', 'Bandra Pali Hill, Mumbai',
    1850000, 4500000,
    'Automatic', 'Petrol', 2, 'RWD', NULL,
    4.8, 19, true, 'Sample Prototype Listing', 'APPROVED',
    'Sample Listing', '2025', '/images/luxury/bmw-z4.webp',
    ARRAY['/images/luxury/bmw-z4.webp'],
    ARRAY['Retractable Soft-Top Roadster', 'TwinPower Inline-6', 'M Sport Differential'],
    ARRAY['Paved coastal highways only', 'Driver age 25+ with valid licence'],
    'Matte obsidian two-seat open-top roadster stationed in Bandra, Mumbai.',
    true
  ),
  (
    'lux-mum-range-rover-autobiography', NULL,
    '957b7ff5-82dd-4945-bdca-8c74918e60f5', '87bd0a6e-2c74-4bb5-8b9b-1e1d2c75bff8', 'mumbai',
    'Range Rover Autobiography', 'Land Rover', 'Range Rover', 'Autobiography LWB', 2024, 'Mumbai', 'Colaba / Cuffe Parade, Mumbai',
    2900000, 6500000,
    'Automatic', 'Diesel', 5, 'AWD', NULL,
    4.9, 16, true, 'Sample Prototype Listing', 'APPROVED',
    'Sample Listing', '2025', '/images/luxury/range-rover-autobiography.webp',
    ARRAY['/images/luxury/range-rover-autobiography.webp'],
    ARRAY['Semi-Aniline Leather Cabin', 'Meridian Signature Audio', 'All-Wheel Steering'],
    ARRAY['Paved city & expressway routes only', 'Driver age 25+ required'],
    'Black architectural Range Rover Autobiography curated for Mumbai and Sahyadri retreats.',
    true
  ),

  -- BENGALURU (3)
  (
    'lux-blr-land-rover-defender', NULL,
    '957b7ff5-82dd-4945-bdca-8c74918e60f5', '169465a2-9691-4d3a-a374-853db92c9ae7', 'bengaluru',
    'Land Rover Defender', 'Land Rover', 'Defender', '110 HSE Flagship', 2024, 'Bengaluru', 'UB City / Lavelle Road, Bengaluru',
    2100000, 5000000,
    'Automatic', 'Diesel', 5, 'AWD', NULL,
    4.9, 21, true, 'Sample Prototype Listing', 'APPROVED',
    'Sample Listing', '2025', '/images/luxury/land-rover-defender.webp',
    ARRAY['/images/luxury/land-rover-defender.webp'],
    ARRAY['Terrain Response 2', 'Electronic Air Suspension', '3D Surround Camera'],
    ARRAY['Extreme rock crawling prohibited', 'Driver age 25+ required'],
    'British racing-green Land Rover Defender 110 stationed at UB City, Bengaluru.',
    true
  ),
  (
    'lux-blr-mercedes-gls', NULL,
    '957b7ff5-82dd-4945-bdca-8c74918e60f5', '169465a2-9691-4d3a-a374-853db92c9ae7', 'bengaluru',
    'Mercedes-Benz GLS', 'Mercedes-Benz', 'GLS', '450d 4MATIC Luxury Tourer', 2024, 'Bengaluru', 'Indiranagar, Bengaluru',
    2350000, 5500000,
    'Automatic', 'Diesel', 7, 'AWD', NULL,
    4.9, 13, true, 'Sample Prototype Listing', 'APPROVED',
    'Sample Listing', '2025', '/images/luxury/mercedes-gls.webp',
    ARRAY['/images/luxury/mercedes-gls.webp'],
    ARRAY['Executive Rear Captain Chairs', 'E-ACTIVE BODY CONTROL', 'Burmester Audio'],
    ARRAY['Paved highway & hill estate roads', 'Driver age 25+ required'],
    'Three-row flagship Mercedes-Benz GLS ready for Coorg, Kabini, and Bengaluru executive travel.',
    true
  ),
  (
    'lux-blr-porsche-911', NULL,
    '957b7ff5-82dd-4945-bdca-8c74918e60f5', '169465a2-9691-4d3a-a374-853db92c9ae7', 'bengaluru',
    'Porsche 911', 'Porsche', '911', 'GT3 RS Clubsport', 2024, 'Bengaluru', 'Sadashivanagar, Bengaluru',
    3500000, 8000000,
    'Automatic', 'Petrol', 2, 'RWD', NULL,
    5.0, 9, true, 'Sample Prototype Listing', 'APPROVED',
    'Sample Listing', '2025', '/images/luxury/porsche-911.webp',
    ARRAY['/images/luxury/porsche-911.webp'],
    ARRAY['High-Revving Flat-Six', 'PCCB Ceramic Brakes', 'Front Axle Lift System'],
    ARRAY['No racing or track use', 'Driver age 26+ with clean record'],
    'Track-sculpted Porsche 911 GT3 RS stationed in Sadashivanagar, Bengaluru.',
    true
  ),

  -- CHANDIGARH TRICITY (3)
  (
    'lux-chd-rolls-royce-ghost', NULL,
    '957b7ff5-82dd-4945-bdca-8c74918e60f5', '481ac823-f2db-4ec9-913f-2d42974479c1', 'chandigarh-tricity',
    'Rolls-Royce Ghost', 'Rolls-Royce', 'Ghost', 'Black Badge Architecture', 2023, 'Chandigarh', 'Sector 8, Chandigarh Tricity',
    5500000, 11500000,
    'Automatic', 'Petrol', 4, 'RWD', NULL,
    5.0, 6, true, 'Sample Prototype Listing', 'APPROVED',
    'Sample Listing', '2025', '/images/luxury/rolls-royce-ghost.webp',
    ARRAY['/images/luxury/rolls-royce-ghost.webp'],
    ARRAY['Hand-Stitched Leather Lounge', 'Acoustic Glass Insulation', 'Bespoke Audio'],
    ARRAY['Paved urban & highway corridors only', 'Verified licence & 28+ driver age'],
    'Quiet ultra-luxury Rolls-Royce Ghost saloon hosted in Sector 8, Chandigarh.',
    true
  ),
  (
    'lux-chd-range-rover-autobiography', NULL,
    '957b7ff5-82dd-4945-bdca-8c74918e60f5', '481ac823-f2db-4ec9-913f-2d42974479c1', 'chandigarh-tricity',
    'Range Rover Autobiography', 'Land Rover', 'Range Rover', 'Autobiography LWB', 2024, 'Chandigarh', 'Sector 9, Chandigarh Tricity',
    2750000, 6000000,
    'Automatic', 'Diesel', 5, 'AWD', NULL,
    4.9, 15, true, 'Sample Prototype Listing', 'APPROVED',
    'Sample Listing', '2025', '/images/luxury/range-rover-autobiography.webp',
    ARRAY['/images/luxury/range-rover-autobiography.webp'],
    ARRAY['All-Wheel Drive Precision', 'Heated & Ventilated Executive Seats', 'Meridian Audio'],
    ARRAY['Paved hill highways permitted', 'Driver age 25+ required'],
    'Signature Range Rover Autobiography stationed in Chandigarh for Shimla, Kasauli, and executive transit.',
    true
  ),
  (
    'lux-chd-bmw-z4', NULL,
    '957b7ff5-82dd-4945-bdca-8c74918e60f5', '481ac823-f2db-4ec9-913f-2d42974479c1', 'chandigarh-tricity',
    'BMW Z4', 'BMW', 'Z4', 'M40i Roadster', 2024, 'Chandigarh', 'Sector 17 Madhya Marg, Chandigarh Tricity',
    1750000, 4200000,
    'Automatic', 'Petrol', 2, 'RWD', NULL,
    4.8, 12, true, 'Sample Prototype Listing', 'APPROVED',
    'Sample Listing', '2025', '/images/luxury/bmw-z4.webp',
    ARRAY['/images/luxury/bmw-z4.webp'],
    ARRAY['Open-Air Two-Seat Cabin', 'Adaptive M Suspension', 'Live Cockpit Professional'],
    ARRAY['Paved roads & foothill highways only', 'Driver age 25+ required'],
    'Matte black BMW Z4 M40i roadster ready on Sector 17 boulevards in Chandigarh.',
    true
  ),

  -- HYDERABAD (3)
  (
    'lux-hyd-mercedes-gls', NULL,
    '957b7ff5-82dd-4945-bdca-8c74918e60f5', '37882e2d-3f5b-4b7d-8881-3d27c11fb267', 'hyderabad',
    'Mercedes-Benz GLS', 'Mercedes-Benz', 'GLS', '450d 4MATIC Executive', 2024, 'Hyderabad', 'Jubilee Hills, Hyderabad',
    2350000, 5500000,
    'Automatic', 'Diesel', 7, 'AWD', NULL,
    4.9, 10, true, 'Sample Prototype Listing', 'APPROVED',
    'Sample Listing', '2025', '/images/luxury/mercedes-gls.webp',
    ARRAY['/images/luxury/mercedes-gls.webp'],
    ARRAY['AIRMATIC Package', 'Executive Rear Comfort Plus', 'Ambient Gallery Lighting'],
    ARRAY['Paved city & expressway corridors only', 'Driver age 25+ required'],
    'Obsidian Mercedes-Benz GLS stationed in Jubilee Hills, Hyderabad.',
    true
  ),
  (
    'lux-hyd-porsche-911', NULL,
    '957b7ff5-82dd-4945-bdca-8c74918e60f5', '37882e2d-3f5b-4b7d-8881-3d27c11fb267', 'hyderabad',
    'Porsche 911', 'Porsche', '911', 'GT3 RS Performance', 2024, 'Hyderabad', 'Banjara Hills, Hyderabad',
    3450000, 7800000,
    'Automatic', 'Petrol', 2, 'RWD', NULL,
    4.9, 8, true, 'Sample Prototype Listing', 'APPROVED',
    'Sample Listing', '2025', '/images/luxury/porsche-911.webp',
    ARRAY['/images/luxury/porsche-911.webp'],
    ARRAY['Active Rear-Axle Steering', 'Sport Chrono Telemetry', 'Lightweight Bucket Seats'],
    ARRAY['Outer Ring Road & paved highways only', 'No circuit racing'],
    'Guard-orange Porsche 911 GT3 RS hosted in Banjara Hills, Hyderabad.',
    true
  ),
  (
    'lux-hyd-land-rover-defender', NULL,
    '957b7ff5-82dd-4945-bdca-8c74918e60f5', '37882e2d-3f5b-4b7d-8881-3d27c11fb267', 'hyderabad',
    'Land Rover Defender', 'Land Rover', 'Defender', '110 HSE AWD', 2024, 'Hyderabad', 'Financial District, Hyderabad',
    2050000, 4800000,
    'Automatic', 'Diesel', 5, 'AWD', NULL,
    4.9, 14, true, 'Sample Prototype Listing', 'APPROVED',
    'Sample Listing', '2025', '/images/luxury/land-rover-defender.webp',
    ARRAY['/images/luxury/land-rover-defender.webp'],
    ARRAY['Command Driving Position', 'Twin-Speed Transfer Box', 'Meridian Audio'],
    ARRAY['Paved & graded estate roads', 'Driver age 25+ required'],
    'Commanding Land Rover Defender 110 stationed in Hyderabad Financial District.',
    true
  ),

  -- PUNE (3)
  (
    'lux-pun-bmw-z4', NULL,
    '957b7ff5-82dd-4945-bdca-8c74918e60f5', '19e986f1-4a62-4c21-b189-2e404ef4d20b', 'pune',
    'BMW Z4', 'BMW', 'Z4', 'M40i Open-Top Roadster', 2024, 'Pune', 'Koregaon Park, Pune',
    1700000, 4000000,
    'Automatic', 'Petrol', 2, 'RWD', NULL,
    4.8, 11, true, 'Sample Prototype Listing', 'APPROVED',
    'Sample Listing', '2025', '/images/luxury/bmw-z4.webp',
    ARRAY['/images/luxury/bmw-z4.webp'],
    ARRAY['B58 Inline-Six Powertrain', 'M Sport Brakes', 'Soft-Top Grand Tourer'],
    ARRAY['Paved Sahyadri & expressway drives', 'Driver age 25+ required'],
    'Dynamic BMW Z4 roadster stationed in Koregaon Park, Pune.',
    true
  ),
  (
    'lux-pun-land-rover-defender', NULL,
    '957b7ff5-82dd-4945-bdca-8c74918e60f5', '19e986f1-4a62-4c21-b189-2e404ef4d20b', 'pune',
    'Land Rover Defender', 'Land Rover', 'Defender', '110 HSE Flagship', 2024, 'Pune', 'Kalyani Nagar, Pune',
    2000000, 4800000,
    'Automatic', 'Diesel', 5, 'AWD', NULL,
    4.9, 13, true, 'Sample Prototype Listing', 'APPROVED',
    'Sample Listing', '2025', '/images/luxury/land-rover-defender.webp',
    ARRAY['/images/luxury/land-rover-defender.webp'],
    ARRAY['Adjustable Air Suspension', 'All-Terrain Progress Control', 'Panoramic Roof'],
    ARRAY['Hill & highway touring approved', 'No unauthorized heavy trails'],
    'Architectural Land Rover Defender ready in Kalyani Nagar for Mahabaleshwar & Lonavala.',
    true
  ),
  (
    'lux-pun-range-rover-autobiography', NULL,
    '957b7ff5-82dd-4945-bdca-8c74918e60f5', '19e986f1-4a62-4c21-b189-2e404ef4d20b', 'pune',
    'Range Rover Autobiography', 'Land Rover', 'Range Rover', 'Autobiography LWB', 2024, 'Pune', 'Boat Club Road, Pune',
    2800000, 6200000,
    'Automatic', 'Diesel', 5, 'AWD', NULL,
    4.9, 9, true, 'Sample Prototype Listing', 'APPROVED',
    'Sample Listing', '2025', '/images/luxury/range-rover-autobiography.webp',
    ARRAY['/images/luxury/range-rover-autobiography.webp'],
    ARRAY['Executive Seating Suite', 'Active Noise Cancellation', 'All-Wheel Drive'],
    ARRAY['Paved expressway & urban drives', 'Driver age 25+ required'],
    'Range Rover Autobiography curated at Boat Club Road, Pune.',
    true
  ),

  -- JAIPUR (3)
  (
    'lux-jai-rolls-royce-ghost', NULL,
    '957b7ff5-82dd-4945-bdca-8c74918e60f5', '5e501c4f-eea0-4c21-b4e7-cee9b823e6f4', 'jaipur',
    'Rolls-Royce Ghost', 'Rolls-Royce', 'Ghost', 'Extended Heritage Spec', 2023, 'Jaipur', 'Civil Lines / Rambagh, Jaipur',
    5600000, 11500000,
    'Automatic', 'Petrol', 4, 'RWD', NULL,
    5.0, 5, true, 'Sample Prototype Listing', 'APPROVED',
    'Sample Listing', '2025', '/images/luxury/rolls-royce-ghost.webp',
    ARRAY['/images/luxury/rolls-royce-ghost.webp'],
    ARRAY['Rambagh Palace Heritage Corridors', 'Rear Picnic Tables', 'Planar Ride Quality'],
    ARRAY['Paved heritage & hotel approaches only', 'Driver age 28+ or formal chauffeur'],
    'Iconic Rolls-Royce Ghost curated for heritage arrivals and palace transfers in Jaipur.',
    true
  ),
  (
    'lux-jai-land-rover-defender', NULL,
    '957b7ff5-82dd-4945-bdca-8c74918e60f5', '5e501c4f-eea0-4c21-b4e7-cee9b823e6f4', 'jaipur',
    'Land Rover Defender', 'Land Rover', 'Defender', '110 HSE AWD', 2024, 'Jaipur', 'C-Scheme, Jaipur',
    1980000, 4500000,
    'Automatic', 'Diesel', 5, 'AWD', NULL,
    4.9, 12, true, 'Sample Prototype Listing', 'APPROVED',
    'Sample Listing', '2025', '/images/luxury/land-rover-defender.webp',
    ARRAY['/images/luxury/land-rover-defender.webp'],
    ARRAY['Desert Highway Composure', 'Electronic Air Suspension', 'Wade Sensing'],
    ARRAY['Highway & fortress approaches approved', 'Driver age 25+ required'],
    'Land Rover Defender 110 stationed in C-Scheme, Jaipur.',
    true
  ),
  (
    'lux-jai-mercedes-gls', NULL,
    '957b7ff5-82dd-4945-bdca-8c74918e60f5', '5e501c4f-eea0-4c21-b4e7-cee9b823e6f4', 'jaipur',
    'Mercedes-Benz GLS', 'Mercedes-Benz', 'GLS', '450d 4MATIC Grand Tourer', 2024, 'Jaipur', 'Vaishali Nagar, Jaipur',
    2280000, 5200000,
    'Automatic', 'Diesel', 7, 'AWD', NULL,
    4.9, 11, true, 'Sample Prototype Listing', 'APPROVED',
    'Sample Listing', '2025', '/images/luxury/mercedes-gls.webp',
    ARRAY['/images/luxury/mercedes-gls.webp'],
    ARRAY['Seven-Seat Presidential Suite', 'Multi-Zone Climate Control', '4MATIC AWD'],
    ARRAY['Paved Rajasthan highways only', 'Driver age 25+ required'],
    'Executive Mercedes-Benz GLS ready in Jaipur for Udaipur, Jodhpur, and Pushkar journeys.',
    true
  ),

  -- CHENNAI (3)
  (
    'lux-che-porsche-911', NULL,
    '957b7ff5-82dd-4945-bdca-8c74918e60f5', '74f62353-1891-49be-a292-22461a606f2a', 'chennai',
    'Porsche 911', 'Porsche', '911', 'GT3 RS Coupe', 2024, 'Chennai', 'Boat Club Road, Chennai',
    3550000, 8000000,
    'Automatic', 'Petrol', 2, 'RWD', NULL,
    5.0, 7, true, 'Sample Prototype Listing', 'APPROVED',
    'Sample Listing', '2025', '/images/luxury/porsche-911.webp',
    ARRAY['/images/luxury/porsche-911.webp'],
    ARRAY['ECR Coastal Grand Tourer', '7-Speed PDK', 'Sport Exhaust Architecture'],
    ARRAY['Paved coastal & city roads only', 'No circuit racing'],
    'Porsche 911 GT3 RS stationed on Boat Club Road, Chennai.',
    true
  ),
  (
    'lux-che-rolls-royce-ghost', NULL,
    '957b7ff5-82dd-4945-bdca-8c74918e60f5', '74f62353-1891-49be-a292-22461a606f2a', 'chennai',
    'Rolls-Royce Ghost', 'Rolls-Royce', 'Ghost', 'Extended Sanctuary Spec', 2023, 'Chennai', 'Poes Garden, Chennai',
    5700000, 12000000,
    'Automatic', 'Petrol', 4, 'RWD', NULL,
    5.0, 6, true, 'Sample Prototype Listing', 'APPROVED',
    'Sample Listing', '2025', '/images/luxury/rolls-royce-ghost.webp',
    ARRAY['/images/luxury/rolls-royce-ghost.webp'],
    ARRAY['Bespoke Coachwork', 'Lambswool Floor Mats', 'Whisper-Quiet Cabin'],
    ARRAY['Paved coastal & city roads only', 'Driver age 28+ required'],
    'Rolls-Royce Ghost hosted in Poes Garden, Chennai.',
    true
  ),
  (
    'lux-che-bmw-z4', NULL,
    '957b7ff5-82dd-4945-bdca-8c74918e60f5', '74f62353-1891-49be-a292-22461a606f2a', 'chennai',
    'BMW Z4', 'BMW', 'Z4', 'M40i Coastal Roadster', 2024, 'Chennai', 'Adyar / ECR, Chennai',
    1800000, 4200000,
    'Automatic', 'Petrol', 2, 'RWD', NULL,
    4.8, 10, true, 'Sample Prototype Listing', 'APPROVED',
    'Sample Listing', '2025', '/images/luxury/bmw-z4.webp',
    ARRAY['/images/luxury/bmw-z4.webp'],
    ARRAY['East Coast Road Roadster', 'Straight-Six Response', 'M Aerodynamic Trim'],
    ARRAY['Paved coastal highway drives only', 'Driver age 25+ required'],
    'Matte black BMW Z4 M40i stationed near Adyar for East Coast Road drives.',
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- Attach primary vehicle_images records for each luxury collection vehicle where missing
INSERT INTO public.vehicle_images (
  vehicle_id, image_url, webp_url, angle, is_primary, sort_order, source_site
)
SELECT
  v.id,
  v.image_url,
  v.image_url,
  'side',
  true,
  0,
  'SHAREWHEELS Luxury Collection'
FROM public.vehicles v
WHERE v.slug LIKE 'lux-%'
  AND NOT EXISTS (
    SELECT 1 FROM public.vehicle_images vi
    WHERE vi.vehicle_id = v.id AND vi.is_primary = true
  );
