/**
 * Comprehensive Travel Cost, Curated Stays, Itineraries & AI Destination Engine
 */

export const DESTINATIONS_DB = {
  lonavala: {
    name: 'Lonavala & Khandala',
    state: 'Maharashtra',
    tagline: 'Misty Sahyadri Peaks, Waterfalls & Monsoon Treks',
    image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=1200&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=600&auto=format&fit=crop',
    ],
    bestSeason: 'July to February (Monsoon Waterfalls & Pleasant Winter)',
    weather: '20°C - 26°C, Breezy & Lush Green',
    recommendedStays: [
      {
        name: 'The Machan Treehouse Resort',
        type: 'Eco Luxury Treehouse',
        pricePerNight: 9500,
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=400&auto=format&fit=crop',
        highlight: 'Overlooking Jambulne forest valley, 100% sustainable',
      },
      {
        name: 'Pawna Lakefront Private Pool Villa',
        type: '4-BHK Luxury Villa',
        pricePerNight: 7500,
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=400&auto=format&fit=crop',
        highlight: 'Infinity pool facing the lake, barbecue setup',
      },
      {
        name: 'Tungarli Heritage Homestay',
        type: 'Cozy Mountain Cottage',
        pricePerNight: 2400,
        rating: 4.5,
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=400&auto=format&fit=crop',
        highlight: 'Home-cooked Maharashtrian meals, quiet pine garden',
      },
      {
        name: 'Zostel Plus Lonavala',
        type: 'Backpacker Social Hostel',
        pricePerNight: 850,
        rating: 4.6,
        image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=400&auto=format&fit=crop',
        highlight: 'Rooftop cafe, board games, community treks',
      },
    ],
    itinerary: [
      {
        day: 1,
        title: 'Waterfalls, Fort View & Sunset Lake',
        activities: [
          'Morning drive via Mumbai-Pune Expressway with scenic Ghats breakfast',
          'Explore 2200-year-old rock-cut Karla & Bhaja Caves',
          'Authentic spicy Misal Pav & fresh Chikki tasting in old bazaar',
          'Sunset kayaking & lakeside bonfire at Pawna Lake camp',
        ],
      },
      {
        day: 2,
        title: 'Tiger Point, Secret Treks & Heritage Walk',
        activities: [
          'Early sunrise view at Duke’s Nose (Nagphani Cliff)',
          'Monsoon hike towards Kataldhar waterfall viewpoint',
          'Lunch at local Dhaba (hot Bhutta & Ginger Chai)',
          'Shopping for authentic walnut fudge & departure',
        ],
      },
    ],
    hiddenGems: [
      { name: 'Kataldhar Waterfalls Trek', desc: 'Hidden heart-shaped amphitheater waterfall reached via forested trails.' },
      { name: 'Pawna Secret Sunset Point', desc: 'Serene lakeside spot away from commercial camping crowds.' },
      { name: 'Bhaja Ancient Buddhist Chaitya', desc: 'Intricately carved rock-cut monastery with panoramic mountain views.' },
      { name: 'Duke’s Nose Cliff Edge', desc: 'Dramatic cliff looking down Khandala valley, ideal for rappelling.' },
    ],
    tips: [
      'Take local train or carpool on Mumbai-Pune Expressway to reduce transit cost by 45%.',
      'Rent a two-wheeler at Lonavala railway station for ₹450/day to navigate viewpoints easily.',
      'Buy original Cooper’s Fudge & Maganlal Chikki from authentic old town shops.',
      'Book lakeside stays near Tungarli or Pawna rather than crowded highway motels.',
    ],
  },
  goa: {
    name: 'Goa (North & South)',
    state: 'Goa',
    tagline: 'Sun-kissed Beaches, Portuguese Quarters & Seafood Shacks',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1200&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=600&auto=format&fit=crop',
    ],
    bestSeason: 'October to April (Vibrant nightlife & water sports)',
    weather: '24°C - 31°C, Tropical & Sunny',
    recommendedStays: [
      {
        name: 'W Goa Beachfront Resort',
        type: '5-Star Luxury Resort',
        pricePerNight: 16000,
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=400&auto=format&fit=crop',
        highlight: 'Vagator cliff views, Rock Pool sunset party',
      },
      {
        name: 'Assagao Heritage Portuguese Villa',
        type: 'Private Pool Heritage Villa',
        pricePerNight: 8500,
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=400&auto=format&fit=crop',
        highlight: '150-year-old restored estate, lush tropical garden',
      },
      {
        name: 'Palolem Beach Coconut Cabana',
        type: 'Beachside Boutique Hut',
        pricePerNight: 2800,
        rating: 4.6,
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=400&auto=format&fit=crop',
        highlight: 'Steps from turquoise waters, dolphin boat trips',
      },
      {
        name: 'The Hosteller Goa Vagator',
        type: 'Social Backpacker Hostel',
        pricePerNight: 750,
        rating: 4.5,
        image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=400&auto=format&fit=crop',
        highlight: 'Swimming pool, co-working space, pub crawls',
      },
    ],
    itinerary: [
      {
        day: 1,
        title: 'Heritage Alleys & Sunset Forts',
        activities: [
          'Arrival & rent self-drive scooters in Panjim',
          'Fontainhas Latin Quarter colorful street walk & Portuguese bakeries',
          'Seafood lunch: Authentic Goan fish thali at Anand Shack',
          'Sunset drinks overlooking Chapora or Aguada Fort',
        ],
      },
      {
        day: 2,
        title: 'Hidden Beaches & Island Cruise',
        activities: [
          'Morning ride to Butterfly Beach or Kakolem Cove',
          'Free ferry to peaceful Divar Island & mangrove bird sanctuary',
          'Live acoustic music & dinner at rustic Vagator beach cafe',
        ],
      },
    ],
    hiddenGems: [
      { name: 'Butterfly Beach Cove', desc: 'Semi-circular secluded bay reached via fisherman boat or short forest trek.' },
      { name: 'Divar Island & Chorao', desc: 'Old-world Portuguese village with zero commercial traffic, reachable by free ferry.' },
      { name: 'Cabo de Rama Cliff Fort', desc: 'Ancient southern fort with turquoise sea panoramas and untouched sands.' },
      { name: 'Fontainhas Latin Quarter', desc: 'Vibrant 18th-century yellow and blue Portuguese heritage alleys.' },
    ],
    tips: [
      'Rent a self-drive scooter (₹350-500/day) instead of hailing expensive local taxis.',
      'Dine at local Goan fish-thali shacks for gourmet seafood meals under ₹250.',
      'Stay in South Goa (Palolem/Benaulim) or Assagao for 35% cheaper luxury than crowded Baga.',
    ],
  },
  manali: {
    name: 'Manali & Solang Valley',
    state: 'Himachal Pradesh',
    tagline: 'Snow-capped Himalayas, Pine Forests & River Rafting',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1200&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop',
    ],
    bestSeason: 'March to June (Summer) & Dec to Feb (Snowfall)',
    weather: '5°C - 20°C, Alpine Mountain Climate',
    recommendedStays: [
      {
        name: 'The Himalayan Luxury Castle',
        type: 'Victorian Gothic Resort',
        pricePerNight: 14000,
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=400&auto=format&fit=crop',
        highlight: 'Surrounded by apple orchards, heated swimming pool',
      },
      {
        name: 'Old Manali Wooden Chalet',
        type: 'Cedar Wood Mountain Cottage',
        pricePerNight: 3500,
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=400&auto=format&fit=crop',
        highlight: 'Private balcony facing snow peaks, bonfire evening',
      },
      {
        name: 'Zostel Old Manali',
        type: 'Backpacker Mountain Hostel',
        pricePerNight: 800,
        rating: 4.6,
        image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=400&auto=format&fit=crop',
        highlight: 'Art cafe, guitar jam sessions, river sound',
      },
    ],
    itinerary: [
      {
        day: 1,
        title: 'Old Manali Cafes & Ancient Temples',
        activities: [
          'Morning visit to sacred wooden Hadimba Temple surrounded by Deodar trees',
          'Explore Old Manali bohemian cafe street with live acoustic music',
          'Short nature hike to Jogini Waterfalls with hot sulfur spring dip',
        ],
      },
      {
        day: 2,
        title: 'Atal Tunnel & Lahaul Valley Expedition',
        activities: [
          'Drive through world famous 9km Atal Tunnel to Sissu (Lahaul)',
          'Witness giant glacial waterfalls & Tibetan prayer flags',
          'River rafting in Beas River & traditional Siddu tasting',
        ],
      },
    ],
    hiddenGems: [
      { name: 'Sethan Buddhist Igloo Village', desc: 'High-altitude hamlet at 2700m away from tourist crowds.' },
      { name: 'Jogini Waterfall Pine Trail', desc: 'Scenic trek through pine apple orchards ending at sacred cascading pools.' },
      { name: 'Sissu Valley & Glacial Falls', desc: 'Surreal Lahaul landscape on the other side of Atal Tunnel.' },
    ],
    tips: [
      'Take overnight HRTC Volvo bus from Delhi/Chandigarh instead of expensive private taxis.',
      'Stay in Old Manali or Naggar village for authentic wooden chalets at half the Mall Road rates.',
    ],
  },
};

