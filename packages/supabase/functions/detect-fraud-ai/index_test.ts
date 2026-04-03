Deno.test({
  name: "detect-fraud-ai: parses without syntax errors",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    try {
      await import("./index.ts");
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error(`detect-fraud-ai has a syntax error: ${err.message}`);
      }
    }
  },
});
