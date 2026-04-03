Deno.test({
  name: "manage-admin-users: parses without syntax errors",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    try {
      await import("./index.ts");
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error(`manage-admin-users has a syntax error: ${err.message}`);
      }
    }
  },
});
