import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
];

const FAST_FALLBACK_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.8-flash",
];

const SUPPORTED_CITIES: Record<string, string> = {
  "delhi-ncr": "Delhi NCR",
  mumbai: "Mumbai",
  bengaluru: "Bengaluru",
  hyderabad: "Hyderabad",
  chennai: "Chennai",
  pune: "Pune",
  "chandigarh-tricity": "Chandigarh Tricity",
  jaipur: "Jaipur",
};

const SUPPORTED_LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  hi: "Hindi (हिन्दी)",
  mr: "Marathi (मराठी)",
  kn: "Kannada (ಕನ್ನಡ)",
  pa: "Punjabi (ਪੰਜਾਬੀ)",
  bn: "Bengali (বাংলা)",
  te: "Telugu (తెలుగు)",
  ta: "Tamil (தமிழ்)",
};

const LIGHTWEIGHT_REPLIES: Record<
  string,
  { greeting: string; thanks: string; ack: string; bye: string; signInBookings: string; noWebSourcesNote: string }
> = {
  en: {
    greeting:
      "Hey! I’m WHEELMATE — your personal mobility assistant by SHAREWHEELS. How can I help you today?",
    thanks:
      "You’re welcome! Let me know anytime if you have another question or want to explore vehicles.",
    ack: "Got it! Feel free to ask anything else or let me know when you’d like to look up vehicles.",
    bye: "Take care! Reach out anytime you want to chat, plan a trip, or find your next ride.",
    signInBookings:
      "To view your personal bookings or trip status, please sign in to your SHAREWHEELS account first.",
    noWebSourcesNote:
      "Note: Live web search returned no verifiable web sources for this query, so very recent developments may not be reflected.",
  },
  hi: {
    greeting:
      "नमस्ते! मैं WHEELMATE हूँ — SHAREWHEELS द्वारा आपका व्यक्तिगत मोबिलिटी सहायक। आज मैं आपकी क्या मदद कर सकता हूँ?",
    thanks:
      "आपका स्वागत है! यदि आपका कोई और सवाल हो या आप वाहन देखना चाहते हों, तो कभी भी बताएं।",
    ack: "समझ गया! बेझिझक कुछ और पूछें या जब चाहें वाहन खोजने के लिए बताएं।",
    bye: "अपना ख्याल रखें! यात्रा प्लान करने या अगला वाहन खोजने के लिए कभी भी संपर्क करें।",
    signInBookings:
      "अपनी व्यक्तिगत बुकिंग या यात्रा की स्थिति देखने के लिए कृपया पहले अपने SHAREWHEELS खाते में साइन इन करें।",
    noWebSourcesNote:
      "नोट: इस प्रश्न के लिए लाइव वेब खोज से कोई सत्यापित स्रोत नहीं मिला, इसलिए हाल के बदलाव इसमें शामिल नहीं हो सकते हैं।",
  },
  mr: {
    greeting:
      "नमस्कार! मी WHEELMATE आहे — SHAREWHEELS तर्फे तुमचा वैयक्तिक मोबिलिटी सहाय्यक. आज मी तुम्हाला कशी मदत करू शकतो?",
    thanks:
      "स्वागत आहे! आणखी काही प्रश्न असल्यास किंवा वाहने पाहायची असल्यास कधीही सांगा.",
    ack: "ठीक आहे! आणखी काही विचारायचे असल्यास किंवा वाहने शोधायची असल्यास नक्की सांगा.",
    bye: "काळजी घ्या! सहलीचे नियोजन करण्यासाठी किंवा पुढील वाहन शोधण्यासाठी कधीही संपर्क साधा.",
    signInBookings:
      "तुमची वैयक्तिक बुकिंग किंवा प्रवासाची स्थिती पाहण्यासाठी कृपया आधी तुमच्या SHAREWHEELS खात्यात साइन इन करा.",
    noWebSourcesNote:
      "टीप: या प्रश्नासाठी लाइव्ह वेब शोधात कोणतेही सत्यापित स्रोत आढळले नाहीत, त्यामुळे अगदी अलीकडील घडामोडी समाविष्ट नसण्याची शक्यता आहे.",
  },
  kn: {
    greeting:
      "ನಮಸ್ಕಾರ! ನಾನು WHEELMATE — SHAREWHEELS ವತಿಯಿಂದ ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಮೊಬಿಲಿಟಿ ಸಹಾಯಕ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
    thanks:
      "ಧನ್ಯವಾದಗಳು! ನಿಮಗೆ ಇನ್ನಾವುದೇ ಪ್ರಶ್ನೆಯಿದ್ದರೆ ಅಥವಾ ವಾಹನಗಳನ್ನು ಹುಡುಕಬೇಕಿದ್ದರೆ ಯಾವಾಗ ಬೇಕಾದರೂ ತಿಳಿಸಿ.",
    ack: "ಸರಿ! ಇನ್ನೇನಾದರೂ ಕೇಳಲು ಅಥವಾ ವಾಹನಗಳನ್ನು ಹುಡುಕಲು ಬಯಸಿದರೆ ತಿಳಿಸಿ.",
    bye: "ಶುಭವಾಗಲಿ! ಪ್ರವಾಸ ಯೋಜಿಸಲು ಅಥವಾ ನಿಮ್ಮ ಮುಂದಿನ ವಾಹನವನ್ನು ಹುಡುಕಲು ಯಾವಾಗ ಬೇಕಾದರೂ ಸಂಪರ್ಕಿಸಿ.",
    signInBookings:
      "ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಬುಕಿಂಗ್ ಅಥವಾ ಪ್ರಯಾಣದ ಸ್ಥಿತಿಯನ್ನು ನೋಡಲು ದಯವಿಟ್ಟು ಮೊದಲು ನಿಮ್ಮ SHAREWHEELS ಖಾತೆಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ.",
    noWebSourcesNote:
      "ಗಮನಿಸಿ: ಈ ಪ್ರಶ್ನೆಗೆ ಲೈವ್ ವೆಬ್ ಹುಡುಕಾಟದಿಂದ ಯಾವುದೇ ದೃಢೀಕೃತ ಮೂಲಗಳು ಲಭ್ಯವಾಗಿಲ್ಲ, ಆದ್ದರಿಂದ ಇತ್ತೀಚಿನ ಬೆಳವಣಿಗೆಗಳು ಒಳಗೊಂಡಿರದಿರಬಹುದು.",
  },
  pa: {
    greeting:
      "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ WHEELMATE ਹਾਂ — SHAREWHEELS ਵੱਲੋਂ ਤੁਹਾਡਾ ਨਿੱਜੀ ਮੋਬਿਲਿਟੀ ਸਹਾਇਕ। ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?",
    thanks:
      "ਜੀ ਆਇਆਂ ਨੂੰ! ਜੇਕਰ ਤੁਹਾਡਾ ਕੋਈ ਹੋਰ ਸਵਾਲ ਹੋਵੇ ਜਾਂ ਤੁਸੀਂ ਵਾਹਨ ਵੇਖਣਾ ਚਾਹੋ ਤਾਂ ਕਦੇ ਵੀ ਦੱਸੋ।",
    ack: "ਠੀਕ ਹੈ! ਬੇਝਿਜਕ ਕੁਝ ਹੋਰ ਪੁੱਛੋ ਜਾਂ ਜਦੋਂ ਚਾਹੋ ਵਾਹਨ ਲੱਭਣ ਲਈ ਦੱਸੋ।",
    bye: "ਆਪਣਾ ਖਿਆਲ ਰੱਖੋ! ਯਾਤਰਾ ਪਲਾਨ ਕਰਨ ਜਾਂ ਅਗਲੀ ਗੱਡੀ ਲੱਭਣ ਲਈ ਕਦੇ ਵੀ ਸੰਪਰਕ ਕਰੋ।",
    signInBookings:
      "ਆਪਣੀਆਂ ਨਿੱਜੀ ਬੁਕਿੰਗਾਂ ਜਾਂ ਯਾਤਰਾ ਦੀ ਸਥਿਤੀ ਵੇਖਣ ਲਈ ਕਿਰਪਾ ਕਰਕੇ ਪਹਿਲਾਂ ਆਪਣੇ SHAREWHEELS ਖਾਤੇ ਵਿੱਚ ਸਾਈਨ ਇਨ ਕਰੋ।",
    noWebSourcesNote:
      "ਨੋਟ: ਇਸ ਸਵਾਲ ਲਈ ਲਾਈਵ ਵੈੱਬ ਖੋਜ ਤੋਂ ਕੋਈ ਪ੍ਰਮਾਣਿਤ ਸਰੋਤ ਨਹੀਂ ਮਿਲੇ, ਇਸ ਲਈ ਤਾਜ਼ਾ ਜਾਣਕਾਰੀ ਸ਼ਾਮਲ ਨਾ ਹੋਣ ਦੀ ਸੰਭਾਵਨਾ ਹੈ।",
  },
  bn: {
    greeting:
      "নমস্কার! আমি WHEELMATE — SHAREWHEELS-এর পক্ষ থেকে আপনার ব্যক্তিগত মোবিলিটি সহায়ক। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?",
    thanks:
      "স্বাগতম! আপনার আর কোনো প্রশ্ন থাকলে বা গাড়ি দেখতে চাইলে যেকোনো সময় জানান।",
    ack: "বুঝেছি! নির্দ্বিধায় অন্য কিছু জিজ্ঞাসা করুন বা গাড়ি খুঁজতে চাইলে জানান।",
    bye: "ভালো থাকবেন! ট্রিপ প্ল্যান করতে বা আপনার পরবর্তী গাড়ি খুঁজতে যেকোনো সময় যোগাযোগ করুন।",
    signInBookings:
      "আপনার ব্যক্তিগত বুকিং বা যাত্রার অবস্থা দেখতে অনুগ্রহ করে প্রথমে আপনার SHAREWHEELS অ্যাকাউন্টে সাইন ইন করুন।",
    noWebSourcesNote:
      "দ্রষ্টব্য: এই প্রশ্নের জন্য লাইভ ওয়েব অনুসন্ধানে কোনো যাচাইযোগ্য সূত্র পাওয়া যায়নি, তাই সাম্প্রতিক তথ্য প্রতিফলিত নাও হতে পারে।",
  },
  te: {
    greeting:
      "నమస్కారం! నేను WHEELMATE — SHAREWHEELS అందించే మీ వ్యక్తిగత మొబిలిటీ అసిస్టెంట్. ఈ రోజు నేను మీకు ఎలా సహాయం చేయగలను?",
    thanks:
      "ధన్యవాదాలు! మీకు మరో ప్రశ్న ఉన్నా లేదా వాహనాలను చూడాలనుకున్నా ఎప్పుడైనా చెప్పండి.",
    ack: "సరే! మరేదైనా అడగాలనుకున్నా లేదా వాహనాలను వెతకాలనుకున్నా నిరభ్యంతరంగా చెప్పండి.",
    bye: "జాగ్రత్త! ట్రిప్ ప్లాన్ చేయడానికి లేదా మీ తదుపరి వాహనాన్ని కనుగొనడానికి ఎప్పుడైనా సంప్రదించండి.",
    signInBookings:
      "మీ వ్యక్తిగత బుకింగ్‌లు లేదా ట్రిప్ స్థితిని చూడటానికి దయచేసి ముందుగా మీ SHAREWHEELS ఖాతాలో సైన్ ఇన్ చేయండి.",
    noWebSourcesNote:
      "గమనిక: ఈ ప్రశ్నకు లైవ్ వెబ్ శోధనలో ధృవీకరించదగిన వనరులు లభించలేదు, కాబట్టి అత్యంత ఇటీవలి వివరాలు ఉండకపోవచ్చు.",
  },
  ta: {
    greeting:
      "வணக்கம்! நான் WHEELMATE — SHAREWHEELS வழங்கும் உங்கள் தனிப்பட்ட மொபிலிட்டி உதவியாளர். இன்று நான் உங்களுக்கு எப்படி உதவலாம்?",
    thanks:
      "நல்வரவு! வேறு ஏதேனும் கேள்வி இருந்தாலோ அல்லது வாகனங்களைப் பார்க்க விரும்பினாலோ எப்போது வேண்டுமானாலும் கேளுங்கள்.",
    ack: "புரிந்தது! வேறு எதையும் தயங்காமல் கேளுங்கள் அல்லது வாகனங்களைத் தேட விரும்பினால் தெரிவியுங்கள்.",
    bye: "நன்றி, வணக்கம்! பயணம் திட்டமிடவோ அல்லது அடுத்த வாகனத்தைத் தேடவோ எப்போது வேண்டுமானாலும் தொடர்பு கொள்ளுங்கள்.",
    signInBookings:
      "உங்கள் தனிப்பட்ட முன்பதிவுகள் அல்லது பயண நிலையைப் பார்க்க முதலில் உங்கள் SHAREWHEELS கணக்கில் உள்நுழையவும்.",
    noWebSourcesNote:
      "குறிப்பு: இந்தக் கேள்விக்கு நேரடி இணையத் தேடலில் சரிபார்க்கக்கூடிய ஆதாரங்கள் கிடைக்கவில்லை, எனவே மிக சமீபத்திய தகவல்கள் இடம்பெறாமல் இருக்கலாம்.",
  },
};

