import { useState } from 'react';
import { useNavigate } from 'react-router';
import * as Label from '@radix-ui/react-label';
import { LockClosedIcon } from '@radix-ui/react-icons';
import { authApi } from '../../api/auth.api';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';

export function Verify2FAPage() {
  const navigate = useNavigate();
  const { markAuthenticated } = useAuth();
  const { toast } = useToast();

  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.replace(/\D/g, '');
    if (cleanCode.length !== 6) return;

    setIsSubmitting(true);
    try {
      await authApi.verify2FA(cleanCode);
      markAuthenticated();
      toast({
        title: 'Autenticação concluída!',
        description: 'Bem-vindo de volta. Sua sessão está ativa por 24 horas.',
        variant: 'success',
      });
      navigate('/admin/posts/new');
    } catch (err) {
      toast({
        title: 'Código 2FA inválido',
        description:
          err instanceof Error
            ? err.message
            : 'O código informado está incorreto ou expirou.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-secondary bg-primary p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-brand-tertiary">
            <LockClosedIcon className="h-6 w-6" />
          </div>
          <h1 className="text-display-xs font-semibold text-primary">Verificação em Duas Etapas</h1>
          <p className="mt-2 text-sm text-tertiary">
            Digite o código TOTP de 6 dígitos gerado pelo seu aplicativo autenticador para concluir
            o login.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label.Root htmlFor="verify-totp-code" className="text-sm font-medium text-primary">
              Código de Segurança (6 dígitos)
            </Label.Root>
            <input
              id="verify-totp-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full rounded-lg border border-primary bg-primary px-4 py-3 text-center font-mono text-xl tracking-[0.4em] text-primary focus:outline-2 focus:outline-brand"
            />
          </div>

          <Button
            type="submit"
            className="w-full py-2.5"
            disabled={isSubmitting || code.length !== 6}
          >
            {isSubmitting ? 'Validando código...' : 'Verificar e Entrar'}
          </Button>
        </form>
      </div>
    </div>
  );
}
