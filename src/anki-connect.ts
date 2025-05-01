import fetch, { AbortError } from 'node-fetch';
import type { AnkiAction, AnkiConnectRequest, AnkiConnectResponse, NoteInfo, UpdateNoteFields } from './types.js';

const ANKI_CONNECT_URL = 'http://localhost:8765';
const TIMEOUT_MS = 5000;

export class AnkiConnectError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AnkiConnectError';
    }
}

export async function checkAnkiConnect(): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const response = await fetch(ANKI_CONNECT_URL, {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'version',
                version: 6
            })
        });

        clearTimeout(timeoutId);
        return true;
    } catch (error) {
        if (error instanceof AbortError) {
            throw new AnkiConnectError(
                'Connection to AnkiConnect timed out. Please ensure:\n' +
                '1. Anki is running\n' +
                '2. AnkiConnect add-on is installed (Tools > Add-ons > Get Add-ons > Code: 2055492159)\n' +
                '3. Anki has been restarted after installing AnkiConnect'
            );
        }
        throw new AnkiConnectError(`Failed to connect to AnkiConnect: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function invokeAnkiConnect<T>(
    action: AnkiAction,
    params: unknown = {},
    retries = 2
): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

            const request: AnkiConnectRequest = {
                action,
                version: 6,
                params
            };

            const response = await fetch(ANKI_CONNECT_URL, {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request)
            });

            clearTimeout(timeoutId);
            const result = await response.json() as AnkiConnectResponse<T>;
            
            if (result.error) {
                throw new AnkiConnectError(`AnkiConnect error: ${result.error}`);
            }
            return result.result;
        } catch (error) {
            if (attempt === retries) {
                throw error instanceof Error ? error : new Error(String(error));
            }
            // Wait 1 second before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    // This should never happen due to the throw in the loop
    throw new Error('Unexpected error in invokeAnkiConnect');
}

export async function getDecks(): Promise<string[]> {
    return invokeAnkiConnect<string[]>('deckNames');
}

export async function findNotesInDeck(deckName: string): Promise<number[]> {
    const query = `deck:"${deckName}"`;
    return invokeAnkiConnect<number[]>('findNotes', { query });
}

export async function getNotesInfo(noteIds: number[]): Promise<NoteInfo[]> {
    return invokeAnkiConnect<NoteInfo[]>('notesInfo', { notes: noteIds });
}

export async function getCardsFromDeck(deckName: string): Promise<NoteInfo[]> {
    const noteIds = await findNotesInDeck(deckName);
    if (noteIds.length === 0) {
        return [];
    }
    return getNotesInfo(noteIds);
}

export async function updateNote(noteId: number, fields: Record<string, string>): Promise<void> {
    await invokeAnkiConnect<void>('updateNoteFields', {
        note: {
            id: noteId,
            fields
        }
    });
}

export async function addTag(noteIds: number[], tag: string): Promise<void> {
    await invokeAnkiConnect<void>('addTags', {
        notes: noteIds,
        tags: tag
    });
}

export async function removeTag(noteIds: number[], tag: string): Promise<void> {
    await invokeAnkiConnect<void>('removeTags', {
        notes: noteIds,
        tags: tag
    });
}
