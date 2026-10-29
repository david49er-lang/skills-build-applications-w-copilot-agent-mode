import { useApiData } from '../api/useApiData.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const { data, loading, error } = useApiData<LeaderboardResponse>('/api/leaderboard');
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {loading && <p role="status">Loading leaderboard...</p>}
        {error && <p role="alert">Unable to load leaderboard. Please try again.</p>}
        {!loading && !error && data?.leaderboard.length === 0 && <p>No leaderboard scores yet.</p>}
        {!loading && !error && data && data.leaderboard.length > 0 && (
          <ol>
            {data.leaderboard.map((entry) => (
              <li key={entry.teamName}>{entry.teamName}: {entry.totalPoints} points (rank {entry.rank})</li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
