export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <ul className="title-list" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <div className="title-card skeleton-card">
            <div className="title-card-poster skeleton-shimmer" />
            <div className="title-card-body">
              <div className="skeleton-line skeleton-shimmer" style={{ width: '60%' }} />
              <div className="skeleton-line skeleton-shimmer" style={{ width: '40%' }} />
              <div className="skeleton-line skeleton-shimmer" style={{ width: '90%' }} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
