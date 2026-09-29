import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetchLocations } from './db';
import { Message } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

export async function getCampusAssistance(userPrompt: string, chatHistory: Message[]) {
  let locations: any[] = [];

  try {
    locations = await fetchLocations();
  } catch (dbErr) {
    console.warn('DelsuAI: Could not fetch locations from DB, proceeding with empty set.', dbErr);
  }

  if (!apiKey) {
    console.error('DelsuAI Error: VITE_GEMINI_API_KEY is missing.');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: `You are DelsuAI, an intelligent, friendly, and all-around helpful AI assistant for Delta State University (DELSU), Abraka.

YOUR CAPABILITIES:
1. General Conversation & Chat: Answer math, chit-chat, greetings, and general questions naturally.
2. DELSU History: DELSU was established on April 28, 1992, by Governor Felix Ibru. Motto: "Knowledge, Character, and Service". Main campus in Abraka (Campuses 1, 2, 3) and another in Oleh.
3. Campus Locations: Use this dataset to help users find locations: ${JSON.stringify(locations)}.

If recommending a specific location from the dataset, append "[LOCATION: location_id]" to the end of your response.`
    });

    let history = chatHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const firstUserIndex = history.findIndex(msg => msg.role === 'user');
    if (firstUserIndex !== -1) {
      history = history.slice(firstUserIndex);
    } else {
      history = [];
    }

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(userPrompt);
    let responseText = result.response.text();

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

    const lowerPrompt = userPrompt.toLowerCase();
    let fallbackText = "DelsuAI Assistant: Delta State University (DELSU), Abraka was established in 1992. You can search or select any facility from the interactive campus map.";
    let fallbackLocationId: string | null = null;

    if (lowerPrompt.includes("senate")) {
      fallbackText = "The Senate Building is located at Site 2, administrative block. It houses the Vice-Chancellor's office, Registrar, and principal officers.";
      fallbackLocationId = "senate";
    } else if (lowerPrompt.includes("library")) {
      fallbackText = "The Main University Library is located at Site 2, adjacent to the Faculty of Science.";
      fallbackLocationId = "library";
    } else if (lowerPrompt.includes("science")) {
      fallbackText = "The Faculty of Science is located at Site 2, housing computer science, chemistry, and physics departments.";
      fallbackLocationId = "science";
    }

    return {
      answer: fallbackText,
      suggestedLocationId: fallbackLocationId
    };
  }
}