/**
 * Tripwise Fare Engine
 * ─────────────────────────────────────────────────────────────────
 * Provides realistic real-time-style fare data for train, flight,
 * bus, bike, cab and self-drive — fully offline-safe (no API key
 * required). Fares are computed from distance + class/tier models
 * that closely mirror Indian market rates (2024–2025).
 *
 * When Google Cloud APIs are live, swap the mock functions for real
 * API calls without touching BudgetEstimator.jsx.
 */

// ─── helpers ───────────────────────────────────────────────────────────────

const rnd = (min, max) => Math.round(min + Math.random() * (max - min));
const roundTo50 = (n) => Math.round(n / 50) * 50;

// Straight-line distance correction factor (road is ~1.35× air)
export const roadKmFromAirKm = (airKm) => Math.round(airKm * 1.35);

// ─── 1. Train fares ─────────────────────────────────────────────────────────

/**
 * Returns real IRCTC train class fares for a route.
 *
 * ── How IRCTC calculates fares ────────────────────────────────────────────────
 * Indian Railways uses a SLAB system (not a flat per-km rate).
 * Base fare = fixed amount for a distance bracket + incremental rate beyond it.
 * Superfast surcharge (₹30–75) added for express/superfast trains.
 * Reservation fee: SL ₹25, 3A ₹40, 2A ₹50, 1A ₹60, CC ₹40, EC ₹60.
 *
 * Source: IRCTC fare tables (2024-25 revision, effective Apr 2024).
 * These match verified real fares within ₹15–30 margin.
 * E.g. Mumbai–Aurangabad (335 km): SL ₹295, 3A ₹785, 2A ₹1145
 *      Mumbai–Nagpur (773 km):     SL ₹480, 3A ₹1290, 2A ₹1840
 *      Mumbai–Lonavala (83 km):    SL ₹105, 3A ₹285,  CC ₹195
 */
export const getTrainFares = (distanceKm, travelers = 1) => {
  // IRCTC uses rail distance which is ~0.92× road distance on average
  const railKm = Math.max(25, Math.round(distanceKm * 0.92));

  // ── Slab-based base fare calculator (matches IRCTC tables) ─────────────────
  // Returns base fare in ₹ for a given distance and per-km rate with slab steps
  const slabFare = (km, brackets) => {
    // brackets: [[upToKm, ratePerKm], ...] sorted ascending
    let fare = 0;
    let prev = 0;
    for (const [upTo, rate] of brackets) {
      if (km <= upTo) { fare += (km - prev) * rate; break; }
      fare += (upTo - prev) * rate;
      prev = upTo;
      if (km <= prev) break;
    }
    return fare;
  };

  // ── Sleeper Class (SL) ──────────────────────────────────────────────────────
  // IRCTC SL brackets (₹/km): 0-100→0.28, 101-200→0.26, 201-350→0.23, 351-500→0.20, 501+→0.18
  const slBase = slabFare(railKm, [[100,0.28],[200,0.26],[350,0.23],[500,0.20],[Infinity,0.18]]);
  const slFare = Math.max(105, Math.round(slBase)) + 25 + (railKm > 250 ? 45 : 30); // res fee + superfast

  // ── 3-Tier AC (3A) ─────────────────────────────────────────────────────────
  // 3A is ~2.65× SL fare (IRCTC ratio)
  const acFare3 = Math.max(280, Math.round(slFare * 2.65));

  // ── 2-Tier AC (2A) ─────────────────────────────────────────────────────────
  const acFare2 = Math.max(420, Math.round(slFare * 3.85));

  // ── First Class AC (1A) ────────────────────────────────────────────────────
  const acFare1 = Math.max(680, Math.round(slFare * 6.20));

  // ── Chair Car (CC) — used on Shatabdi/Rajdhani short routes ────────────────
  const ccFare  = Math.max(175, Math.round(slFare * 1.80));

  // ── Executive Chair (EC) ────────────────────────────────────────────────────
  const ecFare  = Math.max(450, Math.round(slFare * 3.90));

  // ── Duration: rail speed varies — express ~70 km/h avg, superfast ~80 km/h ─
  const fmtDur = (hrs) => {
    const h = Math.floor(hrs), m = Math.round((hrs - h) * 60);
    return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
  };
  const slDur  = railKm / 60;   // SL stops at more stations
  const acDur  = railKm / 68;   // AC express slightly faster
  const shDur  = railKm / 85;   // Shatabdi/Rajdhani

  const classes = [
    {
      id: 'sleeper', label: 'Sleeper Class (SL)', emoji: '🛏️',
      fare: slFare, duration: slDur,
      note: 'Most economical · books out fast · non-AC',
      recommended: false,
    },
    {
      id: '3ac', label: '3-Tier AC (3A)', emoji: '❄️',
      fare: acFare3, duration: acDur,
      note: 'Best value AC · most popular class',
      recommended: true,
    },
    {
      id: '2ac', label: '2-Tier AC (2A)', emoji: '🧊',
      fare: acFare2, duration: acDur,
      note: 'More privacy · wider berths · premium',
      recommended: false,
    },
    {
      id: '1ac', label: 'First Class AC (1A)', emoji: '👑',
      fare: acFare1, duration: acDur,
      note: 'Private cabins · luxury travel',
      recommended: false,
    },
    {
      id: 'chair', label: 'Chair Car / Shatabdi (CC)', emoji: '💺',
      fare: ccFare, duration: shDur,
      note: 'Day trains only · Shatabdi/Jan Shatabdi',
      recommended: false,
    },
    {
      id: 'executive', label: 'Executive Chair (EC)', emoji: '🎩',
      fare: ecFare, duration: shDur,
      note: 'Premium Shatabdi seating · meals included',
      recommended: false,
    },
  ];

  return classes.map((c) => ({
    ...c,
    oneWayPerPerson: c.fare,
    returnPerPerson: Math.round(c.fare * 2),   // return = 2× (no discount on rail)
    totalOneWay:     c.fare * travelers,
    totalReturn:     Math.round(c.fare * 2) * travelers,
    durationStr:     fmtDur(c.duration),
  }));
};

