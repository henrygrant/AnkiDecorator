export interface AnkiConnectResponse<T> {
    result: T;
    error: string | null;
}

export interface NoteInfo {
    noteId: number;
    modelName: string;
    tags: string[];
    fields: Record<string, { value: string; order: number }>;
}

export interface UpdateNoteFields {
    id: number;
    fields: Record<string, string>;
}

export type AnkiAction =
    | 'version'
    | 'deckNames'
    | 'modelNames'
    | 'findNotes'
    | 'notesInfo'
    | 'updateNoteFields'
    | 'addTags'
    | 'removeTags'
    | 'storeMediaFile';

export interface AnkiConnectRequest<T = unknown> {
    action: AnkiAction;
    version: number;
    params?: T;
}

export interface KoreanAnkiCard {
    front: string;            // Korean word
    back: string;            // English translation
    type: "verb" | "noun" | "adjective" | "adverb" | "conjunction" | "preposition" | "pronoun" | "other";
    examples?: string;        // Basic sentence examples
    relatedWordsRules?: string; // Usage rules in English
    conjugations?: string;    // Conjugations if applicable
    irregularRules?: string; // Irregular rules in Korean
    additionalRules?: string; // Other usage rules
    phonetics?: string;      // Pronunciation guide
    image?: string;         // Optional image URL
    audio?: string;         // Optional audio URL
}
