import { useEffect, useRef, useState, isValidElement } from 'react';
import type { ReactNode } from 'react';
import type { Components } from 'react-markdown';

export interface HeadingItem {
  id: string;
  text: string;
  level: 1 | 2 | 3;
}

/**
 * Converte qualquer texto de título em um slug amigável para URL/ID (ex: "Visão Geral!" -> "visao-geral")
 */
export function slugifyHeading(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase()
    .replace(/[`*_~[\]()]/g, '') // Remove caracteres de formatação markdown
    .replace(/[^a-z0-9\s-]/g, '') // Remove pontuação especial
    .trim()
    .replace(/\s+/g, '-') // Espaços -> hífens
    .replace(/-+/g, '-');
}

/**
 * Remove marcações inline básicas de Markdown para exibir o título limpo na Sidebar
 */
function stripInlineMarkdown(raw: string): string {
  return raw
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // Imagens ![alt](url)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // Links [texto](url)
    .replace(/(`{1,3})(.*?)\1/g, '$2') // Inline code `code`
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // Negrito **bold**
    .replace(/(\*|_)(.*?)\1/g, '$2') // Itálico *italic*
    .replace(/~~(.*?)~~/g, '$1') // Tachado ~~strike~~
    .replace(/\s+#+\s*$/, '') // Hashes finais opcionais
    .trim();
}

/**
 * Extrai todos os headings #, ## e ### do Markdown ignorando blocos de código (``` ou ~~~)
 */
export function extractHeadings(markdown: string): HeadingItem[] {
  if (!markdown) return [];

  const lines = markdown.split(/\r?\n/);
  const headings: HeadingItem[] = [];
  const slugCounts = new Map<string, number>();
  let insideCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Alterna estado ao entrar/sair de blocos de código ``` ou ~~~
    if (/^(```|~~~)/.test(trimmed)) {
      insideCodeBlock = !insideCodeBlock;
      continue;
    }

    if (insideCodeBlock) continue;

    // Captura apenas #, ## e ### no início da linha
    const match = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (!match) continue;

    const level = match[1].length as 1 | 2 | 3;
    const cleanText = stripInlineMarkdown(match[2]);
    if (!cleanText) continue;

    const baseSlug = slugifyHeading(cleanText) || 'topico';
    const count = slugCounts.get(baseSlug) ?? 0;
    slugCounts.set(baseSlug, count + 1);

    const id = count === 0 ? baseSlug : `${baseSlug}-${count}`;

    headings.push({
      id,
      text: cleanText,
      level,
    });
  }

  return headings;
}

/**
 * Hook que detecta se a página possui overflow vertical (é scrollável).
 * Quando o artigo cabe inteiro na tela sem scroll, retorna false para ocultar a sidebar "Neste artigo".
 */
export function useIsPageScrollable(dependency?: string): boolean {
  const [isScrollable, setIsScrollable] = useState(false);

  useEffect(() => {
    const checkScrollable = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      setIsScrollable((prev) => {
        // Histerese leve para evitar oscilação de layout próximo ao limite
        const threshold = prev ? 4 : 24;
        return scrollHeight > viewportHeight + threshold;
      });
    };

    checkScrollable();
    const rafId = window.requestAnimationFrame(checkScrollable);

    window.addEventListener('resize', checkScrollable);

    const resizeObserver = new ResizeObserver(() => {
      checkScrollable();
    });
    resizeObserver.observe(document.body);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', checkScrollable);
      resizeObserver.disconnect();
    };
  }, [dependency]);

  return isScrollable;
}

/**
 * Extrai o texto puro de dentro do children do React para gerar o mesmo slug no ReactMarkdown
 */
function extractTextFromChildren(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractTextFromChildren).join('');
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return extractTextFromChildren(node.props.children);
  }
  return '';
}

/**
 * Cria o mapeamento de componentes (h1, h2, h3) para o <ReactMarkdown>
 * injetando os IDs correspondentes e scroll-margin-top (scroll-mt-24) para compensar a Navbar
 */
