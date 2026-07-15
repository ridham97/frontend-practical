import type { EventKey, InviteType, Lang, WeddingSettings } from "./types";

/** Convert western digits to Gujarati numerals. */
export function guDigits(value: string): string {
  const map: Record<string, string> = {
    "0": "૦", "1": "૧", "2": "૨", "3": "૩", "4": "૪",
    "5": "૫", "6": "૬", "7": "૭", "8": "૮", "9": "૯",
  };
  return value.replace(/[0-9]/g, (d) => map[d]);
}

/** Fixed labels that frame the editable content. */
export const TEXTS = {
  ganeshEn: "|| Shree Ganeshay Namah ||",
  ganeshGu: "|| શ્રી ગણેશાય નમઃ ||",
  toEn: "To,",
  toGu: "સ્નેહીશ્રી,",
  weddingOfEn: "The Wedding Of",
  weddingOfGu: "શુભ વિવાહ",
  invitationEn: "Wedding Invitation",
  invitationGu: "લગ્નોત્સવ",
  withEn: "weds",
  withGu: "ના શુભ લગ્ન",
  awaitingEn: "Awaiting Your Presence",
  awaitingGu: "દર્શનાભિલાષી",
  withLoveEn: "With Love",
  withLoveGu: "મધુર ટહુકો",
  bestWishesEn: "Best Wishes",
  bestWishesGu: "શુભેચ્છક",
  venueLabelEn: "Venue",
  venueLabelGu: "સ્થળ",
  viewLocationEn: "📍 View Location",
  viewLocationGu: "📍 લોકેશન જુઓ",
};

