import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { resetStoredStateCache } from '@/lib/storage';

const APP = './src/app';

beforeEach(async () => {
  await AsyncStorage.clear();
  resetStoredStateCache();
});

it('the menu shows modes, difficulties and an empty record', async () => {
  await renderRouter(APP, { initialUrl: '/' });
  expect(await screen.findByText('Ayo Arena')).toBeOnTheScreen();
  expect(screen.getByLabelText('Computer')).toBeOnTheScreen();
  expect(screen.getByLabelText('Hard')).toBeOnTheScreen();
  expect(screen.getByText('Win a game to start your record.')).toBeOnTheScreen();
});

it('pass-and-play: a move sows seeds and hands the turn over', async () => {
  await renderRouter(APP, { initialUrl: '/' });
  await fireEvent.press(await screen.findByLabelText('A friend'));
  expect(screen.queryByLabelText('Hard')).toBeNull(); // no difficulty against a friend
  await fireEvent.press(screen.getByText('Start game'));

  expect(await screen.findByText('Player 1, your move')).toBeOnTheScreen();
  await fireEvent.press(screen.getByLabelText("Player 1's pit 3, 4 seeds, playable"));
  await waitFor(() => expect(screen.getByText('Player 2, your move')).toBeOnTheScreen(), { timeout: 3000 });
  expect(screen.getByLabelText("Player 1's pit 3, 0 seeds")).toBeOnTheScreen();
  expect(screen.getByLabelText("Player 1's pit 4, 5 seeds")).toBeOnTheScreen();
  expect(screen.getByLabelText("Player 2's pit 1, 5 seeds, playable")).toBeOnTheScreen();
});

it('against the computer, it replies after your move', async () => {
  await renderRouter(APP, { initialUrl: '/game?mode=ai&difficulty=easy' });
  await fireEvent.press(await screen.findByLabelText('Your pit 1, 4 seeds, playable'));
  await waitFor(() => expect(screen.getByText('Your move: tap a glowing pit')).toBeOnTheScreen(), { timeout: 5000 });
  // 48 seeds in play after two moves: the computer side changed.
  const computerSeeds = [1, 2, 3, 4, 5, 6].map((n) => Number(screen.getByLabelText(new RegExp(`^Computer's pit ${n}, (\\d+) seed`)).props.accessibilityLabel.match(/, (\d+) seed/)[1]));
  expect(computerSeeds.some((n) => n === 0)).toBe(true);
});

it('the hint highlights a playable pit', async () => {
  await renderRouter(APP, { initialUrl: '/game?mode=ai&difficulty=medium' });
  expect(screen.queryByLabelText(/suggested move/)).toBeNull();
  await fireEvent.press(await screen.findByLabelText('Show a hint'));
  expect(screen.getByLabelText(/^Your pit \d, 4 seeds, playable, suggested move$/)).toBeOnTheScreen();
});

it('how to play explains the capture rule', async () => {
  await renderRouter(APP, { initialUrl: '/how-to-play' });
  expect(await screen.findByText('Capture')).toBeOnTheScreen();
  expect(screen.getByText('No grand slam')).toBeOnTheScreen();
});