export function createHeadingComponents(): Components {
  const slugCounts = new Map<string, number>();

  const resolveId = (children: ReactNode) => {
    const rawText = extractTextFromChildren(children);
    const baseSlug = slugifyHeading(rawText) || 'topico';
    const count = slugCounts.get(baseSlug) ?? 0;
    slugCounts.set(baseSlug, count + 1);
    return count === 0 ? baseSlug : `${baseSlug}-${count}`;
  };

  return {
    h1: ({ children, node: _node, ...props }) => {
      const id = resolveId(children);
      return (
        <h1 id={id} className="scroll-mt-24" {...props}>
          {children}
        </h1>
      );
    },
    h2: ({ children, node: _node, ...props }) => {
      const id = resolveId(children);
      return (
        <h2 id={id} className="scroll-mt-24" {...props}>
          {children}
        </h2>
      );
    },
    h3: ({ children, node: _node, ...props }) => {
      const id = resolveId(children);
      return (
        <h3 id={id} className="scroll-mt-24" {...props}>
          {children}
        </h3>
      );
    },
    img: ({ src, alt, node: _node, ...props }) => {
      if (src && /\.(mp4|webm)$/i.test(src)) {
        return (
          <video
            src={src}
            controls
            className="my-6 w-full rounded-xl border border-secondary"
          />
        );
      }
      return <img src={src} alt={alt || ''} loading="lazy" {...props} />;
    },
  };
}

/**
 * Aplica um efeito visual suave ("smooth light") no título selecionado para destacar onde ele está na página
 */
function triggerHeadingHighlight(target: HTMLElement) {
  document.querySelectorAll('.heading-smooth-light').forEach((el) => {
    el.classList.remove('heading-smooth-light');
  });

  // Força reflow para reiniciar a animação caso o mesmo título seja clicado novamente
  void target.offsetWidth;
  target.classList.add('heading-smooth-light');

  const handleAnimationEnd = () => {
    target.classList.remove('heading-smooth-light');
    target.removeEventListener('animationend', handleAnimationEnd);
  };
  target.addEventListener('animationend', handleAnimationEnd);
}

interface MarkdownOutlineSidebarProps {
  headings: HeadingItem[];
  variant?: 'desktop' | 'mobile';
}

/**
 * Componente de barra lateral à direita (Desktop) e menu retrátil (Mobile) com Scroll Spy e Smooth Light
 */
