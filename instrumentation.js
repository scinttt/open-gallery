export async function register() {
  // Only warm cache in the Node.js runtime, not Edge
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Delay warm to let initial page loads settle first
    setTimeout(async () => {
      try {
        const { warmCoverCache } = await import("./lib/cache-warm.js");
        const result = await warmCoverCache();
        console.log(
          `[cache-warm] Cover cache warmed on startup: ${result.warmed} new, ${result.skipped} already cached, ${result.failed} failed (${result.total} total)`,
        );
      } catch (error) {
        console.error("[cache-warm] Startup warm failed:", error.message);
      }
    }, 10000);
  }
}
