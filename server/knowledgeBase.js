/**
 * ============================================================================
 * TELCOCONNECT KNOWLEDGE BASE
 * ============================================================================
 *
 * This is the "operational facts" that get injected into the LLM system prompt.
 * In a production system, this would come from a database or CMS.
 * For this demo, we hardcode consistent data so Gemini always has accurate
 * pricing and feature details to work with.
 *
 * The knowledge base covers:
 *   - 3 Mobile Plans (Starter, Unlimited Plus, Unlimited Premium)
 *   - 3 Streaming Perks (StreamMax HD, MusicFlow Premium, GameZone Pro)
 *   - Feature comparison matrix
 *
 * WHY HARDCODED?
 * The A2UI protocol is about UI generation, not data retrieval. By giving the
 * LLM a fixed knowledge base, we ensure it focuses on composing the right UI
 * components rather than hallucinating plan details.
 * ============================================================================
 */

export const plans = [
  {
    id: "starter",
    name: "Starter",
    tagline: "The essentials, at a great price",
    price: "$35/mo",
    priceValue: 35,
    data: "5GB High-Speed Data",
    hotspot: "None",
    streaming: "SD (480p)",
    fiveG: "Standard 5G",
    international: "Pay-per-use texting",
    includedPerks: [],
    features: [
      "5GB high-speed data, then unlimited at 2G speeds",
      "Unlimited talk & text",
      "Standard 5G access",
      "SD streaming quality (480p)",
      "Scam call protection included"
    ]
  },
  {
    id: "unlimited-plus",
    name: "Unlimited Plus",
    tagline: "More data, more perks, more value",
    price: "$55/mo",
    priceValue: 55,
    data: "50GB Premium Data",
    hotspot: "15GB High-Speed",
    streaming: "HD (1080p)",
    fiveG: "5G Ultra Wideband",
    international: "Unlimited texting to 200+ countries",
    includedPerks: ["streammax"],
    badge: "Most Popular",
    features: [
      "50GB premium data, then unlimited at 3G speeds",
      "Unlimited talk & text",
      "5G Ultra Wideband access",
      "HD streaming quality (1080p)",
      "15GB mobile hotspot",
      "StreamMax HD included",
      "Unlimited international texting",
      "Scam call protection included"
    ]
  },
  {
    id: "unlimited-premium",
    name: "Unlimited Premium",
    tagline: "The ultimate wireless experience — no limits",
    price: "$75/mo",
    priceValue: 75,
    data: "Truly Unlimited Premium Data",
    hotspot: "50GB High-Speed",
    streaming: "Ultra HD (4K)",
    fiveG: "5G Ultra Wideband Priority",
    international: "International Day Pass eligible",
    includedPerks: ["streammax", "musicflow"],
    badge: "Best Experience",
    features: [
      "Truly unlimited premium data — no deprioritization",
      "Unlimited talk & text",
      "5G Ultra Wideband with network priority",
      "Ultra HD streaming quality (4K UHD)",
      "50GB mobile hotspot",
      "StreamMax HD included",
      "MusicFlow Premium included",
      "International Day Pass eligible ($10/day)",
      "In-flight Wi-Fi included",
      "Advanced scam & spam protection"
    ]
  }
];

export const perks = [
  {
    id: "streammax",
    name: "StreamMax HD",
    description: "Unlimited streaming in HD and 4K on 40+ supported apps including Netflix, Disney+, and HBO Max. Watch on up to 3 screens simultaneously.",
    price: "$10/mo",
    priceValue: 10,
    category: "streaming",
    icon: "tv",
    badge: "Popular"
  },
  {
    id: "musicflow",
    name: "MusicFlow Premium",
    description: "Ad-free music streaming with offline downloads. Includes Spotify Premium, Apple Music, or Tidal HiFi — your choice.",
    price: "$8/mo",
    priceValue: 8,
    category: "music",
    icon: "music",
    badge: "New"
  },
  {
    id: "gamezone",
    name: "GameZone Pro",
    description: "Cloud gaming on the go with Xbox Cloud Gaming and GeForce NOW. Prioritized 5G bandwidth for ultra-low latency gameplay.",
    price: "$12/mo",
    priceValue: 12,
    category: "gaming",
    icon: "gamepad"
  }
];

/**
 * Feature comparison matrix — used when the AI needs to build
 * a side-by-side plan comparison UI.
 */
export const comparisonFeatures = [
  { label: "Monthly Price",     key: "price" },
  { label: "High-Speed Data",   key: "data" },
  { label: "Mobile Hotspot",    key: "hotspot" },
  { label: "Streaming Quality", key: "streaming" },
  { label: "5G Access",         key: "fiveG" },
  { label: "International",     key: "international" }
];
