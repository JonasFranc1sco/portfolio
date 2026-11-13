import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { postsApi } from '../../api/posts.api';
import { PostEditorForm } from '../../components/posts/PostEditorForm';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import type { PostInput } from '../../types/api';

export function NewPostPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (input: PostInput) => {
    setIsSubmitting(true);
    try {
      const created = await postsApi.create(input);
      toast({
        title: 'Artigo publicado!',
        description: `"${created.title}" foi criado com sucesso.`,
        variant: 'success',
      });
      navigate(`/posts/${created.slug}`);
    } catch (err) {
      toast({
        title: 'Erro ao publicar artigo',
        description:
          err instanceof Error ? err.message : 'Não foi possível salvar a publicação.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Button asChild variant="ghost" className="mb-2 -ml-3">
            <Link to="/">
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Voltar para a Home</span>
            </Link>
          </Button>
          <h1 className="text-display-xs sm:text-display-sm font-semibold text-primary">
            Nova Publicação
          </h1>
          <p className="mt-1 text-sm text-tertiary">
            Escreva seu artigo em Markdown e visualize a formatação em tempo real antes de publicar.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-secondary bg-primary p-6 sm:p-8 shadow-xs">
        <PostEditorForm onSubmit={handleCreate} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
