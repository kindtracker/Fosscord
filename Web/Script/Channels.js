async function LoadChannels(ServerId) {
  const Response = await fetch(`/Api/${ServerId}/Channels`);

  if (!Response.ok) {
    throw new Error("Failed to load channels");
  }

  const Channels = await Response.json();
  const ChannelList = document.getElementById("ChannelList");

  ChannelList.replaceChildren();

  const Categories = new Map();

  for (const Channel of Channels) {
    if (Channel.Type === "GuildCategory") {
      const Category = document.createElement("div");
      Category.className = "ChannelCategory";
      Category.textContent = Channel.Name;

      const Container = document.createElement("div");
      Container.className = "CategoryChannels";

      const Wrapper = document.createElement("div");
      Wrapper.className = "Category";

      Wrapper.append(Category, Container);
      ChannelList.append(Wrapper);

      Categories.set(Channel.Id, Container);
    }
  }

  for (const Channel of Channels) {
    if (Channel.Type === "GuildCategory") continue;

    const Element = document.createElement("a");
    Element.className = "Channel";
    Element.href = `/Channels/${ServerId}/${Channel.Id}`;

    if (Channel.Id === ChannelId) {
      Element.classList.add("Active");
    }

    const Icon = document.createElement("span");
    Icon.className = "ChannelIcon";
    Icon.innerHTML = `<svg role="img" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M10.99 3.16A1 1 0 1 0 9 2.84L8.15 8H4a1 1 0 0 0 0 2h3.82l-.67 4H3a1 1 0 1 0 0 2h3.82l-.8 4.84a1 1 0 0 0 1.97.32L8.85 16h4.97l-.8 4.84a1 1 0 0 0 1.97.32l.86-5.16H20a1 1 0 1 0 0-2h-3.82l.67-4H21a1 1 0 1 0 0-2h-3.82l.8-4.84a1 1 0 1 0-1.97-.32L15.15 8h-4.97l.8-4.84ZM14.15 14l.67-4H9.85l-.67 4h4.97Z" clip-rule="evenodd" class=""></path></svg>`;

    const Name = document.createElement("span");
    Name.textContent = Channel.Name;

    Element.append(Icon, Name);

    const Container = Categories.get(Channel.ParentId);

    if (Container) {
      Container.append(Element);
    } else {
      ChannelList.append(Element);
    }
  }
}

const ServerId = Parts[1];

LoadChannels(ServerId);
