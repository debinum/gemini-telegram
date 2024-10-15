// index.js

const { Bot } = require("grammy");
require("dotenv").config();
const chatHistory = require("./db");
const gemini = require("./gemini");
const axios = require("axios");

const bot = new Bot(process.env.TOKEN);

function escapeMarkdownV2(text) {
  return text.replace(/([_*[\]()~`>#+-=|{}.!])/g, "\\$1");
}

bot.command("start", (ctx) =>
  ctx.reply("Welcome! Send me a message to get started."),
);

bot.on("message:text", async (ctx) => {
  try {
    async function generateTextFromText() {
      let response = await gemini.geminiReply(userId, userMessage, fullname);

      while (response === "Fetch failed") {
        response = await gemini.geminiReply(userId, userMessage, fullname);
      }

      if (response !== "Fetch failed") {
        const maxLength = 4096;
        const chunks = response.match(new RegExp(`.{1,${maxLength}}`, "g"));

        let markdownMessage = "";
        for (const chunk of chunks) {
          markdownMessage += escapeMarkdownV2(chunk) + "\n";
        }

        await ctx.reply(markdownMessage, { parse_mode: "MarkdownV2" });
      }
    }

    const userId = ctx.from.id;
    const fullname = [ctx.from.first_name, ctx.from.last_name]
      .filter(Boolean)
      .join(" ");
    const userMessage = ctx.message.text;
    const isClear = userMessage.toLowerCase() === "clear";

    if (isClear) {
      await chatHistory.clearHistory(userId);
      await ctx.reply("Chat history cleared.");
    } else {
      await generateTextFromText();
    }
  } catch (error) {
    console.log("Error: ", error);
  }
});

bot.on("message:photo", async (ctx) => {
  try {
    function getMimetypeFromExtension(path) {
      const extension = path.split(".").pop();
      switch (extension) {
        case "jpg":
        case "jpeg":
          return "image/jpeg";
        case "png":
          return "image/png";
        case "gif":
          return "image/gif";
        default:
          return "application/octet-stream";
      }
    }

    async function generateTextFromImage() {
      const userId = ctx.from.id;
      const fullname = [ctx.from.first_name, ctx.from.last_name]
        .filter(Boolean)
        .join(" ");
      const userMessage = ctx.message.caption;

      let textResult = await gemini.geminiVision(
        userId,
        mediaBuffer,
        mimetype,
        userMessage,
        fullname,
      );

      while (textResult === "Fetch failed") {
        textResult = await gemini.geminiVision(
          userId,
          mediaBuffer,
          mimetype,
          userMessage,
          fullname,
        );
      }

      if (textResult !== "Fetch failed") {
        const maxLength = 4096;
        const chunks = textResult.match(new RegExp(`.{1,${maxLength}}`, "g"));

        let markdownMessage = "";
        for (const chunk of chunks) {
          markdownMessage += escapeMarkdownV2(chunk) + "\n";
        }

        await ctx.reply(markdownMessage, { parse_mode: "MarkdownV2" });
      }
    }

    const file = await ctx.getFile();
    const path = file.file_path;
    const onlinePath =
      "https://api.telegram.org/file/bot" + process.env.TOKEN + "/" + path;

    const response = await axios.get(onlinePath, {
      responseType: "arraybuffer",
    });

    const mediaBuffer = Buffer.from(response.data).toString("base64");
    const mimetype = getMimetypeFromExtension(path);

    generateTextFromImage();
  } catch (error) {
    console.log("Error: ", error);
  }
});

bot.start();
