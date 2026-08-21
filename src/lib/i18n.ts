/**
 * Simple, high-performance i18n Translation Dictionary for Smart Hospital
 */

export type Language = 'en' | 'hi';

export const translations = {
  en: {
    // Navigation
    patient: "Patient",
    doctor: "Doctor",
    admin: "Admin",
    tvDisplay: "TV Display",
    aiAssistant: "AI Assistant",
    login: "Login",
    signUp: "Sign Up",
    logout: "Logout",
    queueSystem: "Queue System",
    
    // Patient Dashboard
    goodMorning: "Good Morning",
    goodAfternoon: "Good Afternoon",
    goodEvening: "Good Evening",
    welcome: "Welcome",
    overview: "Here is your health dashboard overview",
    findHospital: "Find Hospital",
    findHospitalDesc: "Browse hospitals",
    findDoctor: "Find Doctor",
    findDoctorDesc: "Search doctors",
    appointments: "Appointments",
    appointmentsDesc: "Book & manage",
    symptomCheck: "Symptom check",
    liveQueueStatus: "Live Queue Status",
    yourToken: "Your Token",
    nowServing: "Serving",
    peopleAhead: "Ahead",
    estWait: "Wait",
    trackLiveQueue: "Track Live Queue →",
    noActiveToken: "No Active Token",
    bookNow: "Book Now",
    recentAppointments: "Recent Appointments",
    viewAll: "View All →",
    healthTips: "💡 Health Tips",
    
    // AI Assistant
    aiTitle: "AI Symptom Assistant",
    aiSubtitle: "Describe your symptoms or speak using microphone to get department guidance.",
    describeSymptoms: "Describe your symptoms (e.g., headache, fever, chest pain)...",
    listening: "🎙️ Listening... Speak now",
    send: "Send",
    aiDisclaimer: "This AI assistant is for OPD navigation only. It cannot diagnose or treat emergencies.",
  },
  hi: {
    // Navigation
    patient: "मरीज़ (Patient)",
    doctor: "डॉक्टर (Doctor)",
    admin: "एडमिन (Admin)",
    tvDisplay: "TV डिस्प्ले",
    aiAssistant: "AI सहायक",
    login: "लॉगिन",
    signUp: "साइन अप",
    logout: "लॉगआउट",
    queueSystem: "कतार प्रणाली",
    
    // Patient Dashboard
    goodMorning: "शुभ प्रभात",
    goodAfternoon: "शुभ दोपहर",
    goodEvening: "शुभ संध्या",
    welcome: "स्वागत है",
    overview: "यहाँ आपके स्वास्थ्य डैशबोर्ड का विवरण है",
    findHospital: "अस्पताल खोजें",
    findHospitalDesc: "अस्पतालों की सूची देखें",
    findDoctor: "डॉक्टर खोजें",
    findDoctorDesc: "विशेषज्ञ डॉक्टर खोजें",
    appointments: "अपॉइंटमेंट्स",
    appointmentsDesc: "बुक व प्रबंधित करें",
    symptomCheck: "लक्षण जांचें",
    liveQueueStatus: "लाइव कतार स्थिति",
    yourToken: "आपका टोकन",
    nowServing: "चल रहा",
    peopleAhead: "आगे लोग",
    estWait: "अनुमानित समय",
    trackLiveQueue: "लाइव कतार ट्रैक करें →",
    noActiveToken: "कोई सक्रिय टोकन नहीं",
    bookNow: "अभी बुक करें",
    recentAppointments: "हालिया अपॉइंटमेंट्स",
    viewAll: "सभी देखें →",
    healthTips: "💡 स्वास्थ्य सलाह",
    
    // AI Assistant
    aiTitle: "AI लक्षण सहायक",
    aiSubtitle: "अपने लक्षण बताएं या माइक से बोलकर सही विभाग की जानकारी प्राप्त करें।",
    describeSymptoms: "अपने लक्षण बताएं (जैसे: सिरदर्द, बुखार, सीने में दर्द)...",
    listening: "🎙️ सुन रहा हूँ... बोलिए",
    send: "भेजें",
    aiDisclaimer: "यह AI सहायक केवल OPD विभाग मार्गदर्शन के लिए है। आपातकाल में तुरंत 108 पर संपर्क करें।",
  },
};

export function getTranslation(key: keyof typeof translations['en'], lang: Language = 'en'): string {
  return translations[lang]?.[key] || translations['en'][key] || key;
}
