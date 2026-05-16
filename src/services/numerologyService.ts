// ============================================
// GG33 NUMEROLOGY & MISSION CONTROL SERVICE
// ============================================

/**
 * Reduces a number to its core vibration (1-9, or master numbers 11, 22, 33)
 */
export function reduce(num: number | string): number {
  let n = typeof num === 'string' ? parseInt(num.replace(/\D/g, '')) : num;
  if (isNaN(n)) return 0;
  
  // Special handling for master numbers in GG33/standard numerology
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = n.toString().split('').reduce((acc, d) => acc + parseInt(d), 0);
  }
  return n;
}

/**
 * Calculates the Personal Year for a given date of birth
 * Formula: Month + Day + Current Year
 */
export function personalYear(dob: string): number {
  if (!dob) return 1;
  const parts = dob.split('-');
  if (parts.length !== 3) return 1;
  
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);
  const currentYear = new Date().getFullYear();
  
  const sum = reduce(month) + reduce(day) + reduce(currentYear);
  return reduce(sum);
}

/**
 * Calculates the Personal Month
 * Formula: Personal Year + Current Month
 */
export function personalMonth(py: number): number {
  const currentMonth = new Date().getMonth() + 1;
  return reduce(py + currentMonth);
}

/**
 * Calculates the Personal Day
 * Formula: Personal Month + Current Day
 */
export function personalDay(pm: number): number {
  const currentDay = new Date().getDate();
  return reduce(pm + currentDay);
}

/**
 * Returns the Wealth Window status based on Personal Year
 */
export function wealthWindow(py: number): string {
  const map: Record<number, string> = {
    1: "Initiation: High potential for new financial seeds.",
    2: "Collaboration: Wealth through partnerships and patience.",
    3: "Expansion: Creative monetization and social growth.",
    4: "Foundation: Slow, steady accumulation through systems.",
    5: "Volatility: High risk/reward. Pivot quickly.",
    6: "Responsibility: Wealth through service and community.",
    7: "Knowledge: Invest in self-education, not markets.",
    8: "Manifestation: Peak wealth window. Execute power moves.",
    9: "Completion: Harvest and release. Don't start new ventures."
  };
  return map[py] || "Neutral Window";
}

/**
 * Calculates compatibility between two numbers (usually Life Paths)
 */
export function compatibility(a: number | string, b: number | string): string {
  const valA = reduce(a);
  const valB = reduce(b);
  const diff = Math.abs(valA - valB);

  if (diff === 0) return "Mirror souls – powerful but volatile.";
  if (diff === 1) return "Leadership synergy – wealth-friendly.";
  if (diff === 2) return "Supportive bond – emotional alignment.";
  if (diff >= 5) return "Karmic lesson – growth through friction.";

  return "Neutral compatibility.";
}

/**
 * Returns the Daily Directive based on Personal Day
 */
export function dailyDirective(pd: number): string {
  const map: Record<number, string> = {
    1: "Initiate. Lead. Decide.",
    2: "Negotiate. Observe. Align.",
    3: "Communicate. Publish. Pitch.",
    4: "Build systems. Avoid risk.",
    5: "Move fast. Expect volatility.",
    6: "Family, duty, responsibility.",
    7: "Silence. Study. Strategy.",
    8: "Power moves. Money actions.",
    9: "Close cycles. Release."
  };
  return map[pd] || "Observe and adapt.";
}
