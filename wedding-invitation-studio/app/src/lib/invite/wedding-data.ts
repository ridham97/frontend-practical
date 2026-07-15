import type { EventKey, InviteType, Lang, WeddingSettings } from "./types";

/** Convert western digits to Gujarati numerals. */
export function guDigits(value: string): string {
  const map: Record<string, string> = {
    "0": "૦", "1": "૧", "2": "૨", "3": "૩", "4": "૪",
    "5": "૫", "6": "૬", "7": "૭", "8": "૮", "9": "૯",
  };
  return value.replace(/[0-9]/g, (d) => map[d]);
}

export const COUPLE = {
  groomEn: "Ridham",
  groomGu: "રિધમ",
  groomParentsEn: "S/O Mrs. Hansaben & Mr. Rameshbhai Sherathiya",
  groomParentsGu: "શ્રીમતી હંસાબેન તથા શ્રી રમેશભાઈ શેરઠિયાના સુપુત્ર",
  brideEn: "Amee",
  brideGu: "અમી",
  brideParentsEn: "D/O Mrs. Seemaben & Mr. Kishorbhai Kasondra",
  brideParentsGu: "શ્રીમતી સીમાબેન તથા શ્રી કિશોરભાઈ કાસોન્દ્રાની સુપુત્રી",
  familyEn: "Sherathiya Family",
  familyGu: "શેરઠિયા પરિવાર",
  datesEn: "28 & 29 January 2027",
  datesGu: "તા. " + guDigits("28") + " તથા " + guDigits("29") + " જાન્યુઆરી " + guDigits("2027"),
  cityEn: "Rajkot, Gujarat",
  cityGu: "રાજકોટ, ગુજરાત",
};

export const VENUE = {
  nameEn: "OTB Rajkot",
  nameGu: "ઓ.ટી.બી. રાજકોટ",
  addressEn: "Nyari Dam 1 Road, Kalavad Road, Rajkot, Gujarat 360005",
  addressGu: "ન્યારી ડેમ ૧ રોડ, કાલાવડ રોડ, રાજકોટ, ગુજરાત ૩૬૦૦૦૫",
  mapsUrl: "https://maps.google.com/?q=OTB+Rajkot+Nyari+Dam+1+Road+Kalavad+Road+Rajkot",
};

export interface EventInfo {
  key: EventKey;
  titleEn: string;
  titleGu: string;
  taglineEn: string;
  taglineGu: string;
  dayNumber: string;      // "28"
  monthYearEn: string;    // "JAN 2027"
  weekdayEn: string;      // "THURSDAY"
  dateGu: string;         // "તા. ૨૮-૦૧-૨૦૨૭ ગુરુવાર"
  timeEn: string;
  timeGu: string;
  descriptionEn: string;
  descriptionGu: string;
  bg: string;             // asset path
}

