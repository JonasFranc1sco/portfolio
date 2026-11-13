import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { GitHubLogoIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { authApi } from '../../api/auth.api';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const errorParam = searchParams.get('error');
  const isUnauthorizedAuthor = errorParam === 'unauthorized_author';
  const { toast } = useToast();

  useEffect(() => {
    if (isUnauthorizedAuthor) {
      toast({
        title: 'Acesso negado',
        description: 'O e-mail autenticado não está na Whitelist de autores permitidos.',
        variant: 'error',
      });
    }
  }, [isUnauthorizedAuthor, toast]);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-secondary bg-primary p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-display-xs font-semibold text-primary">Acesso do Autor</h1>
          <p className="mt-2 text-sm text-tertiary">
            Autentique-se com sua conta autorizada e valide seu segundo fator (2FA TOTP) para
            gerenciar as publicações.
          </p>
        </div>

        {isUnauthorizedAuthor && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-error_subtle bg-error-primary p-4 text-sm text-error-primary"
          >
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Autor não autorizado</p>
              <p className="mt-1 text-xs opacity-90">
                O e-mail da conta selecionada não consta na Whitelist de autores deste portfólio.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Button asChild variant="primary" className="w-full py-2.5">
            <a href={authApi.getOAuthLoginUrl('github')}>
              <GitHubLogoIcon className="h-4 w-4" />
              <span>Continuar com GitHub</span>
            </a>
          </Button>

          <Button asChild variant="secondary" className="w-full py-2.5">
            <a href={authApi.getOAuthLoginUrl('google')}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
                />
              </svg>
              <span>Continuar com Google</span>
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
