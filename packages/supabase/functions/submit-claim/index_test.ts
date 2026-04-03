Deno.test({
  name: "submit-claim: parses without syntax errors",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    try {
      await import("./index.ts");
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error(`submit-claim has a syntax error: ${err.message}`);
      }
    }
  },
});
