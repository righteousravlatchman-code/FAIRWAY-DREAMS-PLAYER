// ============================================
// MULTI-TRADITION ASTROLOGY CALCULATION LIBRARY
// ============================================
// Includes: Western, Vedic, Arabian, Druid, Mayan/Aztec systems

// ============================================
// 1. VEDIC (JYOTISH) ASTROLOGY
// ============================================

export class VedicAstrology {
  // Vedic uses sidereal zodiac (accounts for precession)
  // Ayanamsa = difference between tropical and sidereal zodiac
  static AYANAMSA_LAHIRI = 24.11; // Lahiri ayanamsa for 2024 (degrees)

  static nakshatras = [
    { name: "Ashwini", lord: "Ketu", range: [0, 13.33], deity: "Ashwini Kumaras" },
    { name: "Bharani", lord: "Venus", range: [13.33, 26.67], deity: "Yama" },
    { name: "Krittika", lord: "Sun", range: [26.67, 40], deity: "Agni" },
    { name: "Rohini", lord: "Moon", range: [40, 53.33], deity: "Brahma" },
    { name: "Mrigashira", lord: "Mars", range: [53.33, 66.67], deity: "Soma" },
    { name: "Ardra", lord: "Rahu", range: [66.67, 80], deity: "Rudra" },
    { name: "Punarvasu", lord: "Jupiter", range: [80, 93.33], deity: "Aditi" },
    { name: "Pushya", lord: "Saturn", range: [93.33, 106.67], deity: "Brihaspati" },
    { name: "Ashlesha", lord: "Mercury", range: [106.67, 120], deity: "Nagas" },
    { name: "Magha", lord: "Ketu", range: [120, 133.33], deity: "Pitris" },
    { name: "Purva Phalguni", lord: "Venus", range: [133.33, 146.67], deity: "Bhaga" },
    { name: "Uttara Phalguni", lord: "Sun", range: [146.67, 160], deity: "Aryaman" },
    { name: "Hasta", lord: "Moon", range: [160, 173.33], deity: "Savitar" },
    { name: "Chitra", lord: "Mars", range: [173.33, 186.67], deity: "Tvashtar" },
    { name: "Swati", lord: "Rahu", range: [186.67, 200], deity: "Vayu" },
    { name: "Vishakha", lord: "Jupiter", range: [200, 213.33], deity: "Indra-Agni" },
    { name: "Anuradha", lord: "Saturn", range: [213.33, 226.67], deity: "Mitra" },
    { name: "Jyeshtha", lord: "Mercury", range: [226.67, 240], deity: "Indra" },
    { name: "Mula", lord: "Ketu", range: [240, 253.33], deity: "Nirriti" },
    { name: "Purva Ashadha", lord: "Venus", range: [253.33, 266.67], deity: "Apas" },
    { name: "Uttara Ashadha", lord: "Sun", range: [266.67, 280], deity: "Vishvadevas" },
    { name: "Shravana", lord: "Moon", range: [280, 293.33], deity: "Vishnu" },
    { name: "Dhanishtha", lord: "Mars", range: [293.33, 306.67], deity: "Vasus" },
    { name: "Shatabhisha", lord: "Rahu", range: [306.67, 320], deity: "Varuna" },
    { name: "Purva Bhadrapada", lord: "Jupiter", range: [320, 333.33], deity: "Aja Ekapada" },
    { name: "Uttara Bhadrapada", lord: "Saturn", range: [333.33, 346.67], deity: "Ahir Budhnya" },
    { name: "Revati", lord: "Mercury", range: [346.67, 360], deity: "Pushan" }
  ];

  // Convert tropical (Western) degrees to sidereal (Vedic)
  static tropicalToSidereal(tropicalDegrees: number) {
    let sidereal = tropicalDegrees - this.AYANAMSA_LAHIRI;
    if (sidereal < 0) sidereal += 360;
    return sidereal % 360;
  }

  // Calculate Nakshatra (lunar mansion) from Moon position
  static calculateNakshatra(moonDegrees: number) {
    const siderealDegrees = this.tropicalToSidereal(moonDegrees);
    
    for (let nakshatra of this.nakshatras) {
      if (siderealDegrees >= nakshatra.range[0] && siderealDegrees < nakshatra.range[1]) {
        return {
          name: nakshatra.name,
          lord: nakshatra.lord,
          deity: nakshatra.deity,
          degrees: siderealDegrees,
          pada: Math.floor((siderealDegrees - nakshatra.range[0]) / 3.33) + 1
        };
      }
    }
    return {
      name: this.nakshatras[0].name,
      lord: this.nakshatras[0].lord,
      deity: this.nakshatras[0].deity,
      degrees: siderealDegrees,
      pada: 1
    };
  }