/** Everything printed on the invitation, fully editable in the studio form. */
export const DEFAULT_SETTINGS: WeddingSettings = {
  brideEn: "Amee",
  brideGu: "અમી",
  groomEn: "Ridham",
  groomGu: "રિધમ",
  brideFirst: true,
  brideParentsEn: "D/O Mrs. Seemaben & Mr. Kishorbhai Kasondra",
  brideParentsGu: "શ્રીમતી સીમાબેન તથા શ્રી કિશોરભાઈ કાસોન્દ્રાની સુપુત્રી",
  groomParentsEn: "S/O Mrs. Hansaben & Mr. Rameshbhai Sherathiya",
  groomParentsGu: "શ્રીમતી હંસાબેન તથા શ્રી રમેશભાઈ શેરઠિયાના સુપુત્ર",

  datesEn: "28 & 29 January 2027",
  datesGu: "તા. ૨૮ તથા ૨૯ જાન્યુઆરી ૨૦૨૭",
  cityEn: "Rajkot, Gujarat",
  cityGu: "રાજકોટ, ગુજરાત",

  venueNameEn: "OTB Rajkot",
  venueNameGu: "ઓ.ટી.બી. રાજકોટ",
  venueAddressEn: "Nyari Dam 1 Road, Kalavad Road, Rajkot, Gujarat 360005",
  venueAddressGu: "ન્યારી ડેમ ૧ રોડ, કાલાવડ રોડ, રાજકોટ, ગુજરાત ૩૬૦૦૦૫",
  mapsUrl: "https://maps.app.goo.gl/YYAmwTaVeNr1HDDB8",

  blessingEn:
    "With the blessings of the Almighty and our elders, we solicit your gracious presence and blessings for the wedding celebrations of our beloved children.",
  blessingGu:
    "શ્રી ગણેશજી તથા વડીલોના આશીર્વાદથી, સહર્ષ જણાવવાનું કે અમારા આંગણે શુભ લગ્નોત્સવ નિર્ધારેલ છે. આ મંગલ પ્રસંગે નવદંપતિને આશીર્વાદ આપવા આપ સહપરિવાર પધારો એવું અમારું હાર્દિક નિમંત્રણ છે.",
  poemEn:
    "Two hearts, two families, one beautiful journey begins. Your presence will add fragrance to our celebration.",
  poemGu:
    "અમારા આંગણે લગ્ન લેવાય છે, ને આપની હાજરીથી સુગંધ ફેલાય છે. નિમંત્રણ નથી આ શબ્દોનું, પણ હૈયાનો કેરો સાદ — પધારશો જી!",
  closingEn: "Your presence and blessings are our greatest gift.",
  closingGu: "આપના આશીર્વાદ એ જ અમારી શોભા.",

  events: {
    mandvo: {
      titleEn: "Mandvo",
      titleGu: "માંડવો",
      taglineEn: "The auspicious beginning",
      taglineGu: "શુભ પ્રસંગની મંગલ શરૂઆત",
      dateEn: "Thursday, 28 January 2027",
      dateGu: "તા. ૨૮-૦૧-૨૦૨૭ ગુરુવાર",
      timeEn: "Morning · 9:00 AM",
      timeGu: "સવારે ૯:૦૦ કલાકે",
    },
    haldi: {
      titleEn: "Haldi",
      titleGu: "હળદી",
      taglineEn: "A golden glow of blessings",
      taglineGu: "આશીર્વાદની સોનેરી ઝળક",
      dateEn: "Thursday, 28 January 2027",
      dateGu: "તા. ૨૮-૦૧-૨૦૨૭ ગુરુવાર",
      timeEn: "Morning · 11:00 AM",
      timeGu: "સવારે ૧૧:૦૦ કલાકે",
    },
    sanji: {
      titleEn: "Sanji",
      titleGu: "સાંજી",
      taglineEn: "A night of music & garba",
      taglineGu: "સંગીત અને ગરબાની રઢિયાળી રાત",
      dateEn: "Thursday, 28 January 2027",
      dateGu: "તા. ૨૮-૦૧-૨૦૨૭ ગુરુવાર",
      timeEn: "Evening · 7:00 PM",
      timeGu: "સાંજે ૭:૦૦ કલાકે",
    },
    marriage: {
      titleEn: "Marriage",
      titleGu: "લગ્ન",
      taglineEn: "The wedding ceremony",
      taglineGu: "શુભ લગ્ન · હસ્તમેળાપ",
      dateEn: "Friday, 29 January 2027",
      dateGu: "તા. ૨૯-૦૧-૨૦૨૭ શુક્રવાર",
      timeEn: "Hast Melap · 12:15 PM",
      timeGu: "હસ્તમેળાપ · બપોરે ૧૨:૧૫ કલાકે",
    },
  },

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

/** Names in the couple's chosen order for a given language. */
export function coupleNames(settings: WeddingSettings, lang: Lang): [string, string] {
  const bride = lang === "gujarati" ? settings.brideGu : settings.brideEn;
  const groom = lang === "gujarati" ? settings.groomGu : settings.groomEn;
  return settings.brideFirst ? [bride, groom] : [groom, bride];
}

/** Merge a stored (possibly older-shaped) settings blob onto the defaults. */
export function normalizeSettings(raw: unknown): WeddingSettings {
  const base: WeddingSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as WeddingSettings;
  if (!raw || typeof raw !== "object") return base;
  const src = raw as Record<string, unknown>;
  for (const key of Object.keys(base) as Array<keyof WeddingSettings>) {
    const value = src[key];
    if (value === undefined || value === null) continue;
    if (key === "events" && typeof value === "object") {
      for (const ek of Object.keys(base.events) as EventKey[]) {
        const ev = (value as Record<string, unknown>)[ek];
        if (ev && typeof ev === "object") {
          base.events[ek] = { ...base.events[ek], ...(ev as object) } as WeddingSettings["events"][EventKey];
        }
      }
    } else if (Array.isArray(base[key]) ? Array.isArray(value) : typeof value === typeof base[key]) {
      (base as unknown as Record<string, unknown>)[key] = value;
    }
  }
  // migrate the old flat marriage-time fields if present
  if (typeof src.marriageTimeEn === "string" && src.marriageTimeEn) base.events.marriage.timeEn = src.marriageTimeEn;
  if (typeof src.marriageTimeGu === "string" && src.marriageTimeGu) base.events.marriage.timeGu = src.marriageTimeGu;
  return base;
}

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

/** Per-event background artwork (design assets, not user content). */
export const EVENT_BG: Record<EventKey, string> = {
  mandvo: "/assets/invite/event-mandvo.jpg",
  haldi: "/assets/invite/event-haldi.jpg",
  sanji: "/assets/invite/event-sanji.jpg",
  marriage: "/assets/invite/event-marriage.jpg",
};

export const ASSETS = {
  cover: "/assets/invite/cover.jpg",
  interior: "/assets/invite/interior.jpg",
  family: "/assets/invite/family.jpg",
  monogram: "/assets/invite/monogram.png",
  banner: "/assets/invite/banner.jpg",
};

/** WhatsApp message that travels with the PDF. */
export function whatsappMessage(name: string, inviteType: InviteType, lang: Lang, settings: WeddingSettings): string {
  const line = guestLine(name, inviteType, lang);
  const [first, second] = coupleNames(settings, lang);
  if (lang === "gujarati") {
    return (
      "🌺 || શ્રી ગણેશાય નમઃ || 🌺\n\n" +
      line + ",\n\n" +
      "અમારા આંગણે શુભ લગ્નોત્સવ!\n\n" +
      "💍 *" + first + " ♥ " + second + "* 💍\n" +
      "📅 " + settings.datesGu + "\n" +
      "📍 " + settings.venueNameGu + ", " + settings.cityGu + "\n\n" +
      "આપનું અંગત આમંત્રણ પત્રિકા સાથે જોડેલ છે. આ મંગલ પ્રસંગે આપ સહપરિવાર પધારી નવદંપતિને આશીર્વાદ આપશો એવી હાર્દિક વિનંતી.\n\n" +
      "— " + (settings.brideFirst ? settings.brideGu : settings.groomGu) + " તથા " + (settings.brideFirst ? settings.groomGu : settings.brideGu) + "ના પરિવાર"
    );
  }
  return (
    "🌺 || Shree Ganeshay Namah || 🌺\n\n" +
    "Dear " + line + ",\n\n" +
    "With the blessings of our elders, we joyfully invite you to the wedding celebrations of\n\n" +
    "💍 *" + first + " ♥ " + second + "* 💍\n" +
    "📅 " + settings.datesEn + "\n" +
    "📍 " + settings.venueNameEn + ", " + settings.cityEn + "\n\n" +
    "Your personal invitation is attached. Your presence and blessings are our greatest gift.\n\n" +
    "— The " + first + " & " + second + " families"
  );
}
