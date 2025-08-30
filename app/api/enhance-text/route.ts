// app/api/enhance/route.ts
import { NextRequest, NextResponse } from "next/server";
import Together from "together-ai";

const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY!,
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { text } = body;

  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  try {
    const response = await together.chat.completions.create({
      model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
      messages: [
        {
          "role": "system",
          "content": "You are a professional text editor. Your task is to enhance and improve the given text while maintaining its original meaning and intent. Return ONLY the enhanced text with no additional commentary, explanations, suggestions, or formatting. Do not add prefixes like 'Enhanced:' or 'Improved:'. Do not provide multiple versions or options. Output only the enhanced text content."
        },
        {
          "role": "user",
          "content": `Enhance this text by improving grammar, clarity, flow, and readability while preserving the original meaning: "${text}"`
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const enhancedText = response.choices?.[0]?.message?.content;

    if (!enhancedText) {
      return NextResponse.json({ error: "Failed to enhance text" }, { status: 500 });
    }

    return NextResponse.json({ enhancedText });
  } catch (error) {
    console.error("Error enhancing text:", error);
    return NextResponse.json({ error: "Failed to enhance text" }, { status: 500 });
  }
}
