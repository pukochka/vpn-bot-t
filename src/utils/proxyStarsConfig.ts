/**
 * Фон «emoji-звёзд» (`config.json` → `proxyStars`).
 *
 * Поддерживаются оба формата:
 * - плоский: `enabled: true`, `tgsIds: ['search', 'qrPlane']`
 * - подписанный: `enabled: { label: '...', value: true }`
 *
 * В JSON настраиваются:
 * - `enabled` — включить/выключить фон (по умолчанию true)
 * - `tgsIds` — локальные ключи из `PROXY_STARS_TGS_IDS` **или** id custom emoji со storage (строка document id)
 * - `customEmojiStorageBase` — прямой URL каталога (prod и fallback в dev), по умолчанию storage.bot-market.com
 * - `customEmojiDevProxyBase` — в **development** (`import.meta.env.DEV`): относительный путь или полный URL для прокси.
 *   Если ключ **отсутствует** — по умолчанию `/bots_catalog/custom-emoji` (нужен `devServer.proxy` в Quasar).
 *   Если ключ есть и значение `""` / `false` / `null` — в dev грузить **напрямую** с `customEmojiStorageBase`.
 *
 * Плотность, скорости слоёв, quality и т.д. зашиты в коде — менять в этом файле при необходимости.
 */

const DEFAULT_CUSTOM_EMOJI_STORAGE_BASE =
  'https://storage.bot-market.com/bots_catalog/custom-emoji';

/** Относительный путь под Vite `devServer.proxy` → storage. */
const DEFAULT_CUSTOM_EMOJI_DEV_PROXY_BASE = '/bots_catalog/custom-emoji';

const ASSET_TGS_BY_ID: Record<string, string> = {
  earth: new URL('../assets/Earth.tgs', import.meta.url).href,
  code: new URL('../assets/Code.tgs', import.meta.url).href,
};

export const PROXY_STARS_TGS_IDS = Object.freeze(Object.keys(ASSET_TGS_BY_ID));

export type ProxyStarsLayerKey = 'far' | 'mid' | 'near';

export type ProxyStarsLayerResolved = {
  durationSec: number;
  driftVh: number;
  opacity: number;
};

export type ProxyStarsDensityResolved = {
  near: number;
  mid: number;
  far: number;
};

export type ProxyStarsResolved = {
  enabled: boolean;
  sources: string[];
  customEmojiFetchBase: string;
  emojiSpeedMin: number;
  emojiSpeedMax: number;
  reducedEmojiSpeed: number;
  mobileBreakpoint: number;
  resizeDebounceMs: number;
  layers: Record<ProxyStarsLayerKey, ProxyStarsLayerResolved>;
  reducedMotionLayer: ProxyStarsLayerResolved;
  densityDesktop: ProxyStarsDensityResolved;
  densityMobile: ProxyStarsDensityResolved;
  reducedCountDesktop: number;
  reducedCountMobile: number;
  sizeDesktopMin: number;
  sizeDesktopMax: number;
  sizeDesktopMaxLowEnd: number;
  sizeMobileMin: number;
  sizeMobileMax: number;
  sizeMobileMaxLowEnd: number;
  qualityDesktop: number;
  qualityDesktopLowEnd: number;
  qualityMobile: number;
  qualityMobileLowEnd: number;
  qualityReducedDesktop: number;
  qualityReducedMobile: number;
  twinkleDelayMaxSec: number;
  twinkleDurationMinSec: number;
  twinkleDurationMaxSec: number;
  lowEndConcurrencyMax: number;
  lowEndDprMin: number;
};

const DEFAULT_LAYERS: Record<ProxyStarsLayerKey, ProxyStarsLayerResolved> = {
  far: { durationSec: 60, driftVh: 220, opacity: 0.35 },
  mid: { durationSec: 50, driftVh: 240, opacity: 0.5 },
  near: { durationSec: 40, driftVh: 260, opacity: 1 },
};

const DEFAULT_SOURCE_URLS: string[] = [ASSET_TGS_BY_ID.earth!, ASSET_TGS_BY_ID.code!];

