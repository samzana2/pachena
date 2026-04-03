Deno.test({
  name: "send-company-request-confirmation: parses without syntax errors",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    try {
      await import("./index.ts");
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error(`send-company-request-confirmation has a syntax error: ${err.message}`);
      }
    }
  },
});