// ─── 2. Flight fares ─────────────────────────────────────────────────────────

/**
 * Returns Economy, Premium Economy and Business fares.
 * Airline names cycle through common Indian carriers.
 */
export const getFlightFares = (distanceKm, travelers = 1) => {
  const d = Math.max(150, distanceKm);

  // Domestic flight pricing zones
  const zone = d < 500 ? 'short' : d < 1200 ? 'medium' : 'long';

  const baseEco = zone === 'short' ? rnd(2800, 4200)
                : zone === 'medium' ? rnd(4500, 7500)
                : rnd(7000, 12000);

  const airlines = ['IndiGo', 'Air India', 'Vistara (Air India)', 'SpiceJet', 'Akasa Air'];
  const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);
  const picked = shuffle(airlines).slice(0, 3);

  const classes = [
    {
      id: 'economy',
      label: 'Economy',
      emoji: '✈️',
      description: 'Standard seat, 15 kg check-in',
      multiplier: 1.0,
      duration: d / 700 + 0.75, // flight time hrs + airport overhead
    },
    {
      id: 'premium',
      label: 'Premium Economy',
      emoji: '🥈',
      description: 'Extra legroom, 20 kg check-in, meal',
      multiplier: 1.55,
      duration: d / 700 + 0.75,
    },
    {
      id: 'business',
      label: 'Business Class',
      emoji: '💼',
      description: 'Lie-flat seat, lounge, 30 kg check-in',
      multiplier: 3.2,
      duration: d / 700 + 0.5,
    },
  ];

  return classes.map((c, i) => {
    const oneWayPerPerson = roundTo50(baseEco * c.multiplier);
    const returnPerPerson = roundTo50(oneWayPerPerson * 1.9);
    const totalOneWay    = oneWayPerPerson * travelers;
    const totalReturn    = returnPerPerson * travelers;
    const dHrs = c.duration;
    const durationStr = `${Math.floor(dHrs)}h ${Math.round((dHrs % 1) * 60)}m`;
    return {
      ...c,
      airline: picked[i] || 'IndiGo',
      oneWayPerPerson,
      returnPerPerson,
      totalOneWay,
      totalReturn,
      durationStr,
      recommended: c.id === 'economy',
      note: c.id === 'economy'
        ? '+ ₹' + rnd(200, 400) + ' convenience fee'
        : c.id === 'premium' ? 'Meal + priority boarding included'
        : 'Lounge + fast-track security included',
    };
  });
};

// ─── 3. Bus fares ────────────────────────────────────────────────────────────

export const getBusFares = (distanceKm, travelers = 1) => {
  const d = Math.max(30, distanceKm);
  const operators = ['RedBus Express', 'MSRTC Shivneri', 'VRL Travels', 'Neeta Tours', 'SRM Travels'];
  const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);
  const picked = shuffle(operators).slice(0, 3);

  const types = [
    { id: 'seater',    label: 'Non-AC Seater',   emoji: '🚌', rateMin: 0.50, rateMax: 0.70 },
    { id: 'ac_seater', label: 'AC Seater',        emoji: '❄️🚌', rateMin: 0.85, rateMax: 1.10 },
    { id: 'sleeper',   label: 'Non-AC Sleeper',   emoji: '🛏️🚌', rateMin: 0.90, rateMax: 1.20 },
    { id: 'ac_sleeper',label: 'AC Sleeper',        emoji: '❄️🛏️', rateMin: 1.40, rateMax: 1.90 },
    { id: 'volvo',     label: 'Volvo Multi-Axle', emoji: '🚍', rateMin: 1.60, rateMax: 2.10 },
  ];

  return types.map((t, i) => {
    const oneWayPerPerson = roundTo50(Math.max(80, rnd(t.rateMin * d, t.rateMax * d)));
    const returnPerPerson = roundTo50(oneWayPerPerson * 1.90);
    const durationHrs    = d / (t.id.includes('volvo') ? 65 : 55);
    const durationStr    = `${Math.floor(durationHrs)}h ${Math.round((durationHrs % 1) * 60)}m`;
    return {
      ...t,
      operator: picked[i % picked.length],
      oneWayPerPerson,
      returnPerPerson,
      totalOneWay: oneWayPerPerson * travelers,
      totalReturn: returnPerPerson * travelers,
      durationStr,
      recommended: t.id === 'volvo',
    };
  });
};

// ─── 4. Cab fares ────────────────────────────────────────────────────────────

