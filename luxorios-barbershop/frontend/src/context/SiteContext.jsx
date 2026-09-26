import { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { tenantHeaders } from "../api/tenant";

const messages = {
  ar: {
    language: "اللغة", login: "تسجيل الدخول", signup: "إنشاء حساب", appointments: "المواعيد",
    users: "المستخدمون", settings: "الإعدادات", logout: "تسجيل الخروج", welcome: "أهلاً بعودتك",
    loginIntro: "ادخل إلى حسابك لإدارة مواعيدك وحجوزاتك.", phone: "رقم الهاتف", password: "كلمة المرور",
    join: "انضم إلينا", signupIntro: "أنشئ حسابك واحجز موعدك خلال دقائق.", name: "الاسم",
    haveAccount: "لديك حساب؟", heroTitle: "العناية التي تليق بتفاصيلك", heroText: "حجز سهل، خدمة دقيقة، وتجربة صُممت لراحتك.",
    appointmentsIntro: "تابع حجوزاتك القادمة أو اختر موعداً جديداً يناسبك.", newBooking: "حجز موعد جديد",
    notifications: "تفعيل الإشعارات", date: "التاريخ", time: "الوقت", booking: "حجز موعد",
    customerName: "اسم العميل", available: "متاح", moderate: "متوسط", busy: "مزدحم", loading: "جاري التحميل...",
    confirmBooking: "تأكيد الحجز", appointmentDetails: "تفاصيل الموعد", call: "اتصال", whatsapp: "واتساب",
    deleteAppointment: "حذف الموعد", close: "إغلاق", usersIntro: "راجع الحسابات وتحكم بصلاحية الوصول من مكان واحد.",
    activateAll: "تفعيل الكل", deactivateAll: "إلغاء تفعيل الكل", status: "الحالة", action: "الإجراء",
    active: "مفعل", pending: "بانتظار الموافقة", activate: "تفعيل", deactivate: "إلغاء التفعيل",
    settingsIntro: "خصص هوية الموقع ومظهره لجميع المستخدمين.", shopName: "اسم الصالون", primaryColor: "اللون الرئيسي",
    accentColor: "لون التمييز", surfaceColor: "لون البطاقات", background: "الخلفية", save: "حفظ التغييرات",
    saved: "تم حفظ الإعدادات", unauthorized: "غير مصرح", sand: "رملي", sage: "أخضر هادئ", charcoal: "فحمي", classic: "كلاسيكي",
    resetTheme: "إعادة الألوان الافتراضية", installApp: "تثبيت التطبيق", allFields: "يرجى تعبئة جميع الحقول",
    signupFailed: "تعذر إنشاء الحساب", signupSuccess: "تم إنشاء الحساب بنجاح", loginFailed: "فشل تسجيل الدخول",
    appointmentsLoadError: "تعذر تحميل المواعيد", slotsLoadError: "تعذر تحميل الأوقات", selectDateTime: "يرجى اختيار اليوم والوقت",
    bookedSuccess: "تم تأكيد الحجز", bookingFailed: "فشل الحجز", deleteConfirm: "هل أنت متأكد من حذف الموعد؟",
    deletedSuccess: "تم حذف الموعد", appointmentMissing: "الموعد غير موجود. تم تحديث القائمة.", deleteFailed: "فشل حذف الموعد",
    notificationsSuccess: "تم تفعيل الإشعارات", notificationsFailed: "فشل تفعيل الإشعارات", noPhoneBooking: "حجز بدون رقم هاتف",
    usersLoadError: "تعذر تحميل المستخدمين", statusUpdateFailed: "فشل تحديث الحالة", activateAllConfirm: "تفعيل جميع المستخدمين؟",
    deactivateAllConfirm: "إلغاء تفعيل جميع المستخدمين؟", usersUpdated: "تم تحديث المستخدمين", bulkUpdateFailed: "فشل التحديث الجماعي",
    rights: "جميع الحقوق محفوظة", reminderHello: "مرحبًا", reminderBody: "نود تذكيرك بموعدك القادم في Luxorius. يرجى مراجعة تفاصيل الموعد داخل التطبيق.", settingsSaveFailed: "تعذر حفظ الإعدادات",
  },
  en: {
    language: "Language", login: "Sign in", signup: "Create account", appointments: "Appointments",
    users: "Users", settings: "Settings", logout: "Sign out", welcome: "Welcome back",
    loginIntro: "Sign in to manage your appointments and bookings.", phone: "Phone number", password: "Password",
    join: "Join us", signupIntro: "Create an account and book in minutes.", name: "Name", haveAccount: "Already registered?",
    heroTitle: "Care crafted around every detail", heroText: "Easy booking, precise service, and an experience designed for comfort.",
    appointmentsIntro: "View upcoming visits or choose a new time that suits you.", newBooking: "Book an appointment",
    notifications: "Enable notifications", date: "Date", time: "Time", booking: "Book appointment", customerName: "Customer name",
    available: "Available", moderate: "Moderate", busy: "Busy", loading: "Loading...", confirmBooking: "Confirm booking",
    appointmentDetails: "Appointment details", call: "Call", whatsapp: "WhatsApp", deleteAppointment: "Delete appointment", close: "Close",
    usersIntro: "Review accounts and manage access from one place.", activateAll: "Activate all", deactivateAll: "Deactivate all",
    status: "Status", action: "Action", active: "Active", pending: "Pending approval", activate: "Activate", deactivate: "Deactivate",
    settingsIntro: "Customize the site identity and appearance for everyone.", shopName: "Barbershop name", primaryColor: "Primary color",
    accentColor: "Accent color", surfaceColor: "Card color", background: "Background", save: "Save changes", saved: "Settings saved",
    unauthorized: "Unauthorized", sand: "Sand", sage: "Calm sage", charcoal: "Charcoal", classic: "Classic",
    resetTheme: "Reset default colors", installApp: "Install app", allFields: "Please complete all fields",
    signupFailed: "Could not create account", signupSuccess: "Account created successfully", loginFailed: "Sign-in failed",
    appointmentsLoadError: "Could not load appointments", slotsLoadError: "Could not load available times", selectDateTime: "Choose a date and time",
    bookedSuccess: "Booking confirmed", bookingFailed: "Booking failed", deleteConfirm: "Are you sure you want to delete this appointment?",
    deletedSuccess: "Appointment deleted", appointmentMissing: "Appointment not found. The list was refreshed.", deleteFailed: "Could not delete appointment",
    notificationsSuccess: "Notifications enabled", notificationsFailed: "Could not enable notifications", noPhoneBooking: "Booking without a phone number",
    usersLoadError: "Could not load users", statusUpdateFailed: "Could not update status", activateAllConfirm: "Activate all users?",
    deactivateAllConfirm: "Deactivate all users?", usersUpdated: "Users updated", bulkUpdateFailed: "Bulk update failed",
    rights: "All rights reserved", reminderHello: "Hello", reminderBody: "This is a reminder for your upcoming Luxorius appointment. Please review the appointment details in the app.", settingsSaveFailed: "Could not save settings",
  },
  he: {
    language: "שפה", login: "כניסה", signup: "יצירת חשבון", appointments: "תורים", users: "משתמשים",
    settings: "הגדרות", logout: "יציאה", welcome: "ברוכים השבים", loginIntro: "היכנסו כדי לנהל את התורים שלכם.",
    phone: "מספר טלפון", password: "סיסמה", join: "הצטרפו אלינו", signupIntro: "צרו חשבון וקבעו תור תוך דקות.",
    name: "שם", haveAccount: "כבר יש לכם חשבון?", heroTitle: "טיפוח שמוקדש לכל פרט", heroText: "הזמנה קלה, שירות מדויק וחוויה נוחה.",
    appointmentsIntro: "צפו בתורים הקרובים או בחרו מועד חדש.", newBooking: "קביעת תור", notifications: "הפעלת התראות",
    date: "תאריך", time: "שעה", booking: "קביעת תור", customerName: "שם הלקוח", available: "פנוי", moderate: "בינוני",
    busy: "עמוס", loading: "טוען...", confirmBooking: "אישור התור", appointmentDetails: "פרטי התור", call: "שיחה",
    whatsapp: "WhatsApp", deleteAppointment: "מחיקת התור", close: "סגירה", usersIntro: "ניהול חשבונות והרשאות במקום אחד.",
    activateAll: "הפעלת הכול", deactivateAll: "השבתת הכול", status: "סטטוס", action: "פעולה", active: "פעיל",
    pending: "ממתין לאישור", activate: "הפעלה", deactivate: "השבתה", settingsIntro: "התאימו את זהות האתר והמראה לכל המשתמשים.",
    shopName: "שם המספרה", primaryColor: "צבע ראשי", accentColor: "צבע הדגשה", surfaceColor: "צבע כרטיסים",
    background: "רקע", save: "שמירת שינויים", saved: "ההגדרות נשמרו", unauthorized: "אין הרשאה",
    sand: "חול", sage: "ירוק רגוע", charcoal: "פחם", classic: "קלאסי",
    resetTheme: "איפוס צבעי ברירת מחדל", installApp: "התקנת האפליקציה", allFields: "נא למלא את כל השדות",
    signupFailed: "לא ניתן ליצור חשבון", signupSuccess: "החשבון נוצר בהצלחה", loginFailed: "הכניסה נכשלה",
    appointmentsLoadError: "לא ניתן לטעון תורים", slotsLoadError: "לא ניתן לטעון שעות פנויות", selectDateTime: "בחרו תאריך ושעה",
    bookedSuccess: "התור אושר", bookingFailed: "קביעת התור נכשלה", deleteConfirm: "למחוק את התור?",
    deletedSuccess: "התור נמחק", appointmentMissing: "התור לא נמצא. הרשימה עודכנה.", deleteFailed: "לא ניתן למחוק את התור",
    notificationsSuccess: "ההתראות הופעלו", notificationsFailed: "לא ניתן להפעיל התראות", noPhoneBooking: "תור ללא מספר טלפון",
    usersLoadError: "לא ניתן לטעון משתמשים", statusUpdateFailed: "לא ניתן לעדכן סטטוס", activateAllConfirm: "להפעיל את כל המשתמשים?",
    deactivateAllConfirm: "להשבית את כל המשתמשים?", usersUpdated: "המשתמשים עודכנו", bulkUpdateFailed: "העדכון הקבוצתי נכשל",
    rights: "כל הזכויות שמורות", reminderHello: "שלום", reminderBody: "תזכורת לתור הקרוב שלכם ב-Luxorius. פרטי התור זמינים באפליקציה.", settingsSaveFailed: "לא ניתן לשמור הגדרות",
  },
};

Object.assign(messages.en,{bookAppointment:"Book an Appointment",fullName:"Full name",selectService:"Select service",haircut:"Haircut",beardTrim:"Beard trim",shave:"Shave",bookNow:"Book now",bookingSubmitted:"Booking submitted",vipMembership:"VIP membership",vipMember:"You are a VIP member!",priorityBookings:"Priority bookings",exclusiveDiscounts:"Exclusive product discounts",specialOffers:"Special offers and events",notVip:"You are not a VIP member yet. Join now to enjoy exclusive benefits!",ourProducts:"Our products",noProducts:"No products available",yourName:"Your name",yourPhone:"Your phone number"});
Object.assign(messages.ar,{bookAppointment:"حجز موعد",fullName:"الاسم الكامل",selectService:"اختر الخدمة",haircut:"قص الشعر",beardTrim:"تشذيب اللحية",shave:"حلاقة",bookNow:"احجز الآن",bookingSubmitted:"تم إرسال الحجز",vipMembership:"عضوية VIP",vipMember:"أنت عضو VIP!",priorityBookings:"أولوية الحجز",exclusiveDiscounts:"خصومات حصرية على المنتجات",specialOffers:"عروض وفعاليات خاصة",notVip:"لست عضو VIP بعد. انضم الآن للاستفادة من المزايا الحصرية!",ourProducts:"منتجاتنا",noProducts:"لا توجد منتجات متاحة",yourName:"اسمك",yourPhone:"رقم هاتفك"});
Object.assign(messages.he,{bookAppointment:"קביעת תור",fullName:"שם מלא",selectService:"בחירת שירות",haircut:"תספורת",beardTrim:"סידור זקן",shave:"גילוח",bookNow:"קביעת תור",bookingSubmitted:"התור נשלח",vipMembership:"חברות VIP",vipMember:"אתם חברי VIP!",priorityBookings:"עדיפות בקביעת תורים",exclusiveDiscounts:"הנחות בלעדיות על מוצרים",specialOffers:"מבצעים ואירועים מיוחדים",notVip:"עדיין אינכם חברי VIP. הצטרפו עכשיו להטבות בלעדיות!",ourProducts:"המוצרים שלנו",noProducts:"אין מוצרים זמינים",yourName:"השם שלכם",yourPhone:"מספר הטלפון שלכם"});

// Shared exports are intentional: consumers use both the provider and defaults.
// eslint-disable-next-line react-refresh/only-export-components
export const defaultSettings = { shop_name: "Luxorius", primary_color: "#3f5b4c", accent_color: "#9a783d", surface_color: "#fbfaf7", background_style: "sand" };
const defaults = defaultSettings;
const SiteContext = createContext(null);

export function SiteProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem("language") || "ar");
  const [settings, setSettings] = useState(defaults);

  const setLanguage = (value) => {
    localStorage.setItem("language", value);
    setLanguageState(value);
    window.location.reload();
  };

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/settings`,{headers:tenantHeaders}).then(({ data }) => setSettings(data)).catch(() => {});
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dir = language === "en" ? "ltr" : "rtl";
    root.style.setProperty("--forest", settings.primary_color);
    root.style.setProperty("--forest-dark", settings.primary_color);
    root.style.setProperty("--brand-accent", settings.accent_color);
    root.style.setProperty("--cream", settings.surface_color);
    root.dataset.background = settings.background_style;
    document.title = settings.shop_name;
  }, [language, settings]);

  const value = useMemo(() => ({ language, setLanguage, settings, setSettings, t: (key) => messages[language]?.[key] || messages.en[key] || key }), [language, settings]);
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSite = () => useContext(SiteContext);
