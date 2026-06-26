'use client';

import { type MouseEvent, useEffect, useRef, useState } from 'react';

import { siteConfig } from '@/app/_config/siteConfig';

import type { TocItem } from '../_lib/toc';

type Props = {
  items: TocItem[];
};

const OBSERVER_ROOT_MARGIN = '0px 0px -75% 0px';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const SCROLL_ACTIVE_LOCK_MS = 800;
const TABLE_OF_CONTENTS_LIST_CLASS =
  'mt-4 max-h-[calc(100vh-10rem)] space-y-1 overflow-y-auto overscroll-contain pr-2 [scrollbar-gutter:stable]';

const getScrollBehavior = (): ScrollBehavior =>
  window.matchMedia(REDUCED_MOTION_QUERY).matches ? 'auto' : 'smooth';

const ArticleSidebar = ({ items }: Props) => {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '');
  const activeLockTimeoutRef = useRef<number | null>(null);
  const clickedActiveIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (items.length === 0) return;

    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (clickedActiveIdRef.current) return;

        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: OBSERVER_ROOT_MARGIN },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [items]);

  useEffect(
    () => () => {
      if (activeLockTimeoutRef.current) {
        window.clearTimeout(activeLockTimeoutRef.current);
      }
    },
    [],
  );

  if (items.length === 0) return null;

  const handleTocClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target) return;

    event.preventDefault();
    clickedActiveIdRef.current = id;
    setActiveId(id);
    if (activeLockTimeoutRef.current) {
      window.clearTimeout(activeLockTimeoutRef.current);
    }
    activeLockTimeoutRef.current = window.setTimeout(() => {
      clickedActiveIdRef.current = null;
      activeLockTimeoutRef.current = null;
    }, SCROLL_ACTIVE_LOCK_MS);
    target.scrollIntoView({ behavior: getScrollBehavior(), block: 'start' });
    window.history.pushState(null, '', `#${id}`);
  };

  return (
    <nav aria-label={siteConfig.blog.tableOfContentsLabel} className="sticky top-24 self-start">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[rgb(var(--default-accent))]">
        {siteConfig.blog.tableOfContentsLabel}
      </p>
      <ul className={TABLE_OF_CONTENTS_LIST_CLASS}>
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(event) => handleTocClick(event, item.id)}
                className={`block py-1.5 text-sm leading-snug transition ${item.level === 3 ? 'pl-4' : ''} ${
                  isActive ? 'text-slate-950' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default ArticleSidebar;
