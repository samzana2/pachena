Deno.test({
  name: "create-review-session: parses without syntax errors",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    try {
      await import("./index.ts");
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error(`create-review-session has a syntax error: ${err.message}`);
      }
    }
  },
});
