/// <reference lib="webworker" />

const WASM_MAGIC = [0x00, 0x61, 0x73, 0x6d] as const;

function originBaseHref(): URL {
  return new URL((import.meta as ImportMeta).env.BASE_URL || '/', `${self.location.origin}/`);
}

/** Абсолютный URL `public/emoji/rlottie-wasm.wasm`. */
export function getRlottieWasmBinaryUrl(): string {
  return new URL('emoji/rlottie-wasm.wasm', originBaseHref()).href;
}

/** Абсолютный URL `public/emoji/rlottie-wasm.js`. */
export function getRlottieWasmJsUrl(): string {
  return new URL('emoji/rlottie-wasm.js', originBaseHref()).href;
}

type EmscriptenModule = {
  calledRun?: boolean;
  onRuntimeInitialized?: () => void;
  cwrap: (...args: any[]) => any;
  HEAPU8: Uint8Array;
};

let gluePromise: Promise<void> | undefined;

function assertWasmMagic(buf: ArrayBuffer): void {
  const u8 = new Uint8Array(buf);
  if (
    u8.length < 4 ||
    u8[0] !== WASM_MAGIC[0] ||
    u8[1] !== WASM_MAGIC[1] ||
    u8[2] !== WASM_MAGIC[2] ||
    u8[3] !== WASM_MAGIC[3]
  ) {
    const head = new TextDecoder('utf-8', { fatal: false }).decode(u8.slice(0, 120));
    throw new Error(
      `[wasmLoader] по URL ожидался WASM (магия \\0asm), получено: ${JSON.stringify(head.slice(0, 80))}. ` +
        'Проверьте, что `public/emoji/rlottie-wasm.wasm` отдаётся как файл, а не index.html (SPA fallback).',
    );
  }
}

/**
 * Загружает rlottie WASM + glue в ES module worker.
 * — `Module.wasmBinary` задаётся явно (без fetch пути из пустого scriptDirectory в blob worker).
 * — `Module.locateFile` подстраховывает остальные ресурсы Emscripten.
 * Glue по-прежнему через косвенный `eval` (нужен CSP с `unsafe-eval` для воркера или classic worker).
 */
export function loadRlottieWasmGlue(): Promise<void> {
  if (!gluePromise) {
    gluePromise = (async () => {
      const wasmBinaryHref = getRlottieWasmBinaryUrl();
      const wasmJsHref = getRlottieWasmJsUrl();

      const wasmRes = await fetch(wasmBinaryHref, { credentials: 'same-origin' });
      if (!wasmRes.ok) {
        throw new Error(`[wasmLoader] WASM ${wasmBinaryHref} → HTTP ${wasmRes.status}`);
      }
      const wasmBuf = await wasmRes.arrayBuffer();
      assertWasmMagic(wasmBuf);

      const jsRes = await fetch(wasmJsHref, { credentials: 'same-origin' });
      if (!jsRes.ok) {
        throw new Error(`[wasmLoader] JS ${wasmJsHref} → HTTP ${jsRes.status}`);
      }
      const code = await jsRes.text();

      const wasmBinary = new Uint8Array(wasmBuf);

      (globalThis as { Module?: Record<string, unknown> }).Module = {
        ...((globalThis as { Module?: Record<string, unknown> }).Module ?? {}),
        wasmBinary,
        locateFile(path: string) {
          if (path.endsWith('.wasm')) {
            return wasmBinaryHref;
          }
          if (path === 'rlottie-wasm.js' || path.endsWith('/rlottie-wasm.js')) {
            return wasmJsHref;
          }
          return new URL(path, originBaseHref()).href;
        },
      };

      (0, eval)(code);

      const M = (globalThis as { Module?: EmscriptenModule }).Module;
      if (!M) {
        throw new Error('[wasmLoader] после eval нет globalThis.Module');
      }

      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('[wasmLoader] таймаут инициализации WASM (60s)')), 60_000);
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          clearTimeout(t);
          resolve();
        };
        if (M.calledRun) {
          finish();
          return;
        }
        const prev = M.onRuntimeInitialized;
        M.onRuntimeInitialized = () => {
          try {
            prev?.();
          } finally {
            finish();
          }
        };
        queueMicrotask(() => {
          if (M.calledRun) {
            finish();
          }
        });
      });
    })().catch((error) => {
      gluePromise = undefined;
      throw error;
    });
  }
  return gluePromise;
}

/** После `await loadRlottieWasmGlue()`. */
export function getRlottieModule(): EmscriptenModule {
  const M = (globalThis as { Module?: EmscriptenModule }).Module;
  if (!M) {
    throw new Error('[wasmLoader] Module недоступен');
  }
  return M;
}
