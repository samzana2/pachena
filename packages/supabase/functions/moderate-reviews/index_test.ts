Deno.test({
  name: "moderate-reviews: parses without syntax errors",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    try {
      await import("./index.ts");
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error(`moderate-reviews has a syntax error: ${err.message}`);
      }
    }
  },
});
