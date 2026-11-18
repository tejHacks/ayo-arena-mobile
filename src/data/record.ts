import { useStoredState } from '@/lib/storage';
import type { Difficulty } from '@/game/ayo';

export interface Tally {
  wins: number;
  losses: number;
  draws: number;
}
export type Records = Record<Difficulty, Tally> & { bestMargin: number; streak: number };

const zero = (): Tally => ({ wins: 0, losses: 0, draws: 0 });
export const emptyRecords = (): Records => ({ easy: zero(), medium: zero(), hard: zero(), bestMargin: 0, streak: 0 });

export const useRecords = () => useStoredState<Records>('records', emptyRecords());

/** Fold one finished game against the computer into the records. */
export function addResult(r: Records, difficulty: Difficulty, winner: 0 | 1 | 'draw', margin: number): Records {
  const t = r[difficulty];
  return {
    ...r,
    [difficulty]: { wins: t.wins + (winner === 0 ? 1 : 0), losses: t.losses + (winner === 1 ? 1 : 0), draws: t.draws + (winner === 'draw' ? 1 : 0) },
    bestMargin: winner === 0 ? Math.max(r.bestMargin, margin) : r.bestMargin,
    streak: winner === 0 ? r.streak + 1 : 0,
  };
}

export const totals = (r: Records) =>
  (['easy', 'medium', 'hard'] as const).reduce((a, d) => ({ wins: a.wins + r[d].wins, losses: a.losses + r[d].losses, draws: a.draws + r[d].draws }), zero());
