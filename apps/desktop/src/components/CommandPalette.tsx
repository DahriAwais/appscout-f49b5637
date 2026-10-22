import { useEffect, useRef, useState } from 'react';
import { Search, ArrowRight, LoaderCircle } from 'lucide-react';
import type { ScoutApp } from '@appscout/core';
import type { Page } from '../../electron/contracts';
import { desktop } from '../api';
import { message } from '../hooks';
import { AppIcon } from './Browse';
const pages: Page[] = ['discover', 'explore', 'watchlist', 'compare', 'settings'];
interface Props {
  close: () => void;
  open: (app: ScoutApp) => void;
  navigate: (page: Page) => void;
  search: (query: string, developer: boolean, keyword?: boolean) => void;
}
export function CommandPalette({ close, open, navigate, search }: Props) {
  const [query, setQuery] = useState(''),
    [mode, setMode] = useState<'apps' | 'developers' | 'keywords'>('apps'),
    [apps, setApps] = useState<ScoutApp[]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(''),
    [index, setIndex] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const eligible = query.trim().length >= 2 && mode === 'apps';
  const requestKey = JSON.stringify([query, mode]);
  const [previousRequest, setPreviousRequest] = useState(requestKey);
  if (previousRequest !== requestKey) {
    setPreviousRequest(requestKey);
    setLoading(eligible);
    if (eligible) setError('');
    else setApps([]);
  }
  useEffect(() => {
    const previous = document.activeElement;
    input.current?.focus();
    return () => {
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  useEffect(() => {
    let alive = true;
    if (!eligible) return undefined;
    const timer = setTimeout(() => {
      desktop
        .search(query.trim())
        .then((result) => {
          if (alive) {
            setApps(result.value.slice(0, 8));
            setLoading(false);
            setIndex(0);
          }
        })
        .catch((e) => {
          if (alive) {
            setError(message(e));
            setLoading(false);
          }
        });
    }, 350);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query, eligible]);
  const filtered = pages.filter((p) => p.includes(query.toLowerCase()));
  function choose(i: number) {
    if (i < apps.length) {
      open(apps[i]);
      close();
    } else if (filtered[i - apps.length]) {
      navigate(filtered[i - apps.length]);
      close();
    }
  }
  return (
    <div className="modal-layer palette-layer">
      <button className="scrim" aria-label="Close command palette" onClick={close} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="command-palette"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            close();
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setIndex((v) => Math.max(0, Math.min(v + 1, apps.length + filtered.length - 1)));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setIndex((v) => Math.max(0, v - 1));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            if (query && mode !== 'apps') {
              search(query, mode === 'developers', mode === 'keywords');
              close();
            } else choose(index);
          } else if (e.key === 'Tab') {
            const nodes = panel.current?.querySelectorAll<HTMLElement>('button,input');
            if (!nodes?.length) return;
            const first = nodes[0],
              last = nodes[nodes.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }}
      >
        <div className="palette-input">
          <Search size={22} />
          <input
            ref={input}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            placeholder={
              mode === 'developers'
                ? 'Developer name or ID…'
                : mode === 'keywords'
                  ? 'Search listing keywords…'
                  : 'Search apps or jump to a page…'
            }
          />
          <kbd>Esc</kbd>
        </div>
        <div className="palette-modes">
          {(['apps', 'developers', 'keywords'] as const).map((m) => (
            <button key={m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>
              {m}
            </button>
          ))}
        </div>
        <div className="palette-results">
          {loading && (
            <p className="muted">
              <LoaderCircle className="spin" size={16} />
              Searching Google Play…
            </p>
          )}
          {error && (
            <div className="error" role="alert">
              {error}
              <button
                onClick={() => {
                  search(query, false);
                  close();
                }}
              >
                Retry in Explore
              </button>
            </div>
          )}
          {apps.map((app, i) => (
            <button
              key={app.id}
              className={index === i ? 'selected' : ''}
              onClick={() => {
                open(app);
                close();
              }}
            >
              <AppIcon app={app} size={32} />
              <span>
                {app.name}
                <small>{app.developer}</small>
              </span>
              <ArrowRight size={16} />
            </button>
          ))}
          {mode !== 'apps' && query && (
            <button
              onClick={() => {
                search(query, mode === 'developers', mode === 'keywords');
                close();
              }}
            >
              Search {mode} for “{query}”<ArrowRight size={16} />
            </button>
          )}
          {filtered.map((page, i) => (
            <button
              key={page}
              className={index === apps.length + i ? 'selected' : ''}
              onClick={() => {
                navigate(page);
                close();
              }}
            >
              <span className="capitalize">{page}</span>
              <ArrowRight size={16} />
            </button>
          ))}
          {!loading &&
            !error &&
            query.length >= 2 &&
            !apps.length &&
            !filtered.length &&
            mode === 'apps' && (
              <p className="muted">
                No apps found.
                <button className="text-button" onClick={() => setQuery('')}>
                  Clear search
                </button>
              </p>
            )}
        </div>
        <footer>Arrow keys to move · Enter to open</footer>
      </div>
    </div>
  );
}
