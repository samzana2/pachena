Deno.test({
  name: "analyze-review: parses without syntax errors",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    try {
      await import("./index.ts");
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error(`analyze-review has a syntax error: ${err.message}`);
      }
    }
  },
});