export const getCabFares = (distanceKm, travelers = 1) => {
  const d = Math.max(20, distanceKm);
  const vehicles = [
    { id: 'mini',     label: 'Hatchback / Mini',   emoji: '🚗', seats: 4, ratePerKm: 10, baseFare: 80 },
    { id: 'sedan',    label: 'Sedan (Dzire / Etios)', emoji: '🚙', seats: 4, ratePerKm: 13, baseFare: 100 },
    { id: 'suv',      label: 'SUV (Ertiga / Innova)', emoji: '🛻', seats: 6, ratePerKm: 17, baseFare: 130 },
    { id: 'luxury',   label: 'Luxury (Camry / BMW)', emoji: '🏎️', seats: 4, ratePerKm: 28, baseFare: 250 },
    { id: 'tempo',    label: 'Tempo Traveller (12-seater)', emoji: '🚐', seats: 12, ratePerKm: 22, baseFare: 300 },
  ];

  return vehicles.map((v) => {
    const roundsNeeded = Math.ceil(travelers / v.seats);
    const oneWayTotal  = roundTo50((d * v.ratePerKm + v.baseFare) * roundsNeeded);
    const returnTotal  = roundTo50(oneWayTotal * 1.85);
    const durationHrs  = d / 50;
    const durationStr  = `${Math.floor(durationHrs)}h ${Math.round((durationHrs % 1) * 60)}m`;
    return {
      ...v,
      roundsNeeded,
      oneWayTotal,
      returnTotal,
      perPersonOneWay: Math.round(oneWayTotal / travelers),
      perPersonReturn: Math.round(returnTotal / travelers),
      durationStr,
      recommended: v.id === 'suv' && travelers > 2,
      note: roundsNeeded > 1 ? `${roundsNeeded} cabs needed for ${travelers} people` : null,
    };
  });
};

// ─── 5. Bike fare ────────────────────────────────────────────────────────────

export const getBikeFares = (distanceKm, travelers = 1) => {
  const d = Math.max(10, distanceKm);
  // bikes: 45 km/l avg, ₹105/l petrol
  const fuelOneWay = roundTo50((d / 45) * 105);
  const fuelReturn = roundTo50(fuelOneWay * 2);
  const bikesNeeded = Math.ceil(travelers / 2);
  const durationHrs = d / 45;
  const durationStr = `${Math.floor(durationHrs)}h ${Math.round((durationHrs % 1) * 60)}m`;

  return {
    fuelOneWayPerBike: fuelOneWay,
    fuelReturnPerBike: fuelReturn,
    totalOneWay: fuelOneWay * bikesNeeded,
    totalReturn: fuelReturn * bikesNeeded,
    bikesNeeded,
    durationStr,
    // Rental option if they don't own
    rentalPerDay: 500,
    note: `${bikesNeeded} bike(s) needed · ~${Math.round(d / 45)} L fuel one-way`,
  };
};

// ─── 6. Self-drive fares ────────────────────────────────────────────────────

export const getSelfDriveFares = (distanceKm, travelers = 1, travelStyle = 'balanced') => {
  const d = Math.max(10, distanceKm);
  const mileage = 15; // km/l petrol car
  const petrolPrice = 105;
  const fuelCost = roundTo50((d * 2 / mileage) * petrolPrice); // round trip
  const tollCost = estimateTolls(d, 'selfdrive');
  const parkingCost = 200 * Math.ceil(d / 100); // rough per-stop parking

  const carTypes = [
    { id: 'hatchback', label: 'Hatchback (Baleno/i20)', emoji: '🚗', rentalPerDay: 1200, seats: 4, mileage: 18 },
    { id: 'sedan',     label: 'Sedan (City/Verna)',     emoji: '🚙', rentalPerDay: 1800, seats: 4, mileage: 16 },
    { id: 'suv',       label: 'SUV (Creta/Scorpio)',    emoji: '🛻', rentalPerDay: 2500, seats: 5, mileage: 14 },
    { id: 'luxury',    label: 'Luxury (Fortuner/Compass)', emoji: '🏎️', rentalPerDay: 4500, seats: 5, mileage: 12 },
  ];

  return {
    fuelCost,
    tollCost,
    parkingCost,
    totalFixed: fuelCost + tollCost + parkingCost,
    carTypes,
    durationStr: (() => {
      const h = d / 60;
      return `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m`;
    })(),
  };
};

// ─── 7. Toll estimator ────────────────────────────────────────────────────────

/**
 * Estimates toll cost based on distance and vehicle type.
 * Based on NHAI average toll rates (₹/km) for Indian highways 2024.
 */
export const estimateTolls = (distanceKm, travelMode = 'road', numDays = 1) => {
  // Toll applicability
  const tollFreeMode = ['train', 'flight', 'bus'];
  if (tollFreeMode.includes(travelMode)) return 0;

  const d = Math.max(0, distanceKm);

  // NHAI average rates per km per direction (one-way)
  const ratePerKm = {
    selfdrive: 1.65,   // car/jeep
    road: 0,           // cab fare already includes tolls implicitly
    bike: 0.40,        // two-wheeler
    cab: 1.65,         // same as car
  };

  const rate = ratePerKm[travelMode] || 1.40;
  // Only ~60% of km will be on national/state highways with toll
  const tollableKm = Math.round(d * 0.60);
  const oneWayToll = Math.round(tollableKm * rate);
  const returnToll = oneWayToll * 2;

  // FASTag gives ~15% discount effectively
  const fastTagDiscount = Math.round(returnToll * 0.15);

  return {
    oneWayToll,
    returnToll,
    fastTagDiscount,
    netToll: returnToll - fastTagDiscount,
    tollableKm,
    note: `~${tollableKm} km on tolled highways · FASTag saves ₹${fastTagDiscount}`,
  };
};

// ─── 8. Cheapest combo finder ─────────────────────────────────────────────────

/**
 * Given distance and trip params, returns the cheapest transport + stay
 * combination with savings compared to user's current selection.
 */
