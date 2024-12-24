import { openAIClient } from "./openAIClient";
import "dotenv/config";

openAIClient.models.list().then((models) => {
  console.log(models);
});
