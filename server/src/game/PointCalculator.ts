import type { Difficulty } from '@artfully/shared';
import { DIFFICULTY_MULTIPLIERS, POINTS_CONFIG } from '@artfully/shared';

export class PointCalculator {
  calculateGuesserPoints(
    guessOrder: number,
    timeRemaining: number,
    firstGuessTime: number | null,
    maxPoints: number,
    difficulty: Difficulty
  ): number {
    const basePoints = maxPoints * DIFFICULTY_MULTIPLIERS[difficulty];

    // First guesser gets full points
    if (guessOrder === 1) {
      return Math.floor(basePoints);
    }

    // Subsequent guessers get points based on time relative to first guess
    if (!firstGuessTime || firstGuessTime <= 0) {
      return Math.floor(basePoints * 0.5);
    }

    const referenceTime = firstGuessTime / 2;
    const proportion = Math.max(0, timeRemaining / referenceTime);

    return Math.max(POINTS_CONFIG.MIN_GUESSER_POINTS, Math.floor(proportion * basePoints));
  }

  calculateDrawerPoints(
    totalGuessers: number,
    maxGuessers: number,
    maxPoints: number,
    difficulty: Difficulty
  ): number {
    if (totalGuessers === 0 || maxGuessers === 0) {
      return 0;
    }

    const basePoints = maxPoints * DIFFICULTY_MULTIPLIERS[difficulty];
    const proportion = totalGuessers / maxGuessers;

    return Math.floor(proportion * basePoints * POINTS_CONFIG.DRAWER_POINTS_RATIO);
  }
}
