import inquirer from "inquirer";
import { NoteInfo } from "./types.js";
import { updateNote, addTag } from "./anki-connect.js";
import { generateKoreanCardFields } from "./openai-service.js";

interface EnhanceOptions {
  generateType: boolean;
  generateExamples: boolean;
  generateRelatedWordsRules: boolean;
  generateConjugations: boolean;
  generateIrregularRules: boolean;
  generateAdditionalRules: boolean;
  generatePhonetics: boolean;
  addLeechTag: boolean;
}

export async function selectEnhanceOptions(): Promise<EnhanceOptions> {
  const { options } = await inquirer.prompt<{ options: string[] }>([
    {
      type: "checkbox",
      name: "options",
      message: "What information would you like to generate?",
      choices: [
        { name: "Word Type (verb/noun/etc)", value: "type", checked: true },
        { name: "Example Sentences", value: "examples", checked: true },
        {
          name: "Related Words & Usage Rules",
          value: "relatedWordsRules",
          checked: true,
        },
        { name: "Conjugations", value: "conjugations", checked: true },
        { name: "Irregular Rules", value: "irregularRules", checked: true },
        { name: "Additional Rules", value: "additionalRules", checked: true },
        { name: "Phonetics", value: "phonetics", checked: true },
        { name: 'Add "leech" tag for review', value: "leech" },
      ],
    },
  ]);

  return {
    generateType: options.includes("type"),
    generateExamples: options.includes("examples"),
    generateRelatedWordsRules: options.includes("relatedWordsRules"),
    generateConjugations: options.includes("conjugations"),
    generateIrregularRules: options.includes("irregularRules"),
    generateAdditionalRules: options.includes("additionalRules"),
    generatePhonetics: options.includes("phonetics"),
    addLeechTag: options.includes("leech"),
  };
}

export async function enhanceNote(
  note: NoteInfo,
  options: EnhanceOptions
): Promise<void> {
  const front = note.fields["Front"].value;
  const back = note.fields["Back"].value;

  console.log(`\nEnhancing note: ${front} (${back})`);
  console.log("Generating information using OpenAI...");

  try {
    const generatedInfo = await generateKoreanCardFields(front, back);
    const updatedFields: Record<string, string> = {};

    if (options.generateType && generatedInfo.type) {
      updatedFields["Type"] = generatedInfo.type;
    }

    if (options.generatePhonetics && generatedInfo.phonetics) {
      updatedFields["Phonetics"] = generatedInfo.phonetics;
    }

    if (options.generateExamples && generatedInfo.examples) {
      updatedFields["Examples"] = generatedInfo.examples;
    }

    if (options.generateRelatedWordsRules && generatedInfo.relatedWordsRules) {
      updatedFields["Related Words/Rules"] = generatedInfo.relatedWordsRules;
    }

    if (options.generateConjugations && generatedInfo.conjugations) {
      updatedFields["Conjugations"] = generatedInfo.conjugations;
    }

    if (options.generateIrregularRules && generatedInfo.irregularRules) {
      updatedFields["Irregular Rules"] = generatedInfo.irregularRules;
    }

    if (options.generateAdditionalRules && generatedInfo.additionalRules) {
      updatedFields["Additional Rules"] = generatedInfo.additionalRules;
    }

    // Update the note with generated information
    if (Object.keys(updatedFields).length > 0) {
      await updateNote(note.noteId, updatedFields);
    }

    // Add leech tag if requested
    if (options.addLeechTag) {
      await addTag([note.noteId], "leech");
    }

    console.log("✓ Note enhanced successfully!");
  } catch (error) {
    throw new Error(
      `Failed to enhance note: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function enhanceNotes(notes: NoteInfo[]): Promise<void> {
  if (notes.length === 0) {
    console.log("No notes found in this deck.");
    return;
  }

  while (true) {
    console.clear();
    console.log(`Total notes: ${notes.length}\n`);

    const { selectedNote } = await inquirer.prompt<{
      selectedNote: number | "back";
    }>([
      {
        type: "list",
        name: "selectedNote",
        message: "Select a note to enhance (or back to return):",
        choices: [
          ...notes.map((note, index) => {
            const front = note.fields["Front"].value;
            const back = note.fields["Back"].value;
            return {
              name: `${index + 1}. Front: ${front} | Back: ${back}`,
              value: index,
            };
          }),
          { name: "Back to deck menu", value: "back" },
        ],
      },
    ]);

    if (selectedNote === "back") {
      console.clear();
      break;
    }

    const note = notes[selectedNote];
    console.clear();
    console.log(
      `Selected note: Front: ${note.fields["Front"].value} | Back: ${note.fields["Back"].value}`
    );
    console.log("Current tags:", note.tags.join(", ") || "No tags");
    console.log();

    const options = await selectEnhanceOptions();
    try {
      await enhanceNote(note, options);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Show success message
    } catch (error) {
      console.error(
        "\nError:",
        error instanceof Error ? error.message : String(error)
      );
      await inquirer.prompt([
        {
          type: "input",
          name: "continue",
          message: "Press Enter to continue...",
        },
      ]);
    }
  }
}

export async function enhanceMultipleNotes(notes: NoteInfo[]): Promise<void> {
  if (notes.length === 0) {
    console.log("No notes selected.");
    return;
  }

  // First, let user select which notes to enhance
  const { selectedNotes } = await inquirer.prompt<{ selectedNotes: number[] }>([
    {
      type: "checkbox",
      name: "selectedNotes",
      message: "Select notes to enhance:",
      choices: notes.reverse().map((note, index) => ({
        name: `${index + 1}. Front: ${note.fields["Front"].value} | Back: ${
          note.fields["Back"].value
        }`,
        value: index,
        checked: !note.fields["Examples"]?.value, // Default to checked if 'Examples' field is not present, as I never do that manually
      })),
    },
  ]);

  if (selectedNotes.length === 0) {
    console.log("No notes selected for enhancement.");
    return;
  }

  // Then, let user select which fields to generate
  console.log(`\nSelected ${selectedNotes.length} notes for enhancement.`);
  const options = await selectEnhanceOptions();

  // Process notes with progress tracking
  console.log("\nEnhancing notes...");
  let completed = 0;
  const errors: Array<{ note: NoteInfo; error: string }> = [];

  for (const index of selectedNotes) {
    const note = notes[index];
    try {
      process.stdout.write(
        `\rProcessing note ${completed + 1}/${selectedNotes.length}: ${
          note.fields["Front"].value
        }`
      );
      await enhanceNote(note, options);
      completed++;
    } catch (error) {
      errors.push({
        note,
        error: error instanceof Error ? error.message : String(error),
      });
      process.stdout.write("\n");
      console.error(
        `Error enhancing note ${note.fields["Front"].value}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  // Final summary
  process.stdout.write("\n\n"); // Clear the progress line
  console.log("Enhancement complete!");
  console.log(
    `Successfully enhanced: ${completed}/${selectedNotes.length} notes`
  );

  if (errors.length > 0) {
    console.log("\nErrors occurred while processing these notes:");
    errors.forEach(({ note, error }) => {
      console.log(`- ${note.fields["Front"].value}: ${error}`);
    });
  }
}
