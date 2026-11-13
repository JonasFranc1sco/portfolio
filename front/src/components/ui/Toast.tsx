import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { Cross2Icon } from '@radix-ui/react-icons';

export type ToastVariant = 'default' | 'success' | 'error';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toast: (msg: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = React.useState<ToastMessage[]>([]);

  const toast = React.useCallback((msg: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9);
    setMessages((prev) => [...prev, { ...msg, id }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider swipeDirection="right" duration={4500}>
        {children}
        {messages.map((item) => {
          const borderStyles =
            item.variant === 'error'
              ? 'border-error bg-error-primary text-error-primary'
              : item.variant === 'success'
              ? 'border-secondary bg-success-primary text-success-primary'
              : 'border-secondary bg-primary text-primary';

          return (
            <ToastPrimitive.Root
              key={item.id}
              open={true}
              onOpenChange={(open) => {
                if (!open) removeToast(item.id);
              }}
              className={`group pointer-events-auto relative flex w-full items-start justify-between gap-4 overflow-hidden rounded-xl border p-4 shadow-lg transition-all ${borderStyles}`}
            >
              <div className="flex flex-col gap-1">
                <ToastPrimitive.Title className="text-sm font-semibold">
                  {item.title}
                </ToastPrimitive.Title>
                {item.description && (
                  <ToastPrimitive.Description className="text-xs opacity-90">
                    {item.description}
                  </ToastPrimitive.Description>
                )}
              </div>
              <ToastPrimitive.Close
                aria-label="Fechar"
                className="rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-2 focus:outline-brand cursor-pointer"
              >
                <Cross2Icon className="h-4 w-4" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}
        <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-[380px]" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return ctx;
}
