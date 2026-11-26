import { getCurrentLanguage, getLanguageMeta, type LanguageCode } from './types';

type LangMap = Record<LanguageCode, string>;

const CITY_TRANSLATIONS: Record<string, LangMap> = {
  'delhi-ncr': { en: 'Delhi NCR', hi: 'दिल्ली एनसीआर', mr: 'दिल्ली एनसीआर', kn: 'ದೆಹಲಿ ಎನ್‌ಸಿಆರ್', pa: 'ਦਿੱਲੀ ਐਨਸੀਆਰ', bn: 'দিল্লি এনসিআর', te: 'ఢిల్లీ ఎన్‌సిఆర్', ta: 'டெல்லி என்சிஆர்' },
  'delhi ncr': { en: 'Delhi NCR', hi: 'दिल्ली एनसीआर', mr: 'दिल्ली एनसीआर', kn: 'ದೆಹಲಿ ಎನ್‌ಸಿಆರ್', pa: 'ਦਿੱਲੀ ਐਨਸੀਆਰ', bn: 'দিল্লি এনসিআর', te: 'ఢిల్లీ ఎన్‌సిఆర్', ta: 'டெல்லி என்சிஆர்' },
  'new delhi': { en: 'New Delhi', hi: 'नई दिल्ली', mr: 'नवी दिल्ली', kn: 'ನವದೆಹಲಿ', pa: 'ਨਵੀਂ ਦਿੱਲੀ', bn: 'নয়াদিল্লি', te: 'న్యూఢిల్లీ', ta: 'புது டெல்லி' },
  delhi: { en: 'Delhi', hi: 'दिल्ली', mr: 'दिल्ली', kn: 'ದೆಹಲಿ', pa: 'ਦਿੱਲੀ', bn: 'দিল্লি', te: 'ఢిల్లీ', ta: 'டெல்லி' },
  mumbai: { en: 'Mumbai', hi: 'मुंबई', mr: 'मुंबई', kn: 'ಮುಂಬೈ', pa: 'ਮੁੰਬਈ', bn: 'মুম্বই', te: 'ముంబై', ta: 'மும்பை' },
  bengaluru: { en: 'Bengaluru', hi: 'बेंगलुरु', mr: 'बेंगळुरू', kn: 'ಬೆಂಗಳೂರು', pa: 'ਬੈਂਗਲੁਰੂ', bn: 'বেঙ্গালুরু', te: 'బెంగళూరు', ta: 'பெங்களூரு' },
  hyderabad: { en: 'Hyderabad', hi: 'हैदराबाद', mr: 'हैदराबाद', kn: 'ಹೈದರಾಬಾದ್', pa: 'ਹੈਦਰਾਬਾਦ', bn: 'হায়দরাবাদ', te: 'హైదరాబాద్', ta: 'ஹைதராபாத்' },
  chennai: { en: 'Chennai', hi: 'चेन्नई', mr: 'चेन्नई', kn: 'ಚೆನ್ನೈ', pa: 'ਚੇਨਈ', bn: 'চেন্নাই', te: 'చెన్నై', ta: 'சென்னை' },
  pune: { en: 'Pune', hi: 'पुणे', mr: 'पुणे', kn: 'ಪುಣೆ', pa: 'ਪੁਣੇ', bn: 'পুনে', te: 'పుణె', ta: 'புனே' },
  'chandigarh-tricity': { en: 'Chandigarh Tricity', hi: 'चंडीगढ़ ट्राईसिटी', mr: 'चंदीगड ट्रायसिटी', kn: 'ಚಂಡೀಗಢ ಟ್ರೈಸಿಟಿ', pa: 'ਚੰਡੀਗੜ੍ਹ ਟ੍ਰਾਈਸਿਟੀ', bn: 'চণ্ডীগড় ট্রাইসিটি', te: 'చండీగఢ్ ట్రైసిటీ', ta: 'சண்டிகர் ட்ரைசிட்டி' },
  'chandigarh tricity': { en: 'Chandigarh Tricity', hi: 'चंडीगढ़ ट्राईसिटी', mr: 'चंदीगड ट्रायसिटी', kn: 'ಚಂಡೀಗಢ ಟ್ರೈಸಿಟಿ', pa: 'ਚੰਡੀਗੜ੍ਹ ਟ੍ਰਾਈਸਿਟੀ', bn: 'চণ্ডীগড় ট্রাইসিটি', te: 'చండీగఢ్ ట్రైసిటీ', ta: 'சண்டிகர் ட்ரைசிட்டி' },
  chandigarh: { en: 'Chandigarh', hi: 'चंडीगढ़', mr: 'चंदीगड', kn: 'ಚಂಡೀಗಢ', pa: 'ਚੰਡੀਗੜ੍ਹ', bn: 'চণ্ডীগড়', te: 'చండీగఢ్', ta: 'சண்டிகர்' },
  jaipur: { en: 'Jaipur', hi: 'जयपुर', mr: 'जयपूर', kn: 'ಜೈಪುರ', pa: 'ਜੈਪੁਰ', bn: 'জয়পুর', te: 'జైపూర్', ta: 'ஜெய்ப்பூர்' },
  gurugram: { en: 'Gurugram', hi: 'गुरुग्राम', mr: 'गुरुग्राम', kn: 'ಗುರುಗ್ರಾಮ್', pa: 'ਗੁਰੂਗ੍ਰਾਮ', bn: 'গুরুগ্রাম', te: 'గురుగ్రామ్', ta: 'குருகிராம்' },
  noida: { en: 'Noida', hi: 'नोएडा', mr: 'नोएडा', kn: 'ನೋಯ್ಡಾ', pa: 'ਨੋਇਡਾ', bn: 'নয়ডা', te: 'నోయిడా', ta: 'நொய்டா' },
  mohali: { en: 'Mohali', hi: 'मोहाली', mr: 'मोहाली', kn: 'ಮೊಹಾಲಿ', pa: 'ਮੋਹਾਲੀ', bn: 'মোহালি', te: 'మొహాలీ', ta: 'மொஹாலி' },
  panchkula: { en: 'Panchkula', hi: 'पंचकूला', mr: 'पंचकुला', kn: 'ಪಂಚಕುಲ', pa: 'ਪੰਚਕੂਲਾ', bn: 'পঞ্চকুলা', te: 'పంచకుల', ta: 'பஞ்ச்குலா' },
};

