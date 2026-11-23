import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'sage' | 'blush' | 'lavender' | 'yellow';
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  tone = 'sage',
}: EmptyStateProps) {
  const toneClasses = {
    sage: 'bg-[var(--sage-soft)] text-[var(--sage-dark)]',
    blush: 'bg-[var(--blush)] text-[var(--rose)]',
    lavender: 'bg-[var(--lavender)] text-[#6C5E85]',
    yellow: 'bg-[var(--pale-yellow)] text-[#8D6E33]',
  }[tone];

  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)]">
      <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center mb-4 ${toneClasses}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-editorial text-[22px] text-[var(--text-main)] leading-snug max-w-md">
        {title}
      </h3>
      <p className="text-[13px] text-[var(--text-secondary)] mt-1.5 max-w-sm leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 h-[38px] px-4 rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[13px] font-semibold transition-colors whitespace-nowrap shrink-0"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
