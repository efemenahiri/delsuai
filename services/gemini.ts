import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetchLocations } from './db';
import { Message } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

export async function getCampusAssistance(userPrompt: string, chatHistory: Message[]) {
  if (!apiKey) {
    console.error('DelsuAI Error: VITE_GEMINI_API_KEY is missing.');
  }

  try {
    const locations = await fetchLocations();
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      systemInstruction: `You are DelsuAI, an intelligent, friendly, and all-around helpful AI assistant for Delta State University (DELSU), Abraka.

YOUR CAPABILITIES:
1. General Conversation & Chat: Answer math, chit-chat, greetings, and general questions naturally.
2. DELSU History: DELSU was established on April 28, 1992, by Governor Felix Ibru. Motto: "Knowledge, Character, and Service". Main campus in Abraka (Campuses 1, 2, 3) and another in Oleh.
3. Campus Locations: Use this dataset to help users find locations: ${JSON.stringify(locations)}.

If recommending a specific location from the dataset, append "[LOCATION: location_id]" to the end of your response.`
    });

    // Format chat history properly
    let history = chatHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // FIX: Ensure history starts with a 'user' message
    const firstUserIndex = history.findIndex(msg => msg.role === 'user');
    if (firstUserIndex !== -1) {
      history = history.slice(firstUserIndex);
    } else {
      history = []; // Clear history if there are no user messages yet
    }

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(userPrompt);
    let responseText = result.response.text();

    // Parse location tag if returned
    let suggestedLocationId: string | null = null;
    const locationMatch = responseText.match(/\[LOCATION:\s*([a-zA-Z0-9_-]+)\]/);
    if (locationMatch) {
      suggestedLocationId = locationMatch[1];
      responseText = responseText.replace(/\[LOCATION:\s*([a-zA-Z0-9_-]+)\]/, '').trim();
    }

    return {
      answer: responseText,
      suggestedLocationId
    };
  } catch (error) {
    console.error('Gemini Execution Error:', error);
    return {
      answer: "I had trouble reaching the AI server. Please check the browser console for details.",
      suggestedLocationId: null
    };
  }
}