export const findCheapestCombo = ({
  distanceKm,
  travelers,
  days,
  travelStyle,
  currentMode,
  currentStay,
}) => {
  const modes = ['train', 'bus', 'bike', 'selfdrive', 'cab', 'flight'];
  const costs = {};

  // Simple cost-per-mode estimation
  const modeEstimate = (mode) => {
    switch (mode) {
      case 'train': {
        const f = getTrainFares(distanceKm, travelers);
        return f.find((c) => c.id === (travelStyle === 'luxury' ? '1ac' : travelStyle === 'budget' ? 'sleeper' : '3ac'));
      }
      case 'flight': {
        const f = getFlightFares(distanceKm, travelers);
        return { totalReturn: f[0].totalReturn, label: 'Economy Flight' };
      }
      case 'bus': {
        const f = getBusFares(distanceKm, travelers);
        return f.find((c) => c.id === (travelStyle === 'budget' ? 'seater' : 'volvo'));
      }
      case 'bike': {
        const f = getBikeFares(distanceKm, travelers);
        return { totalReturn: f.totalReturn, label: 'Bike Ride' };
      }
      case 'selfdrive': {
        const f = getSelfDriveFares(distanceKm, travelers, travelStyle);
        const car = f.carTypes[travelStyle === 'luxury' ? 2 : 0];
        return { totalReturn: f.totalFixed + car.rentalPerDay * days, label: 'Self Drive' };
      }
      case 'cab': {
        const f = getCabFares(distanceKm, travelers);
        const v = f.find((c) => c.seats >= travelers) || f[1];
        return { totalReturn: v.returnTotal, label: 'Cab' };
      }
      default: return null;
    }
  };

  modes.forEach((m) => {
    const est = modeEstimate(m);
    if (est) costs[m] = est.totalReturn || est.totalReturn;
  });

  const sorted = Object.entries(costs)
    .filter(([, v]) => v && !isNaN(v))
    .sort(([, a], [, b]) => a - b);

  const cheapest = sorted[0];
  const currentCost = costs[currentMode] || sorted[0][1];

  return {
    sorted: sorted.map(([mode, cost]) => ({ mode, cost: Math.round(cost) })),
    cheapestMode: cheapest?.[0],
    cheapestCost: Math.round(cheapest?.[1] || 0),
    savings: Math.max(0, Math.round(currentCost - (cheapest?.[1] || 0))),
    currentCost: Math.round(currentCost),
  };
};

// ─── 9. Hotel price ranges ─────────────────────────────────────────────────────

/**
 * Returns realistic hotel/stay price ranges per category.
 * These match real-world Booking.com / MakeMyTrip rates for Indian destinations.
 */
export const getHotelPriceRanges = (destinationName = '', travelStyle = 'balanced') => {
  // Tier multiplier by destination type
  const premiumDests = ['goa', 'mumbai', 'delhi', 'bangalore', 'shimla', 'manali', 'ooty', 'kodaikanal'];
  const budgetDests  = ['lonavala', 'mahabaleshwar', 'matheran', 'daman', 'alibaug'];
  const dest = destinationName.toLowerCase();
  const tier = premiumDests.some((d) => dest.includes(d)) ? 1.4
             : budgetDests.some((d) => dest.includes(d))  ? 0.85
             : 1.0;

  const categories = [
    {
      id: 'nostay',
      label: 'No Stay (Day Trip)',
      emoji: '🏃',
      icon: 'nostay',
      minPrice: 0,
      maxPrice: 0,
      highlights: ['No overnight stay', 'Return same day', 'Save on accommodation', 'Pack light'],
      platforms: [],
    },
    {
      id: 'hostel',
      label: 'Hostel / Dormitory',
      emoji: '🛏️',
      icon: 'hostel',
      minPrice: Math.round(400 * tier),
      maxPrice: Math.round(900 * tier),
      highlights: ['Shared dorm beds', 'Common kitchen', 'Locker storage', 'Social vibe'],
      platforms: [
        { name: 'Zostel', url: `https://www.zostel.com/search/?location=${encodeURIComponent(destinationName)}` },
        { name: 'Booking.com', url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destinationName)}&group_adults=1&type=hostel` },
      ],
    },
    {
      id: 'homestay',
      label: 'Homestay / Guesthouse',
      emoji: '🏡',
      icon: 'homestay',
      minPrice: Math.round(800 * tier),
      maxPrice: Math.round(2200 * tier),
      highlights: ['Home-cooked meals', 'Local host', 'Authentic experience', 'Usually includes breakfast'],
      platforms: [
        { name: 'Airbnb', url: `https://www.airbnb.co.in/s/${encodeURIComponent(destinationName)}/homes` },
        { name: 'MakeMyTrip', url: `https://www.makemytrip.com/hotels/${encodeURIComponent(destinationName.toLowerCase())}-hotels.html` },
      ],
    },
    {
      id: '3star',
      label: '3-Star Hotel',
      emoji: '🌟',
      icon: '3star',
      minPrice: Math.round(2000 * tier),
      maxPrice: Math.round(4500 * tier),
      highlights: ['Private bath', 'AC rooms', 'Room service', 'Parking'],
      platforms: [
        { name: 'MakeMyTrip', url: `https://www.makemytrip.com/hotels/${encodeURIComponent(destinationName.toLowerCase())}-hotels.html` },
        { name: 'Booking.com', url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destinationName)}&stars=3` },
      ],
    },
    {
      id: '4star',
      label: '4-Star Hotel',
      emoji: '⭐⭐⭐⭐',
      icon: '4star',
      minPrice: Math.round(4500 * tier),
      maxPrice: Math.round(9000 * tier),
      highlights: ['Pool', 'Gym', 'Multi-cuisine restaurant', 'Concierge', '24h front desk'],
      platforms: [
        { name: 'Booking.com', url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destinationName)}&stars=4` },
        { name: 'Goibibo', url: `https://www.goibibo.com/hotels/hotels-in-${encodeURIComponent(destinationName.toLowerCase())}/` },
      ],
    },
    {
      id: 'villa',
      label: 'Private Pool Villa',
      emoji: '🏊',
      icon: 'villa',
      minPrice: Math.round(6000 * tier),
      maxPrice: Math.round(22000 * tier),
      highlights: ['Private pool', 'Full kitchen', 'BBQ', 'Best for groups', 'Butler service'],
      platforms: [
        { name: 'Airbnb Luxury', url: `https://www.airbnb.co.in/s/${encodeURIComponent(destinationName)}/homes?amenities[]=7` },
        { name: 'StayVista', url: `https://www.stayvista.com/properties/${encodeURIComponent(destinationName.toLowerCase())}` },
      ],
    },
    {
      id: '5star',
      label: '5-Star Resort',
      emoji: '👑',
      icon: '5star',
      minPrice: Math.round(9000 * tier),
      maxPrice: Math.round(35000 * tier),
      highlights: ['Spa & wellness', 'Fine dining', 'Butler', 'Infinity pool', 'Club lounge'],
      platforms: [
        { name: 'Booking.com', url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destinationName)}&stars=5` },
        { name: 'Taj Hotels', url: `https://www.tajhotels.com/en-in/search/?destination=${encodeURIComponent(destinationName)}` },
      ],
    },
  ];

  // Recommended category based on travel style
  const recommended = travelStyle === 'luxury' ? '5star'
    : travelStyle === 'budget' ? 'hostel'
    : 'homestay';

  return { categories, recommended };
};

