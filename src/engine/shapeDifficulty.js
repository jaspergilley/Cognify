/**
 * Shape Pair Difficulty Module
 *
 * Replaces random shape selection with difficulty-tiered pair pools.
 * Equivalent to the UFOV vehicle-morphing system where car/truck silhouettes
 * become progressively more similar across 9 stages.
 *
 * Shapes are grouped by visual confusability. Pairs within the same
 * confusability group are harder to distinguish at brief display durations.
 *
 * @module engine/shapeDifficulty
 */

/**
 * Pre-computed pair pools by difficulty level.
 * Level 1 = maximally distinct shapes, Level 4 = maximally confusable.
 */
const PAIR_POOLS = {
  // Level 1 (Very Easy) — cross-category, no shared visual features
  1: [
    ['circle', 'square'],
    ['circle', 'plus'],
    ['circle', 'triangle'],
    ['circle', 'diamond'],
    ['heart', 'square'],
    ['heart', 'plus'],
    ['heart', 'triangle'],
    ['heart', 'diamond'],
    ['star5', 'circle'],
    ['star5', 'square'],
    ['square', 'arrowUp'],
    ['triangle', 'heart'],
  ],
  // Level 2 (Easy) — different category but some structural overlap
  2: [
    ['square', 'triangle'],
    ['diamond', 'plus'],
    ['triangle', 'pentagon'],
    ['hexagon', 'diamond'],
    ['arrowUp', 'star5'],
    ['heart', 'hexagon'],
    ['pentagon', 'diamond'],
    ['star4', 'circle'],
    ['arrowRight', 'circle'],
  ],
  // Level 3 (Medium) — moderate confusability
  3: [
    ['square', 'diamond'],
    ['triangle', 'arrowUp'],
    ['hexagon', 'circle'],
    ['pentagon', 'star5'],
    ['pentagon', 'triangle'],
    ['arrowUp', 'arrowRight'],
    ['star4', 'diamond'],
  ],
  // Level 4 (Hard) — high confusability within same visual category
  4: [
    ['star5', 'star4'],
    ['pentagon', 'hexagon'],
    ['plus', 'x'],
    ['arrowUp', 'arrowRight'],
    ['triangle', 'diamond'],
  ],
};

/**
 * Get allowed difficulty levels based on completed session count.
 * Progression mirrors UFOV vehicle morphing: early sessions use
 * maximally distinct pairs, later sessions introduce confusable pairs.
 *
 * @param {number} sessionCount - Total completed sessions for this exercise type
 * @returns {number[]} Array of allowed difficulty levels (1-4)
 */
export function getAllowedLevels(sessionCount) {
  if (sessionCount < 3) return [1];
  if (sessionCount < 6) return [1, 2];
  if (sessionCount < 10) return [1, 2, 3];
  return [1, 2, 3, 4];
}

/**
 * Pick a shape pair weighted by allowed difficulty levels.
 * Higher levels have greater probability as sessions progress,
 * ensuring harder pairs appear more often for experienced users.
 *
 * @param {number} sessionCount - Total completed sessions for this exercise type
 * @returns {{ target: string, alternative: string, difficultyLevel: number }}
 */
export function pickShapePairByDifficulty(sessionCount) {
  const levels = getAllowedLevels(sessionCount);

  // Weight toward harder levels: [1] -> [1], [1,2] -> [1,2], [1,2,3] -> [1,2,3]
  const weights = levels.map((_, i) => i + 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  let r = Math.random() * totalWeight;
  let chosenLevel = levels[0];
  for (let i = 0; i < levels.length; i++) {
    r -= weights[i];
    if (r <= 0) {
      chosenLevel = levels[i];
      break;
    }
  }

  const pool = PAIR_POOLS[chosenLevel];
  const pair = pool[Math.floor(Math.random() * pool.length)];
  const [a, b] = Math.random() < 0.5 ? pair : [pair[1], pair[0]];

  return { target: a, alternative: b, difficultyLevel: chosenLevel };
}
