import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { arena } from './look';
import { SeedPile } from './seeds';

const TOP = [11, 10, 9, 8, 7, 6];
const BOTTOM = [0, 1, 2, 3, 4, 5];

export interface BoardProps {
  pits: number[];
  playable: number[];
  onPlay: (pit: number) => void;
  /** Pit the current move was sown from. */
  origin: number | null;
  /** Pit the last seed landed in. */
  landed: number | null;
  captured: number[];
  hint: number | null;
  owner: (pit: number) => string;
  /** Taller pits and bigger seeds for the full-screen game. */
  tall?: boolean;
}

function Pit({ n, playable, origin, landed, captured, hint, onPlay, label, tall }: { n: number; playable: boolean; origin: boolean; landed: boolean; captured: boolean; hint: boolean; onPlay: () => void; label: string; tall?: boolean }) {
  const [glow] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!hint) return;
    const loop = Animated.loop(Animated.sequence([Animated.timing(glow, { toValue: 1, duration: 500, useNativeDriver: false }), Animated.timing(glow, { toValue: 0, duration: 500, useNativeDriver: false })]));
    loop.start();
    return () => loop.stop();
  }, [hint, glow]);

  const border = captured ? arena.gold : hint ? glow.interpolate({ inputRange: [0, 1], outputRange: ['rgba(245,184,46,0.3)', arena.gold] }) : playable ? 'rgba(245,184,46,0.55)' : landed || origin ? 'rgba(255,244,230,0.35)' : 'transparent';
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !playable }} disabled={!playable} onPress={onPlay} style={styles.pitSlot}>
      {({ pressed }) => (
        <Animated.View style={[styles.pit, tall && { aspectRatio: 0.52 }, { borderColor: border, backgroundColor: captured ? 'rgba(245,184,46,0.35)' : arena.pit, transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
          <View style={styles.pitInner}>
            <SeedPile n={n} size={tall ? 12 : 10} />
          </View>
          <View style={[styles.count, playable && { backgroundColor: arena.gold }]}>
            <Text style={[styles.countText, playable && { color: arena.table }]}>{n}</Text>
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}

/** The carved two-row board. Bottom row is player 1 (left → right), top row player 2 (right → left). */
export function Board({ pits, playable, onPlay, origin, landed, captured, hint, owner, tall }: BoardProps) {
  const row = (idx: number[]) => (
    <View style={styles.row}>
      {idx.map((i) => (
        <Pit
          key={i}
          tall={tall}
          n={pits[i]}
          playable={playable.includes(i)}
          origin={origin === i}
          landed={landed === i}
          captured={captured.includes(i)}
          hint={hint === i}
          onPlay={() => onPlay(i)}
          label={`${owner(i)} pit ${(i % 6) + 1}, ${pits[i]} seed${pits[i] === 1 ? '' : 's'}${playable.includes(i) ? ', playable' : ''}${hint === i ? ', suggested move' : ''}`}
        />
      ))}
    </View>
  );
  return (
    <View style={styles.board}>
      {[0.22, 0.48, 0.74].map((t) => (
        <View key={t} style={[styles.grain, { top: `${t * 100}%` }]} />
      ))}
      {row(TOP)}
      <View style={styles.divider} />
      {row(BOTTOM)}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    backgroundColor: arena.wood,
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 4,
    borderColor: arena.woodEdge,
    borderBottomColor: arena.woodDark,
    borderBottomWidth: 9,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  grain: { position: 'absolute', left: -20, right: -20, height: 2, backgroundColor: arena.grain, transform: [{ rotate: '-1.5deg' }] },
  divider: { height: 2, marginHorizontal: 18, backgroundColor: arena.woodDark, borderRadius: 1 },
  row: { flexDirection: 'row', gap: 5 },
  pitSlot: { flex: 1 },
  pit: { aspectRatio: 0.78, borderRadius: 999, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center', borderTopColor: arena.pitRim },
  pitInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  count: { position: 'absolute', bottom: -7, minWidth: 22, paddingHorizontal: 5, height: 18, borderRadius: 9, backgroundColor: arena.woodDark, alignItems: 'center', justifyContent: 'center' },
  countText: { color: arena.text, fontSize: 11, fontWeight: '800' },
});