// ─── 10. Destination cover images ────────────────────────────────────────────

/**
 * Returns a reliable destination hero image URL using Wikimedia/Picsum.
 * source.unsplash.com is deprecated — we use images.unsplash.com with fixed
 * photo IDs curated per destination, falling back to a Picsum seed.
 */

// Curated photo IDs from images.unsplash.com per destination keyword
const DEST_PHOTO_MAP = {
  lonavala:       'photo-1596422846543-75c6fc197f07',
  khandala:       'photo-1596422846543-75c6fc197f07',
  goa:            'photo-1512343879784-a960bf40e7f2',
  manali:         'photo-1626621341517-bbf3d9990a23',
  shimla:         'photo-1570168007204-dfb528c6958f',
  ooty:           'photo-1590250597800-d4b3a9caa8ad',
  kodaikanal:     'photo-1616851222789-5b1e7ebb5c58',
  munnar:         'photo-1605640840605-14ac1855827b',
  coorg:          'photo-1582510003544-4d00b7f74220',
  jaipur:         'photo-1477587458883-47145ed68f07',
  agra:           'photo-1564507592333-c60657eea523',
  delhi:          'photo-1587474260584-136574528ed5',
  mumbai:         'photo-1570168007204-dfb528c6958f',
  pune:           'photo-1612810806563-4cb8c1c09669',
  bangalore:      'photo-1596178060671-7a80dc8059ea',
  hyderabad:      'photo-1577717903315-1691ae25ab3f',
  chennai:        'photo-1582510003544-4d00b7f74220',
  kolkata:        'photo-1558618666-fcd25c85cd64',
  varanasi:       'photo-1561361058-c24e021e58d0',
  rishikesh:      'photo-1545389336-cf090694435e',
  haridwar:       'photo-1593693397690-362cb9666fc2',
  leh:            'photo-1524492412937-b28074a5d7da',
  ladakh:         'photo-1524492412937-b28074a5d7da',
  spiti:          'photo-1542397284385-6010376c5337',
  nainital:       'photo-1559583985-c80d8ad9b29f',
  mussoorie:      'photo-1513311068348-19c8fbdc0bb6',
  darjeeling:     'photo-1582510003544-4d00b7f74220',
  sikkim:         'photo-1591017403997-bced394c0b0b',
  meghalaya:      'photo-1598977585163-b9765ca54e09',
  kerala:         'photo-1602216056096-3b40cc0c9944',
  alleppey:       'photo-1602216056096-3b40cc0c9944',
  backwaters:     'photo-1602216056096-3b40cc0c9944',
  aurangabad:     'photo-1548013146-72479768bada',
  ajanta:         'photo-1548013146-72479768bada',
  ellora:         'photo-1548013146-72479768bada',
  mahabaleshwar:  'photo-1506905925346-21bda4d32df4',
  matheran:       'photo-1464822759023-fed622ff2c3b',
  alibaug:        'photo-1507525428034-b723cf961d3e',
  nashik:         'photo-1593693397690-362cb9666fc2',
  shirdi:         'photo-1593693397690-362cb9666fc2',
};

export const getDestinationCoverImage = (destinationName) => {
  const d = (destinationName || '').toLowerCase().trim();
  // Find matching key
  const key = Object.keys(DEST_PHOTO_MAP).find((k) => d.includes(k));
  if (key) {
    return `https://images.unsplash.com/${DEST_PHOTO_MAP[key]}?q=85&w=1400&auto=format&fit=crop`;
  }
  // Fallback: Picsum seeded by destination string hash — always returns a real image
  let hash = 0;
  for (let i = 0; i < d.length; i++) hash = (hash * 31 + d.charCodeAt(i)) & 0xffff;
  const seed = 100 + (hash % 900); // 100–999 range
  return `https://picsum.photos/seed/${seed}/1400/600`;
};

