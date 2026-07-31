interface RelayLogoProps {
  compact?: boolean;
}

export function RelayLogo({ compact = false }: RelayLogoProps) {
  return (
    <div className="relay-logo" aria-label="RelayOps">
      <span className="relay-logo__mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      {compact ? null : <strong>RelayOps</strong>}
    </div>
  );
}
