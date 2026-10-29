import { useApiData } from '../api/useApiData.js';

type Team = { _id?: string; name: string; mascot?: string; members: string[] };
type TeamResponse = { teams: Team[] };

export default function Teams() {
  const { data, loading, error } = useApiData<TeamResponse>('/api/teams');
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {loading && <p role="status">Loading teams...</p>}
        {error && <p role="alert">Unable to load teams. Please try again.</p>}
        {!loading && !error && data?.teams.length === 0 && <p>No teams yet.</p>}
        {!loading && !error && data && data.teams.length > 0 && (
          <ul>
            {data.teams.map((team, index) => (
              <li key={team._id ?? `${team.name}-${index}`}>
                {team.name}{team.mascot ? ` (${team.mascot})` : ''} — {team.members.length} members
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
