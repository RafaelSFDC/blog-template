export function LuminaLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Abstract Sun / Light Source */}
      <circle
        cx="50"
        cy="50"
        r="40"
        className="fill-primary"
        fillOpacity="0.15"
      />
      <circle
        cx="50"
        cy="50"
        r="30"
        className="fill-primary"
        fillOpacity="0.3"
      />

      {/* The "L" shape with stylized edges */}
      <path
        d="M40 30V70H65"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
      />

      {/* Decorative spark / light point */}
      <path
        d="M65 30L68 33M75 40L72 37M68 47L65 50"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        className="text-primary"
      />
    </svg>
  );
}
