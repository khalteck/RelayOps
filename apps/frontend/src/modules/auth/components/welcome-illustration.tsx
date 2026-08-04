export function WelcomeIllustration() {
  return (
    <svg
      className="welcome-illustration"
      viewBox="0 0 420 250"
      role="img"
      aria-label="Connected responders coordinating an incident"
    >
      <defs>
        <linearGradient id="relay-glow" x1="0" x2="1">
          <stop stopColor="#6258e8" />
          <stop offset="1" stopColor="#f06b73" />
        </linearGradient>
      </defs>
      <rect
        x="35"
        y="28"
        width="350"
        height="194"
        rx="28"
        fill="var(--surface-raised)"
        stroke="var(--border-color)"
      />
      <path
        d="M85 163 C145 68 230 205 337 88"
        fill="none"
        stroke="url(#relay-glow)"
        strokeWidth="4"
        strokeDasharray="8 8"
      />
      <g fill="var(--surface-raised)" stroke="#6258e8" strokeWidth="4">
        <circle cx="86" cy="163" r="18" />
        <circle cx="210" cy="130" r="23" />
        <circle cx="337" cy="88" r="18" />
      </g>
      <rect
        x="125"
        y="52"
        width="165"
        height="45"
        rx="12"
        fill="var(--surface-muted)"
        stroke="var(--border-color)"
      />
      <circle cx="148" cy="74" r="7" fill="#ef6472" />
      <path
        d="M166 68h90M166 80h66"
        stroke="var(--text-secondary)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path d="M182 130h56M210 102v56" stroke="#6258e8" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
