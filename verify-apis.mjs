
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
            const value = match[2].trim().replace(/^["']|["']$/g, ''); // remove quotes
            env[key] = value;
        }
    });
}

const TMDB_KEY = env.TMDB_API_KEY;
const RAWG_KEY = env.RAWG_API_KEY;
const GOOGLE_KEY = env.GOOGLE_BOOKS_API_KEY;

console.log('Testing APIs...');

async function testTMDB() {
    if (!TMDB_KEY) return console.log('❌ TMDB_API_KEY missing');
    try {
        const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=Inception`);
        if (res.ok) console.log('✅ TMDB Connection OK');
        else console.log('❌ TMDB Failed:', res.status);
    } catch (e) { console.log('❌ TMDB Error:', e.message); }
}

async function testRAWG() {
    if (!RAWG_KEY) return console.log('❌ RAWG_API_KEY missing');
    try {
        const res = await fetch(`https://api.rawg.io/api/games?key=${RAWG_KEY}&search=Zelda&page_size=1`);
        if (res.ok) console.log('✅ RAWG Connection OK');
        else console.log('❌ RAWG Failed:', res.status);
    } catch (e) { console.log('❌ RAWG Error:', e.message); }
}

async function testGoogle() {
    // Google Books works without key but better with it
    try {
        const keyParam = GOOGLE_KEY ? `&key=${GOOGLE_KEY}` : '';
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=Clean%20Code${keyParam}&maxResults=1`);
        if (res.ok) console.log('✅ Google Books Connection OK');
        else console.log('❌ Google Books Failed:', res.status);
    } catch (e) { console.log('❌ Google Books Error:', e.message); }
}

await testTMDB();
await testRAWG();
await testGoogle();
