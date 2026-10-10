const nullableNumber = { type: ["number", "null"] };

function spec(origin: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "Spendline cost API",
      version: "1.0.0",
      description:
        "LLM inference cost for the Spendline team, from a seeded fixture ledger (2026-07 through 2026-09). Not a real bill. There is no customer, signup, or revenue data here.",
    },
    servers: [{ url: `${origin}/api/cfo` }],
    security: [{ bearer: [] }],
    components: {
      securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
      schemas: {
        MonthlyUsage: {
          type: "object",
          required: ["month", "team", "model", "requests", "tokens", "costUsd"],
          properties: {
            month: { type: "string", description: "YYYY-MM" },
            team: { type: "string" },
            model: { type: "string" },
            requests: { type: "integer" },
            tokens: { type: "integer" },
            costUsd: { type: "number", description: "Inference cost in USD for the month" },
          },
        },
        ScenarioRow: {
          type: "object",
          required: ["month", "scenario", "customers", "priceUsd", "inferenceCogsUsd", "otherCostUsd", "startingCashUsd"],
          properties: {
            month: { type: "string", description: "YYYY-MM" },
            scenario: { type: "string", enum: ["leaky", "capped"] },
            customers: nullableNumber,
            priceUsd: nullableNumber,
            inferenceCogsUsd: { ...nullableNumber, description: "leaky is the ledger's monthly inference cost; capped is null until the trace B saving is measured" },
            otherCostUsd: nullableNumber,
            startingCashUsd: nullableNumber,
          },
        },
      },
    },
    paths: {
      "/usage": {
        get: {
          operationId: "listMonthlyUsage",
          summary: "Inference usage and cost by month, team, and model",
          responses: {
            "200": {
              description: "Usage rows",
              content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/MonthlyUsage" } } } } } },
            },
            "401": { description: "Missing or wrong bearer token" },
          },
        },
      },
      "/scenarios": {
        get: {
          operationId: "listScenarios",
          summary: "Monthly runway inputs for the leaky and capped scenarios",
          responses: {
            "200": {
              description: "Scenario rows; null means not supplied yet",
              content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/ScenarioRow" } } } } } },
            },
            "401": { description: "Missing or wrong bearer token" },
          },
        },
      },
    },
  };
}

export async function GET(request: Request): Promise<Response> {
  return Response.json(spec(new URL(request.url).origin));
}
