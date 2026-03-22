/**
 * Science Content
 *
 * Pure JS module for research facts, between-block messages,
 * and personalized impact messages. Uses i18n keys.
 *
 * @module engine/scienceContent
 */

export const RESEARCH_FACT_COUNT = 13;
export const BETWEEN_BLOCK_COUNT = 4;
export const ENCOURAGEMENT_COUNT = 8;

/**
 * Get a research fact by index.
 * @param {function} t - Translation function
 * @param {number} index - 0-based fact index
 * @returns {{ text: string, source: string, institution: string }}
 */
export function getResearchFact(t, index) {
  const i = index % RESEARCH_FACT_COUNT;
  return {
    text: t(`researchFact.${i}.text`),
    source: t(`researchFact.${i}.source`),
    institution: t(`researchFact.${i}.institution`),
  };
}

/**
 * Get a between-block message (encouragement + research fact).
 * @param {function} t - Translation function
 * @param {number} index - 0-based index
 * @returns {{ encouragement: string, fact: string, source: string }}
 */
export function getBetweenBlockMessage(t, index) {
  const i = index % BETWEEN_BLOCK_COUNT;
  return {
    encouragement: t(`betweenBlock.${i}.encouragement`),
    fact: t(`betweenBlock.${i}.fact`),
    source: t(`betweenBlock.${i}.source`),
  };
}

/**
 * Get a random encouragement message.
 * @param {function} t - Translation function
 * @param {number} index
 * @returns {string}
 */
export function getEncouragement(t, index) {
  return t(`encouragement.${index % ENCOURAGEMENT_COUNT}`);
}

/**
 * Get a personalized impact message based on session count and improvement.
 * @param {function} t - Translation function
 * @param {number} sessionCount - Total sessions completed
 * @param {number|null} improvementMs - Improvement from baseline in ms
 * @param {number|null} baselineMs - Original baseline in ms
 * @returns {string}
 */
export function getPersonalizedImpactMessage(t, sessionCount, improvementMs, baselineMs) {
  if (sessionCount >= 14) {
    return t('impact.fullProtocol', { count: sessionCount });
  }
  if (improvementMs && baselineMs && improvementMs > 10) {
    const percent = Math.round((improvementMs / baselineMs) * 100);
    if (improvementMs > 30) {
      return t('impact.meaningfulImprovement', { improvement: improvementMs });
    }
    return t('impact.speedImprovement', { improvement: improvementMs, percent });
  }
  if (sessionCount >= 10) {
    return t('impact.coreComplete');
  }
  if (sessionCount >= 5) {
    return t('impact.midProgress', { count: sessionCount });
  }
  return t('impact.earlyProgress', { count: sessionCount });
}

/**
 * Get a random fact index.
 * @returns {number}
 */
export function randomFactIndex() {
  return Math.floor(Math.random() * RESEARCH_FACT_COUNT);
}
