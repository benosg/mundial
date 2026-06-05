const SCOTLAND_FLAG = "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}";
const ENGLAND_FLAG = "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}";

const FLAG_MAP: Record<string, string> = {
  México: "🇲🇽",
  "Corea del Sur": "🇰🇷",
  Chequia: "🇨🇿",
  Sudáfrica: "🇿🇦",
  Canadá: "🇨🇦",
  "Bosnia y Herzegovina": "🇧🇦",
  Qatar: "🇶🇦",
  Suiza: "🇨🇭",
  Brasil: "🇧🇷",
  Marruecos: "🇲🇦",
  Haití: "🇭🇹",
  Escocia: SCOTLAND_FLAG,
  USA: "🇺🇸",
  Paraguay: "🇵🇾",
  Australia: "🇦🇺",
  Turquía: "🇹🇷",
  Alemania: "🇩🇪",
  Curazao: "🇨🇼",
  "Costa de Marfil": "🇨🇮",
  Ecuador: "🇪🇨",
  "Países Bajos": "🇳🇱",
  Japón: "🇯🇵",
  Suecia: "🇸🇪",
  Túnez: "🇹🇳",
  Bélgica: "🇧🇪",
  Egipto: "🇪🇬",
  Irán: "🇮🇷",
  "Nueva Zelanda": "🇳🇿",
  España: "🇪🇸",
  "Cabo Verde": "🇨🇻",
  "Arabia Saudita": "🇸🇦",
  Uruguay: "🇺🇾",
  Francia: "🇫🇷",
  Senegal: "🇸🇳",
  Irak: "🇮🇶",
  Noruega: "🇳🇴",
  Argentina: "🇦🇷",
  Argelia: "🇩🇿",
  Austria: "🇦🇹",
  Jordania: "🇯🇴",
  Portugal: "🇵🇹",
  "Congo DR": "🇨🇩",
  Uzbekistán: "🇺🇿",
  Colombia: "🇨🇴",
  Inglaterra: ENGLAND_FLAG,
  Croacia: "🇭🇷",
  Ghana: "🇬🇭",
  Panamá: "🇵🇦",
};

const TWEMOJI_BASE_URL = "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg";

function toCodePointSequence(value: string): string {
  return Array.from(value)
    .map((char) => char.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .join("-");
}

export function getFlag(teamName: string): string {
  return FLAG_MAP[teamName] ?? "🏳️";
}

export function getFlagImageUrl(teamName: string): string {
  return getFlagImageUrlFromEmoji(getFlag(teamName));
}

export function getFlagImageUrlFromEmoji(flag: string): string {
  const fallback = flag || "🏳️";
  return `${TWEMOJI_BASE_URL}/${toCodePointSequence(fallback)}.svg`;
}

export function isFavoriteMatch(
  home: string,
  away: string,
  favoriteTeam: string
): boolean {
  return home === favoriteTeam || away === favoriteTeam;
}
