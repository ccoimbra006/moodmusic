import { eq, sql, and, gte, desc } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";

export const timelineRouter = createRouter({
  // Timeline pessoal do utilizador logado
  myTimeline: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    // Atividade recente (últimos 50)
    const activities = await db
      .select({
        id: schema.userActivity.id,
        action: schema.userActivity.action,
        metadata: schema.userActivity.metadata,
        createdAt: schema.userActivity.createdAt,
        songId: schema.songs.id,
        songTitle: schema.songs.title,
        songArtist: schema.songs.artist,
        songImage: schema.songs.image,
        songMood: schema.songs.detectedMood,
      })
      .from(schema.userActivity)
      .leftJoin(schema.songs, eq(schema.userActivity.songId, schema.songs.id))
      .where(eq(schema.userActivity.userId, userId))
      .orderBy(desc(schema.userActivity.createdAt))
      .limit(50);

    return activities;
  }),

  // Mood stats: frequência de cada mood
  moodStats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    const moods = await db
      .select({
        mood: schema.moodSelections.mood,
        count: sql<number>`count(${schema.moodSelections.id})`.as("count"),
      })
      .from(schema.moodSelections)
      .where(eq(schema.moodSelections.userId, userId))
      .groupBy(schema.moodSelections.mood)
      .orderBy(sql`count(${schema.moodSelections.id}) desc`);

    return moods;
  }),

  // Evolução emocional por semana (últimas 8 semanas)
  emotionalEvolution: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    const selections = await db
      .select({
        mood: schema.moodSelections.mood,
        createdAt: schema.moodSelections.createdAt,
      })
      .from(schema.moodSelections)
      .where(
        and(
          eq(schema.moodSelections.userId, userId),
          gte(schema.moodSelections.createdAt, eightWeeksAgo)
        )
      )
      .orderBy(schema.moodSelections.createdAt);

    // Agrupar por semana
    const weekMap = new Map<string, Record<string, number>>();
    for (const s of selections) {
      const date = new Date(s.createdAt);
      const weekKey = `${date.getFullYear()}-W${String(Math.floor(date.getDate() / 7)).padStart(2, "0")}`;
      if (!weekMap.has(weekKey)) weekMap.set(weekKey, {});
      const week = weekMap.get(weekKey)!;
      week[s.mood] = (week[s.mood] ?? 0) + 1;
    }

    return Array.from(weekMap.entries()).map(([week, moods]) => ({
      week,
      moods,
      dominant: Object.entries(moods).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "chill",
    }));
  }),

  // Moods mais frequentes (top 3)
  topMoods: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    const moods = await db
      .select({
        mood: schema.moodSelections.mood,
        count: sql<number>`count(${schema.moodSelections.id})`.as("count"),
      })
      .from(schema.moodSelections)
      .where(eq(schema.moodSelections.userId, userId))
      .groupBy(schema.moodSelections.mood)
      .orderBy(sql`count(${schema.moodSelections.id}) desc`)
      .limit(3);

    return moods;
  }),

  // "Semana mais triste" — semana com mais melancholy
  saddestWeek: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    const selections = await db
      .select({
        mood: schema.moodSelections.mood,
        createdAt: schema.moodSelections.createdAt,
      })
      .from(schema.moodSelections)
      .where(eq(schema.moodSelections.userId, userId))
      .orderBy(schema.moodSelections.createdAt);

    let saddestWeek = "";
    let maxSad = 0;
    const weekMap = new Map<string, number>();

    for (const s of selections) {
      if (s.mood === "melancholy") {
        const date = new Date(s.createdAt);
        const weekKey = `${date.getFullYear()}-W${String(Math.floor(date.getDate() / 7) + 1).padStart(2, "0")}`;
        const count = (weekMap.get(weekKey) ?? 0) + 1;
        weekMap.set(weekKey, count);
        if (count > maxSad) {
          maxSad = count;
          saddestWeek = weekKey;
        }
      }
    }

    return { week: saddestWeek || "Nenhuma", count: maxSad };
  }),

  // "Mês mais energético" — mês com mais energy
  mostEnergeticMonth: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    const selections = await db
      .select({
        mood: schema.moodSelections.mood,
        createdAt: schema.moodSelections.createdAt,
      })
      .from(schema.moodSelections)
      .where(eq(schema.moodSelections.userId, userId))
      .orderBy(schema.moodSelections.createdAt);

    let bestMonth = "";
    let maxEnergy = 0;
    const monthMap = new Map<string, number>();

    for (const s of selections) {
      if (s.mood === "energy") {
        const date = new Date(s.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const count = (monthMap.get(monthKey) ?? 0) + 1;
        monthMap.set(monthKey, count);
        if (count > maxEnergy) {
          maxEnergy = count;
          bestMonth = monthKey;
        }
      }
    }

    return { month: bestMonth || "Nenhum", count: maxEnergy };
  }),
});
