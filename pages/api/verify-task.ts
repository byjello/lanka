import { NextApiRequest, NextApiResponse } from "next";
import { verifyPrivyToken } from "@/lib/auth";
import { TASKS } from "@/constants/tasks";
import OpenAI from "openai";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const privyId = await verifyPrivyToken(req);
    if (!privyId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Parse the form data
    const form = formidable();
    const [fields, files] = await form.parse(req);
    const taskId = fields.taskId?.[0];
    const file = files.file?.[0];

    if (!taskId || !file) {
      return res.status(400).json({ error: "Missing taskId or file" });
    }

    const task = TASKS[taskId as keyof typeof TASKS];
    if (!task) {
      return res.status(400).json({ error: "Invalid task ID" });
    }

    // Read the file as base64
    const base64Image = fs.readFileSync(file.filepath, { encoding: "base64" });
    const dataUrl = `data:${file.mimetype};base64,${base64Image}`;

    // Construct the prompt based on the task
    let prompt = "";
    switch (taskId) {
      case "RIDE_TOKTOK":
        prompt =
          "Is this a photo of someone riding or sitting in a tuk-tuk/auto-rickshaw? The photo should clearly show someone inside a tuk-tuk or auto-rickshaw. Please respond with just 'true' or 'false'.";
        break;
      case "VISIT_TEA_PLANTATION":
        prompt =
          "Is this a photo of someone visiting a tea plantation? The photo should clearly show someone in a tea plantation, interacting with tea plants, tea trees, or tea leaves, or drinking tea. Please respond with just 'true' or 'false'.";
        break;
      case "HAVE_FISH_CURRY":
        prompt =
          "Is this a photo of someone eating fish curry? The photo should clearly show someone eating fish curry. Please respond with just 'true' or 'false'.";
        break;
      case "WHALE_WATCHING":
        prompt =
          "Is this a photo of someone whale watching? The photo should clearly show someone whale watching or interacting with whales or just a picture of a whale. Please respond with just 'true' or 'false'.";
        break;
      case "PICTURE_WITH_MONKEY":
        prompt =
          "Is this a photo of someone with a monkey? The photo should clearly show someone with a monkey. Please respond with just 'true' or 'false'.";
        break;
      case "LEARN_TO_SURF":
        prompt =
          "Is this a photo of someone learning to surf? The photo should clearly show someone learning to surf, surfing, or it should show someone with a surf board on the beach. Please respond with just 'true' or 'false'.";
        break;
      case "MORNING_WRITING":
        prompt =
          "Is this a photo of someone at a morning writing group? It could be a picture of a piece of writing, or a group picture of people that seem to be in a writing session. Please respond with just 'true' or 'false'.";
        break;
      default:
        return res
          .status(400)
          .json({ error: "Task verification not supported" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
      max_tokens: 50,
    });

    // Clean up the temporary file
    fs.unlinkSync(file.filepath);

    const result = response.choices[0].message.content?.toLowerCase();
    const isValid = result?.includes("true");

    return res.status(200).json({ isValid });
  } catch (error) {
    console.error("Error verifying task:", error);
    return res.status(500).json({ error: "Failed to verify task" });
  }
}
