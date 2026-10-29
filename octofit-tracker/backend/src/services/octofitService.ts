import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

export async function listActivities() {
  return Activity.find().lean();
}

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function notFound(message: string) {
  return Object.assign(new Error(message), { status: 404 });
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw badRequest('Activity payload must be an object');
  const { userId, teamId, type, minutes } = input;
  if (typeof userId !== 'string' || !mongoose.isValidObjectId(userId)) throw badRequest('A valid userId is required');
  if (typeof teamId !== 'string' || !mongoose.isValidObjectId(teamId)) throw badRequest('A valid teamId is required');
  if (typeof type !== 'string' || !type.trim()) throw badRequest('Activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw badRequest('Minutes must be a positive number');
  }

  const [user, team] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!user || !team) throw notFound('The specified user or team does not exist');

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
  return activity;
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw badRequest('Team payload must be an object');
  const { name, mascot, members = [] } = input;
  if (typeof name !== 'string' || !name.trim()) throw badRequest('Team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw badRequest('Team mascot is required');
  if (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !mongoose.isValidObjectId(member))) {
    throw badRequest('Team members must be valid user IDs');
  }
  if (members.length > 0) {
    const memberCount = await User.countDocuments({ _id: { $in: members } });
    if (memberCount !== members.length) throw notFound('One or more team members do not exist');
  }
  return Team.create({ name: name.trim(), mascot: mascot.trim(), members });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().lean(),
    Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const totalsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: totalsByTeam.get(team._id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw notFound('No user was found for that email address');

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const activityFocus: Record<string, string> = {
    run: 'endurance',
    cycle: 'endurance',
    walk: 'mobility',
    strength: 'strength',
  };
  const focus = (recentActivity && activityFocus[recentActivity.type.toLowerCase()]) || user.fitnessGoal;
  const workouts = await Workout.find().lean();
  const ranked = workouts.sort((left, right) => {
    const leftMatches = left.focus.toLowerCase() === focus.toLowerCase();
    const rightMatches = right.focus.toLowerCase() === focus.toLowerCase();
    return Number(rightMatches) - Number(leftMatches) || left.title.localeCompare(right.title);
  });
  return ranked.map((workout) => ({
    ...workout,
    reason: workout.focus.toLowerCase() === focus.toLowerCase()
      ? `Recommended based on your ${recentActivity ? recentActivity.type : user.fitnessGoal} activity and ${focus} focus.`
      : `Build on your ${focus} focus with a complementary workout.`,
  }));
}

export { User };
