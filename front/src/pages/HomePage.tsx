import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import * as Separator from '@radix-ui/react-separator';
import {
  GitHubLogoIcon,
  LinkedInLogoIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from '@radix-ui/react-icons';
import { postsApi } from '../api/posts.api';
import { PostCard } from '../components/posts/PostCard';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import type { Post } from '../types/api';

const PAGE_LIMIT = 10;

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = Number(searchParams.get('page')) || 1;
  const currentPage = pageParam > 0 ? pageParam : 1;
  const currentTopic = searchParams.get('topic') || '';

  const [posts, setPosts] = useState<Post[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    let active = true;
    postsApi
      .listTopics()
      .then((res) => {
        if (!active) return;
        setTopics(res.topics || []);
      })
      .catch(() => {
        // Ignora erro caso ainda não existam tópicos
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    postsApi
      .list(currentPage, PAGE_LIMIT, currentTopic)
      .then((res) => {
        if (!active) return;
        setPosts(res.data || []);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Erro ao carregar publicações.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentPage, currentTopic]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1) return;
    const nextParams: Record<string, string> = { page: String(newPage) };
    if (currentTopic) nextParams.topic = currentTopic;
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTopicChange = (topic: string) => {
    if (!topic) {
      setSearchParams({});
    } else {
      setSearchParams({ topic });
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {/* Seção Hero (Portfólio) */}
      <section className="py-8 md:py-12">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-secondary bg-secondary px-3 py-1 text-xs font-medium text-secondary">
            <span>Go</span>
            <Separator.Root orientation="vertical" className="h-3 w-px bg-border-primary" />
            <span>React</span>
            <Separator.Root orientation="vertical" className="h-3 w-px bg-border-primary" />
            <span>Arquitetura de Software</span>
          </div>

          <h1 className="text-display-sm sm:text-display-md font-semibold tracking-tight text-primary">
            Olá, sou Jonas Francisco.
          </h1>

          <p className="text-lg text-tertiary leading-relaxed">
            Desenvolvedor focado em sistemas distribuídos, backend em{' '}
            <strong className="font-semibold text-primary">Go</strong>, interfaces modernas com{' '}
            <strong className="font-semibold text-primary">React</strong> e boas práticas de{' '}
            <strong className="font-semibold text-primary">Arquitetura de Software</strong>. Neste
            espaço compartilho artigos técnicos, estudos de caso e aprendizados de engenharia.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button asChild variant="primary">
              <a href="https://github.com" target="_blank" rel="noreferrer">
                <GitHubLogoIcon className="h-4 w-4" />
                <span>GitHub</span>
              </a>
            </Button>
            <Button asChild variant="secondary">
              <a href="https://linkedin.com" target="_blank" rel="noreferrer">
                <LinkedInLogoIcon className="h-4 w-4" />
                <span>LinkedIn</span>
              </a>
            </Button>
            {isAuthenticated && (
              <Button asChild variant="ghost">
                <Link to="/admin/posts/new">
                  <PlusIcon className="h-4 w-4" />
                  <span>Escrever Publicação</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <Separator.Root className="my-8 h-px w-full bg-border-secondary" />

      {/* Lista Paginada de Publicações com Abas de Temas */}
      <section className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-display-xs font-semibold text-primary">Publicações Recentes</h2>
            <p className="text-sm text-tertiary mt-1">
              Artigos técnicos divididos por tema sobre desenvolvimento e engenharia de software.
            </p>
          </div>
        </div>

        {/* Barra de Abas por Tema */}
        {topics.length > 0 && (
          <div
            role="tablist"
            aria-label="Filtrar publicações por tema"
            className="flex items-center gap-2 overflow-x-auto border-b border-secondary pb-3 scrollbar-hide"
          >
            <button
              type="button"
              role="tab"
              aria-selected={currentTopic === ''}
              onClick={() => handleTopicChange('')}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer shrink-0 ${
                currentTopic === ''
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-tertiary hover:bg-secondary hover:text-primary'
              }`}
            >
              Todos
            </button>
            {topics.map((topic) => {
              const isSelected = currentTopic === topic;
              return (
                <button
                  key={topic}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => handleTopicChange(topic)}
                  className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-tertiary hover:bg-secondary hover:text-primary'
                  }`}
                >
                  #{topic}
                </button>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {[1, 2, 3, 4].map((skeleton) => (
              <div
                key={skeleton}
                className="h-48 animate-pulse rounded-xl border border-secondary bg-secondary/50 p-6"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-error_subtle bg-error-primary p-6 text-sm text-error-primary">
            {error}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-xl border border-secondary bg-secondary/30 p-12 text-center">
            <p className="text-md font-medium text-primary">
              {currentTopic
                ? `Nenhuma publicação encontrada na aba #${currentTopic}.`
                : 'Nenhuma publicação encontrada.'}
            </p>
            <p className="mt-1 text-sm text-tertiary">
              {currentPage > 1
                ? 'Não há artigos nesta página.'
                : currentTopic
                  ? 'Selecione outra aba ou volte para "Todos".'
                  : 'Os primeiros artigos serão publicados em breve.'}
            </p>
            {(currentPage > 1 || currentTopic) && (
              <div className="mt-4 flex justify-center gap-3">
                {currentTopic && (
                  <Button variant="secondary" onClick={() => handleTopicChange('')}>
                    Ver todos os temas
                  </Button>
                )}
                {currentPage > 1 && (
                  <Button variant="secondary" onClick={() => handlePageChange(currentPage - 1)}>
                    Voltar para a página anterior
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* Controles de Paginação */}
        {!isLoading && !error && (posts.length > 0 || currentPage > 1) && (
          <div className="flex items-center justify-between border-t border-secondary pt-6">
            <Button
              type="button"
              variant="secondary"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <span>Página Anterior</span>
            </Button>

            <span className="text-sm font-medium text-tertiary">Página {currentPage}</span>

            <Button
              type="button"
              variant="secondary"
              disabled={posts.length < PAGE_LIMIT}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <span>Próxima Página</span>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
