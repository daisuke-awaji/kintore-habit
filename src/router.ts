import { useEffect, useState } from 'react';

export interface Route {
  path: string;
  params: URLSearchParams;
}

export function parseHash(hash: string): Route {
  const h = hash.replace(/^#/, '');
  const [p, q = ''] = h.split('?');
  return { path: p && p.startsWith('/') ? p : '/', params: new URLSearchParams(q) };
}

type Params = Record<string, string | number | undefined | null>;

export function hrefFor(path: string, params?: Params): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) if (v !== undefined && v !== null) q.set(k, String(v));
  const qs = q.toString();
  return `#${path}${qs ? `?${qs}` : ''}`;
}

export function navigate(path: string, params?: Params, opts: { replace?: boolean } = {}): void {
  const hash = hrefFor(path, params);
  if (opts.replace) {
    history.replaceState(null, '', hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = hash;
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    // 子の画面が先に navigate した場合（イベントを受け取る前）にも合わせる
    const now = parseHash(window.location.hash);
    setRoute((prev) => (prev.path === now.path && prev.params.toString() === now.params.toString() ? prev : now));
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
