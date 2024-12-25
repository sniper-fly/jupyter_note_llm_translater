import { translateNotebook } from "./translateNotebook";

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
