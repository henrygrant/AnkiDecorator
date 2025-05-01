import inquirer from 'inquirer';
import { NoteInfo } from './types.js';

interface CardField {
    name: string;
    value: string;
}

function getDisplayFields(note: NoteInfo): CardField[] {
    return Object.entries(note.fields).map(([name, field]) => ({
        name,
        value: field.value
    }));
}

export async function viewCards(cards: NoteInfo[]): Promise<void> {
    if (cards.length === 0) {
        console.log('No cards found in this deck.');
        return;
    }

    let currentIndex = 0;
    
    while (true) {
        const card = cards[currentIndex];
        const fields = getDisplayFields(card);

        console.clear();
        console.log(`Card ${currentIndex + 1} of ${cards.length}`);
        console.log('Tags:', card.tags.join(', ') || 'No tags');
        console.log('\nFields:');
        fields.forEach(field => {
            console.log(`\n${field.name}:`);
            console.log(field.value);
        });

        const { action } = await inquirer.prompt<{ action: 'prev' | 'next' | 'back' }>([
            {
                type: 'list',
                name: 'action',
                message: 'Navigation:',
                choices: [
                    { name: 'Previous card', value: 'prev', disabled: currentIndex === 0 },
                    { name: 'Next card', value: 'next', disabled: currentIndex === cards.length - 1 },
                    { name: 'Back to deck menu', value: 'back' }
                ]
            }
        ]);

        if (action === 'back') {
            console.clear();
            break;
        }

        if (action === 'prev' && currentIndex > 0) {
            currentIndex--;
        } else if (action === 'next' && currentIndex < cards.length - 1) {
            currentIndex++;
        }
    }
}

export async function viewNotesList(notes: NoteInfo[]): Promise<void> {
    if (notes.length === 0) {
        console.log('No notes found in this deck.');
        return;
    }

    while (true) {
        console.clear();
        console.log(`Total notes: ${notes.length}\n`);

        const { selectedNote } = await inquirer.prompt<{ selectedNote: number | 'back' }>([
            {
                type: 'list',
                name: 'selectedNote',
                message: 'Select a note to view details (or back to return):',
                choices: [
                    ...notes.map((note, index) => {
                        const fields = getDisplayFields(note);
                        const preview = fields.map(f => `${f.name}: ${f.value.substring(0, 30)}`).join(' | ');
                        return {
                            name: `${index + 1}. ${preview}...`,
                            value: index
                        };
                    }),
                    { name: 'Back to deck menu', value: 'back' }
                ]
            }
        ]);

        if (selectedNote === 'back') {
            console.clear();
            break;
        }

        // Show detailed view of the selected note
        const note = notes[selectedNote];
        const fields = getDisplayFields(note);

        console.clear();
        console.log(`Note ${selectedNote + 1} of ${notes.length}`);
        console.log('Tags:', note.tags.join(', ') || 'No tags');
        console.log('\nFields:');
        fields.forEach(field => {
            console.log(`\n${field.name}:`);
            console.log(field.value);
        });

        await inquirer.prompt<{ action: 'back' }>([
            {
                type: 'list',
                name: 'action',
                message: 'Navigation:',
                choices: [
                    { name: 'Back to notes list', value: 'back' }
                ]
            }
        ]);
    }
}