const STATE_TRANSLATIONS: Record<string, LangMap> = {
  'delhi / haryana / up': { en: 'Delhi / Haryana / UP', hi: 'दिल्ली / हरियाणा / उत्तर प्रदेश', mr: 'दिल्ली / हरियाणा / उत्तर प्रदेश', kn: 'ದೆಹಲಿ / ಹರಿಯಾಣ / ಉತ್ತರ ಪ್ರದೇಶ', pa: 'ਦਿੱਲੀ / ਹਰਿਆਣਾ / ਉੱਤਰ ਪ੍ਰਦੇਸ਼', bn: 'দিল্লি / হরিয়ানা / উত্তরপ্রদেশ', te: 'ఢిల్లీ / హర్యానా / ఉత్తర ప్రదేశ్', ta: 'டெல்லி / ஹரியானா / உ.பி' },
  maharashtra: { en: 'Maharashtra', hi: 'महाराष्ट्र', mr: 'महाराष्ट्र', kn: 'ಮಹಾರಾಷ್ಟ್ರ', pa: 'ਮਹਾਰਾਸ਼ਟਰ', bn: 'মহারাষ্ট্র', te: 'మహారాష్ట్ర', ta: 'மகாராஷ்டிரா' },
  karnataka: { en: 'Karnataka', hi: 'कर्नाटक', mr: 'कर्नाटक', kn: 'ಕರ್ನಾಟಕ', pa: 'ਕਰਨਾਟਕ', bn: 'কর্ণাটক', te: 'కర్ణాటక', ta: 'கர்நாடகா' },
  telangana: { en: 'Telangana', hi: 'तेलंगाना', mr: 'तेलंगणा', kn: 'ತೆಲಂಗಾಣ', pa: 'ਤੇਲੰਗਾਨਾ', bn: 'তেলেঙ্গানা', te: 'తెలంగాణ', ta: 'தெலங்கானா' },
  'tamil nadu': { en: 'Tamil Nadu', hi: 'तमिलनाडु', mr: 'तामिळनाडू', kn: 'ತಮಿಳುನಾಡು', pa: 'ਤਮਿਲਨਾਡੂ', bn: 'তামিলনাড়ু', te: 'తమిళనాడు', ta: 'தமிழ்நாடு' },
  'chandigarh / punjab / haryana': { en: 'Chandigarh / Punjab / Haryana', hi: 'चंडीगढ़ / पंजाब / हरियाणा', mr: 'चंदीगड / पंजाब / हरियाणा', kn: 'ಚಂಡೀಗಢ / ಪಂಜಾಬ್ / ಹರಿಯಾಣ', pa: 'ਚੰਡੀਗੜ੍ਹ / ਪੰਜਾਬ / ਹਰਿਆਣਾ', bn: 'চণ্ডীগড় / পাঞ্জাব / হরিয়ানা', te: 'చండీగఢ్ / పంజాబ్ / హర్యానా', ta: 'சண்டிகர் / பஞ்சாப் / ஹரியானா' },
  rajasthan: { en: 'Rajasthan', hi: 'राजस्थान', mr: 'राजस्थान', kn: 'ರಾಜಸ್ಥಾನ', pa: 'ਰਾਜਸਥਾਨ', bn: 'রাজস্থান', te: 'రాజస్థాన్', ta: 'ராஜஸ்தான்' },
};

const CATEGORY_TRANSLATIONS: Record<string, LangMap> = {
  all: { en: 'All Categories', hi: 'सभी श्रेणियां', mr: 'सर्व प्रकार', kn: 'ಎಲ್ಲಾ ವರ್ಗಗಳು', pa: 'ਸਾਰੀਆਂ ਸ਼੍ਰੇਣੀਆਂ', bn: 'সব ধরন', te: 'అన్ని వర్గాలు', ta: 'அனைத்து வகைகளும்' },
  hatchbacks: { en: 'Hatchbacks', hi: 'हैचबैक', mr: 'हॅचबॅक', kn: 'ಹ್ಯಾಚ್‌ಬ್ಯಾಕ್‌ಗಳು', pa: 'ਹੈਚਬੈਕ', bn: 'হ্যাচব্যাক', te: 'హ్యాచ్‌బ్యాక్‌లు', ta: 'ஹேட்ச்பேக்' },
  sedans: { en: 'Sedans', hi: 'सेडान', mr: 'सेडान', kn: 'ಸೆಡಾನ್‌ಗಳು', pa: 'ਸੇਡਾਨ', bn: 'সেডান', te: 'సెడాన్‌లు', ta: 'செடான்' },
  'compact suvs': { en: 'Compact SUVs', hi: 'कॉम्पैक्ट एसयूवी', mr: 'कॉम्पॅक्ट एसयूव्ही', kn: 'ಕಾಂಪ್ಯಾಕ್ಟ್ ಎಸ್‌ಯುವಿಗಳು', pa: 'ਕੰਪੈਕਟ ਐਸਯੂਵੀ', bn: 'কম্প্যাক্ট এসইউভি', te: 'కాంపాక్ట్ ఎస్‌యూవీలు', ta: 'காம்பாக்ட் எஸ்யூவி' },
  'full-size suvs': { en: 'Full-Size SUVs', hi: 'फुल-साइज़ एसयूवी', mr: 'फुल-साईज एसयूव्ही', kn: 'ಪೂರ್ಣ ಗಾತ್ರದ ಎಸ್‌ಯುವಿಗಳು', pa: 'ਫੁੱਲ-ਸਾਈਜ਼ ਐਸਯੂਵੀ', bn: 'ফুল-সাইজ এসইউভি', te: 'ఫుల్-సైజ్ ఎస్‌యూవీలు', ta: 'முழு அளவு எஸ்யூவி' },
  'family mpvs': { en: 'Family MPVs', hi: 'फैमिली एमपीवी', mr: 'फॅमिली एमपीव्ही', kn: 'ಫ್ಯಾಮಿಲಿ ಎಂಪಿವಿಗಳು', pa: 'ਫੈਮਿਲੀ ਐਮਪੀਵੀ', bn: 'ফ্যামিলি এমপিভি', te: 'ఫ్యామిలీ ఎంపీవీలు', ta: 'குடும்ப எம்பிவி' },
  'off-road & adventure': { en: 'Off-Road & Adventure', hi: 'ऑफ-रोड और एडवेंचर', mr: 'ऑफ-रोड आणि ॲडव्हेंचर', kn: 'ಆಫ್-ರೋಡ್ ಮತ್ತು ಸಾಹಸ', pa: 'ਆਫ-ਰੋਡ ਅਤੇ ਐਡਵੈਂਚਰ', bn: 'অফ-রোড ও অ্যাডভেঞ্চার', te: 'ఆఫ్-రోడ్ & అడ్వెంచర్', ta: 'ஆஃப்-ரோடு & சாகசம்' },
  'luxury vehicles': { en: 'Luxury Vehicles', hi: 'लक्ज़री वाहन', mr: 'लक्झरी वाहने', kn: 'ಐಷಾರಾಮಿ ವಾಹನಗಳು', pa: 'ਲਗਜ਼ਰੀ ਵਾਹਨ', bn: 'লাক্সারি গাড়ি', te: 'లగ్జరీ వాహనాలు', ta: 'சொகுசு வாகனங்கள்' },
  'electric vehicles': { en: 'Electric Vehicles', hi: 'इलेक्ट्रिक वाहन', mr: 'इलेक्ट्रिक वाहने', kn: 'ಎಲೆಕ್ಟ್ರಿಕ್ ವಾಹನಗಳು', pa: 'ਇਲੈਕਟ੍ਰਿਕ ਵਾਹਨ', bn: 'ইলেকট্রিক গাড়ি', te: 'ఎలక్ట్రిక్ వాహనాలు', ta: 'மின்சார வாகனங்கள்' },
  vehicle: { en: 'Vehicle', hi: 'वाहन', mr: 'वाहन', kn: 'ವಾಹನ', pa: 'ਵਾਹਨ', bn: 'গাড়ি', te: 'వాహనం', ta: 'வாகனம்' },
};

