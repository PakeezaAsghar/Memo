import React from 'react';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2 select-none whitespace-nowrap shrink-0">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          d="M12 3.5L13.6 8.4L18.5 10L13.6 11.6L12 16.5L10.4 11.6L5.5 10L10.4 8.4L12 3.5Z"
          fill="var(--sage)"
          fillOpacity="0.24"
          stroke="var(--sage-dark)"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <circle cx="18.5" cy="17.5" r="1.5" fill="var(--rose)" />
      </svg>
      <span className="text-[16px] font-semibold tracking-tight text-[var(--text-main)]">
        {compact ? 'Memo' : 'Memo ♡'}
      </span>
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-main)] text-[var(--text-main)] p-6">
      <BrandMark />
      <p className="mt-4 font-editorial text-xl text-[var(--text-main)]">
        Opening your digital desk…
      </p>
      <div className="mt-4 w-36 h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
        <div className="h-full w-1/2 rounded-full bg-[var(--sage)] animate-pulse" />
      </div>
    </div>
  );
}

export function BannerLaptopBowIllustration() {
  return (
    <svg
      width="116"
      height="68"
      viewBox="0 0 116 68"
      fill="none"
      aria-hidden="true"
      className="shrink-0 hidden sm:block"
    >
      {/* Subtle stars */}
      <path
        d="M14 14L15.4 17.6L19 19L15.4 20.4L14 24L12.6 20.4L9 19L12.6 17.6L14 14Z"
        fill="var(--pale-yellow)"
        stroke="var(--warning)"
        strokeWidth="1"
      />
      <circle cx="98" cy="15" r="2" fill="var(--rose)" fillOpacity="0.6" />
      {/* Minimalist Laptop */}
      <rect
        x="28"
        y="16"
        width="56"
        height="35"
        rx="4"
        fill="var(--bg-card)"
        stroke="var(--text-main)"
        strokeWidth="1.4"
      />
      <rect
        x="33"
        y="21"
        width="46"
        height="25"
        rx="2"
        fill="var(--sage-soft)"
      />
      <line x1="39" y1="28" x2="58" y2="28" stroke="var(--sage-dark)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="39" y1="34" x2="70" y2="34" stroke="var(--sage)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="39" y1="40" x2="53" y2="40" stroke="var(--sage)" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M21 52H91L95 57H17L21 52Z"
        fill="var(--bg-secondary)"
        stroke="var(--text-main)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Delicate Bow on corner */}
      <path
        d="M84 18C81 13 76 13 78 18C79 20.5 84 19.5 84 18Z"
        fill="var(--blush)"
        stroke="var(--rose)"
        strokeWidth="1.2"
      />
      <path
        d="M84 18C87 13 92 13 90 18C89 20.5 84 19.5 84 18Z"
        fill="var(--blush)"
        stroke="var(--rose)"
        strokeWidth="1.2"
      />
      <path d="M84 19L81 24M84 19L87 24" stroke="var(--rose)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
