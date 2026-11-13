export function Footer() {
  return (
    <footer className="border-t border-secondary bg-primary py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 text-sm text-tertiary sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} Jonas Francisco. Todos os direitos reservados.</p>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-primary transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-primary transition-colors"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}