const FUEL_TRANSLATIONS: Record<string, LangMap> = {
  petrol: { en: 'Petrol', hi: 'पेट्रोल', mr: 'पेट्रोल', kn: 'ಪೆಟ್ರೋಲ್', pa: 'ਪੈਟਰੋਲ', bn: 'পেট্রোল', te: 'పెట్రోల్', ta: 'பெட்ரோல்' },
  diesel: { en: 'Diesel', hi: 'डीज़ल', mr: 'डिझेल', kn: 'ಡೀಸೆಲ್', pa: 'ਡੀਜ਼ਲ', bn: 'ডিজেল', te: 'డీజిల్', ta: 'டீசல்' },
  electric: { en: 'Electric', hi: 'इलेक्ट्रिक', mr: 'इलेक्ट्रिक', kn: 'ಎಲೆಕ್ಟ್ರಿಕ್', pa: 'ਇਲੈਕਟ੍ਰਿਕ', bn: 'ইলেকট্রিক', te: 'ఎలక్ట్రిక్', ta: 'மின்சாரம்' },
  hybrid: { en: 'Hybrid', hi: 'हाइब्रिड', mr: 'हायब्रिड', kn: 'ಹೈಬ್ರಿಡ್', pa: 'ਹਾਈਬ੍ਰਿਡ', bn: 'হাইব্রিড', te: 'హైబ్రిడ్', ta: 'ஹைப்ரிட்' },
  cng: { en: 'CNG', hi: 'सीएनजी', mr: 'सीएनजी', kn: 'ಸಿಎನ್‌ಜಿ', pa: 'ਸੀਐਨਜੀ', bn: 'সিএনজি', te: 'సిఎన్‌జి', ta: 'சிஎன்ஜி' },
};

const TRANSMISSION_TRANSLATIONS: Record<string, LangMap> = {
  automatic: { en: 'Automatic', hi: 'ऑटोमैटिक', mr: 'ऑटोमॅटिक', kn: 'ಆಟೋಮ್ಯಾಟಿಕ್', pa: 'ਆਟੋਮੈਟਿਕ', bn: 'অটোমেটিক', te: 'ఆటోమేటిక్', ta: 'ஆட்டோமேட்டிக்' },
  manual: { en: 'Manual', hi: 'मैनुअल', mr: 'मॅन्युअल', kn: 'ಮ್ಯಾನುಯಲ್', pa: 'ਮੈਨੁਅਲ', bn: 'ম্যানুয়াল', te: 'మాన్యువల్', ta: 'மேனுவல்' },
  'single-speed': { en: 'Single-Speed', hi: 'सिंगल-स्पीड', mr: 'सिंगल-स्पीड', kn: 'ಸಿಂಗಲ್-ಸ್ಪೀಡ್', pa: 'ਸਿੰਗਲ-ਸਪੀਡ', bn: 'সিঙ্গেল-স্পিড', te: 'సింగిల్-స్పీడ్', ta: 'சிங்கிள்-ஸ்பீடு' },
  'single-speed (ev)': { en: 'Single-Speed (EV)', hi: 'सिंगल-स्पीड (ईवी)', mr: 'सिंगल-स्पीड (ईव्ही)', kn: 'ಸಿಂಗಲ್-ಸ್ಪೀಡ್ (ಇವಿ)', pa: 'ਸਿੰਗਲ-ਸਪੀਡ (ਈਵੀ)', bn: 'সিঙ্গেল-স্পিড (ইভি)', te: 'సింగిల్-స్పీడ్ (ఈవీ)', ta: 'சிங்கிள்-ஸ்பீடு (ஈவி)' },
};