export const EVENTS: Record<EventKey, EventInfo> = {
  mandvo: {
    key: "mandvo",
    titleEn: "Mandvo",
    titleGu: "માંડવો",
    taglineEn: "The auspicious beginning",
    taglineGu: "શુભ પ્રસંગની મંગલ શરૂઆત",
    dayNumber: "28",
    monthYearEn: "JANUARY 2027",
    weekdayEn: "THURSDAY",
    dateGu: "તા. " + guDigits("28-01-2027") + " ગુરુવાર",
    timeEn: "Morning · 9:00 AM",
    timeGu: "સવારે ૯:૦૦ કલાકે",
    descriptionEn:
      "Under a canopy of fresh greens and white blooms, the sacred mandvo is raised and Lord Ganesha is invoked. The celebrations officially begin.",
    descriptionGu:
      "લીલાં તોરણ અને શ્વેત પુષ્પોની છાયામાં પવિત્ર માંડવો રોપાય છે અને શ્રી ગણેશજીનું સ્થાપન થાય છે. શુભ પ્રસંગનો મંગલ આરંભ.",
    bg: "/assets/invite/event-mandvo.jpg",
  },
  haldi: {
    key: "haldi",
    titleEn: "Haldi",
    titleGu: "હળદી",
    taglineEn: "A golden glow of blessings",
    taglineGu: "આશીર્વાદની સોનેરી ઝળક",
    dayNumber: "28",
    monthYearEn: "JANUARY 2027",
    weekdayEn: "THURSDAY",
    dateGu: "તા. " + guDigits("28-01-2027") + " ગુરુવાર",
    timeEn: "Morning · 11:00 AM",
    timeGu: "સવારે ૧૧:૦૦ કલાકે",
    descriptionEn:
      "Amidst marigolds and laughter, turmeric is showered on the bride and groom, for luck, for glow, for love.",
    descriptionGu:
      "ગલગોટાનાં ફૂલો અને હાસ્ય વચ્ચે વર-કન્યાને હળદર ચડાવાય છે — સૌભાગ્ય, તેજ અને પ્રેમ માટે.",
    bg: "/assets/invite/event-haldi.jpg",
  },
  sanji: {
    key: "sanji",
    titleEn: "Sanji",
    titleGu: "સાંજી",
    taglineEn: "A night of music & garba",
    taglineGu: "સંગીત અને ગરબાની રઢિયાળી રાત",
    dayNumber: "28",
    monthYearEn: "JANUARY 2027",
    weekdayEn: "THURSDAY",
    dateGu: "તા. " + guDigits("28-01-2027") + " ગુરુવાર",
    timeEn: "Evening · 7:00 PM",
    timeGu: "સાંજે ૭:૦૦ કલાકે",
    descriptionEn:
      "When the sun sets, a thousand golden lights take over — dhol, garba and sangeet under a glittering night sky. Bring your best moves.",
    descriptionGu:
      "સૂર્યાસ્ત પછી હજારો સોનેરી દીવડાઓ ઝગમગે છે — ઢોલ, ગરબા અને સંગીતની રમઝટ. તૈયાર રહેજો!",
    bg: "/assets/invite/event-sanji.jpg",
  },
  marriage: {
    key: "marriage",
    titleEn: "Marriage",
    titleGu: "લગ્ન",
    taglineEn: "The wedding ceremony",
    taglineGu: "શુભ લગ્ન · હસ્તમેળાપ",
    dayNumber: "29",
    monthYearEn: "JANUARY 2027",
    weekdayEn: "FRIDAY",
    dateGu: "તા. " + guDigits("29-01-2027") + " શુક્રવાર",
    timeEn: "Hast Melap · 12:15 PM",
    timeGu: "હસ્તમેળાપ · બપોરે ૧૨:૧૫ કલાકે",
    descriptionEn:
      "Beneath a mandap woven entirely of flowers, Amee and Ridham take the four sacred pheras — four vows, one lifetime together.",
    descriptionGu:
      "ફૂલોથી શણગારેલા મંડપ નીચે અમી અને રિધમ ચાર પવિત્ર ફેરા લેશે — ચાર વચન, જીવનભરનો સાથ.",
    bg: "/assets/invite/event-marriage.jpg",
  },
};

export const SALUTATIONS: Record<InviteType, { en: string; gu: string }> = {
  mr: { en: "Mr.", gu: "શ્રી" },
  mrmrs: { en: "Mr. & Mrs.", gu: "શ્રી તથા શ્રીમતી" },
  family: { en: "", gu: "" },
};

/** Guest line as printed on the cover, e.g. "Mr. & Mrs. Ramesh Patel" or "Ramesh Patel & Family". */
export function guestLine(name: string, inviteType: InviteType, lang: Lang): string {
  if (lang === "gujarati") {
    if (inviteType === "mr") return "શ્રી " + name;
    if (inviteType === "mrmrs") return "શ્રી તથા શ્રીમતી " + name;
    return name + " તથા સહપરિવાર";
  }
  if (inviteType === "mr") return "Mr. " + name;
  if (inviteType === "mrmrs") return "Mr. & Mrs. " + name;
  return name + " & Family";
}

export const TEXTS = {
  ganeshEn: "|| Shree Ganeshay Namah ||",
  ganeshGu: "|| શ્રી ગણેશાય નમઃ ||",
  umiyaGu: "|| શ્રી ઉમિયા માતાજી નમઃ ||",
  toEn: "To,",
  toGu: "સ્નેહીશ્રી,",
  weddingOfEn: "The Wedding Of",
  weddingOfGu: "શુભ વિવાહ",
  invitationEn: "Wedding Invitation",
  invitationGu: "લગ્નોત્સવ",
  withEn: "weds",
  withGu: "ના શુભ લગ્ન",
  blessingEn:
    "With the blessings of the Almighty and our elders, we solicit your gracious presence and blessings for the wedding celebrations of our beloved children.",
  blessingGu:
    "શ્રી ગણેશજી તથા વડીલોના આશીર્વાદથી, સહર્ષ જણાવવાનું કે અમારા આંગણે શુભ લગ્નોત્સવ નિર્ધારેલ છે. આ મંગલ પ્રસંગે નવદંપતિને આશીર્વાદ આપવા આપ સહપરિવાર પધારો એવું અમારું હાર્દિક નિમંત્રણ છે.",
  poemEn:
    "Two hearts, two families — one beautiful journey begins. Your presence will add fragrance to our celebration.",
  poemGu:
    "અમારા આંગણે લગ્ન લેવાય છે, ને આપની હાજરીથી સુગંધ ફેલાય છે. નિમંત્રણ નથી આ શબ્દોનું, પણ હૈયાનો કેરો સાદ — પધારશો જી!",
  awaitingEn: "Awaiting Your Presence",
  awaitingGu: "દર્શનાભિલાષી",
  withLoveEn: "With Love",
  withLoveGu: "મધુર ટહુકો",
  bestWishesEn: "Best Wishes",
  bestWishesGu: "શુભેચ્છક",
  closingEn: "Your presence and blessings are our greatest gift.",
  closingGu: "આપના આશીર્વાદ એ જ અમારી શોભા.",
  venueLabelEn: "Venue",
  venueLabelGu: "સ્થળ",
  allEventsVenueEn: "All events will be held at the same venue.",
  allEventsVenueGu: "તમામ પ્રસંગો એક જ સ્થળે યોજાશે.",
  welcomeEn: "warmly welcomes you",
  welcomeGu: "આપનું હાર્દિક સ્વાગત કરે છે",
};

