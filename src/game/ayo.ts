/**
 * Ayo / Oware rules engine (abapa variant), pure and immutable.
 *
 * Pits 0–5 belong to player 0 (bottom row, left → right),
 * pits 6–11 to player 1 (top row, right → left). Sowing runs
 * counter-clockwise: index + 1, wrapping at 12, skipping the origin pit.
 */
export type Player = 0 | 1;

export interface State {
  pits: number[];
  stores: [number, number];
  turn: Player;
  /** Moves since the last capture — ends endless cycles. */
  sinceCapture: number;
}

/** If nobody captures for this many moves, the game ends (players keep their own side). */
export const CYCLE_LIMIT = 100;

export const initialState = (): State => ({ pits: Array(12).fill(4), stores: [0, 0], turn: 0, sinceCapture: 0 });

export const ownPits = (p: Player) => (p === 0 ? [0, 1, 2, 3, 4, 5] : [6, 7, 8, 9, 10, 11]);
const isOwn = (p: Player, i: number) => (p === 0 ? i < 6 : i >= 6);
const sideTotal = (pits: number[], p: Player) => ownPits(p).reduce((s, i) => s + pits[i], 0);
const other = (p: Player): Player => (p === 0 ? 1 : 0);

/** Every intermediate pit array while sowing — used for the animation. */
export function sowFrames(state: State, pit: number): { frames: number[][]; last: number } {
  const pits = [...state.pits];
  let seeds = pits[pit];
  pits[pit] = 0;
  const frames = [[...pits]];
  let i = pit;
  while (seeds > 0) {
    i = (i + 1) % 12;
    if (i === pit) continue;
    pits[i]++;
    seeds--;
    frames.push([...pits]);
  }
  return { frames, last: i };
}

/** Apply a move: sow, then capture 2s and 3s backwards on the opponent's side. */
export function applyMove(state: State, pit: number): State {
  const me = state.turn;
  const { frames, last } = sowFrames(state, pit);
  const pits = [...frames[frames.length - 1]];
  const stores: [number, number] = [...state.stores];

  const captured: number[] = [];
  let i = last;
  while (!isOwn(me, i) && (pits[i] === 2 || pits[i] === 3)) {
    captured.push(i);
    i = (i + 11) % 12;
  }
  const take = captured.reduce((s, k) => s + pits[k], 0);
  // Grand slam: capturing every opponent seed is not allowed — the move stands but captures nothing.
  const capturing = take > 0 && take < sideTotal(pits, other(me));
  if (capturing) {
    for (const k of captured) pits[k] = 0;
    stores[me] += take;
  }

  return { pits, stores, turn: other(me), sinceCapture: capturing ? 0 : state.sinceCapture + 1 };
}

/** Legal moves, enforcing the "must feed an empty opponent" rule. */
export function legalMoves(state: State): number[] {
  const me = state.turn;
  const candidates = ownPits(me).filter((i) => state.pits[i] > 0);
  if (sideTotal(state.pits, other(me)) > 0) return candidates;
  return candidates.filter((i) => sideTotal(applyMove(state, i).pits, other(me)) > 0);
}

export interface Outcome {
  over: boolean;
  winner: Player | 'draw' | null;
  final: State;
}

export function outcome(state: State): Outcome {
  const [a, b] = state.stores;
  if (a > 24 || b > 24 || (a === 24 && b === 24)) {
    return { over: true, winner: a === b ? 'draw' : a > b ? 0 : 1, final: state };
  }
  if (legalMoves(state).length === 0 || state.sinceCapture >= CYCLE_LIMIT) {
    // No legal move (or an endless cycle): each player keeps the seeds on their own side.
    const stores: [number, number] = [a + sideTotal(state.pits, 0), b + sideTotal(state.pits, 1)];
    const final = { ...state, pits: Array(12).fill(0), stores };
    return { over: true, winner: stores[0] === stores[1] ? 'draw' : stores[0] > stores[1] ? 0 : 1, final };
  }
  return { over: false, winner: null, final: state };
}

/** Alpha-beta minimax. Score is from `ai`'s point of view. */
function search(state: State, depth: number, alpha: number, beta: number, ai: Player): number {
  const o = outcome(state);
  if (o.over) {
    const diff = o.final.stores[ai] - o.final.stores[other(ai)];
    return diff * 100;
  }
  if (depth === 0) {
    return state.stores[ai] - state.stores[other(ai)] + 0.1 * (sideTotal(state.pits, ai) - sideTotal(state.pits, other(ai)));
  }
  const maximizing = state.turn === ai;
  let best = maximizing ? -Infinity : Infinity;
  for (const m of legalMoves(state)) {
    const v = search(applyMove(state, m), depth - 1, alpha, beta, ai);
    if (maximizing) {
      best = Math.max(best, v);
      alpha = Math.max(alpha, v);
    } else {
      best = Math.min(best, v);
      beta = Math.min(beta, v);
    }
    if (beta <= alpha) break;
  }
  return best;
}

export type Difficulty = 'easy' | 'medium' | 'hard';
const DEPTH: Record<Difficulty, number> = { easy: 1, medium: 4, hard: 7 };

export function bestMove(state: State, difficulty: Difficulty): number {
  const moves = legalMoves(state);
  if (difficulty === 'easy' && Math.random() < 0.4) return moves[Math.floor(Math.random() * moves.length)];
  let best = moves[0];
  let bestScore = -Infinity;
  for (const m of moves) {
    const v = search(applyMove(state, m), DEPTH[difficulty] - 1, -Infinity, Infinity, state.turn);
    if (v > bestScore) {
      bestScore = v;
      best = m;
    }
  }
  return best;
}
