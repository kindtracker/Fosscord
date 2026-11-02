const Fs = require("fs");
const Express = require("express");
const Http = require("http");
const Path = require("path");
const { Server } = require("socket.io");
const { Client, GatewayIntentBits, ChannelType } = require("discord.js");

let HttpServer = null;
let Io = null;

const Token = Fs.readFileSync("DiscordToken", "utf8").trim();

function CreateFolder(Name) {
  if (!Fs.existsSync(Name)) {
    Fs.mkdirSync(Name, { recursive: true });
  }
}

CreateFolder("Web/Channels");

const Bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

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

async function SendMessage(ChannelId, Content) {
  const Channel = await Bot.channels.fetch(ChannelId);

  if (!Channel || !Channel.isTextBased() || !Channel.messages) {
    throw new Error("Invalid text channel");
  }

  if (!Channel.isSendable()) {
    throw new Error("This channel does not support sending messages");
  }

  const Message = await Channel.send({
    content: Content,
  });

  return {
    Id: Message.id,
    UserName: Message.author.username,
    UserId: Message.author.id,
    Avatar: Message.author.displayAvatarURL(),
    Content: Message.content,
    Timestamp: Message.createdAt,
  };
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

function StartSocketServer() {
  Io = new Server(HttpServer);

  Io.on("connection", (Socket) => {
    console.log(`Client connected: ${Socket.id}`);

    Socket.on("JoinChannel", async (ChannelId, Callback) => {
      try {
        const Channel = await Bot.channels.fetch(ChannelId);

        if (!Channel || !Channel.isTextBased()) {
          throw new Error("Invalid text channel");
        }

        Socket.join(`Channel:${ChannelId}`);

        if (Callback) {
          Callback({ Success: true });
        }
      } catch (Error) {
        if (Callback) {
          Callback({
            Success: false,
            Error: Error.message,
          });
        }
      }
    });

    Socket.on("disconnect", () => {
      console.log(`Client disconnected: ${Socket.id}`);
    });
  });
}

function StartWebServer() {
  const App = Express();
  const WebDirectory = Path.resolve("Web");
  HttpServer = Http.createServer(App);

  App.use(Express.json({ limit: "16kb" }));

  App.get("/Api/:ChannelId/Messages", async (Request, Response) => {
    try {
      const Messages = await GetMessages(Request.params.ChannelId);

      Response.json(Messages);
    } catch (Error) {
      Response.status(400).json({
        Error: Error.message,
      });
    }
  });

  App.post("/Api/:ChannelId/Messages", async (Request, Response) => {
    try {
      const { Content } = Request.body || {};

      if (typeof Content !== "string" || !Content.trim()) {
        return Response.status(400).json({
          Error: "Message content cannot be empty",
        });
      }

      if (Content.length > 2000) {
        return Response.status(400).json({
          Error: "Message content exceeds 2000 characters",
        });
      }

      const Message = await SendMessage(Request.params.ChannelId, Content);

      Response.status(201).json(Message);
    } catch (Error) {
      Response.status(400).json({
        Error: Error.message,
      });
    }
  });

  App.get("/Api/:ServerId/Channels", async (Request, Response) => {
    try {
      const Channels = await GetChannels(Request.params.ServerId);

      Response.json(Channels);
    } catch (Error) {
      Response.status(400).json({
        Error: Error.message,
      });
    }
  });

  App.use(Express.static(WebDirectory));

  App.get("/{*Path}", (Request, Response) => {
    Response.sendFile(Path.join(WebDirectory, "Client.html"), (Error) => {
      if (Error && !Response.headersSent) {
        Response.status(404).send("Not Found");
      }
    });
  });

  HttpServer.listen(3000, () => {
    console.log("Web server running at http://localhost:3000");
  });
}

Bot.once("clientReady", async () => {
  console.log(`Logged in as ${Bot.user.tag}`);

  StartWebServer();
  StartSocketServer();
});

Bot.on("messageCreate", (Message) => {
  if (!Message.guild) return;

  Io.to(`Channel:${Message.channelId}`).emit("NewMessage", {
    Id: Message.id,
    UserName: Message.author.username,
    UserId: Message.author.id,
    Avatar: Message.author.displayAvatarURL(),
    Content: Message.content,
    Timestamp: Message.createdAt,
  });
});

Bot.login(Token);
