async function FetchMessages(ChannelId) {
  const Response = await fetch(`/Api/${ChannelId}/Messages`);

  if (!Response.ok) {
    throw new Error("Failed to fetch messages");
  }

  const Messages = await Response.json();

  console.log(Messages);

  return Messages;
}

const Path = window.location.pathname;
const Parts = Path.split("/").filter(Boolean);

const ChannelId = Parts[Parts.length - 1];

console.log(Path);
console.log(ChannelId);

FetchMessages(ChannelId);
