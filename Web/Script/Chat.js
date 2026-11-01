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
  User.textContent = Message.UserName;
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
}

const Parts = location.pathname.split("/").filter(Boolean);
const ChannelId = Parts[2];

LoadChat(ChannelId);