export function MarkdownOutlineSidebar({
  headings,
  variant = 'desktop',
}: MarkdownOutlineSidebarProps) {
  const [activeId, setActiveId] = useState<string>(headings[0]?.id ?? '');
  const isClickScrollingRef = useRef(false);
  const clickScrollTimeoutRef = useRef<number | null>(null);

  const currentActiveId =
    activeId && headings.some((h) => h.id === activeId) ? activeId : (headings[0]?.id ?? '');

  useEffect(() => {
    if (headings.length === 0) return;

    let rafId: number | null = null;

    const updateActiveHeading = () => {
      if (isClickScrollingRef.current) return;

      const elements = headings
        .map((h) => document.getElementById(h.id))
        .filter((el): el is HTMLElement => el !== null);

      if (elements.length === 0) return;

      // Se chegou ao final da página, destaca o último tópico
      const isAtBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 32;
      if (isAtBottom) {
        setActiveId(elements[elements.length - 1].id);
        return;
      }

      // Encontra o último título que já passou da linha de leitura no topo (140px)
      const readingOffset = 140;
      let currentId = elements[0].id;

      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= readingOffset) {
          currentId = el.id;
        } else {
          break;
        }
      }

      setActiveId(currentId);
    };

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        updateActiveHeading();
        rafId = null;
      });
    };

    updateActiveHeading();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      if (clickScrollTimeoutRef.current !== null) {
        window.clearTimeout(clickScrollTimeoutRef.current);
      }
    };
  }, [headings]);

  if (headings.length === 0) return null;

  const handleSelect = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string,
    index: number
  ) => {
    e.preventDefault();

    let target = document.getElementById(id);
    if (!target) {
      const allHeadings = document.querySelectorAll<HTMLElement>('.prose h1, .prose h2, .prose h3');
      target = allHeadings[index] ?? null;
    }

    if (target) {
      isClickScrollingRef.current = true;
      if (clickScrollTimeoutRef.current !== null) {
        window.clearTimeout(clickScrollTimeoutRef.current);
      }
      clickScrollTimeoutRef.current = window.setTimeout(() => {
        isClickScrollingRef.current = false;
      }, 750);

      setActiveId(id);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      triggerHeadingHighlight(target);
      window.history.replaceState(null, '', `#${id}`);
    }
  };

  const renderList = () => (
    <ul className="space-y-1 border-l-2 border-primary/40 text-sm">
      {headings.map((item, index) => {
        const isActive = currentActiveId === item.id;
        const indentClass =
          item.level === 1
            ? 'pl-3 font-medium'
            : item.level === 2
              ? 'pl-6'
              : 'pl-9 text-xs';

        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => handleSelect(e, item.id, index)}
              className={`-ml-[2px] block rounded-r-md border-l-2 py-1.5 pr-2 transition-all leading-snug ${indentClass} ${
                isActive
                  ? 'border-sky-500 dark:border-sky-400 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold'
                  : 'border-transparent text-secondary hover:border-primary hover:text-primary'
              }`}
            >
              {item.text}
            </a>
          </li>
        );
      })}
    </ul>
  );

  if (variant === 'mobile') {
    return (
      <div className="mb-8 lg:hidden">
        <details className="group rounded-xl border border-secondary bg-secondary/40 px-4 py-3">
          <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold uppercase tracking-wider text-tertiary select-none">
            <span>Neste artigo ({headings.length})</span>
            <span className="transition-transform group-open:rotate-180">▾</span>
          </summary>
          <nav aria-label="Sumário do artigo" className="mt-3 border-t border-secondary pt-2">
            {renderList()}
          </nav>
        </details>
      </div>
    );
  }

  return (
    <aside className="fixed right-5 xl:right-9 top-1/2 -translate-y-1/2 z-30 hidden lg:block">
      <div className="group relative flex items-center justify-end py-3 pl-4">
        {/* Painel flutuante com os títulos (aparece suavemente ao passar o mouse sobre as barras) */}
        <nav
          aria-label="Sumário do artigo"
          className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 w-64 max-h-[70vh] overflow-y-auto rounded-xl border border-secondary bg-primary/95 p-4 opacity-0 translate-x-2 shadow-xl backdrop-blur-md transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:translate-x-0 group-hover:opacity-100"
        >
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-tertiary">
            Neste artigo
          </p>
          {renderList()}
        </nav>

        {/* Vertical Scrollspy Segmented Pagination Bars (sempre visíveis no canto direito) */}
        <div
          role="navigation"
          aria-label="Indicador de progresso por seções"
          className="flex flex-col items-end gap-3 py-2.5 px-1.5 cursor-pointer"
        >
          {headings.map((item, index) => {
            const isActive = currentActiveId === item.id;
            const barWidth = isActive
              ? 'w-8'
              : item.level === 1
                ? 'w-6'
                : item.level === 2
                  ? 'w-5'
                  : 'w-3.5';

            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleSelect(e, item.id, index)}
                aria-label={item.text}
                className="group/bar flex items-center justify-end py-0.5 focus:outline-none"
              >
                <span
                  className={`block rounded-full transition-all duration-300 ${barWidth} ${
                    isActive
                      ? 'h-[3.5px] bg-sky-500 dark:bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.75)]'
                      : 'h-[2.5px] bg-neutral-400 dark:bg-neutral-500 opacity-85 group-hover/bar:bg-sky-400 group-hover/bar:opacity-100'
                  }`}
                />
              </a>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
