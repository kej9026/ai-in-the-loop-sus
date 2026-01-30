"use server"

export type ExternalMediaItem = {
    id: string
    title: string
    type: "movie" | "game" | "book"
    year?: string
    posterUrl?: string
    overview?: string
}

const TMDB_API_KEY = process.env.TMDB_API_KEY
const RAWG_API_KEY = process.env.RAWG_API_KEY
const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY

export async function searchExternalMedia(
    query: string,
    type: "movie" | "game" | "book" = "movie"
): Promise<ExternalMediaItem[]> {
    if (!query || query.length < 2) return []

    try {
        switch (type) {
            case "movie":
                return await searchTMDB(query)
            case "game":
                return await searchRAWG(query)
            case "book":
                return await searchGoogleBooks(query)
            default:
                return []
        }
    } catch (error) {
        console.error("External Search Error:", error)
        return []
    }
}

async function searchTMDB(query: string): Promise<ExternalMediaItem[]> {
    if (!TMDB_API_KEY) return []

    const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
        query
    )}&language=ko-KR&page=1`

    const res = await fetch(url)
    const data = await res.json()

    if (!data.results) return []

    return data.results.slice(0, 5).map((item: any) => ({
        id: item.id.toString(),
        title: item.title,
        type: "movie",
        year: item.release_date?.substring(0, 4),
        posterUrl: item.poster_path
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
            : undefined,
        overview: item.overview,
    }))
}

async function searchRAWG(query: string): Promise<ExternalMediaItem[]> {
    if (!RAWG_API_KEY) return []

    const url = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(
        query
    )}&page_size=5`

    const res = await fetch(url)
    const data = await res.json()

    if (!data.results) return []

    return data.results.map((item: any) => ({
        id: item.id.toString(),
        title: item.name,
        type: "game",
        year: item.released?.substring(0, 4),
        posterUrl: item.background_image, // RAWG uses background_image usually
        overview: "", // RAWG list endpoint doesn't return description usually
    }))
}

async function searchGoogleBooks(query: string): Promise<ExternalMediaItem[]> {
    // Google Books API key is optional usually but good to have
    const keyParam = GOOGLE_BOOKS_API_KEY ? `&key=${GOOGLE_BOOKS_API_KEY}` : ""
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        query
    )}${keyParam}&maxResults=5`

    const res = await fetch(url)
    const data = await res.json()

    if (!data.items) return []

    return data.items.map((item: any) => ({
        id: item.id,
        title: item.volumeInfo.title,
        type: "book",
        year: item.volumeInfo.publishedDate?.substring(0, 4),
        posterUrl: item.volumeInfo.imageLinks?.thumbnail?.replace("http:", "https:"),
        overview: item.volumeInfo.description,
        // Google Books search often has author/publisher in list
        author: item.volumeInfo.authors?.[0],
        publisher: item.volumeInfo.publisher
    }))
}

export async function fetchMediaDetails(id: string, type: "movie" | "game" | "book", knownData?: any): Promise<Record<string, any>> {
    try {
        switch (type) {
            case "movie":
                return await fetchTMDBDetails(id)
            case "game":
                return await fetchRAWGDetails(id)
            case "book":
                // Book details are usually sufficient from search, but we can pass through what we have
                return {
                    author: knownData?.author,
                    publisher: knownData?.publisher
                }
            default:
                return {}
        }
    } catch (error) {
        console.error("Fetch Details Error:", error)
        return {}
    }
}

async function fetchTMDBDetails(id: string) {
    if (!TMDB_API_KEY) return {}

    // Fetch Credits for Director & Cast
    const url = `https://api.themoviedb.org/3/movie/${id}/credits?api_key=${TMDB_API_KEY}&language=ko-KR`
    const res = await fetch(url)
    const data = await res.json()

    const director = data.crew?.find((p: any) => p.job === "Director")?.name
    const cast = data.cast?.slice(0, 5).map((p: any) => p.name)

    return {
        director,
        cast
    }
}

async function fetchRAWGDetails(id: string) {
    // RAWG lists don't have developers, need detail endpoint
    if (!RAWG_API_KEY) return {}

    const url = `https://api.rawg.io/api/games/${id}?key=${RAWG_API_KEY}`
    const res = await fetch(url)
    const data = await res.json()

    return {
        developer: data.developers?.[0]?.name,
        publisher: data.publishers?.[0]?.name,
        released: data.released // Full date if needed
    }
}