const VALID_MODES = new Set(["general_ai", "vehicle_discovery", "sharewheels"]);
const VALID_CATEGORIES = new Set([
  "Hatchbacks",
  "Sedans",
  "Compact SUVs",
  "Full-Size SUVs",
  "Family MPVs",
  "Off-Road & Adventure",
  "Luxury Vehicles",
  "Electric Vehicles",
]);
const VALID_TRANSMISSIONS = new Set(["Automatic", "Manual", "Single-Speed"]);
const VALID_FUELS = new Set(["Petrol", "Diesel", "Electric", "Hybrid"]);
const VALID_DRIVETRAINS = new Set(["4x4", "4WD", "AWD", "FWD", "RWD"]);
const VALID_SORTS = new Set(["price_asc", "price_desc", "year_desc"]);

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface GroundingSource {
  title: string;
  url: string;
}

interface ValidatedFilters {
  intentSummary: string;
  requestedCitySlug: string | null;
  startDate: string | null;
  endDate: string | null;
  category: string | null;
  maxPricePerDay: number | null;
  minSeats: number | null;
  transmission: string | null;
  fuelType: string | null;
  drivetrain: string | null;
  offRoadOnly: boolean;
  sortBy: "price_asc" | "price_desc" | "year_desc";
  compareRequested: boolean;
}

interface TripPlanExtract {
  isRoadTripPlan: boolean;
  origin: string | null;
  destination: string | null;
  tripDays: number;
  passengers: number;
  maxTotalBudgetInr: number | null;
  wantsScenicStops: boolean;
}

interface RouterOutput {
  mode: "general_ai" | "vehicle_discovery" | "sharewheels";
  needsCurrentInfo: boolean;
  needsUserBookings: boolean;
  directReply: string | null;
  filters: ValidatedFilters;
  tripPlan: TripPlanExtract | null;
}

