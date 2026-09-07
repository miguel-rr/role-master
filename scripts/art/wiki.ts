/**
 * Minimal MediaWiki client shared by the art sync jobs: polite (one User-Agent,
 * per-host throttle, retry with backoff on 429/5xx) and generic over the
 * `categorymembers` generator with continuation.
 */

const USER_AGENT =
  'role-master-art-sync/0.1 (private tabletop project; contact: vonkyorke@gmail.com)';

type Throttle = { last: number; minIntervalMs: number };
const throttles = new Map<string, Throttle>();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const waitTurn = async (host: string, minIntervalMs: number) => {
  const t = throttles.get(host) ?? { last: 0, minIntervalMs };
  const now = Date.now();
  const wait = t.last + t.minIntervalMs - now;
  if (wait > 0) await sleep(wait);
  t.last = Date.now();
  throttles.set(host, t);
};

type FetchOptions = { minIntervalMs?: number; retries?: number };

/** GET with throttle + retries. Returns the Response (status 200 guaranteed). */
const politeFetch = async (
  url: string,
  { minIntervalMs = 700, retries = 4 }: FetchOptions = {},
): Promise<Response> => {
  const host = new URL(url).host;
  let attempt = 0;
  for (;;) {
    await waitTurn(host, minIntervalMs);
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: '*/*' },
      redirect: 'follow',
    });
    if (res.ok) return res;
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= retries) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    attempt += 1;
    const retryAfter = Number(res.headers.get('retry-after'));
    const backoff =
      Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : 1500 * 2 ** attempt;
    console.warn(`  retry ${attempt} in ${backoff}ms (${res.status}) ${host}`);
    await sleep(backoff);
  }
};

type WikiImageInfo = {
  url: string;
  width: number;
  height: number;
  mime: string;
  thumburl?: string;
  thumbwidth?: number;
  thumbheight?: number;
  extmetadata?: Record<string, { value: string }>;
};

type WikiPage = {
  pageid: number;
  title: string;
  imageinfo?: WikiImageInfo[];
  categories?: { title: string }[];
};

type WikiQueryResponse = {
  continue?: Record<string, string>;
  query?: {
    pages?: Record<string, WikiPage>;
    categorymembers?: { title: string; type?: string }[];
  };
};

type WikiOptions = {
  /** e.g. https://bg3.wiki/w/api.php */
  apiUrl: string;
  minIntervalMs?: number;
};

/** A category file listing entry, with the "Category:" prefix stripped. */
type WikiFile = {
  pageid: number;
  title: string;
  info: WikiImageInfo;
  categories: string[];
};

const stripPrefix = (title: string, prefix: string) =>
  title.startsWith(prefix) ? title.slice(prefix.length) : title;

const makeWiki = ({ apiUrl, minIntervalMs = 700 }: WikiOptions) => {
  const api = async (
    params: Record<string, string>,
  ): Promise<WikiQueryResponse> => {
    const search = new URLSearchParams({
      action: 'query',
      format: 'json',
      formatversion: '2',
      ...params,
    });
    const res = await politeFetch(`${apiUrl}?${search}`, { minIntervalMs });
    return (await res.json()) as WikiQueryResponse;
  };

  /** Direct subcategories of a category (names without the prefix). */
  const subcategories = async (category: string): Promise<string[]> => {
    const out: string[] = [];
    let cont: Record<string, string> = {};
    do {
      const data = await api({
        list: 'categorymembers',
        cmtitle: `Category:${category}`,
        cmtype: 'subcat',
        cmlimit: '500',
        ...cont,
      });
      for (const m of data.query?.categorymembers ?? []) {
        out.push(stripPrefix(m.title, 'Category:'));
      }
      cont = data.continue ?? {};
    } while (Object.keys(cont).length > 0);
    return out;
  };

  /**
   * Category tree (self + descendants) up to `depth` levels, as a map of
   * category → ancestors path (root first, excluding itself).
   */
  const categoryTree = async (
    root: string,
    depth: number,
  ): Promise<Map<string, string[]>> => {
    const paths = new Map<string, string[]>([[root, []]]);
    let frontier = [root];
    for (let d = 0; d < depth && frontier.length > 0; d += 1) {
      const next: string[] = [];
      for (const cat of frontier) {
        const parentPath = [...(paths.get(cat) ?? []), cat];
        for (const sub of await subcategories(cat)) {
          if (!paths.has(sub)) {
            paths.set(sub, parentPath);
            next.push(sub);
          }
        }
      }
      frontier = next;
    }
    return paths;
  };

  /**
   * Files directly in a category, with image info and (optionally) their own
   * categories. Handles both generator continuation and the `categories` prop
   * continuation by merging pages by id.
   */
  const files = async (
    category: string,
    {
      withCategories = true,
      thumbWidth,
    }: {
      withCategories?: boolean;
      thumbWidth?: number;
    } = {},
  ): Promise<WikiFile[]> => {
    const pages = new Map<number, WikiPage>();
    let cont: Record<string, string> = {};
    do {
      const data = await api({
        generator: 'categorymembers',
        gcmtitle: `Category:${category}`,
        gcmtype: 'file',
        gcmlimit: '500',
        prop: withCategories ? 'imageinfo|categories' : 'imageinfo',
        iiprop: `url|size|mime${thumbWidth ? '|extmetadata' : ''}`,
        ...(thumbWidth ? { iiurlwidth: String(thumbWidth) } : {}),
        ...(withCategories ? { cllimit: 'max' } : {}),
        ...cont,
      });
      for (const page of Object.values(data.query?.pages ?? {})) {
        const prev = pages.get(page.pageid);
        if (!prev) {
          pages.set(page.pageid, {
            ...page,
            categories: page.categories ?? [],
          });
        } else {
          prev.imageinfo ??= page.imageinfo;
          prev.categories = [
            ...(prev.categories ?? []),
            ...(page.categories ?? []),
          ];
        }
      }
      cont = data.continue ?? {};
    } while (Object.keys(cont).length > 0);

    const out: WikiFile[] = [];
    for (const page of pages.values()) {
      const info = page.imageinfo?.[0];
      if (!info) continue;
      out.push({
        pageid: page.pageid,
        title: stripPrefix(page.title, 'File:'),
        info,
        categories: (page.categories ?? []).map((c) =>
          stripPrefix(c.title, 'Category:'),
        ),
      });
    }
    return out;
  };

  return { subcategories, categoryTree, files };
};

type Wiki = ReturnType<typeof makeWiki>;

export { makeWiki, politeFetch, sleep };
export type { Wiki, WikiFile, WikiImageInfo };
