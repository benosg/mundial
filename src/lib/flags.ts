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
  Escocia: "🏴",
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
  Inglaterra: "🏴",
  Croacia: "🇭🇷",
  Ghana: "🇬🇭",
  Panamá: "🇵🇦",
};

export function getFlag(teamName: string): string {
  return FLAG_MAP[teamName] ?? "🏳️";
}

export function isFavoriteMatch(
  home: string,
  away: string,
  favoriteTeam: string
): boolean {
  return home === favoriteTeam || away === favoriteTeam;
}