const STATUS_TRANSLATIONS: Record<string, LangMap> = {
  pending: { en: 'Pending', hi: 'लंबित', mr: 'प्रलंबित', kn: 'ಬಾಕಿಯಿದೆ', pa: 'ਬਕਾਇਆ', bn: 'বিবেচনাধীন', te: 'పెండింగ్', ta: 'நிலுவையில்' },
  accepted: { en: 'Accepted', hi: 'स्वीकृत', mr: 'स्वीकारले', kn: 'ಸ್ವೀಕರಿಸಲಾಗಿದೆ', pa: 'ਸਵੀਕਾਰ ਕੀਤਾ', bn: 'গৃহীত', te: 'ఆమోదించబడింది', ta: 'ஏற்கப்பட்டது' },
  confirmed: { en: 'Confirmed', hi: 'पुष्ट', mr: 'निश्चित', kn: 'ದೃಢೀಕರಿಸಲಾಗಿದೆ', pa: 'ਪੱਕਾ ਹੋਇਆ', bn: 'নিশ্চিত', te: 'నిర్ధారించబడింది', ta: 'உறுதிப்படுத்தப்பட்டது' },
  active: { en: 'Active', hi: 'सक्रिय', mr: 'सक्रिय', kn: 'ಸಕ್ರಿಯ', pa: 'ਸਰਗਰਮ', bn: 'সক্রিয়', te: 'యాక్టివ్', ta: 'செயலில்' },
  completed: { en: 'Completed', hi: 'पूर्ण', mr: 'पूर्ण', kn: 'ಪೂರ್ಣಗೊಂಡಿದೆ', pa: 'ਪੂਰਾ ਹੋਇਆ', bn: 'সম্পন্ন', te: 'పూర్తయింది', ta: 'முடிந்தது' },
  cancelled: { en: 'Cancelled', hi: 'रद्द', mr: 'रद्द', kn: 'ರದ್ದುಗೊಂಡಿದೆ', pa: 'ਰੱਦ ਕੀਤਾ', bn: 'বাতিল', te: 'రద్దు చేయబడింది', ta: 'ரத்து செய்யப்பட்டது' },
  rejected: { en: 'Rejected', hi: 'अस्वीकृत', mr: 'नाकारले', kn: 'ತಿರಸ್ಕರಿಸಲಾಗಿದೆ', pa: 'ਅਸਵੀਕਾਰ ਕੀਤਾ', bn: 'প্রত্যাখ্যাত', te: 'తిరస్కరించబడింది', ta: 'நಿರாகரிக்கப்பட்டது' },
  expired: { en: 'Expired', hi: 'समाप्त', mr: 'कालबाह्य', kn: 'ಅವಧಿ ಮುಗಿದಿದೆ', pa: 'ਮਿਆਦ ਪੁੱਗੀ', bn: 'মেয়াদোত্তীর্ণ', te: 'గడువు ముగిసింది', ta: 'காலாவதியானது' },
  unpaid: { en: 'Unpaid', hi: 'अदत्त', mr: 'न भरलेले', kn: 'ಪಾವತಿಸಿಲ್ಲ', pa: 'ਅਣ-ਭੁਗਤਾਨ', bn: 'অপরিশোধিত', te: 'చెల్లించలేదు', ta: 'செலுத்தப்படவில்லை' },
  advance_paid: { en: '50% Advance Paid', hi: '50% अग्रिम भुगतान', mr: '50% आगाऊ भरणा', kn: '50% ಮುಂಗಡ ಪಾವತಿಸಲಾಗಿದೆ', pa: '50% ਐਡਵਾਂਸ ਭੁਗਤਾਨ', bn: '৫০% অগ্রিম পরিশোধিত', te: '50% అడ్వాన్స్ చెల్లించబడింది', ta: '50% முன்பணம் செலுத்தப்பட்டது' },
  paid: { en: 'Paid', hi: 'भुगतान पूर्ण', mr: 'भरणा पूर्ण', kn: 'ಪಾವತಿಸಲಾಗಿದೆ', pa: 'ਭੁਗਤਾਨ ਹੋਇਆ', bn: 'পরিশোধিত', te: 'చెల్లించబడింది', ta: 'செலுத்தப்பட்டது' },
  captured: { en: 'Captured', hi: 'प्राप्त', mr: 'प्राप्त', kn: 'ಸ್ವೀಕರಿಸಲಾಗಿದೆ', pa: 'ਪ੍ਰਾਪਤ', bn: 'গৃহীত', te: 'స్వీకరించబడింది', ta: 'பெறப்பட்டது' },
  failed: { en: 'Failed', hi: 'विफल', mr: 'अयशस्वी', kn: 'ವಿಫಲವಾಗಿದೆ', pa: 'ਅਸਫਲ', bn: 'ব্যর্থ', te: 'విఫలమైంది', ta: 'தோல்வி' },
  refunded: { en: 'Refunded', hi: 'धनवापसी पूर्ण', mr: 'परतावा पूर्ण', kn: 'ಮರುಪಾವತಿಸಲಾಗಿದೆ', pa: 'ਰਿਫੰਡ ਕੀਤਾ', bn: 'ফেরত দেওয়া হয়েছে', te: 'రీఫండ్ చేయబడింది', ta: 'திருப்பிச் செலுத்தப்பட்டது' },
  incomplete: { en: 'Incomplete', hi: 'अधूरा', mr: 'अपूर्ण', kn: 'ಅಪೂರ್ಣ', pa: 'ਅਧੂਰਾ', bn: 'অসম্পূর্ণ', te: 'అసంపూర్ణం', ta: 'முழுமையற்றது' },
  pending_verification: { en: 'Pending Verification', hi: 'सत्यापन लंबित', mr: 'पडताळणी प्रलंबित', kn: 'ಪರಿಶೀಲನೆ ಬಾಕಿಯಿದೆ', pa: 'ਤਸਦੀਕ ਬਕਾਇਆ', bn: 'যাচাইকরণ বিবেচনাধীন', te: 'ధృవీకరణ పెండింగ్‌లో ఉంది', ta: 'சரிபார்ப்பு நிலுவையில்' },
  documents_submitted: { en: 'Documents Submitted', hi: 'दस्तावेज़ जमा', mr: 'कागदपत्रे सादर', kn: 'ದಾಖಲೆಗಳನ್ನು ಸಲ್ಲಿಸಲಾಗಿದೆ', pa: 'ਦਸਤਾਵੇਜ਼ ਜਮ੍ਹਾਂ', bn: 'নথি জমা দেওয়া হয়েছে', te: 'పత్రాలు సమర్పించబడ్డాయి', ta: 'ஆவணங்கள் சமர்ப்பிக்கப்பட்டன' },
  under_review: { en: 'Under Review', hi: 'समीक्षाधीन', mr: 'तपासणी सुरू', kn: 'ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ', pa: 'ਸਮੀਖਿਆ ਅਧੀਨ', bn: 'পর্যালোচনাধীন', te: 'సమీక్షలో ఉంది', ta: 'ஆய்வில் உள்ளது' },
  verified: { en: 'Verified', hi: 'सत्यापित', mr: 'सत्यापित', kn: 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ', pa: 'ਤਸਦੀਕਸ਼ੁਦਾ', bn: 'যাচাইকৃত', te: 'ధృవీకరించబడింది', ta: 'சரிபார்க்கப்பட்டது' },
  approved: { en: 'Approved', hi: 'स्वीकृत', mr: 'मंजूर', kn: 'ಅನುಮೋದಿಸಲಾಗಿದೆ', pa: 'ਮਨਜ਼ੂਰਸ਼ੁਦਾ', bn: 'অনুমোদিত', te: 'ఆమోదించబడింది', ta: 'அனுமதிக்கப்பட்டது' },
  pending_review: { en: 'Pending Review', hi: 'समीक्षा लंबित', mr: 'तपासणी प्रलंबित', kn: 'ಪರಿಶೀಲನೆ ಬಾಕಿಯಿದೆ', pa: 'ਸਮੀਖਿਆ ਬਕਾਇਆ', bn: 'পর্যালোচনা বাকি', te: 'సమీక్ష పెండింగ్', ta: 'மதிப்பாய்வு நிலுவையில்' },
  draft: { en: 'Draft', hi: 'ड्राफ्ट', mr: 'मसुदा', kn: 'ಕರಡು', pa: 'ਡਰਾਫਟ', bn: 'খসড়া', te: 'డ్రాఫ్ట్', ta: 'வரைவு' },
  resubmission_required: { en: 'Resubmission Required', hi: 'पुनः जमा आवश्यक', mr: 'पुन्हा सादर करणे आवश्यक', kn: 'ಮರುಸಲ್ಲಿಕೆ ಅಗತ್ಯವಿದೆ', pa: 'ਦੁਬਾਰਾ ਜਮ੍ਹਾਂ ਕਰਨ ਦੀ ਲੋੜ', bn: 'পুনরায় জমা প্রয়োজন', te: 'మళ్లీ సమర్పించాలి', ta: 'மீண்டும் சமர்ப்பிக்க வேண்டும்' },
  suspended: { en: 'Suspended', hi: 'निलंबित', mr: 'निलंबित', kn: 'ಅಮಾನತುಗೊಳಿಸಲಾಗಿದೆ', pa: 'ਮੁਅੱਤਲ', bn: 'স্থগিত', te: 'సస్పెండ్ చేయబడింది', ta: 'இடைநிறுத்தப்பட்டது' },
  valid: { en: 'Valid', hi: 'वैध', mr: 'वैध', kn: 'ಮಾನ್ಯವಾಗಿದೆ', pa: 'ਵੈਧ', bn: 'বৈধ', te: 'చెల్లుబాటులో ఉంది', ta: 'செல்லுபடியாகும்' },
  'expiring soon': { en: 'Expiring soon', hi: 'शीघ्र समाप्त', mr: 'लवकरच कालबाह्य', kn: 'ಶೀಘ್ರದಲ್ಲೇ ಮುಕ್ತಾಯ', pa: 'ਜਲਦੀ ਸਮਾਪਤ', bn: 'শীঘ্রই মেয়াদ শেষ', te: 'త్వరలో గడువు ముగుస్తుంది', ta: 'விரைவில் காலாவதியாகும்' },
  'not submitted': { en: 'Not submitted', hi: 'जमा नहीं किया गया', mr: 'सादर केलेले नाही', kn: 'ಸಲ್ಲಿಸಲಾಗಿಲ್ಲ', pa: 'ਜਮ੍ਹਾਂ ਨਹੀਂ ਕੀਤਾ', bn: 'জমা দেওয়া হয়নি', te: 'సమర్పించలేదు', ta: 'சமர்ப்பிக்கப்படவில்லை' },
  'owner submitted': { en: 'Owner Submitted', hi: 'मालिक द्वारा दर्ज', mr: 'मालकाने नोंदवलेले', kn: 'ಮಾಲೀಕರು ಸಲ್ಲಿಸಿದ್ದಾರೆ', pa: 'ਮਾਲਕ ਵੱਲੋਂ ਦਰਜ', bn: 'মালিক কর্তৃক প্রদত্ত', te: 'యజమాని సమర్పించినది', ta: 'உரிமையாளர் சமர்ப்பித்தது' },
  'document reviewed': { en: 'Document Reviewed', hi: 'दस्तावेज़ जांचा गया', mr: 'कागदपत्र तपासले', kn: 'ದಾಖಲೆ ಪರಿಶೀಲಿಸಲಾಗಿದೆ', pa: 'ਦਸਤਾਵੇਜ਼ ਜਾਂਚਿਆ ਗਿਆ', bn: 'নথি যাচাইকৃত', te: 'పత్రం పరిశీలించబడింది', ta: 'ஆவணம் சரிபார்க்கப்பட்டது' },
  'independently verified': { en: 'Independently Verified', hi: 'स्वतंत्र रूप से सत्यापित', mr: 'स्वतंत्रपणे सत्यापित', kn: 'ಸ್ವತಂತ್ರವಾಗಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ', pa: 'ਸੁਤੰਤਰ ਤੌਰ ’ਤੇ ਤਸਦੀਕਸ਼ੁਦਾ', bn: 'স্বতন্ত্রভাবে যাচাইকৃত', te: 'స్వతంత్రంగా ధృవీకరించబడింది', ta: 'தனியாக சரிபார்க்கப்பட்டது' },
  'platform recorded': { en: 'Platform Recorded', hi: 'प्लेटफ़ॉर्म रिकॉर्ड', mr: 'प्लॅटफॉर्म नोंद', kn: 'ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ದಾಖಲೆ', pa: 'ਪਲੇਟਫਾਰਮ ਰਿਕਾਰਡ', bn: 'প্ল্যাটফর্ম রেকর্ড', te: 'ప్లాట్‌ఫారమ్ రికార్డు', ta: 'தளப் பதிவு' },
  open: { en: 'Open', hi: 'खुला', mr: 'खुले', kn: 'ತೆರೆದಿದೆ', pa: 'ਖੁੱਲ੍ਹਾ', bn: 'খোলা', te: 'తెరిచి ఉంది', ta: 'திறந்துள்ளது' },
  investigating: { en: 'Investigating', hi: 'जांच जारी', mr: 'तपास सुरू', kn: 'ತನಿಖೆ ನಡೆಯುತ್ತಿದೆ', pa: 'ਜਾਂਚ ਜਾਰੀ', bn: 'তদন্তাধীন', te: 'విచారణలో ఉంది', ta: 'விசாரணையில்' },
  resolved: { en: 'Resolved', hi: 'सुलझाया गया', mr: 'निराकरण झाले', kn: 'ಪರಿಹರಿಸಲಾಗಿದೆ', pa: 'ਹੱਲ ਕੀਤਾ', bn: 'সমাধান হয়েছে', te: 'పరిష్కరించబడింది', ta: 'தீர்க்கப்பட்டது' },
  closed: { en: 'Closed', hi: 'बंद', mr: 'बंद', kn: 'ಮುಚ್ಚಲಾಗಿದೆ', pa: 'ਬੰਦ', bn: 'বন্ধ', te: 'మూసివేయబడింది', ta: 'மூடப்பட்டது' },
  low: { en: 'Low', hi: 'कम', mr: 'कमी', kn: 'ಕಡಿಮೆ', pa: 'ਘੱਟ', bn: 'কম', te: 'తక్కువ', ta: 'குறைவு' },
  medium: { en: 'Medium', hi: 'मध्यम', mr: 'मध्यम', kn: 'ಮಧ್ಯಮ', pa: 'ਮੱਧਮ', bn: 'মাঝারি', te: 'మధ్యస్థం', ta: 'நடுத்தரம்' },
  high: { en: 'High', hi: 'उच्च', mr: 'उच्च', kn: 'ಹೆಚ್ಚು', pa: 'ਉੱਚ', bn: 'উচ্চ', te: 'అధికం', ta: 'அதிகம்' },
  critical: { en: 'Critical', hi: 'गंभीर', mr: 'गंभीर', kn: 'ಗಂಭೀರ', pa: 'ਗੰਭੀਰ', bn: 'জরুরি', te: 'క్లిష్టమైన', ta: 'மிகத் தீவிரம்' },
};

const TERRAIN_TRANSLATIONS: Record<string, LangMap> = {
  'mountain highways': { en: 'Mountain Highways', hi: 'पहाड़ी राजमार्ग', mr: 'डोंगरी महामार्ग', kn: 'ಪರ್ವತ ಹೆದ್ದಾರಿಗಳು', pa: 'ਪਹਾੜੀ ਹਾਈਵੇਅ', bn: 'পাহাড়ি মহাসড়ক', te: 'పర్వత రహదారులు', ta: 'மலை நெடுஞ்சாலைகள்' },
  'snow & ice': { en: 'Snow & Ice', hi: 'बर्फ और पाला', mr: 'बर्फ आणि हिम', kn: 'ಹಿಮ ಮತ್ತು ಮಂಜುಗಡ್ಡೆ', pa: 'ਬਰਫ਼ ਅਤੇ ਕੋਰਾ', bn: 'তুষার ও বরফ', te: 'మంచు & ఐస్', ta: 'பனி & ஐஸ்' },
  'sand dunes': { en: 'Sand Dunes', hi: 'रेत के टीले', mr: 'वाळूच्या टेकड्या', kn: 'ಮರಳು ದಿಬ್ಬಗಳು', pa: 'ਰੇਤ ਦੇ ਟਿੱਬੇ', bn: 'বালিয়াড়ি', te: 'ఇసుక తిన్నెలు', ta: 'மணல் குன்றுகள்' },
  'mud & forest trails': { en: 'Mud & Forest Trails', hi: 'कीचड़ और जंगल ट्रैक', mr: 'चिखल आणि जंगल वाटा', kn: 'ಕೆಸರು ಮತ್ತು ಕಾಡಿನ ಹಾದಿ', pa: 'ਚਿੱਕੜ ਅਤੇ ਜੰਗਲੀ ਰਸਤੇ', bn: 'কাদা ও বনের পথ', te: 'బురద & అటవీ మార్గాలు', ta: 'சேறு & காட்டுப் பாதைகள்' },
  'rocky trails': { en: 'Rocky Trails', hi: 'पथरीले रास्ते', mr: 'खडकाळ वाटा', kn: 'ಕಲ್ಲುಬಂಡೆ ಹಾದಿಗಳು', pa: 'ਪਥਰੀਲੇ ਰਸਤੇ', bn: 'পাথুরে পথ', te: 'రాతి మార్గాలు', ta: 'பாறைப் பாதைகள்' },
  'river crossings': { en: 'River Crossings', hi: 'नदी पार करना', mr: 'नदी ओलांडणे', kn: 'ನದಿ ದಾಟುವಿಕೆ', pa: 'ਨਦੀ ਪਾਰ ਕਰਨਾ', bn: 'নদী পারাপার', te: 'నది దాటడం', ta: 'ஆறு கடத்தல்' },
  'broken tarmac': { en: 'Broken Tarmac', hi: 'टूटी सड़कें', mr: 'खराब रस्ते', kn: 'ಒಡೆದ ರಸ್ತೆಗಳು', pa: 'ਟੁੱਟੀਆਂ ਸੜਕਾਂ', bn: 'ভাঙা রাস্তা', te: 'దెబ్బతిన్న రోడ్లు', ta: 'பழுதடைந்த சாலைகள்' },
  overlanding: { en: 'Overlanding', hi: 'ओवरलैंडिंग', mr: 'ओव्हरलँडिंग', kn: 'ಓವರ್‌ಲ್ಯಾಂಡಿಂಗ್', pa: 'ਓਵਰਲੈਂਡਿੰਗ', bn: 'ওভারল্যান্ডিং', te: 'ఓవర్‌ల్యాండింగ్', ta: 'ஓவர்லேண்டிங்' },
};

const RULE_PHRASE_TRANSLATIONS: Record<string, LangMap> = {
  'paved roads only': { en: 'Paved roads only', hi: 'केवल पक्की सड़कों पर चलाएं', mr: 'फक्त पक्क्या रस्त्यांवर चालवा', kn: 'ಸುಸಜ್ಜಿತ ರಸ್ತೆಗಳಲ್ಲಿ ಮಾತ್ರ', pa: 'ਸਿਰਫ਼ ਪੱਕੀਆਂ ਸੜਕਾਂ ’ਤੇ ਚਲਾਓ', bn: 'শুধুমাত্র পাকা রাস্তায় চালান', te: 'తారు రోడ్లపై మాత్రమే నడపాలి', ta: 'தார் சாலைகளில் மட்டுமே இயக்கவும்' },
  'minimum driver age 25': { en: 'Minimum driver age 25', hi: 'चालक की न्यूनतम आयु 25 वर्ष', mr: 'चालकाचे किमान वय २५ वर्षे', kn: 'ಚಾಲಕರ ಕನಿಷ್ಠ ವಯಸ್ಸು 25', pa: 'ਡਰਾਈਵਰ ਦੀ ਘੱਟੋ-ਘੱਟ ਉਮਰ 25 ਸਾਲ', bn: 'চালকের ন্যূনতম বয়স ২৫ বছর', te: 'డ్రైవర్ కనీస వయస్సు 25 ఏళ్లు', ta: 'ஓட்டுநர் குறைந்தபட்ச வயது 25' },
  'fastag settled at actuals': { en: 'FASTag settled at actuals', hi: 'FASTag वास्तविक टोल अनुसार देय', mr: 'FASTag प्रत्यक्ष टोलनुसार देय', kn: 'FASTag ನಿಜವಾದ ಶುಲ್ಕದಂತೆ ಪಾವತಿ', pa: 'FASTag ਅਸਲ ਟੋਲ ਅਨੁਸਾਰ ਭੁਗਤਾਨ', bn: 'FASTag প্রকৃত টোল অনুযায়ী প্রদেয়', te: 'FASTag వాస్తవ టోల్ ప్రకారం చెల్లింపు', ta: 'FASTag உண்மையான சுங்கக் கட்டணப்படி' },
  'return with matching fuel': { en: 'Return with matching fuel', hi: 'समान ईंधन स्तर के साथ लौटाएं', mr: 'समान इंधन पातळीसह परत करा', kn: 'ಅದೇ ಇಂಧನ ಮಟ್ಟದೊಂದಿಗೆ ಹಿಂತಿರುಗಿಸಿ', pa: 'ਬਰਾਬਰ ਈਂਧਨ ਪੱਧਰ ਨਾਲ ਵਾਪਸ ਕਰੋ', bn: 'সমপরিমাণ জ্বালানি সহ ফেরত দিন', te: 'అదే ఇంధన స్థాయితో తిరిగి ఇవ్వండి', ta: 'அதே எரிபொருள் அளவுடன் திரும்ப அளிக்கவும்' },
  'no smoking inside cabin': { en: 'No smoking inside cabin', hi: 'केबिन के अंदर धूम्रपान वर्जित', mr: 'गाडीत धूम्रपान करण्यास मनाई', kn: 'ಕಾರಿನ ಒಳಗೆ ಧೂಮಪಾನ ನಿಷೇಧಿಸಲಾಗಿದೆ', pa: 'ਕੈਬਿਨ ਅੰਦਰ ਸਿਗਰਟਨੋਸ਼ੀ ਮਨ੍ਹਾ ਹੈ', bn: 'কেবিনের ভেতরে ধূমপান নিষিদ্ধ', te: 'క్యాబిన్ లోపల ధూమపానం నిషేధం', ta: 'வாகனத்திற்குள் புகைபிடிக்கக் கூடாது' },
  'paved highways & urban zones only': { en: 'Paved highways & urban zones only', hi: 'केवल पक्के राजमार्ग और शहरी क्षेत्र', mr: 'फक्त महामार्ग आणि शहरी भाग', kn: 'ಹೆದ್ದಾರಿ ಮತ್ತು ನಗರ ಪ್ರದೇಶಗಳಲ್ಲಿ ಮಾತ್ರ', pa: 'ਸਿਰਫ਼ ਹਾਈਵੇਅ ਅਤੇ ਸ਼ਹਿਰੀ ਖੇਤਰ', bn: 'শুধুমাত্র মহাসড়ক ও শহরাঞ্চলে', te: 'హైవేలు & నగర ప్రాంతాల్లో మాత్రమే', ta: 'நெடுஞ்சாலை மற்றும் நகர்ப்புறங்களில் மட்டும்' },
  'paved expressways & city drives only': { en: 'Paved expressways & city drives only', hi: 'केवल एक्सप्रेसवे और शहर ड्राइव', mr: 'फक्त एक्सप्रेसवे आणि शहर प्रवास', kn: 'ಎಕ್ಸ್‌ಪ್ರೆಸ್‌ವೇ ಮತ್ತು ನಗರ ಪ್ರಯಾಣ ಮಾತ್ರ', pa: 'ਸਿਰਫ਼ ਐਕਸਪ੍ਰੈਸਵੇਅ ਅਤੇ ਸ਼ਹਿਰ ਡਰਾਈਵ', bn: 'শুধুমাত্র এক্সপ্রেসওয়ে ও শহরে চালান', te: 'ఎక్స్‌ప్రెస్‌వేలు & సిటీ డ్రైవ్ మాత్రమే', ta: 'விரைவுச்சாலை மற்றும் நகரப் பயணம் மட்டும்' },
  'verified licence & 25+ driver age required': { en: 'Verified licence & 25+ driver age required', hi: 'सत्यापित लाइसेंस और 25+ आयु आवश्यक', mr: 'सत्यापित परवाना आणि २५+ वय आवश्यक', kn: 'ಪರಿಶೀಲಿಸಿದ ಪರವಾನಗಿ ಮತ್ತು 25+ ವಯಸ್ಸು ಕಡ್ಡಾಯ', pa: 'ਤਸਦੀਕਸ਼ੁਦਾ ਲਾਇਸੰਸ ਅਤੇ 25+ ਉਮਰ ਲਾਜ਼ਮੀ', bn: 'যাচাইকৃত লাইসেন্স ও ২৫+ বয়স আবশ্যক', te: 'ధృవీకరించిన లైసెన్స్ & 25+ వయస్సు తప్పనిసరి', ta: 'சரிபார்க்கப்பட்ட உரிமம் & 25+ வயது அவசியம்' },
  'prior route disclosure required': { en: 'Prior route disclosure required', hi: 'यात्रा मार्ग की पूर्व जानकारी आवश्यक', mr: 'प्रवास मार्गाची पूर्वकल्पना आवश्यक', kn: 'ಮಾರ್ಗದ ಪೂರ್ವ ಮಾಹಿತಿ ಕಡ್ಡಾಯ', pa: 'ਰੂਟ ਦੀ ਪਹਿਲਾਂ ਜਾਣਕਾਰੀ ਦੇਣੀ ਲਾਜ਼ਮੀ', bn: 'যাত্রাপথের পূর্ব ঘোষণা আবশ্যক', te: 'ముందుగా రూట్ వివరాలు తెలపాలి', ta: 'பயணப் பாதையை முன்பே தெரிவிக்க வேண்டும்' },
  'verified licence & 28+ driver age or chauffeur protocol': { en: 'Verified licence & 28+ driver age or chauffeur protocol', hi: 'सत्यापित लाइसेंस और 28+ आयु या शोफ़र प्रोटोकॉल', mr: 'सत्यापित परवाना व २८+ वय किंवा चालक प्रोटोकॉल', kn: 'ಪರಿಶೀಲಿಸಿದ ಪರವಾನಗಿ ಮತ್ತು 28+ ವಯಸ್ಸು ಅಥವಾ ಚಾಲಕ ಶಿಷ್ಟಾಚಾರ', pa: 'ਤਸਦੀਕਸ਼ੁਦਾ ਲਾਇਸੰਸ ਅਤੇ 28+ ਉਮਰ ਜਾਂ ਡਰਾਈਵਰ ਪ੍ਰੋਟੋਕੋਲ', bn: 'যাচাইকৃত লাইসেন্স ও ২৮+ বয়স অথবা শফার প্রোটোকল', te: 'ధృవీకరించిన లైసెన్స్ & 28+ వయస్సు లేదా షాఫర్ ప్రోటోకాల్', ta: 'சரிபார்க்கப்பட்ட உரிமம் & 28+ வயது அல்லது ஓட்டுநர் நெறிமுறை' },
};

const VEHICLE_DESC_TEMPLATES: Record<LanguageCode, (p: { name: string; cat: string; seats: number; trans: string; fuel: string; loc: string }) => string> = {
  en: (p) => `${p.name} (${p.cat}) — ${p.seats}-seater ${p.trans} ${p.fuel} vehicle available for verified rentals in ${p.loc}.`,
  hi: (p) => `${p.loc} में सत्यापित बुकिंग के लिए उपलब्ध ${p.seats}-सीटर ${p.trans} ${p.fuel} ${p.name} (${p.cat})।`,
  mr: (p) => `${p.loc} मध्ये सत्यापित भाड्यासाठी उपलब्ध ${p.seats}-आसनी ${p.trans} ${p.fuel} ${p.name} (${p.cat}).`,
  kn: (p) => `${p.loc} ನಲ್ಲಿ ಪರಿಶೀಲಿಸಿದ ಬಾಡಿಗೆಗೆ ಲಭ್ಯವಿರುವ ${p.seats}-ಆಸನಗಳ ${p.trans} ${p.fuel} ${p.name} (${p.cat}).`,
  pa: (p) => `${p.loc} ਵਿੱਚ ਤਸਦੀਕਸ਼ੁਦਾ ਰੈਂਟਲ ਲਈ ਉਪਲਬਧ ${p.seats}-ਸੀਟਰ ${p.trans} ${p.fuel} ${p.name} (${p.cat})।`,
  bn: (p) => `${p.loc}-এ যাচাইকৃত ভাড়ার জন্য উপলব্ধ ${p.seats}-আসনের ${p.trans} ${p.fuel} ${p.name} (${p.cat})।`,
  te: (p) => `${p.loc} లో ధృవీకరించబడిన అద్దెకు అందుబాటులో ఉన్న ${p.seats}-సీట్ల ${p.trans} ${p.fuel} ${p.name} (${p.cat}).`,
  ta: (p) => `${p.loc} நகரில் சரிபார்க்கப்பட்ட வாடகைக்கு கிடைக்கும் ${p.seats} இருக்கை ${p.trans} ${p.fuel} ${p.name} (${p.cat}).`,
};

export function translateCity(value: string | null | undefined, lang: LanguageCode = getCurrentLanguage()): string {
  if (!value) return '';
  if (lang === 'en') return value;
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  if (CITY_TRANSLATIONS[lower]) return CITY_TRANSLATIONS[lower][lang];
  if (STATE_TRANSLATIONS[lower]) return STATE_TRANSLATIONS[lower][lang];

  // Handle "Locality, City" compound locations while keeping proper-noun locality intact
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map((s) => s.trim());
    const translatedParts = parts.map((part) => {
      const pLow = part.toLowerCase();
      return CITY_TRANSLATIONS[pLow]?.[lang] ?? STATE_TRANSLATIONS[pLow]?.[lang] ?? part;
    });
    return translatedParts.join(', ');
  }
  return value;
}

