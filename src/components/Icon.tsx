const P: Record<string, string> = {
  stones: 'M7 19h10c1.5 0 2.5-1 2-2.2-.6-1.4-2.5-1.8-7-1.8s-6.4.4-7 1.8C4.5 18 5.5 19 7 19Zm2-5.5h6c1.2 0 1.8-.9 1.3-1.8-.6-1-2-1.4-4.3-1.4s-3.7.4-4.3 1.4c-.5.9.1 1.8 1.3 1.8Zm1.5-4.7h3c1 0 1.4-.8 1-1.6-.4-.8-1-1.2-2.5-1.2s-2.1.4-2.5 1.2c-.4.8 0 1.6 1 1.6Z',
  leaf: 'M5 19c0-8 5-13 14-14 0 9-5 14-13 14m0 0c2-4 5-7 9-9',
  focus: 'M12 4v3m0 10v3M4 12h3m10 0h3M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
  journal: 'M6 4h10a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2V4Zm0 14a2 2 0 0 1 2-2h10M10 8h5',
  rhythm: 'M3 12h3l2-5 3 10 3-8 2 3h5',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.5 7.5 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7.6 7.6 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.5 7.5 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7.6 7.6 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Zm4 4h4',
  'bell-off': 'M6 16V11a6 6 0 0 1 9.5-4.9M18 11v5l1.5 2H8M10 20h4M4 4l16 16',
  close: 'M6 6l12 12M18 6 6 18',
  back: 'M15 5l-7 7 7 7',
  play: 'M8 5v14l11-7L8 5Z',
  pause: 'M8 5v14M16 5v14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  plus: 'M12 5v14M5 12h14',
  mic: 'M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm-6-3a6 6 0 0 0 12 0M12 18v3',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z',
  'phone-off': 'M3 3l18 18M9.5 13.5a11 11 0 0 0 1 1M15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 6 15.2M5 4h4l2 5-2 1.2',
  edit: 'M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4',
  trash: 'M5 7h14M10 7V4h4v3m-7 0 1 13h8l1-13',
  wind: 'M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h7',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-13v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  sparkle: 'M12 3v4m0 10v4M3 12h4m10 0h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6',
  download: 'M12 4v11m-5-5 5 5 5-5M5 20h14',
  door: 'M6 21V4h9l3 2v15M14 12h.01M3 21h18',
};

export function Icon({ name, size = 20, className = '' }: { name: string; size?: number; className?: string }) {
  return (
    <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={P[name] ?? P.leaf} />
    </svg>
  );
}
