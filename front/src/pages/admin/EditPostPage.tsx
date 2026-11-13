import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { postsApi } from '../../api/posts.api';
import { PostEditorForm } from '../../components/posts/PostEditorForm';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import type { Post, PostInput } from '../../types/api';

export function EditPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        setError(
          err instanceof Error ? err.message : 'Não foi possível carregar o artigo para edição.'
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const handleUpdate = async (input: PostInput) => {
    if (!slug) return;
    setIsSubmitting(true);
    try {
      const updated = await postsApi.update(slug, input);
      toast({
        title: 'Artigo atualizado!',
        description: `"${updated.title}" foi salvo com sucesso.`,
        variant: 'success',
      });
      navigate(`/posts/${updated.slug}`);
    } catch (err) {
      toast({
        title: 'Erro ao atualizar artigo',
        description:
          err instanceof Error ? err.message : 'Não foi possível atualizar a publicação.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-secondary" />
        <div className="h-96 w-full animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
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
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Button asChild variant="ghost" className="mb-2 -ml-3">
            <Link to={`/posts/${post.slug}`}>
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Voltar ao artigo</span>
            </Link>
          </Button>
          <h1 className="text-display-xs sm:text-display-sm font-semibold text-primary">
            Editar Publicação
          </h1>
          <p className="mt-1 text-sm text-tertiary">
            Atualize o título, resumo ou corpo em Markdown do artigo.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-secondary bg-primary p-6 sm:p-8 shadow-xs">
        <PostEditorForm
          key={post.slug}
          initialData={{
            title: post.title,
            topic: post.topic || 'geral',
            summary: post.summary,
            body: post.content || '',
          }}
          onSubmit={handleUpdate}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
