export const siteName = "Pronósticos del Mundial";

export const broadcastersChile = ["DSPORTS", "DGO"];

export const scoringRules = [
  { title: "Resultado exacto", points: "5 pts" },
  { title: "Ganador o empate", points: "3 pts" },
  { title: "País favorito", points: "+1 / +2" },
];

export const sampleUser = {
  name: "Beno",
  email: "beno@demo.cl",
  favoriteTeam: "España",
  favoriteFlag: "🇪🇸",
  group: "La banda del Mundial",
  points: 41,
  exact: 4,
  outcomes: 9,
  completed: 26,
};

export const ranking = [
  { position: 1, name: "Beno", favorite: "🇪🇸 España", points: 41, exact: 4, outcomes: 9, completed: "26/72", bonus: 5 },
  { position: 2, name: "Fran", favorite: "🇦🇷 Argentina", points: 39, exact: 4, outcomes: 8, completed: "24/72", bonus: 3 },
  { position: 3, name: "Pame", favorite: "🇧🇷 Brasil", points: 36, exact: 3, outcomes: 9, completed: "23/72", bonus: 4 },
  { position: 4, name: "Jota", favorite: "🇯🇵 Japón", points: 30, exact: 2, outcomes: 8, completed: "21/72", bonus: 2 },
];

type Match = {
  id: string;
  home: string;
  homeFlag: string;
  away: string;
  awayFlag: string;
  kickoffChile: string;
  venue: string;
  city: string;
  broadcasters: string[];
};

type GroupBlock = {
  group: string;
  matches: Match[];
};

