import { useHousehold } from '../context/HouseholdContext';
import { useTitles } from '../hooks/useTitles';
import { TitleCard } from '../components/TitleCard';

export function WatchedPage() {
  const { household } = useHousehold();
  const { titles, loading, error } = useTitles(household?.id, 'watched');

  return (
    <div className="page">
      <h1>Watched</h1>

      {error && <p className="error">{error}</p>}

      {!loading && !error && titles.length === 0 && (
        <p className="empty-state">Nothing marked as watched yet.</p>
      )}

      <ul className="title-list">
        {titles.map((title) => (
          <li key={title.id}>
            <TitleCard title={title} />
          </li>
        ))}
      </ul>
    </div>
  );
}
