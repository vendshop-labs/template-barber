export type AdminLocale = 'sk' | 'en' | 'uk' | 'cs' | 'de';

export interface AdminTranslations {
  nav: {
    dashboard: string;
    hero: string;
    services: string;
    reservations: string;
    masters: string;
    gallery: string;
    reviews: string;
    products: string;
    orders: string;
    promotions: string;
    menu: string;
    tables: string;
    deliveryZones: string;
    courses: string;
    history: string;
    theme: string;
    ai: string;
    settings: string;
    legal: string;
    logout: string;
  };
  common: {
    save: string;
    saving: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    hide: string;
    show: string;
    upload: string;
    uploading: string;
    loading: string;
    noData: string;
    confirm: string;
  };
  theme: {
    title: string;
    presetsTitle: string;
    presetsSubtitle: string;
    colors: string;
    layout: string;
    heroType: string;
    cardStyle: string;
    navigation: string;
    borderRadius: string;
    saveTheme: string;
    saving: string;
    resetColors: string;
    preview: string;
    colorLabels: Record<string, string>;
    colorDescriptions: Record<string, string>;
  };
  services: {
    title: string;
    addService: string;
    editService: string;
    newService: string;
    nameLabel: string;
    priceLabel: string;
    durationLabel: string;
    categoryLabel: string;
    descriptionLabel: string;
    noServices: string;
    confirmDelete: string;
    names: Record<string, string>;
  };
  reservations: {
    title: string;
    all: string;
    pending: string;
    confirmed: string;
    cancelled: string;
    completed: string;
    noShow: string;
    confirm: string;
    complete: string;
    cancel: string;
    whatsapp: string;
    clearDate: string;
    noReservations: string;
    loading: string;
    statPending: string;
    statConfirmed: string;
    statCompleted: string;
    statCancelled: string;
  };
  settings: {
    title: string;
    tabs: {
      store: string;
      gallery: string;
      masters: string;
      notifications: string;
      security: string;
      schedule: string;
    };
    savingBtn: string;
    saveBtn: string;
    logoLabel: string;
    changeLogo: string;
    uploadLogo: string;
    uploading: string;
    removeLogo: string;
    removeLogoConfirm: string;
    workingHoursLabel: string;
  };
  reviews: {
    title: string;
    approved: string;
    pending: string;
    rejected: string;
    approve: string;
    reject: string;
    reply: string;
  };
  courses: {
    title: string;
    addCourse: string;
    editCourse: string;
    newCourse: string;
    nameLabel: string;
    priceLabel: string;
    videoUrlLabel: string;
    previewLabel: string;
    descriptionLabel: string;
    lessonTextLabel: string;
    noCourses: string;
    confirmDelete: string;
  };
  ai: {
    title: string;
    placeholder: string;
    send: string;
  };
  dashboard: {
    title: string;
    todayAppointments: string;
    totalClients: string;
    pendingReviews: string;
  };
}

