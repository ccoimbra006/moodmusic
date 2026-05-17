import { z } from "zod";
import { eq, and, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";

export const followsRouter = createRouter({
  follow: authedQuery.input(z.object({ userId: z.number() })).mutation(async ({ ctx, input }) => {
    const db = getDb();
    const followerId = ctx.user.id;
    if (followerId === input.userId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Não podes seguir-te a ti mesmo" });
    }
    const existing = await db
      .select()
      .from(schema.follows)
      .where(and(eq(schema.follows.followerId, followerId), eq(schema.follows.followingId, input.userId)))
      .limit(1);
    if (existing.length > 0) {
      throw new TRPCError({ code: "CONFLICT", message: "Já segues este utilizador" });
    }
    await db.insert(schema.follows).values({ followerId, followingId: input.userId });
    return { success: true };
  }),

  unfollow: authedQuery.input(z.object({ userId: z.number() })).mutation(async ({ ctx, input }) => {
    const db = getDb();
    await db
      .delete(schema.follows)
      .where(and(eq(schema.follows.followerId, ctx.user.id), eq(schema.follows.followingId, input.userId)));
    return { success: true };
  }),

  isFollowing: publicQuery.input(z.object({ userId: z.number() })).query(async ({ ctx, input }) => {
    if (!ctx.user) return false;
    const db = getDb();
    const existing = await db
      .select()
      .from(schema.follows)
      .where(and(eq(schema.follows.followerId, ctx.user.id), eq(schema.follows.followingId, input.userId)))
      .limit(1);
    return existing.length > 0;
  }),

  getFollowers: publicQuery.input(z.object({ userId: z.number() })).query(async ({ input }) => {
    const db = getDb();
    const followers = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        avatar: schema.users.avatar,
      })
      .from(schema.follows)
      .innerJoin(schema.users, eq(schema.follows.followerId, schema.users.id))
      .where(eq(schema.follows.followingId, input.userId));
    return followers;
  }),

  getFollowing: publicQuery.input(z.object({ userId: z.number() })).query(async ({ input }) => {
    const db = getDb();
    const following = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        avatar: schema.users.avatar,
      })
      .from(schema.follows)
      .innerJoin(schema.users, eq(schema.follows.followingId, schema.users.id))
      .where(eq(schema.follows.followerId, input.userId));
    return following;
  }),

  getFollowCounts: publicQuery.input(z.object({ userId: z.number() })).query(async ({ input }) => {
    const db = getDb();
    const followersCount = await db
      .select({ count: count() })
      .from(schema.follows)
      .where(eq(schema.follows.followingId, input.userId));
    const followingCount = await db
      .select({ count: count() })
      .from(schema.follows)
      .where(eq(schema.follows.followerId, input.userId));
    return {
      followers: followersCount[0]?.count ?? 0,
      following: followingCount[0]?.count ?? 0,
    };
  }),
});
