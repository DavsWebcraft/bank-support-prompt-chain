require("dotenv").config();

const fs = require("fs");
const axios = require("axios");

// Get customer query from command line
const customerQuery = process.argv[2];

if (!customerQuery) {
  console.log("Please provide a customer query.");
  process.exit(1);
}

// Read prompt files
function loadPrompt(path) {
  return fs.readFileSync(path, "utf-8");
}

// Call OpenRouter API
async function callLLM(prompt) {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: process.env.MODEL_NAME,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
  }
}

async function runPromptChain() {
  // STEP 1 — Intent Interpretation
  let prompt1 = loadPrompt("./prompts/prompt1.txt").replace(
    "{{query}}",
    customerQuery,
  );

  const intent = await callLLM(prompt1);

  console.log("\nSTEP 1 — Intent");
  console.log(intent);

  // STEP 2 — Possible Categories
  let prompt2 = loadPrompt("./prompts/prompt2.txt").replace(
    "{{intent}}",
    intent,
  );

  const categories = await callLLM(prompt2);

  console.log("\nSTEP 2 — Possible Categories");
  console.log(categories);

  // STEP 3 — Best Category
  let prompt3 = loadPrompt("./prompts/prompt3.txt").replace(
    "{{categories}}",
    categories,
  );

  const bestCategory = await callLLM(prompt3);

  console.log("\nSTEP 3 — Best Category");
  console.log(bestCategory);

  // STEP 4 — Additional Details
  let prompt4 = loadPrompt("./prompts/prompt4.txt")
    .replace("{{best_category}}", bestCategory)
    .replace("{{query}}", customerQuery);

  const details = await callLLM(prompt4);

  console.log("\nSTEP 4 — Additional Details");
  console.log(details);

  // STEP 5 — Final Response
  let prompt5 = loadPrompt("./prompts/prompt5.txt")
    .replace("{{best_category}}", bestCategory)
    .replace("{{details}}", details)
    .replace("{{query}}", customerQuery);

  const finalResponse = await callLLM(prompt5);

  console.log("\nSTEP 5 — Final Customer Response");
  console.log(finalResponse);
}

runPromptChain();
