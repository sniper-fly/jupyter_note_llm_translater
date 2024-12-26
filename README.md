# Jupyter Notebook Translator

A TypeScript tool for translating Jupyter notebooks with a focus on prompt engineering content below.
https://github.com/aws-samples/prompt-engineering-with-anthropic-claude-v-3

## Features

- Translates Jupyter notebook (.ipynb) files from English to Japanese
- Preserves code blocks and technical content 
- Handles markdown formatting
- Maintains special prompt engineering terminology in English
- Processes input/output cells appropriately

## Project Structure

```
.
├── .env                  # Environment variables
├── getModels.ts         # Model fetching functionality
├── logger.ts            # Logging utilities
├── main.ts             # Main application entry point
├── openAIClient.ts     # OpenAI API client
├── translateNotebook.ts # Core translation logic
├── notes/              # Original notebooks
└── output/             # Translated notebooks
```

## Development
- Uses TypeScript for type safety
- Includes tests with Vitest
- Follows standard code formatting with Prettier

## Testing

Run the test suite:
```sh
npm test
```

## Dependencies
- Node.js
- TypeScript
- Vitest for testing
- OpenAI API for translations

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes 
4. Push to the branch
5. Create a Pull Request

## Authors

[sniper-fly]
