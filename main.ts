import { openAIClient } from "./openAIClient";
import * as fs from "fs/promises";
import "dotenv/config";

// Types for Jupyter notebook structure
interface NotebookCell {
  cell_type: string;
  source: string[];
  metadata?: any;
  execution_count?: number | null;
  outputs?: any[];
}

interface JupyterNotebook {
  cells: NotebookCell[];
  metadata: any;
  nbformat: number;
  nbformat_minor: number;
}

// Helper function to concatenate cell source
function concatenateSource(source: string[]): string {
  return source.join("");
}

// Function to translate text using OpenAI API
async function translateText(text: string): Promise<string> {
  try {
    const completion = await openAIClient.chat.completions.create({
      model: "o1-mini-2024-09-12",
      messages: [
        {
          role: "assistant",
          content:
            "You are a professional translator. Translate the following text to Japanese, preserving any code blocks and markdown formatting.",
        },
        { role: "user", content: text },
      ],
    });

    return completion.choices[0].message.content || "";
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
}

// Function to process a single cell
async function processCell(cell: NotebookCell): Promise<NotebookCell> {
  try {
    // Skip translation for code cells
    if (cell.cell_type === "code") {
      return cell;
    }

    const originalText = concatenateSource(cell.source);
    const translatedText = await translateText(originalText);

    return {
      ...cell,
      source: (translatedText.match(/[^\n]*\n|[^\n]+/g) || []) as string[],
    };
  } catch (error) {
    console.error("Cell processing error:", error);
    throw error;
  }
}

// Main function to process notebook
async function translateNotebook(
  inputPath: string,
  outputPath: string
): Promise<void> {
  try {
    // Read and parse input file
    const fileContent = await fs.readFile(inputPath, "utf8");
    const notebook: JupyterNotebook = JSON.parse(fileContent);

    // Process each cell
    const translatedCells = await Promise.all(
      notebook.cells.map((cell) => processCell(cell))
    );

    // Create new notebook with translated cells
    const translatedNotebook: JupyterNotebook = {
      ...notebook,
      cells: translatedCells,
    };

    // Write output file
    await fs.writeFile(
      outputPath,
      JSON.stringify(translatedNotebook, null, 2),
      "utf8"
    );

    console.log("Translation completed successfully");
  } catch (error) {
    console.error("Notebook translation error:", error);
    throw error;
  }
}

// Execute translation
async function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];

  if (!inputPath || !outputPath) {
    console.error("Usage: tsx main.ts <input-file> <output-file>");
    process.exit(1);
  }
  // const inputPath = "02_short.ipynb"
  // const outputPath = "output3.json"

  await translateNotebook(inputPath, outputPath).catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

(async () => {
  await main();
})();
