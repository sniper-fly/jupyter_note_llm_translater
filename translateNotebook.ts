import { openAIClient } from "./openAIClient";
import * as fs from "fs/promises";
import "dotenv/config";
import { logger } from "./logger";

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

const codePrompt = `\
Translate comments within the given Python code from English to Japanese without altering the program's logic or functionality. Do not translate domain-specific English words (e.g., 'temperature'), technical terms, or words enclosed in backquotes (\`).

# Steps
1. Read the provided Python code.
2. Identify domain-specific English terms, technical jargon, and terms enclosed in backticks (\`) that should remain in English.
3. Translate the rest of the text into Japanese while ensuring the meaning is preserved.
4. Ensure no changes are made to the code other than the translation of comments.
5. Preserve the position of the translated comments in their original spots.

# Note
Concentrate on faithfully translating and do not add any extra output or comments.

# Output Format
- Output Python code without enclosing code blocks. Do not include any additional text or markdown format. Provide only the Python code itself.

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
--------------------------------
`;

const descriptionPrompt = `\
Translate the provided markdown text into Japanese, focusing on prompt engineering.
Keep domain-specific English terms, technical jargon, and words enclosed in backticks (\`) untranslated.

# Steps
1. Read the provided markdown text, which discusses aspects of prompt engineering.
2. Identify domain-specific English terms, technical jargon, and terms enclosed in backticks (\`) that should remain in English.
3. Translate the rest of the text into Japanese while ensuring the meaning is preserved.

# Note
Concentrate on faithfully translating and do not add any extra output or comments.

# Output Format
Provide the translated text in Japanese, maintaining the specified English terms as they are.

# Examples
**Input:**  
"Adjust the \`temperature\` settings and other parameters to optimize the \`output\`."

**Output:**  
"\`temperature\`設定やその他のパラメータを調整して、\`output\`を最適化します。"
--------------------------------
`;

// Function to invoke translation text using OpenAI API
async function invokeChatGPT(
  userInstruction: string,
  text: string
): Promise<string> {
  try {
    logger.info("Invoking OpenAI translation", {
      text: text.slice(0, 50), // First 50 chars of text
    });

    const completion = await openAIClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "assistant",
          content: userInstruction,
        },
        { role: "user", content: text },
      ],
      temperature: 0,
    });
    return completion.choices[0].message.content || "";
  } catch (error) {
    logger.error("OpenAI translation failed", { error });
    throw error;
  }
}

// Function to process translated text
export function processTranslatedText(
  text: string,
  cellType: string
): string[] {
  const rawSource = (text.match(/[^\n]*\n|[^\n]+/g) || []) as string[];

  if (
    cellType === "code" &&
    rawSource.length >= 2 &&
    rawSource[0].includes("```") &&
    rawSource[rawSource.length - 1].includes("```")
  ) {
    return rawSource.slice(1, -1);
  }
  return rawSource;
}

// Function to process a single cell
async function processCell(cell: NotebookCell): Promise<NotebookCell> {
  const originalText = concatenateSource(cell.source);
  try {
    const translatedText = await (async () => {
      if (cell.cell_type === "code") {
        return invokeChatGPT(codePrompt, originalText);
      } else {
        return invokeChatGPT(descriptionPrompt, originalText);
      }
    })();

    return {
      ...cell,
      source: processTranslatedText(translatedText, cell.cell_type),
    };
  } catch (error) {
    throw error;
  }
}

// Main function to process notebook
export async function translateNotebook(
  inputPath: string,
  outputPath: string
): Promise<void> {
  logger.info("Starting notebook translation", {
    inputPath,
    outputPath,
  });

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

    logger.info("Translation completed successfully", {
      cellsCount: notebook.cells.length,
    });
  } catch (error) {
    logger.error("Notebook translation failed", {
      inputPath,
      outputPath,
      error,
    });
    throw error;
  }
}

// (async () => {
//   const res = await invokeChatGPT(
//     descriptionPrompt,
//     "### Exercise 1.1 - Counting to Three" +
//       "Using proper `user` / `assistant` formatting, edit the `PROMPT` below to get Claude to **count to three.** The output will also indicate whether your solution is correct."
//   );

//   console.log(res);
// })();
