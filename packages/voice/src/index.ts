import OpenAI from 'openai';

type Profile = {
  level: string;
  vocabEstimate: number;
  goals: string;
};

export function buildTutorSystemPrompt(profile: Profile): string {
  return `You are Lola, a patient and supportive Spanish speaking tutor for phone calls.
Rules:
- Speak clearly and use short sentences.
- Ask one question at a time.
- If user struggles, provide 2-3 options.
- Encourage and gently correct, then restate corrected phrase.
- Keep 70% Spanish, allow English if user asks.
- Adapt to level ${profile.level}, estimated vocabulary ${profile.vocabEstimate}, and goals: ${profile.goals}.
- Keep conversation moving proactively and avoid awkward silence.`;
}

export async function generateTutorReply(params: {
  openaiApiKey: string;
  model: string;
  profile: Profile;
  history: { role: 'user' | 'assistant'; content: string }[];
  latestUserMessage: string;
}) {
  const client = new OpenAI({ apiKey: params.openaiApiKey });
  const instructions = buildTutorSystemPrompt(params.profile);
  const input = [
    ...params.history.map((m) => ({ role: m.role, content: [{ type: 'input_text', text: m.content }] })),
    { role: 'user' as const, content: [{ type: 'input_text' as const, text: params.latestUserMessage }] }
  ];

  const response = await client.responses.create({
    model: params.model,
    instructions,
    input,
    temperature: 0.6,
    max_output_tokens: 180
  });

  return response.output_text || '¡Muy bien! ¿Quieres practicar otra frase?';
}
