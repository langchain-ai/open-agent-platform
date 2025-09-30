import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const BodySchema = z.object({
  instructions: z.string().min(1),
  request: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { instructions, request } = BodySchema.parse(json);

    // Attempt to use OpenAI via LangChain if available
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY not set. Install @langchain/openai and set OPENAI_API_KEY to enable rewrites.",
        },
        { status: 501 },
      );
    }

    let ChatOpenAI: any;
    try {
      // Dynamically import to avoid hard dependency if not installed yet
      ({ ChatOpenAI } = await import("@langchain/openai"));
    } catch (e) {
      return NextResponse.json(
        {
          error:
            "@langchain/openai is not installed. Please add it to dependencies to enable rewrites.",
        },
        { status: 501 },
      );
    }

    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        [
          "You are an expert agent-instruction editor.",
          "Rewrite the provided instructions to satisfy the user's request.",
          "- Preserve core goals and constraints unless the request explicitly changes them.",
          "- Keep output as Markdown. Return ONLY the rewritten instructions, no commentary.",
        ].join("\n"),
      ],
      [
        "human",
        [
          "User request: {request}",
          "---",
          "Original instructions:",
          "{instructions}",
        ].join("\n"),
      ],
    ]);

    const model = new ChatOpenAI({
      apiKey: openaiApiKey,
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.2,
    });

    const chain = prompt.pipe(model);
    const res = await chain.invoke({ request, instructions });
    const rewritten: string = res?.content?.toString?.() ?? "";

    if (!rewritten.trim()) {
      return NextResponse.json(
        { error: "Model returned empty output" },
        { status: 500 },
      );
    }

    return NextResponse.json({ rewritten });
  } catch (err) {
    console.error("Prompt rewrite error:", err);
    const msg = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

