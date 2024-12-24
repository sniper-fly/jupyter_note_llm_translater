import OpenAI from "openai";
import "dotenv/config";

// OpenAI client configuration
export const openAIClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
