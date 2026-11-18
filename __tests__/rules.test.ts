import { applyMove, bestMove, CYCLE_LIMIT, initialState, legalMoves, outcome, playMove, sowFrames, type State } from '@/game/ayo';
import { addResult, emptyRecords, totals } from '@/data/record';

const S = (pits: number[], extra: Partial<State> = {}): State => ({ pits, stores: [0, 0], turn: 0, sinceCapture: 0, ...extra });
const total = (s: State) => s.pits.reduce((a, b) => a + b, 0) + s.stores[0] + s.stores[1];

/** Deterministic random for repeatable games. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

describe('sowing', () => {
  it('drops one seed per pit counter-clockwise', () => {
    const next = applyMove(initialState(), 2);
    expect(next.pits.slice(0, 7)).toEqual([4, 4, 0, 5, 5, 5, 5]);
    expect(next.turn).toBe(1);
  });

  it('skips the starting pit when lapping the board', () => {
    const pits = Array(12).fill(0);
    pits[0] = 12;
    pits[6] = 1;
    const { frames, last } = sowFrames(S(pits), 0);
    expect(frames).toHaveLength(13);
    expect(frames[12][0]).toBe(0); // origin stays empty
    expect(last).toBe(1); // 11 pits, then skips 0 and lands in 1
  });
});

describe('capturing', () => {
  it("takes 2s and 3s on the opponent's side, chaining backwards", () => {
    //              0  1  2  3  4  5  6  7  8  9 10 11
    const s = S([0, 0, 0, 0, 3, 0, 1, 2, 4, 4, 4, 4]);
    const r = playMove(s, 4); // 5→1, 6→2, 7→3
    expect(r.captured).toEqual([7, 6]);
    expect(r.taken).toBe(5);
    expect(r.next.stores[0]).toBe(5);
    expect(r.next.pits[6] + r.next.pits[7]).toBe(0);
    expect(r.next.sinceCapture).toBe(0);
  });

  it('never captures on your own side', () => {
    const s = S([0, 1, 1, 0, 0, 0, 4, 4, 4, 4, 4, 4]);
    expect(playMove(s, 1).taken).toBe(0); // lands in own pit 2 making 2
  });

  it('a grand slam captures nothing', () => {
    // Capturing pits 6 and 7 would empty the opponent's whole side.
    const s = S([0, 0, 0, 0, 3, 0, 1, 2, 0, 0, 0, 0]);
    const r = playMove(s, 4);
    expect(r.taken).toBe(0);
    expect(r.next.pits[7]).toBe(3);
    expect(r.next.sinceCapture).toBe(1);
  });
});

describe('legal moves', () => {
  it('only lists your own non-empty pits', () => {
    expect(legalMoves(S([0, 1, 0, 2, 0, 0, 4, 4, 4, 4, 4, 4]))).toEqual([1, 3]);
    expect(legalMoves(S(Array(12).fill(4), { turn: 1 }))).toEqual([6, 7, 8, 9, 10, 11]);
  });

  it('forces you to feed an opponent with no seeds', () => {
    const s = S([3, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0]); // pit 0 can't reach, pit 5 can
    expect(legalMoves(s)).toEqual([5]);
  });
});

describe('game end', () => {
  it('ends when someone has more than 24', () => {
    const o = outcome(S(Array(12).fill(1), { stores: [25, 11] }));
    expect(o).toMatchObject({ over: true, winner: 0 });
  });

  it('24–24 is a draw', () => {
    expect(outcome(S(Array(12).fill(0), { stores: [24, 24] })).winner).toBe('draw');
  });

  it('with no legal move, each side keeps its own seeds', () => {
    // Player 2 to move with an empty side: the game ends and player 1 keeps their seed.
    const o = outcome(S([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], { stores: [23, 24], turn: 1 }));
    expect(o.over).toBe(true);
    expect(o.final.stores).toEqual([24, 24]);
    expect(o.winner).toBe('draw');
  });

  it(`stops endless cycles after ${CYCLE_LIMIT} moves without a capture`, () => {
    const o = outcome(S([2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2], { stores: [22, 22], sinceCapture: CYCLE_LIMIT }));
    expect(o.over).toBe(true);
    expect(o.final.stores).toEqual([24, 24]);
    expect(o.winner).toBe('draw');
  });
});

it('300 random games always keep all 48 seeds and finish', () => {
  const rand = rng(42);
  for (let g = 0; g < 300; g++) {
    let s = initialState();
    for (let turn = 0; turn < 1000 && !outcome(s).over; turn++) {
      const moves = legalMoves(s);
      s = applyMove(s, moves[Math.floor(rand() * moves.length)]);
      expect(total(s)).toBe(48);
    }
    const o = outcome(s);
    expect(o.over).toBe(true);
    expect(total(o.final)).toBe(48);
  }
});

describe('computer player', () => {
  it('finds the winning capture', () => {
    // Only pit 4 captures (2 + 3), taking the computer past 24.
    const s = S([1, 0, 0, 0, 3, 0, 1, 2, 0, 0, 0, 1], { stores: [23, 17] });
    expect(total(s)).toBe(48);
    expect(bestMove(s, 'medium')).toBe(4);
    expect(bestMove(s, 'hard')).toBe(4);
    expect(outcome(applyMove(s, 4)).winner).toBe(0);
  });

  it('medium beats random play every time over 20 games', () => {
    const rand = rng(7);
    let wins = 0;
    for (let g = 0; g < 20; g++) {
      let s = initialState();
      while (!outcome(s).over) {
        const moves = legalMoves(s);
        s = applyMove(s, s.turn === 1 ? bestMove(s, 'medium') : moves[Math.floor(rand() * moves.length)]);
      }
      if (outcome(s).winner === 1) wins++;
    }
    expect(wins).toBe(20);
  });
});

describe('records', () => {
  it('track wins, streaks and the best margin per difficulty', () => {
    let r = emptyRecords();
    r = addResult(r, 'hard', 0, 10);
    r = addResult(r, 'hard', 0, 4);
    r = addResult(r, 'easy', 1, -6);
    expect(r.hard).toEqual({ wins: 2, losses: 0, draws: 0 });
    expect(r.easy.losses).toBe(1);
    expect(r.bestMargin).toBe(10);
    expect(r.streak).toBe(0);
    expect(totals(r)).toEqual({ wins: 2, losses: 1, draws: 0 });
  });
});
