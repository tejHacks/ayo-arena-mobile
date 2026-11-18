import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { addResult, useRecords } from '@/data/record';
import { bestMove, initialState, legalMoves, outcome, playMove, sowFrames, type Difficulty, type Player, type State } from '@/game/ayo';
import { Board } from '@/game/board';
import { arena } from '@/game/look';
import { SeedPile } from '@/game/seeds';

const STEP_MS = 130;
const AI_DELAY_MS = 550;

type Mode = 'ai' | 'friend';

function PlayerPanel({ name, sub, score, active, color, icon, gain }: { name: string; sub: string; score: number; active: boolean; color: string; icon: keyof typeof Ionicons.glyphMap; gain: number }) {
  const [pop] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!gain) return;
    pop.setValue(1);
    Animated.timing(pop, { toValue: 0, duration: 1100, useNativeDriver: true }).start();
  }, [gain, pop]);
  return (
    <View style={[styles.player, active && { borderColor: color, backgroundColor: arena.tableHi }]}>
      <View style={[styles.avatar, { backgroundColor: color }]}>
        <Ionicons name={icon} size={22} color={arena.table} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.playerName}>{name}</Text>
        <Text style={[styles.playerSub, active && { color }]}>{sub}</Text>
      </View>
      <View style={styles.store} accessibilityLabel={`${name} has captured ${score} seeds`}>
        <View style={{ width: 34, height: 30, alignItems: 'center', justifyContent: 'center' }}>
          <SeedPile n={Math.min(score, 18)} size={7} />
        </View>
        <Text style={styles.score}>{score}</Text>
        <Animated.Text style={[styles.gain, { opacity: pop, transform: [{ translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }) }] }]}>+{gain}</Animated.Text>
      </View>
    </View>
  );
}

