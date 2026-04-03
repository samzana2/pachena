Deno.test({
  name: "send-contact-notification: parses without syntax errors",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    try {
      await import("./index.ts");
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error(`send-contact-notification has a syntax error: ${err.message}`);
      }
    }
  },
});
