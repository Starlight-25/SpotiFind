export interface LastfmImage {
  "#text": string;
  size: "small" | "medium" | "large" | "extralarge";
}

export interface LastfmTrack {
  name: string;
  artist: string;
  url: string;
  listeners: string;
  image: LastfmImage[];
  mbid: string;
}

export interface LastfmArtist {
  name: string;
  listeners: string;
  url: string;
  image: LastfmImage[];
  mbid: string;
  thumb?: string;
}

export interface LastfmAlbum {
  name: string;
  artist: string;
  url: string;
  image: LastfmImage[];
  mbid: string;
}

export interface SearchResults {
  tracks: LastfmTrack[];
  artists: LastfmArtist[];
  albums: LastfmAlbum[];
}

export interface LastfmTrackDetail {
  name: string;
  duration: string;
  listeners?: string;
  "@attr"?: { rank: string };
}

export interface AlbumDetail {
  name: string;
  artist: string;
  image: LastfmImage[];
  tracks: LastfmTrackDetail[];
  playcount?: string;
  listeners?: string;
}

export interface ArtistTopTrack {
  name: string;
  imageUrl: string | null;
  albumName: string | null;
  listeners: string | null;
}

export interface ArtistAlbum {
  name: string;
  release_date: string;
  imageUrl: string | null;
}
