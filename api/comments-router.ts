import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";

export const commentsRouter = createRouter({
  getBySong: publicQuery
    .input(z.object({ songId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      
      // Get comments with user info
      const comments = await db
        .select({
          id: schema.comments.id,
          text: schema.comments.text,
          createdAt: schema.comments.createdAt,
          userId: schema.comments.userId,
          userName: schema.users.name,
          userAvatar: schema.users.avatar,
        })
        .from(schema.comments)
        .leftJoin(schema.users, eq(schema.comments.userId, schema.users.id))
        .where(eq(schema.comments.songId, input.songId))
        .orderBy(schema.comments.createdAt);

      // Get all replies for these comments
      const commentIds = comments.map((c: typeof comments[0]) => c.id);
      if (commentIds.length === 0) return { comments: [] };

      const replies = await db
        .select({
          id: schema.commentReplies.id,
          commentId: schema.commentReplies.commentId,
          text: schema.commentReplies.text,
          createdAt: schema.commentReplies.createdAt,
          userId: schema.commentReplies.userId,
          userName: schema.users.name,
          userAvatar: schema.users.avatar,
        })
        .from(schema.commentReplies)
        .leftJoin(schema.users, eq(schema.commentReplies.userId, schema.users.id))
        .where(sql`${schema.commentReplies.commentId} IN (${commentIds.join(",")})`)
        .orderBy(schema.commentReplies.createdAt);

      // Group replies by comment
      const repliesByComment: Record<number, typeof replies> = {};
      for (const reply of replies) {
        if (!repliesByComment[reply.commentId]) repliesByComment[reply.commentId] = [];
        repliesByComment[reply.commentId].push(reply);
      }

      return {
        comments: comments.map((c: typeof comments[0]) => ({
          ...c,
          replies: repliesByComment[c.id] ?? [],
        })),
      };
    }),

  create: authedQuery
    .input(
      z.object({
        songId: z.number(),
        text: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const result = await db.insert(schema.comments).values({
        songId: input.songId,
        userId: ctx.user.id,
        text: input.text,
      });

      const insertedId = Number(result[0].insertId);
      
      // Update comments count
      const countResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(schema.comments)
        .where(eq(schema.comments.songId, input.songId));
      
      await db
        .update(schema.songs)
        .set({ commentsCount: countResult[0]?.count ?? 0 })
        .where(eq(schema.songs.id, input.songId));

      return { id: insertedId };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      
      // Check ownership
      const existing = await db
        .select()
        .from(schema.comments)
        .where(eq(schema.comments.id, input.id))
        .limit(1);

      if (existing.length === 0) throw new Error("Comment not found");
      if (existing[0].userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Not authorized");
      }

      // Delete replies first
      await db.delete(schema.commentReplies).where(eq(schema.commentReplies.commentId, input.id));
      // Delete comment
      await db.delete(schema.comments).where(eq(schema.comments.id, input.id));

      // Update count
      const countResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(schema.comments)
        .where(eq(schema.comments.songId, existing[0].songId));
      
      await db
        .update(schema.songs)
        .set({ commentsCount: countResult[0]?.count ?? 0 })
        .where(eq(schema.songs.id, existing[0].songId));

      return { success: true };
    }),

  reply: authedQuery
    .input(
      z.object({
        commentId: z.number(),
        text: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const result = await db.insert(schema.commentReplies).values({
        commentId: input.commentId,
        userId: ctx.user.id,
        text: input.text,
      });

      return { id: Number(result[0].insertId) };
    }),
});
