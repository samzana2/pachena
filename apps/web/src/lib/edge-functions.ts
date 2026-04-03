/**
 * Utility for constructing Edge Function URLs dynamically from environment variables.
 */

export function getEdgeFunctionUrl(functionName: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL environment variable is not configured");
  }
  return `${supabaseUrl}/functions/v1/${functionName}`;
}