  // Calculate Rashi (Vedic zodiac sign)
  static calculateRashi(tropicalDegrees: number) {
    const rashis = [
      "Mesha (Aries)", "Vrishabha (Taurus)", "Mithuna (Gemini)",
      "Karka (Cancer)", "Simha (Leo)", "Kanya (Virgo)",
      "Tula (Libra)", "Vrishchika (Scorpio)", "Dhanu (Sagittarius)",
      "Makara (Capricorn)", "Kumbha (Aquarius)", "Meena (Pisces)"
    ];
    
    const sidereal = this.tropicalToSidereal(tropicalDegrees);
    const rashiIndex = Math.floor(sidereal / 30);
    const degreeInRashi = (sidereal % 30).toFixed(2);
    
    return {
      rashi: rashis[rashiIndex],
      degrees: degreeInRashi,
      siderealDegrees: sidereal.toFixed(2)
    };
  }

  // Calculate Dasha periods (Vimshottari Dasha system)
  static calculateDasha(nakshatraLord: string, birthDate: string) {
    const dashaLords = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
    const dashaYears = [7, 20, 6, 10, 7, 18, 16, 19, 17]; // Years for each dasha
    
    const startIndex = dashaLords.indexOf(nakshatraLord);
    const [year, month, day] = birthDate.split('-').map(Number);
    const birthDateObj = new Date(year, month - 1, day);
    
    const dashas = [];
    let currentDate = new Date(birthDateObj);
    
    for (let i = 0; i < dashaLords.length; i++) {
      const lordIndex = (startIndex + i) % dashaLords.length;
      const lord = dashaLords[lordIndex];
      const years = dashaYears[lordIndex];
      
      const endDate = new Date(currentDate);
      endDate.setFullYear(endDate.getFullYear() + years);
      
      dashas.push({
        lord: lord,
        startDate: currentDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        years: years
      });
      
      currentDate = new Date(endDate);
    }
    
    return dashas;
  }

  // Interpret Nakshatra
  static interpretNakshatra(nakshatraName: string) {
    const interpretations: Record<string, { quality: string; theme: string }> = {
      "Ashwini": { quality: "Swift, healing, pioneering", theme: "New beginnings, speed, vitality" },
      "Bharani": { quality: "Transformative, creative, intense", theme: "Birth, death, transformation" },
      "Krittika": { quality: "Sharp, purifying, determined", theme: "Cutting through, clarity, fame" },
      "Rohini": { quality: "Creative, beautiful, material", theme: "Growth, abundance, fertility" },
      "Mrigashira": { quality: "Curious, seeking, gentle", theme: "Search, exploration, sensitivity" },
      "Ardra": { quality: "Stormy, intellectual, intense", theme: "Destruction, renewal, clarity" },
      "Punarvasu": { quality: "Abundant, nurturing, returning", theme: "Renewal, safety, prosperity" },
      "Pushya": { quality: "Nourishing, spiritual, protective", theme: "Support, nourishment, wisdom" }
    };
    return interpretations[nakshatraName] || { quality: "Unknown", theme: "No interpretation" };
  }
}

// ============================================
// 2. ARABIAN/ISLAMIC ASTROLOGY
// ============================================

export class ArabianAstrology {
  // Arabian Parts (also called Arabic Lots)
  static calculateParts(sunDegrees: number, moonDegrees: number, ascendantDegrees: number) {
    // Part of Fortune = Ascendant + Moon - Sun (day birth)
    const partOfFortune = (ascendantDegrees + moonDegrees - sunDegrees + 360) % 360;
    
    // Part of Spirit = Ascendant + Sun - Moon (complementary to Fortune)
    const partOfSpirit = (ascendantDegrees + sunDegrees - moonDegrees + 360) % 360;
    
    return {
      partOfFortune: {
        degrees: partOfFortune.toFixed(2),
        sign: this.degreesToSign(partOfFortune),
        meaning: "Material success, body, health, prosperity"
      },
      partOfSpirit: {
        degrees: partOfSpirit.toFixed(2),
        sign: this.degreesToSign(partOfSpirit),
        meaning: "Spiritual success, soul, higher purpose"
      }
    };
  }