export const DEFAULT_SETTINGS: WeddingSettings = {
  marriageTimeEn: EVENTS.marriage.timeEn,
  marriageTimeGu: EVENTS.marriage.timeGu,
  awaitingEn: [
    "Mrs. Hansaben & Mr. Rameshbhai Sherathiya",
    "Mrs. Ramilaben & Mr. Jayeshbhai Sherathiya",
    "Mrs. Nitaben & Mr. Mehulbhai Sherathiya",
    "Mrs. Seemaben & Mr. Kishorbhai Kasondra",
    "All Sherathiya & Kasondra Family",
  ],
  awaitingGu: [
    "શ્રીમતી હંસાબેન તથા શ્રી રમેશભાઈ શેરઠિયા",
    "શ્રીમતી રમીલાબેન તથા શ્રી જયેશભાઈ શેરઠિયા",
    "શ્રીમતી નીતાબેન તથા શ્રી મેહુલભાઈ શેરઠિયા",
    "શ્રીમતી સીમાબેન તથા શ્રી કિશોરભાઈ કાસોન્દ્રા",
    "સમસ્ત શેરઠિયા તથા કાસોન્દ્રા પરિવાર",
  ],
  withLoveEn: ["Dhruvi", "Kavya", "Aarav"],
  withLoveGu: ["ધ્રુવી", "કાવ્યા", "આરવ"],
  bestWishesEn: ["Sherathiya Group", "Shreeji Enterprise, Rajkot"],
  bestWishesGu: ["શેરઠિયા ગ્રુપ", "શ્રીજી એન્ટરપ્રાઇઝ, રાજકોટ"],
  waToken: "",
  waPhoneId: "",
};

export const ASSETS = {
  cover: "/assets/invite/cover.jpg",
  interior: "/assets/invite/interior.jpg",
  family: "/assets/invite/family.jpg",
  monogram: "/assets/invite/monogram.png",
  banner: "/assets/invite/banner.jpg",
};

/** WhatsApp message that travels with the PDF. */
export function whatsappMessage(name: string, inviteType: InviteType, lang: Lang): string {
  const line = guestLine(name, inviteType, lang);
  if (lang === "gujarati") {
    return (
      "🌺 || શ્રી ગણેશાય નમઃ || 🌺\n\n" +
      line + ",\n\n" +
      "અમારા આંગણે શુભ લગ્નોત્સવ!\n\n" +
      "💍 *અમી ♥ રિધમ* 💍\n" +
      "📅 તા. ૨૮ તથા ૨૯ જાન્યુઆરી ૨૦૨૭\n" +
      "📍 ઓ.ટી.બી., રાજકોટ\n\n" +
      "આપનું અંગત આમંત્રણ પત્રિકા સાથે જોડેલ છે. આ મંગલ પ્રસંગે આપ સહપરિવાર પધારી નવદંપતિને આશીર્વાદ આપશો એવી હાર્દિક વિનંતી.\n\n" +
      "— શેરઠિયા પરિવાર"
    );
  }
  return (
    "🌺 || Shree Ganeshay Namah || 🌺\n\n" +
    "Dear " + line + ",\n\n" +
    "With the blessings of our elders, we joyfully invite you to the wedding celebrations of\n\n" +
    "💍 *Amee ♥ Ridham* 💍\n" +
    "📅 28 & 29 January 2027\n" +
    "📍 OTB, Rajkot\n\n" +
    "Your personal invitation is attached. Your presence and blessings are our greatest gift.\n\n" +
    "— Sherathiya Family"
  );
}
