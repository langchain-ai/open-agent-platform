export const getAgentColor = (name: string | undefined) => {
  const firstChar = name?.charAt(0).toLowerCase();
  switch (firstChar) {
    case "a":
      return "#2F6868";
    case "b":
      return "#3D7575";
    case "c":
      return "#4B8282";
    case "d":
      return "#599090";
    case "e":
      return "#679D9D";
    case "f":
      return "#75AAAA";
    case "g":
      return "#83B7B7";
    case "h":
      return "#91C4C4";
    case "i":
      return "#9FD1D1";
    case "j":
      return "#ADDEDE";
    case "k":
      return "#3D7575";
    case "l":
      return "#4B8282";
    case "m":
      return "#599090";
    case "n":
      return "#679D9D";
    case "o":
      return "#75AAAA";
    case "p":
      return "#83B7B7";
    case "q":
      return "#91C4C4";
    case "r":
      return "#9FD1D1";
    case "s":
      return "#ADDEDE";
    case "t":
      return "#3D7575";
    case "u":
      return "#4B8282";
    case "v":
      return "#599090";
    case "w":
      return "#679D9D";
    case "x":
      return "#75AAAA";
    case "y":
      return "#83B7B7";
    case "z":
      return "#91C4C4";
    default:
      return "#2F6868";
  }
};
