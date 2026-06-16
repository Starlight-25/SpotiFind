export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getSpotifyToken } = await import("@/lib/spotify");
    try {
      await getSpotifyToken();
      console.log("✅ Spotify token acquired successfully");
    } catch (err) {
      console.error("❌ Spotify token acquisition failed:", (err as Error).message);
    }
  }
}