const KNOWN_HUB_COORDS: Record<string, { lat: number; lng: number }> = {
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  manali: { lat: 32.2432, lng: 77.1892 },
  shimla: { lat: 31.1048, lng: 77.1734 },
  delhi: { lat: 28.6139, lng: 77.209 },
  "new delhi": { lat: 28.6139, lng: 77.209 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  goa: { lat: 15.4909, lng: 73.8278 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  coorg: { lat: 12.4244, lng: 75.7382 },
  pune: { lat: 18.5204, lng: 73.8567 },
  mahabaleshwar: { lat: 17.9307, lng: 73.6477 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  hampi: { lat: 15.335, lng: 76.46 },
  rishikesh: { lat: 30.0869, lng: 78.2676 },
  amritsar: { lat: 31.634, lng: 74.8723 },
  chennai: { lat: 13.0827, lng: 80.2707 },
};

const REF_FUEL_BY_CITY: Record<string, { petrol: number; diesel: number; cng: number; ev: number }> = {
  "chandigarh-tricity": { petrol: 94.3, diesel: 82.45, cng: 84.0, ev: 14 },
  "delhi-ncr": { petrol: 94.77, diesel: 87.67, cng: 75.09, ev: 14 },
  mumbai: { petrol: 103.5, diesel: 90.03, cng: 77.0, ev: 16 },
  bengaluru: { petrol: 102.92, diesel: 90.99, cng: 82.0, ev: 15 },
  hyderabad: { petrol: 107.46, diesel: 95.7, cng: 92.0, ev: 15 },
  chennai: { petrol: 100.8, diesel: 92.39, cng: 85.0, ev: 15 },
  pune: { petrol: 104.22, diesel: 90.75, cng: 87.9, ev: 16 },
  jaipur: { petrol: 104.72, diesel: 90.21, cng: 91.5, ev: 15 },
};

function haversineKmServer(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function findHubCoord(name: string) {
  const clean = name.toLowerCase();
  for (const [k, pt] of Object.entries(KNOWN_HUB_COORDS)) {
    if (clean.includes(k)) return pt;
  }
  return null;
}

async function computeValidatedRouteForAi(
  originName: string,
  destinationName: string,
  mapsApiKey: string
): Promise<{
  distanceKm: number;
  durationMinutes: number;
  tollInr: number | null;
  distanceSource: string;
}> {
  if (mapsApiKey) {
    try {
      const rzp = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": mapsApiKey,
          "X-Goog-FieldMask":
            "routes.duration,routes.distanceMeters,routes.travelAdvisory.tollInfo",
        },
        body: JSON.stringify({
          origin: { address: `${originName}, India` },
          destination: { address: `${destinationName}, India` },
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_AWARE",
          extraComputations: ["TOLLS"],
          units: "METRIC",
        }),
        signal: AbortSignal.timeout(7000),
      });
      if (rzp.ok) {
        const data = await rzp.json();
        const r = data?.routes?.[0];
        if (r?.distanceMeters) {
          const distKm = Number((Number(r.distanceMeters) / 1000).toFixed(1));
          const secMatch = String(r.duration ?? "").match(/^([\d.]+)s$/);
          const mins = secMatch ? Math.max(1, Math.round(Number(secMatch[1]) / 60)) : Math.round((distKm / 55) * 60);
          const prices = r.travelAdvisory?.tollInfo?.estimatedPrice;
          const inrEntry = Array.isArray(prices)
            ? prices.find((p: any) => p?.currencyCode === "INR")
            : null;
          const tollInr = inrEntry
            ? Math.round(Number(inrEntry.units ?? 0) + Number(inrEntry.nanos ?? 0) / 1e9)
            : null;
          return {
            distanceKm: distKm,
            durationMinutes: mins,
            tollInr: tollInr && tollInr > 0 ? tollInr : null,
            distanceSource: "Google Routes API (live calculation)",
          };
        }
      }
    } catch {
      // Fall back transparently below
    }
  }

  const cA = findHubCoord(originName);
  const cB = findHubCoord(destinationName);
  if (cA && cB) {
    const distKm = Number((haversineKmServer(cA, cB) * 1.24).toFixed(1));
    return {
      distanceKm: distKm,
      durationMinutes: Math.max(30, Math.round((distKm / 52) * 60)),
      tollInr: null,
      distanceSource: "Coordinate corridor estimate (configure GOOGLE_MAPS_SERVER_API_KEY for live Google Routes)",
    };
  }

  return {
    distanceKm: 250,
    durationMinutes: 270,
    tollInr: null,
    distanceSource: "Default corridor estimate (live route lookup requires GOOGLE_MAPS_SERVER_API_KEY)",
  };
}

const VERIFIED_PLATFORM_FACTS = `Verified SHAREWHEELS facts (use ONLY these facts; NEVER invent policies, fees, insurance amounts, or unverified features):
- Identity: WHEELMATE — Your personal mobility assistant by SHAREWHEELS.
- Platform: SHAREWHEELS is an India-wide peer-to-peer vehicle rental marketplace spanning 8 supported cities: Delhi NCR, Mumbai, Bengaluru, Hyderabad, Chennai, Pune, Chandigarh Tricity, and Jaipur.
- Discovery & Booking Flow: Customers browse verified cars by city, compare models side-by-side, choose trip dates (with real-time overlap checks and automatic expiry on stale pending requests), review clear daily rates and refundable security deposits listed per vehicle, verify their driving licence, and complete a quick pickup inspection.
- Vehicle Passport (/passport): Documents each vehicle's verified service logs, insurance status, and prior inspection records upfront before booking.
- SHIELD & Trust & Safety (/trust-and-safety): Protects both drivers and owners through verified driver and owner identity & driving licence verification, structured pre-trip and return photo inspection checklists at key handover and return, and refundable security deposits.
  - Portfolio & RouteCraft (/route-planner, /journeys, /trip-budget, /fuel-calculator): Allows customers to map routes via Google Maps, compare fuel/EV costs, estimate tolls & total trip expenses, split costs per passenger, and save journeys.
  - Architecture Scope: Customer-facing marketplace, Owner Portal, and Admin Portal are active.`;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isValidIsoDate(val: unknown): val is string {
  return typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val);
}

function getLightweightReply(rawText: string): string | null {
  if (rawText.length > 48) return null;
  const cleaned = rawText
    .trim()
    .toLowerCase()
    .replace(/[!.,?~]+$/g, "")
    .replace(/\s+(wheelmate|there)$/i, "")
    .trim();

  if (
    /^(hi+|hey+|hello+|namaste|yo|sup|hola|howdy)$/.test(cleaned) ||
    /^good\s+(morning|afternoon|evening)$/.test(cleaned)
  ) {
    if (cleaned.startsWith("good ")) {
      const timeWord = cleaned.replace("good ", "");
      return `Good ${timeWord}! I’m WHEELMATE — your personal mobility assistant by SHAREWHEELS. How can I help you today?`;
    }
    return "Hey! I’m WHEELMATE — your personal mobility assistant by SHAREWHEELS. How can I help you today?";
  }

  if (
    /^(thanks|thank\s+you|thx|ty|cheers|thanks\s+a\s+lot|thank\s+you\s+so\s+much)$/.test(
      cleaned
    )
  ) {
    return "You’re welcome! Let me know anytime if you have another question or want to explore vehicles.";
  }

  if (
    /^(ok|okay|k|kk|cool|nice|great|got\s+it|alright|all\s+good|sounds\s+good|awesome|sure|perfect|noted)$/.test(
      cleaned
    )
  ) {
    return "Got it! Feel free to ask anything else or let me know when you’d like to look up vehicles.";
  }

  if (/^(bye|goodbye|see\s+you|see\s+ya|cya|take\s+care)$/.test(cleaned)) {
    return "Take care! Reach out anytime you want to chat, plan a trip, or find your next ride.";
  }

  return null;
}

