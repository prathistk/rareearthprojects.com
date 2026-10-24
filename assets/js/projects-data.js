/* =====================================================================
   Rare Earth Projects · projects-data.js
   THE single source of truth for every project list, fact, badge, plan
   and enquiry option on the site. Loaded as a plain script (not JSON) so
   it also works from file://.

   Rules
   - Never invent facts. If something is unknown, leave it null / [] and
     the UI omits the block or shows "Price on request".
   - Image paths are relative to /assets/ (site.js prefixes the root).
   - Every image path listed here must exist: nothing on the site probes for
     files that may be missing. There are no 3D renders (owner, 2026-10-23);
     assets/renders/ holds only the plans drawn from the layout drawings.
   - Owned by the foundation layer. Page agents: describe changes in your
     report instead of editing this file.
   ===================================================================== */
(function () {
  'use strict';

  var RENDER_NOTE = 'Rendered from the approved layout drawings · indicative';
  var DRAWING_NOTE = 'Rendered from the layout drawing · indicative';

  window.RE_CONFIG = {
    company: 'Rarearth Projects Private Limited',
    brand: 'Rare Earth Projects',
    domain: 'https://www.rareearthprojects.com',
    established: 2022,
    md: 'Prathist Kempegowda',
    cin: 'U70100KA2022PTC157243',
    gst: '29AALCR6032M1ZT',
    phones: [
      { label: '+91 88841 50025', tel: '+918884150025' },
      { label: '+91 79964 99499', tel: '+917996499499' },
      { label: '+91 80683 52992', tel: '+918068352992' }
    ],
    whatsapp: '918884150025',
    whatsappLabel: '+91 88841 50025',
    email: 'info@rareearthprojects.com',
    office: {
      lines: ['Rarearth Projects Pvt. Ltd., 2nd Floor, Ritwik Plaza,', 'No. 2386/2387, 60 Ft Road, Next to Cauvery Public School,', 'E Block, Sahakarnagar, Bengaluru 560092'],
      short: 'Sahakarnagar, Bengaluru 560092',
      menu: ['2nd Floor, Ritwik Plaza, No. 2386/2387,', '60 Ft Road, E Block, Sahakarnagar, Bengaluru 560092']
    },
    quote: 'Land, chosen with care. Built to be handed down.',
    priceNote: '*Prices indicative & subject to availability; registration, stamp duty and other charges extra.',
    footNote: '*Prices indicative & subject to availability. Plans are representations of approved layouts. RERA details at rera.karnataka.gov.in',
    disclaimer: 'Images are representational; plans are representations of approved layouts; prices indicative.',
    reraSite: 'https://rera.karnataka.gov.in/',
    leadEndpoint: null,          // the lead inbox's https://…workers.dev/lead URL once it is deployed (lead-inbox/README.md); WhatsApp stays first either way
    showAvailability: false,     // owner decision pending: no plot availability layer
    replyNote: 'We reply personally, usually within a few working hours.',

    /* Contact hub tabs (all routed to the main email / WhatsApp) */
    contactTabs: [
      { key: 'buy', label: 'Buy a plot' },
      { key: 'landowners', label: 'Landowners & joint development' },
      { key: 'partners', label: 'Channel partners' }
    ],

    /* Filter vocabularies (projects listing) */
    types: [
      { key: 'villa-plots', label: 'Villa plots' },
      { key: 'plotted-community', label: 'Plotted community' },
      { key: 'premium-plots', label: 'Premium plots' },
      { key: 'residential-sites', label: 'Residential sites' }
    ],
    localities: [
      { key: 'nandi-hills', label: 'Nandi Hills' },
      { key: 'devanahalli', label: 'Devanahalli' },
      { key: 'bagalur', label: 'Bagalur' },
      { key: 'yelahanka', label: 'Yelahanka' },
      { key: 'poojanahalli', label: 'Poojanahalli · SLK Tech Park' },  // a location (Arcadia is here), not a project name
      { key: 'kadiganahalli', label: 'Kadiganahalli' }                 // Elysia
    ],
    stages: [
      { key: 'new-launch', label: 'New launch' },
      { key: 'now-selling', label: 'Now selling' },
      { key: 'ready-to-register', label: 'Ready to register' },
      { key: 'upcoming', label: 'Upcoming' },
      { key: 'sold-out', label: 'Sold out' }
    ],
    sizeBands: [
      { key: 'upto-1500', label: 'Up to 1,500 sq ft', sub: '167 sq yd', min: 0, max: 1500 },
      { key: '1500-2500', label: '1,500 – 2,500 sq ft', sub: '167 – 278 sq yd', min: 1500, max: 2500 },
      { key: 'above-2500', label: 'Above 2,500 sq ft', sub: '278+ sq yd', min: 2500, max: Infinity }
    ],
    budgetBands: [  // provisional, owner to confirm
      { key: 'upto-50l', label: 'Up to ₹50 L', min: 0, max: 5000000 },
      { key: '50l-1cr', label: '₹50 L – 1 Cr', min: 5000000, max: 10000000 },
      { key: '1cr-1-5cr', label: '₹1 – 1.5 Cr', min: 10000000, max: 15000000 },
      { key: 'above-1-5cr', label: 'Above ₹1.5 Cr', min: 15000000, max: Infinity }
    ],
    phoneCodes: [
      { code: '+91', label: 'IN +91', name: 'India' },
      { code: '+971', label: 'AE +971', name: 'UAE' },
      { code: '+1', label: 'US +1', name: 'USA / Canada' },
      { code: '+44', label: 'UK +44', name: 'United Kingdom' },
      { code: '+65', label: 'SG +65', name: 'Singapore' },
      { code: '+61', label: 'AU +61', name: 'Australia' },
      { code: '+966', label: 'SA +966', name: 'Saudi Arabia' },
      { code: '+974', label: 'QA +974', name: 'Qatar' },
      { code: 'other', label: 'Other', name: 'Other country' }
    ],

    /* "Where We Build" map: drawn from real OpenStreetMap data (assets/maps/presence-base.svg,
       generated 1000 x 1226 and shown in a 460 x 563.96 viewBox). Pins sit at each project's real
       Google Maps location; map_xy below is in this viewBox. Attribution is part of the base image. */
    map: {
      viewBox: '0 0 460 563.96',
      base: 'assets/maps/presence-base.svg',
      baseLight: 'assets/maps/presence-base-light.svg',
      attribution: 'Map data © OpenStreetMap contributors',
      landmarks: {}
    }
  };

  window.RE_PROJECTS = [
    /* ------------------------------------------------------------------ */
    {
      slug: 'montira',
      name: 'Montira',
      order: 1,
      featured: 1,
      flagship: true,
      url: 'projects/montira/',
      pronunciation: 'mon·teer·ah',
      type: { key: 'villa-plots', label: 'Villa plots' },
      locality: { key: 'nandi-hills', label: 'Nandi Hills' },
      village: 'Chikkasagarahalli',
      locality_line: 'Chikkasagarahalli · Nandi Hills',
      address: 'Chikkasagarahalli, Nandi Hobli, at the foothills of Nandi Hills',
      maps_query: 'Chikkasagarahalli, Nandi Hobli, Karnataka',
      lat: 13.3416197, lng: 77.6995568,   // Google Maps listing 'Montira'
      map_xy: { x: 259.0, y: 96.6, lx: 271.0, ly: 101.6 },
      stage: { key: 'now-selling', label: 'Now selling' },
      status_label: 'Flagship',           // landing index status column
      footer_group: 'Now selling',
      badges: ['Flagship', 'RERA'],
      rera: [{ phase: null, label: 'RERA', number: 'PRM/KA/RERA/1254/460/PR/160525/007750' }],
      approvals: [
        { k: 'RERA registration', v: 'PRM/KA/RERA/1254/460/PR/160525/007750', rera: true },
        { k: 'Registration', v: 'From December 2025' }
      ],
      registration: 'From December 2025',
      completion: null,
      land_acres: 14.35,
      plots_total: 116,
      plots_label: '116 villa plots',
      commercial_plots: 1,
      phases: [],
      plot_formats: [ // from the approved CAD layout
        { key: '50x80', label: '50 × 80', w: 50, d: 80, sqft: 4000, count: 21, facing: [], price_from: null },
        { key: '40x60', label: '40 × 60', w: 40, d: 60, sqft: 2400, count: 18, facing: [], price_from: null },
        { key: '30x50', label: '30 × 50', w: 30, d: 50, sqft: 1500, count: 12, facing: [], price_from: null },
        { key: 'odd', label: 'Individually shaped', w: null, d: null, sqft: null, count: 65, facing: [], price_from: null }
      ],
      size_min: 1500, size_max: 4000,
      sizes_label: '1,500 – 4,000 sq ft',
      sizes_note: 'Standard formats of 1,500, 2,400 and 4,000 sq ft, plus 65 individually shaped plots.',
      headline_sizes: '2,400 & 4,000 sq ft', // wording used on the landing page
      price: { from_inr: 11200000, to_inr: null, per_sqft: null, display: 'From ₹1.12 Cr*', short: '₹1.12 Cr*', note: 'Starting price, indicative' },
      land_use: {
        parks_sqm: 12187, parks_pct: 21.3, roads_sqm: 17299, commercial_sqm: 1221,
        parks: [
          { name: 'Park 4', sqm: 8149 }, { name: 'Park 3', sqm: 2909 },
          { name: 'Park 2', sqm: 932 }, { name: 'Park 1', sqm: 196 }
        ]
      },
      clubhouse_sqft: 18000,
      date_palms: 229,
      hero_facts: [{ b: '116', s: 'Villa plots' }, { b: '14.35', s: 'Acres' }, { b: '18K', s: 'Sq ft club' }],
      tagline: "Inspired by Marrakesh, built in Nandi Hills. India's first Palmeraie-themed villa plots.",
      kicker: 'Flagship · Nandi Hills',
      specs: [
        { k: 'Location', v: 'Chikkasagarahalli, Nandi Hobli' },
        { k: 'Land', v: '14.35 acres' },
        { k: 'Villa plots', v: '116' },
        { k: 'Plot formats', v: '50×80 · 40×60 · 30×50' },
        { k: 'Open space', v: '21.3% parks' },
        { k: 'Clubhouse', v: '18,000 sq ft' },
        { k: 'Registration', v: 'From December 2025' },
        { k: 'Starting from', v: '₹1.12 Cr*' }
      ],
      highlights: ['229 date palms', 'Olive groves & shaded promenades', 'Cobblestone paths', 'Terracotta courtyards', '18,000 sq ft resort clubhouse', 'Four landscaped parks'],
      amenity_groups: [
        { key: 'wellness', label: 'Wellness', items: ['Infinity pool & poolside deck', 'Salon & spa', 'Gymnasium, yoga & meditation'] },
        { key: 'social', label: 'Social', items: ['Café & library', 'Business lounge & conference', 'Multipurpose hall & party lawn', 'Amphitheatre', 'Guest rooms'] },
        { key: 'play', label: 'Play', items: ['Sports court & cricket net', 'Half basketball court', "Children's play & activity centre", "Senior citizens' corner"] }
      ],
      connectivity: [
        { cat: 'Leisure', place: 'Nandi Hills', mins: 10, km: null, lm: 'nandi' },
        { cat: 'Education', place: 'Chanakya University', mins: 8, km: null, lm: null },
        { cat: 'Connectivity', place: 'STRR (Satellite Town Ring Road)', mins: 12, km: null, lm: 'strr' },
        { cat: 'Airport & transit', place: 'Kempegowda International Airport', mins: 25, km: null, lm: 'airport' }
      ],
      images: {
        cover: { src: 'montira/gardens.jpg', sm: 'montira/gardens-sm.jpg', w: 2400, h: 1350, alt: 'Landscaped gardens at Montira beneath Nandi Hills' },
        thumb: { src: 'montira/aerial-sm.jpg', w: 1200, h: 675, alt: 'Aerial view of Montira' },
        gallery: [
          { src: 'montira/aerial.jpg', sm: 'montira/aerial-sm.jpg', w: 2400, h: 1350, alt: 'Aerial view of the Montira layout beneath Nandi Hills', cap: 'The estate from above' },
          { src: 'montira/lawns.jpg', sm: 'montira/lawns-sm.jpg', w: 2400, h: 1350, alt: 'Landscaped lawns with Nandi Hills in view', cap: 'Under Nandi Hills' },
          { src: 'montira/garden-pavilion.jpg', sm: 'montira/garden-pavilion-sm.jpg', w: 2400, h: 1350, alt: 'Landscaped gardens and a glass-fronted pavilion at Montira, with Nandi Hills beyond', cap: 'The gardens' },
          // owner's architect renders of the proposed clubhouse (PDF, 10 Jul 2026); architect's mark cropped out at the owner's request
          { src: 'montira/clubhouse-day.jpg', sm: 'montira/clubhouse-day-sm.jpg', w: 1694, h: 928, alt: 'The proposed Montira clubhouse by day, an architect\'s render', cap: 'The proposed clubhouse', note: 'Architect\'s render · proposed · indicative', kind: 'render' },
          { src: 'montira/clubhouse-dusk.jpg', sm: 'montira/clubhouse-dusk-sm.jpg', w: 2000, h: 1125, alt: 'The proposed Montira clubhouse at dusk, an architect\'s render', cap: 'The clubhouse at dusk', note: 'Architect\'s render · proposed · indicative', kind: 'render' }
        ],
        plan_thumb: { src: 'renders/montira-plan.svg', alt: 'Montira layout' },
        og: 'montira/aerial-sm.jpg'
      },
      plan: {
        title: 'Montira layout',
        sheets: [
          {
            key: 'master', label: 'Master plan', sub: '116 villa plots',
            // drawn in the site's plan style from the CAD-derived layout (owner, 2026-10-23); the agency
            // master-plan artwork (montira/masterplan.jpg) is no longer used
            src: 'renders/montira-plan.svg', meta: 'renders/montira-plan.meta.json', w: 1600, h: 2278,
            caption: 'Rendered from the approved layout drawing · indicative. Plot dimensions, areas and facing follow the sanctioned plan and may vary marginally on site.',
            rera: 'RERA PRM/KA/RERA/1254/460/PR/160525/007750',
            legend: ['12 m and 9 m tree-lined internal roads', 'Main entrance from the road widened to 12 m']
          }
        ]
      },
      layout_pdf: null,
      brochure_pdf: null,
      // the project's own logo (Rare Earth beside the project wordmark): name panels, featured cards, the listing (owner, 2026-10-23)
      logo: { dark: 'logos/montira-on-dark.webp', light: 'logos/montira-on-light.webp', w: 1332, h: 336, alt: 'Montira by Rare Earth' },
      art: { cls: 'a-photo', photo: 'montira/aerial-sm.jpg' },
      theme: { mode: 'dark', paper: 'light', hero: 'dark', accent: '#b5653f', accent2: '#6b7443', paperColor: '#efe4d2', seed: 3 },
      story_label: 'Palmeraie',
      fact: {
        name: 'Montira', rera: 'PRM/KA/RERA/1254/460/PR/160525/007750', price: '₹1.12 Cr*', plots: '116',
        acres: '14.35', club: '18,000 sq ft', registration: 'From December 2025', palms: '229', parks_pct: '21.3%'
      },
      faqs: []
    },

    /* ------------------------------------------------------------------ */
    {
      slug: 'athena',
      name: 'Athena',
      order: 2,
      featured: 2,
      flagship: false,
      url: 'projects/athena/',
      external_site: null,
      type: { key: 'plotted-community', label: 'Plotted community' },
      locality: { key: 'devanahalli', label: 'Devanahalli' },
      village: 'Jonnahalli',
      locality_line: 'Jonnahalli · Devanahalli',
      address: 'Jonnahalli, Devanahalli Taluk',
      maps_query: 'Jonnahalli, Devanahalli Taluk, Karnataka',
      lat: 13.1788728, lng: 77.7599626,   // Google Maps listing 'Rare Earth - Athena'
      map_xy: { x: 348.6, y: 344.7, lx: 360.6, ly: 349.7 },
      stage: { key: 'now-selling', label: 'Phase II selling' },   // owner 2026-10-23: Phase I sold out, Phase II selling
      status_label: 'Phase II now selling',
      footer_group: 'Now selling',
      badges: ['Phase II selling', 'Phase I sold out', 'RERA'],
      featured_line: 'Phase II now selling',
      rera: [{ phase: null, label: 'RERA', number: 'PRM/KA/RERA/1250/303/PR/181225/008351' }],
      approvals: [
        { k: 'RERA registration', v: 'PRM/KA/RERA/1250/303/PR/181225/008351', rera: true },
        { k: 'Phase II', v: 'Sy. No. 7/3 · 30 plots' },
        { k: 'Completion · Phase I', v: 'December 2026' }
      ],
      registration: null,
      completion: 'December 2026',
      land_acres: 6.4,
      land_label: '6 acres 16.5 guntas',
      plots_total: 110,
      plots_label: '110 plots · 2 phases',
      plots_drawn: 109,
      phases: [
        {
          key: 'phase-1', no: 1, label: 'Phase I', plots: 80, plots_drawn: 79,
          extent: '4 acres 27.5 guntas', survey: 'Sy. Nos. 7/2 & 7/4',
          rera: 'PRM/KA/RERA/1250/303/PR/181225/008351', status: 'RERA registered', completion: 'December 2026',
          parks: [{ name: 'Park 1', sqm: 944.6 }, { name: 'Park 2', sqm: 952.7 }],
          civic_sqm: 948.45, shop_sqm: 378.47,
          summary: 'Sold out. Plots on 4 acres 27.5 guntas, with two parks, a civic amenity & a neighbourhood shop'
        },
        {
          key: 'phase-2', no: 2, label: 'Phase II', plots: 30, plots_drawn: 30,
          extent: '1 acre 29 guntas', survey: 'Sy. No. 7/3',
          rera: null, status: null, completion: null, position: 'Directly south of Phase I',
          parks: [{ name: 'Park 1', sqm: 699.3, note: 'with the natural nala and a 3 m green buffer' }],
          civic_sqm: 350.22, shop_sqm: null,
          summary: 'Now selling. Plots on 1 acre 29 guntas, with a park, nala, buffer & civic amenity'
        }
      ],
      plot_formats: [ // from the layout drawings (both phases)
        { key: '30x40', label: '30 × 40', w: 30, d: 40, sqft: 1200, count: 57, facing: [], price_from: null },
        { key: '30x50', label: '30 × 50', w: 30, d: 50, sqft: 1500, count: 13, facing: [], price_from: null },
        { key: 'odd', label: 'Corner & odd', w: null, d: null, sqft: null, sqft_max: 2300, count: 39, facing: [], price_from: null }
      ],
      size_min: 1200, size_max: 2300,
      sizes_label: '1,200 – 2,300 sq ft',
      facing_label: 'East & West',
      sizes_note: '30×40 and 30×50 plots in east- and west-facing rows, plus corner and odd plots of up to 2,300 sq ft.',
      price: { from_inr: null, to_inr: null, per_sqft: null, display: 'Price on request', short: 'Price on request', note: null },
      roads: { internal_m: [9, 12], frontage: 'District road of 15 m being widened to 25 m' },
      land_use: {
        parks: [{ name: 'Phase I · Park 1', sqm: 944.6 }, { name: 'Phase I · Park 2', sqm: 952.7 }, { name: 'Phase II · Park 1', sqm: 699.3 }],
        civic: [{ name: 'Phase I', sqm: 948.45 }, { name: 'Phase II', sqm: 350.22 }],
        shop_sqm: 378.47
      },
      parks_count: 3,
      hero_facts: [{ b: '110', s: 'Plots · 2 phases' }, { b: '6.4', s: 'Acres' }, { b: '3', s: 'Parks' }],
      tagline: 'A RERA-registered plotted community near the KIADB Aerospace, Hardware and Tech Parks next to the airport.',
      kicker: 'Phase II Now Selling · Devanahalli',
      specs: [
        { k: 'Location', v: 'Jonnahalli, Devanahalli Taluk' },
        { k: 'Plot formats', v: '30×40 & 30×50' },
        { k: 'Plot sizes', v: '1,200 – 2,300 sq ft' },
        { k: 'Facing', v: 'East & West' },
        { k: 'Parks', v: '944.6 & 952.7 sq m' },
        { k: 'Park (Phase II)', v: '699.3 sq m' },
        { k: 'Completion', v: 'December 2026' }
      ],
      highlights: ['Frontage on a district road being widened to 25 m', '9 m and 12 m internal roads', 'East- and west-facing rows', 'Corner plots', 'Quiet cul-de-sacs beside the parks', 'Natural nala kept as a landscaped feature'],
      amenity_groups: [
        { key: 'parks', label: 'Parks & open space', items: ['Phase I · Park 1 (944.6 sq m)', 'Phase I · Park 2 (952.7 sq m)', 'Phase II · Park 1 with the natural nala and a 3 m green buffer (699.3 sq m)'] },
        { key: 'community', label: 'Community', items: ['Civic amenity · Phase I (948.45 sq m)', 'Civic amenity · Phase II (350.22 sq m)', 'Neighbourhood shop (378.47 sq m)'] }
      ],
      connectivity: [
        { cat: 'Connectivity', place: 'Satellite Town Ring Road (NH-648)', mins: null, km: 3, lm: 'strr' },
        { cat: 'Work', place: 'KIADB Aerospace Park', mins: null, km: 5, lm: null },
        { cat: 'Connectivity', place: 'Devanahalli town', mins: null, km: 11.5, lm: null },
        { cat: 'Airport & transit', place: 'Kempegowda International Airport (by road)', mins: null, km: 17, lm: 'airport' },
        { cat: 'Connectivity', place: 'Hebbal', mins: null, km: 30, lm: 'hebbal' }
      ],
      images: {
        cover: null,   // cards outside the Athena page show its name panel, never a plan (owner, 2026-10-23)
        thumb: null,
        feature: null,
        gallery: [
          // owner (2026-10-23): one plan for both phases, never Phase I and Phase II shown separately
          { src: 'renders/athena-plan.svg', alt: 'Athena master plan, Phases I and II as one layout, rendered from the approved layout drawings', cap: 'Master plan · Phases I & II', note: 'Rendered from the approved layout drawings · indicative', sheet: true }
        ],
        plan_thumb: { src: 'renders/athena-plan.svg', alt: 'Athena layout' },
        og: null
      },
      plan: {
        title: 'Athena master plan',
        sheets: [
          {
            key: 'master', label: 'Master plan', sub: '110 plots · Phases I & II',
            // both phases joined from the two phase drawings, in their style (owner, 2026-10-23)
            src: 'renders/athena-plan.svg', meta: 'renders/athena-plan.meta.json', w: 1600, h: 2674,
            caption: RENDER_NOTE + '. One continuous layout: Phase I (Sy. Nos. 7/2 & 7/4) to the north and Phase II (Sy. No. 7/3) directly to its south, joined along their shared boundary road. Plot dimensions, areas and facing follow the sanctioned plans and may vary marginally on site.',
            rera: 'RERA PRM/KA/RERA/1250/303/PR/181225/008351',
            legend: ['9 m and 12 m tree-lined internal roads with street lights', 'District road frontage, being widened to 25 m']
          }
        ]
      },
      layout_pdf: null,
      brochure_pdf: null,
      // the project's own logo (Rare Earth beside the project wordmark): name panels, featured cards, the listing (owner, 2026-10-23)
      logo: { dark: 'logos/athena-on-dark.webp', light: 'logos/athena-on-light.webp', w: 1151, h: 336, alt: 'Athena by Rare Earth' },
      art: { cls: 'a-athena', seed: 5, mark: { text: ['Rare Earth', 'Athena'] } },
      theme: { mode: 'light', paper: 'light', hero: 'light', accent: '#6c7a44', accent2: '#9c7b49', paperColor: '#f4efe6', seed: 5 },
      story_label: 'Phases',
      fact: {
        name: 'Athena', rera: 'PRM/KA/RERA/1250/303/PR/181225/008351', plots: '110', plots_p1: '80', plots_p2: '30',
        acres: '6.4', parks: '3', completion: 'December 2026', price: 'Price on request'
      },
      faqs: []
    },

    /* ------------------------------------------------------------------ */
    {
      slug: 'serenity',
      name: 'Serenity',
      order: 3,
      featured: 0,
      flagship: false,
      url: 'projects/serenity/',
      external_site: null,
      wordmark: 'serenity-wordmark.png',
      type: { key: 'premium-plots', label: 'Premium plots' },
      locality: { key: 'bagalur', label: 'Bagalur' },
      village: 'M. Hosahalli',
      locality_line: 'M. Hosahalli · Bagalur',
      address: 'M. Hosahalli, Bagalur, off the Whitefield–Airport Road near Budigere',
      maps_query: 'M. Hosahalli, Bagalur, Bengaluru',
      lat: 13.141979, lng: 77.729257,   // owner's Google Maps pin, 2026-10-23 (M. Hosahalli, Bagalur)
      map_xy: { x: 303.0, y: 400.9, lx: 315.0, ly: 405.9 },
      stage: { key: 'sold-out', label: 'Sold out' },   // owner 2026-10-23
      status_label: 'Plotted Community',
      footer_group: 'Sold out',
      badges: ['Sold out'],
      rera: [],
      approvals: [
        { k: 'Layout', v: 'Approved layout' },
        { k: 'Bank loan', v: 'Sanctioned' },
        { k: 'Status', v: 'Sold out' }
      ],
      registration: 'Sold out',
      land_acres: null,
      plots_total: null,
      phases: [],
      plot_formats: [],
      size_min: null, size_max: null,
      sizes_label: null,
      price: { from_inr: null, to_inr: null, per_sqft: null, display: 'Sold out', short: 'Sold out', note: null },
      hero_facts: [{ b: '15', s: 'Km · Airport' }, { b: '02', s: 'Km · Budigere' }, { b: '4.5', s: 'Km · Proposed SEZ' }],
      tagline: 'A gated plotted community near the KIADB Aerospace & Software Park.',
      kicker: 'Sold Out · Premium Plots · Bagalur',
      specs: [
        { k: 'Location', v: 'M. Hosahalli, Bagalur' },
        { k: 'Nearby', v: 'KIADB Aerospace Park' },
        { k: 'Airport', v: '15 km' },
        { k: 'Hebbal', v: '25 km' },
        { k: 'Status', v: 'Sold out' }
      ],
      highlights: ['Sold out', 'Approved layout', 'Bank loan sanctioned', 'Gated with 24×7 security', 'Roads with streetlights', 'Drainage, power & water'],
      amenity_groups: [],
      connectivity: [
        { cat: 'Work', place: 'KIADB Aerospace & Software Park', mins: null, km: null, text: 'Nearby', lm: null },
        { cat: 'Connectivity', place: 'Budigere', mins: null, km: 2, lm: 'budigere' },
        { cat: 'Work', place: 'Proposed SEZ', mins: null, km: 4.5, lm: null },
        { cat: 'Airport & transit', place: 'Kempegowda International Airport', mins: null, km: 15, lm: 'airport' },
        { cat: 'Connectivity', place: 'Hebbal', mins: null, km: 25, lm: 'hebbal' }
      ],
      images: {
        cover: null,   // cards outside the project page show its name panel; no 3D renders (owner, 2026-10-23)
        thumb: null,
        gallery: [],
        plan_thumb: null,
        og: null
      },
      plan: null,
      layout_pdf: null,
      brochure_pdf: null,
      // the project's own logo (Rare Earth beside the project wordmark): name panels, featured cards, the listing (owner, 2026-10-23)
      logo: { dark: 'logos/serenity-on-dark.webp', light: 'logos/serenity-on-light.webp', w: 811, h: 336, alt: 'Serenity by Rare Earth' },
      art: { cls: 'a-serenity', seed: 7, mark: { img: 'serenity-wordmark.png', alt: 'Serenity' } },
      theme: { mode: 'light', paper: 'light', hero: 'light', accent: '#5c6b3a', accent2: '#9c7b49', paperColor: '#e9ebdb', seed: 7 },
      story_label: 'Work nearby',
      fact: { name: 'Serenity', status: 'Sold out', airport: '15 km', budigere: '2 km', sez: '4.5 km', hebbal: '25 km' },
      faqs: []
    },

    /* ------------------------------------------------------------------ */
    {
      slug: 'tranquility',
      name: 'Tranquility',
      order: 4,
      featured: 0,
      flagship: false,
      url: 'projects/tranquility/',
      external_site: null,
      wordmark: 'tranquility-wordmark.png',
      type: { key: 'premium-plots', label: 'Premium plots' },
      locality: { key: 'yelahanka', label: 'Yelahanka' },
      village: 'Singanayakanahalli',
      locality_line: 'Singanayakanahalli · Yelahanka',
      address: 'Singanayakanahalli, Yelahanka',
      maps_query: 'Singanayakanahalli, Yelahanka, Bengaluru',
      lat: 13.1503397, lng: 77.5698767,   // Google Maps listing 'Rare Earth - Tranquility'
      map_xy: { x: 66.6, y: 388.2, lx: 78.6, ly: 393.2 },
      stage: { key: 'sold-out', label: 'Sold out' },   // owner 2026-10-23
      status_label: 'Plotted Community',
      footer_group: 'Sold out',
      badges: ['Sold out'],
      rera: [],
      approvals: [
        { k: 'Community', v: 'Gated' },
        { k: 'Status', v: 'Sold out' }
      ],
      registration: 'Sold out',
      // from the layout drawing (owner PDF, Jul 2023): 24 sites, sellable 37,640.99 sq ft, roads 14,074.16 sq ft, total 51,715.15 sq ft.
      // The drawing numbers two sites "15" (one by the main road, one at the east end); kept as drawn until the owner confirms.
      land_sqft: 51715, land_acres: 1.19,
      plots_total: 24,
      plots_label: '24 sites',
      phases: [],
      plot_formats: [
        { key: '30x40', label: '30 × 40', w: 30, d: 40, sqft: 1200, count: 9, facing: [], price_from: null },
        { key: '30x50', label: '30 × 50', w: 30, d: 50, sqft: 1500, count: 6, facing: [], price_from: null },
        { key: 'odd', label: 'Individually shaped', w: null, d: null, sqft: null, count: 9, facing: [], price_from: null }
      ],
      size_min: 1200, size_max: null,
      sizes_label: '30 × 40 and 30 × 50 sites, plus 9 individually shaped sites',
      price: { from_inr: null, to_inr: null, per_sqft: null, display: 'Sold out', short: 'Sold out', note: null },
      hero_facts: [{ b: '24', s: 'Sites' }, { b: 'Gated', s: 'Community' }, { b: 'Sold out', s: 'Every site' }],
      tagline: 'Premium plots in a green, gated neighbourhood near Yelahanka.',
      kicker: 'Sold Out · Premium Plots · Yelahanka',
      specs: [
        { k: 'Location', v: 'Singanayakanahalli, Yelahanka' },
        { k: 'Type', v: 'Premium residential plots' },
        { k: 'Sites', v: '24 · 30 × 40, 30 × 50 and individually shaped' },
        { k: 'Land', v: 'About 1.19 acres' },
        { k: 'Internal roads', v: '28 ft' },
        { k: 'Status', v: 'Sold out' }
      ],
      highlights: ['Sold out', 'Gated community', '24 sites on 28 ft roads', 'Off a main road', 'Green neighbourhood', 'Industrial corridor'],
      amenity_groups: [],
      connectivity: [],
      images: {
        cover: null,   // cards outside the project page show its name panel; no 3D renders (owner, 2026-10-23)
        thumb: null,
        gallery: [
          { src: 'renders/tranquility-plan.svg', alt: 'Tranquility layout, rendered from the layout drawing', cap: 'The layout', note: DRAWING_NOTE, sheet: true }
        ],
        plan_thumb: null,
        og: null
      },
      plan: {
        title: 'Tranquility layout',
        sheets: [
          {
            key: 'master', label: 'Layout', sub: '24 sites',
            src: 'renders/tranquility-plan.svg', sm: 'renders/tranquility-plan.svg', meta: 'renders/tranquility-plan.meta.json', w: 1600, h: 1037,
            caption: DRAWING_NOTE + '. Site numbers, shapes and road widths follow the layout drawing; trees are illustrative and dimensions may vary marginally on site.'
          }
        ]
      },
      layout_pdf: null,
      brochure_pdf: null,
      // the project's own logo (Rare Earth beside the project wordmark): name panels, featured cards, the listing (owner, 2026-10-23)
      logo: { dark: 'logos/tranquility-on-dark.webp', light: 'logos/tranquility-on-light.webp', w: 1196, h: 336, alt: 'Tranquility by Rare Earth' },
      art: { cls: 'a-tranq', seed: 11, mark: { img: 'tranquility-wordmark.png', alt: 'Tranquility' } },
      theme: { mode: 'dark', paper: 'dark', hero: 'dark', accent: '#caa773', accent2: '#9c7b49', paperColor: '#28231c', seed: 11 },
      story_label: 'Neighbourhood',
      fact: { name: 'Tranquility', status: 'Sold out' },
      faqs: []
    },

    /* ------------------------------------------------------------------ */
    {
      slug: 'arcadia',
      name: 'Arcadia',          // owner decision: the project is named Arcadia; Poojanahalli is only its location (village)
      order: 5,
      featured: 0,
      flagship: false,
      url: 'projects/arcadia/',
      former_urls: ['projects/poojanahalli/'],   // tiny redirect page kept there
      former_slugs: ['poojanahalli'],            // old ?project= links still resolve to Arcadia (RE.project)
      external_site: null,
      type: { key: 'residential-sites', label: 'Residential sites' },
      locality: { key: 'poojanahalli', label: 'SLK Tech Park' },
      village: 'Poojanahalli',
      locality_line: 'Poojanahalli · next to SLK Tech Park',
      address: 'Poojanahalli, next to SLK Tech Park, within BIAAPA limits',
      maps_query: 'Poojanahalli, Bengaluru',
      lat: 13.2108, lng: 77.6585,   // beside SLK Tech Park, at Poojanahalli (location)
      map_xy: { x: 198.1, y: 296.0, lx: 186.1, ly: 301.0 },
      stage: { key: 'sold-out', label: 'Sold out' },   // owner 2026-10-23
      status_label: 'Residential Sites',
      footer_group: 'Sold out',
      badges: ['Sold out'],
      rera: [],
      approvals: [
        { k: 'Land conversion', v: 'DC converted' },
        { k: 'Planning area', v: 'Within BIAAPA limits' },
        { k: 'Layout', v: 'Approved' },
        { k: 'Status', v: 'Sold out' }
      ],
      registration: 'Sold out',
      land_acres: null,
      plots_total: null,
      phases: [],
      plot_formats: [],
      size_min: null, size_max: null,
      sizes_label: null,
      price: { from_inr: null, to_inr: null, per_sqft: null, display: 'Sold out', short: 'Sold out', note: null },
      hero_facts: [{ b: 'Next', s: 'To SLK Tech Park' }, { b: 'BIAAPA', s: 'Limits' }],
      tagline: 'Approved, DC-converted residential sites next to SLK Tech Park.',
      kicker: 'Sold Out · Residential Sites · Poojanahalli',
      specs: [
        { k: 'Location', v: 'Poojanahalli' },
        { k: 'Neighbour', v: 'SLK Tech Park' },
        { k: 'Planning area', v: 'BIAAPA' },
        { k: 'Status', v: 'Sold out' }
      ],
      highlights: ['Sold out', 'DC converted', 'Approved', 'Within BIAAPA limits', 'Next to SLK Tech Park', 'Loan was available'],
      amenity_groups: [],
      connectivity: [
        { cat: 'Work', place: 'SLK Tech Park', mins: null, km: null, text: 'Adjacent', lm: null },
        { cat: 'Connectivity', place: 'NH-44 at the airport trumpet', mins: null, km: 1.6, lm: null },
        { cat: 'Airport & transit', place: 'Doddajala metro station (Blue Line, under construction)', mins: null, km: 5.4, lm: null },
        { cat: 'Airport & transit', place: 'Kempegowda International Airport', mins: null, km: 11.5, lm: 'airport' },
        { cat: 'Connectivity', place: 'Hebbal', mins: null, km: 24, lm: 'hebbal' }
      ],
      images: {
        cover: null,   // cards outside the project page show its name panel; no 3D renders (owner, 2026-10-23)
        thumb: null,
        gallery: [],
        plan_thumb: null,
        og: null
      },
      plan: null,
      layout_pdf: null,
      brochure_pdf: null,
      // the project's own logo (Rare Earth beside the project wordmark): name panels, featured cards, the listing (owner, 2026-10-23)
      logo: { dark: 'logos/arcadia-on-dark.webp', light: 'logos/arcadia-on-light.webp', w: 1468, h: 336, alt: 'Arcadia by Rare Earth' },
      art: { cls: 'a-arcadia', seed: 19, mark: { text: ['Rare Earth', 'Arcadia'] } },   // text wordmark ARCADIA (no logo file yet)
      theme: { mode: 'light', paper: 'light', hero: 'light', accent: '#9c7b49', accent2: '#4a3a22', paperColor: '#efe5d3', seed: 19 },
      story_label: 'First plot',
      fact: { name: 'Arcadia', status: 'Sold out' },
      faqs: []
    },

    /* ------------------------------------------------------------------ */
    {
      slug: 'elysia',
      name: 'Elysia',           // owner decision 2026-10-23: the project at Kadiganahalli is named Elysia
      order: 6,
      featured: 0,
      flagship: false,
      url: 'projects/elysia/',
      external_site: null,
      type: { key: 'residential-sites', label: 'Residential sites' },
      locality: { key: 'kadiganahalli', label: 'Kadiganahalli' },
      village: 'Kadiganahalli',   // Census 2011 spells it Kadigenahalli; the RTC spelling governs
      locality_line: 'Kadiganahalli · off Bellary Road',
      address: 'Kadiganahalli, off Bellary Road (NH-44), north Bengaluru',
      maps_query: '13.163542,77.632058',
      lat: 13.163542, lng: 77.632058,   // owner's Google Maps pin, 2026-10-23
      map_xy: { x: 158.9, y: 368.1, lx: 170.9, ly: 373.1 },
      stage: { key: 'sold-out', label: 'Sold out' },   // owner 2026-10-23
      status_label: 'Residential Sites',
      footer_group: 'Sold out',
      badges: ['Sold out'],
      rera: [],
      approvals: [],
      registration: 'Sold out',
      // from the proposed layout drawing (owner PDF, Jun 2023): 35 sites, total 54,481.04 sq ft.
      // Per-site areas are measured from the drawing (approximate): 1-17 about 1,390-1,560 sq ft, 18-34 about 1,170-1,200 sq ft, 35 about 9,600 sq ft.
      land_sqft: 54481, land_acres: 1.25,
      plots_total: 35,
      plots_label: '35 residential sites',
      phases: [],
      plot_formats: [
        { key: 'row-a', label: 'About 30 × 46–52', w: null, d: null, sqft: null, sqft_max: 1560, count: 17, facing: [], price_from: null },
        { key: 'row-b', label: 'About 30 × 39–40', w: null, d: null, sqft: null, sqft_max: 1200, count: 17, facing: [], price_from: null },
        { key: 'corner', label: 'Corner site, about 86 × 111', w: null, d: null, sqft: 9600, count: 1, facing: [], price_from: null }
      ],
      size_min: 1170, size_max: 9600,
      sizes_label: 'About 1,170 – 1,560 sq ft, plus a corner site of about 9,600 sq ft',
      price: { from_inr: null, to_inr: null, per_sqft: null, display: 'Sold out', short: 'Sold out', note: null },
      hero_facts: [{ b: '35', s: 'Sites' }, { b: '300 m', s: 'From NH-44' }, { b: '12 km', s: 'To the airport' }],
      tagline: 'Thirty-five residential sites just off Bellary Road, on the way to the airport.',
      kicker: 'Sold Out · Residential Sites · Kadiganahalli',
      specs: [
        { k: 'Location', v: 'Kadiganahalli, off Bellary Road (NH-44)' },
        { k: 'Type', v: 'Residential sites' },
        { k: 'Sites', v: '35, every one facing a road' },
        { k: 'Land', v: 'About 1.25 acres (54,481 sq ft)' },
        { k: 'Site sizes', v: 'About 1,170 – 1,560 sq ft, plus a ~9,600 sq ft corner site' },
        { k: 'Status', v: 'Sold out' }
      ],
      highlights: ['Sold out', '35 residential sites', 'Every site faces a road', 'A ~9,600 sq ft corner site', 'About 300 m from NH-44', 'About 12 km to the airport', 'On the airport growth corridor'],
      amenity_groups: [],
      // road distances: OpenStreetMap routing from the site pin, 23 Oct 2026 (rounded); NH-44 is straight-line
      connectivity: [
        { cat: 'Connectivity', place: 'Bellary Road · NH-44', mins: null, km: null, text: 'About 300 m', lm: null },
        { cat: 'Airport & transit', place: 'Kempegowda International Airport', mins: null, km: 12, lm: 'airport' },
        { cat: 'Airport & transit', place: 'Doddajala metro station (Blue Line, under construction)', mins: null, km: 5, lm: null },
        { cat: 'Work', place: 'Embassy Business Hub, Bellary Road', mins: null, km: 8, lm: null },
        { cat: 'Work', place: 'KIADB Aerospace & Hardware Park', mins: null, km: 10, lm: null },
        { cat: 'Work', place: 'Manyata Tech Park', mins: null, km: 18, lm: null },
        { cat: 'Education', place: 'Sir MVIT', mins: null, km: 5, lm: null },
        { cat: 'Education', place: 'Stonehill International School', mins: null, km: 6.5, lm: null },
        { cat: 'Health', place: 'Manipal Hospital, Yelahanka', mins: null, km: 8.5, lm: null },
        { cat: 'City', place: 'Yelahanka New Town', mins: null, km: 8.5, lm: null },
        { cat: 'City', place: 'Hebbal', mins: null, km: 16, lm: 'hebbal' }
      ],
      images: {
        cover: null,   // cards outside the Elysia page show its name panel, never the plan (owner, 2026-10-23)
        thumb: null,
        gallery: [],
        plan_thumb: null,
        og: null
      },
      plan: {
        title: 'Elysia layout',
        sheets: [
          {
            key: 'master', label: 'Layout', sub: '35 residential sites',
            src: 'renders/elysia-plan.svg', sm: 'renders/elysia-plan.svg', meta: 'renders/elysia-plan.meta.json', w: 1600, h: 801,
            caption: 'Rendered from the proposed layout drawing · indicative. Site numbers and shapes follow the drawing; site areas are measured from it and approximate; trees are illustrative. Shown turned on its side to fit the screen.'
          }
        ]
      },
      layout_pdf: null,
      brochure_pdf: null,
      // the project's own logo (Rare Earth beside the project wordmark): name panels, featured cards, the listing (owner, 2026-10-23)
      logo: { dark: 'logos/elysia-on-dark.webp', light: 'logos/elysia-on-light.webp', w: 812, h: 336, alt: 'Elysia by Rare Earth' },
      art: { cls: 'a-elysia', seed: 31, mark: { text: ['Rare Earth', 'Elysia'] } },
      theme: { mode: 'light', paper: 'light', hero: 'light', accent: '#4f7480', accent2: '#34505b', paperColor: '#eef0ec', seed: 31 },
      story_label: 'Neighbourhood',
      fact: { name: 'Elysia', sites: '35' },
      faqs: []
    }
  ];

  window.RE_PROJECTS.sort(function (a, b) { return a.order - b.order; });
})();
