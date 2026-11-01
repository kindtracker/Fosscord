function HexToHSL(Hex) {
  Hex = Hex.replace("#", "");

  const R = parseInt(Hex.substring(0, 2), 16) / 255;
  const G = parseInt(Hex.substring(2, 4), 16) / 255;
  const B = parseInt(Hex.substring(4, 6), 16) / 255;

  const Max = Math.max(R, G, B);
  const Min = Math.min(R, G, B);

  let H = 0;
  let S = 0;
  const L = (Max + Min) / 2;

  if (Max !== Min) {
    const D = Max - Min;

    S = L > 0.5 ? D / (2 - Max - Min) : D / (Max + Min);

    switch (Max) {
      case R:
        H = (G - B) / D + (G < B ? 6 : 0);
        break;

      case G:
        H = (B - R) / D + 2;
        break;

      case B:
        H = (R - G) / D + 4;
        break;
    }

    H /= 6;
  }

  return {
    H: H * 360,
    S: S * 100,
    L: L * 100,
  };
}

function HSLToHex(H, S, L) {
  H = ((H % 360) + 360) % 360;
  S /= 100;
  L /= 100;

  const C = (1 - Math.abs(2 * L - 1)) * S;
  const X = C * (1 - Math.abs(((H / 60) % 2) - 1));
  const M = L - C / 2;

  let R = 0;
  let G = 0;
  let B = 0;

  if (H < 60) {
    [R, G, B] = [C, X, 0];
  } else if (H < 120) {
    [R, G, B] = [X, C, 0];
  } else if (H < 180) {
    [R, G, B] = [0, C, X];
  } else if (H < 240) {
    [R, G, B] = [0, X, C];
  } else if (H < 300) {
    [R, G, B] = [X, 0, C];
  } else {
    [R, G, B] = [C, 0, X];
  }

  const ToHex = (Value) =>
    Math.round((Value + M) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${ToHex(R)}${ToHex(G)}${ToHex(B)}`;
}

function GenerateTheme(BaseColor) {
  if (!/^#[0-9a-fA-F]{6}$/.test(BaseColor)) {
    throw new Error("Invalid base color");
  }

  const { H } = HexToHSL(BaseColor);

  const Colors = {
    Rosewater: HSLToHex(H - 25, 65, 90),
    Flamingo: HSLToHex(H - 15, 70, 90),
    Pink: HSLToHex(H + 325, 70, 90),
    Mauve: HSLToHex(H, 70, 90),
    Red: HSLToHex(H - 35, 70, 90),
    Maroon: HSLToHex(H - 25, 60, 85),
    Peach: HSLToHex(H - 15, 80, 88),
    Yellow: HSLToHex(H + 35, 75, 90),
    Green: HSLToHex(H + 120, 55, 88),
    Teal: HSLToHex(H + 165, 55, 88),
    Sky: HSLToHex(H + 185, 65, 90),
    Sapphire: HSLToHex(H + 200, 65, 88),
    Blue: HSLToHex(H + 220, 70, 90),
    Lavender: HSLToHex(H + 245, 65, 90),

    Text: HSLToHex(H, 15, 87),
    Subtext1: HSLToHex(H, 15, 79),
    Subtext0: HSLToHex(H, 15, 71),

    Overlay2: HSLToHex(H, 15, 63),
    Overlay1: HSLToHex(H, 15, 55),
    Overlay0: HSLToHex(H, 15, 47),

    Surface2: HSLToHex(H, 18, 39),
    Surface1: HSLToHex(H, 18, 31),
    Surface0: HSLToHex(H, 18, 23),

    Base: HSLToHex(H, 20, 20),
    Mantle: HSLToHex(H, 20, 12),
    Crust: HSLToHex(H, 20, 9),
  };

  return Colors;
}

function ApplyTheme(BaseColor) {
  const Colors = GenerateTheme(BaseColor);
  const Root = document.documentElement;

  Root.dataset.theme = "custom";

  for (const [Name, Value] of Object.entries(Colors)) {
    Root.style.setProperty(`--${Name}`, Value);
  }

  return Colors;
}

ApplyTheme("#623e3e");
