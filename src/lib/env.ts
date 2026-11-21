import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}. See .env.example.`);
  return value;
}

export const env = {
  get supabaseUrl() {
    return required("SUPABASE_URL");
  },
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
  get sessionSecret() {
    const s = required("SESSION_SECRET");
    if (s.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters.");
    return s;
  },
};
