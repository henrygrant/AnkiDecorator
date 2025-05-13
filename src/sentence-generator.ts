import { NoteInfo } from './types.js';
import OpenAI from 'openai';
import { config } from 'dotenv';

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

export async function generateSentence(notes: NoteInfo[]): Promise<void> {
    if (notes.length === 0) {
        console.log('No notes found in this deck.');
        return;
    }

    // Get Korean words from the notes
    const words = notes.map(note => ({
        korean: note.fields['Front'].value,
        english: note.fields['Back'].value
    }));

    // Select 10 random words for the AI to choose from
    const candidateWords = selectRandomWords(words, 10);

    try {
        // First, let the AI select 3-4 words that work well together
        const wordSelection = await selectRelatedWords(candidateWords);
        
        console.log('\nSelected words that work well together:');
        wordSelection.forEach(word => {
            console.log(`- ${word.korean} (${word.english})`);
        });

        // Then generate a sentence using those words
        const sentence = await createSentence(wordSelection);
        console.log('\nGenerated sentence:');
        console.log('Korean:', sentence.korean);
        console.log('English:', sentence.english);
        console.log('Grammar notes:', sentence.grammarNotes);
    } catch (error) {
        console.error('\nError:', error instanceof Error ? error.message : String(error));
    }
}

function selectRandomWords(words: Array<{ korean: string; english: string }>, count: number): Array<{ korean: string; english: string }> {
    const shuffled = [...words].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, words.length));
}

interface GeneratedSentence {
    korean: string;
    english: string;
    grammarNotes: string;
}

async function selectRelatedWords(words: Array<{ korean: string; english: string }>): Promise<Array<{ korean: string; english: string }>> {
    const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
            {
                role: "system",
                content: "You are a Korean language teaching assistant. Select 3-4 words that can naturally be used together in a simple, practical sentence."
            },
            {
                role: "user",
                content: `Here are some Korean words:\n${words.map(w => `${w.korean} (${w.english})`).join('\n')}\n\nSelect 3-4 of these words that could naturally be used together in a beginner-friendly sentence.`
            }
        ],
        tools: [
            {
                type: "function",
                function: {
                    name: "selectWords",
                    description: "Select words that can be naturally used together",
                    parameters: {
                        type: "object",
                        required: ["selectedIndices"],
                        properties: {
                            selectedIndices: {
                                type: "array",
                                items: { type: "integer" },
                                description: "Indices of the selected words (0-based)"
                            },
                            reason: {
                                type: "string",
                                description: "Brief explanation of why these words work well together"
                            }
                        }
                    }
                }
            }
        ],
        tool_choice: {
            type: "function",
            function: { name: "selectWords" }
        },
        temperature: 0.7
    });

    const toolCall = response.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
        throw new Error('No word selection from OpenAI');
    }

    const result = JSON.parse(toolCall.function.arguments);
    if (!result.selectedIndices || !Array.isArray(result.selectedIndices)) {
        throw new Error('Invalid word selection format');
    }

    // Log the reason if provided
    if (result.reason) {
        console.log('\nSelection reasoning:', result.reason);
    }

    // Return the selected words
    return result.selectedIndices
        .map((i: number) => words[i])
        .filter((word: { korean: string; english: string } | undefined) => word !== undefined); // Filter out any invalid indices
}

async function createSentence(words: Array<{ korean: string; english: string }>): Promise<GeneratedSentence> {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a Korean language teaching assistant. Generate natural, beginner-friendly Korean sentences using the provided words. Keep sentences simple and practical."
                },
                {
                    role: "user",
                    content: `Create a Korean sentence using these words: ${words.map(w => `${w.korean} (${w.english})`).join(', ')}.
The sentence should be suitable for beginner-intermediate learners.`
                }
            ],
            tools: [
                {
                    type: "function",
                    function: {
                        name: "generateSentence",
                        description: "Generate a Korean sentence with translation and grammar notes",
                        parameters: {
                            type: "object",
                            required: ["korean", "english", "grammarNotes"],
                            properties: {
                                korean: {
                                    type: "string",
                                    description: "The Korean sentence using the provided words"
                                },
                                english: {
                                    type: "string",
                                    description: "English translation of the Korean sentence"
                                },
                                grammarNotes: {
                                    type: "string",
                                    description: "Brief notes explaining the grammar used in the sentence"
                                }
                            }
                        }
                    }
                }
            ],
            tool_choice: {
                type: "function",
                function: { name: "generateSentence" }
            },
            temperature: 0.7
        });

        if (!response.choices || response.choices.length === 0) {
            throw new Error('No choices in OpenAI response');
        }

        const toolCall = response.choices[0]?.message?.tool_calls?.[0];
        if (!toolCall?.function?.arguments) {
            throw new Error('No tool call in response');
        }

        const result = JSON.parse(toolCall.function.arguments) as GeneratedSentence;
        if (!result.korean || !result.english || !result.grammarNotes) {
            throw new Error('Response missing required fields');
        }

        return result;
    } catch (error) {
        console.error('Error in generateKoreanSentence:', error);
        throw error;
    }
}
