import { useEffect, useMemo, useRef, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Label from '@radix-ui/react-label';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ImageIcon, UploadIcon } from '@radix-ui/react-icons';
import { postsApi } from '../../api/posts.api';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import {
  createHeadingComponents,
  extractHeadings,
  MarkdownOutlineSidebar,
  useIsPageScrollable,
} from './MarkdownOutline';
import type { PostInput } from '../../types/api';

interface PostEditorFormProps {
  initialData?: PostInput;
  onSubmit: (data: PostInput) => Promise<void>;
  isSubmitting?: boolean;
}

const DEFAULT_TOPIC_SUGGESTIONS = ['goporexemplo', 'golang', 'arquitetura', 'react', 'geral'];

export function PostEditorForm({ initialData, onSubmit, isSubmitting }: PostEditorFormProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [topic, setTopic] = useState(initialData?.topic ?? 'geral');
  const [summary, setSummary] = useState(initialData?.summary ?? '');
  const [body, setBody] = useState(initialData?.body ?? '');
  const [existingTopics, setExistingTopics] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const previewHeadings = useMemo(() => extractHeadings(body), [body]);
  const isScrollable = useIsPageScrollable(body);
  const showPreviewOutline = previewHeadings.length > 0 && isScrollable;

  useEffect(() => {
    let active = true;
    postsApi
      .listTopics()
      .then((res) => {
        if (!active) return;
        setExistingTopics(res.topics || []);
      })
      .catch(() => {
        // Ignora erro caso ainda não existam tópicos
      });
    return () => {
      active = false;
    };
  }, []);

  const topicSuggestions = useMemo(() => {
    const merged = new Set<string>([...existingTopics, ...DEFAULT_TOPIC_SUGGESTIONS]);
    return Array.from(merged);
  }, [existingTopics]);

  const insertAtCursor = (textToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setBody((prev) => `${prev}\n${textToInsert}\n`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    setBody((prev) => prev.slice(0, start) + textToInsert + prev.slice(end));

    window.requestAnimationFrame(() => {
      textarea.focus();
      const nextPos = start + textToInsert.length;
      textarea.setSelectionRange(nextPos, nextPos);
    });
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const res = await postsApi.uploadMedia(file);
      const cleanAlt = file.name.replace(/\.[^/.]+$/, '') || 'midia';
      const markdownTag = `\n![${cleanAlt}](${res.url})\n`;
      insertAtCursor(markdownTag);
      toast({
        title: 'Mídia anexada com sucesso!',
        description: 'A referência foi inserida no seu Markdown.',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Erro ao anexar mídia',
        description: err instanceof Error ? err.message : 'Não foi possível enviar o arquivo.',
        variant: 'error',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.kind === 'file' && (item.type.startsWith('image/') || item.type.startsWith('video/'))) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          await handleFileUpload(file);
          break;
        }
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      e.preventDefault();
      await handleFileUpload(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ title, topic, summary, body });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-[1fr_260px]">
        <div className="space-y-2">
          <Label.Root htmlFor="title" className="text-sm font-medium text-primary">
            Título da Publicação *
          </Label.Root>
          <input
            id="title"
            type="text"
            required
            minLength={3}
            maxLength={180}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Arquitetura em Camadas com Go e Gin"
            className="w-full rounded-lg border border-primary bg-primary px-3.5 py-2.5 text-primary focus:outline-2 focus:outline-brand"
          />
        </div>

        <div className="space-y-2">
          <Label.Root htmlFor="topic" className="text-sm font-medium text-primary">
            Tema / Aba *
          </Label.Root>
          <input
            id="topic"
            type="text"
            required
            maxLength={80}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex: goporexemplo"
            className="w-full rounded-lg border border-primary bg-primary px-3.5 py-2.5 text-primary focus:outline-2 focus:outline-brand"
          />
        </div>
      </div>

      {/* Sugestões rápidas de tema */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-tertiary">Temas rápidos:</span>
        {topicSuggestions.map((item) => {
          const isSelected = topic.trim().toLowerCase() === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setTopic(item)}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors cursor-pointer ${
                isSelected
                  ? 'border-sky-500 bg-sky-500/15 text-sky-600 dark:text-sky-400'
                  : 'border-secondary bg-secondary text-tertiary hover:border-primary hover:text-primary'
              }`}
            >
              #{item}
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <Label.Root htmlFor="summary" className="text-sm font-medium text-primary">
          Resumo (Opcional — gerado automaticamente pelo Go se deixado em branco)
        </Label.Root>
        <input
          id="summary"
          type="text"
          maxLength={300}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Breve descrição para o card na página inicial..."
          className="w-full rounded-lg border border-primary bg-primary px-3.5 py-2 text-sm text-primary focus:outline-2 focus:outline-brand"
        />
      </div>

      {/* Abas Radix UI: Escrever vs. Visualizar */}
      <Tabs.Root defaultValue="write" className="flex flex-col">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-secondary">
          <Tabs.List aria-label="Modo do editor" className="flex gap-4">
            <Tabs.Trigger
              value="write"
              className="pb-2.5 text-sm font-medium text-tertiary data-[state=active]:border-b-2 data-[state=active]:border-brand data-[state=active]:text-primary cursor-pointer"
            >
              Escrever (.md)
            </Tabs.Trigger>
            <Tabs.Trigger
              value="preview"
              className="pb-2.5 text-sm font-medium text-tertiary data-[state=active]:border-b-2 data-[state=active]:border-brand data-[state=active]:text-primary cursor-pointer"
            >
              Visualizar Artigo
            </Tabs.Trigger>
          </Tabs.List>

          <div className="pb-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,video/mp4,video/webm"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFileUpload(file);
              }}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs"
            >
              {isUploading ? (
                <>
                  <UploadIcon className="h-3.5 w-3.5 animate-bounce" />
                  <span>Enviando mídia...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>Anexar Imagem / Vídeo</span>
                </>
              )}
            </Button>
          </div>
        </div>

        <Tabs.Content value="write" className="space-y-2">
          <textarea
            ref={textareaRef}
            required
            minLength={10}
            rows={18}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onPaste={handlePaste}
            onDrop={handleDrop}
            placeholder="# Introdução&#10;&#10;Escreva seu artigo em Markdown aqui... (Você também pode colar imagens com Ctrl+V ou arrastar arquivos para cá)"
            className="w-full rounded-lg border border-primary bg-primary p-4 font-mono text-sm text-primary focus:outline-2 focus:outline-brand"
          />
          <p className="text-xs text-tertiary">
            Dica: Cole imagens direto com <code className="font-mono">Ctrl+V</code>, arraste um
            arquivo para o editor ou clique em &ldquo;Anexar Imagem / Vídeo&rdquo;.
          </p>
        </Tabs.Content>

        <Tabs.Content
          value="preview"
          className="min-h-[420px] rounded-lg border border-secondary bg-secondary/40 p-6"
        >
          {body.trim() ? (
            <div>
              <div className="min-w-0">
                {showPreviewOutline && (
                  <MarkdownOutlineSidebar headings={previewHeadings} variant="mobile" />
                )}
                <div className="prose md:prose-lg max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={createHeadingComponents()}
                  >
                    {body}
                  </ReactMarkdown>
                </div>
              </div>
              {showPreviewOutline && (
                <MarkdownOutlineSidebar headings={previewHeadings} variant="desktop" />
              )}
            </div>
          ) : (
            <p className="text-sm text-placeholder italic">
              Nada para visualizar ainda. Digite algum conteúdo em Markdown na aba "Escrever".
            </p>
          )}
        </Tabs.Content>
      </Tabs.Root>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isSubmitting || isUploading}>
          {isSubmitting ? 'Salvando...' : 'Publicar Artigo'}
        </Button>
      </div>
    </form>
  );
}
