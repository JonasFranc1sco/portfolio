import { Link } from 'react-router';
import * as Separator from '@radix-ui/react-separator';
import { ArrowRightIcon } from '@radix-ui/react-icons';
import type { Post } from '../../types/api';

interface PostCardProps {
  post: Post;
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function PostCard({ post }: PostCardProps) {
  const formattedDate = dateFormatter.format(new Date(post.created_at));

  return (
    <article className="group relative flex flex-col justify-between rounded-xl border border-secondary bg-primary p-6 transition-all hover:border-primary hover:shadow-sm">
      <div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-tertiary mb-3">
          {post.topic && (
            <span className="rounded-full border border-secondary bg-secondary px-2.5 py-0.5 font-medium text-secondary">
              #{post.topic}
            </span>
          )}
          <time dateTime={post.created_at}>{formattedDate}</time>
          <Separator.Root
            orientation="vertical"
            className="h-3.5 w-px bg-border-secondary"
          />
          <span>{post.reading_time} min de leitura</span>
        </div>

        <h2 className="text-xl font-semibold text-primary group-hover:text-brand-tertiary transition-colors mb-2">
          <Link to={`/posts/${post.slug}`} className="focus:outline-none">
            <span className="absolute inset-0" aria-hidden="true" />
            {post.title}
          </Link>
        </h2>

        {post.summary && (
          <p className="text-sm text-tertiary line-clamp-3 leading-relaxed">
            {post.summary}
          </p>
        )}
      </div>

      <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-tertiary group-hover:translate-x-0.5 transition-transform">
        <span>Ler artigo</span>
        <ArrowRightIcon className="h-4 w-4" />
      </div>
    </article>
  );
}
