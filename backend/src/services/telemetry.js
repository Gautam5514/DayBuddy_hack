// Agent tracing helpers. Spans follow Sentry's gen_ai conventions so they show
// up in the "AI Agents" view: one agent span per request, one child span per
// model call with model, latency and token counts.
//
// Prompts and answers are deliberately NOT recorded — they contain someone's
// private check-ins. We keep sizes and counts only.

const Sentry = require("@sentry/node");

// Wraps one DayBuddy "agent run" (e.g. planning a day, answering a question).
function traceAgent(name, attributes, fn) {
  return Sentry.startSpan(
    {
      op: "gen_ai.invoke_agent",
      name: `invoke_agent ${name}`,
      attributes: { "gen_ai.agent.name": name, "gen_ai.operation.name": "invoke_agent", ...attributes },
    },
    fn
  );
}

// Wraps one call to the model. `fn` receives the span so it can add usage.
function traceModelCall(model, attributes, fn) {
  return Sentry.startSpan(
    {
      op: "gen_ai.request",
      name: `generate_content ${model}`,
      attributes: {
        "gen_ai.operation.name": "generate_content",
        "gen_ai.system": "gemma",
        "gen_ai.request.model": model,
        ...attributes,
      },
    },
    fn
  );
}

// Attach token usage from a Gemini API response to a model-call span.
function recordUsage(span, usage = {}) {
  const input = usage.promptTokenCount;
  const output = usage.candidatesTokenCount;
  if (Number.isFinite(input)) span.setAttribute("gen_ai.usage.input_tokens", input);
  if (Number.isFinite(output)) span.setAttribute("gen_ai.usage.output_tokens", output);
  if (Number.isFinite(usage.totalTokenCount)) span.setAttribute("gen_ai.usage.total_tokens", usage.totalTokenCount);
  if (Number.isFinite(usage.thoughtsTokenCount)) span.setAttribute("gen_ai.usage.reasoning_tokens", usage.thoughtsTokenCount);
}

module.exports = { traceAgent, traceModelCall, recordUsage, Sentry };
