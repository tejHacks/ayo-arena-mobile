import { defineBrand } from './lib/brand-type';

export const brand = defineBrand({
  name: 'Ayo Arena',
  colors: { primary: '#F5B82E', primaryText: '#1A0F0A', accent: '#7DD3C0' },
  screens: [
    { name: 'index', title: 'Ayo Arena', hideHeader: true },
    { name: 'game', title: 'Game', hideHeader: true },
    { name: 'how-to-play', title: 'How to play', modal: true },
  ],
});
