-- Integrate all 42 cropped vehicle images from the user-provided collage
-- across all 50 active listings in public.vehicles and public.vehicle_images.

WITH image_map(slug, base_name) AS (
  VALUES
    ('blr-audi-a4-tech', 'audi-a4-2024'),
    ('blr-hyundai-i20-nline', 'hyundai-i20-nline-2024'),
    ('blr-maruti-jimny-alpha', 'maruti-jimny-2024'),
    ('blr-skoda-slavia-style', 'skoda-slavia-2024'),
    ('blr-tata-nexon-ev-lr', 'tata-nexon-ev-2024'),
    ('blr-tata-nexon-fearless', 'tata-nexon-2024'),
    ('blr-toyota-fortuner-legender', 'toyota-fortuner-legender-2024'),
    ('chd-bmw-530i-msport', 'bmw-530i-msport-2023'),
    ('chd-mahindra-thar-4x4', 'mahindra-thar-2024'),
    ('chd-mahindra-xuv700-ax7l', 'mahindra-xuv700-2024'),
    ('chd-maruti-swift-zxi', 'maruti-swift-2024'),
    ('chd-tata-nexon-ev-lr', 'tata-nexon-ev-2024'),
    ('chd-toyota-hilux-4x4', 'toyota-hilux-2024'),
    ('che-honda-elevate-zx', 'honda-elevate-2024'),
    ('che-mahindra-thar-lx-4x4', 'mahindra-thar-2024'),
    ('che-maruti-fronx-turbo', 'maruti-fronx-2024'),
    ('che-merc-c220d', 'mercedes-c220d-2024'),
    ('che-tata-punch-ev', 'tata-punch-ev-2024'),
    ('che-toyota-innova-crysta', 'toyota-innova-crysta-2024'),
    ('del-bmw-330li-msport', 'bmw-330li-msport-2024'),
    ('del-byd-atto3-ext', 'byd-atto3-2024'),
    ('del-hyundai-creta-sxo', 'hyundai-creta-2024'),
    ('del-mahindra-thar-roxx-4x4', 'mahindra-thar-roxx-2025'),
    ('del-mahindra-xuv700-ax7l', 'mahindra-xuv700-2024'),
    ('del-maruti-swift-zxi', 'maruti-swift-2024'),
    ('del-vw-virtus-gt', 'volkswagen-virtus-2024'),
    ('hyd-bmw-x3-xdrive', 'bmw-x3-2024'),
    ('hyd-byd-seal-premium', 'byd-seal-2024'),
    ('hyd-hyundai-verna-sxo', 'hyundai-verna-2024'),
    ('hyd-kia-carens-luxury', 'kia-carens-2024'),
    ('hyd-mahindra-scorpio-n-4xplor', 'mahindra-scorpio-n-2024'),
    ('hyd-maruti-baleno-alpha', 'maruti-baleno-2024'),
    ('jai-audi-q3-sportback', 'audi-q3-sportback-2024'),
    ('jai-hyundai-creta-sxo', 'hyundai-creta-2024'),
    ('jai-mahindra-thar-4x4', 'mahindra-thar-2024'),
    ('jai-maruti-grand-vitara-awd', 'maruti-grand-vitara-2024'),
    ('jai-toyota-fortuner-4x4', 'toyota-fortuner-2024'),
    ('mum-honda-city-ehev', 'honda-city-ehev-2024'),
    ('mum-jeep-wrangler-rubicon', 'jeep-wrangler-rubicon-2024'),
    ('mum-kia-seltos-gtx', 'kia-seltos-2024'),
    ('mum-merc-e220d', 'mercedes-e220d-2024'),
    ('mum-mg-zs-ev', 'mg-zs-ev-2024'),
    ('mum-tata-altroz-xz', 'tata-altroz-2024'),
    ('mum-toyota-innova-hycross', 'toyota-innova-hycross-2024'),
    ('pun-honda-city-zx', 'honda-city-zx-2024'),
    ('pun-mahindra-thar-roxx-4x4', 'mahindra-thar-roxx-2025'),
    ('pun-skoda-kodiaq-lk', 'skoda-kodiaq-2024'),
    ('pun-tata-tiago-ev', 'tata-tiago-ev-2024'),
    ('pun-toyota-hilux-4x4', 'toyota-hilux-2024'),
    ('pun-vw-taigun-gt', 'volkswagen-taigun-2024')
)
UPDATE public.vehicles v
SET
  image_url = '/images/vehicles/' || m.base_name || '.jpg',
  gallery_urls = ARRAY['/images/vehicles/' || m.base_name || '.jpg'],
  image_placeholder_key = NULL
FROM image_map m
WHERE v.slug = m.slug
  AND v.is_archived = false;

