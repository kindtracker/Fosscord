const fs = require("fs");
const { Client, GatewayIntentBits } = require("discord.js");

const Token = fs.readFileSync("DiscordToken", "utf8").trim();

const Bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

Bot.once("clientReady", () => {
  console.log(`Logged in as ${Bot.user.tag}`);
});

Bot.on("messageCreate", (Message) => {
  if (Message.author.bot) return;

  if (Message.content === "!ping") {
    Message.reply("Pong!");
  }
});

Bot.login(Token);