export function translateState(value: string | null | undefined, lang: LanguageCode = getCurrentLanguage()): string {
  if (!value) return '';
  if (lang === 'en') return value;
  const lower = value.trim().toLowerCase();
  return STATE_TRANSLATIONS[lower]?.[lang] ?? CITY_TRANSLATIONS[lower]?.[lang] ?? value;
}

export function translateCategory(cat: string | null | undefined, lang: LanguageCode = getCurrentLanguage()): string {
  if (!cat) return '';
  const lower = cat.trim().toLowerCase();
  return CATEGORY_TRANSLATIONS[lower]?.[lang] ?? cat;
}

export function translateFuel(fuel: string | null | undefined, lang: LanguageCode = getCurrentLanguage()): string {
  if (!fuel) return '';
  const lower = fuel.trim().toLowerCase();
  return FUEL_TRANSLATIONS[lower]?.[lang] ?? fuel;
}

export function translateTransmission(trans: string | null | undefined, lang: LanguageCode = getCurrentLanguage()): string {
  if (!trans) return '';
  const lower = trans.trim().toLowerCase();
  return TRANSMISSION_TRANSLATIONS[lower]?.[lang] ?? trans;
}

export function translateStatus(status: string | null | undefined, lang: LanguageCode = getCurrentLanguage()): string {
  if (!status) return '';
  const lower = status.trim().toLowerCase();
  return STATUS_TRANSLATIONS[lower]?.[lang] ?? status;
}

