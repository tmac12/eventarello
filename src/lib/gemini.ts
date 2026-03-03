import { GoogleGenAI } from '@google/genai';
import type { GeminiExtraction } from './types';

export async function extractEventData(
  imageBase64: string,
  mimeType: string,
): Promise<GeminiExtraction | null> {
  const apiKey = import.meta.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY');

  const ai = new GoogleGenAI({ apiKey });
  const currentYear = new Date().getFullYear();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
            {
              text: `Analizza questa locandina/volantino di un evento ed estrai le seguenti informazioni in formato JSON:

- "title": il titolo dell'evento
- "event_date": la data e ora in formato ISO 8601 (es. "2026-03-15T20:00:00"). Se l'ora non è indicata, usa le 20:00. Se l'anno non è indicato, usa ${currentYear}.
- "location": il luogo dell'evento (nome del locale/venue e indirizzo se presente)
- "description": una breve descrizione dell'evento (opzionale, solo se ci sono informazioni aggiuntive utili)

Rispondi SOLO con il JSON, senza markdown o altro testo.`,
            },
          ],
        },
      ],
    });

    const text = response.text?.trim();
    if (!text) return null;

    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(cleaned);

    return {
      title: parsed.title || '',
      event_date: parsed.event_date || '',
      location: parsed.location || '',
      description: parsed.description || undefined,
    };
  } catch (err) {
    console.error('Gemini extraction failed:', err);
    return null;
  }
}
