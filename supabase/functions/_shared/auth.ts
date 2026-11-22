import type { User } from "@supabase/supabase-js";
import { createAuthClient } from "./supabase.ts";
import { HttpError } from "./response.ts";

export async function requireUser(req: Request): Promise<User> {
  const authorization = req.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new HttpError(401, "Authentication required");
  }

  const token = authorization?.slice(7).trim();

  if (!token) {
    throw new HttpError(401, "Authentication token is missing");
  }

  const supabase = createAuthClient();

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new HttpError(401, "Invalid or expired session");
  }

  return data.user;
}
