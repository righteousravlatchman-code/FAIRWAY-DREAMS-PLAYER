import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink, BookOpen, Info, HelpCircle, ChevronRight } from 'lucide-react';

interface GuideItem {
  type: string;
  tells: string;
  toolUrl: string;
  howTo: string;
}

const guideData: GuideItem[] = [
  {
    type: 'Pythagorean / Western Numerology',
    tells: 'Gives a set of life‑path & “core” numbers that are interpreted as personality forces, challenges, and potential future milestones.',
    toolUrl: 'https://people.howstuffworks.com/name-numerology.htm',
    howTo: 'Type your full birth name, pick “Name” (not “Sole”) and click “Generate”.'
  },
  {
    type: 'Chaldean Numerology',
    tells: 'Uses a different letter‑to‑number chart that places more emphasis on “vibrational” values. Numbers are reduced to a single digit or left as a master number.',
    toolUrl: 'https://namenumbercalculator.com/chaldean-numerology-calculator/',
    howTo: 'Enter the same full name; the page shows the Chaldean chart and prints the Destiny, Soul‑Urge, and Personality numbers.'
  },
  {
    type: 'Gematria (Hebrew/Greek/English)',
    tells: 'Assigns a numeric value to every letter and lets you compare a phrase or name to Biblical or other reference texts – often used for finding hidden connections.',
    toolUrl: 'https://www.gematrix.org/',
    howTo: 'Enter a word or phrase to see its value in Jewish, English, and Simple Gematria systems.'
  },
  {
    type: 'Chinese Astrology / Numerology',
    tells: 'Focuses on the lunar year of birth and the five elements (Wood, Fire, Earth, Metal, Water) to determine character and destiny.',
    toolUrl: 'https://www.travelchinaguide.com/intro/social_customs/zodiac/',
    howTo: 'Enter your birth date to find your Zodiac animal and elemental affinity.'
  },
  {
    type: 'Kabbalah Numerology',
    tells: 'Derived from the Hebrew alphabet, it focuses on the vibrations of the name to understand the soul\'s path and life purpose.',
    toolUrl: 'https://www.numerology.com/articles/about-numerology/kabbalah-numerology/',
    howTo: 'Analyze the letters of your name using the Kabbalah system to find your core vibration.'
  },
  {
    type: 'Vedic Astrology (Jyotish)',
    tells: 'Uses the sidereal zodiac and lunar mansions (Nakshatras) to provide a deep analysis of karma, life cycles (Dashas), and spiritual destiny.',
    toolUrl: 'https://www.prokerala.com/astrology/vedic-astrology/',
    howTo: 'Enter your birth details to calculate your Nakshatra, Rashi, and current Dasha period.'
  },
  {
    type: 'Arabian / Islamic Astrology',
    tells: 'Focuses on the "Arabic Parts" (Lots) and Lunar Mansions (Manzils) for precise timing and understanding material vs. spiritual success.',
    toolUrl: 'https://www.astro.com/astrology/in_arabicparts_e.htm',
    howTo: 'Calculate your Part of Fortune and Part of Spirit to understand your life\'s focus.'
  },
  {
    type: 'Druid / Celtic Tree Astrology',
    tells: 'Aligns birth dates with sacred trees and Ogham symbols, emphasizing the connection between nature, lunar cycles, and character.',
    toolUrl: 'https://www.celtic-weddingrings.com/celtic-astrology',
    howTo: 'Find your Tree Sign and Totem Animal based on your birth date in the Celtic calendar.'
  },
  {
    type: 'Mayan / Aztec Astrology',
    tells: 'Uses the Tzolkin sacred calendar (260 days) to determine your Day Sign and Galactic Tone, revealing your cosmic frequency.',
    toolUrl: 'https://www.maya-portal.net/tzolkin',
    howTo: 'Calculate your Mayan Kin number and Day Sign using the Long Count correlation.'
  }
];

export const ToolGuide: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-8">
        <BookOpen className="text-gold" size={24} />
        <h2 className="font-display text-2xl text-[var(--text-primary)] tracking-widest uppercase">Reference Guide</h2>
      </div>

      <div className="grid gap-6">
        {guideData.map((item, index) => (
          <motion.div
            key={item.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-gold/30 transition-all group"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <h3 className="font-display text-lg text-gold tracking-wider">{item.type}</h3>
              <a 
                href={item.toolUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
              >
                External Resource <ExternalLink size={12} />
              </a>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Info size={14} className="text-gold/50" />
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">What it tells you</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {item.tells}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <HelpCircle size={14} className="text-gold/50" />
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">Quick How-To</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic">
                  "{item.howTo}"
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 flex justify-end">
              <div className="flex gap-1 h-1 items-end opacity-0 group-hover:opacity-20 transition-opacity">
                {Array.from({ length: 10 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [1, 4, 2, 3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                    className="w-1 bg-gold rounded-full"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
