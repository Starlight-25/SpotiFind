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