export function translateTerrain(terrain: string | null | undefined, lang: LanguageCode = getCurrentLanguage()): string {
  if (!terrain) return '';
  const lower = terrain.trim().toLowerCase();
  return TERRAIN_TRANSLATIONS[lower]?.[lang] ?? terrain;
}

export function translateRuleOrHighlight(item: string, isDemo?: boolean, lang: LanguageCode = getCurrentLanguage()): string {
  if (!item || lang === 'en' || isDemo === false) return item;
  const lower = item.trim().toLowerCase();
  return RULE_PHRASE_TRANSLATIONS[lower]?.[lang] ?? item;
}

export function translateVehicleDescription(
  description: string | null | undefined,
  isDemo: boolean | undefined,
  meta: {
    name: string;
    category?: string;
    seats?: number;
    transmission?: string;
    fuelType?: string;
    location?: string;
  },
  lang: LanguageCode = getCurrentLanguage()
): string {
  if (lang === 'en') return description || '';
  // Preserve genuine user-generated descriptions untouched
  if (isDemo === false && description && description.trim().length > 0) {
    return description;
  }
  const tpl = VEHICLE_DESC_TEMPLATES[lang] ?? VEHICLE_DESC_TEMPLATES.en;
  return tpl({
    name: meta.name,
    cat: translateCategory(meta.category || 'Vehicle', lang),
    seats: meta.seats ?? 5,
    trans: translateTransmission(meta.transmission || 'Automatic', lang),
    fuel: translateFuel(meta.fuelType || 'Petrol', lang),
    loc: translateCity(meta.location || '', lang),
  });
}

