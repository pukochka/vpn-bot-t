import { colors, LocalStorage, setCssVar } from 'quasar';

const palette: Record<number, string> = {
  1: '#577590',
  2: '#43aa8b',
  3: '#90be6d',
  4: '#f8961e',
  5: '#ef745c',
  6: '#588157',
  7: '#d80032',
};

export const textGradients = {
  'purple-bliss': 'white',
  'green-fields': 'white',
  flamingo: 'grey-9',
  'blue-lagoon': 'white',
  brand: 'white',
  green: 'white',
  mars: 'white',
  pink: 'primary',
  brush: 'white',
};

export const gradients = Object.keys(textGradients);

export function alphabetColor(name: string) {
  const symbol = name.replace(/bot/gi, '').replace(/[.*+?^${}()|[\]\\]/g, '');

  return (
    gradients[symbol.charCodeAt(symbol.length / 2) % gradients.length] ||
    gradients[gradients.length - 1]
  );
}

import lighten = colors.lighten;
import getPaletteColor = colors.getPaletteColor;

export function useColor(id: number) {
  const color = palette[id] || '#d80032';

  setCssVar('primary', color);

  setCssVar(
    'primary',
    lighten(getPaletteColor('primary'), window.Telegram.WebApp.colorScheme === 'dark' ? 30 : 0),
  );

  LocalStorage.set('theme', id);
}

export function useLocalColor() {
  const color = LocalStorage.getItem('theme') ?? 1;

  useColor(<number>color);
}
