'use client';

import { type MouseEvent, useEffect, useRef, useState } from 'react';
import { siteConfig } from '@/app/_config/siteConfig';
import type { TocItem } from '../_lib/toc';
import s from '../blog.module.css';

type Props = { items: TocItem[] };

const OBSERVER_ROOT_MARGIN = '0px 0px -75% 0px';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const SCROLL_ACTIVE_LOCK_MS = 800;

const getScrollBehavior = (): ScrollBehavior =>
  window.matchMedia(REDUCED_MOTION_QUERY).matches ? 'auto' : 'smooth';

const ArticleSidebar = ({ items }: Props) => {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '');
  const activeLockTimeoutRef = useRef<number | null>(null);
  const clickedActiveIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (items.length === 0) return;
    const elements = items.map((item) => document.getElementById(item.id)).filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
      if (clickedActiveIdRef.current) return;
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top);
      if (visible.length > 0) setActiveId(visible[0].target.id);
    }, { rootMargin: OBSERVER_ROOT_MARGIN });
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  useEffect(() => () => { if (activeLockTimeoutRef.current) window.clearTimeout(activeLockTimeoutRef.current); }, []);

  if (items.length === 0) return null;

  const handleTocClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    clickedActiveIdRef.current = id;
    setActiveId(id);
    if (activeLockTimeoutRef.current) window.clearTimeout(activeLockTimeoutRef.current);
    activeLockTimeoutRef.current = window.setTimeout(() => {
      clickedActiveIdRef.current = null;
      activeLockTimeoutRef.current = null;
    }, SCROLL_ACTIVE_LOCK_MS);
    target.scrollIntoView({ behavior: getScrollBehavior(), block: 'start' });
    window.history.pushState(null, '', `#${id}`);
  };

  return (
    <nav aria-label={siteConfig.blog.tableOfContentsLabel} className={s.toc}>
      <p className={s.tocLabel}>{siteConfig.blog.tableOfContentsLabel}</p>
      <ul className={s.tocList}>
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => handleTocClick(e, item.id)}
                className={[s.tocItem, isActive ? s.tocItemActive : '', item.level === 3 ? s.tocItemL3 : ''].filter(Boolean).join(' ')}
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
