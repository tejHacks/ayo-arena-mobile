import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Board } from '@/game/board';
import { arena } from '@/game/look';

const rules = [
  ['Sow', 'Pick one of your pits (bottom row). Its seeds are dropped one by one into the next pits, moving counter-clockwise. With 12 or more seeds you lap the board and skip the pit you started from.'],
  ['Capture', "If your last seed lands in your opponent's pit and makes it 2 or 3, you take them. Then check the pit before it: if that's 2 or 3 too, take those as well, and so on."],
  ['Feed your opponent', "If your opponent has no seeds, you must make a move that gives them some, if you can."],
  ['No grand slam', 'A move that would capture every seed on your opponent\'s side is allowed, but captures nothing.'],
  ['Winning', 'First to more than 24 of the 48 seeds wins. If nobody can move, or 100 moves pass with no capture, each player keeps the seeds on their side.'],
];
// Just after sowing 3 seeds from your 5th pit: the last lands in the computer's pit (now 3), the one before it has 2.
const EXAMPLE = [2, 3, 1, 0, 0, 5, 2, 3, 1, 4, 4, 4];

export default function HowToPlay() {
  return (
    <ScrollView style={{ backgroundColor: arena.table }} contentContainerStyle={styles.content}>
      <View pointerEvents="none">
        <Board pits={EXAMPLE} playable={[]} onPlay={() => {}} origin={4} landed={7} captured={[6, 7]} hint={null} owner={() => ''} />
      </View>
      <Text style={styles.caption}>Sow 3 seeds from your 5th pit: the last one lands in the computer&apos;s pit, making 3, and the pit before it now has 2. You capture both, 5 seeds.</Text>
      {rules.map(([title, body], i) => (
        <View key={title} style={styles.rule}>
          <Text style={styles.num}>{i + 1}</Text>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.body}>{body}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, gap: 14, paddingBottom: 48 },
  caption: { color: arena.subtle, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  rule: { flexDirection: 'row', gap: 14, backgroundColor: arena.tableHi, padding: 14, borderRadius: 18 },
  num: { color: arena.table, backgroundColor: arena.gold, width: 28, height: 28, borderRadius: 14, textAlign: 'center', lineHeight: 28, fontWeight: '900', overflow: 'hidden' },
  title: { color: arena.text, fontSize: 17, fontWeight: '800' },
  body: { color: arena.muted, fontSize: 15, lineHeight: 22 },
});