  // Arabian Lunar Mansions (Manzils)
  static lunarMansions = [
    { name: "Al-Sharatain", range: [0, 12.86], meaning: "The Two Signs" },
    { name: "Al-Butain", range: [12.86, 25.71], meaning: "The Belly" },
    { name: "Al-Thurayya", range: [25.71, 38.57], meaning: "The Pleiades" },
    { name: "Al-Dabaran", range: [38.57, 51.43], meaning: "The Follower" },
    { name: "Al-Haq'ah", range: [51.43, 64.29], meaning: "The White Spot" },
    { name: "Al-Han'ah", range: [64.29, 77.14], meaning: "The Brand" },
    { name: "Al-Dhira", range: [77.14, 90], meaning: "The Arm" },
    { name: "Al-Nathrah", range: [90, 102.86], meaning: "The Gap" },
    { name: "Al-Tarf", range: [102.86, 115.71], meaning: "The Glance" },
    { name: "Al-Jabhah", range: [115.71, 128.57], meaning: "The Forehead" },
    { name: "Al-Zubrah", range: [128.57, 141.43], meaning: "The Mane" },
    { name: "Al-Sarfah", range: [141.43, 154.29], meaning: "The Change" },
    { name: "Al-Awwa", range: [154.29, 167.14], meaning: "The Barker" },
    { name: "Al-Simak", range: [167.14, 180], meaning: "The Unarmed" },
    { name: "Al-Ghafr", range: [180, 192.86], meaning: "The Covering" },
    { name: "Al-Zubana", range: [192.86, 205.71], meaning: "The Claws" },
    { name: "Al-Iklil", range: [205.71, 218.57], meaning: "The Crown" },
    { name: "Al-Qalb", range: [218.57, 231.43], meaning: "The Heart" },
    { name: "Al-Shaulah", range: [231.43, 244.29], meaning: "The Sting" },
    { name: "Al-Na'am", range: [244.29, 257.14], meaning: "The Ostriches" },
    { name: "Al-Baldah", range: [257.14, 270], meaning: "The City" },
    { name: "Sa'd al-Dhabih", range: [270, 282.86], meaning: "Luck of the Slaughterer" },
    { name: "Sa'd Bula", range: [282.86, 295.71], meaning: "Luck of the Swallower" },
    { name: "Sa'd al-Su'ud", range: [295.71, 308.57], meaning: "Luck of Lucks" },
    { name: "Sa'd al-Akhbiyah", range: [308.57, 321.43], meaning: "Luck of Hidden Things" },
    { name: "Al-Fargh al-Mukdim", range: [321.43, 334.29], meaning: "The First Spout" },
    { name: "Al-Fargh al-Thani", range: [334.29, 347.14], meaning: "The Second Spout" },
    { name: "Batn al-Hut", range: [347.14, 360], meaning: "Belly of the Fish" }
  ];

  static calculateLunarMansion(moonDegrees: number) {
    for (let mansion of this.lunarMansions) {
      if (moonDegrees >= mansion.range[0] && moonDegrees < mansion.range[1]) {
        return {
          name: mansion.name,
          meaning: mansion.meaning,
          degrees: moonDegrees.toFixed(2),
          use: "Used for elections (choosing auspicious times)"
        };
      }
    }
    return {
      name: this.lunarMansions[0].name,
      meaning: this.lunarMansions[0].meaning,
      degrees: moonDegrees.toFixed(2),
      use: "Used for elections (choosing auspicious times)"
    };
  }

  static degreesToSign(degrees: number) {
    const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
                   "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
    const signIndex = Math.floor(degrees / 30);
    const degInSign = (degrees % 30).toFixed(2);
    return `${signs[signIndex]} ${degInSign}°`;
  }

