const Fs = require("fs");
const { Client, GatewayIntentBits, ChannelType } = require("discord.js");

const Token = Fs.readFileSync("DiscordToken", "utf8").trim();

function CreateFolder(Name) {
  if (!Fs.existsSync(Name)) {
    Fs.mkdirSync(Name);
  }
}

function CopyMain(Name) {
  Fs.copyFileSync("Web/Main.html", Name);
}

CreateFolder(`Web/Channels`);

const Bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

async function CopyChannels() {
  const Guilds = await Bot.guilds.fetch();

  for (const [GuildId, Guild] of Guilds) {
    CreateFolder(`Web/Channels/${Guild.id}`);

    const FetchedGuild = await Guild.fetch();
    const Channels = await FetchedGuild.channels.fetch();

    Channels.forEach((Channel) => {
      const Type = ChannelType[Channel.type];

      if (Type != "GuildCategory") {
        CopyMain(`Web/Channels/${Guild.id}/${Channel.id}`);
      }

      console.log(Channel.name, Channel.id, Type);
    });
  }
}

Bot.once("clientReady", async () => {
  console.log(`Logged in as ${Bot.user.tag}`);

  CopyChannels();
});

Bot.on("messageCreate", (Message) => {
  if (Message.author.bot) return;

  if (Message.content === ".CopyChannels") {
    CopyChannels();
  }
});

Bot.login(Token);
