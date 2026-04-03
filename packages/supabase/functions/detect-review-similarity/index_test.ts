Deno.test({
  name: "detect-review-similarity: parses without syntax errors",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    try {
      await import("./index.ts");
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error(`detect-review-similarity has a syntax error: ${err.message}`);
      }
    }
  },
});
