export const siteName = "Pronósticos del Mundial";

export const scoringRules = [
  {
    title: "Resultado exacto",
    points: "5 puntos",
    body: "Aciertas el marcador completo, por ejemplo 2-2 y termina 2-2.",
  },
  {
    title: "Ganador o empate",
    points: "3 puntos",
    body: "Acertaste el signo del partido: gana local, gana visita o empate.",
  },
  {
    title: "País favorito",
    points: "+1 / +2 bonus",
    body: "Si juega tu selección favorita, sumas bonus por acierto parcial o exacto.",
  },
];

export const features = [
  "Login con Google",
  "Grupos privados con ranking",
  "Fixture Mundial 2026",
  "Horarios en Chile",
  "Sede, estadio y ciudad",
  "Canales y streaming en Chile",
];

export const sampleUser = {
  name: "Beno",
  email: "beno@demo.cl",
  favoriteTeam: "España",
  favoriteFlag: "🇪🇸",
  points: 41,
  exact: 4,
  outcomes: 9,
  group: "La banda del Mundial",
};

export const ranking = [
  { position: 1, name: "Beno", favorite: "🇪🇸 España", points: 41, exact: 4, outcomes: 9, bonus: 5 },
  { position: 2, name: "Fran", favorite: "🇦🇷 Argentina", points: 39, exact: 4, outcomes: 8, bonus: 3 },
  { position: 3, name: "Pame", favorite: "🇧🇷 Brasil", points: 36, exact: 3, outcomes: 9, bonus: 4 },
  { position: 4, name: "Jota", favorite: "🇯🇵 Japón", points: 30, exact: 2, outcomes: 8, bonus: 2 },
];

export const matches = [
  {
    id: 1,
    stage: "Fase de grupos · Fecha 1",
    home: "España",
    homeFlag: "🇪🇸",
    away: "Japón",
    awayFlag: "🇯🇵",
    kickoffChile: "11 jun 2026 · 18:00 CLT",
    venue: "Estadio Azteca",
    city: "Ciudad de México, México",
    broadcasters: ["Chilevisión", "DirecTV Sports", "DGO"],
    predicted: "España 2-1",
    homePrediction: 2,
    awayPrediction: 1,
    bonus: true,
    status: "Próximo",
  },
  {
    id: 2,
    stage: "Fase de grupos · Fecha 1",
    home: "Argentina",
    homeFlag: "🇦🇷",
    away: "Canadá",
    awayFlag: "🇨🇦",
    kickoffChile: "12 jun 2026 · 21:00 CLT",
    venue: "BMO Field",
    city: "Toronto, Canadá",
    broadcasters: ["Canal 13", "ESPN", "Disney+"],
    predicted: "Empate 1-1",
    homePrediction: 1,
    awayPrediction: 1,
    bonus: false,
    status: "Pronosticado",
  },
  {
    id: 3,
    stage: "Fase de grupos · Fecha 1",
    home: "Brasil",
    homeFlag: "🇧🇷",
    away: "Países Bajos",
    awayFlag: "🇳🇱",
    kickoffChile: "13 jun 2026 · 16:00 CLT",
    venue: "SoFi Stadium",
    city: "Los Ángeles, Estados Unidos",
    broadcasters: ["Mega", "DirecTV Sports", "DGO"],
    predicted: "Pendiente",
    homePrediction: 0,
    awayPrediction: 0,
    bonus: false,
    status: "Abierto",
  },
];

export const dashboardStats = [
  { label: "Puntos totales", value: "41" },
  { label: "Exactos acertados", value: "4" },
  { label: "Pronósticos pendientes", value: "7" },
];

export const quickSummary = [
  { label: "Grupo", value: "4 jugadores" },
  { label: "Partidos abiertos", value: "3" },
  { label: "Tu favorito", value: "🇪🇸 España" },
];

export const profileStats = [
  { label: "Favorito", value: "España" },
  { label: "Bonus ganados", value: "+5" },
  { label: "Grupo activo", value: "La banda del Mundial" },
];
