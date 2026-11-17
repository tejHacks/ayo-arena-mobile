import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Button, Card, H1, Label, Pill, Row, Screen } from '@/components/ui';
import { applyMove, bestMove, initialState, legalMoves, outcome, sowFrames, type Difficulty, type State } from '@/game/ayo';
import { useStoredState } from '@/lib/storage';
import { usePalette } from '@/theme';

type Mode = 'ai' | 'friend';
const STEP_MS = 140;

const WOOD = '#7C2D12';
const PIT = '#431407';
const SEED = '#FDE68A';

/** Seeds drawn as dots (up to 12), then a number. */
function Seeds({ n }: { n: number }) {
  const dots = Math.min(n, 12);
  return (
    <View style={styles.seedWrap}>
      {Array.from({ length: dots }, (_, i) => (
        <View key={i} style={styles.seed} />
      ))}
      {n > 12 ? <Text style={styles.seedMore}>+{n - 12}</Text> : null}
    </View>
  );
}

export default function AyoArena() {
  const c = usePalette();
  const [mode, setMode] = useState<Mode>('ai');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [state, setState] = useState<State | null>(null);
  const [display, setDisplay] = useState<number[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastPit, setLastPit] = useState<number | null>(null);
  const [record, setRecord] = useStoredState('record', { wins: 0, losses: 0, draws: 0 });
  const recorded = useRef(false);

  const result = state ? outcome(state) : null;
  const shown = result?.over ? result.final : state;

  /** Animate sowing seed by seed, then commit the move. */
  const play = (pit: number) => {
    if (!state || busy) return;
    setBusy(true);
    setLastPit(pit);
    Haptics.selectionAsync().catch(() => {});
    const { frames } = sowFrames(state, pit);
    let k = 0;
    const t = setInterval(() => {
      k++;
      if (k < frames.length) {
        setDisplay(frames[k]);
        return;
      }
      clearInterval(t);
      const next = applyMove(state, pit);
      if (next.stores[state.turn] > state.stores[state.turn]) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setDisplay(null);
      setState(next);
      setBusy(false);
    }, STEP_MS);
    setDisplay(frames[0]);
  };

  // AI turn
  useEffect(() => {
    if (!state || mode !== 'ai' || state.turn !== 1 || busy || outcome(state).over) return;
    const t = setTimeout(() => play(bestMove(state, difficulty)), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode, busy, difficulty]);

  // Record result once per game (vs AI only)
  useEffect(() => {
    if (!result?.over || mode !== 'ai' || recorded.current) return;
    recorded.current = true;
    setRecord((r) => ({
      wins: r.wins + (result.winner === 0 ? 1 : 0),
      losses: r.losses + (result.winner === 1 ? 1 : 0),
      draws: r.draws + (result.winner === 'draw' ? 1 : 0),
    }));
  }, [result?.over, result?.winner, mode, setRecord]);

  const start = () => {
    recorded.current = false;
    setDisplay(null);
    setLastPit(null);
    setState(initialState());
  };

  if (!state || !shown) {
    return (
      <Screen>
        <H1>Ayo Arena</H1>
        <Body muted>The Yorùbá seed-sowing classic. Sow seeds counter-clockwise; capture when your last seed makes 2 or 3 in your opponent&apos;s pit.</Body>
        <Card>
          <Label>Play against</Label>
          <Row>
            <Pill active={mode === 'ai'} onPress={() => setMode('ai')}>Computer</Pill>
            <Pill active={mode === 'friend'} onPress={() => setMode('friend')}>A friend</Pill>
          </Row>
          {mode === 'ai' ? (
            <>
              <Label style={{ marginTop: 8 }}>Difficulty</Label>
              <Row>
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <Pill key={d} active={difficulty === d} onPress={() => setDifficulty(d)}>
                    {d[0].toUpperCase() + d.slice(1)}
                  </Pill>
                ))}
              </Row>
            </>
          ) : null}
        </Card>
        <Button big title="Start game" onPress={start} />
        <Body muted style={{ textAlign: 'center' }}>
          Record vs computer: {record.wins}W · {record.losses}L · {record.draws}D
        </Body>
      </Screen>
    );
  }

  const pits = display ?? shown.pits;
  const legal = busy || result?.over ? [] : legalMoves(state);
  const canTap = (i: number) => legal.includes(i) && (mode === 'friend' || state.turn === 0);
  const name = (p: 0 | 1) => (mode === 'ai' ? (p === 0 ? 'You' : 'Computer') : `Player ${p + 1}`);

  const pitView = (i: number) => (
    <Pressable
      key={i}
      disabled={!canTap(i)}
      onPress={() => play(i)}
      accessibilityLabel={`Pit with ${pits[i]} seeds`}
      style={[styles.pit, { borderColor: canTap(i) ? '#FBBF24' : lastPit === i ? '#FDBA74' : 'transparent' }]}>
      <Seeds n={pits[i]} />
      <Text style={styles.count}>{pits[i]}</Text>
    </Pressable>
  );

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={[styles.player, { color: state.turn === 1 && !result?.over ? c.primary : c.muted }]}>
          {name(1)} · {shown.stores[1]}
        </Text>
        <Text style={{ color: c.subtle }}>{result?.over ? 'Game over' : busy ? 'Sowing…' : `${name(state.turn)} to move`}</Text>
      </Row>

      <View style={styles.board}>
        <View style={styles.row}>{[11, 10, 9, 8, 7, 6].map(pitView)}</View>
        <View style={styles.row}>{[0, 1, 2, 3, 4, 5].map(pitView)}</View>
      </View>

      <Text style={[styles.player, { color: state.turn === 0 && !result?.over ? c.primary : c.muted }]}>
        {name(0)} · {shown.stores[0]}
      </Text>

      {result?.over ? (
        <Card>
          <H1 style={{ fontSize: 26 }}>{result.winner === 'draw' ? "It's a draw." : `${name(result.winner as 0 | 1)} win${mode === 'ai' && result.winner === 0 ? '' : 's'}!`}</H1>
          <Body muted>
            Final score {result.final.stores[0]} – {result.final.stores[1]}
          </Body>
          <Button title="Play again" onPress={start} />
        </Card>
      ) : (
        <Button title="Quit to menu" variant="secondary" onPress={() => setState(null)} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  board: { backgroundColor: WOOD, borderRadius: 28, padding: 10, gap: 10, borderWidth: 3, borderColor: '#B45309' },
  row: { flexDirection: 'row', gap: 6 },
  pit: { flex: 1, aspectRatio: 0.8, borderRadius: 999, backgroundColor: PIT, alignItems: 'center', justifyContent: 'center', borderWidth: 2, padding: 4 },
  seedWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 2, maxWidth: 40 },
  seed: { width: 7, height: 7, borderRadius: 4, backgroundColor: SEED },
  seedMore: { color: SEED, fontSize: 9, fontWeight: '700' },
  count: { color: '#FED7AA', fontSize: 11, fontWeight: '800', marginTop: 2 },
  player: { fontSize: 18, fontWeight: '800' },
});
