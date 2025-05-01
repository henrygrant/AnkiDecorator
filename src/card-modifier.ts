import inquirer from 'inquirer';
import { NoteInfo, KoreanAnkiCard } from './types.js';
import { updateNote, addTag, removeTag } from './anki-connect.js';

type ModifyOptionsFields = {
    type: boolean;
    examples: boolean;
    relatedWordsRules: boolean;
    conjugations: boolean;
    irregularRules: boolean;
    additionalRules: boolean;
    phonetics: boolean;
}

interface ModifyOptions extends Partial<ModifyOptionsFields> {
    addTags?: string[];
    removeTags?: string[];
}

export async function selectModificationOptions(): Promise<ModifyOptions> {
    const { options } = await inquirer.prompt<{ options: string[] }>([
        {
            type: 'checkbox',
            name: 'options',
            message: 'What information would you like to modify?',
            choices: [
                { name: 'Word Type (verb/noun/etc)', value: 'type' },
                { name: 'Example Sentences', value: 'examples' },
                { name: 'Related Words & Usage Rules', value: 'relatedWordsRules' },
                { name: 'Conjugations', value: 'conjugations' },
                { name: 'Irregular Rules', value: 'irregularRules' },
                { name: 'Additional Rules', value: 'additionalRules' },
                { name: 'Phonetics', value: 'phonetics' },
                { name: 'Manage Tags', value: 'tags' }
            ]
        }
    ]);

    const modifyOptions: ModifyOptions = {};

    // Set boolean flags for each selected option
    ['type', 'examples', 'relatedWordsRules', 'conjugations', 'irregularRules', 'additionalRules', 'phonetics'].forEach(option => {
        if (options.includes(option)) {
            (modifyOptions as any)[option] = true;
        }
    });

    if (options.includes('tags')) {
        const { tagAction } = await inquirer.prompt<{ tagAction: 'add' | 'remove' | 'both' }>([
            {
                type: 'list',
                name: 'tagAction',
                message: 'What would you like to do with tags?',
                choices: [
                    { name: 'Add new tags', value: 'add' },
                    { name: 'Remove existing tags', value: 'remove' },
                    { name: 'Both add and remove tags', value: 'both' }
                ]
            }
        ]);

        if (tagAction === 'add' || tagAction === 'both') {
            const { newTags } = await inquirer.prompt<{ newTags: string }>([
                {
                    type: 'input',
                    name: 'newTags',
                    message: 'Enter tags to add (space-separated):',
                    validate: (input: string) => input.trim().length > 0 || 'Please enter at least one tag'
                }
            ]);
            modifyOptions.addTags = newTags.split(' ').map(tag => tag.trim());
        }

        if (tagAction === 'remove' || tagAction === 'both') {
            const { tagsToRemove } = await inquirer.prompt<{ tagsToRemove: string }>([
                {
                    type: 'input',
                    name: 'tagsToRemove',
                    message: 'Enter tags to remove (space-separated):',
                    validate: (input: string) => input.trim().length > 0 || 'Please enter at least one tag'
                }
            ]);
            modifyOptions.removeTags = tagsToRemove.split(' ').map(tag => tag.trim());
        }
    }

    return modifyOptions;
}

export async function modifyNote(note: NoteInfo, options: ModifyOptions): Promise<void> {
    const updatedFields: Record<string, string> = {};
    
    if (options.type) {
        const { type } = await inquirer.prompt<{ type: KoreanAnkiCard['type'] }>([
            {
                type: 'list',
                name: 'type',
                message: `Select word type for "${note.fields['Front'].value}":`,
                choices: [
                    'verb',
                    'noun',
                    'adjective',
                    'adverb',
                    'conjunction',
                    'preposition',
                    'pronoun',
                    'other'
                ]
            }
        ]);
        updatedFields['Type'] = type;
    }

    if (options.examples) {
        const { examples } = await inquirer.prompt<{ examples: string }>([
            {
                type: 'input',
                name: 'examples',
                message: `Enter example sentences for "${note.fields['Front'].value}" (Korean and English):`,
                validate: (input: string) => input.trim().length > 0 || 'Examples cannot be empty'
            }
        ]);
        updatedFields['Examples'] = examples;
    }

    if (options.relatedWordsRules) {
        const { rules } = await inquirer.prompt<{ rules: string }>([
            {
                type: 'input',
                name: 'rules',
                message: `Enter related words and usage rules for "${note.fields['Front'].value}":`,
                validate: (input: string) => input.trim().length > 0 || 'Rules cannot be empty'
            }
        ]);
        updatedFields['Related Words/Rules'] = rules;
    }

    if (options.conjugations) {
        const { conjugations } = await inquirer.prompt<{ conjugations: string }>([
            {
                type: 'input',
                name: 'conjugations',
                message: `Enter conjugations for "${note.fields['Front'].value}":`,
                validate: (input: string) => input.trim().length > 0 || 'Conjugations cannot be empty'
            }
        ]);
        updatedFields['Conjugations'] = conjugations;
    }

    if (options.irregularRules) {
        const { rules } = await inquirer.prompt<{ rules: string }>([
            {
                type: 'input',
                name: 'rules',
                message: `Enter irregular rules for "${note.fields['Front'].value}":`,
                validate: (input: string) => input.trim().length > 0 || 'Rules cannot be empty'
            }
        ]);
        updatedFields['Irregular Rules'] = rules;
    }

    if (options.additionalRules) {
        const { rules } = await inquirer.prompt<{ rules: string }>([
            {
                type: 'input',
                name: 'rules',
                message: `Enter additional rules for "${note.fields['Front'].value}":`,
                validate: (input: string) => input.trim().length > 0 || 'Rules cannot be empty'
            }
        ]);
        updatedFields['Additional Rules'] = rules;
    }

    if (options.phonetics) {
        const { phonetics } = await inquirer.prompt<{ phonetics: string }>([
            {
                type: 'input',
                name: 'phonetics',
                message: `Enter phonetics for "${note.fields['Front'].value}":`,
                validate: (input: string) => input.trim().length > 0 || 'Phonetics cannot be empty'
            }
        ]);
        updatedFields['Phonetics'] = phonetics;
    }

    // Update fields if any were modified
    if (Object.keys(updatedFields).length > 0) {
        await updateNote(note.noteId, updatedFields);
    }

    // Handle tags
    if (options.addTags) {
        await addTag([note.noteId], options.addTags.join(' '));
    }
    if (options.removeTags) {
        await removeTag([note.noteId], options.removeTags.join(' '));
    }
}