  // Calculate planetary hours (Arabian timing system)
  static calculatePlanetaryHours(sunrise: number, sunset: number, currentTime: number) {
    const planets = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"];
    
    // Calculate day and night lengths
    const dayLength = (sunset - sunrise) / (1000 * 60 * 60);
    const nightLength = 24 - dayLength;
    
    // Each hour is 1/12 of day or night
    const dayHourLength = dayLength / 12;
    
    // Determine which hour we're in
    const hoursSinceSunrise = (currentTime - sunrise) / (1000 * 60 * 60);
    const hourNumber = Math.floor(hoursSinceSunrise / dayHourLength);
    
    // Sunday starts with Sun, Monday with Moon, etc.
    const dayOfWeek = new Date(currentTime).getDay(); // 0 = Sunday
    const startPlanet = planets[(dayOfWeek) % 7];
    const currentPlanetIndex = (planets.indexOf(startPlanet) + hourNumber) % 7;
    
    return {
      planet: planets[currentPlanetIndex],
      hourNumber: hourNumber + 1,
      hourLength: dayHourLength.toFixed(2) + " hours",
      meaning: `${planets[currentPlanetIndex]} hour - good for ${planets[currentPlanetIndex]} activities`
    };
  }
}

// ============================================
// 3. DRUID/CELTIC TREE ASTROLOGY
// ============================================

export class DruidAstrology {
  static treeCalendar = [
    { tree: "Birch", symbol: "Beth", range: [[12, 24], [1, 20]], traits: "New beginnings, cleansing, pioneer spirit" },
    { tree: "Rowan", symbol: "Luis", range: [[1, 21], [2, 17]], traits: "Protection, vision, spiritual insight" },
    { tree: "Ash", symbol: "Nion", range: [[2, 18], [3, 17]], traits: "Connection, perspective, strength" },
    { tree: "Alder", symbol: "Fearn", range: [[3, 18], [4, 14]], traits: "Courage, passion, confidence" },
    { tree: "Willow", symbol: "Saille", range: [[4, 15], [5, 12]], traits: "Intuition, emotion, cycles" },
    { tree: "Hawthorn", symbol: "Uath", range: [[5, 13], [6, 9]], traits: "Fertility, sacred union, protection" },
    { tree: "Oak", symbol: "Duir", range: [[6, 10], [7, 7]], traits: "Strength, endurance, wisdom" },
    { tree: "Holly", symbol: "Tinne", range: [[7, 8], [8, 4]], traits: "Balance, warrior spirit, protection" },
    { tree: "Hazel", symbol: "Coll", range: [[8, 5], [9, 1]], traits: "Wisdom, creativity, inspiration" },
    { tree: "Vine", symbol: "Muin", range: [[9, 2], [9, 29]], traits: "Transformation, celebration, depth" },
    { tree: "Ivy", symbol: "Gort", range: [[9, 30], [10, 27]], traits: "Resilience, determination, growth" },
    { tree: "Reed", symbol: "Ngetal", range: [[10, 28], [11, 24]], traits: "Truth, clarity, directness" },
    { tree: "Elder", symbol: "Ruis", range: [[11, 25], [12, 23]], traits: "Endings, regeneration, transformation" }
  ];

  // Calculate tree sign from birth date
  static getTreeSign(birthDate: string) {
    const [year, month, day] = birthDate.split('-').map(Number);
    
    for (let tree of this.treeCalendar) {
      const [[startMonth, startDay], [endMonth, endDay]] = tree.range;
      
      // Handle same month range
      if (startMonth === endMonth) {
        if (month === startMonth && day >= startDay && day <= endDay) {
          return tree;
        }
      } else {
        // Handle cross-month range
        if ((month === startMonth && day >= startDay) || 
            (month === endMonth && day <= endDay)) {
          return tree;
        }
      }
    }
    
    return this.treeCalendar[0]; // Default to Birch
  }

  // Sacred animals associated with each tree
  static getTotemAnimal(treeName: string) {
    const totems: Record<string, { animal: string; meaning: string }> = {
      "Birch": { animal: "White Stag", meaning: "Purity, new paths, spiritual quest" },
      "Rowan": { animal: "Dragon", meaning: "Power, vision, guardian" },
      "Ash": { animal: "Serpent", meaning: "Transformation, healing, wisdom" },
      "Alder": { animal: "Raven", meaning: "Prophecy, magic, messenger" },
      "Willow": { animal: "Hare", meaning: "Intuition, rebirth, moon connection" },
      "Hawthorn": { animal: "Bee", meaning: "Community, sweetness, industry" },
      "Oak": { animal: "White Horse", meaning: "Sovereignty, freedom, power" },
      "Holly": { animal: "Unicorn", meaning: "Purity, protection, magic" },
      "Hazel": { animal: "Salmon", meaning: "Wisdom, knowledge, inspiration" },
      "Vine": { animal: "Swan", meaning: "Grace, transformation, prophecy" },
      "Ivy": { animal: "Boar", meaning: "Courage, ferocity, warrior" },
      "Reed": { animal: "Owl", meaning: "Wisdom, secrets, night vision" },
      "Elder": { animal: "Raven", meaning: "Mystery, endings, magic" }
    };
    return totems[treeName] || { animal: "Unknown", meaning: "No interpretation" };
  }

