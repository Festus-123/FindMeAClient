import type { SVGProps } from "react";

/** Small inline icon set (stroke icons, 24px grid). No dependency needed. */
const PATHS = {
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  mail: "M4 4h16v16H4zM4 6l8 7 8-7",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  trophy: "M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3",
  home: "M3 11l9-8 9 8v10H3zM9 21v-7h6v7",
  plus: "M12 5v14M5 12h14",
  arrow: "M5 12h14M13 6l6 6-6 6",
  back: "M19 12H5M11 6l-6 6 6 6",
  share: "M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9zM13.7 21a2 2 0 0 1-3.4 0",
  download: "M21 15v4H3v-4M7 10l5 5 5-5M12 15V3",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4z",
  logout: "M9 21H5V3h4M16 17l5-5-5-5M21 12H9",
  flame: "M12 22c4 0 7-3 7-7 0-3-2-5-3-7-1 2-2 3-3 3 0-4-2-7-5-9 0 4-3 6-3 11 0 5 3 9 7 9z",
  check: "M20 6L9 17l-5-5",
  pin: "M12 22s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  briefcase: "M3 7h18v13H3zM8 7V3h8v4M3 13h18",
  code: "M16 18l6-6-6-6M8 6l-6 6 6 6",
  palette: "M12 22a10 10 0 1 1 10-10c0 3-2 3-4 3h-2a2 2 0 0 0-1 3.7c.7.8.3 3.3-3 3.3zM7 12h.01M9 7h.01M15 7h.01",
  camera: "M3 7h4l2-3h6l2 3h4v13H3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  leaf: "M11 20A7 7 0 0 1 4 13C4 7 9 3 20 3c0 11-4 16-9 17zM4 21c2-6 6-9 11-11",
  pen: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  wrench: "M14.7 6.3a4 4 0 0 0-5.4 5.1L3 17.7 6.3 21l6.3-6.3a4 4 0 0 0 5.1-5.4l-2.5 2.5-2.4-.6-.6-2.4z",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5",
  truck: "M1 3h14v13H1zM15 8h4l4 4v4h-8zM6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  scissors: "M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12",
  party: "M4 20l4-12 8 8zM14 4l1 2M18 8l2 1M19 3l-1 3",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  zap: "M13 2L3 14h9l-1 8 10-12h-9z",
  medal: "M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.9L7 22l5-3 5 3-1.2-8.1",
  link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1",
  phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z",
  upload: "M21 15v4H3v-4M17 8l-5-5-5 5M12 3v12",
  image: "M3 3h18v18H3zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21",
  tag: "M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8zM7 7h.01",
  x: "M18 6L6 18M6 6l12 12",
  chevron: "M6 9l6 6 6-6",
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({ name, size = 18, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

/** One icon per ad category. */
export const CATEGORY_ICONS: Record<string, IconName> = {
  "Web & Software": "code",
  "Design & Creative": "palette",
  "Photography & Video": "camera",
  "Farming & Agriculture": "leaf",
  "Writing & Translation": "pen",
  "Trades & Construction": "wrench",
  "Tutoring & Education": "book",
  "Delivery & Logistics": "truck",
  "Beauty & Fashion": "scissors",
  "Events & Hospitality": "party",
  Other: "grid",
};
