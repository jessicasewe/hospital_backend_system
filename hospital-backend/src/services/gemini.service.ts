import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import logger from "../config/logger";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

interface ActionableSteps {
  checklist: string[];
  plan: string[];
}

// Helper function to extract JSON from LLM response
const extractJsonFromResponse = (response: string): string => {
  // Remove Markdown code block syntax (```json and ```)
  const jsonString = response
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  // Parse the JSON string to ensure it's valid
  try {
    JSON.parse(jsonString);
    return jsonString;
  } catch (error) {
    throw new Error("Invalid JSON format in LLM response.");
  }
};

export const getActionableSteps = async (
  note: string,
  customPrompt?: string
): Promise<ActionableSteps> => {
  if (!process.env.GOOGLE_API_KEY) {
    logger.error("Missing GOOGLE_API_KEY in environment variables.");
    throw new Error("Missing GOOGLE_API_KEY in environment variables.");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  try {
    const prompt =
      customPrompt ||
      `
        Extract actionable steps from this doctor's note. Return a JSON object with two keys:
        - "checklist": A list of immediate one-time tasks (e.g., "Buy a drug").
        - "plan": A list of scheduled actions as strings (e.g., "Take Amoxicillin 500mg twice daily for 7 days").
  
        Example Response:
        {
          "checklist": ["Buy a drug"],
          "plan": ["Take Amoxicillin 500mg twice daily for 7 days"]
        }
  
        Doctor's Note: ${note}
  
        Return the response as a valid JSON object without Markdown syntax.
      `;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    // Log the raw LLM response for debugging
    console.log("Raw LLM Response:", response.text());

    const jsonString = extractJsonFromResponse(response.text());

    console.log("Cleaned JSON String:", jsonString);

    const actionableSteps: ActionableSteps = JSON.parse(jsonString);

    if (!actionableSteps.checklist || !actionableSteps.plan) {
      throw new Error(
        "LLM response is missing required keys: checklist or plan."
      );
    }

    if (!Array.isArray(actionableSteps.plan)) {
      throw new Error("Invalid plan format: Expected an array.");
    }

    actionableSteps.plan = actionableSteps.plan.map((item: any) => {
      if (typeof item === "string") {
        return item;
      } else if (
        typeof item === "object" &&
        item.action &&
        item.frequency &&
        item.duration
      ) {
        return `${item.action} ${item.frequency} ${item.duration}`;
      } else {
        throw new Error(
          "Invalid plan item format: Expected a string or object with action, frequency, and duration."
        );
      }
    });

    return actionableSteps;
  } catch (error) {
    logger.error("Error generating actionable steps: " + error);
    return {
      checklist: ["Consult your doctor for immediate steps."],
      plan: ["Follow up with your doctor for a detailed plan."],
    };
  }
};
