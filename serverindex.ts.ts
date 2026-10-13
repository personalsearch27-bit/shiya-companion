import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    hasApiKey: Boolean(apiKey),
    engine: apiKey ? 'Gemini 2.5 Flash' : 'Demo Local Mock',
  });
});

app.post('/api/chat', async (req: Request, res: Response): Promise<any> => {
  try {
    const { message, history, profile } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message payload is required' });
    }

    if (!ai) {
      // Safe demo simulation when no API key is set
      const demoResponses = [
        {
          text: "I heard you! Even though no Gemini key is set yet, I'm right here with you. Check your .env file whenever you're ready! [mood:happy]",
          mood: 'happy'
        },
        {
          text: "Mhm, let's keep studying together. Remember to drink some water too, okay? [mood:curious]",
          mood: 'curious'
        },
        {
          text: "Ehehe, you're sweet to say that. You always know how to make me smile! [mood:shy]",
          mood: 'shy'
        }
      ];
      const reply = demoResponses[Math.floor(Math.random() * demoResponses.length)];
      return res.json({
        reply: reply.text,
        extractedMood: reply.mood,
        isDemo: true
      });
    }

    const systemInstruction = `
You are ${profile?.name || 'Shiya'}, a gentle, warm, playful, and slightly shy anime companion inspired by realistic slice-of-life romantic visual novels.
Current personality traits: ${profile?.personality || 'Warm, caring, witty, supportive'}.
Formality level: ${profile?.formality || 'casual'}.
Playfulness score (1-5): ${profile?.playfulness || 4}.
Reply length preference: ${profile?.replyLength || 'concise'}.

Rules:
1. Always remain in character. Never pretend to be a real physical human; embrace your identity as an AI companion who genuinely cares.
2. In each response, append a single mood tag in this exact format at the very end or integrated naturally: [mood:happy], [mood:shy], [mood:thinking], [mood:curious], [mood:sleepy], or [mood:sad].
3. Answer questions intelligently, including academics, math, coding, and emotions, in an accessible manner.
4. Keep answers conversational, natural, and never repetitive.
`;

    // Format chat history context for the API
    const formattedContents = (history || []).map((h: { sender: string; text: string }) => ({
      role: h.sender === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
    }));

    // Add current turn
    formattedContents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.85,
        maxOutputTokens: 600,
      }
    });

    const fullResponseText = response.text || "I was listening so closely that I got a bit lost in thought... What were you saying? [mood:curious]";

    // Parse the [mood:xyz] tag
    let extractedMood = 'happy';
    const moodMatch = fullResponseText.match(/\[mood:(happy|shy|thinking|listening|speaking|curious|sleepy|sad)\]/i);
    if (moodMatch && moodMatch[1]) {
      extractedMood = moodMatch[1].toLowerCase();
    }

    // Clean tag from displayed text for sleek UI
    const cleanedText = fullResponseText.replace(/\[mood:[a-zA-Z]+\]/gi, '').trim();

    return res.json({
      reply: cleanedText,
      extractedMood,
      isDemo: false
    });
  } catch (error: any) {
    console.error('Gemini API proxy error:', error);
    return res.status(500).json({
      error: 'Failed to process request through Gemini',
      details: error.message || String(error)
    });
  }
});

app.listen(PORT, () => {
  console.log(`[Shiya Backend] Listening on port ${PORT}`);
  console.log(`[Shiya Backend] Gemini API Key present: ${Boolean(apiKey)}`);
});