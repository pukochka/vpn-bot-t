import { colors, LocalStorage, setCssVar } from 'quasar';

type ButtonPalette = [string, string, string];

const buttonPalettes: Record<number, ButtonPalette> = {
  1: ['#a9c7ef', '#6f95c9', '#4f74a7'],
  2: ['#8fe6d0', '#58c8aa', '#349e83'],
  3: ['#c2e58f', '#96cc67', '#6faa44'],
  4: ['#f7c27d', '#eea24e', '#d3832d'],
  5: ['#f5b0a3', '#e8897b', '#cd665a'],
};

const palette: Record<number, string> = Object.fromEntries(
  Object.entries(buttonPalettes).map(([id, colors]) => [Number(id), colors[1]]),
) as Record<number, string>;

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

export const MIN_THEME_ID = 1;
export const MAX_THEME_ID = 5;
export const THEME_STORAGE_KEY = 'vpn_color';

function setThemeGradientVars(themeId: number) {
  const root = document.documentElement;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const [card1Base, card2Base, card3Base] = buttonPalettes[themeId] || buttonPalettes[MIN_THEME_ID];

  root.style.setProperty(
    '--vpn-gradient-card-1',
    `linear-gradient(225deg, ${lighten(card1Base, 22)} 14.73%, color-mix(in srgb, ${card1Base} 84%, #334155) 85.27%)`,
  );
  root.style.setProperty(
    '--vpn-gradient-card-2',
    `linear-gradient(225deg, ${lighten(card2Base, 20)} 14.73%, color-mix(in srgb, ${card2Base} 84%, #1f2937) 85.27%)`,
  );
  root.style.setProperty(
    '--vpn-gradient-card-3',
    `linear-gradient(225deg, ${lighten(card3Base, 24)} 14.73%, color-mix(in srgb, ${card3Base} 92%, #0f172a) 85.27%)`,
  );
}

export function normalizeThemeId(value: unknown): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id < MIN_THEME_ID || id > MAX_THEME_ID) {
    return MIN_THEME_ID;
  }

  return id;
}

export function useColor(id: number) {
  const themeId = normalizeThemeId(id);
  const color = palette[themeId];

  setCssVar('primary', color || '');

  setCssVar(
    'primary',
    lighten(getPaletteColor('primary'), window.Telegram.WebApp.colorScheme === 'dark' ? 30 : 0),
  );
  setThemeGradientVars(themeId);

  LocalStorage.set(THEME_STORAGE_KEY, themeId);
}

export function useLocalColor() {
  const color = LocalStorage.getItem(THEME_STORAGE_KEY);

  useColor(normalizeThemeId(color));
}
