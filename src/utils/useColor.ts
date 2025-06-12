import config from 'src/utils/config';
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

import lighten = colors.lighten;
import getPaletteColor = colors.getPaletteColor;

export function useColor(id: number) {
  const color = palette[id] || '#d80032';

  setCssVar('primary', color);

  setCssVar('primary', lighten(getPaletteColor('primary'), config.dark ? 30 : 0));

  LocalStorage.set('theme', id);
}

export function useLocalColor() {
  const color = LocalStorage.getItem('theme') ?? 1;

  useColor(<number>color);
}
