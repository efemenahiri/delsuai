import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetchLocations } from './db';
import { Message } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Stop words to filter out during location search
const STOP_WORDS = new Set([
  'where', 'is', 'the', 'of', 'at', 'in', 'to', 'faculty', 'department',
  'building', 'find', 'locate', 'show', 'me', 'how', 'get', 'delsu', 'could', 'you', 'direct',
  'can', 'please', 'tell', 'way', 'going', 'doing'
]);

export async function getCampusAssistance(userPrompt: string, chatHistory: Message[]) {
  // Fetch real-time campus dataset from Supabase
  const locations = await fetchLocations();

  // 1. Primary Engine: Live Gemini API
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
        systemInstruction: `You are DelsuAI, a friendly and intelligent campus guide for Delta State University (DELSU), Abraka. 
        Handle all greetings, small talk, pleasantries, and general chit-chat warmly and naturally.
        When users ask for locations or directions, reference the provided campus dataset to give accurate guidance.
        
        Campus Locations Dataset:
        ${JSON.stringify(locations)}`
      });

      const formattedHistory = chatHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const chat = model.startChat({ history: formattedHistory });

      const prompt = `User Query: "${userPrompt}". 
      Respond strictly with a JSON object:
      {
        "answer": "Your natural, helpful response here.",
        "suggestedLocationId": "Matching location ID string from dataset or null"
      }`;

      const result = await chat.sendMessage(prompt);
      const parsed = JSON.parse(result.response.text());

      return {
        answer: parsed.answer,
        suggestedLocationId: parsed.suggestedLocationId || null
      };
    } catch (error) {
      console.warn('Gemini API request failed. Falling back to universal local engine:', error);
    }
  }

  // 2. Secondary Engine: Universal Local Intent & Pattern Classifier
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const cleanQuery = normalize(userPrompt);

  // Intent: Universal Greeting Matcher
  const isGreeting = /^(h[ea]+ll?o+|h+i+|h+e+y+|h+e+y+a|sup|w+a+s+u+p+|h+o+w+f+a+r?|yo+|greetings|good\s*(morning|afternoon|evening))/i.test(cleanQuery);

  // Intent: Gratitude & Pleasantries
  const isGratitudeOrPleasantry = /^(th+a+n+k+s?|thx|cool|awesome|great|ok|okay|alright|how\s*are\s*you|how\s*is\s*your\s*day)/i.test(cleanQuery);

  if (isGreeting) {
    return {
      answer: "Hey there! 👋 I'm ready to guide you around DELSU Abraka. What location or department are you looking for today?",
      suggestedLocationId: null
    };
  }

  if (isGratitudeOrPleasantry) {
    return {
      answer: "Always happy to help! 😊 Let me know whenever you need directions to another campus location.",
      suggestedLocationId: null
    };
  }

  // Intent: Campus Location Keyword Search (Queries Supabase data array)
  const keywords = cleanQuery.split(/\s+/).filter(word => word.length > 1 && !STOP_WORDS.has(word));

  let bestMatch = null;
  let maxScore = 0;

  for (const loc of locations) {
    let score = 0;
    const nameNorm = normalize(loc.name);
    const categoryNorm = normalize(loc.category);
    const aliasesNorm = (loc.aliases || []).map(normalize);

    if (cleanQuery.includes(nameNorm)) score += 10;

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

  if (bestMatch && maxScore >= 3) {
    return {
      answer: `📍 **${bestMatch.name}** is located in the ${bestMatch.category} area.\n\n${bestMatch.description}\n\nTap below to center it on your map!`,
      suggestedLocationId: bestMatch.id
    };
  }

  // Fallback for unrecognized queries
  return {
    answer: `I couldn't locate "${userPrompt}" in the campus directory. Try typing the exact department name, e.g., "Faculty of Education" or "Library".`,
    suggestedLocationId: null
  };
}