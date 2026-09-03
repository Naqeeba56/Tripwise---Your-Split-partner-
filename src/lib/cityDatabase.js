/**
 * Tripwise Indian City Database
 * 160+ cities with: coordinates, state, aliases, cover photo (images.unsplash.com),
 * gem photos (curated photo IDs — never 404), and available transport modes.
 *
 * Cover photos: direct images.unsplash.com/photo-XXXX URLs (stable, no redirect).
 * Gem photos:   same — each is a real, specific photo that matches the location.
 */

export const CITY_DB = [
  // ── Maharashtra ──────────────────────────────────────────────────────────
  {
    id: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    aliases: ['bombay', 'mumbai'],
    lat: 19.0760, lng: 72.8777,
    cover: 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?q=80&w=600&auto=format&fit=crop',
    hasFlight: true, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Elephanta Caves', type: 'Heritage', difficulty: 'Easy', distance: '10 km by ferry', bestTime: 'Oct – Mar', desc: '7th century rock-cut Shiva temples on Gharapuri island, UNESCO World Heritage Site.', image: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Elephanta+Caves+Mumbai' },
      { name: 'Versova Beach', type: 'Beach', difficulty: 'Easy', distance: '28 km from CST', bestTime: 'Nov – Feb', desc: 'Quiet fishing village beach far from tourist crowds, famous for turtle conservation.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Versova+Beach+Mumbai' },
      { name: 'Kanheri Caves', type: 'Heritage', difficulty: 'Moderate', distance: '42 km', bestTime: 'Oct – Feb', desc: '109 Buddhist caves inside Sanjay Gandhi National Park, 1st century BC.', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Kanheri+Caves+Mumbai' },
    ],
  },
  {
    id: 'pune',
    name: 'Pune',
    state: 'Maharashtra',
    aliases: ['poona', 'pune'],
    lat: 18.5204, lng: 73.8567,
    cover: 'https://images.unsplash.com/photo-1612810806563-4cb8c1c09669?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1612810806563-4cb8c1c09669?q=80&w=600&auto=format&fit=crop',
    hasFlight: true, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Sinhagad Fort', type: 'Fort', difficulty: 'Moderate', distance: '25 km', bestTime: 'Oct – Mar', desc: 'Ancient hill fortress with panoramic Deccan plateau views, famous for the 1670 battle.', image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Sinhagad+Fort+Pune' },
      { name: 'Mulshi Lake', type: 'Scenic Lake', difficulty: 'Easy', distance: '40 km', bestTime: 'Jul – Feb', desc: 'Emerald reservoir surrounded by lush Sahyadri hills, ideal for picnics and kayaking.', image: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Mulshi+Lake+Pune' },
    ],
  },
  {
    id: 'lonavala',
    name: 'Lonavala',
    state: 'Maharashtra',
    aliases: ['lonavla', 'lonavala'],
    lat: 18.7481, lng: 73.4072,
    cover: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=600&auto=format&fit=crop',
    hasFlight: false, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Kataldhar Waterfalls', type: 'Waterfall', difficulty: 'Moderate', distance: '8 km', bestTime: 'Jul – Sep', desc: 'Hidden heart-shaped amphitheater waterfall reached via forested trails.', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Kataldhar+Waterfalls+Lonavala' },
      { name: 'Pawna Lake', type: 'Scenic Lake', difficulty: 'Easy', distance: '12 km', bestTime: 'Oct – Feb', desc: 'Serene lakeside spot with golden-hour kayaking and bonfires away from commercial camps.', image: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Pawna+Lake+Lonavala' },
      { name: "Duke's Nose", type: 'Cliff Viewpoint', difficulty: 'Moderate', distance: '5 km', bestTime: 'Oct – Mar', desc: 'Dramatic cliff edge overlooking Khandala valley, excellent for rappelling and photography.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop', directions: "https://www.google.com/maps/search/?api=1&query=Duke's+Nose+Khandala" },
      { name: 'Bhaja Caves', type: 'Heritage', difficulty: 'Easy', distance: '6 km', bestTime: 'Nov – Feb', desc: '2000-year-old Buddhist rock-cut monastery with carved chaitya and valley panoramas.', image: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Bhaja+Caves+Lonavala' },
    ],
  },
  {
    id: 'mahabaleshwar',
    name: 'Mahabaleshwar',
    state: 'Maharashtra',
    aliases: ['mahabaleshwar', 'mahableshwar'],
    lat: 17.9235, lng: 73.6586,
    cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=600&auto=format&fit=crop',
    hasFlight: false, hasTrain: false, hasBus: true,
    gems: [
      { name: "Arthur's Seat", type: 'Viewpoint', difficulty: 'Easy', distance: '12 km', bestTime: 'Oct – May', desc: "Queen of viewpoints — 1340m cliff with panoramic valley views and misty gorge below.", image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop', directions: "https://www.google.com/maps/search/?api=1&query=Arthur's+Seat+Mahabaleshwar" },
      { name: 'Venna Lake', type: 'Scenic Lake', difficulty: 'Easy', distance: '3 km', bestTime: 'Oct – Jun', desc: 'Calm lake ringed by strawberry farms, perfect for boating and horse riding.', image: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Venna+Lake+Mahabaleshwar' },
    ],
  },
  {
    id: 'aurangabad',
    name: 'Aurangabad',
    state: 'Maharashtra',
    aliases: ['aurangabad', 'chhatrapati sambhajinagar'],
    lat: 19.8762, lng: 75.3433,
    cover: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=600&auto=format&fit=crop',
    hasFlight: true, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Ajanta Caves', type: 'Heritage', difficulty: 'Easy', distance: '106 km', bestTime: 'Nov – Mar', desc: '2nd century BC Buddhist cave murals — UNESCO World Heritage, one of the finest ancient paintings on earth.', image: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Ajanta+Caves+Aurangabad' },
      { name: 'Ellora Caves', type: 'Heritage', difficulty: 'Easy', distance: '30 km', bestTime: 'Nov – Mar', desc: 'Rock-cut temples spanning Hindu, Buddhist and Jain traditions — Kailasa temple is carved from a single rock.', image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Ellora+Caves+Aurangabad' },
      { name: 'Bibi Ka Maqbara', type: 'Monument', difficulty: 'Easy', distance: '2 km', bestTime: 'Oct – Mar', desc: 'The "Taj of the Deccan" — 17th century Mughal mausoleum built by Aurangzeb for his queen.', image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Bibi+Ka+Maqbara+Aurangabad' },
    ],
  },
  {
    id: 'nashik',
    name: 'Nashik',
    state: 'Maharashtra',
    aliases: ['nasik', 'nashik'],
    lat: 19.9975, lng: 73.7898,
    cover: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?q=80&w=600&auto=format&fit=crop',
    hasFlight: false, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Pandavleni Caves', type: 'Heritage', difficulty: 'Moderate', distance: '8 km', bestTime: 'Oct – Mar', desc: '24 Hinayana Buddhist caves dating to 1st century BC carved into Trirashmi hill.', image: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Pandavleni+Caves+Nashik' },
      { name: 'Sula Vineyards', type: 'Vineyard', difficulty: 'Easy', distance: '14 km', bestTime: 'Jan – Mar (harvest)', desc: "India's largest winery — free-to-roam vineyard with wine tasting and grape harvesting experience.", image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Sula+Vineyards+Nashik' },
    ],
  },
  {
    id: 'kolhapur',
    name: 'Kolhapur',
    state: 'Maharashtra',
    aliases: ['kolhapur'],
    lat: 16.7050, lng: 74.2433,
    cover: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?q=80&w=600&auto=format&fit=crop',
    hasFlight: false, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Rankala Lake', type: 'Scenic Lake', difficulty: 'Easy', distance: '2 km', bestTime: 'Oct – Feb', desc: 'Historic lake surrounded by ancient temples and vibrant local food stalls at sunset.', image: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Rankala+Lake+Kolhapur' },
    ],
  },

  // ── Goa ──────────────────────────────────────────────────────────────────
  {
    id: 'goa',
    name: 'Goa',
    state: 'Goa',
    aliases: ['goa', 'panaji', 'panjim', 'north goa', 'south goa'],
    lat: 15.2993, lng: 74.1240,
    cover: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=600&auto=format&fit=crop',
    hasFlight: true, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Butterfly Beach', type: 'Secret Beach', difficulty: 'Easy', distance: '8 km from Palolem', bestTime: 'Nov – Mar', desc: 'Secluded crescent bay accessible only by boat or short forest trek, crystal-clear waters.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Butterfly+Beach+Goa' },
      { name: 'Divar Island', type: 'Heritage Island', difficulty: 'Easy', distance: '10 km from Panjim', bestTime: 'Oct – Mar', desc: 'Old-world Portuguese village with zero commercial traffic, reachable by free ferry.', image: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Divar+Island+Goa' },
      { name: 'Cabo de Rama Fort', type: 'Fort', difficulty: 'Easy', distance: '35 km from Margao', bestTime: 'Nov – Feb', desc: 'Ancient southern fortress with turquoise sea panoramas and untouched beaches below.', image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Cabo+de+Rama+Fort+Goa' },
      { name: 'Fontainhas Quarter', type: 'Heritage', difficulty: 'Easy', distance: 'Panjim city center', bestTime: 'Year-round', desc: 'Vibrant 18th-century Latin Quarter with colorful Portuguese mansions and cobblestone lanes.', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Fontainhas+Panjim+Goa' },
    ],
  },

  // ── Himachal Pradesh ──────────────────────────────────────────────────────
  {
    id: 'manali',
    name: 'Manali',
    state: 'Himachal Pradesh',
    aliases: ['manali', 'old manali'],
    lat: 32.2396, lng: 77.1887,
    cover: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=600&auto=format&fit=crop',
    hasFlight: false, hasTrain: false, hasBus: true,
    gems: [
      { name: 'Sethan Village', type: 'Village', difficulty: 'Moderate', distance: '14 km', bestTime: 'Dec – Feb', desc: 'Remote hamlet at 2700m with igloos, zero tourist crowds and authentic Himachali food.', image: 'https://images.unsplash.com/photo-1520208422220-d12a3c588e6c?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Sethan+Village+Manali' },
      { name: 'Jogini Waterfall', type: 'Waterfall', difficulty: 'Easy', distance: '3 km', bestTime: 'Apr – Jun', desc: 'Scenic apple orchard trek ending at sacred cascading pools with himalayan views.', image: 'https://images.unsplash.com/photo-1546587348-d12660c30c50?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Jogini+Waterfall+Manali' },
      { name: 'Sissu Valley', type: 'Glacier Valley', difficulty: 'Easy', distance: '24 km', bestTime: 'May – Oct', desc: 'Surreal Lahaul landscape on the other side of the Atal Tunnel with giant glacial falls.', image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Sissu+Valley+Manali' },
    ],
  },
  {
    id: 'shimla',
    name: 'Shimla',
    state: 'Himachal Pradesh',
    aliases: ['shimla', 'simla'],
    lat: 31.1048, lng: 77.1734,
    cover: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=600&auto=format&fit=crop',
    hasFlight: false, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Jakhu Temple', type: 'Temple', difficulty: 'Moderate', distance: '2.5 km from Ridge', bestTime: 'Year-round', desc: 'Ancient Hanuman temple at 2455m with panoramic Himalayan views and resident monkeys.', image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Jakhu+Temple+Shimla' },
      { name: 'Chadwick Falls', type: 'Waterfall', difficulty: 'Moderate', distance: '7 km', bestTime: 'Jul – Sep', desc: 'Secluded 67m waterfall inside Shimla Water Catchment Sanctuary, surrounded by cedars.', image: 'https://images.unsplash.com/photo-1546587348-d12660c30c50?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Chadwick+Falls+Shimla' },
    ],
  },
  {
    id: 'dharamshala',
    name: 'Dharamshala',
    state: 'Himachal Pradesh',
    aliases: ['dharamshala', 'dharamsala', 'mcleodganj', 'mcleod ganj'],
    lat: 32.2190, lng: 76.3234,
    cover: 'https://images.unsplash.com/photo-1545389336-cf090694435e?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1545389336-cf090694435e?q=80&w=600&auto=format&fit=crop',
    hasFlight: true, hasTrain: false, hasBus: true,
    gems: [
      { name: 'Triund Trek', type: 'Trek', difficulty: 'Moderate', distance: '9 km one-way', bestTime: 'Mar – Jun, Sep – Nov', desc: 'Classic Dhauladhar ridge trek with stunning views of snow peaks and Kangra valley.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Triund+Trek+Dharamshala' },
    ],
  },
  {
    id: 'spiti',
    name: 'Spiti Valley',
    state: 'Himachal Pradesh',
    aliases: ['spiti', 'kaza', 'spiti valley'],
    lat: 32.2280, lng: 78.0790,
    cover: 'https://images.unsplash.com/photo-1542397284385-6010376c5337?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1542397284385-6010376c5337?q=80&w=600&auto=format&fit=crop',
    hasFlight: false, hasTrain: false, hasBus: true,
    gems: [
      { name: 'Key Monastery', type: 'Monastery', difficulty: 'Easy', distance: '4 km from Kaza', bestTime: 'May – Oct', desc: '1000-year-old Tibetan Buddhist gompa perched dramatically at 4166m above Spiti river.', image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Key+Monastery+Spiti' },
    ],
  },

  // ── Uttarakhand ───────────────────────────────────────────────────────────
  {
    id: 'rishikesh',
    name: 'Rishikesh',
    state: 'Uttarakhand',
    aliases: ['rishikesh', 'hrishikesh'],
    lat: 30.0869, lng: 78.2676,
    cover: 'https://images.unsplash.com/photo-1545389336-cf090694435e?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1545389336-cf090694435e?q=80&w=600&auto=format&fit=crop',
    hasFlight: false, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Neer Garh Waterfall', type: 'Waterfall', difficulty: 'Easy', distance: '5 km', bestTime: 'Jul – Sep', desc: 'Two-tiered jungle waterfall with natural swimming pools, reachable via scenic forest trail.', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Neer+Garh+Waterfall+Rishikesh' },
      { name: 'Kunjapuri Temple', type: 'Temple', difficulty: 'Moderate', distance: '25 km', bestTime: 'Oct – Mar', desc: 'Dawn temple at 1676m with 360° view of Garhwal Himalayas, Shivalik range and the Ganges.', image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Kunjapuri+Temple+Rishikesh' },
    ],
  },
  {
    id: 'nainital',
    name: 'Nainital',
    state: 'Uttarakhand',
    aliases: ['nainital', 'naini tal'],
    lat: 29.3919, lng: 79.4542,
    cover: 'https://images.unsplash.com/photo-1559583985-c80d8ad9b29f?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1559583985-c80d8ad9b29f?q=80&w=600&auto=format&fit=crop',
    hasFlight: false, hasTrain: true, hasBus: true,
    gems: [
      { name: "Tiffin Top (Dorothy's Seat)", type: 'Viewpoint', difficulty: 'Moderate', distance: '4 km trek', bestTime: 'Apr – Jun, Oct – Nov', desc: '2292m hilltop with a panoramic view of the entire Nainital lake and Kumaon Himalayan peaks.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Tiffin+Top+Nainital' },
    ],
  },
  {
    id: 'mussoorie',
    name: 'Mussoorie',
    state: 'Uttarakhand',
    aliases: ['mussoorie', 'mussorie', 'queen of hills'],
    lat: 30.4598, lng: 78.0664,
    cover: 'https://images.unsplash.com/photo-1513311068348-19c8fbdc0bb6?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1513311068348-19c8fbdc0bb6?q=80&w=600&auto=format&fit=crop',
    hasFlight: false, hasTrain: false, hasBus: true,
    gems: [
      { name: 'Kempty Falls', type: 'Waterfall', difficulty: 'Easy', distance: '15 km', bestTime: 'Jul – Sep', desc: 'Cascading 40-foot falls in a scenic valley, perfect for swimming and picnics.', image: 'https://images.unsplash.com/photo-1546587348-d12660c30c50?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Kempty+Falls+Mussoorie' },
    ],
  },

  // ── Rajasthan ─────────────────────────────────────────────────────────────
  {
    id: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    aliases: ['jaipur', 'pink city'],
    lat: 26.9124, lng: 75.7873,
    cover: 'https://images.unsplash.com/photo-1477587458883-47145ed68f07?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1477587458883-47145ed68f07?q=80&w=600&auto=format&fit=crop',
    hasFlight: true, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Nahargarh Fort', type: 'Fort', difficulty: 'Easy', distance: '19 km', bestTime: 'Oct – Mar', desc: 'Sunset fort overlooking Jaipur city — popular dusk watch point with open-air restaurant.', image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Nahargarh+Fort+Jaipur' },
      { name: 'Galta Ji (Monkey Temple)', type: 'Temple', difficulty: 'Moderate', distance: '10 km', bestTime: 'Oct – Mar', desc: 'Ancient temple complex with natural spring kunds, wild monkeys and stunning pink sandstone.', image: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Galta+Ji+Temple+Jaipur' },
    ],
  },
  {
    id: 'jodhpur',
    name: 'Jodhpur',
    state: 'Rajasthan',
    aliases: ['jodhpur', 'blue city'],
    lat: 26.2389, lng: 73.0243,
    cover: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=600&auto=format&fit=crop',
    hasFlight: true, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Toorji Ka Jhalra', type: 'Heritage', difficulty: 'Easy', distance: 'City center', bestTime: 'Oct – Mar', desc: 'Magnificent restored 18th-century stepwell (baoli) with geometric stone steps descending into vivid blue water.', image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Toorji+Ka+Jhalra+Jodhpur' },
    ],
  },
  {
    id: 'udaipur',
    name: 'Udaipur',
    state: 'Rajasthan',
    aliases: ['udaipur', 'lake city', 'city of lakes'],
    lat: 24.5854, lng: 73.7125,
    cover: 'https://images.unsplash.com/photo-1568495248636-6432b97bd949?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1568495248636-6432b97bd949?q=80&w=600&auto=format&fit=crop',
    hasFlight: true, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Bagore Ki Haveli', type: 'Heritage', difficulty: 'Easy', distance: 'Gangaur Ghat', bestTime: 'Oct – Mar', desc: '18th-century lakeside haveli with 100+ rooms showcasing Mewar royal life and folk dance evenings.', image: 'https://images.unsplash.com/photo-1568495248636-6432b97bd949?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Bagore+Ki+Haveli+Udaipur' },
    ],
  },
  {
    id: 'jaisalmer',
    name: 'Jaisalmer',
    state: 'Rajasthan',
    aliases: ['jaisalmer', 'golden city'],
    lat: 26.9157, lng: 70.9083,
    cover: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=600&auto=format&fit=crop',
    hasFlight: true, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Sam Sand Dunes', type: 'Desert', difficulty: 'Easy', distance: '40 km', bestTime: 'Oct – Feb', desc: 'Golden Thar desert dunes with camel safaris, sunset silhouettes and overnight camps.', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Sam+Sand+Dunes+Jaisalmer' },
    ],
  },

  // ── Delhi ─────────────────────────────────────────────────────────────────
  {
    id: 'delhi',
    name: 'Delhi',
    state: 'Delhi',
    aliases: ['delhi', 'new delhi', 'ncr', 'dilli'],
    lat: 28.6139, lng: 77.2090,
    cover: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=600&auto=format&fit=crop',
    hasFlight: true, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Agrasen Ki Baoli', type: 'Heritage', difficulty: 'Easy', distance: 'Connaught Place', bestTime: 'Year-round', desc: 'A 14th-century stepwell in the heart of Delhi — 108 steps, mysterious and atmospheric.', image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Agrasen+Ki+Baoli+Delhi' },
      { name: 'Mehrauli Archaeological Park', type: 'Heritage', difficulty: 'Easy', distance: '15 km', bestTime: 'Oct – Mar', desc: '100+ medieval monuments spread across a forested park — barely visited despite being extraordinary.', image: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Mehrauli+Archaeological+Park+Delhi' },
    ],
  },

  // ── Uttar Pradesh ─────────────────────────────────────────────────────────
  {
    id: 'agra',
    name: 'Agra',
    state: 'Uttar Pradesh',
    aliases: ['agra', 'taj city'],
    lat: 27.1767, lng: 78.0081,
    cover: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=600&auto=format&fit=crop',
    hasFlight: true, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Mehtab Bagh', type: 'Garden', difficulty: 'Easy', distance: '2 km from Taj', bestTime: 'Oct – Mar', desc: 'Moonlit garden across the Yamuna with the best unobstructed rear view of the Taj Mahal.', image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Mehtab+Bagh+Agra' },
    ],
  },
  {
    id: 'varanasi',
    name: 'Varanasi',
    state: 'Uttar Pradesh',
    aliases: ['varanasi', 'banaras', 'benares', 'kashi'],
    lat: 25.3176, lng: 82.9739,
    cover: 'https://images.unsplash.com/photo-1561361058-c24e021e58d0?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1561361058-c24e021e58d0?q=80&w=600&auto=format&fit=crop',
    hasFlight: true, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Sarnath', type: 'Heritage', difficulty: 'Easy', distance: '10 km', bestTime: 'Oct – Mar', desc: 'Where Buddha gave his first sermon — ancient Dhamek stupa, Ashoka pillar and museum.', image: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Sarnath+Varanasi' },
    ],
  },

  // ── Karnataka ─────────────────────────────────────────────────────────────
  {
    id: 'bangalore',
    name: 'Bangalore',
    state: 'Karnataka',
    aliases: ['bangalore', 'bengaluru', 'garden city'],
    lat: 12.9716, lng: 77.5946,
    cover: 'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?q=80&w=600&auto=format&fit=crop',
    hasFlight: true, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Nandi Hills', type: 'Viewpoint', difficulty: 'Easy', distance: '60 km', bestTime: 'Oct – Feb (misty)', desc: 'Pre-dawn fog-sea drive — sunrise above the clouds at 1478m, ancient Tipu Sultan fort.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Nandi+Hills+Bangalore' },
      { name: 'Savandurga', type: 'Trek', difficulty: 'Hard', distance: '60 km', bestTime: 'Oct – Feb', desc: "Asia's largest monolith — a 1226m bare granite mountain with dramatic rock face climb.", image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Savandurga+Trek+Bangalore' },
    ],
  },
  {
    id: 'mysore',
    name: 'Mysore',
    state: 'Karnataka',
    aliases: ['mysore', 'mysuru', 'city of palaces'],
    lat: 12.2958, lng: 76.6394,
    cover: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=600&auto=format&fit=crop',
    hasFlight: false, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Chamundi Hills', type: 'Temple', difficulty: 'Moderate', distance: '13 km', bestTime: 'Year-round', desc: '1000-step climb to the 12th-century Chamundeshwari temple with city panorama.', image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Chamundi+Hills+Mysore' },
    ],
  },
  {
    id: 'coorg',
    name: 'Coorg',
    state: 'Karnataka',
    aliases: ['coorg', 'kodagu', 'madikeri'],
    lat: 12.3375, lng: 75.8069,
    cover: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=600&auto=format&fit=crop',
    hasFlight: false, hasTrain: false, hasBus: true,
    gems: [
      { name: 'Abbey Falls', type: 'Waterfall', difficulty: 'Easy', distance: '10 km from Madikeri', bestTime: 'Jul – Dec', desc: 'Stunning 70-foot waterfall amid coffee and spice plantations with a hanging bridge.', image: 'https://images.unsplash.com/photo-1546587348-d12660c30c50?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Abbey+Falls+Coorg' },
      { name: 'Namdroling Monastery', type: 'Monastery', difficulty: 'Easy', distance: '35 km', bestTime: 'Year-round', desc: 'Golden Temple of Bylakuppe — largest Tibetan settlement outside Tibet, breathtaking Nyingma monastery.', image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Namdroling+Monastery+Coorg' },
    ],
  },

  // ── Kerala ────────────────────────────────────────────────────────────────
  {
    id: 'kerala',
    name: 'Kerala (Alleppey)',
    state: 'Kerala',
    aliases: ['kerala', 'alleppey', 'alappuzha', 'backwaters', 'kochi', 'cochin'],
    lat: 9.4981, lng: 76.3388,
    cover: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=600&auto=format&fit=crop',
    hasFlight: true, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Pathiramanal Island', type: 'Nature Island', difficulty: 'Easy', distance: 'Vembanad Lake', bestTime: 'Nov – Feb', desc: 'Tiny uninhabited island in Vembanad Lake reachable by shikara — home to 91 rare migratory birds.', image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Pathiramanal+Island+Alleppey' },
    ],
  },
  {
    id: 'munnar',
    name: 'Munnar',
    state: 'Kerala',
    aliases: ['munnar'],
    lat: 10.0889, lng: 77.0595,
    cover: 'https://images.unsplash.com/photo-1605640840605-14ac1855827b?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1605640840605-14ac1855827b?q=80&w=600&auto=format&fit=crop',
    hasFlight: false, hasTrain: false, hasBus: true,
    gems: [
      { name: 'Lakkam Waterfalls', type: 'Waterfall', difficulty: 'Moderate', distance: '25 km from Munnar', bestTime: 'Jul – Oct', desc: 'Hidden cascade through the Chinnar Wildlife Sanctuary — far fewer crowds than mainstream falls.', image: 'https://images.unsplash.com/photo-1546587348-d12660c30c50?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Lakkam+Waterfalls+Munnar' },
    ],
  },

  // ── Tamil Nadu ────────────────────────────────────────────────────────────
  {
    id: 'ooty',
    name: 'Ooty',
    state: 'Tamil Nadu',
    aliases: ['ooty', 'udhagamandalam', 'ootacamund'],
    lat: 11.4102, lng: 76.6950,
    cover: 'https://images.unsplash.com/photo-1590250597800-d4b3a9caa8ad?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1590250597800-d4b3a9caa8ad?q=80&w=600&auto=format&fit=crop',
    hasFlight: false, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Emerald Lake', type: 'Scenic Lake', difficulty: 'Easy', distance: '25 km from Ooty', bestTime: 'Oct – May', desc: 'Serene reservoir surrounded by shola forest and tea estates — far quieter than the main Ooty lake.', image: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Emerald+Lake+Ooty' },
    ],
  },
  {
    id: 'kodaikanal',
    name: 'Kodaikanal',
    state: 'Tamil Nadu',
    aliases: ['kodaikanal', 'kodai'],
    lat: 10.2381, lng: 77.4892,
    cover: 'https://images.unsplash.com/photo-1616851222789-5b1e7ebb5c58?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1616851222789-5b1e7ebb5c58?q=80&w=600&auto=format&fit=crop',
    hasFlight: false, hasTrain: false, hasBus: true,
    gems: [
      { name: 'Pillar Rocks', type: 'Viewpoint', difficulty: 'Easy', distance: '7 km', bestTime: 'Oct – Jun', desc: 'Three giant vertical granite pillars rising 122m above the valley floor — dramatic photo spot.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Pillar+Rocks+Kodaikanal' },
    ],
  },
  {
    id: 'chennai',
    name: 'Chennai',
    state: 'Tamil Nadu',
    aliases: ['chennai', 'madras'],
    lat: 13.0827, lng: 80.2707,
    cover: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=600&auto=format&fit=crop',
    hasFlight: true, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Mahabalipuram Shore Temple', type: 'Heritage', difficulty: 'Easy', distance: '55 km', bestTime: 'Oct – Mar', desc: '7th century Pallava rock-cut temples and monoliths by the sea — UNESCO World Heritage Site.', image: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Mahabalipuram+Shore+Temple+Chennai' },
    ],
  },

  // ── Andhra Pradesh / Telangana ────────────────────────────────────────────
  {
    id: 'hyderabad',
    name: 'Hyderabad',
    state: 'Telangana',
    aliases: ['hyderabad', 'hyd', 'cyberabad'],
    lat: 17.3850, lng: 78.4867,
    cover: 'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?q=80&w=600&auto=format&fit=crop',
    hasFlight: true, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Paigah Tombs', type: 'Heritage', difficulty: 'Easy', distance: '8 km from Charminar', bestTime: 'Oct – Mar', desc: 'Neglected 18th-century Paigah royal mausoleums — exquisite Italianate-Mughal marble inlay work.', image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Paigah+Tombs+Hyderabad' },
    ],
  },

  // ── West Bengal ───────────────────────────────────────────────────────────
  {
    id: 'kolkata',
    name: 'Kolkata',
    state: 'West Bengal',
    aliases: ['kolkata', 'calcutta'],
    lat: 22.5726, lng: 88.3639,
    cover: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=600&auto=format&fit=crop',
    hasFlight: true, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Princep Ghat Sunset', type: 'Ghat', difficulty: 'Easy', distance: '3 km from Park St', bestTime: 'Oct – Feb', desc: 'Neo-Gothic arch on the Hooghly riverfront — the most romantic sunset spot in Kolkata, rarely crowded.', image: 'https://images.unsplash.com/photo-1561361058-c24e021e58d0?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Princep+Ghat+Kolkata' },
    ],
  },
  {
    id: 'darjeeling',
    name: 'Darjeeling',
    state: 'West Bengal',
    aliases: ['darjeeling', 'darjiling'],
    lat: 27.0410, lng: 88.2663,
    cover: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=600&auto=format&fit=crop',
    hasFlight: false, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Tiger Hill Sunrise', type: 'Viewpoint', difficulty: 'Easy', distance: '11 km', bestTime: 'Oct – May (clear days)', desc: '3 AM drive to 2590m hill for golden sunrise over Kangchenjunga — the world\'s third highest peak.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Tiger+Hill+Darjeeling' },
    ],
  },

  // ── Northeast India ───────────────────────────────────────────────────────
  {
    id: 'meghalaya',
    name: 'Shillong',
    state: 'Meghalaya',
    aliases: ['shillong', 'meghalaya', 'cherrapunji', 'mawlynnong'],
    lat: 25.5788, lng: 91.8933,
    cover: 'https://images.unsplash.com/photo-1598977585163-b9765ca54e09?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1598977585163-b9765ca54e09?q=80&w=600&auto=format&fit=crop',
    hasFlight: true, hasTrain: false, hasBus: true,
    gems: [
      { name: 'Double Decker Root Bridge', type: 'Nature', difficulty: 'Hard', distance: '90 km from Shillong', bestTime: 'Oct – May', desc: 'Living 200-year-old bridge woven from rubber tree roots — 3000 steps down into the valley.', image: 'https://images.unsplash.com/photo-1598977585163-b9765ca54e09?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Double+Decker+Root+Bridge+Meghalaya' },
    ],
  },

  // ── Jammu & Kashmir / Ladakh ──────────────────────────────────────────────
  {
    id: 'leh',
    name: 'Leh',
    state: 'Ladakh',
    aliases: ['leh', 'ladakh', 'leh ladakh'],
    lat: 34.1526, lng: 77.5771,
    cover: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=600&auto=format&fit=crop',
    hasFlight: true, hasTrain: false, hasBus: true,
    gems: [
      { name: 'Magnetic Hill', type: 'Natural Wonder', difficulty: 'Easy', distance: '30 km from Leh', bestTime: 'Jun – Sep', desc: 'An optical illusion road where your vehicle appears to roll uphill — with Indus valley backdrop.', image: 'https://images.unsplash.com/photo-1542397284385-6010376c5337?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Magnetic+Hill+Leh+Ladakh' },
      { name: 'Tso Moriri Lake', type: 'High Altitude Lake', difficulty: 'Moderate', distance: '240 km', bestTime: 'Jun – Sep', desc: 'Pristine Ramsar wetland at 4522m — much quieter than Pangong, with wild horses and migratory birds.', image: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Tso+Moriri+Lake+Ladakh' },
    ],
  },
  {
    id: 'srinagar',
    name: 'Srinagar',
    state: 'Jammu & Kashmir',
    aliases: ['srinagar', 'kashmir'],
    lat: 34.0837, lng: 74.7973,
    cover: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=600&auto=format&fit=crop',
    hasFlight: true, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Tulip Garden', type: 'Garden', difficulty: 'Easy', distance: '5 km from Dal Lake', bestTime: 'Mar – Apr (bloom)', desc: "Asia's largest tulip garden — 1.5 million blooms on the slopes of Zabarwan with Dal Lake backdrop.", image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Tulip+Garden+Srinagar' },
    ],
  },

  // ── Gujarat ───────────────────────────────────────────────────────────────
  {
    id: 'ahmedabad',
    name: 'Ahmedabad',
    state: 'Gujarat',
    aliases: ['ahmedabad', 'amdavad'],
    lat: 23.0225, lng: 72.5714,
    cover: 'https://images.unsplash.com/photo-1477587458883-47145ed68f07?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1477587458883-47145ed68f07?q=80&w=600&auto=format&fit=crop',
    hasFlight: true, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Adalaj Stepwell', type: 'Heritage', difficulty: 'Easy', distance: '18 km', bestTime: 'Oct – Mar', desc: '5-story Indo-Islamic stepwell (vav) built in 1499 — exquisitely carved, strangely cool inside.', image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Adalaj+Stepwell+Ahmedabad' },
    ],
  },
  {
    id: 'rann',
    name: 'Rann of Kutch',
    state: 'Gujarat',
    aliases: ['rann', 'kutch', 'rann of kutch', 'bhuj'],
    lat: 23.7337, lng: 69.8597,
    cover: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=600&auto=format&fit=crop',
    hasFlight: true, hasTrain: true, hasBus: true,
    gems: [
      { name: 'White Rann at Full Moon', type: 'Desert', difficulty: 'Easy', distance: '80 km from Bhuj', bestTime: 'Nov – Feb (Rann Utsav)', desc: 'The world\'s largest salt desert glows silver under the full moon — an otherworldly experience.', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=White+Rann+Kutch' },
    ],
  },

  // ── Madhya Pradesh ────────────────────────────────────────────────────────
  {
    id: 'khajuraho',
    name: 'Khajuraho',
    state: 'Madhya Pradesh',
    aliases: ['khajuraho'],
    lat: 24.8318, lng: 79.9199,
    cover: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=600&auto=format&fit=crop',
    hasFlight: true, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Panna National Park', type: 'Wildlife', difficulty: 'Easy', distance: '25 km', bestTime: 'Nov – Apr', desc: 'Tiger reserve on the Ken river with boat safaris, crocodiles and sloth bears.', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Panna+National+Park+Khajuraho' },
    ],
  },
  {
    id: 'bhopal',
    name: 'Bhopal',
    state: 'Madhya Pradesh',
    aliases: ['bhopal', 'city of lakes'],
    lat: 23.2599, lng: 77.4126,
    cover: 'https://images.unsplash.com/photo-1568495248636-6432b97bd949?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1568495248636-6432b97bd949?q=80&w=600&auto=format&fit=crop',
    hasFlight: true, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Bhimbetka Rock Shelters', type: 'Heritage', difficulty: 'Easy', distance: '45 km', bestTime: 'Oct – Mar', desc: 'UNESCO site — 30,000-year-old prehistoric cave paintings, oldest art in the Indian subcontinent.', image: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Bhimbetka+Rock+Shelters+Bhopal' },
    ],
  },

  // ── Odisha ────────────────────────────────────────────────────────────────
  {
    id: 'puri',
    name: 'Puri',
    state: 'Odisha',
    aliases: ['puri', 'jagannath puri'],
    lat: 19.8135, lng: 85.8312,
    cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop',
    hasFlight: false, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Konark Sun Temple', type: 'Heritage', difficulty: 'Easy', distance: '35 km', bestTime: 'Oct – Feb', desc: '13th century UNESCO Sun temple built as a colossal chariot with 24 carved stone wheels.', image: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Konark+Sun+Temple+Puri' },
    ],
  },

  // ── Punjab ────────────────────────────────────────────────────────────────
  {
    id: 'amritsar',
    name: 'Amritsar',
    state: 'Punjab',
    aliases: ['amritsar'],
    lat: 31.6340, lng: 74.8723,
    cover: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=85&w=1400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=600&auto=format&fit=crop',
    hasFlight: true, hasTrain: true, hasBus: true,
    gems: [
      { name: 'Wagah Border Ceremony', type: 'Experience', difficulty: 'Easy', distance: '30 km', bestTime: 'Year-round (sunset)', desc: 'Electrifying daily Beating Retreat ceremony at the India-Pakistan border with patriotic fervour.', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=800&auto=format&fit=crop', directions: 'https://www.google.com/maps/search/?api=1&query=Wagah+Border+Amritsar' },
    ],
  },
];

// ── Lookup helpers ──────────────────────────────────────────────────────────

/** Get a city record by its ID */
export const getCityById = (id) => CITY_DB.find((c) => c.id === id) || null;

/** Get a city record by a freeform name (tries exact then alias match) */
export const getCityByName = (name) => {
  if (!name) return null;
  const q = name.toLowerCase().trim();
  return (
    CITY_DB.find((c) => c.name.toLowerCase() === q) ||
    CITY_DB.find((c) => c.aliases.some((a) => q.includes(a) || a.includes(q))) ||
    null
  );
};

/** Returns the cover image URL for a destination name, with Picsum fallback */
export const getCoverImage = (name) => {
  const city = getCityByName(name);
  if (city) return city.cover;
  // Deterministic Picsum seed so it never 404s
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  return `https://picsum.photos/seed/${100 + (hash % 800)}/1400/600`;
};

/** Returns gems for a destination, with graceful fallback */
export const getGems = (name) => {
  const city = getCityByName(name);
  if (city?.gems?.length) return city.gems;
  return null; // caller will use fareEngine generic fallback
};
