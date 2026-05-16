// ============================================
// LETTEROLOGY (NAME ANALYSIS) CALCULATOR LIBRARY
// ============================================
// Analysis systems based on letters in names

// ============================================
// 1. PYTHAGOREAN NUMEROLOGY (Most Common)
// ============================================

export class PythagoreanLetterology {
  static letterValues: Record<string, number> = {
    'A': 1, 'J': 1, 'S': 1,
    'B': 2, 'K': 2, 'T': 2,
    'C': 3, 'L': 3, 'U': 3,
    'D': 4, 'M': 4, 'V': 4,
    'E': 5, 'N': 5, 'W': 5,
    'F': 6, 'O': 6, 'X': 6,
    'G': 7, 'P': 7, 'Y': 7,
    'H': 8, 'Q': 8, 'Z': 8,
    'I': 9, 'R': 9
  };

  static vowels = ['A', 'E', 'I', 'O', 'U'];

  // Reduce to single digit (except 11, 22, 33)
  static reduce(num: number): number {
    while (num > 9 && num !== 11 && num !== 22 && num !== 33) {
      num = String(num).split('').reduce((sum, digit) => sum + parseInt(digit), 0);
    }
    return num;
  }

  // Expression/Destiny Number (full name)
  static calculateExpression(fullName: string): number {
    const sum = fullName.toUpperCase().split('').reduce((total, char) => {
      return total + (this.letterValues[char] || 0);
    }, 0);
    return this.reduce(sum);
  }

  // Soul Urge/Heart's Desire (vowels only)
  static calculateSoulUrge(fullName: string): number {
    const sum = fullName.toUpperCase().split('').reduce((total, char) => {
      if (this.vowels.includes(char)) {
        return total + (this.letterValues[char] || 0);
      }
      return total;
    }, 0);
    return this.reduce(sum);
  }

  // Personality Number (consonants only)
  static calculatePersonality(fullName: string): number {
    const sum = fullName.toUpperCase().split('').reduce((total, char) => {
      if (!this.vowels.includes(char) && this.letterValues[char]) {
        return total + this.letterValues[char];
      }
      return total;
    }, 0);
    return this.reduce(sum);
  }

  // Hidden Passion Number (most frequent letter)
  static calculateHiddenPassion(fullName: string) {
    const letterCounts: Record<string, number> = {};
    fullName.toUpperCase().split('').forEach(char => {
      if (this.letterValues[char]) {
        letterCounts[char] = (letterCounts[char] || 0) + 1;
      }
    });

    let maxCount = 0;
    let passionLetters: string[] = [];
    
    Object.entries(letterCounts).forEach(([letter, count]) => {
      if (count > maxCount) {
        maxCount = count;
        passionLetters = [letter];
      } else if (count === maxCount) {
        passionLetters.push(letter);
      }
    });

    return {
      letters: passionLetters,
      count: maxCount,
      numbers: passionLetters.map(l => this.letterValues[l])
    };
  }

  // Karmic Lessons (missing numbers)
  static calculateKarmicLessons(fullName: string) {
    const presentNumbers = new Set<number>();
    fullName.toUpperCase().split('').forEach(char => {
      if (this.letterValues[char]) {
        presentNumbers.add(this.letterValues[char]);
      }
    });

    const allNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const missing = allNumbers.filter(n => !presentNumbers.has(n));

    return {
      missingNumbers: missing,
      lessons: missing.map(n => this.interpretKarmicLesson(n))
    };
  }

  // Cornerstone (first letter of first name)
  static calculateCornerstone(firstName: string) {
    const firstLetter = firstName.toUpperCase()[0];
    return {
      letter: firstLetter,
      value: this.letterValues[firstLetter],
      meaning: "How you approach life and new situations"
    };
  }

  // Capstone (last letter of first name)
  static calculateCapstone(firstName: string) {
    const lastLetter = firstName.toUpperCase()[firstName.length - 1];
    return {
      letter: lastLetter,
      value: this.letterValues[lastLetter],
      meaning: "How you complete projects and handle endings"
    };
  }

  // First Vowel (subconscious motivation)
  static calculateFirstVowel(firstName: string) {
    const firstVowel = firstName.toUpperCase().split('').find(char => this.vowels.includes(char));
    return {
      letter: firstVowel,
      value: firstVowel ? this.letterValues[firstVowel] : 0,
      meaning: "Your subconscious motivation and inner reactions"
    };
  }

