const Fs = require("fs");
const Http = require("http");
const Path = require("path");
const { Client, GatewayIntentBits, ChannelType } = require("discord.js");

const Token = Fs.readFileSync("DiscordToken", "utf8").trim();

function CreateFolder(Name) {
  if (!Fs.existsSync(Name)) {
    Fs.mkdirSync(Name, { recursive: true });
  }
}

function CopyClient(Name) {
  Fs.copyFileSync("Web/Client.html", Path.join(Name, "Client.html"));
}

CreateFolder("Web/Channels");

const Bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

async function CopyChannels() {
  const Servers = await Bot.guilds.fetch();

  for (const [ServerId, Server] of Servers) {
    CreateFolder(`Web/Channels/${Server.id}`);

    const FetchedServer = await Server.fetch();
    const Channels = await FetchedServer.channels.fetch();

    Channels.forEach((Channel) => {
      if (Channel.type !== ChannelType.GuildCategory) {
        const ChannelPath = `Web/Channels/${Server.id}/${Channel.id}`;

        CreateFolder(ChannelPath);
        CopyClient(ChannelPath);
      }
    });
  }
}

async function GetMessages(ChannelId) {
  const Channel = await Bot.channels.fetch(ChannelId);

  if (!Channel || !Channel.isTextBased() || !Channel.messages) {
    throw new Error("Invalid text channel");
  }

  const Messages = await Channel.messages.fetch({
    limit: 100,
  });

  return Messages.map((Message) => ({
    Id: Message.id,
    UserName: Message.author.username,
    UserId: Message.author.id,
    Avatar: Message.author.displayAvatarURL(),
    Content: Message.content,
    Timestamp: Message.createdAt,
  })).reverse();
}

async function GetChannels(ServerId) {
  const Response = [];

  const Server = await Bot.guilds.fetch(ServerId);
  const Channels = await Server.channels.fetch();

  Channels.forEach((Channel) => {
    Response.push({
      Id: Channel.id,
      Name: Channel.name,
      Type: ChannelType[Channel.type],
      ParentId: Channel.parentId,
      Position: Channel.position,
    });
  });

  return Response;
}

function StartWebServer() {
  const WebDirectory = Path.resolve("Web");

  const MimeTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".txt": "text/plain",
  };

  const Server = Http.createServer(async (Request, Response) => {
    const Url = new URL(Request.url, "http://localhost");
    const Parts = Url.pathname.split("/").filter(Boolean);

    if (
      Request.method === "GET" &&
      Parts.length === 3 &&
      Parts[0] === "Api" &&
      Parts[2] === "Messages"
    ) {
      const ChannelId = Parts[1];

      try {
        const Messages = await GetMessages(ChannelId);

        Response.writeHead(200, {
          "Content-Type": "application/json",
        });

        Response.end(JSON.stringify(Messages));
      } catch (Error) {
        Response.writeHead(400, {
          "Content-Type": "application/json",
        });

        Response.end(
          JSON.stringify({
            Error: Error.message,
          }),
        );
      }

      return;
    }

    if (
      Request.method === "GET" &&
      Parts.length === 3 &&
      Parts[0] === "Api" &&
      Parts[2] === "Channels"
    ) {
      const ServerId = Parts[1];

      try {
        const Channels = await GetChannels(ServerId);

        Response.writeHead(200, {
          "Content-Type": "application/json",
        });

        Response.end(JSON.stringify(Channels));
      } catch (Error) {
        Response.writeHead(400, {
          "Content-Type": "application/json",
        });

        Response.end(
          JSON.stringify({
            Error: Error.message,
          }),
        );
      }

      return;
    }

    const UrlPath = decodeURIComponent(Url.pathname);
    let FilePath = Path.resolve(WebDirectory, `.${UrlPath}`);

    if (
      !FilePath.startsWith(WebDirectory + Path.sep) &&
      FilePath !== WebDirectory
    ) {
      Response.writeHead(403);
      return Response.end("Forbidden");
    }

    try {
      if (Fs.existsSync(FilePath) && Fs.statSync(FilePath).isDirectory()) {
        FilePath = Path.join(FilePath, "Client.html");
      }

      if (!Fs.existsSync(FilePath) || !Fs.statSync(FilePath).isFile()) {
        Response.writeHead(404);
        return Response.end("Not Found");
      }

      const Extension = Path.extname(FilePath);
      const ContentType = MimeTypes[Extension] || "text/html";

      Response.writeHead(200, {
        "Content-Type": ContentType,
      });

      Fs.createReadStream(FilePath).pipe(Response);
    } catch (Error) {
      console.error(Error);
      Response.writeHead(500);
      Response.end("Internal Server Error");
    }
  });

  Server.listen(3000, () => {
    console.log("Web server running at http://localhost:3000");
  });
}

Bot.once("clientReady", async () => {
  console.log(`Logged in as ${Bot.user.tag}`);

  await CopyChannels();

  StartWebServer();
});

Bot.on("messageCreate", (Message) => {
  if (Message.author.bot) return;

  if (Message.content === ".CopyChannels") {
    CopyChannels();
  }
});

Bot.login(Token);