  // Ogham divination interpretation
  static interpretOgham(treeName: string) {
    const ogham: Record<string, { divination: string }> = {
      "Birch": { divination: "Beginnings, purification, a fresh start is coming" },
      "Rowan": { divination: "Protection needed, trust your vision, spiritual guidance" },
      "Ash": { divination: "Bridge between worlds, connection, perspective shift" },
      "Alder": { divination: "Face fears with courage, passion project, take action" },
      "Willow": { divination: "Listen to intuition, emotional healing, go with flow" },
      "Hawthorn": { divination: "Sacred time, protection, cleansing needed" },
      "Oak": { divination: "Strength during challenge, endurance, victory ahead" },
      "Holly": { divination: "Balance needed, protection, warrior path" },
      "Hazel": { divination: "Wisdom incoming, creative inspiration, learn" },
      "Vine": { divination: "Transformation time, celebration, deep work" },
      "Ivy": { divination: "Persistence pays off, resilience, spiral growth" },
      "Reed": { divination: "Truth revealed, clarity coming, direct action" },
      "Elder": { divination: "Endings lead to beginnings, regeneration, release" }
    };
    return ogham[treeName] || { divination: "Unknown" };
  }

  // Calculate lunar phase influence (Celtic tradition emphasized moon)
  static calculateMoonPhase(birthDate: string) {
    const [year, month, day] = birthDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Simplified moon phase calculation
    const knownNewMoon = new Date(2000, 0, 6); // Jan 6, 2000 was new moon
    const daysSinceKnown = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
    const lunarMonth = 29.53; // days in lunar cycle
    const phase = (daysSinceKnown % lunarMonth) / lunarMonth;
    
    const phases = [
      { name: "New Moon", range: [0, 0.125], meaning: "New beginnings, intention setting" },
      { name: "Waxing Crescent", range: [0.125, 0.25], meaning: "Growth, building momentum" },
      { name: "First Quarter", range: [0.25, 0.375], meaning: "Action, decision time" },
      { name: "Waxing Gibbous", range: [0.375, 0.5], meaning: "Refinement, preparation" },
      { name: "Full Moon", range: [0.5, 0.625], meaning: "Culmination, illumination" },
      { name: "Waning Gibbous", range: [0.625, 0.75], meaning: "Gratitude, sharing wisdom" },
      { name: "Last Quarter", range: [0.75, 0.875], meaning: "Release, forgiveness" },
      { name: "Waning Crescent", range: [0.875, 1], meaning: "Rest, reflection, surrender" }
    ];
    
    for (let phaseData of phases) {
      if (phase >= phaseData.range[0] && phase < phaseData.range[1]) {
        return phaseData;
      }
    }
    
    return phases[0];
  }
}

// ============================================
// 4. MAYAN/AZTEC ASTROLOGY
// ============================================

export class MayanAstrology {
  // Mayan Tzolkin calendar (260-day sacred calendar)
  static dayNames = [
    { name: "Imix", symbol: "Crocodile/Dragon", number: 1, meaning: "Primordial, nurturing, mother energy" },
    { name: "Ik", symbol: "Wind", number: 2, meaning: "Spirit, breath, communication" },
    { name: "Akbal", symbol: "Night", number: 3, meaning: "Mystery, intuition, dreams" },
    { name: "Kan", symbol: "Seed/Lizard", number: 4, meaning: "Potential, fertility, growth" },
    { name: "Chicchan", symbol: "Serpent", number: 5, meaning: "Life force, kundalini, power" },
    { name: "Cimi", symbol: "Death", number: 6, meaning: "Transformation, release, endings" },
    { name: "Manik", symbol: "Deer/Hand", number: 7, meaning: "Healing, knowledge, gateway" },
    { name: "Lamat", symbol: "Star/Rabbit", number: 8, meaning: "Harmony, beauty, fertility" },
    { name: "Muluc", symbol: "Water/Moon", number: 9, meaning: "Purification, emotion, flow" },
    { name: "Oc", symbol: "Dog", number: 10, meaning: "Loyalty, heart, guidance" },
    { name: "Chuen", symbol: "Monkey", number: 11, meaning: "Play, artistry, magic" },
    { name: "Eb", symbol: "Road", number: 12, meaning: "Journey, destiny, path" },
    { name: "Ben", symbol: "Reed", number: 13, meaning: "Authority, pillar, support" },
    { name: "Ix", symbol: "Jaguar", number: 14, meaning: "Magic, night, feminine power" },
    { name: "Men", symbol: "Eagle", number: 15, meaning: "Vision, mind, higher perspective" },
    { name: "Cib", symbol: "Vulture", number: 16, meaning: "Wisdom, contemplation, ancient" },
    { name: "Caban", symbol: "Earth", number: 17, meaning: "Grounding, movement, synchronicity" },
    { name: "Etznab", symbol: "Flint/Mirror", number: 18, meaning: "Truth, reflection, clarity" },
    { name: "Cauac", symbol: "Storm", number: 19, meaning: "Transformation, catalyst, renewal" },
    { name: "Ahau", symbol: "Sun/Lord", number: 20, meaning: "Mastery, enlightenment, completion" }
  ];

