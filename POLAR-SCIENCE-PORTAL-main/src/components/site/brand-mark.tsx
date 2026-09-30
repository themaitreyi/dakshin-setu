import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="Dakshinsetu polar bridge"
      className={cn("size-10", className)}
    >
      <circle cx="32" cy="32" r="29" fill="currentColor" className="text-primary" />
      <path
        d="M12 37c8-15 32-15 40 0M18 37v9m28-9v9"
        fill="none"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M14 31c8-7 28-12 38-1"
        fill="none"
        stroke="currentColor"
        className="text-cyan-300"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M32 11l2.2 5.3L40 18l-5.8 1.7L32 25l-2.2-5.3L24 18l5.8-1.7z" fill="#f1a23a" />
      <path d="M23 46c5 3 13 3 18 0" fill="none" stroke="#8ee6f2" strokeWidth="2.5" />
    </svg>
  );
}