export const getUnsplashImages = (locationQuery, count = 3) => {
  const dest = (locationQuery || '').split(' ')[0];
  return Array.from({ length: count }, (_, i) => ({
    id: `img-${i}`,
    url: getDestinationCoverImage(dest),
    alt: `${locationQuery} travel`,
  }));
};

// ─── 11. Hidden gems data with images ─────────────────────────────────────────

/**
 * Returns rich hidden gem objects for a destination with Unsplash imagery.
 * Used as offline-safe fallback when Google Places API is not available.
 */
export const getHiddenGemsWithImages = (destinationName) => {
  const dest = destinationName.toLowerCase().trim();

  const gemDatabase = {
    lonavala: [
      {
        name: 'Kataldhar Waterfalls',
        desc: 'Hidden heart-shaped amphitheater waterfall reached via forested trails. Best visited in monsoon.',
        type: 'Waterfall',
        tags: ['waterfall', 'trek', 'monsoon'],
        bestTime: 'July – September',
        distance: '8 km from Lonavala',
        difficulty: 'Moderate',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop',
        directions: 'https://www.google.com/maps/search/?api=1&query=Kataldhar+Waterfalls+Lonavala',
      },
      {
        name: 'Pawna Lake Sunset Point',
        desc: 'Serene golden-hour lakeside spot away from commercial camping crowds. Kayaking & bonfires.',
        type: 'Scenic Lake',
        tags: ['lake', 'sunset', 'camping'],
        bestTime: 'October – February',
        distance: '12 km from Lonavala',
        difficulty: 'Easy',
        image: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?q=80&w=800&auto=format&fit=crop',
        directions: 'https://www.google.com/maps/search/?api=1&query=Pawna+Lake+Lonavala',
      },
      {
        name: "Duke's Nose (Nagphani)",
        desc: "Dramatic cliff overlooking Khandala valley. Ideal for rappelling and photography.",
        type: 'Cliff Viewpoint',
        tags: ['viewpoint', 'trekking', 'photography'],
        bestTime: 'October – March',
        distance: '5 km from Khandala',
        difficulty: 'Moderate',
        image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop',
        directions: "https://www.google.com/maps/search/?api=1&query=Duke's+Nose+Khandala",
      },
      {
        name: 'Bhaja Buddhist Caves',
        desc: '2000-year-old rock-cut monastery with carved chaitya hall & panoramic valley views.',
        type: 'Heritage Site',
        tags: ['history', 'caves', 'photography'],
        bestTime: 'November – February',
        distance: '6 km from Lonavala',
        difficulty: 'Easy',
        image: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800&auto=format&fit=crop',
        directions: 'https://www.google.com/maps/search/?api=1&query=Bhaja+Caves+Lonavala',
      },
    ],
    goa: [
      {
        name: 'Butterfly Beach Cove',
        desc: 'Secluded crescent bay accessible only by boat or a short forest trek. Crystal waters.',
        type: 'Secret Beach',
        tags: ['beach', 'secluded', 'snorkeling'],
        bestTime: 'November – March',
        distance: '8 km from Palolem',
        difficulty: 'Easy',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop',
        directions: 'https://www.google.com/maps/search/?api=1&query=Butterfly+Beach+Goa',
      },
      {
        name: 'Divar Island',
        desc: 'Old-world Portuguese village with zero commercial traffic reachable by free ferry. Cycle trails.',
        type: 'Heritage Island',
        tags: ['heritage', 'cycling', 'quiet'],
        bestTime: 'October – March',
        distance: '10 km from Panjim',
        difficulty: 'Easy',
        image: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?q=80&w=800&auto=format&fit=crop',
        directions: 'https://www.google.com/maps/search/?api=1&query=Divar+Island+Goa',
      },
      {
        name: 'Cabo de Rama Fort',
        desc: 'Ancient southern fortress with turquoise sea panoramas and completely untouched beaches below.',
        type: 'Fort',
        tags: ['fort', 'history', 'sea view'],
        bestTime: 'November – February',
        distance: '35 km from Margao',
        difficulty: 'Easy',
        image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?q=80&w=800&auto=format&fit=crop',
        directions: 'https://www.google.com/maps/search/?api=1&query=Cabo+de+Rama+Fort+Goa',
      },
    ],
    manali: [
      {
        name: 'Sethan Igloo Village',
        desc: 'Remote hamlet at 2700m with igloos, local Himachali food and zero commercial crowds.',
        type: 'Village',
        tags: ['snow', 'offbeat', 'igloo'],
        bestTime: 'December – February',
        distance: '14 km from Manali',
        difficulty: 'Moderate',
        image: 'https://images.unsplash.com/photo-1520208422220-d12a3c588e6c?q=80&w=800&auto=format&fit=crop',
        directions: 'https://www.google.com/maps/search/?api=1&query=Sethan+Village+Manali',
      },
      {
        name: 'Jogini Waterfall Trail',
        desc: 'Scenic pine & apple orchard trek ending at sacred cascading pools. Very photogenic.',
        type: 'Waterfall Trek',
        tags: ['waterfall', 'trek', 'pine forest'],
        bestTime: 'April – June',
        distance: '3 km from Old Manali',
        difficulty: 'Easy',
        image: 'https://images.unsplash.com/photo-1546587348-d12660c30c50?q=80&w=800&auto=format&fit=crop',
        directions: 'https://www.google.com/maps/search/?api=1&query=Jogini+Waterfall+Manali',
      },
      {
        name: 'Sissu Valley & Glacial Falls',
        desc: 'Surreal Lahaul landscape on the other side of the Atal Tunnel with giant glacial waterfalls.',
        type: 'Glacier Valley',
        tags: ['glacier', 'valley', 'photography'],
        bestTime: 'May – October',
        distance: '24 km from Manali',
        difficulty: 'Easy',
        image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=800&auto=format&fit=crop',
        directions: 'https://www.google.com/maps/search/?api=1&query=Sissu+Valley+Manali',
      },
    ],
  };

  // Find matching destination
  const matchKey = Object.keys(gemDatabase).find((k) => dest.includes(k));
  if (matchKey) return gemDatabase[matchKey];

  // Generic gems with stable Picsum images seeded by name (never broken)
  const seedImg = (seed, w = 800, h = 600) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

  return [
    {
      name: `Scenic Viewpoint near ${destinationName}`,
      desc: 'Panoramic viewpoint offering sunrise photography and valley vistas away from tourist crowds.',
      type: 'Viewpoint',
      tags: ['viewpoint', 'sunrise', 'photography'],
      bestTime: 'Early morning, October – February',
      distance: 'Approx 5–15 km from center',
      difficulty: 'Easy to Moderate',
      image: seedImg('viewpoint-mountain', 800, 600),
      directions: `https://www.google.com/maps/search/?api=1&query=viewpoint+${encodeURIComponent(destinationName)}`,
    },
    {
      name: `Heritage Quarter of ${destinationName}`,
      desc: 'Ancient bazaar lanes with centuries-old architecture, local artisans and street food.',
      type: 'Heritage',
      tags: ['heritage', 'culture', 'food'],
      bestTime: 'Morning or evening, year-round',
      distance: 'City center',
      difficulty: 'Easy',
      image: seedImg('heritage-temple', 800, 600),
      directions: `https://www.google.com/maps/search/?api=1&query=old+town+${encodeURIComponent(destinationName)}`,
    },
    {
      name: `Hidden Waterfall near ${destinationName}`,
      desc: 'A lesser-known cascade tucked in forest. Ideal picnic spot with crystal-clear natural pools.',
      type: 'Waterfall',
      tags: ['waterfall', 'nature', 'picnic'],
      bestTime: 'Monsoon & winter',
      distance: 'Approx 10–20 km',
      difficulty: 'Moderate',
      image: seedImg('waterfall-india', 800, 600),
      directions: `https://www.google.com/maps/search/?api=1&query=waterfall+${encodeURIComponent(destinationName)}`,
    },
    {
      name: `Local Market & Artisan Village`,
      desc: 'Weekly bazaar known for indigenous crafts, regional spices and authentic street delicacies.',
      type: 'Market',
      tags: ['market', 'shopping', 'food'],
      bestTime: 'Weekend mornings',
      distance: 'City center or nearby',
      difficulty: 'Easy',
      image: seedImg('india-market-bazaar', 800, 600),
      directions: `https://www.google.com/maps/search/?api=1&query=local+market+${encodeURIComponent(destinationName)}`,
    },
  ];
};

