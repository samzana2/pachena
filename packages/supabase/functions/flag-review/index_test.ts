Deno.test({
  name: "flag-review: parses without syntax errors",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    try {
      await import("./index.ts");
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error(`flag-review has a syntax error: ${err.message}`);
      }
    }
  },
});
