/**
 * Ícones inline do painel (sem biblioteca). 20×20, traço em `currentColor`.
 * Decorativos — `aria-hidden`. Usados na navegação da sidebar e nos cabeçalhos.
 */

import type { ReactNode } from "react";

type Props = { className?: string };

function base(children: ReactNode, className?: string) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      width="20"
      height="20"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function IconePainel({ className }: Props) {
  return base(
    <>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="11" width="8" height="10" rx="1.5" />
      <rect x="3" y="14" width="8" height="7" rx="1.5" />
    </>,
    className,
  );
}

export function IconeConvites({ className }: Props) {
  return base(
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>,
    className,
  );
}

export function IconeParticipantes({ className }: Props) {
  return base(
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c.7-3 3-4.5 5.5-4.5S13.8 16 14.5 19" />
      <path d="M16 5.2A3 3 0 0 1 16 11" />
      <path d="M17 14.6c2 .6 3.6 2.1 4 4.4" />
    </>,
    className,
  );
}

export function IconeDocumentos({ className }: Props) {
  return base(
    <>
      <path d="M6 2.5h7.5L19 8v13.5H6z" />
      <path d="M13 2.5V8h6" />
      <path d="M8.5 12.5h7M8.5 16h7" />
    </>,
    className,
  );
}

export function IconeAudios({ className }: Props) {
  return base(
    <>
      <path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2" />
    </>,
    className,
  );
}

export function IconeResultados({ className }: Props) {
  return base(
    <>
      <path d="M4 4v16h16" />
      <rect x="7.5" y="11" width="3" height="6" rx="0.6" />
      <rect x="13" y="7" width="3" height="10" rx="0.6" />
      <rect x="18" y="13" width="2.5" height="4" rx="0.6" />
    </>,
    className,
  );
}

export function IconeExportar({ className }: Props) {
  return base(
    <>
      <path d="M12 3v11" />
      <path d="m7.5 10 4.5 4 4.5-4" />
      <path d="M5 20h14" />
    </>,
    className,
  );
}

export function IconeEstudos({ className }: Props) {
  return base(
    <>
      <path d="M3 7.5 12 3l9 4.5-9 4.5z" />
      <path d="m3 12 9 4.5L21 12" />
      <path d="m3 16.5 9 4.5 9-4.5" />
    </>,
    className,
  );
}

export function IconeEquipe({ className }: Props) {
  return base(
    <>
      <circle cx="8" cy="9" r="3" />
      <circle cx="16.5" cy="10" r="2.4" />
      <path d="M2.5 19c.6-3 2.8-4.7 5.5-4.7S12.9 16 13.5 19" />
      <path d="M15 14.4c2.2.2 3.9 1.7 4.4 4.1" />
    </>,
    className,
  );
}

export function IconeSair({ className }: Props) {
  return base(
    <>
      <path d="M14 4H6v16h8" />
      <path d="M10 12h10" />
      <path d="m16.5 8 4 4-4 4" />
    </>,
    className,
  );
}