export const groupedMatches: GroupBlock[] = [
  {
    group: "A",
    matches: [
      { id: "A1", home: "México", homeFlag: "🇲🇽", away: "Sudáfrica", awayFlag: "🇿🇦", kickoffChile: "11 jun · 15:00", venue: "Mexico City Stadium", city: "Ciudad de México", broadcasters: broadcastersChile },
      { id: "A2", home: "Corea del Sur", homeFlag: "🇰🇷", away: "Chequia", awayFlag: "🇨🇿", kickoffChile: "11 jun · 22:00", venue: "Guadalajara Stadium", city: "Guadalajara", broadcasters: broadcastersChile },
      { id: "A3", home: "Chequia", homeFlag: "🇨🇿", away: "Sudáfrica", awayFlag: "🇿🇦", kickoffChile: "18 jun · 12:00", venue: "Atlanta Stadium", city: "Atlanta", broadcasters: broadcastersChile },
      { id: "A4", home: "México", homeFlag: "🇲🇽", away: "Corea del Sur", awayFlag: "🇰🇷", kickoffChile: "18 jun · 21:00", venue: "Guadalajara Stadium", city: "Guadalajara", broadcasters: broadcastersChile },
      { id: "A5", home: "Chequia", homeFlag: "🇨🇿", away: "México", awayFlag: "🇲🇽", kickoffChile: "24 jun · 21:00", venue: "Mexico City Stadium", city: "Ciudad de México", broadcasters: broadcastersChile },
      { id: "A6", home: "Sudáfrica", homeFlag: "🇿🇦", away: "Corea del Sur", awayFlag: "🇰🇷", kickoffChile: "24 jun · 21:00", venue: "Monterrey Stadium", city: "Monterrey", broadcasters: broadcastersChile },
    ],
  },
  {
    group: "B",
    matches: [
      { id: "B1", home: "Canadá", homeFlag: "🇨🇦", away: "Bosnia y Herzegovina", awayFlag: "🇧🇦", kickoffChile: "12 jun · 15:00", venue: "Toronto Stadium", city: "Toronto", broadcasters: broadcastersChile },
      { id: "B2", home: "Qatar", homeFlag: "🇶🇦", away: "Suiza", awayFlag: "🇨🇭", kickoffChile: "13 jun · 15:00", venue: "San Francisco Bay Area Stadium", city: "San Francisco Bay Area", broadcasters: broadcastersChile },
      { id: "B3", home: "Suiza", homeFlag: "🇨🇭", away: "Bosnia y Herzegovina", awayFlag: "🇧🇦", kickoffChile: "18 jun · 15:00", venue: "Los Angeles Stadium", city: "Los Ángeles", broadcasters: broadcastersChile },
      { id: "B4", home: "Canadá", homeFlag: "🇨🇦", away: "Qatar", awayFlag: "🇶🇦", kickoffChile: "18 jun · 18:00", venue: "BC Place Vancouver", city: "Vancouver", broadcasters: broadcastersChile },
      { id: "B5", home: "Suiza", homeFlag: "🇨🇭", away: "Canadá", awayFlag: "🇨🇦", kickoffChile: "24 jun · 15:00", venue: "BC Place Vancouver", city: "Vancouver", broadcasters: broadcastersChile },
      { id: "B6", home: "Bosnia y Herzegovina", homeFlag: "🇧🇦", away: "Qatar", awayFlag: "🇶🇦", kickoffChile: "24 jun · 15:00", venue: "Seattle Stadium", city: "Seattle", broadcasters: broadcastersChile },
    ],
  },
  {
    group: "C",
    matches: [
      { id: "C1", home: "Brasil", homeFlag: "🇧🇷", away: "Marruecos", awayFlag: "🇲🇦", kickoffChile: "13 jun · 18:00", venue: "New York/New Jersey Stadium", city: "New Jersey", broadcasters: broadcastersChile },
      { id: "C2", home: "Haití", homeFlag: "🇭🇹", away: "Escocia", awayFlag: "🏴", kickoffChile: "13 jun · 21:00", venue: "Boston Stadium", city: "Boston", broadcasters: broadcastersChile },
      { id: "C3", home: "Escocia", homeFlag: "🏴", away: "Marruecos", awayFlag: "🇲🇦", kickoffChile: "19 jun · 18:00", venue: "Boston Stadium", city: "Boston", broadcasters: broadcastersChile },
      { id: "C4", home: "Brasil", homeFlag: "🇧🇷", away: "Haití", awayFlag: "🇭🇹", kickoffChile: "19 jun · 20:30", venue: "Philadelphia Stadium", city: "Filadelfia", broadcasters: broadcastersChile },
      { id: "C5", home: "Escocia", homeFlag: "🏴", away: "Brasil", awayFlag: "🇧🇷", kickoffChile: "24 jun · 18:00", venue: "Miami Stadium", city: "Miami", broadcasters: broadcastersChile },
      { id: "C6", home: "Marruecos", homeFlag: "🇲🇦", away: "Haití", awayFlag: "🇭🇹", kickoffChile: "24 jun · 18:00", venue: "Atlanta Stadium", city: "Atlanta", broadcasters: broadcastersChile },
    ],
  },
  {
    group: "D",
    matches: [
      { id: "D1", home: "USA", homeFlag: "🇺🇸", away: "Paraguay", awayFlag: "🇵🇾", kickoffChile: "12 jun · 21:00", venue: "Los Angeles Stadium", city: "Los Ángeles", broadcasters: broadcastersChile },
      { id: "D2", home: "Australia", homeFlag: "🇦🇺", away: "Turquía", awayFlag: "🇹🇷", kickoffChile: "14 jun · 00:00", venue: "BC Place Vancouver", city: "Vancouver", broadcasters: broadcastersChile },
      { id: "D3", home: "USA", homeFlag: "🇺🇸", away: "Australia", awayFlag: "🇦🇺", kickoffChile: "19 jun · 15:00", venue: "Seattle Stadium", city: "Seattle", broadcasters: broadcastersChile },
      { id: "D4", home: "Turquía", homeFlag: "🇹🇷", away: "Paraguay", awayFlag: "🇵🇾", kickoffChile: "19 jun · 23:00", venue: "San Francisco Bay Area Stadium", city: "San Francisco Bay Area", broadcasters: broadcastersChile },
      { id: "D5", home: "Turquía", homeFlag: "🇹🇷", away: "USA", awayFlag: "🇺🇸", kickoffChile: "25 jun · 22:00", venue: "Los Angeles Stadium", city: "Los Ángeles", broadcasters: broadcastersChile },
      { id: "D6", home: "Paraguay", homeFlag: "🇵🇾", away: "Australia", awayFlag: "🇦🇺", kickoffChile: "25 jun · 22:00", venue: "San Francisco Bay Area Stadium", city: "San Francisco Bay Area", broadcasters: broadcastersChile },
    ],
  },
  {
    group: "E",
    matches: [
      { id: "E1", home: "Alemania", homeFlag: "🇩🇪", away: "Curazao", awayFlag: "🇨🇼", kickoffChile: "14 jun · 13:00", venue: "Houston Stadium", city: "Houston", broadcasters: broadcastersChile },
      { id: "E2", home: "Costa de Marfil", homeFlag: "🇨🇮", away: "Ecuador", awayFlag: "🇪🇨", kickoffChile: "14 jun · 19:00", venue: "Philadelphia Stadium", city: "Filadelfia", broadcasters: broadcastersChile },
      { id: "E3", home: "Alemania", homeFlag: "🇩🇪", away: "Costa de Marfil", awayFlag: "🇨🇮", kickoffChile: "20 jun · 16:00", venue: "Toronto Stadium", city: "Toronto", broadcasters: broadcastersChile },
      { id: "E4", home: "Ecuador", homeFlag: "🇪🇨", away: "Curazao", awayFlag: "🇨🇼", kickoffChile: "20 jun · 20:00", venue: "Kansas City Stadium", city: "Kansas City", broadcasters: broadcastersChile },
      { id: "E5", home: "Curazao", homeFlag: "🇨🇼", away: "Costa de Marfil", awayFlag: "🇨🇮", kickoffChile: "25 jun · 16:00", venue: "Philadelphia Stadium", city: "Filadelfia", broadcasters: broadcastersChile },
      { id: "E6", home: "Ecuador", homeFlag: "🇪🇨", away: "Alemania", awayFlag: "🇩🇪", kickoffChile: "25 jun · 16:00", venue: "New York/New Jersey Stadium", city: "New Jersey", broadcasters: broadcastersChile },
    ],
  },
  {
    group: "F",
    matches: [
      { id: "F1", home: "Países Bajos", homeFlag: "🇳🇱", away: "Japón", awayFlag: "🇯🇵", kickoffChile: "14 jun · 16:00", venue: "Dallas Stadium", city: "Dallas", broadcasters: broadcastersChile },
      { id: "F2", home: "Suecia", homeFlag: "🇸🇪", away: "Túnez", awayFlag: "🇹🇳", kickoffChile: "14 jun · 22:00", venue: "Monterrey Stadium", city: "Monterrey", broadcasters: broadcastersChile },
      { id: "F3", home: "Países Bajos", homeFlag: "🇳🇱", away: "Suecia", awayFlag: "🇸🇪", kickoffChile: "20 jun · 13:00", venue: "Houston Stadium", city: "Houston", broadcasters: broadcastersChile },
      { id: "F4", home: "Túnez", homeFlag: "🇹🇳", away: "Japón", awayFlag: "🇯🇵", kickoffChile: "21 jun · 00:00", venue: "Monterrey Stadium", city: "Monterrey", broadcasters: broadcastersChile },
      { id: "F5", home: "Japón", homeFlag: "🇯🇵", away: "Suecia", awayFlag: "🇸🇪", kickoffChile: "25 jun · 19:00", venue: "Dallas Stadium", city: "Dallas", broadcasters: broadcastersChile },
      { id: "F6", home: "Túnez", homeFlag: "🇹🇳", away: "Países Bajos", awayFlag: "🇳🇱", kickoffChile: "25 jun · 19:00", venue: "Kansas City Stadium", city: "Kansas City", broadcasters: broadcastersChile },
    ],
  },
  {
    group: "G",
    matches: [
      { id: "G1", home: "Bélgica", homeFlag: "🇧🇪", away: "Egipto", awayFlag: "🇪🇬", kickoffChile: "15 jun · 15:00", venue: "Seattle Stadium", city: "Seattle", broadcasters: broadcastersChile },
      { id: "G2", home: "Irán", homeFlag: "🇮🇷", away: "Nueva Zelanda", awayFlag: "🇳🇿", kickoffChile: "15 jun · 21:00", venue: "Los Angeles Stadium", city: "Los Ángeles", broadcasters: broadcastersChile },
      { id: "G3", home: "Bélgica", homeFlag: "🇧🇪", away: "Irán", awayFlag: "🇮🇷", kickoffChile: "21 jun · 15:00", venue: "Los Angeles Stadium", city: "Los Ángeles", broadcasters: broadcastersChile },
      { id: "G4", home: "Nueva Zelanda", homeFlag: "🇳🇿", away: "Egipto", awayFlag: "🇪🇬", kickoffChile: "21 jun · 21:00", venue: "BC Place Vancouver", city: "Vancouver", broadcasters: broadcastersChile },
      { id: "G5", home: "Egipto", homeFlag: "🇪🇬", away: "Irán", awayFlag: "🇮🇷", kickoffChile: "26 jun · 23:00", venue: "Seattle Stadium", city: "Seattle", broadcasters: broadcastersChile },
      { id: "G6", home: "Nueva Zelanda", homeFlag: "🇳🇿", away: "Bélgica", awayFlag: "🇧🇪", kickoffChile: "26 jun · 23:00", venue: "BC Place Vancouver", city: "Vancouver", broadcasters: broadcastersChile },
    ],
  },
  {
    group: "H",
    matches: [
      { id: "H1", home: "España", homeFlag: "🇪🇸", away: "Cabo Verde", awayFlag: "🇨🇻", kickoffChile: "15 jun · 12:00", venue: "Atlanta Stadium", city: "Atlanta", broadcasters: broadcastersChile },
      { id: "H2", home: "Arabia Saudita", homeFlag: "🇸🇦", away: "Uruguay", awayFlag: "🇺🇾", kickoffChile: "15 jun · 18:00", venue: "Miami Stadium", city: "Miami", broadcasters: broadcastersChile },
      { id: "H3", home: "España", homeFlag: "🇪🇸", away: "Arabia Saudita", awayFlag: "🇸🇦", kickoffChile: "21 jun · 12:00", venue: "Atlanta Stadium", city: "Atlanta", broadcasters: broadcastersChile },
      { id: "H4", home: "Uruguay", homeFlag: "🇺🇾", away: "Cabo Verde", awayFlag: "🇨🇻", kickoffChile: "21 jun · 18:00", venue: "Miami Stadium", city: "Miami", broadcasters: broadcastersChile },
      { id: "H5", home: "Cabo Verde", homeFlag: "🇨🇻", away: "Arabia Saudita", awayFlag: "🇸🇦", kickoffChile: "26 jun · 20:00", venue: "Houston Stadium", city: "Houston", broadcasters: broadcastersChile },
      { id: "H6", home: "Uruguay", homeFlag: "🇺🇾", away: "España", awayFlag: "🇪🇸", kickoffChile: "26 jun · 20:00", venue: "Guadalajara Stadium", city: "Guadalajara", broadcasters: broadcastersChile },
    ],
  },
  {
    group: "I",
    matches: [
      { id: "I1", home: "Francia", homeFlag: "🇫🇷", away: "Senegal", awayFlag: "🇸🇳", kickoffChile: "16 jun · 15:00", venue: "New York/New Jersey Stadium", city: "New Jersey", broadcasters: broadcastersChile },
      { id: "I2", home: "Irak", homeFlag: "🇮🇶", away: "Noruega", awayFlag: "🇳🇴", kickoffChile: "16 jun · 18:00", venue: "Boston Stadium", city: "Boston", broadcasters: broadcastersChile },
      { id: "I3", home: "Francia", homeFlag: "🇫🇷", away: "Irak", awayFlag: "🇮🇶", kickoffChile: "22 jun · 17:00", venue: "Philadelphia Stadium", city: "Filadelfia", broadcasters: broadcastersChile },
      { id: "I4", home: "Noruega", homeFlag: "🇳🇴", away: "Senegal", awayFlag: "🇸🇳", kickoffChile: "22 jun · 20:00", venue: "New York/New Jersey Stadium", city: "New Jersey", broadcasters: broadcastersChile },
      { id: "I5", home: "Noruega", homeFlag: "🇳🇴", away: "Francia", awayFlag: "🇫🇷", kickoffChile: "26 jun · 15:00", venue: "Boston Stadium", city: "Boston", broadcasters: broadcastersChile },
      { id: "I6", home: "Senegal", homeFlag: "🇸🇳", away: "Irak", awayFlag: "🇮🇶", kickoffChile: "26 jun · 15:00", venue: "Toronto Stadium", city: "Toronto", broadcasters: broadcastersChile },
    ],
  },
  {
    group: "J",
    matches: [
      { id: "J1", home: "Argentina", homeFlag: "🇦🇷", away: "Argelia", awayFlag: "🇩🇿", kickoffChile: "16 jun · 21:00", venue: "Kansas City Stadium", city: "Kansas City", broadcasters: broadcastersChile },
      { id: "J2", home: "Austria", homeFlag: "🇦🇹", away: "Jordania", awayFlag: "🇯🇴", kickoffChile: "17 jun · 00:00", venue: "San Francisco Bay Area Stadium", city: "San Francisco Bay Area", broadcasters: broadcastersChile },
      { id: "J3", home: "Argentina", homeFlag: "🇦🇷", away: "Austria", awayFlag: "🇦🇹", kickoffChile: "22 jun · 13:00", venue: "Dallas Stadium", city: "Dallas", broadcasters: broadcastersChile },
      { id: "J4", home: "Jordania", homeFlag: "🇯🇴", away: "Argelia", awayFlag: "🇩🇿", kickoffChile: "22 jun · 23:00", venue: "San Francisco Bay Area Stadium", city: "San Francisco Bay Area", broadcasters: broadcastersChile },
      { id: "J5", home: "Argelia", homeFlag: "🇩🇿", away: "Austria", awayFlag: "🇦🇹", kickoffChile: "27 jun · 22:00", venue: "Kansas City Stadium", city: "Kansas City", broadcasters: broadcastersChile },
      { id: "J6", home: "Jordania", homeFlag: "🇯🇴", away: "Argentina", awayFlag: "🇦🇷", kickoffChile: "27 jun · 22:00", venue: "Dallas Stadium", city: "Dallas", broadcasters: broadcastersChile },
    ],
  },
  {
    group: "K",
    matches: [
      { id: "K1", home: "Portugal", homeFlag: "🇵🇹", away: "Congo DR", awayFlag: "🇨🇩", kickoffChile: "17 jun · 13:00", venue: "Houston Stadium", city: "Houston", broadcasters: broadcastersChile },
      { id: "K2", home: "Uzbekistán", homeFlag: "🇺🇿", away: "Colombia", awayFlag: "🇨🇴", kickoffChile: "17 jun · 22:00", venue: "Mexico City Stadium", city: "Ciudad de México", broadcasters: broadcastersChile },
      { id: "K3", home: "Portugal", homeFlag: "🇵🇹", away: "Uzbekistán", awayFlag: "🇺🇿", kickoffChile: "23 jun · 13:00", venue: "Houston Stadium", city: "Houston", broadcasters: broadcastersChile },
      { id: "K4", home: "Colombia", homeFlag: "🇨🇴", away: "Congo DR", awayFlag: "🇨🇩", kickoffChile: "23 jun · 22:00", venue: "Guadalajara Stadium", city: "Guadalajara", broadcasters: broadcastersChile },
      { id: "K5", home: "Colombia", homeFlag: "🇨🇴", away: "Portugal", awayFlag: "🇵🇹", kickoffChile: "27 jun · 19:30", venue: "Miami Stadium", city: "Miami", broadcasters: broadcastersChile },
      { id: "K6", home: "Congo DR", homeFlag: "🇨🇩", away: "Uzbekistán", awayFlag: "🇺🇿", kickoffChile: "27 jun · 19:30", venue: "Atlanta Stadium", city: "Atlanta", broadcasters: broadcastersChile },
    ],
  },
  {
    group: "L",
    matches: [
      { id: "L1", home: "Inglaterra", homeFlag: "🏴", away: "Croacia", awayFlag: "🇭🇷", kickoffChile: "17 jun · 16:00", venue: "Dallas Stadium", city: "Dallas", broadcasters: broadcastersChile },
      { id: "L2", home: "Ghana", homeFlag: "🇬🇭", away: "Panamá", awayFlag: "🇵🇦", kickoffChile: "17 jun · 19:00", venue: "Toronto Stadium", city: "Toronto", broadcasters: broadcastersChile },
      { id: "L3", home: "Inglaterra", homeFlag: "🏴", away: "Ghana", awayFlag: "🇬🇭", kickoffChile: "23 jun · 16:00", venue: "Boston Stadium", city: "Boston", broadcasters: broadcastersChile },
      { id: "L4", home: "Panamá", homeFlag: "🇵🇦", away: "Croacia", awayFlag: "🇭🇷", kickoffChile: "23 jun · 19:00", venue: "Toronto Stadium", city: "Toronto", broadcasters: broadcastersChile },
      { id: "L5", home: "Panamá", homeFlag: "🇵🇦", away: "Inglaterra", awayFlag: "🏴", kickoffChile: "27 jun · 17:00", venue: "New York/New Jersey Stadium", city: "New Jersey", broadcasters: broadcastersChile },
      { id: "L6", home: "Croacia", homeFlag: "🇭🇷", away: "Ghana", awayFlag: "🇬🇭", kickoffChile: "27 jun · 17:00", venue: "Philadelphia Stadium", city: "Filadelfia", broadcasters: broadcastersChile },
    ],
  },
];

export const matches = groupedMatches.flatMap((group) =>
  group.matches.map((match) => ({
    ...match,
    group: group.group,
    stage: `Fase de grupos · Grupo ${group.group}`,
    status: "Abierto",
    bonus: match.home === sampleUser.favoriteTeam || match.away === sampleUser.favoriteTeam,
    predicted: "Pendiente",
    homePrediction: 0,
    awayPrediction: 0,
  }))
);

export const dashboardStats = [
  { label: "Puntos totales", value: String(sampleUser.points) },
  { label: "Exactos", value: String(sampleUser.exact) },
  { label: "Pronósticos cargados", value: `${sampleUser.completed}/72` },
];

export const quickSummary = [
  { label: "Grupos", value: "12" },
  { label: "Partidos", value: "72" },
  { label: "TV Chile", value: broadcastersChile.join(" + ") },
];

export const profileStats = [
  { label: "Favorito", value: `${sampleUser.favoriteFlag} ${sampleUser.favoriteTeam}` },
  { label: "Bonus ganados", value: "+5" },
  { label: "Grupo activo", value: sampleUser.group },
];
