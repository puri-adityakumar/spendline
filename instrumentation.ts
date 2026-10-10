export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.NEATLOGS_API_KEY) return;
  const { init } = await import("neatlogs");
  await init({ workflowName: "spendline-investigator", endpoint: "https://ingest.neatlogs.com" });
}
