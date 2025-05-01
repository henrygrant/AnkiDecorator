# Anki Decorator

A tool to enhance Korean Anki cards using AnkiConnect and OpenAI. This tool helps you automatically generate additional information for your Korean language cards, such as phonetics, example sentences, related words, and grammar rules.

## Features

- View cards one by one with all fields
- View notes in a list format
- Enhance notes with AI-generated content:
  - Phonetics (English pronunciation guide)
  - Example sentences (Korean and English)
  - Related words and synonyms
  - Grammar rules and conjugations
  - Tag management (e.g., marking cards as "leech" for review)

## Prerequisites

1. [Anki](https://apps.ankiweb.net/) installed on your computer
2. [AnkiConnect](https://ankiweb.net/shared/info/2055492159) plugin installed in Anki
3. Node.js and npm installed
4. An OpenAI API key

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the template:
   ```bash
   cp .env.template .env
   ```
4. Add your OpenAI API key to the `.env` file:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
5. Build the project:
   ```bash
   npm run build
   ```

## Usage

1. Make sure Anki is running and AnkiConnect is properly installed
2. Start the tool:
   ```bash
   npm start
   ```
3. Select a deck to work with
4. Choose from the available actions:
   - View cards: Browse through cards one by one
   - View notes: See a list of all notes in the deck
   - Enhance notes with AI: Generate additional information for your cards

## Note Enhancement

The AI enhancement feature uses OpenAI's GPT-4 to generate helpful information for your Korean language cards:

1. Select "Enhance notes with AI" from the deck menu
2. Choose a note to enhance
3. Select which types of information you want to generate:
   - Phonetics
   - Example sentences
   - Related words
   - Grammar rules & conjugations
4. Optionally mark the card as a "leech" for review
5. The tool will generate the requested information and update your Anki card

## Development

- `npm run build`: Build the TypeScript code
- `npm run dev`: Watch for changes and rebuild
- `npm run clean`: Remove build artifacts