export default function Game() {
  const params = useLocalSearchParams<{ mode?: Mode; difficulty?: Difficulty }>();
  const mode: Mode = params.mode === 'friend' ? 'friend' : 'ai';
  const difficulty: Difficulty = params.difficulty === 'easy' || params.difficulty === 'hard' ? params.difficulty : 'medium';

  const [state, setState] = useState<State>(initialState);
  const [display, setDisplay] = useState<number[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState<number | null>(null);
  const [landed, setLanded] = useState<number | null>(null);
  const [captured, setCaptured] = useState<number[]>([]);
  const [gain, setGain] = useState<[number, number]>([0, 0]);
  const [hint, setHint] = useState<number | null>(null);
  const [, setRecords] = useRecords();
  const recorded = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const result = outcome(state);
  const shown = result.over ? result.final : state;
  const name = (p: Player) => (mode === 'ai' ? (p === 0 ? 'You' : 'Computer') : `Player ${p + 1}`);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  /** Animate sowing seed by seed, then commit the move. */
  const play = (pit: number) => {
    if (busy || result.over) return;
    setBusy(true);
    setHint(null);
    setCaptured([]);
    setOrigin(pit);
    setLanded(null);
    Haptics.selectionAsync().catch(() => {});
    const { frames } = sowFrames(state, pit);
    const move = playMove(state, pit);
    let k = 0;
    setDisplay(frames[0]);
    timer.current = setInterval(() => {
      k++;
      if (k < frames.length) {
        setDisplay(frames[k]);
        return;
      }
      if (timer.current) clearInterval(timer.current);
      setLanded(move.last);
      if (move.taken) {
        setCaptured(move.captured);
        setGain((g) => (state.turn === 0 ? [move.taken, g[1]] : [g[0], move.taken]));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      setDisplay(null);
      setState(move.next);
      setBusy(false);
    }, STEP_MS);
  };

  // Computer's turn
  useEffect(() => {
    if (mode !== 'ai' || state.turn !== 1 || busy || outcome(state).over) return;
    const t = setTimeout(() => play(bestMove(state, difficulty)), AI_DELAY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, busy]);

  // Record the result once (vs computer only)
  useEffect(() => {
    if (!result.over || mode !== 'ai' || recorded.current || result.winner === null) return;
    recorded.current = true;
    const [a, b] = result.final.stores;
    setRecords((r) => addResult(r, difficulty, result.winner as 0 | 1 | 'draw', a - b));
    Haptics.notificationAsync(result.winner === 0 ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => {});
  }, [result.over, result.winner, result.final.stores, mode, difficulty, setRecords]);

  const restart = () => {
    recorded.current = false;
    setDisplay(null);
    setOrigin(null);
    setLanded(null);
    setCaptured([]);
    setGain([0, 0]);
    setHint(null);
    setState(initialState());
  };

  const humanTurn = mode === 'friend' || state.turn === 0;
  const playable = busy || result.over || !humanTurn ? [] : legalMoves(state);
  const pits = display ?? shown.pits;
  const status = result.over ? 'Game over' : busy ? 'Sowing…' : humanTurn ? (mode === 'ai' ? 'Your move: tap a glowing pit' : `${name(state.turn)}, your move`) : 'Computer is thinking…';

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to menu" hitSlop={12} onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={arena.text} />
        </Pressable>
        <Text style={styles.title}>{mode === 'ai' ? `vs Computer · ${difficulty[0].toUpperCase()}${difficulty.slice(1)}` : 'Pass and play'}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Show a hint"
          hitSlop={12}
          disabled={!playable.length}
          onPress={() => setHint(bestMove(state, 'medium'))}
          style={[styles.iconBtn, !playable.length && { opacity: 0.35 }]}>
          <Ionicons name="bulb-outline" size={20} color={arena.gold} />
        </Pressable>
      </View>


      <View style={styles.middle}>
        <PlayerPanel name={name(1)} sub={state.turn === 1 && !result.over ? (mode === 'ai' ? 'Thinking…' : 'To move') : 'Captured'} score={shown.stores[1]} active={state.turn === 1 && !result.over} color={arena.them} icon={mode === 'ai' ? 'hardware-chip' : 'person'} gain={gain[1]} />
        <Board
          pits={pits}
          playable={playable}
          onPlay={play}
          origin={origin}
          landed={landed}
          captured={captured}
          hint={hint}
          tall
          owner={(i) => (i < 6 ? (mode === 'ai' ? 'Your' : "Player 1's") : mode === 'ai' ? "Computer's" : "Player 2's")}
        />
        <Text style={styles.status} accessibilityLiveRegion="polite">
          {status}
        </Text>
        <PlayerPanel name={name(0)} sub={state.turn === 0 && !result.over ? 'To move' : 'Captured'} score={shown.stores[0]} active={state.turn === 0 && !result.over} color={arena.you} icon="person" gain={gain[0]} />
      </View>


      {result.over ? (
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Ionicons name={result.winner === 'draw' ? 'remove-circle' : result.winner === 0 || mode === 'friend' ? 'trophy' : 'refresh-circle'} size={44} color={arena.gold} />
            <Text style={styles.sheetTitle}>
              {result.winner === 'draw' ? "It's a draw" : mode === 'ai' ? (result.winner === 0 ? 'You win!' : 'The computer wins') : `${name(result.winner as Player)} wins!`}
            </Text>
            <Text style={styles.sheetScore}>
              {result.final.stores[0]} – {result.final.stores[1]}
            </Text>
            <Pressable accessibilityRole="button" onPress={restart} style={[styles.cta, { backgroundColor: arena.gold }]}>
              <Text style={[styles.ctaText, { color: arena.table }]}>Play again</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.cta}>
              <Text style={styles.ctaText}>Menu</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: arena.table, paddingHorizontal: 14, gap: 12 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: arena.tableHi, alignItems: 'center', justifyContent: 'center' },
  title: { color: arena.muted, fontSize: 15, fontWeight: '700' },
  player: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 20, borderWidth: 1.5, borderColor: 'transparent' },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  playerName: { color: arena.text, fontSize: 17, fontWeight: '800' },
  playerSub: { color: arena.subtle, fontSize: 13, fontWeight: '600' },
  store: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: arena.woodDark, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 },
  score: { color: arena.text, fontSize: 24, fontWeight: '900', minWidth: 30, textAlign: 'right' },
  gain: { position: 'absolute', right: 8, top: -16, color: arena.gold, fontWeight: '900', fontSize: 16 },
  middle: { flex: 1, justifyContent: 'center', gap: 16 },
  status: { color: arena.muted, textAlign: 'center', fontSize: 15, fontWeight: '600' },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10,6,4,0.72)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet: { width: '100%', maxWidth: 380, backgroundColor: arena.tableHi, borderRadius: 28, padding: 24, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(245,184,46,0.3)' },
  sheetTitle: { color: arena.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  sheetScore: { color: arena.muted, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  cta: { alignSelf: 'stretch', minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,244,230,0.2)' },
  ctaText: { color: arena.text, fontSize: 17, fontWeight: '800' },
});
