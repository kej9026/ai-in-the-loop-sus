
import fs from 'fs';
import path from 'path';

// Simple .env.local parser
const envPath = path.resolve(process.cwd(), '.env.local');
let env = {};
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["']|["']$/g, '');
            env[key] = value;
        }
    });
}

const TMDB_KEY = env.TMDB_API_KEY;
const RAWG_KEY = env.RAWG_API_KEY;
const GOOGLE_KEY = env.GOOGLE_BOOKS_API_KEY;

if (!TMDB_KEY || !RAWG_KEY) {
    console.error("Missing keys. TMDB:", !!TMDB_KEY, "RAWG:", !!RAWG_KEY);
    process.exit(1);
}

async function inspectAPIs() {
    console.log("\n--- TMDB MOVIE (Inception) ---");
    // Search first to get ID
    const searchRes = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=Inception`);
    const searchData = await searchRes.json();
    const movieId = searchData.results?.[0]?.id;
    if (movieId) {
        // Details
        const detailRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_KEY}&language=ko-KR`);
        const detailData = await detailRes.json();
        console.log("Details Keys:", Object.keys(detailData));
        // Credits
        const creditsRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${TMDB_KEY}&language=ko-KR`);
        const creditsData = await creditsRes.json();
        console.log("Credits Keys:", Object.keys(creditsData));
        console.log("Crew Sample:", creditsData.crew?.[0]);
        console.log("Cast Sample:", creditsData.cast?.[0]);
    }

    console.log("\n--- RAWG GAME (The Legend of Zelda: Breath of the Wild) ---");
    const gameSearchRes = await fetch(`https://api.rawg.io/api/games?key=${RAWG_KEY}&search=Breath%20of%20the%20Wild&page_size=1`);
    const gameSearchData = await gameSearchRes.json();
    const gameId = gameSearchData.results?.[0]?.id;
    if (gameId) {
        const gameDetailRes = await fetch(`https://api.rawg.io/api/games/${gameId}?key=${RAWG_KEY}`);
        const gameDetailData = await gameDetailRes.json();
        console.log("Game Details Keys:", Object.keys(gameDetailData));
        console.log("Developers:", gameDetailData.developers);
        console.log("Publishers:", gameDetailData.publishers);
        console.log("Platforms:", gameDetailData.platforms?.map(p => p.platform.name));
        console.log("Metacritic:", gameDetailData.metacritic);
        console.log("Tags Sample:", gameDetailData.tags?.[0]);
    }

    console.log("\n--- GOOGLE BOOKS (Clean Code) ---");
    const keyParam = GOOGLE_KEY ? `&key=${GOOGLE_KEY}` : '';
    const bookRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=Clean%20Code${keyParam}&maxResults=1`);
    const bookData = await bookRes.json();
    const bookInfo = bookData.items?.[0]?.volumeInfo;
    if (bookInfo) {
        console.log("Book VolumeInfo Keys:", Object.keys(bookInfo));
        console.log("Authors:", bookInfo.authors);
        console.log("Publisher:", bookInfo.publisher);
        console.log("Categories:", bookInfo.categories);
        console.log("PageCount:", bookInfo.pageCount);
    }
}

inspectAPIs();
