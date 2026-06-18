# SpotiFind
![logo.png](public/logo.png)

## 📖 Introduction
SpotiFind is a high-performance web platform designed to search, explore, and organize musical content in real time by leveraging the external Spotify Web API. Developed using Next.js (App Router) and TypeScript, this application provides a fast, fully responsive, and type-safe experience across both desktop and mobile devices.

This project was built from scratch as an intensive integration challenge during an ongoing engineering internship at Zelian.

## 🛠️ Tech Stack & Key Features

* **Framework & Language:** Next.js 14+ (App Router) & TypeScript for robust type safety and native file-system routing.
* **API Integration:** Consumes the Spotify Web API using the secure *Client Credentials* flow.
* **Component-Driven UI:** Built with reusable, strictly-typed UI components (Search Bar, Media Cards, Skeleton Loaders).
* **Data Persistence:** Client-side favorites management using browser `LocalStorage` (no complex backend required).
* **UX State Management:** Built-in handling for Loading, Error (token expiration), and Empty states.

## 📂 Project Architecture

The application implements dynamic routing and smooth navigation across the following views:

* `src/app/page.tsx` — **Homepage & Global Search:** Features a central search bar fetching real-time results categorized into Artists, Albums, and Tracks.
* `src/app/artist/[id]/page.tsx` — **Dynamic Artist Profile:** Displays the artist's artwork, follower count, top 5 popular tracks, and their complete album list.
* `src/app/album/[id]/page.tsx` — **Dynamic Album Page:** Displays the album cover, release metadata, and a complete clickable tracklist.
* `src/app/favorites/page.tsx` — **Static Favorites Summary:** Lists all tracks bookmarked by the user locally.

## 📜 License
Copyright (c) 2026 Starlight
Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)

You are allowed to use this project for personal and non-commercial purposes only. 
Modification, redistribution, or commercial use of this project, in whole or in part, is strictly prohibited.


For full license details, see: https://creativecommons.org/licenses/by-nc-nd/4.0/

