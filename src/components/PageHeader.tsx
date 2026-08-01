import { useHousehold } from '../context/HouseholdContext';

export function PageHeader({ title, subtitle }: { title: string; subtitle?: React.ReactNode }) {
  const { household } = useHousehold();

  return (
    <header className="page-header">
      {household && <p className="page-header-eyebrow">{household.name}</p>}
      <h1>{title}</h1>
      {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
    </header>
  );
}
