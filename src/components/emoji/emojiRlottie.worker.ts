/// <reference lib="webworker" />

import { gunzipSync } from 'fflate';

import type { CancellableCallback } from './internal/PostMessageConnector';
import { createWorkerInterface } from './internal/createWorkerInterface';
import { fetchTgsAsUint8Array } from './emojiCache';
import { getRlottieModule, loadRlottieWasmGlue } from './wasmLoader';

type RlottieModule = ReturnType<typeof getRlottieModule>;

/** Emscripten вешает `allocate` / `intArrayFromString` на `Module`, не на `globalThis` (в TT их видит воркер из-за `importScripts` в глобальном scope). */
type RlottieHeapModule = RlottieModule & {
  allocate: (...args: unknown[]) => number;
  intArrayFromString: (s: string, dontAddNull?: boolean) => number;
};

let moduleRef: RlottieModule | undefined;
let modHeap: RlottieHeapModule | undefined;
let runtimePromise: Promise<void> | undefined;

const rLottieApi: {
  init?: (...args: any[]) => any;
  destroy?: (...args: any[]) => any;
  resize?: (...args: any[]) => any;
  buffer?: (...args: any[]) => any;
  render?: (...args: any[]) => any;
  loadFromData?: (...args: any[]) => any;
} = {};

async function ensureRuntime() {
  if (rLottieApi.init && modHeap && moduleRef) {
    return;
  }

  if (!runtimePromise) {
    runtimePromise = (async () => {
      await loadRlottieWasmGlue();
      moduleRef = getRlottieModule();
      modHeap = moduleRef as RlottieHeapModule;
      if (typeof modHeap.allocate !== 'function' || typeof modHeap.intArrayFromString !== 'function') {
        throw new Error(
          '[emojiRlottie.worker] После загрузки glue на Module нет allocate/intArrayFromString — проверьте rlottie-wasm.js',
        );
      }

      rLottieApi.init = moduleRef.cwrap('lottie_init', '', []);
      rLottieApi.destroy = moduleRef.cwrap('lottie_destroy', '', ['number']);
      rLottieApi.resize = moduleRef.cwrap('lottie_resize', '', ['number', 'number', 'number']);
      rLottieApi.buffer = moduleRef.cwrap('lottie_buffer', 'number', ['number']);
      rLottieApi.render = moduleRef.cwrap('lottie_render', '', ['number', 'number']);
      rLottieApi.loadFromData = moduleRef.cwrap('lottie_load_from_data', 'number', ['number', 'number']);
    })().catch((error) => {
      runtimePromise = undefined;
      throw error;
    });
  }

  await runtimePromise;
}

const HIGH_PRIORITY_MAX_FPS = 60;
const LOW_PRIORITY_MAX_FPS = 30;
const DESTROY_REPEAT_DELAY = 1000;

const renderers = new Map<
  string,
  {
    imgSize: number;
    reduceFactor: number;
    handle: number;
    imageData: ImageData;
    customColor?: [number, number, number];
  }
>();

async function init(
  key: string,
  tgsUrl: string,
  imgSize: number,
  isLowPriority: boolean,
  customColor: [number, number, number] | undefined,
  onInit: CancellableCallback,
) {
  await ensureRuntime();
  const runtimeApi = rLottieApi as Required<typeof rLottieApi>;
  const heap = modHeap!;
  const json = await extractJson(tgsUrl);
  const stringOnWasmHeap = heap.allocate(heap.intArrayFromString(json), 'i8', 0);
  const handle = runtimeApi.init();
  const framesCount = runtimeApi.loadFromData(handle, stringOnWasmHeap);
  runtimeApi.resize(handle, imgSize, imgSize);

  const imageData = new ImageData(imgSize, imgSize);

  const { reduceFactor, msPerFrame, reducedFramesCount } = calcParams(json, isLowPriority, framesCount);

  renderers.set(key, {
    imgSize,
    reduceFactor,
    handle,
    imageData,
    customColor,
  });

  onInit(reduceFactor, msPerFrame, reducedFramesCount);
}

