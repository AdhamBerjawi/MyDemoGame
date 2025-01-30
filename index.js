const express = require("express");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");

// Replace with your bot token
const TOKEN = "7512358370:AAH89z-ig0__gHbE9Z72Qa3970YIBaSqzVw";
const gameName = "IslandEscape3D";
const port = process.env.PORT || 5000;

// Initialize Express server and Telegram bot
const server = express();
const bot = new TelegramBot(TOKEN, { polling: true });

// Store callback queries
const queries = {};

// Serve static files from the game build directory
server.use(express.static(path.join(__dirname, "IslandEscape3DWebGLBuild")));

// Handle /help command
bot.onText(/help/, (msg) => {
    bot.sendMessage(msg.from.id, "Say /game if you want to play.");
});

// Handle /start or /game command
bot.onText(/start|game/, (msg) => {
    bot.sendGame(msg.from.id, gameName);
});

// Handle callback queries
bot.on("callback_query", (query) => {
    if (query.game_short_name !== gameName) {
        // Answer with a warning if the game name doesn't match
        bot.answerCallbackQuery(query.id, {
            text: "Sorry, this game is not available.",
            show_alert: true,
        });
    } else {
        // Store the query and provide the game URL
        queries[query.id] = query;
        const gameUrl = `http://localhost:8000`; // Replace with your actual game URL
        bot.answerCallbackQuery(query.id, { url: gameUrl })
            .then(() => {
                console.log("Callback query answered successfully!");
            })
            .catch((err) => {
                console.error("Error answering callback query:", err);
            });
    }
});

// Handle inline queries
bot.on("inline_query", (iq) => {
    bot.answerInlineQuery(iq.id, [
        {
            type: "game",
            id: "0",
            game_short_name: gameName,
        },
    ]);
});

// Handle highscore submission
server.get("/highscore/:score", (req, res, next) => {
    if (!Object.hasOwnProperty.call(queries, req.query.id)) {
        return next();
    }

    const query = queries[req.query.id];
    const options = query.message
        ? {
              chat_id: query.message.chat.id,
              message_id: query.message.message_id,
          }
        : {
              inline_message_id: query.inline_message_id,
          };

    bot.setGameScore(query.from.id, parseInt(req.params.score), options)
        .then(() => {
            res.sendStatus(200);
        })
        .catch((err) => {
            console.error("Error setting game score:", err);
            res.sendStatus(500);
        });
});

// Start the server
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});