const INTERNAL_DEFAULTS: Omit<ProxyStarsResolved, 'enabled' | 'sources' | 'customEmojiFetchBase'> =
  {
    // Минимальная скорость анимации эмодзи (обычный режим).
    emojiSpeedMin: 1,
    // Максимальная скорость анимации эмодзи (обычный режим).
    emojiSpeedMax: 1,
    // Скорость анимации при prefers-reduced-motion (больше = медленнее).
    reducedEmojiSpeed: 1,
    // Порог ширины экрана для переключения на mobile-настройки.
    mobileBreakpoint: 600,
    // Задержка (ms) перед пересчётом после resize.
    resizeDebounceMs: 200,
    layers: {
      // Дальний слой: самый медленный и наименее заметный.
      far: { ...DEFAULT_LAYERS.far },
      // Средний слой: промежуточная скорость и прозрачность.
      mid: { ...DEFAULT_LAYERS.mid },
      // Ближний слой: самый заметный, с более активным движением.
      near: { ...DEFAULT_LAYERS.near },
    },
    // Единый слой для режима reduced-motion.
    reducedMotionLayer: { durationSec: 40, driftVh: 230, opacity: 1 },
    // Количество эмодзи по слоям на десктопе.
    densityDesktop: { near: 14, mid: 13, far: 10 },
    // Количество эмодзи по слоям на мобильных устройствах.
    densityMobile: { near: 10, mid: 8, far: 4 },
    // Общее ограничение количества эмодзи на десктопе в reduced-motion.
    reducedCountDesktop: 50,
    // Общее ограничение количества эмодзи на мобильных в reduced-motion.
    reducedCountMobile: 40,
    // Минимальный размер эмодзи на десктопе (px).
    sizeDesktopMin: 30,
    // Максимальный размер эмодзи на десктопе (px).
    sizeDesktopMax: 50,
    // Максимальный размер эмодзи на слабых десктоп-устройствах (px).
    sizeDesktopMaxLowEnd: 50,
    // Минимальный размер эмодзи на мобильных (px).
    sizeMobileMin: 30,
    // Максимальный размер эмодзи на мобильных (px).
    sizeMobileMax: 50,
    // Максимальный размер эмодзи на слабых мобильных устройствах (px).
    sizeMobileMaxLowEnd: 50,
    // Качество рендера на десктопе.
    qualityDesktop: 0.75,
    // Качество рендера на слабых десктоп-устройствах.
    qualityDesktopLowEnd: 0.65,
    // Качество рендера на мобильных.
    qualityMobile: 0.55,
    // Качество рендера на слабых мобильных устройствах.
    qualityMobileLowEnd: 0.5,
    // Качество рендера в reduced-motion на десктопе.
    qualityReducedDesktop: 0.65,
    // Качество рендера в reduced-motion на мобильных.
    qualityReducedMobile: 0.5,
    // Максимальная случайная задержка до старта twinkle (сек).
    twinkleDelayMaxSec: 1,
    // Минимальная длительность twinkle-анимации (сек).
    twinkleDurationMinSec: 2.8,
    // Максимальная длительность twinkle-анимации (сек).
    twinkleDurationMaxSec: 5.2,
    // Максимум одновременно активных анимаций на low-end.
    lowEndConcurrencyMax: 4,
    // Порог DPR, выше которого устройство считается low-end для эффекта.
    lowEndDprMin: 2.5,
  };

function unwrapLabeledValue(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return raw;
  }

  const candidate = raw as Record<string, unknown>;

  return 'value' in candidate ? candidate.value : raw;
}

function normalizeEmojiBaseUrl(s: string): string {
  return s.replace(/\/+$/, '');
}

/**
 * Абсолютный базовый URL для fetch (в т.ч. из worker): относительный путь → origin текущей страницы.
 */
function absolutizeFetchBase(pathOrUrl: string): string {
  const trimmed = pathOrUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return normalizeEmojiBaseUrl(trimmed);
  }
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return normalizeEmojiBaseUrl(`${window.location.origin}${path}`);
  }
  return normalizeEmojiBaseUrl(path);
}

function resolveCustomEmojiFetchBase(raw: Record<string, unknown>): string {
  const storageRaw = raw.customEmojiStorageBase;
  const storage =
    typeof storageRaw === 'string' && storageRaw.trim()
      ? normalizeEmojiBaseUrl(storageRaw.trim())
      : DEFAULT_CUSTOM_EMOJI_STORAGE_BASE;

  if (!import.meta.env.DEV) {
    return storage;
  }

  const devKey = 'customEmojiDevProxyBase';
  if (devKey in raw) {
    const v = raw[devKey];
    if (v === false || v === null || v === '') {
      return storage;
    }
    if (typeof v === 'string' && v.trim()) {
      return absolutizeFetchBase(v);
    }
    return storage;
  }

  return absolutizeFetchBase(DEFAULT_CUSTOM_EMOJI_DEV_PROXY_BASE);
}

function customEmojiUrlForId(documentId: string, fetchBase: string): string {
  const id = documentId.trim();
  if (!id) {
    return '';
  }
  return `${normalizeEmojiBaseUrl(fetchBase)}/${encodeURIComponent(id)}`;
}

function resolveSources(idsRaw: unknown, customEmojiFetchBase: string): string[] {
  const ids = unwrapLabeledValue(idsRaw);

  if (!Array.isArray(ids) || ids.length === 0) {
    return [...DEFAULT_SOURCE_URLS];
  }
  const out: string[] = [];
  for (const id of ids) {
    if (typeof id !== 'string') {
      continue;
    }
    const trimmed = id.trim();
    if (!trimmed) {
      continue;
    }
    const local = ASSET_TGS_BY_ID[trimmed];
    if (local) {
      out.push(local);
      continue;
    }
    const apiUrl = customEmojiUrlForId(trimmed, customEmojiFetchBase);
    if (apiUrl) {
      out.push(apiUrl);
    }
  }
  return out.length > 0 ? out : [...DEFAULT_SOURCE_URLS];
}

export function resolveProxyStarsConfig(raw: unknown): ProxyStarsResolved {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const enabledRaw = unwrapLabeledValue(o.enabled);
  const enabled = typeof enabledRaw === 'boolean' ? enabledRaw : true;
  const customEmojiFetchBase = resolveCustomEmojiFetchBase(o);
  const sources = resolveSources(o.tgsIds, customEmojiFetchBase);

  return {
    ...INTERNAL_DEFAULTS,
    layers: {
      far: { ...INTERNAL_DEFAULTS.layers.far },
      mid: { ...INTERNAL_DEFAULTS.layers.mid },
      near: { ...INTERNAL_DEFAULTS.layers.near },
    },
    reducedMotionLayer: { ...INTERNAL_DEFAULTS.reducedMotionLayer },
    densityDesktop: { ...INTERNAL_DEFAULTS.densityDesktop },
    densityMobile: { ...INTERNAL_DEFAULTS.densityMobile },
    enabled,
    customEmojiFetchBase,
    sources,
  };
}