/**
 * Calculates estimated travel budget with breakdown, stays, and AI insights
 */
export const calculateEstimatedBudget = ({
  fromCity = 'Mumbai',
  toCity = 'Lonavala',
  days = 2,
  travelers = 2,
  travelMode = 'road',
  stayType = 'homestay',
  travelStyle = 'balanced',
}) => {
  const numDays = Math.max(1, parseInt(days) || 1);
  const numTravelers = Math.max(1, parseInt(travelers) || 1);
  const nights = Math.max(1, numDays - 1);
  const roomsNeeded = Math.ceil(numTravelers / 2);

  // 1. Accommodation Rates
  // 'nostay' = day trip / no overnight — zero accommodation cost
  const stayRates = {
    'nostay':  0,
    '5star':   12000,
    '4star':   6500,
    '3star':   3200,
    'homestay': 2200,
    'villa':   numTravelers > 4 ? 14000 / roomsNeeded : 8000,
    'airbnb':  3500,
    'hostel':  900,
  };

  const stayRatePerNight = stayRates[stayType] ?? 3000;
  const stayMultiplier = travelStyle === 'luxury' ? 1.3 : travelStyle === 'budget' ? 0.75 : 1.0;

  let totalStayCost = 0;
  if (stayType === 'nostay') {
    totalStayCost = 0; // day trip — no hotel cost at all
  } else if (stayType === 'hostel') {
    totalStayCost = numTravelers * stayRatePerNight * nights * stayMultiplier;
  } else {
    totalStayCost = roomsNeeded * stayRatePerNight * nights * stayMultiplier;
  }

  // 2. Transport Rates
  let totalTransportCost = 0;
  switch (travelMode) {
    case 'flight':
      totalTransportCost = numTravelers * 4500 + 1500;
      break;
    case 'train':
      totalTransportCost = numTravelers * (travelStyle === 'luxury' ? 1400 : travelStyle === 'budget' ? 350 : 750) + (numTravelers * 300);
      break;
    case 'road':
      totalTransportCost = Math.max(2000, 1800 + numDays * 1200 + (numTravelers > 4 ? 2000 : 0));
      break;
    case 'selfdrive':
      totalTransportCost = 2500 * numDays + 1500;
      break;
    default:
      totalTransportCost = numTravelers * 1000;
  }

  // 3. Food & Beverages
  const foodDailyRates = { budget: 600, balanced: 1200, luxury: 2800 };
  const foodRate = foodDailyRates[travelStyle] || 1200;
  const totalFoodCost = numTravelers * foodRate * numDays;

  // 4. Sightseeing & Activities
  const activityRates = { budget: 300, balanced: 700, luxury: 1800 };
  const totalActivityCost = numTravelers * (activityRates[travelStyle] || 700) * numDays;

  // 5. Emergency Buffer
  const subtotal = totalStayCost + totalTransportCost + totalFoodCost + totalActivityCost;
  const bufferFund = Math.round(subtotal * 0.1);
  const totalBudget = Math.round(subtotal + bufferFund);
  const perPersonCost = Math.round(totalBudget / numTravelers);

  // Match destination from DB or build dynamic fallback
  const normalizedDest = toCity.toLowerCase().replace(/[^a-z]/g, '');
  const matchedKey = Object.keys(DESTINATIONS_DB).find((key) => normalizedDest.includes(key));

  const destinationData = matchedKey ? DESTINATIONS_DB[matchedKey] : {
    name: toCity,
    state: 'Scenic Destination',
    tagline: `Explore scenic spots and local heritage in ${toCity}`,
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=600&auto=format&fit=crop',
    ],
    bestSeason: 'Year-round depending on local weather',
    weather: 'Pleasant & ideal for sightseeing',
    recommendedStays: [
      {
        name: `${toCity} Boutique Mountain Resort`,
        type: '4-Star Premium Hotel',
        pricePerNight: 5500,
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=400&auto=format&fit=crop',
        highlight: 'Scenic viewpoint, complimentary breakfast',
      },
      {
        name: `${toCity} Heritage Villa & Homestay`,
        type: 'Private Homestay',
        pricePerNight: 2800,
        rating: 4.6,
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=400&auto=format&fit=crop',
        highlight: 'Cozy rooms, authentic local home-cooked dining',
      },
      {
        name: `Backpacker Social Hostel ${toCity}`,
        type: 'Community Hostel',
        pricePerNight: 850,
        rating: 4.5,
        image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=400&auto=format&fit=crop',
        highlight: 'Rooftop lounge, community walking tours',
      },
    ],
    itinerary: [
      {
        day: 1,
        title: 'Arrival & Iconic Landmarks',
        activities: [
          `Arrive in ${toCity} and check into stay`,
          `Explore the main heritage center and local craft markets`,
          `Sample famous authentic regional cuisine at top-rated local dining hall`,
          'Sunset viewpoint photography and evening relaxation',
        ],
      },
      {
        day: 2,
        title: 'Nature Trails & Hidden Viewpoints',
        activities: [
          'Early morning scenic hike to the highest panoramic ridge',
          'Visit hidden local waterfalls and botanical sanctuaries',
          'Souvenir shopping and relaxed return journey',
        ],
      },
    ],
    hiddenGems: [
      { name: `Scenic Ridge & Old Town of ${toCity}`, desc: 'Explore historical alleys and local vantage points for panoramic sunrise photos.' },
      { name: `Local Heritage Trail & Artisanal Bazaar`, desc: 'Experience local culture and indigenous delicacies directly from master craftsmen.' },
      { name: `Nature Waterfall Trail near ${toCity}`, desc: 'Escape busy roads with a peaceful morning hike along hidden forested paths.' },
    ],
    tips: [
      'Book transport tickets at least 2 weeks in advance to unlock early-bird discounts and lowest fares.',
      'Split accommodation costs by renting a shared villa if traveling with 3+ friends.',
      'Eat at busy street markets and authentic local dining halls with high ratings instead of hotel dining rooms.',
      'Rent local two-wheelers for convenient inner-city sightseeing without cab surcharges.',
    ],
  };

  return {
    fromCity,
    toCity,
    days: numDays,
    travelers: numTravelers,
    travelMode,
    stayType,
    travelStyle,
    breakdown: {
      stay: Math.round(totalStayCost),
      transport: Math.round(totalTransportCost),
      food: Math.round(totalFoodCost),
      activities: Math.round(totalActivityCost),
      buffer: bufferFund,
    },
    totalBudget,
    perPersonCost,
    destinationData,
  };
};
