export function PageHeader({ subtitle }: { subtitle?: React.ReactNode }) {
  if (!subtitle) return null;

  return (
    <header className="page-header">
      <p className="page-header-subtitle">{subtitle}</p>
    </header>
  );
}