export function formatCurrencyINR(amount: number, lang: LanguageCode = getCurrentLanguage()): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const bcp47 = getLanguageMeta(lang).bcp47;
  try {
    return new Intl.NumberFormat(bcp47, {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      numberingSystem: 'latn',
    }).format(safe);
  } catch {
    return `₹${Math.round(safe).toLocaleString('en-IN')}`;
  }
}

export function formatLocaleNumber(
  value: number,
  lang: LanguageCode = getCurrentLanguage(),
  options?: Intl.NumberFormatOptions
): string {
  const safe = Number.isFinite(value) ? value : 0;
  const bcp47 = getLanguageMeta(lang).bcp47;
  try {
    return new Intl.NumberFormat(bcp47, { numberingSystem: 'latn', ...options }).format(safe);
  } catch {
    return safe.toLocaleString('en-IN', options);
  }
}

export function formatLocaleDate(
  dateInput: string | number | Date | null | undefined,
  lang: LanguageCode = getCurrentLanguage(),
  options?: Intl.DateTimeFormatOptions
): string {
  if (dateInput == null || dateInput === '') return '';
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return String(dateInput);
  const bcp47 = getLanguageMeta(lang).bcp47;
  try {
    return d.toLocaleDateString(
      bcp47,
      options ?? { day: '2-digit', month: 'short', year: 'numeric', numberingSystem: 'latn' }
    );
  } catch {
    return d.toLocaleDateString('en-IN');
  }
}

