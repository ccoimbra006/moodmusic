import { createRouter, publicQuery } from "./middleware";
import { GOOGLE_COOKIE } from "./google-auth-router";

export const authRouter = createRouter({
  me: publicQuery.query((opts) => opts.ctx.user ?? null),
  logout: publicQuery.mutation(async ({ ctx }) => {
    // Clear Google cookie
    ctx.resHeaders.append(
      "set-cookie",
      `${GOOGLE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    );
    return { success: true };
  }),
});
