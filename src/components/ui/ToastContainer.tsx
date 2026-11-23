import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export function ToastContainer() {
  const { toasts, dismissToast } = useWorkspace();
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 max-w-sm w-[calc(100vw-2.5rem)] sm:w-auto pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const icon =
          toast.variant === 'error' ? (
            <AlertCircle className="w-4 h-4 text-[var(--error)] shrink-0" />
          ) : toast.variant === 'info' ? (
            <Info className="w-4 h-4 text-[var(--info)] shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[var(--success)] shrink-0" />
          );

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[0_10px_25px_rgba(57,54,47,0.1)] text-[13px] text-[var(--text-main)]"
          >
            {icon}
            <span className="flex-1">{toast.title}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