  // Interpret numbers
  static interpretNumber(number: number) {
    const interpretations: Record<number, { keyword: string; trait: string }> = {
      1: { keyword: "Leadership", trait: "Independent, pioneering, ambitious, confident" },
      2: { keyword: "Cooperation", trait: "Diplomatic, sensitive, peacemaker, intuitive" },
      3: { keyword: "Expression", trait: "Creative, social, optimistic, expressive" },
      4: { keyword: "Stability", trait: "Practical, organized, hardworking, loyal" },
      5: { keyword: "Freedom", trait: "Adventurous, dynamic, versatile, progressive" },
      6: { keyword: "Responsibility", trait: "Nurturing, caring, responsible, harmonious" },
      7: { keyword: "Analysis", trait: "Spiritual, analytical, introspective, wise" },
      8: { keyword: "Power", trait: "Ambitious, authoritative, material success, efficient" },
      9: { keyword: "Humanitarianism", trait: "Compassionate, idealistic, generous, artistic" },
      11: { keyword: "Inspiration", trait: "Intuitive, spiritual, visionary, idealistic (Master)" },
      22: { keyword: "Master Builder", trait: "Practical idealist, manifests dreams, powerful (Master)" },
      33: { keyword: "Master Teacher", trait: "Selfless service, spiritual teaching, healing (Master)" }
    };
    return interpretations[number] || { keyword: "Unknown", trait: "No interpretation" };
  }

  static interpretKarmicLesson(number: number) {
    const lessons: Record<number, string> = {
      1: "Learn independence and leadership",
      2: "Learn cooperation and diplomacy",
      3: "Learn self-expression and creativity",
      4: "Learn discipline and hard work",
      5: "Learn adaptability and freedom",
      6: "Learn responsibility and service",
      7: "Learn introspection and spirituality",
      8: "Learn material mastery and power",
      9: "Learn compassion and universal love"
    };
    return lessons[number] || "Unknown lesson";
  }
}

// ============================================
// 2. CHALDEAN NUMEROLOGY
// ============================================

export class ChaldeanLetterology {
  // Chaldean system (different values, no 9)
  static letterValues: Record<string, number> = {
    'A': 1, 'I': 1, 'J': 1, 'Q': 1, 'Y': 1,
    'B': 2, 'K': 2, 'R': 2,
    'C': 3, 'G': 3, 'L': 3, 'S': 3,
    'D': 4, 'M': 4, 'T': 4,
    'E': 5, 'H': 5, 'N': 5, 'X': 5,
    'U': 6, 'V': 6, 'W': 6,
    'O': 7, 'Z': 7,
    'F': 8, 'P': 8
  };

  static vowels = ['A', 'E', 'I', 'O', 'U'];

  static reduce(num: number): number {
    // Chaldean keeps 11 and 22 as master numbers
    while (num > 9 && num !== 11 && num !== 22) {
      num = String(num).split('').reduce((sum, digit) => sum + parseInt(digit), 0);
    }
    return num;
  }

  // Name Number (uses full birth name)
  static calculateNameNumber(fullName: string): number {
    const sum = fullName.toUpperCase().split('').reduce((total, char) => {
      return total + (this.letterValues[char] || 0);
    }, 0);
    return this.reduce(sum);
  }

  // Compound Name Number (before reduction)
  static calculateCompoundNumber(fullName: string) {
    const sum = fullName.toUpperCase().split('').reduce((total, char) => {
      return total + (this.letterValues[char] || 0);
    }, 0);
    return {
      compound: sum,
      reduced: this.reduce(sum),
      meaning: this.interpretCompoundNumber(sum)
    };
  }

  static interpretCompoundNumber(num: number) {
    const meanings: Record<number, string> = {
      10: "Wheel of Fortune - Success through ups and downs",
      11: "Lion Muzzled - Hidden strength, requires courage",
      12: "Sacrifice - Anxiety and struggle, victim mentality",
      13: "Regeneration - Death and rebirth, transformation",
      14: "Movement - Changeability, speculation, risk",
      15: "Magician - Spiritual insight, eloquence, charm",
      16: "Shattered Tower - Warnings, destruction, new beginnings",
      17: "Star of the Magi - Spiritual power, immortality",
      18: "Spiritual Insight - Conflict, materialism vs spirituality",
      19: "Prince of Heaven - Success, happiness, victory",
      20: "Awakening - Judgment, renewal, transformation",
      21: "Crown of the Magi - Ultimate success, advancement",
      22: "Fool - Caution needed, blind faith, materialism"
    };
    return meanings[num] || "Compound number interpretation varies";
  }
}

