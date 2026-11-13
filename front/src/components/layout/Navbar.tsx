import { Link, useNavigate } from 'react-router';
import {
  SunIcon,
  MoonIcon,
  PlusIcon,
  ExitIcon,
  PersonIcon,
} from '@radix-ui/react-icons';
import * as Avatar from '@radix-ui/react-avatar';
import { Button } from '../ui/Button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../ui/DropdownMenu';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';

export function Navbar() {
  const { isAuthenticated, isDarkMode, toggleDarkMode, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast({
      title: 'Sessão encerrada',
      description: 'Você saiu da sua conta de autor.',
    });
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-secondary bg-primary/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="text-lg font-semibold tracking-tight text-primary hover:opacity-90 transition-opacity"
          >
            Jonas Francisco
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm font-medium text-tertiary">
            <Link to="/" className="hover:text-primary transition-colors">
              Artigos
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={toggleDarkMode}
            aria-label="Alternar tema"
            className="px-2.5 py-2"
          >
            {isDarkMode ? (
              <SunIcon className="h-4 w-4 text-primary" />
            ) : (
              <MoonIcon className="h-4 w-4 text-primary" />
            )}
          </Button>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Menu do autor"
                  className="inline-flex items-center gap-2 rounded-full border border-secondary bg-secondary p-1 pr-3 text-sm font-medium text-primary hover:bg-secondary_hover focus:outline-2 focus:outline-brand cursor-pointer"
                >
                  <Avatar.Root className="inline-flex h-7 w-7 select-none items-center justify-center overflow-hidden rounded-full bg-brand-solid text-xs font-semibold text-white">
                    <Avatar.Fallback>JF</Avatar.Fallback>
                  </Avatar.Root>
                  <span>Autor</span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => navigate('/admin/posts/new')}>
                  <PlusIcon className="h-4 w-4" />
                  <span>Novo Artigo</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={toggleDarkMode}>
                  {isDarkMode ? (
                    <SunIcon className="h-4 w-4" />
                  ) : (
                    <MoonIcon className="h-4 w-4" />
                  )}
                  <span>Alternar Tema</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={handleLogout}
                  className="text-error-primary hover:text-error-primary_hover focus:text-error-primary_hover"
                >
                  <ExitIcon className="h-4 w-4" />
                  <span>Sair (Logout)</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="secondary">
              <Link to="/login">
                <PersonIcon className="h-4 w-4" />
                <span>Área do Autor</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
