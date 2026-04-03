import "https://deno.land/std@0.224.0/dotenv/load.ts";

Deno.test({
  name: "analyze-section module parses without errors",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    try {
      await import("./index.ts");
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error(`analyze-section has a syntax error: ${err.message}`);
      }
    }
  },
});