// ─── Slovak (primary) ──────────────────────────────────────────────────────
const SK: AdminTranslations = {
  nav: {
    dashboard:    'Prehľad',
    hero:         'Hero sekcia',
    services:     'Služby',
    reservations: 'Rezervácie',
    masters:      'Majstri',
    gallery:      'Galéria',
    reviews:      'Recenzie',
    products:     'Produkty',
    orders:       'Objednávky',
    promotions:   'Akcie',
    menu:         'Jedálny lístok',
    tables:       'Stoly',
    deliveryZones:'Doručovacie zóny',
    courses:      'Kurzy',
    history:      'História',
    theme:        'Téma',
    ai:           'AI správa',
    settings:     'Nastavenia',
    legal:        'Legal (DE)',
    logout:       'Odhlásiť',
  },
  common: {
    save:      'Uložiť zmeny',
    saving:    'Ukladám...',
    cancel:    'Zrušiť',
    delete:    'Zmazať',
    edit:      'Upraviť',
    add:       'Pridať',
    hide:      'Skryť',
    show:      'Zobraziť',
    upload:    'Nahrať',
    uploading: 'Nahrávam...',
    loading:   'Načítavam...',
    noData:    'Žiadne dáta',
    confirm:   'Potvrdiť',
  },
  theme: {
    title:           'Téma',
    presetsTitle:    'Hotové témy',
    presetsSubtitle: 'Vyberte tému ako základ, potom upravte farby nižšie',
    colors:          'Farby',
    layout:          'Rozvrhnutie',
    heroType:        'Typ hero',
    cardStyle:       'Štýl kariet',
    navigation:      'Navigácia',
    borderRadius:    'Zaoblenie rohov',
    saveTheme:       'Uložiť tému',
    saving:          'Ukladám...',
    resetColors:     'Resetovať farby',
    preview:         'Náhľad',
    colorLabels: {
      bg:           'Pozadie',
      primary:      'Primárna',
      primaryDark:  'Primárna tmavá',
      primaryLight: 'Primárna svetlá',
      text:         'Text',
      textSecondary:'Text sekundárny',
      textMuted:    'Text tlmený',
      border:       'Orámovanie',
      bgSubtle:     'Pozadie jemné',
      success:      'Úspech',
      error:        'Chyba',
      contrast:     'Kontrastný text',
      overlay:      'Podklad prekrytia',
      overlayAlpha: 'Prekrytie (rgba)',
      headerBg:     'Hlavička po posune',
    },
    colorDescriptions: {
      bg:           'Farba pozadia stránky',
      primary:      'Tlačidlá, odkazy, akcenty',
      primaryDark:  'Hover / aktívny stav',
      primaryLight: 'Svetlé tint pozadie',
      text:         'Hlavná farba textu',
      textSecondary:'Stlmené štítky',
      textMuted:    'Ešte viac stlmené',
      border:       'Oddeľovače, orámovanie kariet',
      bgSubtle:     'Hover kariet, sekcie',
      success:      'Pozitívne stavy',
      error:        'Negatívne stavy',
      contrast:     'Farba textu na farebných tlačidlách',
      overlay:      'Základná farba prekrytí (hex)',
      overlayAlpha: 'Polopriehľadné prekrytie (rgba)',
      headerBg:     'Pozadie hlavičky po posunutí (rgba)',
    },
  },
  services: {
    title:           'Služby',
    addService:      '+ Pridať službu',
    editService:     'Upraviť službu',
    newService:      'Nová služba',
    nameLabel:       'Názov',
    priceLabel:      'Cena (€)',
    durationLabel:   'Trvanie (min)',
    categoryLabel:   'Kategória',
    descriptionLabel:'Popis',
    noServices:      'Žiadne služby. Pridajte prvú.',
    confirmDelete:   'Vymazať túto službu?',
    names: {
      'services.beard':    'Strihanie brady',
      'services.haircut':  'Strihanie vlasov',
      'services.hairBeard':'Vlasy + Brada',
      'services.styling':  'Styling',
      'services.shave':    'Holenie',
      'services.kids':     'Detský strih',
    },
  },
  reservations: {
    title:          'Rezervácie',
    all:            'Všetky',
    pending:        'Čakajúce',
    confirmed:      'Potvrdené',
    cancelled:      'Zrušené',
    completed:      'Dokončené',
    noShow:         'Neprišiel',
    confirm:        'Potvrdiť',
    complete:       'Dokončiť',
    cancel:         'Zrušiť',
    whatsapp:       'WhatsApp',
    clearDate:      '✕ Všetky dátumy',
    noReservations: 'Žiadne rezervácie',
    loading:        'Načítavam rezervácie...',
    statPending:    'Čakajúce',
    statConfirmed:  'Potvrdené',
    statCompleted:  'Dokončené',
    statCancelled:  'Zrušené',
  },
  settings: {
    title:             'Nastavenia',
    tabs: {
      store:         'Obchod',
      gallery:       'Galéria',
      masters:       'Majstri',
      notifications: 'Notifikácie',
      security:      'Bezpečnosť',
      schedule:      'Rozvrh',
    },
    savingBtn:         'Ukladám...',
    saveBtn:           'Uložiť zmeny',
    logoLabel:         'Logo salóna',
    changeLogo:        'Zmeniť logo',
    uploadLogo:        'Nahrať logo',
    uploading:         'Nahrávam...',
    removeLogo:        'Odstrániť logo',
    removeLogoConfirm: 'Naozaj chcete odstrániť logo? Zobrazí sa textový logotyp.',
    workingHoursLabel: 'Pracovné hodiny',
  },
  reviews: {
    title:    'Recenzie',
    approved: 'Schválené',
    pending:  'Čakajúce',
    rejected: 'Zamietnuté',
    approve:  'Schváliť',
    reject:   'Zamietnuť',
    reply:    'Odpovedať',
  },
  courses: {
    title:           'Kurzy',
    addCourse:       '+ Pridať kurz',
    editCourse:      'Upraviť kurz',
    newCourse:       'Nový kurz',
    nameLabel:       'Názov',
    priceLabel:      'Cena (€)',
    videoUrlLabel:   'Video URL (embed)',
    previewLabel:    'Náhľadový obrázok (URL)',
    descriptionLabel:'Krátky popis',
    lessonTextLabel: 'Obsah lekcie',
    noCourses:       'Žiadne kurzy. Pridajte prvý.',
    confirmDelete:   'Vymazať tento kurz?',
  },
  ai: {
    title:       'AI správa',
    placeholder: 'Napíšte správu...',
    send:        'Odoslať',
  },
  dashboard: {
    title:              'Prehľad',
    todayAppointments:  'Dnešné rezervácie',
    totalClients:       'Klienti celkom',
    pendingReviews:     'Čakajúce recenzie',
  },
};

