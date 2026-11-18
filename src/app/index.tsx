import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { totals, useRecords } from '@/data/record';
import type { Difficulty } from '@/game/ayo';
import { Board } from '@/game/board';
import { arena } from '@/game/look';

type Mode = 'ai' | 'friend';
const levels: { id: Difficulty; label: string; blurb: string }[] = [
  { id: 'easy', label: 'Easy', blurb: 'Relaxed, makes mistakes' },
  { id: 'medium', label: 'Medium', blurb: 'Thinks 4 moves ahead' },
  { id: 'hard', label: 'Hard', blurb: 'Thinks 7 moves ahead' },
];
const PREVIEW = [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];

function Choice({ on, onPress, title, sub, icon }: { on: boolean; onPress: () => void; title: string; sub: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={title} onPress={onPress} style={[styles.choice, on && styles.choiceOn]}>
      <Ionicons name={icon} size={22} color={on ? arena.gold : arena.subtle} />
      <Text style={[styles.choiceTitle, on && { color: arena.text }]}>{title}</Text>
      <Text style={styles.choiceSub}>{sub}</Text>
    </Pressable>
  );
}

export default function Menu() {
  const [mode, setMode] = useState<Mode>('ai');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [records] = useRecords();
  const all = totals(records);
  const played = all.wins + all.losses + all.draws;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>AYỌ̀ · OWARE</Text>
            <Text style={styles.title}>Ayo Arena</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="How to play" onPress={() => router.push('/how-to-play')} style={styles.help}>
            <Ionicons name="help" size={22} color={arena.text} />
          </Pressable>
        </View>
        <Text style={styles.lede}>The Yorùbá seed-sowing classic. Sow, count ahead, and capture your opponent&apos;s seeds in twos and threes.</Text>

        <View pointerEvents="none" style={{ marginVertical: 6 }}>
          <Board pits={PREVIEW} playable={[]} onPlay={() => {}} origin={null} landed={null} captured={[]} hint={null} owner={() => ''} />
        </View>

        <Text style={styles.label}>Play against</Text>
        <View style={styles.row}>
          <Choice on={mode === 'ai'} onPress={() => setMode('ai')} title="Computer" sub="Practise and climb" icon="hardware-chip-outline" />
          <Choice on={mode === 'friend'} onPress={() => setMode('friend')} title="A friend" sub="Pass the phone" icon="people-outline" />
        </View>

        {mode === 'ai' ? (
          <>
            <Text style={styles.label}>Difficulty</Text>
            <View style={styles.row}>
              {levels.map((l) => (
                <Choice key={l.id} on={difficulty === l.id} onPress={() => setDifficulty(l.id)} title={l.label} sub={l.blurb} icon={l.id === 'easy' ? 'leaf-outline' : l.id === 'medium' ? 'flame-outline' : 'skull-outline'} />
              ))}
            </View>
          </>
        ) : null}

        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/game', params: { mode, difficulty } })} style={({ pressed }) => [styles.play, pressed && { transform: [{ scale: 0.98 }] }]}>
          <Ionicons name="play" size={22} color={arena.table} />
          <Text style={styles.playText}>Start game</Text>
        </Pressable>

        <Text style={styles.label}>Your record vs the computer</Text>
        <View style={styles.stats}>
          {levels.map((l) => (
            <View key={l.id} style={styles.stat} accessibilityLabel={`${l.label}: ${records[l.id].wins} wins, ${records[l.id].losses} losses, ${records[l.id].draws} draws`}>
              <Text style={styles.statLevel}>{l.label}</Text>
              <Text style={styles.statMain}>
                {records[l.id].wins}
                <Text style={styles.statDim}> – {records[l.id].losses}</Text>
              </Text>
              <Text style={styles.statSub}>{records[l.id].draws} draws</Text>
            </View>
          ))}
        </View>
        {played ? (
          <Text style={styles.foot}>
            {played} games · win streak {records.streak} · best win by {records.bestMargin}
          </Text>
        ) : (
          <Text style={styles.foot}>Win a game to start your record.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: arena.table },
  content: { padding: 18, gap: 14, paddingBottom: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { color: arena.gold, fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  title: { color: arena.text, fontSize: 38, fontWeight: '900', letterSpacing: -1 },
  help: { width: 44, height: 44, borderRadius: 22, backgroundColor: arena.tableHi, alignItems: 'center', justifyContent: 'center' },
  lede: { color: arena.muted, fontSize: 16, lineHeight: 23 },
  label: { color: arena.subtle, fontSize: 12, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 6 },
  row: { flexDirection: 'row', gap: 10 },
  choice: { flex: 1, padding: 12, borderRadius: 18, backgroundColor: arena.tableHi, borderWidth: 1.5, borderColor: 'transparent', gap: 4 },
  choiceOn: { borderColor: arena.gold, backgroundColor: 'rgba(245,184,46,0.10)' },
  choiceTitle: { color: arena.muted, fontSize: 16, fontWeight: '800' },
  choiceSub: { color: arena.subtle, fontSize: 12 },
  play: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', minHeight: 62, borderRadius: 31, backgroundColor: arena.gold, marginTop: 8 },
  playText: { color: arena.table, fontSize: 20, fontWeight: '900' },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, padding: 12, borderRadius: 18, backgroundColor: arena.tableHi, gap: 2 },
  statLevel: { color: arena.subtle, fontSize: 12, fontWeight: '700' },
  statMain: { color: arena.text, fontSize: 24, fontWeight: '900' },
  statDim: { color: arena.subtle, fontSize: 18, fontWeight: '700' },
  statSub: { color: arena.subtle, fontSize: 12 },
  foot: { color: arena.subtle, fontSize: 13, textAlign: 'center' },
});
