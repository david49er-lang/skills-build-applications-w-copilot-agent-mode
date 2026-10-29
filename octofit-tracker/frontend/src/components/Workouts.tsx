import { useApiData } from '../api/useApiData.js';

type WorkoutSuggestion = { _id?: string; title: string; focus?: string; minutes?: number; difficulty?: string; reason?: string };
type WorkoutResponse = { suggestions: WorkoutSuggestion[] };

export default function Workouts() {
  const { data, loading, error } = useApiData<WorkoutResponse>('/api/workouts/suggestions/mona%40example.com');
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {loading && <p role="status">Loading workout suggestions...</p>}
        {error && <p role="alert">Unable to load workout suggestions. Please try again.</p>}
        {!loading && !error && data?.suggestions.length === 0 && <p>No workout suggestions available.</p>}
        {!loading && !error && data && data.suggestions.length > 0 && (
          <ul>
            {data.suggestions.map((workout, index) => (
              <li key={workout._id ?? `${workout.title}-${index}`}>
                <strong>{workout.title}</strong>
                {workout.focus && ` — ${workout.focus}`}
                {workout.minutes !== undefined && `, ${workout.minutes} minutes`}
                {workout.difficulty && `, ${workout.difficulty}`}
                {workout.reason && <p>{workout.reason}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
