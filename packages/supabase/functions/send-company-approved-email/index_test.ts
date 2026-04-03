Deno.test({
  name: "send-company-approved-email: parses without syntax errors",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    try {
      await import("./index.ts");
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error(`send-company-approved-email has a syntax error: ${err.message}`);
      }
    }
  },
});
