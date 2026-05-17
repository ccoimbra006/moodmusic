// Mood detection based on song title, artist and genre keywords
// No external APIs needed - works 100% offline

const MOOD_KEYWORDS: Record<string, string[]> = {
  chill: [
    "chill", "relax", "relaxed", "lofi", "lo-fi", "acoustic", "soft", "mellow",
    "smooth", "ambient", "calm", "peaceful", "gentle", "easy", "laid", "back",
    "downtempo", "trip hop", "trip-hop", "lounge", "bossa", "nova", "reggae",
    "wave", "surf", "summer", "sunset", "breeze", "lazy", "slow",
    "quiet", "serene", "tranquil", "dreamy", "sleep", "bedtime", "nap",
    "rain", "coffee", "morning", "sunday", "drive", "cruise", "coast", "ocean",
    "beach", "tropical", "island", "hammock", "palm", "sundown", "twilight",
    "vibes", "cool", "laidback", "easygoing", "mild", "softly",
  ],
  energy: [
    "energy", "energetic", "power", "powerful", "strong", "workout", "gym", "run",
    "running", "training", "fitness", "sprint", "race", "competition",
    "edm", "electro", "electronic", "dubstep", "drum", "bass", "dnb", "hardstyle",
    "techno", "hardcore", "punk", "metal", "heavy", "hard rock", "alternative rock",
    "intense", "hard", "fast", "aggressive", "fight", "battle", "war", "warrior",
    "sport", "exercise", "cardio", "lift", "pump", "adrenaline", "rush",
    "rage", "fury", "furious", "wild", "crazy", "insane", "turbo", "boost",
    "hype", "lit", "fire", "explosive", "bang", "drop", "banger", "anthem",
    "mosh", "rave", "club", "party hard", "lets go", "letsgo",
    "unstoppable", "invincible", "champion", "power up", "level up", "max",
    "speed", "velocity", "accelerate", "thunder", "lightning", "storm",
  ],
  happy: [
    "happy", "happiness", "joy", "joyful", "smile", "smiling", "laugh", "laughing",
    "sunshine", "sunny", "bright", "light", "shiny", "golden", "glitter", "sparkle",
    "party", "partying", "celebration", "celebrate", "dance", "dancing", "groove",
    "grooving", "funk", "funky", "disco", "pop", "poppy", "upbeat", "cheerful",
    "merry", "fun", "funny", "playful", "optimistic", "positive", "good", "great",
    "awesome", "fantastic", "wonderful", "amazing", "perfect", "beautiful", "pretty",
    "love life", "good life", "best life", "best", "winner", "victory", "triumph",
    "bounce", "jump", "skip", "walk", "stroll", "picnic", "festival", "carnival",
    "good time", "goodtime", "feel good", "feelgood", "high", "on top", "cloud",
    "dream", "dreaming", "sweet dream", "lucky", "blessed", "grateful",
    "alive", "living", "youth", "young", "free", "freedom", "fly", "flying",
    "shine", "glow", "glowing", "radiant", "brilliant", "magnificent",
    "super", "cool", "sweet", "nice", "lovely", "delight", "delightful",
    "up", "rising", "rise", "soar", "bliss", "euphoria", "euphoric",
  ],
  melancholy: [
    "sad", "sadness", "sorrow", "sorry", "cry", "crying", "tears", "teardrop",
    "hurt", "hurting", "pain", "painful", "aching", "ache", "broken", "shattered",
    "alone", "lonely", "loneliness", "solitude", "isolated", "empty", "hollow",
    "dark", "darkness", "black", "night", "midnight", "cold", "freeze", "frozen",
    "lost", "confused", "wandering", "nowhere", "gone", "disappear", "vanish",
    "goodbye", "farewell", "bye", "end", "ending", "final", "last", "never",
    "melancholy", "melancholic", "blue", "blues", "grey", "gray", "dull",
    "rainy", "rain", "storm", "thunder", "cloud", "cloudy", "fog", "mist",
    "winter", "december", "november", "autumn", "fall", "dying", "death",
    "dead", "ghost", "haunt", "haunted", "memories", "remember", "past",
    "used to", "once", "before", "back then", "nostalgia", "nostalgic",
    "regret", "regretful", "mistake", "wrong", "miss you", "missing",
    "without", "absence", "void", "nothing", "numb", "somber", "mourn",
    "mourning", "grief", "grieving", "heartbreak", "heartbroken",
    "wounded", "scar", "scarred", "bruise", "bleeding", "bleed",
    "shadow", "silhouette", "fade", "fading", "wilt", "wither",
    "drown", "drowning", "sink", "sinking", "down", "falling", "fall",
    "apart", "broken heart", "tear", "weep", "weeping", "lament",
  ],
  romantic: [
    "love", "loving", "lover", "lovers", "beloved", "loved", "in love",
    "heart", "hearts", "heartbeat", "kiss", "kissing", "hug", "holding",
    "hold me", "hold you", "romance", "romantic", "passion", "passionate",
    "desire", "desiring", "crush", "falling for", "falling in love",
    "together", "forever", "always", "eternal", "eternity", "everlasting",
    "devotion", "devoted", "intimate", "intimacy", "closer", "close to you",
    "sweet", "sweetness", "tender", "tenderness", "caring", "darling",
    "baby", "babe", "honey", "dear", "sugar", "angel", "heaven",
    "wedding", "marriage", "bride", "groom", "date", "dating", "anniversary",
    "rose", "roses", "petals", "flower", "bloom", "blossom",
    "moonlight", "moon", "star", "stars", "starry",
    "dance with", "slow dance", "dancing with", "sway",
    "serenade", "candle", "candlelight", "fireplace", "velvet", "silk",
    "embrace", "embracing", "whisper", "whispers", "touch", "touches",
    "skin", "breathe", "breath", "sigh", "dream of you", "think of you",
    "only you", "you and i", "you & i", "just us", "two of us",
    "belong", "belonging", "yours", "mine", "us", "we",
    "soulmate", "destiny", "fate", "meant to be", "chemistry",
    "seduce", "seduction", "charm", "charming", "enchant", "enchanted",
  ],
  focus: [
    "focus", "focusing", "study", "studying", "concentration", "concentrating",
    "deep work", "flow", "zone", "in the zone", "thinking", "thought",
    "classical", "baroque", "piano", "violin", "cello", "strings", "harp",
    "symphony", "concerto", "nocturne", "etude", "prelude", "opus", "overture",
    "instrumental", "no vocals", "minimal", "minimalist", "repetitive", "loop",
    "meditation", "meditative", "mindfulness", "mindful", "yoga", "zen",
    "therapy", "healing", "reiki", "chakra", "balance", "harmony",
    "nature", "forest", "rainforest", "jungle", "river", "stream", "brook",
    "white noise", "brown noise", "pink noise", "soundscape", "generative",
    "alpha waves", "beta waves", "theta waves", "delta waves",
    "binaural", "isochronic", "frequency", "hz", "hertz",
    "timer", "pomodoro", "session", "task", "productive", "productivity",
    "coding", "programming", "reading", "writing", "working",
    "drone", "texture", "pad", "synth pad", "space",
    "cosmic", "galaxy", "nebula", "aurora", "crystal", "bowl",
  ],
};