// ============================================
// 3. KABBALAH NUMEROLOGY
// ============================================

export class KabbalahLetterology {
  // Hebrew letter values (English approximation)
  static letterValues: Record<string, number> = {
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9,
    'J': 10, 'K': 20, 'L': 30, 'M': 40, 'N': 50, 'O': 60, 'P': 70, 'Q': 80,
    'R': 90, 'S': 100, 'T': 110, 'U': 120, 'V': 130, 'W': 140, 'X': 150,
    'Y': 160, 'Z': 170
  };

  // Gematria value (no reduction)
  static calculateGematria(name: string) {
    const sum = name.toUpperCase().split('').reduce((total, char) => {
      return total + (this.letterValues[char] || 0);
    }, 0);
    return {
      value: sum,
      meaning: "Mystical number revealing hidden connections"
    };
  }

  // Tree of Life path
  static calculateTreePath(name: string) {
    const gematria = this.calculateGematria(name).value;
    const sephirah = (gematria % 10) + 1; // 1-10 for 10 sephirot
    
    const sephirot = [
      { num: 1, name: "Kether", meaning: "Crown - Divine will, unity" },
      { num: 2, name: "Chokmah", meaning: "Wisdom - Pure creation" },
      { num: 3, name: "Binah", meaning: "Understanding - Form, structure" },
      { num: 4, name: "Chesed", meaning: "Mercy - Love, expansion" },
      { num: 5, name: "Geburah", meaning: "Severity - Strength, discipline" },
      { num: 6, name: "Tiphareth", meaning: "Beauty - Balance, harmony" },
      { num: 7, name: "Netzach", meaning: "Victory - Eternity, emotions" },
      { num: 8, name: "Hod", meaning: "Glory - Intellect, communication" },
      { num: 9, name: "Yesod", meaning: "Foundation - Connection, sexuality" },
      { num: 10, name: "Malkuth", meaning: "Kingdom - Physical world, manifestation" }
    ];
    
    return sephirot[sephirah - 1];
  }
}

// ============================================
// 4. LETTER FREQUENCY ANALYSIS
// ============================================

export class LetterFrequencyAnalysis {
  // Analyze letter patterns
  static analyzePattern(name: string) {
    const letters = name.toUpperCase().replace(/[^A-Z]/g, '').split('');
    const frequency: Record<string, number> = {};
    
    letters.forEach(letter => {
      frequency[letter] = (frequency[letter] || 0) + 1;
    });

    return {
      totalLetters: letters.length,
      uniqueLetters: Object.keys(frequency).length,
      frequency: frequency,
      repeatedLetters: Object.entries(frequency).filter(([_, count]) => count > 1)
    };
  }

  // Consonant vs Vowel ratio
  static analyzeVowelConsonantRatio(name: string) {
    const vowels = ['A', 'E', 'I', 'O', 'U'];
    const letters = name.toUpperCase().replace(/[^A-Z]/g, '').split('');
    
    const vowelCount = letters.filter(l => vowels.includes(l)).length;
    const consonantCount = letters.length - vowelCount;
    
    return {
      vowels: vowelCount,
      consonants: consonantCount,
      ratio: consonantCount > 0 ? (vowelCount / consonantCount).toFixed(2) : 'infinity',
      balance: this.interpretBalance(vowelCount, consonantCount)
    };
  }

  static interpretBalance(vowels: number, consonants: number) {
    if (consonants === 0) return "Pure Vowel - Purely intuitive and inner-focused";
    const ratio = vowels / consonants;
    if (ratio > 0.8 && ratio < 1.2) {
      return "Balanced - Harmonious expression of inner and outer self";
    } else if (ratio > 1.2) {
      return "Vowel-heavy - Emotional, intuitive, inner-focused";
    } else {
      return "Consonant-heavy - Practical, action-oriented, outer-focused";
    }
  }