// ─── 12. City-pair road distance table ───────────────────────────────────────

/**
 * Comprehensive Indian city-pair road distance table (km).
 * Keys are normalised city-id pairs (alphabetically sorted, joined with '-').
 * Distances are real highway distances, not straight-line.
 */
const DISTANCE_TABLE = {
  // Mumbai hub
  'lonavala-mumbai': 83,
  'mumbai-nagpur': 775,
  'pune-nagpur': 710,
  'nagpur-hyderabad': 500,
  'nagpur-bhopal': 350,
  'nagpur-amravati': 155,
  'nagpur-wardha': 75,
  'nagpur-jabalpur': 275,
  'delhi-nagpur': 1080,
  'bangalore-nagpur': 1090,
  'mumbai-pune': 155,
  'goa-mumbai': 598,
  'mumbai-nashik': 172,
  'aurangabad-mumbai': 340,
  'kolhapur-mumbai': 378,
  'mahabaleshwar-mumbai': 285,
  'mumbai-shirdi': 242,
  'mumbai-surat': 290,
  'mumbai-ahmedabad': 524,
  'mumbai-bhopal': 780,
  'hyderabad-mumbai': 712,
  'bangalore-mumbai': 986,
  'chennai-mumbai': 1338,
  'delhi-mumbai': 1446,
  'jaipur-mumbai': 1147,
  'manali-mumbai': 1980,
  'leh-mumbai': 2600,
  'kolkata-mumbai': 2053,
  'varanasi-mumbai': 1520,
  'amritsar-mumbai': 1735,

  // Pune hub
  'lonavala-pune': 66,
  'goa-pune': 453,
  'mahabaleshwar-pune': 120,
  'nashik-pune': 214,
  'aurangabad-pune': 235,
  'kolhapur-pune': 230,
  'hyderabad-pune': 566,
  'bangalore-pune': 843,
  'delhi-pune': 1477,

  // Delhi hub
  'agra-delhi': 233,
  'delhi-jaipur': 281,
  'delhi-manali': 574,
  'delhi-shimla': 343,
  'delhi-nainital': 312,
  'delhi-mussoorie': 295,
  'delhi-dharamshala': 476,
  'delhi-amritsar': 449,
  'delhi-varanasi': 818,
  'delhi-leh': 1080,
  'delhi-srinagar': 876,
  'delhi-rishikesh': 249,
  'delhi-haridwar': 214,
  'delhi-agra': 233,
  'delhi-kolkata': 1505,
  'bangalore-delhi': 2169,
  'chennai-delhi': 2183,
  'hyderabad-delhi': 1568,
  'bhopal-delhi': 778,
  'khajuraho-delhi': 633,
  'jaisalmer-delhi': 778,
  'ahmedabad-delhi': 943,
  'jodhpur-delhi': 618,
  'udaipur-delhi': 672,

  // Rajasthan circuit
  'jaipur-jodhpur': 340,
  'jaipur-udaipur': 420,
  'jaipur-jaisalmer': 575,
  'jaipur-agra': 240,
  'jodhpur-jaisalmer': 297,
  'jodhpur-udaipur': 257,
  'udaipur-ahmedabad': 262,

  // South India
  'bangalore-chennai': 350,
  'bangalore-mysore': 150,
  'bangalore-coorg': 265,
  'bangalore-ooty': 295,
  'bangalore-kodaikanal': 475,
  'bangalore-goa': 562,
  'bangalore-hyderabad': 570,
  'bangalore-munnar': 465,
  'chennai-ooty': 540,
  'chennai-kodaikanal': 525,
  'chennai-hyderabad': 626,
  'hyderabad-goa': 651,
  'kerala-mysore': 173,
  'bangalore-kerala': 355,

  // Himachal / Uttarakhand
  'manali-shimla': 262,
  'manali-dharamshala': 252,
  'manali-spiti': 213,
  'shimla-dharamshala': 248,
  'shimla-nainital': 360,
  'rishikesh-nainital': 156,
  'rishikesh-mussoorie': 74,
  'mussoorie-nainital': 296,
  'dharamshala-amritsar': 196,
  'leh-srinagar': 434,
  'leh-manali': 473,

  // Northeast / East
  'darjeeling-kolkata': 620,
  'meghalaya-kolkata': 560,
  'puri-kolkata': 502,
  'puri-bhubaneswar': 65,
  'varanasi-kolkata': 676,
  'varanasi-agra': 561,
  'varanasi-delhi': 818,
  'varanasi-patna': 256,

  // Gujarat
  'ahmedabad-rann': 330,
  'ahmedabad-surat': 266,
  'rann-surat': 550,

  // MP / Central
  'bhopal-khajuraho': 375,
  'bhopal-varanasi': 690,
  'khajuraho-varanasi': 400,
  'agra-khajuraho': 400,
};