// ─── English ───────────────────────────────────────────────────────────────
const EN: AdminTranslations = {
  nav: {
    dashboard:    'Dashboard',
    hero:         'Hero Section',
    services:     'Services',
    reservations: 'Reservations',
    masters:      'Masters',
    gallery:      'Gallery',
    reviews:      'Reviews',
    products:     'Products',
    orders:       'Orders',
    promotions:   'Promotions',
    menu:         'Menu',
    tables:       'Tables',
    deliveryZones:'Delivery Zones',
    courses:      'Courses',
    history:      'History',
    theme:        'Theme',
    ai:           'AI Manager',
    settings:     'Settings',
    legal:        'Legal (DE)',
    logout:       'Log out',
  },
  common: {
    save:      'Save changes',
    saving:    'Saving...',
    cancel:    'Cancel',
    delete:    'Delete',
    edit:      'Edit',
    add:       'Add',
    hide:      'Hide',
    show:      'Show',
    upload:    'Upload',
    uploading: 'Uploading...',
    loading:   'Loading...',
    noData:    'No data',
    confirm:   'Confirm',
  },
  theme: {
    title:           'Theme',
    presetsTitle:    'Ready-made themes',
    presetsSubtitle: 'Choose a theme as a base, then adjust colors below',
    colors:          'Colors',
    layout:          'Layout',
    heroType:        'Hero Type',
    cardStyle:       'Card Style',
    navigation:      'Navigation',
    borderRadius:    'Border Radius',
    saveTheme:       'Save Theme',
    saving:          'Saving...',
    resetColors:     'Reset colors',
    preview:         'Preview',
    colorLabels: {
      bg:           'Background',
      primary:      'Primary',
      primaryDark:  'Primary Dark',
      primaryLight: 'Primary Light',
      text:         'Text',
      textSecondary:'Text Secondary',
      textMuted:    'Text Muted',
      border:       'Border',
      bgSubtle:     'Background Subtle',
      success:      'Success',
      error:        'Error',
      contrast:     'Contrast Text',
      overlay:      'Overlay Base',
      overlayAlpha: 'Overlay w/ Alpha',
      headerBg:     'Header Scrolled',
    },
    colorDescriptions: {
      bg:           'Page background color',
      primary:      'Buttons, links, accents',
      primaryDark:  'Hover / active state',
      primaryLight: 'Light tint backgrounds',
      text:         'Main text color',
      textSecondary:'Muted labels',
      textMuted:    'Even more subtle',
      border:       'Dividers, card borders',
      bgSubtle:     'Card hover, sections',
      success:      'Positive states',
      error:        'Negative states',
      contrast:     'Text color on colored buttons',
      overlay:      'Base overlay color (hex)',
      overlayAlpha: 'Semi-transparent overlay (rgba)',
      headerBg:     'Header background after scroll (rgba)',
    },
  },
  services: {
    title:           'Services',
    addService:      '+ Add Service',
    editService:     'Edit Service',
    newService:      'New Service',
    nameLabel:       'Name',
    priceLabel:      'Price (€)',
    durationLabel:   'Duration (min)',
    categoryLabel:   'Category',
    descriptionLabel:'Description',
    noServices:      'No services. Add the first one.',
    confirmDelete:   'Delete this service?',
    names: {
      'services.beard':    'Beard Trim',
      'services.haircut':  'Haircut',
      'services.hairBeard':'Hair + Beard',
      'services.styling':  'Styling',
      'services.shave':    'Shave',
      'services.kids':     'Kids Haircut',
    },
  },
  reservations: {
    title:          'Reservations',
    all:            'All',
    pending:        'Pending',
    confirmed:      'Confirmed',
    cancelled:      'Cancelled',
    completed:      'Completed',
    noShow:         'No Show',
    confirm:        'Confirm',
    complete:       'Complete',
    cancel:         'Cancel',
    whatsapp:       'WhatsApp',
    clearDate:      '✕ All dates',
    noReservations: 'No reservations',
    loading:        'Loading reservations...',
    statPending:    'Pending',
    statConfirmed:  'Confirmed',
    statCompleted:  'Completed',
    statCancelled:  'Cancelled',
  },
  settings: {
    title:             'Settings',
    tabs: {
      store:         'Store',
      gallery:       'Gallery',
      masters:       'Masters',
      notifications: 'Notifications',
      security:      'Security',
      schedule:      'Schedule',
    },
    savingBtn:         'Saving...',
    saveBtn:           'Save changes',
    logoLabel:         'Salon logo',
    changeLogo:        'Change logo',
    uploadLogo:        'Upload logo',
    uploading:         'Uploading...',
    removeLogo:        'Remove logo',
    removeLogoConfirm: 'Remove the logo? The text logotype will be shown instead.',
    workingHoursLabel: 'Working hours',
  },
  reviews: {
    title:    'Reviews',
    approved: 'Approved',
    pending:  'Pending',
    rejected: 'Rejected',
    approve:  'Approve',
    reject:   'Reject',
    reply:    'Reply',
  },
  courses: {
    title:           'Courses',
    addCourse:       '+ Add Course',
    editCourse:      'Edit Course',
    newCourse:       'New Course',
    nameLabel:       'Name',
    priceLabel:      'Price (€)',
    videoUrlLabel:   'Video URL (embed)',
    previewLabel:    'Preview Image (URL)',
    descriptionLabel:'Short Description',
    lessonTextLabel: 'Lesson Content',
    noCourses:       'No courses yet. Add the first one.',
    confirmDelete:   'Delete this course?',
  },
  ai: {
    title:       'AI Manager',
    placeholder: 'Type a message...',
    send:        'Send',
  },
  dashboard: {
    title:             'Dashboard',
    todayAppointments: "Today's appointments",
    totalClients:      'Total clients',
    pendingReviews:    'Pending reviews',
  },
};

// ─── Fallback locales ──────────────────────────────────────────────────────
// cs ≈ sk (mutually intelligible), uk/de fall back to sk until translated
export const ADMIN_TRANSLATIONS: Record<AdminLocale, AdminTranslations> = {
  sk: SK,
  en: EN,
  cs: SK,
  de: EN,
  uk: SK,
};

export function getAdminT(locale: AdminLocale): AdminTranslations {
  return ADMIN_TRANSLATIONS[locale] ?? SK;
}
