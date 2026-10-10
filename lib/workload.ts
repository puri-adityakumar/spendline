import { span, trace } from "neatlogs";
import { wrapOpenAI } from "neatlogs/openai";
import OpenAI from "openai";
import type { Ticket } from "../workload/tickets.ts";

export const LITELLM_BASE_URL = "https://litellm.vision.aivar.app/v1";
export const DRAFT_MODEL = "claude-haiku";
export const INTENTS = ["billing", "bug", "account", "how-to"] as const;

export type WorkloadConfig = { classify_model: string; max_retries: number };
export type RunTag = "before" | "after";
export type WorkloadRun = {
  tag: RunTag;
  traceId: string;
  config: WorkloadConfig;
  labels: Record<string, string>;
  draftCalls: number;
};

type Chat = Pick<OpenAI["chat"]["completions"], "create">;

export function litellmChat(): Chat {
  const apiKey = process.env.LITELLM_API_KEY;
  if (!apiKey) throw new Error("LITELLM_API_KEY is not set");
  return wrapOpenAI(new OpenAI({ baseURL: LITELLM_BASE_URL, apiKey })).chat.completions;
}

async function complete(chat: Chat, model: string, system: string, user: string, maxTokens: number): Promise<string> {
  const res = await chat.create({
    model,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return res.choices[0]?.message.content?.trim() ?? "";
}

const classify = span({ kind: "CHAIN", name: "intent_classify" }, async (chat: Chat, model: string, ticket: Ticket) => {
  const answer = await complete(
    chat,
    model,
    `Classify the support ticket into exactly one intent: ${INTENTS.join(", ")}. Reply with the intent only.`,
    ticket.text,
    10,
  );
  return INTENTS.find((intent) => answer.toLowerCase().includes(intent)) ?? "unknown";
});

const draft = span({ kind: "CHAIN", name: "support_draft" }, async (chat: Chat, ticket: Ticket, intent: string, attempt: number) =>
  complete(chat, DRAFT_MODEL, `Write a short, friendly support reply for a ${intent} ticket. Attempt ${attempt}.`, ticket.text, 200),
);

export function runWorkload(tag: RunTag, config: WorkloadConfig, chat: Chat, tickets: readonly Ticket[]): Promise<WorkloadRun> {
  return trace(
    { name: "investigate-waste", kind: "WORKFLOW", input: { tag, ...config } },
    async (root) => {
      const labels: Record<string, string> = {};
      let draftCalls = 0;
      for (const ticket of tickets) {
        labels[ticket.id] = await classify(chat, config.classify_model, ticket);
        for (let attempt = 1; attempt <= 1 + config.max_retries; attempt++) {
          await draft(chat, ticket, labels[ticket.id], attempt);
          draftCalls++;
        }
      }
      return { tag, traceId: root.spanContext().traceId, config, labels, draftCalls };
    },
  );
}