function validateFilters(raw: Record<string, unknown> | null | undefined): ValidatedFilters {
  const safe = raw && typeof raw === "object" ? raw : {};
  const maxPrice =
    typeof safe.maxPricePerDay === "number" && Number.isFinite(safe.maxPricePerDay)
      ? Math.min(Math.max(Math.round(safe.maxPricePerDay), 500), 100000)
      : null;

  const minSeats =
    typeof safe.minSeats === "number" && Number.isFinite(safe.minSeats)
      ? Math.min(Math.max(Math.round(safe.minSeats), 1), 12)
      : null;

  const startDate = isValidIsoDate(safe.startDate) ? safe.startDate : null;
  const endDate =
    isValidIsoDate(safe.endDate) && (!startDate || safe.endDate >= startDate)
      ? safe.endDate
      : null;

  const rawCity =
    typeof safe.requestedCitySlug === "string"
      ? safe.requestedCitySlug.trim().toLowerCase()
      : null;

  return {
    intentSummary:
      typeof safe.intentSummary === "string" ? safe.intentSummary.slice(0, 160) : "",
    requestedCitySlug: rawCity && SUPPORTED_CITIES[rawCity] ? rawCity : null,
    startDate,
    endDate,
    category:
      typeof safe.category === "string" && VALID_CATEGORIES.has(safe.category)
        ? safe.category
        : null,
    maxPricePerDay: maxPrice,
    minSeats,
    transmission:
      typeof safe.transmission === "string" &&
      VALID_TRANSMISSIONS.has(safe.transmission)
        ? safe.transmission
        : null,
    fuelType:
      typeof safe.fuelType === "string" && VALID_FUELS.has(safe.fuelType)
        ? safe.fuelType
        : null,
    drivetrain:
      typeof safe.drivetrain === "string" && VALID_DRIVETRAINS.has(safe.drivetrain)
        ? safe.drivetrain
        : null,
    offRoadOnly: Boolean(safe.offRoadOnly),
    sortBy:
      typeof safe.sortBy === "string" && VALID_SORTS.has(safe.sortBy)
        ? (safe.sortBy as ValidatedFilters["sortBy"])
        : "price_asc",
    compareRequested: Boolean(safe.compareRequested),
  };
}

