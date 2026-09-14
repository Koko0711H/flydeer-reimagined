export const STORY_PRODUCT_IDS = [
  'open-frame-small',
  'silent',
  'container',
] as const;
export type StoryProductId = (typeof STORY_PRODUCT_IDS)[number];

export function isStoryProduct(value: unknown): value is StoryProductId {
  return STORY_PRODUCT_IDS.some((id) => id === value);
}

export function storyAssetBase(product: StoryProductId) {
  return product === 'open-frame-small'
    ? '/media/story'
    : `/media/story/${product}`;
}

export function storyProductFromLocation(
  pathname: string,
  search: string,
): StoryProductId | null {
  const params = new URLSearchParams(search);
  const path = pathname.replace(/\/$/, '') || '/';
  const candidates =
    path === '/showroom'
      ? [params.get('model'), params.get('product')]
      : [path.match(/^\/products\/([^/]+)$/)?.[1], params.get('product')];
  for (const candidate of candidates) {
    const id = candidate === 'open-frame' ? 'open-frame-small' : candidate;
    if (isStoryProduct(id)) return id;
  }
  return null;
}

// One request owns the stage. Switching cancels the previous package; a late
// response must never put the previous product back on screen.
export function createStorySequenceLoader({
  onStart,
  onManifest,
  onError,
}: {
  onStart: (product: StoryProductId) => void;
  onManifest: (manifest: unknown, product: StoryProductId) => void;
  onError: () => void;
}) {
  let controller: AbortController | null = null;
  let product: StoryProductId | null = null;
  let revision = 0;
  let disposed = false;
  const select = (next: StoryProductId, force = false) => {
    if (disposed || (next === product && !force)) return;
    product = next;
    const request = ++revision;
    controller?.abort();
    controller = new AbortController();
    onStart(next);
    void fetch(`${storyAssetBase(next)}/manifest.json`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error('Sequence unavailable');
        return response.json();
      })
      .then((manifest: unknown) => {
        if (!disposed && request === revision) onManifest(manifest, next);
      })
      .catch(() => {
        if (!disposed && request === revision) onError();
      });
  };
  return {
    select,
    retry() {
      if (product) select(product, true);
    },
    dispose() {
      disposed = true;
      revision++;
      controller?.abort();
    },
  };
}
