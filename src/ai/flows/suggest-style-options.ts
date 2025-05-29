'use server';

/**
 * @fileOverview Suggests background images and color palettes based on the message content.
 *
 * - suggestStyleOptions - A function that suggests style options for the message card.
 * - SuggestStyleOptionsInput - The input type for the suggestStyleOptions function.
 * - SuggestStyleOptionsOutput - The return type for the suggestStyleOptions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestStyleOptionsInputSchema = z.object({
  message: z.string().describe('The text content of the message card.'),
});
export type SuggestStyleOptionsInput = z.infer<typeof SuggestStyleOptionsInputSchema>;

const SuggestStyleOptionsOutputSchema = z.object({
  backgroundImage: z
    .string()
    .describe(
      "A suggested background image for the message card, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  colorPalette: z
    .array(z.string())
    .describe('A suggested color palette for the message card, as an array of color hex codes.'),
});
export type SuggestStyleOptionsOutput = z.infer<typeof SuggestStyleOptionsOutputSchema>;

export async function suggestStyleOptions(input: SuggestStyleOptionsInput): Promise<SuggestStyleOptionsOutput> {
  return suggestStyleOptionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestStyleOptionsPrompt',
  input: {schema: SuggestStyleOptionsInputSchema},
  output: {schema: SuggestStyleOptionsOutputSchema},
  prompt: `You are a creative design assistant. Based on the content of the message below, suggest a background image and a color palette that would make the message card visually appealing.

Message: {{{message}}}

Output the background image as a data URI and the color palette as an array of hex codes.

Consider the message content when suggesting the background image and color palette. For example, a message about nature might suggest a nature-themed background image and a color palette of greens and browns.`,
});

const suggestStyleOptionsFlow = ai.defineFlow(
  {
    name: 'suggestStyleOptionsFlow',
    inputSchema: SuggestStyleOptionsInputSchema,
    outputSchema: SuggestStyleOptionsOutputSchema,
  },
  async input => {
    // Generate background image
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: [`Generate a background image that complements the following message: ${input.message}`],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    const {output} = await prompt({
      ...input,
      backgroundImage: media.url,
    });
    return {
      backgroundImage: media.url,
      colorPalette: output!.colorPalette,
    };
  }
);
