async function LoadChannels(ServerId) {
  const Response = await fetch(`/Api/${ServerId}/Channels`);

  if (!Response.ok) {
    throw new Error("Failed to load channels.");
  }

  const Channels = await Response.json();
  const ChannelList = document.getElementById("ChannelList");

  ChannelList.replaceChildren();

  for (const Channel of Channels) {
    if (Channel.Type === "ServerCategory") {
      const Category = document.createElement("div");
      Category.className = "ChannelCategory";
      Category.textContent = Channel.Name;

      ChannelList.append(Category);
      continue;
    }

    const Element = document.createElement("a");
    Element.className = "Channel";
    Element.href = `/Channels/${ServerId}/${Channel.Id}`;

    if (Channel.Id === ChannelId) {
      Element.classList.add("Active");
    }

    const Icon = document.createElement("span");
    Icon.className = "ChannelIcon";
    Icon.textContent = "#";

    const Name = document.createElement("span");
    Name.textContent = Channel.Name;

    Element.append(Icon, Name);
    ChannelList.append(Element);
  }
}

const ServerId = Parts[1];

LoadChannels(ServerId);
