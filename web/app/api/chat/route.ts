import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant. Respond concisely." },
        { role: "user", content: message }
      ],
      temperature: 0.7,
    });

    return NextResponse.json({ 
      reply: completion.choices[0]?.message?.content || "I didn't get a response"
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Error processing your request' },
      { status: 500 }
    );
  }
}