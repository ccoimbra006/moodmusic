export interface AuthUser {
  id: number;
  name: string | null;
  email: string | null;
  avatar?: string | null;
  role: "user" | "admin";
}
