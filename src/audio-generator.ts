import { generateAudio } from './elevenlabs-service.js';
import { updateNote } from './anki-connect.js';
import { NoteInfo } from './types.js';
import { storeMediaFile } from './anki-connect.js';

export class AudioGenerator {

  async generateAudioForNote(note: NoteInfo): Promise<void> {
    try {
      const koreanText = note.fields.Front?.value;
      if (!koreanText) {
        console.log('No Korean text found in note');
        return;
      }

      console.log('Generating audio for:', koreanText);
      const audioPath = await generateAudio(koreanText);

      // Create a filename based on the note ID and text
      const filename = `note_${note.noteId}_${Date.now()}.mp3`;

      // Store audio file in Anki
      await storeMediaFile(filename, audioPath);

      // Update the note's audio field with the sound tag
      const soundTag = `[sound:${filename}]`;
      await updateNote(note.noteId, {
        Audio: soundTag
      });

      console.log('Successfully added audio to note');
    } catch (error) {
      console.error('Failed to generate audio:', error);
      throw error;
    }
  }

  async generateAudioForNotes(notes: NoteInfo[]): Promise<void> {
    for (const note of notes) {
      await this.generateAudioForNote(note);
    }
  }
}
