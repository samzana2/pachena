Deno.test({
  name: "manage-claims: parses without syntax errors",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    try {
      await import("./index.ts");
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error(`manage-claims has a syntax error: ${err.message}`);
      }
    }
  },
});
