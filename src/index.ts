import inquirer from 'inquirer';
import { checkAnkiConnect, getDecks, getCardsFromDeck } from './anki-connect.js';
import { viewCards, viewNotesList } from './card-viewer.js';
import { enhanceNotes, enhanceMultipleNotes } from './note-enhancer.js';
import { generateSentence } from './sentence-generator.js';
import { NoteInfo } from './types.js';

type MainMenuAction = 'select_deck' | 'exit';
type DeckMenuAction = 'view_cards' | 'view_notes' | 'enhance_notes' | 'enhance_multiple' | 'generate_sentence' | 'back';

async function showMainMenu(): Promise<MainMenuAction> {
    const { action } = await inquirer.prompt<{ action: MainMenuAction }>([
        {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                { name: 'Select a deck to work with', value: 'select_deck' },
                { name: 'Exit', value: 'exit' }
            ]
        }
    ]);
    return action;
}

async function selectDeck(decks: string[]): Promise<string> {
    const { selectedDeck } = await inquirer.prompt<{ selectedDeck: string }>([
        {
            type: 'list',
            name: 'selectedDeck',
            message: 'Select a deck:',
            choices: decks.map(deck => ({
                name: deck,
                value: deck
            }))
        }
    ]);
    return selectedDeck;
}

async function showDeckMenu(deckName: string): Promise<DeckMenuAction> {
    console.log(`\nWorking with deck: ${deckName}`);
    const { action } = await inquirer.prompt<{ action: DeckMenuAction }>([
        {
            type: 'list',
            name: 'action',
            message: 'What would you like to do with this deck?',
            choices: [
                { name: 'View cards (card by card)', value: 'view_cards' },
                { name: 'View notes (as list)', value: 'view_notes' },
                { name: 'Enhance single note with AI', value: 'enhance_notes' },
                { name: 'Enhance multiple notes with AI', value: 'enhance_multiple' },
                { name: 'Generate practice sentence', value: 'generate_sentence' },
                { name: 'Back to main menu', value: 'back' }
            ]
        }
    ]);
    return action;
}

async function main(): Promise<void> {
    try {
        console.log('Checking AnkiConnect connection...');
        await checkAnkiConnect();
        console.log('Successfully connected to AnkiConnect!\n');
        
        while (true) {
            const mainAction = await showMainMenu();
            
            if (mainAction === 'exit') {
                console.log('Goodbye!');
                break;
            }
            
            if (mainAction === 'select_deck') {
                const decks = await getDecks();
                const selectedDeck = await selectDeck(decks);
                
                while (true) {
                    const deckAction = await showDeckMenu(selectedDeck);
                    
                    if (deckAction === 'back') {
                        break;
                    }
                    
                    if (deckAction === 'view_cards') {
                        console.log('Loading cards...');
                        const cards = await getCardsFromDeck(selectedDeck);
                        await viewCards(cards);
                    } else if (deckAction === 'view_notes') {
                        console.log('Loading notes...');
                        const notes = await getCardsFromDeck(selectedDeck);
                        await viewNotesList(notes);
                    } else if (deckAction === 'enhance_notes') {
                        console.log('Loading notes...');
                        const notes = await getCardsFromDeck(selectedDeck);
                        await enhanceNotes(notes);
                    } else if (deckAction === 'enhance_multiple') {
                        console.log('Loading notes...');
                        const notes = await getCardsFromDeck(selectedDeck);
                        await enhanceMultipleNotes(notes);
                    } else if (deckAction === 'generate_sentence') {
                        console.log('Loading notes...');
                        const notes = await getCardsFromDeck(selectedDeck);
                        await generateSentence(notes);
                    }
                }
            }
        }
    } catch (error) {
        console.error('\nError:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

main();