  // Letter element analysis
  static analyzeElements(name: string) {
    const elements: Record<string, string[]> = {
      fire: ['A', 'J', 'S'],      // 1: Leadership, Vitality
      water: ['B', 'K', 'T'],     // 2: Emotion, Intuition
      air: ['C', 'L', 'U'],       // 3: Communication, Intellect
      earth: ['D', 'M', 'V'],     // 4: Practicality, Structure
      spirit: ['E', 'N', 'W'],    // 5: Freedom, Change
      love: ['F', 'O', 'X'],      // 6: Harmony, Responsibility
      wisdom: ['G', 'P', 'Y'],    // 7: Knowledge, Analysis
      power: ['H', 'Q', 'Z'],     // 8: Authority, Manifestation
      universal: ['I', 'R']       // 9: Compassion, Completion
    };

    const counts: Record<string, number> = {
      fire: 0, water: 0, air: 0, earth: 0, spirit: 0,
      love: 0, wisdom: 0, power: 0, universal: 0
    };

    const letters = name.toUpperCase().split('');
    letters.forEach(letter => {
      Object.entries(elements).forEach(([element, letters]) => {
        if (letters.includes(letter)) {
          counts[element]++;
        }
      });
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const percentages = Object.fromEntries(
      Object.entries(counts).map(([el, count]) => [el, total > 0 ? (count / total) * 100 : 0])
    );

    const dominant = Object.entries(counts).reduce((max, [element, count]) => {
      return count > max.count ? { element, count } : max;
    }, { element: '', count: 0 });

    return {
      counts: counts,
      percentages,
      dominant: dominant.element,
      interpretation: this.interpretElement(dominant.element),
      resonance: this.calculateResonance(name)
    };
  }

  static calculateResonance(name: string) {
    const gematria = KabbalahLetterology.calculateGematria(name).value;
    const solfeggio = [
      { freq: 174, name: "Foundation", meaning: "Security and safety" },
      { freq: 285, name: "Quantum", meaning: "Restoration and tissue repair" },
      { freq: 396, name: "Liberation", meaning: "Liberating guilt and fear" },
      { freq: 417, name: "Facilitation", meaning: "Undoing situations and facilitating change" },
      { freq: 528, name: "Transformation", meaning: "DNA repair, miracles, and transformation" },
      { freq: 639, name: "Connection", meaning: "Connecting and relationships" },
      { freq: 741, name: "Expression", meaning: "Solving problems and expressions" },
      { freq: 852, name: "Intuition", meaning: "Returning to spiritual order" },
      { freq: 963, name: "Transcendence", meaning: "Pure consciousness and light" }
    ];

    // Find closest resonance
    const resonances = solfeggio.map(s => ({
      ...s,
      match: 100 - Math.min(100, Math.abs((gematria % 1000) - s.freq) / 10)
    })).sort((a, b) => b.match - a.match);

    return resonances[0];
  }

  static interpretElement(element: string) {
    const interpretations: Record<string, string> = {
      fire: "High vitality, leadership potential, and a drive for pioneering new paths. Your signal is energetic and transformative.",
      water: "Deep emotional intelligence, intuitive receptivity, and a flowing, adaptable nature. Your signal resonates with the subconscious.",
      air: "Strong intellectual capacity, communicative clarity, and a versatile, social energy. Your signal is mental and expansive.",
      earth: "Grounded practicality, structural integrity, and a focus on material manifestation. Your signal is stable and reliable.",
      spirit: "A powerful drive for freedom, adventure, and spiritual evolution. Your signal is dynamic and seeks higher meaning.",
      love: "A focus on harmony, responsibility, and nurturing relationships. Your signal is compassionate and community-oriented.",
      wisdom: "Analytical depth, introspective wisdom, and a search for hidden truths. Your signal is philosophical and precise.",
      power: "Natural authority, material success, and efficient manifestation. Your signal is ambitious and commands respect.",
      universal: "Broad humanitarian vision, artistic sensitivity, and universal compassion. Your signal is idealistic and selfless."
    };
    return interpretations[element] || "A balanced distribution of elemental energies, suggesting a versatile and adaptable signal.";
  }

  static analyzePhoneticPatterns(name: string) {
    const letters = name.toUpperCase().replace(/[^A-Z]/g, '');
    const vowels = ['A', 'E', 'I', 'O', 'U'];
    
    let patterns = [];
    let currentType = vowels.includes(letters[0]) ? 'V' : 'C';
    let currentCount = 0;

    for (let char of letters) {
      const type = vowels.includes(char) ? 'V' : 'C';
      if (type === currentType) {
        currentCount++;
      } else {
        patterns.push({ type: currentType, count: currentCount });
        currentType = type;
        currentCount = 1;
      }
    }
    patterns.push({ type: currentType, count: currentCount });

    const flow = patterns.length > letters.length / 2 ? "High Complexity" : "Stable Rhythm";
    const complexity = (patterns.length / letters.length) * 100;

    return {
      patterns,
      flow,
      complexity: complexity.toFixed(1),
      description: complexity > 60 ? "Your name has a complex, multi-layered phonetic structure." : "Your name has a rhythmic, predictable phonetic flow."
    };
  }
}

// ============================================
// 5. NAME COMPATIBILITY
// ============================================

export class NameCompatibility {
  // Calculate name compatibility score
  static calculateCompatibility(name1: string, name2: string) {
    const expr1 = PythagoreanLetterology.calculateExpression(name1);
    const expr2 = PythagoreanLetterology.calculateExpression(name2);
    const soul1 = PythagoreanLetterology.calculateSoulUrge(name1);
    const soul2 = PythagoreanLetterology.calculateSoulUrge(name2);

    // Compatibility matrix
    const compatibility = this.getCompatibilityScore(expr1, expr2);
    const soulCompatibility = this.getCompatibilityScore(soul1, soul2);

    return {
      expressionCompatibility: {
        person1: expr1,
        person2: expr2,
        score: compatibility,
        meaning: "Surface compatibility - how you interact"
      },
      soulCompatibility: {
        person1: soul1,
        person2: soul2,
        score: soulCompatibility,
        meaning: "Deep compatibility - heart connection"
      },
      overall: Math.round((compatibility + soulCompatibility) / 2)
    };
  }

  static getCompatibilityScore(num1: number, num2: number) {
    // Simplified compatibility matrix
    const compatibilityMatrix: Record<string, number> = {
      '1-1': 70, '1-2': 60, '1-3': 85, '1-4': 50, '1-5': 90, '1-6': 65, '1-7': 55, '1-8': 75, '1-9': 70,
      '2-2': 80, '2-3': 75, '2-4': 85, '2-5': 45, '2-6': 95, '2-7': 70, '2-8': 60, '2-9': 80,
      '3-3': 90, '3-4': 55, '3-5': 95, '3-6': 80, '3-7': 65, '3-8': 70, '3-9': 85,
      '4-4': 75, '4-5': 40, '4-6': 90, '4-7': 80, '4-8': 85, '4-9': 60,
      '5-5': 85, '5-6': 50, '5-7': 75, '5-8': 70, '5-9': 80,
      '6-6': 95, '6-7': 65, '6-8': 75, '6-9': 90,
      '7-7': 85, '7-8': 60, '7-9': 75,
      '8-8': 80, '8-9': 70,
      '9-9': 90
    };

    const key = num1 <= num2 ? `${num1}-${num2}` : `${num2}-${num1}`;
    return compatibilityMatrix[key] || 50;
  }
}

// ============================================
// 6. COMPLETE NAME REPORT
// ============================================

export class CompleteNameReport {
  static generateFullReport(fullName: string, firstName: string) {
    const expression = PythagoreanLetterology.calculateExpression(fullName);
    const soulUrge = PythagoreanLetterology.calculateSoulUrge(fullName);
    const personality = PythagoreanLetterology.calculatePersonality(fullName);
    const hiddenPassion = PythagoreanLetterology.calculateHiddenPassion(fullName);
    const karmicLessons = PythagoreanLetterology.calculateKarmicLessons(fullName);
    const cornerstone = PythagoreanLetterology.calculateCornerstone(firstName);
    const capstone = PythagoreanLetterology.calculateCapstone(firstName);
    const firstVowel = PythagoreanLetterology.calculateFirstVowel(firstName);
    
    const chaldean = ChaldeanLetterology.calculateCompoundNumber(fullName);
    const kabbalah = KabbalahLetterology.calculateTreePath(fullName);
    
    const pattern = LetterFrequencyAnalysis.analyzePattern(fullName);
    const balance = LetterFrequencyAnalysis.analyzeVowelConsonantRatio(fullName);
    const elements = LetterFrequencyAnalysis.analyzeElements(fullName);
    const phonetics = LetterFrequencyAnalysis.analyzePhoneticPatterns(fullName);

    return {
      pythagorean: {
        expression: { number: expression, ...PythagoreanLetterology.interpretNumber(expression) },
        soulUrge: { number: soulUrge, ...PythagoreanLetterology.interpretNumber(soulUrge) },
        personality: { number: personality, ...PythagoreanLetterology.interpretNumber(personality) },
        hiddenPassion,
        karmicLessons,
        cornerstone,
        capstone,
        firstVowel
      },
      chaldean: chaldean,
      kabbalah: kabbalah,
      letterAnalysis: {
        pattern,
        balance,
        elements,
        phonetics
      }
    };
  }
}
