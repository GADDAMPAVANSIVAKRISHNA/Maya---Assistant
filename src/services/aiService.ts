import Groq from 'groq-sdk';

const groqApiKey = process.env.GROQ_API_KEY;

const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

export async function askAI(prompt: string) {
  if (!groq) {
    return 'Groq API key is not configured. Set GROQ_API_KEY in your environment.';
  }

  try {
    const chat = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-70b-8192',
      temperature: 0.7,
    });
    return chat.choices[0].message.content;
  } catch (error) {
    console.error('AI Error:', error);
    return 'Sorry, I had trouble processing your request.';
  }
}
