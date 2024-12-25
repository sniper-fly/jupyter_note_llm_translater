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

// Function to invoke translation text using OpenAI API
async function invokeChatGPT(
  userInstruction: string,
  text: string
): Promise<string> {
  try {
    const completion = await openAIClient.chat.completions.create({
      model: "o1-mini-2024-09-12",
      messages: [
        {
          role: "assistant",
          content: userInstruction,
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
  const originalText = concatenateSource(cell.source);
  try {
    const translatedText = await (async () => {
      if (cell.cell_type === "code") {
        return invokeChatGPT(
          `\
Translate comments within the given Python code from English to Japanese without altering the program's logic or functionality. Do not translate domain-specific English words (e.g., 'temperature'), technical terms, or words enclosed in backquotes (\`).

# Steps
1. Read the provided Python code.
2. Identify the comments and translate them from English to Japanese, excluding domain-specific words, technical terms, and words in backquotes.
3. Ensure no changes are made to the code other than the translation of comments.
4. Preserve the position of the translated comments in their original spots.

# Output Format
- Maintain the original Python code format.

# Examples
**Input:**
def example_function():
    # This is a sample function
    x = 10
    # Print the value of x
    print(x)

**Output:**
def example_function():
    # これはサンプルの関数です
    x = 10
    # xの値を出力します
    print(x)
`,
          originalText
        );
      } else {
        return invokeChatGPT(
          `\
Translate the provided text into Japanese, focusing on prompt engineering.
Keep domain-specific English terms, technical jargon, and words enclosed in backticks (\`) untranslated.

# Steps
1. Read the provided text, which discusses aspects of prompt engineering.
2. Identify domain-specific English terms, technical jargon, and terms enclosed in backticks (\`) that should remain in English.
3. Translate the rest of the text into Japanese while ensuring the meaning is preserved.

# Output Format
Provide the translated text in Japanese, maintaining the specified English terms as they are.

# Examples
**Input:**  
"Adjust the \`temperature\` settings and other parameters to optimize the \`output\`."

**Output:**  
"\`temperature\`設定やその他のパラメータを調整して、\`output\`を最適化します。"
`,
          originalText
        );
      }
    })();

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
