import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseEnv } from "@/lib/supabase/env";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createSupabaseBrowserClient() {
  const env = getSupabaseEnv();

  if (!env) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(env.url, env.anonKey);
  }

  return browserClient;
}
