import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { arena } from './look';

const GOLDEN = 2.39996; // radians
const MAX_DRAWN = 18;

/**
 * A natural-looking pile of ayo seeds: a golden-angle spiral, so every count
 * has the same layout each time and seeds never overlap much.
 */
export const SeedPile = memo(function SeedPile({ n, size = 9 }: { n: number; size?: number }) {
  const drawn = Math.min(n, MAX_DRAWN);
  const spread = size * 0.62;
  return (
    <View style={styles.box} pointerEvents="none">
      {Array.from({ length: drawn }, (_, k) => {
        const r = spread * Math.sqrt(k);
        const a = k * GOLDEN;
        return (
          <View
            key={k}
            style={[
              styles.seed,
              {
                width: size,
                height: size * 0.82,
                left: -size / 2,
                top: -size * 0.41,
                borderRadius: size,
                backgroundColor: arena.seeds[k % arena.seeds.length],
                transform: [{ translateX: r * Math.cos(a) }, { translateY: r * Math.sin(a) }, { rotate: `${(k * 47) % 180}deg` }],
              },
            ]}
          />
        );
      })}
      {n > MAX_DRAWN ? <Text style={styles.more}>+{n - MAX_DRAWN}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  box: { width: 0, height: 0, alignItems: 'center', justifyContent: 'center' },
  seed: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(0,0,0,0.35)' },
  more: { position: 'absolute', top: 14, color: arena.text, fontSize: 10, fontWeight: '800' },
});
