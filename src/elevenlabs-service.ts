import fs from "fs";
import os from "os";
import path from "path";
import { ElevenLabsClient } from "elevenlabs";
import stream from "stream";

const API_KEY = process.env.ELEVEN_API_KEY;
const VOICE_ID = process.env.ELEVEN_VOICE_ID;
const MODEL_ID = process.env.ELEVEN_MODEL_ID;

const elevenlabs = new ElevenLabsClient({
  apiKey: API_KEY,
});

export async function generateAudio(text: string): Promise<string> {
  if (!API_KEY || !VOICE_ID || !MODEL_ID) {
    console.error("ElevenLabs API Key:", API_KEY);
    console.error("ElevenLabs Voice ID:", VOICE_ID);
    console.error("ElevenLabs Model ID:", MODEL_ID);
    throw new Error(
      "ElevenLabs configuration is not complete. Please check your .env file."
    );
  }

  const tempDir = os.tmpdir();
  const tempFilePath = path.join(tempDir, `elevenlabs_${Date.now()}.mp3`);

  try {
    const audio = await elevenlabs.textToSpeech.convert(VOICE_ID, {
      model_id: MODEL_ID,
      text: text,
    });

    // Check if the audio is a ReadableStream
    if ((audio as unknown) instanceof ReadableStream) {
      const nodeStream = stream.Readable.fromWeb(audio as any);
      return new Promise((resolve, reject) => {
        const fileWriteStream = fs.createWriteStream(tempFilePath);

        fileWriteStream.on("error", (error: Error) => {
          reject(error);
        });

        fileWriteStream.on("finish", () => {
          resolve(tempFilePath);
        });

        nodeStream.pipe(fileWriteStream);

        nodeStream.on("error", (error: Error) => {
          reject(error);
        });
      });
    } else if (audio instanceof Buffer || audio instanceof ArrayBuffer) {
      // If it's a Buffer or ArrayBuffer, write it directly to the file
      await fs.promises.writeFile(tempFilePath, audio);
      return tempFilePath;
    } else {
      throw new Error("Unsupported audio format returned from ElevenLabs API.");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate audio: ${errorMessage}`);
  }
}