// Build artist map ensuring no duplicates (last value wins for intentional overrides)
function buildArtistMap(): Map<string, string> {
  const entries: [string, string][] = [
    // CHILL
    ["chilledcow", "chill"], ["lofi girl", "chill"], ["nujabes", "chill"],
    ["j dilla", "chill"], ["bonobo", "chill"], ["emancipator", "chill"],
    ["tycho", "chill"], ["moby", "chill"], ["st germain", "chill"],
    ["thievery corporation", "chill"], ["zero 7", "chill"], ["air", "chill"],
    ["portishead", "chill"], ["massive attack", "chill"], ["morcheeba", "chill"],
    ["boards of canada", "focus"], ["four tet", "chill"], ["caribou", "chill"],
    ["rjd2", "chill"], ["washed out", "chill"], ["toro y moi", "chill"],
    ["neon indian", "chill"], ["wild nothing", "chill"], ["beach house", "chill"],
    ["mac demarco", "chill"], ["khruangbin", "chill"], ["men i trust", "chill"],
    ["homeshake", "chill"], ["tame impala", "chill"], ["mgmt", "chill"],
    ["gorillaz", "chill"], ["fat freddys drop", "chill"], ["aryay", "chill"],
    // ENERGY
    ["skrillex", "energy"], ["martin garrix", "energy"], ["david guetta", "energy"],
    ["calvin harris", "energy"], ["tiesto", "energy"], ["hardwell", "energy"],
    ["afrojack", "energy"], ["dj snake", "energy"], ["major lazer", "energy"],
    ["the chainsmokers", "energy"], ["diplo", "energy"], ["marshmello", "energy"],
    ["avicii", "happy"], ["swedish house mafia", "energy"], ["zedd", "energy"],
    ["metallica", "energy"], ["acdc", "energy"], ["iron maiden", "energy"],
    ["rammstein", "energy"], ["slipknot", "energy"], ["linkin park", "energy"],
    ["system of a down", "energy"], ["rage against", "energy"], ["nirvana", "energy"],
    ["foo fighters", "energy"], ["queen", "happy"], ["led zeppelin", "energy"],
    ["guns n roses", "energy"], ["red hot chili", "energy"], ["arctic monkeys", "energy"],
    ["the strokes", "energy"], ["royal blood", "energy"],
    ["fall out boy", "energy"], ["panic at the disco", "energy"], ["twenty one pilots", "energy"],
    ["imagine dragons", "energy"],
    ["killers", "energy"], ["cage the elephant", "energy"],
    ["sia", "happy"], ["pink", "energy"], ["christina aguilera", "energy"],
    ["jennifer lopez", "energy"], ["pitbull", "happy"], ["flo rida", "happy"],
    ["ne-yo", "happy"], ["usher", "happy"], ["chris brown", "happy"], ["ciara", "energy"],
    // HAPPY
    ["pharrell", "happy"], ["bruno mars", "happy"], ["katy perry", "happy"],
    ["taylor swift", "happy"], ["dua lipa", "happy"], ["justin timberlake", "happy"],
    ["beyonce", "happy"], ["rihanna", "happy"], ["lady gaga", "happy"],
    ["ariana grande", "happy"], ["ed sheeran", "happy"], ["maroon 5", "happy"],
    ["michael jackson", "happy"], ["prince", "happy"], ["outkast", "happy"],
    ["daft punk", "happy"], ["earth wind", "happy"], ["kool", "happy"],
    ["mark ronson", "happy"], ["justin bieber", "happy"], ["jason mraz", "happy"],
    ["colbie caillat", "happy"], ["train", "happy"], ["onerepublic", "happy"],
    ["mika", "happy"], ["lily allen", "happy"], ["natasha bedingfield", "happy"],
    ["daniel powter", "happy"],
    ["owl city", "happy"], ["macklemore", "happy"],
    ["walk the moon", "happy"], ["american authors", "happy"], ["passion pit", "happy"],
    ["st lucia", "happy"], ["capital cities", "happy"],
    ["clean bandit", "happy"], ["kygo", "happy"],
    ["sam smith", "melancholy"], ["jess glynne", "happy"], ["ella henderson", "happy"],
    ["rachel platten", "happy"], ["meghan trainor", "happy"], ["charli xcx", "happy"],
    ["zara larsson", "happy"], ["anne-marie", "happy"], ["rita ora", "happy"],
    ["camila cabello", "happy"], ["shawn mendes", "happy"],
    ["charlie puth", "happy"],
    ["bazzi", "happy"], ["lewis capaldi", "melancholy"],
    ["harry styles", "happy"], ["niall horan", "happy"], ["liam payne", "happy"],
    ["louis tomlinson", "happy"], ["zayn", "happy"], ["5 seconds", "happy"],
    ["why dont we", "happy"], ["prettymuch", "happy"], ["in real life", "happy"],
    ["ajr", "happy"], ["surfaces", "happy"], ["benee", "happy"],
    ["doja cat", "happy"], ["megan thee", "happy"], ["lizzo", "happy"],
    // MELANCHOLY
    ["radiohead", "melancholy"], ["the cure", "melancholy"], ["joy division", "melancholy"],
    ["nick cave", "melancholy"], ["leonard cohen", "melancholy"],
    ["jeff buckley", "melancholy"], ["elliott smith", "melancholy"],
    ["sufjan stevens", "melancholy"], ["bon iver", "melancholy"], ["damien rice", "melancholy"],
    ["adele", "melancholy"], ["amy winehouse", "melancholy"], ["lana del rey", "melancholy"],
    ["billie eilish", "melancholy"], ["the smiths", "melancholy"],
    ["placebo", "melancholy"], ["sigur ros", "melancholy"], ["the national", "melancholy"],
    ["beirut", "melancholy"], ["bright eyes", "melancholy"], ["conor oberst", "melancholy"],
    ["regina spektor", "melancholy"], ["ingrid michaelson", "melancholy"],
    ["sara bareilles", "melancholy"], ["alessia cara", "melancholy"],
    ["lorde", "melancholy"], ["melanie martinez", "melancholy"],
    ["halsey", "melancholy"], ["troye sivan", "melancholy"], ["lauv", "melancholy"],
    ["jeremy zucker", "melancholy"], ["cavetown", "melancholy"], ["girl in red", "melancholy"],
    ["conan gray", "melancholy"], ["olivia rodrigo", "melancholy"],
    ["james bay", "melancholy"], ["george ezra", "happy"],
    ["dean lewis", "melancholy"], ["tom odell", "melancholy"],
    ["ben howard", "melancholy"], ["mumford", "melancholy"], ["the lumineers", "melancholy"],
    ["passenger", "melancholy"], ["edward sharpe", "happy"],
    ["of monsters", "melancholy"], ["bastille", "melancholy"], ["kodaline", "melancholy"],
    ["snow patrol", "melancholy"], ["keane", "melancholy"], ["travis", "melancholy"],
    ["coldplay", "happy"], ["thom yorke", "melancholy"],
    ["john mayer", "melancholy"], ["jack johnson", "chill"],
    ["city and colour", "melancholy"], ["ray lamontagne", "melancholy"],
    ["the weeknd", "melancholy"], ["frank ocean", "melancholy"], ["sampha", "melancholy"],
    ["fka twigs", "melancholy"], ["james blake", "melancholy"], ["rhye", "romantic"],
    ["juice wrld", "melancholy"],
    ["post malone", "melancholy"], ["lil peep", "melancholy"], ["mac miller", "melancholy"],
    ["xxxtentacion", "melancholy"], ["lil uzi", "energy"],
    // ROMANTIC
    ["al green", "romantic"], ["marvin gaye", "romantic"], ["barry white", "romantic"],
    ["luther vandross", "romantic"], ["boyz ii men", "romantic"],
    ["whitney houston", "romantic"], ["celine dion", "romantic"], ["shania twain", "happy"],
    ["diana krall", "romantic"], ["norah jones", "romantic"], ["sade", "romantic"],
    ["etta james", "romantic"], ["nina simone", "romantic"], ["louis armstrong", "romantic"],
    ["frank sinatra", "romantic"], ["tony bennett", "romantic"], ["michael buble", "romantic"],
    ["rod stewart", "romantic"], ["bryan adams", "romantic"], ["richard marx", "romantic"],
    ["lionel richie", "romantic"], ["billy joel", "happy"], ["elton john", "happy"],
    ["john legend", "romantic"], ["alicia keys", "romantic"], ["jill scott", "romantic"],
    ["maxwell", "romantic"], ["erykah badu", "romantic"], ["dangelo", "romantic"],
    ["anthony hamilton", "romantic"], ["raheem devaughn", "romantic"],
    ["gerald levert", "romantic"], ["keith sweat", "romantic"], ["jodeci", "romantic"],
    ["kci and jojo", "romantic"], ["sam cooke", "romantic"], ["otis redding", "romantic"],
    ["percy sledge", "romantic"], ["ben e king", "romantic"], ["the drifters", "romantic"],
    ["smokey robinson", "romantic"], ["the miracles", "romantic"],
    ["isley brothers", "romantic"], ["temptations", "romantic"],
    ["paul anka", "romantic"], ["andy williams", "romantic"], ["perry como", "romantic"],
    ["nat king cole", "romantic"], ["dean martin", "romantic"],
    ["ella fitzgerald", "romantic"], ["sarah vaughan", "romantic"],
    ["diana ross", "romantic"], ["gladys knight", "romantic"],
    ["patti labelle", "romantic"], ["anita baker", "romantic"],
    ["chaka khan", "romantic"], ["tina turner", "energy"],
    ["james arthur", "melancholy"],
    // FOCUS
    ["bach", "focus"], ["mozart", "focus"], ["beethoven", "focus"], ["chopin", "focus"],
    ["debussy", "focus"], ["satie", "focus"], ["ravel", "focus"], ["handel", "focus"],
    ["vivaldi", "focus"], ["yiruma", "focus"], ["ludovico einaudi", "focus"],
    ["max richter", "focus"], ["olafur arnalds", "focus"], ["hans zimmer", "focus"],
    ["johann johannsson", "focus"], ["nils frahm", "focus"], ["joep beving", "focus"],
    ["philip glass", "focus"], ["steve reich", "focus"], ["brian eno", "focus"],
    ["robert rich", "focus"], ["harold budd", "focus"], ["cluster", "focus"],
    ["tangerine dream", "focus"], ["kraftwerk", "focus"], ["aphex twin", "focus"],
    ["carbon based lifeforms", "focus"],
    ["solar fields", "focus"], ["asura", "focus"], ["shpongle", "focus"],
    ["entheogenic", "focus"], ["celsius", "focus"], ["bluetech", "focus"],
    ["ulrich schnauss", "focus"],
    ["helios", "focus"], ["goldmund", "focus"], ["akira kosemura", "focus"],
    ["fox capture plan", "focus"], ["toe", "focus"], ["mouse on the keys", "focus"],
    ["go go penguin", "focus"], ["portico quartet", "focus"], ["mammal hands", "focus"],
    ["badbadnotgood", "focus"], ["snarky puppy", "focus"],
  ];
  return new Map(entries);
}

const ARTIST_MOODS = buildArtistMap();

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ");
}

function scoreText(text: string, keywords: string[]): number {
  const normalized = normalizeText(text);
  let score = 0;
  for (const keyword of keywords) {
    if (normalized.includes(keyword)) {
      score += keyword.length;
    }
  }
  return score;
}

export function detectMoodFromText(title: string, artist: string): string | null {
  const combined = `${title} ${artist}`;
  const normalizedArtist = normalizeText(artist);

  console.log("[MoodAI] Analyzing:", { title, artist, normalizedArtist });

  // 1. Check artist mapping first (strong signal)
  for (const [artistName, mood] of ARTIST_MOODS) {
    if (normalizedArtist.includes(artistName)) {
      console.log(`[MoodAI] Artist match: "${artistName}" → ${mood}`);
      return mood;
    }
  }

  // 2. Score each mood based on keyword matches
  let bestMood: string | null = null;
  let bestScore = 0;

  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    const score = scoreText(combined, keywords);
    if (score > bestScore) {
      bestScore = score;
      bestMood = mood;
    }
  }

  console.log(`[MoodAI] Keyword scores: best=${bestMood} score=${bestScore}`);

  return bestScore >= 2 ? bestMood : null;
}
