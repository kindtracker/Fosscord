const MessageInput = document.querySelector("#MessageInput");
const Socket = io();

function GetUserColor(UserId, Lightness = 70) {
  let IdHash = 0n;

  for (const Character of String(UserId)) {
    IdHash =
      (IdHash * 31n + BigInt(Character.charCodeAt(0))) & 0xffffffffffffffffn;
  }

  return IdHash && `hsl(${IdHash % 360n}, 100%, ${Lightness}%)`;
}

function CreateChatMessage(Message) {
  const Container = document.createElement("div");
  Container.className = "ChatMessage";
  Container.dataset.Id = Message.Id;

  const Avatar = document.createElement("img");
  Avatar.className = "ChatMessageAvatar";
  Avatar.src = Message.Avatar;
  Avatar.alt = "";

  const Content = document.createElement("div");
  Content.className = "ChatMessageContent";

  const Header = document.createElement("div");
  Header.className = "ChatMessageHeader";

  const User = document.createElement("span");
  User.className = "ChatMessageUser";
  User.textContent = Message.DisplayName;
  User.style.color = GetUserColor(Message.UserId);

  const Timestamp = document.createElement("span");
  Timestamp.className = "ChatMessageTimestamp";
  Timestamp.textContent = new Date(Message.Timestamp).toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const Text = document.createElement("p");
  Text.className = "ChatMessageText";
  Text.textContent = Message.Content;

  Header.append(User, Timestamp);
  Content.append(Header, Text);
  Container.append(Avatar, Content);

  const Actions = document.createElement("div");
  Actions.className = "ChatMessageActions";

  const TranslateButton = document.createElement("button");
  TranslateButton.innerHTML = `<i class="fa-solid fa-language"></i>`;
  TranslateButton.title = "Translate";

  const ReactionButton = document.createElement("button");
  ReactionButton.innerHTML = `<i class="fa-solid fa-face-smile"></i>`;
  ReactionButton.title = "React";

  const ReplyButton = document.createElement("button");
  ReplyButton.innerHTML = `<i class="fa-solid fa-reply"></i>`;
  ReplyButton.title = "Reply";

  const ForwardButton = document.createElement("button");
  ForwardButton.innerHTML = `<i class="fa-solid fa-share"></i>`;
  ForwardButton.title = "Forward";

  const DeleteButton = document.createElement("button");
  DeleteButton.innerHTML = `<i class="fa-regular fa-trash-can"></i>`;
  DeleteButton.title = "Delete";

  Actions.append(
    TranslateButton,
    ReactionButton,
    ReplyButton,
    ForwardButton,
    DeleteButton,
  );
  Container.append(Actions);

  return Container;
}

async function LoadChat(ChannelId) {
  const Response = await fetch(`/Api/${ChannelId}/Messages`);

  if (!Response.ok) {
    throw new Error("Failed to load chat");
  }

  const Messages = await Response.json();
  const ChatMessages = document.getElementById("ChatMessages");

  ChatMessages.replaceChildren(...Messages.map(CreateChatMessage));

  Socket.emit("JoinChannel", ChannelId, (Response) => {
    if (!Response.Success) {
      throw new Response.Error();
    }
  });

  Socket.on("NewMessage", (Message) => {
    ChatMessages.append(CreateChatMessage(Message));
  });
}

async function SendMessage(Content) {
  const Response = await fetch(`/Api/${ChannelId}/Messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Content: MessageInput.value,
    }),
  });
  if (!Response.ok) {
    throw new Error("Failed to send message");
  }
}

MessageInput.addEventListener("keydown", function (Event) {
  if (Event.key === "Enter") {
    Event.preventDefault();
    SendMessage(MessageInput.value);
    MessageInput.value = "";
  }
});

document.addEventListener("mouseover", (Event) => {
  const Message = Event.target.closest(".ChatMessage");
  if (!Message) return;

  const MessageId = Message.dataset.Id;
});

const Parts = location.pathname.split("/").filter(Boolean);
const ChannelId = Parts[2];

LoadChat(ChannelId);