WITH image_map(slug, base_name) AS (
  VALUES
    ('blr-audi-a4-tech', 'audi-a4-2024'),
    ('blr-hyundai-i20-nline', 'hyundai-i20-nline-2024'),
    ('blr-maruti-jimny-alpha', 'maruti-jimny-2024'),
    ('blr-skoda-slavia-style', 'skoda-slavia-2024'),
    ('blr-tata-nexon-ev-lr', 'tata-nexon-ev-2024'),
    ('blr-tata-nexon-fearless', 'tata-nexon-2024'),
    ('blr-toyota-fortuner-legender', 'toyota-fortuner-legender-2024'),
    ('chd-bmw-530i-msport', 'bmw-530i-msport-2023'),
    ('chd-mahindra-thar-4x4', 'mahindra-thar-2024'),
    ('chd-mahindra-xuv700-ax7l', 'mahindra-xuv700-2024'),
    ('chd-maruti-swift-zxi', 'maruti-swift-2024'),
    ('chd-tata-nexon-ev-lr', 'tata-nexon-ev-2024'),
    ('chd-toyota-hilux-4x4', 'toyota-hilux-2024'),
    ('che-honda-elevate-zx', 'honda-elevate-2024'),
    ('che-mahindra-thar-lx-4x4', 'mahindra-thar-2024'),
    ('che-maruti-fronx-turbo', 'maruti-fronx-2024'),
    ('che-merc-c220d', 'mercedes-c220d-2024'),
    ('che-tata-punch-ev', 'tata-punch-ev-2024'),
    ('che-toyota-innova-crysta', 'toyota-innova-crysta-2024'),
    ('del-bmw-330li-msport', 'bmw-330li-msport-2024'),
    ('del-byd-atto3-ext', 'byd-atto3-2024'),
    ('del-hyundai-creta-sxo', 'hyundai-creta-2024'),
    ('del-mahindra-thar-roxx-4x4', 'mahindra-thar-roxx-2025'),
    ('del-mahindra-xuv700-ax7l', 'mahindra-xuv700-2024'),
    ('del-maruti-swift-zxi', 'maruti-swift-2024'),
    ('del-vw-virtus-gt', 'volkswagen-virtus-2024'),
    ('hyd-bmw-x3-xdrive', 'bmw-x3-2024'),
    ('hyd-byd-seal-premium', 'byd-seal-2024'),
    ('hyd-hyundai-verna-sxo', 'hyundai-verna-2024'),
    ('hyd-kia-carens-luxury', 'kia-carens-2024'),
    ('hyd-mahindra-scorpio-n-4xplor', 'mahindra-scorpio-n-2024'),
    ('hyd-maruti-baleno-alpha', 'maruti-baleno-2024'),
    ('jai-audi-q3-sportback', 'audi-q3-sportback-2024'),
    ('jai-hyundai-creta-sxo', 'hyundai-creta-2024'),
    ('jai-mahindra-thar-4x4', 'mahindra-thar-2024'),
    ('jai-maruti-grand-vitara-awd', 'maruti-grand-vitara-2024'),
    ('jai-toyota-fortuner-4x4', 'toyota-fortuner-2024'),
    ('mum-honda-city-ehev', 'honda-city-ehev-2024'),
    ('mum-jeep-wrangler-rubicon', 'jeep-wrangler-rubicon-2024'),
    ('mum-kia-seltos-gtx', 'kia-seltos-2024'),
    ('mum-merc-e220d', 'mercedes-e220d-2024'),
    ('mum-mg-zs-ev', 'mg-zs-ev-2024'),
    ('mum-tata-altroz-xz', 'tata-altroz-2024'),
    ('mum-toyota-innova-hycross', 'toyota-innova-hycross-2024'),
    ('pun-honda-city-zx', 'honda-city-zx-2024'),
    ('pun-mahindra-thar-roxx-4x4', 'mahindra-thar-roxx-2025'),
    ('pun-skoda-kodiaq-lk', 'skoda-kodiaq-2024'),
    ('pun-tata-tiago-ev', 'tata-tiago-ev-2024'),
    ('pun-toyota-hilux-4x4', 'toyota-hilux-2024'),
    ('pun-vw-taigun-gt', 'volkswagen-taigun-2024')
)
UPDATE public.vehicle_images vi
SET
  image_url = '/images/vehicles/' || m.base_name || '.jpg',
  webp_url = '/images/vehicles/' || m.base_name || '.webp',
  sort_order = 0,
  angle = 'front',
  source_site = 'User Provided Collage',
  source_url = NULL,
  photographer = 'User Upload',
  license = 'User Provided Asset',
  license_url = NULL
FROM public.vehicles v
JOIN image_map m ON m.slug = v.slug
WHERE vi.vehicle_id = v.id
  AND v.is_archived = false
  AND vi.is_primary = true;

UPDATE public.vehicle_images vi
SET
  image_url = '',
  webp_url = NULL
FROM public.vehicles v
WHERE vi.vehicle_id = v.id
  AND v.is_archived = false
  AND vi.is_primary = false;
