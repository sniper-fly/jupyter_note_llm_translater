import { translateNotebook } from "./translateNotebook";
import { readdir } from "fs/promises";
import { join } from "path";
import logger from './logger';

async function cmdExec() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];

  if (!inputPath || !outputPath) {
    console.error("Usage: tsx main.ts <input-file> <output-file>");
    process.exit(1);
  }

  await translateNotebook(inputPath, outputPath).catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

// Execute translation
async function main() {
  const notesDir = "notes";
  const outputDir = "output";

  try {
    const files = await readdir(notesDir);
    for (const file of files) {
      const inputPath = join(notesDir, file);
      const outputPath = join(outputDir, file);
      
      logger.info('Processing file', { 
        file,
        inputPath,
        outputPath 
      });
      await translateNotebook(inputPath, outputPath);
    }

    logger.info('Batch translation completed successfully');
  } catch (error) {
    logger.error('Batch processing failed', { error });
    process.exit(1);
  }
}

(async () => {
  await main();
})();
