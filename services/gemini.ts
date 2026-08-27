import { GoogleGenerativeAI } from '@google/generative-ai';
import { DELSU_LOCATIONS } from '../data/locations';
import { Message } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Standard stop words to ignore during fallback matching
const STOP_WORDS = new Set(['where', 'is', 'the', 'of', 'at', 'in', 'to', 'faculty', 'department', 'building']);

export async function getCampusAssistance(userPrompt: string, chatHistory: Message[]) {
  // 1. Live Gemini API Call (if API key is present)
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
        systemInstruction: `You are DelsuAI, an intelligent campus guide for Delta State University (DELSU), Abraka. 
        Provide helpful, natural responses about campus locations and navigation based on the dataset.
        
        Locations Dataset:
        ${JSON.stringify(DELSU_LOCATIONS)}`
      });

      const formattedHistory = chatHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const chat = model.startChat({ history: formattedHistory });

      const prompt = `User Query: "${userPrompt}". 
      Respond with a JSON object:
      {
        "answer": "Clear directions or information about the queried place.",
        "suggestedLocationId": "Matching ID string from dataset or null"
      }`;

      const result = await chat.sendMessage(prompt);
      const parsed = JSON.parse(result.response.text());

      return {
        answer: parsed.answer,
        suggestedLocationId: parsed.suggestedLocationId || null
      };
    } catch (error) {
      console.warn('Gemini API call failed; using local search engine:', error);
    }
  }

  // 2. High-Accuracy Local Match Engine
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const cleanQuery = normalize(userPrompt);
  
  // Extract essential keywords by excluding stop words
  const keywords = cleanQuery.split(/\s+/).filter(word => word.length > 1 && !STOP_WORDS.has(word));

  let bestMatch = null;
  let maxScore = 0;

  for (const loc of DELSU_LOCATIONS) {
    let score = 0;
    const nameNorm = normalize(loc.name);
    const categoryNorm = normalize(loc.category);
    const aliasesNorm = loc.aliases.map(normalize);

    // Direct full-name match gets highest priority
    if (cleanQuery.includes(nameNorm)) score += 10;

    // Evaluate keyword presence
    keywords.forEach(word => {
      if (nameNorm.includes(word)) score += 5;
      if (aliasesNorm.some(alias => alias.includes(word))) score += 4;
      if (categoryNorm.includes(word)) score += 2;
    });

    if (score > maxScore) {
      maxScore = score;
      bestMatch = loc;
    }
  }

  // Require a minimal confidence threshold
  if (bestMatch && maxScore >= 4) {
    return {
      answer: `${bestMatch.name} is located in the ${bestMatch.category} section. ${bestMatch.description}`,
      suggestedLocationId: bestMatch.id
    };
  }

  return {
    answer: `I couldn't locate "${userPrompt}" in the campus directory. Try typing the exact department name, e.g., "Faculty of Education" or "Library".`,
    suggestedLocationId: null
  };
}