async function changeData(
  key: string,
  tgsUrl: string,
  isLowPriority: boolean,
  onInit: CancellableCallback,
) {
  await ensureRuntime();
  const runtimeApi = rLottieApi as Required<typeof rLottieApi>;
  const heap = modHeap!;
  const json = await extractJson(tgsUrl);
  const stringOnWasmHeap = heap.allocate(heap.intArrayFromString(json), 'i8', 0);
  const { handle } = renderers.get(key)!;
  const framesCount = runtimeApi.loadFromData(handle, stringOnWasmHeap);

  const { reduceFactor, msPerFrame, reducedFramesCount } = calcParams(json, isLowPriority, framesCount);

  onInit(reduceFactor, msPerFrame, reducedFramesCount);
}

async function extractJson(tgsUrl: string): Promise<string> {
  const buf = await fetchTgsAsUint8Array(tgsUrl);

  if (buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b) {
    if (typeof DecompressionStream !== 'undefined') {
      try {
        const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
        return await new Response(stream).text();
      } catch {
        /* fall through */
      }
    }
    return new TextDecoder().decode(gunzipSync(buf));
  }

  return new TextDecoder().decode(buf);
}

function calcParams(json: string, isLowPriority: boolean, framesCount: number) {
  const animationData = JSON.parse(json) as { fr?: number };
  const maxFps = isLowPriority ? LOW_PRIORITY_MAX_FPS : HIGH_PRIORITY_MAX_FPS;
  const sourceFps = animationData.fr || maxFps;
  const reduceFactor = sourceFps % maxFps === 0 ? sourceFps / maxFps : 1;

  return {
    reduceFactor,
    msPerFrame: 1000 / (sourceFps / reduceFactor),
    reducedFramesCount: Math.ceil(framesCount / reduceFactor),
  };
}

async function renderFrames(key: string, frameIndex: number, onProgress: CancellableCallback) {
  await ensureRuntime();
  const runtimeApi = rLottieApi as Required<typeof rLottieApi>;
  const runtimeModule = moduleRef!;
  const { imgSize, reduceFactor, handle, imageData, customColor } = renderers.get(key)!;

  const realIndex = frameIndex * reduceFactor;

  runtimeApi.render(handle, realIndex);
  const bufferPointer = runtimeApi.buffer(handle);
  const data = runtimeModule.HEAPU8.subarray(bufferPointer, bufferPointer + imgSize * imgSize * 4);

  if (customColor) {
    const arr = new Uint8ClampedArray(data);
    applyColor(arr, customColor);
    imageData.data.set(arr);
  } else {
    imageData.data.set(data);
  }

  const imageBitmap = await createImageBitmap(imageData);

  onProgress(frameIndex, imageBitmap);
}

function applyColor(arr: Uint8ClampedArray, color: [number, number, number]) {
  for (let i = 0; i < arr.length; i += 4) {
    arr[i] = color[0];
    arr[i + 1] = color[1];
    arr[i + 2] = color[2];
  }
}

function destroy(key: string, isRepeated = false) {
  try {
    if (!rLottieApi.destroy) {
      return;
    }
    const renderer = renderers.get(key)!;
    rLottieApi.destroy(renderer.handle);
    renderers.delete(key);
  } catch {
    if (!isRepeated) {
      setTimeout(() => destroy(key, true), DESTROY_REPEAT_DELAY);
    }
  }
}

const api = {
  'rlottie:ensureRuntime': ensureRuntime,
  'rlottie:init': init,
  'rlottie:changeData': changeData,
  'rlottie:renderFrames': renderFrames,
  'rlottie:destroy': destroy,
};

createWorkerInterface(api, 'media');

export type RLottieApi = typeof api;
