import OpenAI from 'openai';
import { config } from 'dotenv';
import { KoreanAnkiCard } from './types.js';

config();

if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set in environment variables');
}
if (!process.env.OPENROUTER_BASE_URL) {
    throw new Error('OPENROUTER_BASE_URL is not set in environment variables');
}

const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: process.env.OPENROUTER_BASE_URL
});

export async function generateKoreanCardFields(korean: string, english: string): Promise<Partial<KoreanAnkiCard>> {
    const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
            {
                role: "system",
                content: "You are a Korean language teaching assistant. Provide concise, accurate information about Korean words. Format phonetics clearly for English speakers. Keep examples simple and beginner-friendly. Always provide complete sentences for examples."
            },
            {
                role: "user",
                content: `Generate detailed information for the Korean word "${korean}" (meaning: "${english}").`
            }
        ],
        tools: [
            {
                type: "function",
                function: {
                    name: "generateKoreanCardInfo",
                    description: "Generate structured information for a Korean vocabulary card",
                    parameters: {
                        type: "object",
                        required: ["type"],
                        properties: {
                            type: {
                                type: "string",
                                enum: ["verb", "noun", "adjective", "adverb", "conjunction", "preposition", "pronoun", "other"],
                                description: "The part of speech of the word"
                            },
                            examples: {
                                type: "string",
                                description: "2-3 simple beginner-level sentences using the word (both Korean and English)"
                            },
                            relatedWordsRules: {
                                type: "string",
                                description: "Usage rules and related words in English"
                            },
                            conjugations: {
                                type: "string",
                                description: "Common conjugations if it's a verb or adjective (like past, present, future, etc.)"
                            },
                            irregularRules: {
                                type: "string",
                                description: "Any irregular patterns or rules when using this word in Korean"
                            },
                            additionalRules: {
                                type: "string",
                                description: "Any other important usage rules or notes"
                            },
                            phonetics: {
                                type: "string",
                                description: "How to pronounce the word using English characters"
                            }
                        }
                    }
                }
            }
        ],
        tool_choice: {
            type: "function",
            function: { name: "generateKoreanCardInfo" }
        },
        temperature: 0.7,
    });

    try {
        const toolCall = response.choices[0]?.message?.tool_calls?.[0];
        if (!toolCall?.function?.arguments) {
            throw new Error('No tool call in response');
        }

        const result = JSON.parse(toolCall.function.arguments) as Partial<KoreanAnkiCard>;

        // Ensure we don't return front, back, image, or audio fields
        const { front, back, image, audio, ...rest } = result;
        return rest;
    } catch (error) {
        console.error('Error parsing OpenAI response:', error);
        throw new Error('Failed to generate card fields');
    }
}