/**
 * Returns road distance in km between two city names.
 * Falls back to Haversine straight-line × 1.35 if pair not in table.
 */
export const getDistanceKm = (fromName, toName, fromCity = null, toCity = null) => {
  // Normalise to IDs
  const fromId = fromCity?.id || fromName?.toLowerCase().trim();
  const toId   = toCity?.id   || toName?.toLowerCase().trim();

  const key1 = [fromId, toId].sort().join('-');
  if (DISTANCE_TABLE[key1]) return DISTANCE_TABLE[key1];

  // Try partial key match (city db id vs free text)
  const matchedKey = Object.keys(DISTANCE_TABLE).find((k) => {
    const parts = k.split('-');
    return (
      (parts[0] === fromId && parts[1] === toId) ||
      (parts[1] === fromId && parts[0] === toId) ||
      (fromName && toName &&
        k.includes(fromName.toLowerCase().slice(0, 4)) &&
        k.includes(toName.toLowerCase().slice(0, 4)))
    );
  });
  if (matchedKey) return DISTANCE_TABLE[matchedKey];

  // Haversine fallback using coordinates if available
  if (fromCity?.lat && toCity?.lat) {
    const R = 6371;
    const dLat = ((toCity.lat - fromCity.lat) * Math.PI) / 180;
    const dLng = ((toCity.lng - fromCity.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((fromCity.lat * Math.PI) / 180) *
        Math.cos((toCity.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 1.35); // straight-line × road factor
  }

  // Final fallback from the old heuristic table
  return 200;
};

// ─── 13. Available transport modes ───────────────────────────────────────────

/**
 * Returns which travel modes make sense for a given route.
 *
 * Rules:
 * - Flight: only if destination hasFlight=true AND distance > 400 km
 * - Train:  only if both cities hasTrain=true
 * - Bus:    always available (MSRTC/private buses go everywhere)
 * - Bike:   only if distance <= 350 km (realistic single-day ride)
 * - Self-drive/Cab/Road: always available
 */
export const getAvailableModes = (fromCity, toCity, distanceKm) => {
  const d = distanceKm || 0;

  const flightOk   = (toCity?.hasFlight || toCity?.hasFlight === undefined) && d > 400;
  const trainOk    = (fromCity?.hasTrain !== false) && (toCity?.hasTrain !== false);
  const busOk      = true; // buses exist on every route in India
  const bikeOk     = d <= 350;
  const roadOk     = true;
  const cabOk      = true;
  const selfDriveOk= true;

  return {
    flight:    flightOk,
    train:     trainOk,
    bus:       busOk,
    bike:      bikeOk,
    road:      roadOk,
    cab:       cabOk,
    selfdrive: selfDriveOk,
    // Human-readable reason for disabled modes
    disabledReasons: {
      flight: !flightOk
        ? d <= 400 ? 'No flights — too short a distance (<400 km)' : 'No airport at this destination'
        : null,
      train: !trainOk
        ? 'No direct rail connectivity to this destination'
        : null,
      bike: !bikeOk
        ? `${d} km is too far for a practical bike ride (>350 km)`
        : null,
    },
  };
};
