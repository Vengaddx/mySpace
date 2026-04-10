import 'server-only';

function readEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        'Add it to your local .env.development.local or configure it in Vercel for production.'
    );
  }

  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  supabaseUrl: readEnv('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseServiceRoleKey: readEnv('SUPABASE_SERVICE_ROLE_KEY'),
};