  static tones = [
    { number: 1, name: "Unity", meaning: "Purpose, initiation, intention" },
    { number: 2, name: "Polarity", meaning: "Challenge, duality, balance" },
    { number: 3, name: "Rhythm", meaning: "Movement, flow, activation" },
    { number: 4, name: "Measure", meaning: "Definition, form, structure" },
    { number: 5, name: "Radiance", meaning: "Center, empowerment, core" },
    { number: 6, name: "Organic", meaning: "Balance, equality, flow" },
    { number: 7, name: "Resonant", meaning: "Attunement, channel, mystical" },
    { number: 8, name: "Galactic", meaning: "Integrity, harmony, model" },
    { number: 9, name: "Solar", meaning: "Intention, pulse, realization" },
    { number: 10, name: "Planetary", meaning: "Manifestation, production, perfection" },
    { number: 11, name: "Spectral", meaning: "Release, dissolution, liberation" },
    { number: 12, name: "Crystal", meaning: "Cooperation, dedication, universal" },
    { number: 13, name: "Cosmic", meaning: "Presence, transcendence, magic" }
  ];

  // Calculate Tzolkin day sign from birth date
  static calculateTzolkin(birthDate: string) {
    const [year, month, day] = birthDate.split('-').map(Number);
    
    // Reference: Gregorian correlation constant (584283)
    // This is the "GMT correlation" commonly used
    const gregorianToMayan = 584283;
    const julianDay = this.dateToJulianDay(year, month, day);
    const mayanDay = Math.floor(julianDay - gregorianToMayan);
    
    // Tzolkin is 260 days (20 day signs × 13 tones)
    const tzolkinPosition = mayanDay % 260;
    const daySignIndex = (tzolkinPosition + 19) % 20; // Offset for correlation
    const toneIndex = (tzolkinPosition + 3) % 13; // Offset for correlation
    
    return {
      daySign: this.dayNames[daySignIndex],
      tone: this.tones[toneIndex],
      kin: tzolkinPosition + 1, // Kin number (1-260)
      fullName: `${this.tones[toneIndex].number} ${this.dayNames[daySignIndex].name}`
    };
  }

  // Helper: Convert date to Julian Day
  static dateToJulianDay(year: number, month: number, day: number) {
    if (month <= 2) {
      year -= 1;
      month += 12;
    }
    const a = Math.floor(year / 100);
    const b = 2 - a + Math.floor(a / 4);
    return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;
  }

  // Calculate Mayan Long Count (actual calendar date)
  static calculateLongCount(birthDate: string) {
    const [year, month, day] = birthDate.split('-').map(Number);
    const julianDay = this.dateToJulianDay(year, month, day);
    const mayanDay = Math.floor(julianDay - 584283); // GMT correlation
    
    // Long Count units
    const baktun = Math.floor(mayanDay / 144000);
    const remainder1 = mayanDay % 144000;
    const katun = Math.floor(remainder1 / 7200);
    const remainder2 = remainder1 % 7200;
    const tun = Math.floor(remainder2 / 360);
    const remainder3 = remainder2 % 360;
    const uinal = Math.floor(remainder3 / 20);
    const kin = remainder3 % 20;

    return `${baktun}.${katun}.${tun}.${uinal}.${kin}`;
  }
}
