// gemini.js

const {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} = require("@google/generative-ai");
const fs = require("fs");
const db = require("./db");
require("dotenv").config();

const aiPrompt = fs.readFileSync("./prompts/codie.txt", { encoding: 'utf8' });

const genAI = new GoogleGenerativeAI(process.env.APIKEY);

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

const unifiedModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: aiPrompt,
  safetySettings,
});

async function geminiReply(userId, userMessage, fullname) {
  try {
    await db.addMessage(userId, userMessage, "user");
    const history = await db.getHistory(userId);
    console.log("History: ", history);

    const chat = unifiedModel.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    console.log(fullname + ": " + userMessage);
    const result = await chat.sendMessage(userMessage);
    const response = await result.response.text();
    console.log("Gemini: " + response + "\n");

    if (!response || response.trim() === "") {
      await db.clearLastTwo(userId);
      return "Fetch failed";
    } else {
      await db.addMessage(userId, response, "model");
      return response;
    }
  } catch (error) {
    console.error("Error in geminiReply: ", error);
    if (error.message.includes("fetch failed")) {
      return "Fetch failed";
    } else if (error.message.includes("blocked due to SAFETY")) {
      await db.clearLastTwo(userId);
      await db.errorTemplateMessage(
        userId,
        "(Words are not clear from the user!)",
      );
      return "Astaghfirullah 😌";
    } else {
      await db.errorTemplateMessage(userId, "(There was an error!)");
      return "Sorry, an error occurred. Please try again!";
    }
  }
}

async function geminiVision(userId, mediaBuffer, mimetype, userMessage, fullname) {
  try {
    const prompt = userMessage || "Please provide a detailed description of the image.";
    console.log(fullname + ": " + prompt);

    const history = await db.getHistory(userId);
    const chat = unifiedModel.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    const imageParts = [
      {
        inlineData: {
          data: mediaBuffer,
          mimeType: mimetype,
        },
      },
    ];

    await db.addGeminiVisionChat(
      userId,
      "(An image is attached) " + prompt,
      "user",
    );

    const result = await chat.sendMessage([prompt, ...imageParts]);
    const textResult = await result.response.text();

    console.log("Gemini: " + textResult + "\n");

    if (!textResult || textResult.trim() === "") {
      await db.clearLastTwo(userId);
      return "Fetch failed";
    } else {
      await db.addGeminiVisionChat(userId, textResult, "model");
      return textResult;
    }
  } catch (error) {
    console.error("Error in geminiVision: ", error);
    if (error.message.includes("fetch failed")) {
      return "Fetch failed";
    } else if (error.message.includes("blocked due to SAFETY")) {
      await db.clearLastTwo(userId);
      await db.errorTemplateMessage(
        userId,
        "(Indecent or inappropriate images sent by user!)",
      );
      return "Astaghfirullah 😌";
    } else {
      await db.errorTemplateMessage(userId, "(There was an error!)");
      return "Sorry, an error occurred. Please try again!";
    }
  }
}

module.exports = {
  geminiReply,
  geminiVision,
};
