import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { QRCodeSVG } from 'qrcode.react';
import * as Label from '@radix-ui/react-label';
import * as Tooltip from '@radix-ui/react-tooltip';
import { CopyIcon, CheckIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { authApi } from '../../api/auth.api';
import { Button } from '../../components/ui/Button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/Dialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import type { Setup2FAResponse } from '../../types/api';

export function Setup2FAPage() {
  const navigate = useNavigate();
  const { markAuthenticated } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<Setup2FAResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    
    setIsLoading(true);
    setError(null);

    authApi
      .setup2FA()
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : 'Não foi possível iniciar a configuração do 2FA.'
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleCopySecret = async () => {
    if (!data?.secret) return;
    try {
      await navigator.clipboard.writeText(data.secret);
      setCopied(true);
      toast({
        title: 'Chave copiada',
        description: 'A chave secreta TOTP foi copiada para a área de transferência.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Erro ao copiar',
        description: 'Copie manualmente a chave exibida na tela.',
        variant: 'error',
      });
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.replace(/\D/g, '');
    if (cleanCode.length !== 6) return;

    setIsVerifying(true);
    try {
      await authApi.verify2FA(cleanCode);
      markAuthenticated();
      toast({
        title: '2FA ativado com sucesso!',
        description: 'Sua sessão de autor está ativa por 24 horas.',
        variant: 'success',
      });
      navigate('/admin/posts/new');
    } catch (err) {
      toast({
        title: 'Código inválido',
        description:
          err instanceof Error
            ? err.message
            : 'Verifique os 6 dígitos gerados no seu aplicativo autenticador.',
        variant: 'error',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-lg flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-secondary bg-primary p-8 shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-display-xs font-semibold text-primary">
              Configurar Autenticação 2FA
            </h1>
            <p className="mt-1 text-sm text-tertiary">
              Escaneie o QR Code no seu aplicativo autenticador e confirme o primeiro código de 6
              dígitos.
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="ghost" className="px-2.5 py-2" aria-label="Instruções">
                <InfoCircledIcon className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Como configurar o 2FA (TOTP)</DialogTitle>
              <DialogDescription>
                Siga os passos abaixo para proteger sua conta de autor:
              </DialogDescription>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-secondary">
                <li>
                  Instale um aplicativo autenticador como <strong>Google Authenticator</strong>,{' '}
                  <strong>Authy</strong> ou <strong>1Password</strong>.
                </li>
                <li>
                  Toque em adicionar conta (ícone <strong>+</strong>) e escaneie o QR Code exibido
                  na tela.
                </li>
                <li>
                  Caso não consiga escanear, escolha &ldquo;Inserir chave de configuração&rdquo; e
                  cole a chave secreta (<code className="font-mono">secret</code>).
                </li>
                <li>
                  Digite o código numérico de 6 dígitos gerado pelo aplicativo para ativar o 2FA e
                  concluir o login.
                </li>
              </ol>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="h-[200px] w-[200px] animate-pulse rounded-xl bg-secondary" />
            <div className="h-5 w-48 animate-pulse rounded bg-secondary" />
          </div>
        ) : error || !data ? (
          <div className="rounded-xl border border-error_subtle bg-error-primary p-4 text-sm text-error-primary">
            <p className="font-medium">{error || 'Erro ao carregar QR Code.'}</p>
            <div className="mt-4">
              <Button type="button" variant="secondary" onClick={() => navigate('/login')}>
                Voltar para o Login
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center rounded-xl border border-secondary bg-white p-6">
              <QRCodeSVG value={data.qr_code_url} size={200} />
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-medium text-tertiary uppercase tracking-wider">
                Chave Secreta (Configuração Manual)
              </span>
              <div className="flex items-center justify-between gap-2 rounded-lg border border-secondary bg-secondary/50 px-3.5 py-2.5">
                <code className="font-mono text-sm text-primary break-all">{data.secret}</code>

                <Tooltip.Provider delayDuration={200}>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleCopySecret}
                        className="shrink-0 px-2.5 py-1.5"
                      >
                        {copied ? (
                          <CheckIcon className="h-4 w-4 text-success-primary" />
                        ) : (
                          <CopyIcon className="h-4 w-4" />
                        )}
                        <span>{copied ? 'Copiado' : 'Copiar'}</span>
                      </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        sideOffset={5}
                        className="z-50 rounded-md bg-primary-solid px-2.5 py-1.5 text-xs text-white shadow-md"
                      >
                        Copiar chave secreta TOTP
                        <Tooltip.Arrow className="fill-primary-solid" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-4 border-t border-secondary pt-6">
              <div className="space-y-2">
                <Label.Root htmlFor="totp-code" className="text-sm font-medium text-primary">
                  Código de 6 dígitos do autenticador *
                </Label.Root>
                <input
                  id="totp-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full rounded-lg border border-primary bg-primary px-4 py-2.5 text-center font-mono text-lg tracking-[0.4em] text-primary focus:outline-2 focus:outline-brand"
                />
              </div>

              <Button
                type="submit"
                className="w-full py-2.5"
                disabled={isVerifying || code.length !== 6}
              >
                {isVerifying ? 'Verificando...' : 'Ativar 2FA e Entrar'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
