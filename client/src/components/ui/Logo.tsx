export function Logo({ className = 'w-9 h-9 text-[#1a3326]' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M70 14 A38 38 0 1 0 70 86" />
      <path d="M36 33 H66 L61 56 M63 38 H77 C84 38 88 44 88 49 L85 58 H82 M36 58 H62" />
      <circle cx="43" cy="58" r="7" />
      <circle cx="73" cy="58" r="7" />
      <path d="M28 40 H38 M26 47 H38 M24 54 H38" />
    </svg>
  );
}
