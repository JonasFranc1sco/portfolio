import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as Separator from '@radix-ui/react-separator';
import {
  ArrowLeftIcon,
  DotsVerticalIcon,
  Pencil1Icon,
  TrashIcon,
} from '@radix-ui/react-icons';
import { postsApi } from '../api/posts.api';
import { Button } from '../components/ui/Button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '../components/ui/AlertDialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../components/ui/DropdownMenu';
import {
  createHeadingComponents,
  extractHeadings,
  MarkdownOutlineSidebar,
  useIsPageScrollable,
} from '../components/posts/MarkdownOutline';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import type { Post } from '../types/api';

export function PostArticle({
  post,
  showOutline: showOutlineProp,
}: {
  post: Post;
  showOutline?: boolean;
}) {
  const headings = useMemo(() => extractHeadings(post.content || ''), [post.content]);
  const isScrollable = useIsPageScrollable(post.content);
  const hasOutline = showOutlineProp ?? (headings.length > 0 && isScrollable);

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-12">
      <article className="min-w-0">
        <header className="mb-8">
          <h1 className="text-display-sm md:text-display-md font-semibold text-primary mb-4">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-tertiary">
            {post.topic && (
              <Link
                to={`/?topic=${encodeURIComponent(post.topic)}`}
                className="rounded-full border border-secondary bg-secondary px-3 py-0.5 text-xs font-medium text-secondary hover:border-primary hover:text-primary transition-colors"
              >
                #{post.topic}
              </Link>
            )}
            <time dateTime={post.created_at}>
              {new Date(post.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </time>
            <Separator.Root
              orientation="vertical"
              className="h-4 w-px bg-border-secondary"
            />
            <span>{post.reading_time} min de leitura</span>
          </div>
        </header>

        <Separator.Root className="my-8 h-px w-full bg-border-secondary" />

        {hasOutline && <MarkdownOutlineSidebar headings={headings} variant="mobile" />}

        {/* A classe prose md:prose-lg aplica todo o estilo de src/styles/typography.css */}
        <div className="prose md:prose-lg max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={createHeadingComponents()}
          >
            {post.content || ''}
          </ReactMarkdown>
        </div>
      </article>

      {/* Sidebar fixa no canto direito da página em telas grandes (lg+) */}
      {hasOutline && <MarkdownOutlineSidebar headings={headings} variant="desktop" />}
    </div>
  );
}

export function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setIsLoading(true);
    setError(null);

    postsApi
      .getBySlug(slug)
      .then((data) => {
        if (!active) return;
        setPost(data);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Artigo não encontrado.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const handleDelete = async () => {
    if (!slug) return;
    setIsDeleting(true);
    try {
      await postsApi.delete(slug);
      toast({
        title: 'Publicação excluída',
        description: 'O artigo foi removido com sucesso.',
        variant: 'success',
      });
      navigate('/');
    } catch (err) {
      toast({
        title: 'Erro ao excluir',
        description: err instanceof Error ? err.message : 'Não foi possível excluir a publicação.',
        variant: 'error',
      });
      setIsDeleting(false);
    }
  };

  const isScrollable = useIsPageScrollable(post?.content);
  const hasOutline =
    post !== null && extractHeadings(post.content || '').length > 0 && isScrollable;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 space-y-6">
        <div className="h-10 w-3/4 animate-pulse rounded-lg bg-secondary" />
        <div className="h-5 w-48 animate-pulse rounded-lg bg-secondary" />
        <div className="h-64 w-full animate-pulse rounded-xl bg-secondary" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-xl border border-error_subtle bg-error-primary p-6 text-error-primary">
          <p className="font-medium">{error || 'Publicação não encontrada.'}</p>
          <div className="mt-4">
            <Button asChild variant="secondary">
              <Link to="/">
                <ArrowLeftIcon className="h-4 w-4" />
                <span>Voltar para a Home</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 pt-8">
        <Button asChild variant="ghost">
          <Link to="/">
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Voltar aos artigos</span>
          </Link>
        </Button>

        {isAuthenticated && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  aria-label="Opções do artigo"
                  className="px-2.5 py-2"
                >
                  <DotsVerticalIcon className="h-4 w-4 text-primary" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => navigate(`/admin/posts/${post.slug}/edit`)}>
                  <Pencil1Icon className="h-4 w-4" />
                  <span>Editar</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setIsDeleteDialogOpen(true)}
                  className="text-error-primary hover:text-error-primary_hover focus:text-error-primary_hover"
                >
                  <TrashIcon className="h-4 w-4" />
                  <span>Excluir</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogTitle>
                  Tem certeza que deseja excluir esta publicação?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação é permanente e removerá o artigo &ldquo;{post.title}&rdquo; do banco de
                  dados e do disco.
                </AlertDialogDescription>

                <div className="mt-6 flex justify-end gap-3">
                  <AlertDialogCancel asChild>
                    <Button type="button" variant="secondary">
                      Cancelar
                    </Button>
                  </AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Excluindo...' : 'Sim, excluir publicação'}
                    </Button>
                  </AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>

      <PostArticle post={post} showOutline={hasOutline} />
    </div>
  );
}