export function formatLocaleDateTime(
  dateInput: string | number | Date | null | undefined,
  lang: LanguageCode = getCurrentLanguage()
): string {
  if (dateInput == null || dateInput === '') return '';
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return String(dateInput);
  const bcp47 = getLanguageMeta(lang).bcp47;
  try {
    return d.toLocaleString(bcp47, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      numberingSystem: 'latn',
    });
  } catch {
    return d.toLocaleString('en-IN');
  }
}

const DURATION_UNITS: Record<LanguageCode, { hour: string; hours: string; day: string; days: string; min: string; hrShort: string }> = {
  en: { hour: 'hour', hours: 'hours', day: 'day', days: 'days', min: 'min', hrShort: 'h' },
  hi: { hour: 'घंटा', hours: 'घंटे', day: 'दिन', days: 'दिन', min: 'मिनट', hrShort: 'घं' },
  mr: { hour: 'तास', hours: 'तास', day: 'दिवस', days: 'दिवस', min: 'मि', hrShort: 'ता' },
  kn: { hour: 'ಗಂಟೆ', hours: 'ಗಂಟೆಗಳು', day: 'ದಿನ', days: 'ದಿನಗಳು', min: 'ನಿಮಿಷ', hrShort: 'ಗಂ' },
  pa: { hour: 'ਘੰਟਾ', hours: 'ਘੰਟੇ', day: 'ਦਿਨ', days: 'ਦਿਨ', min: 'ਮਿੰਟ', hrShort: 'ਘੰ' },
  bn: { hour: 'ঘণ্টা', hours: 'ঘণ্টা', day: 'দিন', days: 'দিন', min: 'মিনিট', hrShort: 'ঘঃ' },
  te: { hour: 'గంట', hours: 'గంటలు', day: 'రోజు', days: 'రోజులు', min: 'నిమి', hrShort: 'గం' },
  ta: { hour: 'மணிநேரம்', hours: 'மணிநேரம்', day: 'நாள்', days: 'நாட்கள்', min: 'நிமி', hrShort: 'ம' },
};

export function formatDurationUnits(
  mode: 'DAILY' | 'HOURLY',
  units: number,
  lang: LanguageCode = getCurrentLanguage()
): string {
  const u = DURATION_UNITS[lang] ?? DURATION_UNITS.en;
  if (mode === 'HOURLY') {
    return `${units} ${units === 1 ? u.hour : u.hours}`;
  }
  return `${units} ${units === 1 ? u.day : u.days}`;
}

export function formatMinutesLocalized(
  totalMinutes: number,
  lang: LanguageCode = getCurrentLanguage()
): string {
  const safe = Math.max(0, Math.round(totalMinutes));
  const u = DURATION_UNITS[lang] ?? DURATION_UNITS.en;
  const hrs = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hrs <= 0) return `${mins} ${u.min}`;
  if (mins === 0) return `${hrs}${u.hrShort}`;
  return `${hrs}${u.hrShort} ${mins} ${u.min}`;
}