async function invokeGemini(
  apiKey: string,
  prompt: string,
  options: {
    jsonMode?: boolean;
    useSearch?: boolean;
    maxOutputTokens?: number;
    temperature?: number;
    models?: string[];
  } = {}
) {
  const {
    jsonMode = false,
    useSearch = false,
    maxOutputTokens = 2048,
    temperature = 0.2,
    models = GEMINI_MODELS,
  } = options;
  let lastError = "GEMINI_UNAVAILABLE";

  for (const model of models) {
    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload: Record<string, unknown> = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens,
        ...(jsonMode && !useSearch ? { responseMimeType: "application/json" } : {}),
      },
    };

    if (useSearch) {
      payload.tools = [{ google_search: {} }];
    }

    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(14000),
      });
    } catch (fetchErr) {
      lastError =
        fetchErr instanceof Error && fetchErr.name === "TimeoutError"
          ? "GEMINI_HTTP_504: Request timed out"
          : `GEMINI_NETWORK: ${fetchErr instanceof Error ? fetchErr.message : "Fetch error"}`;
      continue;
    }

    if (res.status === 404 || res.status === 429 || res.status === 503) {
      const errText = await res.text();
      lastError = `GEMINI_HTTP_${res.status}: ${errText.slice(0, 260)}`;
      continue;
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`GEMINI_HTTP_${res.status}: ${errText.slice(0, 300)}`);
    }

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const text = parts
      .map((p: { text?: string }) => (typeof p?.text === "string" ? p.text : ""))
      .join("")
      .trim();

    if (!text) {
      lastError = "GEMINI_EMPTY_RESPONSE";
      continue;
    }

    const rawChunks = data?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const seenUrls = new Set<string>();
    const sources: GroundingSource[] = [];
    for (const chunk of rawChunks) {
      const url = chunk?.web?.uri;
      if (typeof url === "string" && /^https?:\/\//i.test(url) && !seenUrls.has(url)) {
        seenUrls.add(url);
        sources.push({
          title:
            typeof chunk?.web?.title === "string" && chunk.web.title.trim()
              ? chunk.web.title.trim()
              : url,
          url,
        });
        if (sources.length >= 4) break;
      }
    }

    const webQueries =
      data?.candidates?.[0]?.groundingMetadata?.webSearchQueries ?? [];
    const usedWebSearch =
      useSearch && (sources.length > 0 || (Array.isArray(webQueries) && webQueries.length > 0));

    const usage = data?.usageMetadata ?? {};
    return {
      text,
      promptTokens: Number(usage.promptTokenCount ?? 0),
      completionTokens: Number(usage.candidatesTokenCount ?? 0),
      model,
      usedWebSearch,
      sources,
    };
  }

  throw new Error(lastError);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as {
      messages?: ChatMessage[];
      sessionId?: string | null;
      selectedCitySlug?: string | null;
    };

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return jsonResponse(
        { error: "BAD_REQUEST", message: "messages array is required." },
        400
      );
    }

    const activeCitySlug =
      body.selectedCitySlug && SUPPORTED_CITIES[body.selectedCitySlug]
        ? body.selectedCitySlug
        : null;

    const sanitizedMessages = body.messages
      .slice(-10)
      .filter(
        (m): m is ChatMessage =>
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim().length > 0
      )
      .map((m) => ({
        role: m.role,
        content: m.content.trim().slice(0, 800),
      }));

    if (sanitizedMessages.length === 0) {
      return jsonResponse(
        { error: "BAD_REQUEST", message: "Valid user message content is required." },
        400
      );
    }

    const latestUserMessage =
      [...sanitizedMessages].reverse().find((m) => m.role === "user")?.content ?? "";

    // Fast-path: lightweight greetings & acknowledgements without external API or Supabase queries.
    const quickReply = getLightweightReply(latestUserMessage);
    if (quickReply) {
      return jsonResponse({
        reply: quickReply,
        model: "lightweight",
        mode: "greeting",
        citySlug: activeCitySlug,
        cityName: activeCitySlug ? SUPPORTED_CITIES[activeCitySlug] : null,
        suggestedCitySwitch: null,
        vehicles: [],
        usedWebSearch: false,
        sources: [],
        grounded: false,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!supabaseUrl || !(serviceKey || anonKey)) {
      return jsonResponse(
        { error: "SUPABASE_ENV_MISSING", message: "Supabase environment missing." },
        500
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey || anonKey);

    let userId: string | null = null;
    const authHeader = req.headers.get("authorization") ?? "";
    const bearerToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";
    if (
      bearerToken &&
      bearerToken !== anonKey &&
      !bearerToken.startsWith("sb_publishable_")
    ) {
      const { data: userRes } = await supabase.auth.getUser(bearerToken);
      if (userRes?.user?.id) {
        userId = userRes.user.id;
      }
    }

    const ipHeader =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "public-client";
    const clientKey = userId ? `user:${userId}` : `ip:${ipHeader}`;

    const logUsage = async (
      status: string,
      model = GEMINI_MODELS[0],
      promptTokens = 0,
      completionTokens = 0,
      errorCode?: string
    ) => {
      await supabase.from("ai_usage_logs").insert({
        user_id: userId,
        client_key: clientKey,
        function_name: "ai-mobility-assistant",
        model,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        status,
        error_code: errorCode ?? null,
      });
    };

    try {
      const geminiKey = Deno.env.get("GEMINI_API_KEY");
      if (!geminiKey || geminiKey.trim() === "") {
        await logUsage("error", GEMINI_MODELS[0], 0, 0, "GEMINI_API_KEY_NOT_CONFIGURED");
        return jsonResponse(
          {
            error: "GEMINI_API_KEY_NOT_CONFIGURED",
            message:
              "GEMINI_API_KEY is not configured in Supabase Edge Function Secrets.",
          },
          503
        );
      }

      const windowStart = new Date(Date.now() - 10 * 60_000).toISOString();
      const limitMax = userId ? 40 : 15;
      const { count: recentCount } = await supabase
        .from("ai_usage_logs")
        .select("id", { count: "exact", head: true })
        .eq("client_key", clientKey)
        .gte("created_at", windowStart);

      if ((recentCount ?? 0) >= limitMax) {
        await logUsage("rate_limited", GEMINI_MODELS[0], 0, 0, "RATE_LIMITED");
        return jsonResponse(
          {
            error: "RATE_LIMITED",
            message: `Rate limit reached (${limitMax} AI requests per 10 minutes). Please retry shortly.`,
          },
          429
        );
      }

      const conversationText = sanitizedMessages
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n");

      const todayIso = new Date().toISOString().slice(0, 10);
      const routerPrompt = `You are WHEELMATE — Your personal mobility assistant by SHAREWHEELS.
Today's date is ${todayIso}.
Currently selected user city: ${activeCitySlug ? SUPPORTED_CITIES[activeCitySlug] : "None selected"}.
User authentication status: ${userId ? "Signed in" : "Guest (not signed in)"}.
Supported SHAREWHEELS city slugs:
- "delhi-ncr" (Delhi, New Delhi, Gurugram, Noida, NCR)
- "mumbai" (Mumbai, Bandra, Andheri, Powai, SoBo, Thane)
- "bengaluru" (Bengaluru, Bangalore, Whitefield, Indiranagar, Koramangala)
- "hyderabad" (Hyderabad, HITEC City, Jubilee Hills, Gachibowli)
- "chennai" (Chennai, Adyar, OMR)
- "pune" (Pune, Koregaon Park, Baner, Hinjewadi)
- "chandigarh-tricity" (Chandigarh, Panchkula, Mohali, Tricity)
- "jaipur" (Jaipur)

${VERIFIED_PLATFORM_FACTS}

Your job is to classify the LATEST user request cleanly into one of three modes, preserve multi-turn conversational context, and respond directly when appropriate.

Modes:
1. "general_ai": General world knowledge, geography, history, science & technology, sports, travel & tourism itineraries, education, general automotive concepts & comparisons (e.g., "difference between petrol and hybrid cars", "are electric vehicles better than petrol cars?"), and everyday conversation.
   - Do NOT force the conversation back toward car rentals when answering a general question.
   - Retain a friendly, intelligent, natural personality. If asked who you are, identify as "WHEELMATE — Your personal mobility assistant by SHAREWHEELS."
   - Set "needsCurrentInfo": true ONLY when the question relies on live, recent, or evolving facts after early 2025 (e.g., recent sports tournament results like "Who won the last FIFA World Cup?", latest car launches, live news, recent travel advisories, recent tech releases). Leave "directReply": null when "needsCurrentInfo" is true.
   - When "needsCurrentInfo": false, write a complete, helpful "directReply" directly (2-4 clear sentences for straightforward questions; a concise, readable itinerary or structured breakdown for multi-part requests like trip plans). Set "filters": null.
2. "sharewheels": Questions about SHAREWHEELS itself — how booking works, Vehicle Passport, SHIELD / Trust & Safety, verification, deposits, supported cities, or checking the user's own bookings.
   - Set "needsUserBookings": true and "directReply": null ONLY if the user asks about THEIR OWN personal bookings, trips, or reservation status.
   - Otherwise write an accurate "directReply" grounded strictly in the Verified SHAREWHEELS facts above (if exact fees or policies are not in those facts, state honestly that specific per-vehicle pricing and terms are shown on each listing without inventing details). Set "filters": null.
3. "vehicle_discovery": Searching, recommending, filtering, checking rental availability, comparing actual vehicles, OR planning a road trip from an origin to destination (e.g. "Plan a four-day trip from Chandigarh to Manali for four people. My budget is ₹20,000. I want an SUV.") — INCLUDING contextual follow-ups!
   - When the user asks to plan a road trip with travel details (origin, destination, days, passengers, budget, or follow-ups like "find something cheaper", "compare Thar and Creta", "find an EV", "make it 5 passengers"), choose "vehicle_discovery", set requestedCitySlug to the origin city slug if supported, and populate "tripPlan".
   - Example context switch: If earlier turns discussed electric vehicles and the latest turn asks "Find me one in Mumbai", you MUST choose mode "vehicle_discovery", carry over fuelType: "Electric" (leaving category null unless specified), set requestedCitySlug: "mumbai", and leave "directReply": null!
   - Populate "filters" accurately across follow-up turns ("cheaper", "only automatic", "seven seats", "4x4", "compare two"). If the user simply asks for "an SUV", leave "category": null and set intentSummary="SUV" so Compact SUVs, Full-Size SUVs, Off-Road SUVs, and EVs are all evaluated.

Return ONLY valid JSON matching this schema:
{
  "mode": "general_ai" | "vehicle_discovery" | "sharewheels",
  "needsCurrentInfo": boolean,
  "needsUserBookings": boolean,
  "directReply": string | null,
  "tripPlan": {
    "isRoadTripPlan": boolean,
    "origin": string | null,
    "destination": string | null,
    "tripDays": number | null,
    "passengers": number | null,
    "maxTotalBudgetInr": number | null,
    "wantsScenicStops": boolean
  } | null,
  "filters": {
    "intentSummary": string,
    "requestedCitySlug": "delhi-ncr" | "mumbai" | "bengaluru" | "hyderabad" | "chennai" | "pune" | "chandigarh-tricity" | "jaipur" | null,
    "startDate": "YYYY-MM-DD" | null,
    "endDate": "YYYY-MM-DD" | null,
    "category": "Hatchbacks" | "Sedans" | "Compact SUVs" | "Full-Size SUVs" | "Family MPVs" | "Off-Road & Adventure" | "Luxury Vehicles" | "Electric Vehicles" | null,
    "maxPricePerDay": number | null,
    "minSeats": number | null,
    "transmission": "Automatic" | "Manual" | "Single-Speed" | null,
    "fuelType": "Petrol" | "Diesel" | "Electric" | "Hybrid" | null,
    "drivetrain": "4x4" | "4WD" | "AWD" | "FWD" | "RWD" | null,
    "offRoadOnly": boolean,
    "sortBy": "price_asc" | "price_desc" | "year_desc",
    "compareRequested": boolean
  } | null
}

Conversation:
${conversationText}`;

      const pass1 = await invokeGemini(geminiKey, routerPrompt, {
        jsonMode: true,
        maxOutputTokens: 2048,
        temperature: 0.25,
      });

      let parsedRaw: Record<string, unknown> = {};
      try {
        const cleaned = pass1.text
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```$/i, "")
          .trim();
        const parsed = JSON.parse(cleaned);
        parsedRaw = Array.isArray(parsed) ? (parsed[0] ?? {}) : parsed;
      } catch {
        parsedRaw = {};
      }

      const mode =
        typeof parsedRaw.mode === "string" && VALID_MODES.has(parsedRaw.mode)
          ? (parsedRaw.mode as RouterOutput["mode"])
          : "vehicle_discovery";

      const rawTrip = parsedRaw.tripPlan as Record<string, unknown> | null | undefined;
      const tripPlan: TripPlanExtract | null =
        rawTrip &&
        typeof rawTrip === "object" &&
        rawTrip.isRoadTripPlan &&
        typeof rawTrip.origin === "string" &&
        typeof rawTrip.destination === "string"
          ? {
              isRoadTripPlan: true,
              origin: rawTrip.origin.trim(),
              destination: rawTrip.destination.trim(),
              tripDays:
                typeof rawTrip.tripDays === "number" && Number.isFinite(rawTrip.tripDays)
                  ? Math.min(30, Math.max(1, Math.round(rawTrip.tripDays)))
                  : 3,
              passengers:
                typeof rawTrip.passengers === "number" && Number.isFinite(rawTrip.passengers)
                  ? Math.min(12, Math.max(1, Math.round(rawTrip.passengers)))
                  : 4,
              maxTotalBudgetInr:
                typeof rawTrip.maxTotalBudgetInr === "number" && Number.isFinite(rawTrip.maxTotalBudgetInr)
                  ? Math.round(rawTrip.maxTotalBudgetInr)
                  : null,
              wantsScenicStops: Boolean(rawTrip.wantsScenicStops),
            }
          : null;

      const route: RouterOutput = {
        mode,
        needsCurrentInfo: Boolean(parsedRaw.needsCurrentInfo),
        needsUserBookings: Boolean(parsedRaw.needsUserBookings),
        directReply:
          typeof parsedRaw.directReply === "string" && parsedRaw.directReply.trim()
            ? parsedRaw.directReply.trim()
            : null,
        filters: validateFilters(
          (parsedRaw.filters as Record<string, unknown> | null) ?? parsedRaw
        ),
        tripPlan,
      };

      // BRANCH A: GENERAL AI MODE (Zero Supabase vehicle queries)
      if (route.mode === "general_ai") {
        if (!route.needsCurrentInfo && route.directReply) {
          await logUsage(
            "success",
            pass1.model,
            pass1.promptTokens,
            pass1.completionTokens
          );
          return jsonResponse({
            reply: route.directReply,
            model: pass1.model,
            mode: "general_ai",
            citySlug: activeCitySlug,
            cityName: activeCitySlug ? SUPPORTED_CITIES[activeCitySlug] : null,
            suggestedCitySwitch: null,
            vehicles: [],
            usedWebSearch: false,
            sources: [],
            grounded: false,
          });
        }

        const generalPrompt = `You are WHEELMATE — Your personal mobility assistant by SHAREWHEELS.
Today's date is ${todayIso}.
Conversation:
${conversationText}

Answer the latest user question naturally, accurately, and concisely (do not redirect the user back to car rentals unless they asked). ${
          route.needsCurrentInfo
            ? "Use live Google Search grounding to verify recent facts, scores, launches, or current events. Do not guess uncertain live facts."
            : ""
        }`;

        if (route.needsCurrentInfo) {
          try {
            const searchRes = await invokeGemini(geminiKey, generalPrompt, {
              useSearch: true,
              maxOutputTokens: 2048,
              temperature: 0.3,
            });
            let replyText = searchRes.text;
            if (!searchRes.usedWebSearch) {
              replyText +=
                "\n\nNote: Live web search returned no verifiable web sources for this query, so very recent developments may not be reflected.";
            }
            await logUsage(
              "success",
              searchRes.model,
              pass1.promptTokens + searchRes.promptTokens,
              pass1.completionTokens + searchRes.completionTokens
            );
            return jsonResponse({
              reply: replyText,
              model: searchRes.model,
              mode: "general_ai",
              citySlug: activeCitySlug,
              cityName: activeCitySlug ? SUPPORTED_CITIES[activeCitySlug] : null,
              suggestedCitySwitch: null,
              vehicles: [],
              usedWebSearch: searchRes.usedWebSearch,
              sources: searchRes.sources,
              grounded: searchRes.usedWebSearch,
            });
          } catch {
            // Fall back transparently without search tools and inform the user of the limitation.
            const fallbackPrompt = `You are WHEELMATE — Your personal mobility assistant by SHAREWHEELS.
Today's date is ${todayIso}.
Conversation:
${conversationText}

Live web search is currently unavailable for your system. Answer helpfully using what you know up to your training cutoff, NEVER pretend post-cutoff live facts are guaranteed current, and include one clear sentence noting that live web search is currently unavailable so very recent developments may not be reflected.`;
            const fallbackRes = await invokeGemini(geminiKey, fallbackPrompt, {
              maxOutputTokens: 2048,
              temperature: 0.3,
              models: FAST_FALLBACK_MODELS,
            });
            await logUsage(
              "success",
              fallbackRes.model,
              pass1.promptTokens + fallbackRes.promptTokens,
              pass1.completionTokens + fallbackRes.completionTokens
            );
            return jsonResponse({
              reply: fallbackRes.text,
              model: fallbackRes.model,
              mode: "general_ai",
              citySlug: activeCitySlug,
              cityName: activeCitySlug ? SUPPORTED_CITIES[activeCitySlug] : null,
              suggestedCitySwitch: null,
              vehicles: [],
              usedWebSearch: false,
              sources: [],
              grounded: false,
            });
          }
        }

        const directGen = await invokeGemini(geminiKey, generalPrompt, {
          maxOutputTokens: 2048,
          temperature: 0.4,
        });
        await logUsage(
          "success",
          directGen.model,
          pass1.promptTokens + directGen.promptTokens,
          pass1.completionTokens + directGen.completionTokens
        );
        return jsonResponse({
          reply: directGen.text,
          model: directGen.model,
          mode: "general_ai",
          citySlug: activeCitySlug,
          cityName: activeCitySlug ? SUPPORTED_CITIES[activeCitySlug] : null,
          suggestedCitySwitch: null,
          vehicles: [],
          usedWebSearch: false,
          sources: [],
          grounded: false,
        });
      }

      // BRANCH B: SHAREWHEELS PLATFORM MODE
      if (route.mode === "sharewheels") {
        if (route.needsUserBookings) {
          if (!userId) {
            await logUsage(
              "success",
              pass1.model,
              pass1.promptTokens,
              pass1.completionTokens
            );
            return jsonResponse({
              reply:
                "To view your personal bookings or trip status, please sign in to your SHAREWHEELS account first.",
              model: pass1.model,
              mode: "sharewheels",
              citySlug: activeCitySlug,
              cityName: activeCitySlug ? SUPPORTED_CITIES[activeCitySlug] : null,
              suggestedCitySwitch: null,
              vehicles: [],
              usedWebSearch: false,
              sources: [],
              grounded: true,
            });
          }

          const { data: userBookings, error: bookingErr } = await supabase
            .from("bookings")
            .select(
              "id, status, start_at, end_at, rental_total_paise, deposit_paise, payment_status, expires_at, created_at, vehicles(slug, name, location)"
            )
            .eq("customer_id", userId)
            .order("created_at", { ascending: false })
            .limit(5);

          if (bookingErr) {
            await logUsage(
              "error",
              pass1.model,
              pass1.promptTokens,
              pass1.completionTokens,
              "BOOKINGS_QUERY_FAILED"
            );
            return jsonResponse(
              { error: "BOOKINGS_QUERY_FAILED", message: bookingErr.message },
              500
            );
          }

          const bookingsSummary = (userBookings ?? []).map((b: any) => ({
            vehicle: b.vehicles?.name ?? "Vehicle",
            location: b.vehicles?.location ?? "",
            status: b.status,
            paymentStatus: b.payment_status,
            startAt: b.start_at,
            endAt: b.end_at,
            rentalTotalINR: Math.round(Number(b.rental_total_paise) / 100),
          }));

          const bookingReplyPrompt = `You are WHEELMATE — Your personal mobility assistant by SHAREWHEELS.
Latest user message: "${latestUserMessage}"
Authenticated customer's recent bookings (NEVER invent any other bookings or details):
${JSON.stringify(bookingsSummary, null, 2)}

Write a clear, helpful 2-4 sentence summary of their bookings, or if the list is empty, let them know they currently have no bookings yet.`;

          const bookingReply = await invokeGemini(geminiKey, bookingReplyPrompt, {
            maxOutputTokens: 1024,
            temperature: 0.2,
          });
          await logUsage(
            "success",
            bookingReply.model,
            pass1.promptTokens + bookingReply.promptTokens,
            pass1.completionTokens + bookingReply.completionTokens
          );
          return jsonResponse({
            reply: bookingReply.text,
            model: bookingReply.model,
            mode: "sharewheels",
            citySlug: activeCitySlug,
            cityName: activeCitySlug ? SUPPORTED_CITIES[activeCitySlug] : null,
            suggestedCitySwitch: null,
            vehicles: [],
            usedWebSearch: false,
            sources: [],
            grounded: true,
          });
        }

        if (route.directReply) {
          await logUsage(
            "success",
            pass1.model,
            pass1.promptTokens,
            pass1.completionTokens
          );
          return jsonResponse({
            reply: route.directReply,
            model: pass1.model,
            mode: "sharewheels",
            citySlug: activeCitySlug,
            cityName: activeCitySlug ? SUPPORTED_CITIES[activeCitySlug] : null,
            suggestedCitySwitch: null,
            vehicles: [],
            usedWebSearch: false,
            sources: [],
            grounded: true,
          });
        }

        const platformPrompt = `You are WHEELMATE — Your personal mobility assistant by SHAREWHEELS.
${VERIFIED_PLATFORM_FACTS}
Conversation:
${conversationText}

Answer concisely using ONLY verified SHAREWHEELS information above. Never invent features, fee percentages, or unverified policies.`;
        const platformRes = await invokeGemini(geminiKey, platformPrompt, {
          maxOutputTokens: 1536,
          temperature: 0.2,
        });
        await logUsage(
          "success",
          platformRes.model,
          pass1.promptTokens + platformRes.promptTokens,
          pass1.completionTokens + platformRes.completionTokens
        );
        return jsonResponse({
          reply: platformRes.text,
          model: platformRes.model,
          mode: "sharewheels",
          citySlug: activeCitySlug,
          cityName: activeCitySlug ? SUPPORTED_CITIES[activeCitySlug] : null,
          suggestedCitySwitch: null,
          vehicles: [],
          usedWebSearch: false,
          sources: [],
          grounded: true,
        });
      }

      // BRANCH C: VEHICLE DISCOVERY MODE (Grounded Supabase Inventory Search)
      const filters = route.filters;
      const targetCitySlug =
        filters.requestedCitySlug || activeCitySlug || "chandigarh-tricity";
      const suggestedCitySwitch =
        filters.requestedCitySlug && filters.requestedCitySlug !== activeCitySlug
          ? {
              slug: filters.requestedCitySlug,
              name: SUPPORTED_CITIES[filters.requestedCitySlug],
            }
          : null;

      await supabase.rpc("expire_stale_pending_bookings");

      const unavailableVehicleIds = new Set<string>();
      if (filters.startDate && filters.endDate) {
        const startIso = `${filters.startDate}T00:00:00Z`;
        const endIso = `${filters.endDate}T23:59:59Z`;
        const { data: overlapping } = await supabase
          .from("bookings")
          .select("vehicle_id, status, expires_at")
          .lte("start_at", endIso)
          .gte("end_at", startIso)
          .in("status", ["pending", "accepted", "confirmed", "active"]);

        const nowMs = Date.now();
        for (const b of overlapping ?? []) {
          if (b.status !== "pending" || new Date(b.expires_at).getTime() > nowMs) {
            unavailableVehicleIds.add(b.vehicle_id);
          }
        }
      }

      const { data: rows, error: dbError } = await supabase
        .from("vehicles")
        .select(`
          id, slug, city_slug, name, brand, model, variant, year, location,
          price_per_day_paise, security_deposit_paise,
          transmission, fuel_type, seats, drivetrain, mileage_or_range,
          available, verification_status, image_url, is_demo,
          vehicle_categories!inner(name, slug),
          vehicle_offroad_specs(sub_category, drivetrain, ground_clearance_mm, tyre_type)
        `)
        .eq("is_archived", false)
        .eq("available", true)
        .eq("is_paused", false)
        .eq("listing_status", "APPROVED")
        .eq("city_slug", targetCitySlug);

      if (dbError) {
        await logUsage(
          "error",
          pass1.model,
          pass1.promptTokens,
          pass1.completionTokens,
          "DB_QUERY_FAILED"
        );
        return jsonResponse(
          { error: "DB_QUERY_FAILED", message: dbError.message },
          500
        );
      }

      const wantsSuvBroad =
        !filters.category &&
        /\bsuv\b/i.test(`${filters.intentSummary} ${latestUserMessage}`);

      let matched = (rows ?? []).filter((v: any) => {
        if (unavailableVehicleIds.has(v.id)) return false;

        const catName = v.vehicle_categories?.name ?? "";
        if (filters.category) {
          if (
            filters.drivetrain &&
            (filters.drivetrain === "4x4" || filters.drivetrain === "4WD")
          ) {
            if (
              catName !== filters.category &&
              catName !== "Off-Road & Adventure" &&
              catName !== "Full-Size SUVs"
            ) {
              return false;
            }
          } else if (filters.fuelType === "Electric" && filters.category === "Electric Vehicles") {
            // Allow any Electric vehicle even if tagged under another body category
            if (String(v.fuel_type).toLowerCase() !== "electric" && catName !== filters.category) {
              return false;
            }
          } else if (catName !== filters.category) {
            return false;
          }
        } else if (wantsSuvBroad && !filters.offRoadOnly) {
          if (
            catName !== "Compact SUVs" &&
            catName !== "Full-Size SUVs" &&
            catName !== "Off-Road & Adventure" &&
            catName !== "Electric Vehicles"
          ) {
            return false;
          }
        }

        if (
          filters.maxPricePerDay &&
          Number(v.price_per_day_paise) / 100 > filters.maxPricePerDay
        ) {
          return false;
        }
        if (filters.minSeats && Number(v.seats) < filters.minSeats) {
          return false;
        }
        if (
          filters.transmission &&
          String(v.transmission).toLowerCase() !== filters.transmission.toLowerCase()
        ) {
          return false;
        }
        if (
          filters.fuelType &&
          String(v.fuel_type).toLowerCase() !== filters.fuelType.toLowerCase()
        ) {
          return false;
        }
        if (filters.drivetrain) {
          const dt = v.drivetrain || v.vehicle_offroad_specs?.[0]?.drivetrain;
          if (!dt || dt.toLowerCase() !== filters.drivetrain.toLowerCase()) {
            return false;
          }
        }
        if (filters.offRoadOnly) {
          if (
            catName !== "Off-Road & Adventure" &&
            v.drivetrain !== "4x4" &&
            v.drivetrain !== "4WD"
          ) {
            return false;
          }
        }
        return true;
      });

      if (filters.sortBy === "price_desc") {
        matched.sort(
          (a: any, b: any) => b.price_per_day_paise - a.price_per_day_paise
        );
      } else if (filters.sortBy === "year_desc") {
        matched.sort((a: any, b: any) => b.year - a.year);
      } else {
        matched.sort(
          (a: any, b: any) => a.price_per_day_paise - b.price_per_day_paise
        );
      }

      const isBroadCityQuery =
        !filters.category &&
        !filters.maxPricePerDay &&
        !filters.minSeats &&
        !filters.transmission &&
        !filters.fuelType &&
        !filters.drivetrain &&
        !filters.offRoadOnly;

      matched = matched.slice(0, isBroadCityQuery ? 8 : 6);

      const inventorySummary = matched.map((v: any) => ({
        slug: v.slug,
        name: v.name,
        variant: v.variant,
        category: v.vehicle_categories?.name,
        location: v.location,
        pricePerDayINR: Math.round(Number(v.price_per_day_paise) / 100),
        seats: v.seats,
        transmission: v.transmission,
        fuelType: v.fuel_type,
        drivetrain: v.drivetrain,
        mileageOrRange: v.mileage_or_range,
      }));

      let routePlanPayload: Record<string, unknown> | null = null;
      if (route.tripPlan) {
        const mapsKey = (Deno.env.get("GOOGLE_MAPS_SERVER_API_KEY") ?? "").trim();
        const routeStats = await computeValidatedRouteForAi(
          route.tripPlan.origin!,
          route.tripPlan.destination!,
          mapsKey
        );
        const fuelRates = REF_FUEL_BY_CITY[targetCitySlug] ?? REF_FUEL_BY_CITY["delhi-ncr"];
        const vehicleCostBreakdowns = inventorySummary.slice(0, 4).map((v) => {
          const rentalCostInr = v.pricePerDayINR * route.tripPlan!.tripDays;
          const m = String(v.mileageOrRange ?? "").match(/(\d+(?:\.\d+)?)\s*km/i);
          const fLower = String(v.fuelType).toLowerCase();
          const effVal = m ? Number(m[1]) : fLower === "electric" ? 400 : fLower === "diesel" ? 16 : 15;
          const effNote = m ? `Spec (${v.mileageOrRange})` : "Default planning assumption";
          let estFuelOrChargeInr = 0;
          if (fLower === "electric") {
            const kwhM = String(v.variant ?? "").match(/(\d+(?:\.\d+)?)\s*kWh/i);
            const cap = kwhM ? Number(kwhM[1]) : 40.5;
            estFuelOrChargeInr = Math.round(((routeStats.distanceKm / Math.max(100, effVal)) * cap) * fuelRates.ev);
          } else {
            const rate = fLower === "diesel" ? fuelRates.diesel : fLower === "cng" ? fuelRates.cng : fuelRates.petrol;
            estFuelOrChargeInr = Math.round((routeStats.distanceKm / Math.max(5, effVal)) * rate);
          }
          const tollInr = routeStats.tollInr ?? 0;
          const totalInr = rentalCostInr + estFuelOrChargeInr + tollInr;
          const perPersonInr = Math.round(totalInr / route.tripPlan!.passengers);
          return {
            slug: v.slug,
            name: v.name,
            rentalCostInr,
            estFuelOrChargeInr,
            tollInr: routeStats.tollInr,
            totalInr,
            perPersonInr,
            withinMaxBudget: route.tripPlan!.maxTotalBudgetInr
              ? totalInr <= route.tripPlan!.maxTotalBudgetInr
              : true,
            efficiencyBasis: effNote,
          };
        });

        const topSlug = vehicleCostBreakdowns[0]?.slug ?? "";
        const plannerUrl = `/route-planner?origin=${encodeURIComponent(
          route.tripPlan.origin!
        )}&destination=${encodeURIComponent(
          route.tripPlan.destination!
        )}&days=${route.tripPlan.tripDays}&passengers=${route.tripPlan.passengers}${
          route.tripPlan.maxTotalBudgetInr ? `&budget=${route.tripPlan.maxTotalBudgetInr}` : ""
        }${topSlug ? `&vehicle=${encodeURIComponent(topSlug)}` : ""}`;

        routePlanPayload = {
          origin: route.tripPlan.origin,
          destination: route.tripPlan.destination,
          tripDays: route.tripPlan.tripDays,
          passengers: route.tripPlan.passengers,
          maxTotalBudgetInr: route.tripPlan.maxTotalBudgetInr,
          distanceKm: routeStats.distanceKm,
          durationMinutes: routeStats.durationMinutes,
          distanceSource: routeStats.distanceSource,
          tollInr: routeStats.tollInr,
          vehicleCostBreakdowns,
          plannerUrl,
        };
      }

      const replyPrompt = `You are WHEELMATE — Your personal mobility assistant by SHAREWHEELS.
City queried: ${SUPPORTED_CITIES[targetCitySlug]}
Latest message: "${latestUserMessage}"
${
  suggestedCitySwitch
    ? `Note: The user asked about ${suggestedCitySwitch.name} while viewing ${
        activeCitySlug ? SUPPORTED_CITIES[activeCitySlug] : "another city"
      }. Acknowledge that you searched ${suggestedCitySwitch.name} inventory and offer to switch their active location.`
    : ""
}
Actual vehicles in ${SUPPORTED_CITIES[targetCitySlug]} matching criteria (NEVER invent other vehicles, prices, or availability):
${JSON.stringify(inventorySummary, null, 2)}
${
  routePlanPayload
    ? `Validated ROUTECRAFT Trip Calculation (use ONLY these server-computed route, rental, fuel, toll, and per-person numbers — NEVER invent toll charges, fuel prices, or charger status):
${JSON.stringify(routePlanPayload, null, 2)}`
    : ""
}

Instructions:
- Answer directly! Do NOT start with "Hello! I'm WHEELMATE..." mid-conversation.
- ${
        routePlanPayload
          ? "Present the complete trip breakdown concisely using the exact validated distances, durations, real vehicle rental costs, estimated fuel costs (clearly stating they are spec/reference estimates), toll availability status, total trip cost, cost per person, and mention they can open the full interactive map & split-the-bill workspace in ROUTECRAFT."
          : filters.compareRequested
            ? "Compare the top matched vehicles from inventorySummary concisely on daily rate (₹X,XXX/day), seating, transmission, fuel type, and drivetrain."
            : inventorySummary.length > 0
              ? `Explicitly name the actual available vehicles from inventorySummary along with their exact daily price (formatted as ₹X,XXX/day) and key specs (seats, transmission, fuel type) in a concise, scannable list. Never give a generic summary without naming the real database vehicles.`
              : "Honestly explain that no vehicles in that city match those exact constraints and suggest relaxing budget, seats, or filters."
      }`;

      const pass2 = await invokeGemini(geminiKey, replyPrompt, {
        maxOutputTokens: 2048,
        temperature: 0.25,
      });

      await logUsage(
        "success",
        pass2.model,
        pass1.promptTokens + pass2.promptTokens,
        pass1.completionTokens + pass2.completionTokens
      );

      return jsonResponse({
        reply: pass2.text,
        model: pass2.model,
        mode: "vehicle_discovery",
        citySlug: targetCitySlug,
        cityName: SUPPORTED_CITIES[targetCitySlug],
        suggestedCitySwitch,
        filters,
        routePlan: routePlanPayload,
        vehicles: matched,
        usedWebSearch: false,
        sources: [],
        grounded: true,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown Edge Function error";
      const code = msg.startsWith("GEMINI_")
        ? msg.split(":")[0]
        : "AI_FUNCTION_ERROR";
      const isQuota = code === "GEMINI_HTTP_429";
      const isBusy = code === "GEMINI_HTTP_503" || code === "GEMINI_HTTP_504";
      await logUsage("error", GEMINI_MODELS[0], 0, 0, code);
      return jsonResponse(
        {
          error: isQuota ? "GEMINI_RATE_LIMITED" : isBusy ? "GEMINI_BUSY" : code,
          message:
            isQuota || isBusy
              ? "WHEELMATE’s AI service is temporarily experiencing high demand. Please retry in a few seconds."
              : msg,
        },
        isQuota ? 429 : isBusy ? 503 : 500
      );
    }
  } catch (outerErr) {
    return jsonResponse(
      {
        error: "BAD_REQUEST",
        message: outerErr instanceof Error ? outerErr.message : "Invalid request payload.",
      },
      400
    );
  }
});
