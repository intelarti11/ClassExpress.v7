
"use server";

import { suggestStyleOptions, type SuggestStyleOptionsInput, type SuggestStyleOptionsOutput } from '@/ai/flows/suggest-style-options';

export interface AIStyleSuggestion {
  backgroundImage: string;
  colorPalette: string[];
}

export async function getAIStyleSuggestions(message: string): Promise<AIStyleSuggestion | { error: string }> {
  if (!message.trim()) {
    return { error: "Message cannot be empty to generate AI styles." };
  }

  try {
    const input: SuggestStyleOptionsInput = { message };
    const result: SuggestStyleOptionsOutput = await suggestStyleOptions(input);
    return {
      backgroundImage: result.backgroundImage,
      colorPalette: result.colorPalette,
    };
  } catch (error) {
    console.error("Error fetching AI style suggestions:", error);
    return { error: "Failed to fetch AI style suggestions. Please try again." };
  }
}
