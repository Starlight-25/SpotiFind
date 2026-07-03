# SpotiFind
![logo.png](public/logo.png)

## 📖 Introduction
SpotiFind is a high-performance web platform designed to search, explore, and organize musical content in real time by leveraging the Last.fm API. Developed using Next.js (App Router) and TypeScript, this application provides a fast, fully responsive, and type-safe experience across both desktop and mobile devices.

This project was built from scratch as an intensive integration challenge during an ongoing engineering internship at Zelian.

## 🛠️ Tech Stack & Key Features

* **Framework & Language:** Next.js 14+ (App Router) & TypeScript for robust type safety and native file-system routing.
* **API Integration:** Consumes the Last.fm API (proxied through Next.js Route Handlers) for search, artist/track/album details, and genre exploration.
* **Authentication:** Email/password auth via Supabase (`@supabase/supabase-js`, `@supabase/ssr`), including signup, login, password reset, and session handling.
* **Component-Driven UI:** Built with reusable, strictly-typed UI components (Search Bar, Media Cards, Skeleton Loaders, Genre Rows).
* **Data Persistence:** Favorites are stored in `localStorage` for anonymous users and synced to Supabase on login, with an import prompt to migrate existing local favorites.
* **UX State Management:** Built-in handling for Loading, Error, and Empty states.

## 📂 Project Architecture

The application implements dynamic routing and smooth navigation across the following views:

* `src/app/page.tsx` — **Homepage & Global Search:** Features a central search bar fetching real-time results categorized into Artists, Albums, and Tracks, plus genre-based exploration rows.
* `src/app/artist/[id]/page.tsx` — **Dynamic Artist Profile:** Displays the artist's artwork, bio, top tracks, and related content.
* `src/app/album/[id]/page.tsx` — **Dynamic Album Page:** Displays the album cover, release metadata, and a complete clickable tracklist.
* `src/app/favourites/page.tsx` — **Favourites:** Lists tracks bookmarked by the user, backed by `localStorage` or Supabase depending on auth state.
* `src/app/historique/page.tsx` — **Search History:** Lists the user's recent searches.
* `src/app/login/page.tsx`, `src/app/signup/page.tsx`, `src/app/forgot-password/page.tsx`, `src/app/reset-password/page.tsx` — **Authentication:** Supabase-backed account creation, login, and password recovery flows.

## 📜 License
Copyright (c) 2026 Starlight
Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)

You are allowed to use this project for personal and non-commercial purposes only. 
Modification, redistribution, or commercial use of this project, in whole or in part, is strictly prohibited.


For full license details, see: https://creativecommons.org/licenses/by-nc-nd/4.0/

