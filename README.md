# Split-Flap-Dash

An interactive, browser-based split-flap display built with **TypeScript**, **Vite**, and **Canvas API**. Inspired by classic mechanical boards found in train stations and airports, Split-Flap-Dash recreates the flipping motion of physical flaps while letting you feed in dynamic content.

## ✨ Features

* 🌀 **Realistic animations** that simulate split-flap flipping
* 🔊 **Audio support** using the Web Audio API (works on Safari & modern browsers)
* 📱 **Responsive design** with touch & keyboard support
* ⌨️ **Soft keyboard integration** for mobile devices
* ⚡ Built with **Vite** + **TypeScript** for fast development and optimized builds

## 📦 Tech Stack

* **TypeScript** – Type safety and cleaner development experience
* **Vite** – Lightning-fast bundling and dev server
* **Canvas API** – Low-level rendering for the split-flap visuals
* **Web Audio API** – Sound effects synced to flap animations
* **CSS** – Styling and responsive layout

## 🚀 Getting Started

### Prerequisites

* Node.js (v18+ recommended)
* pnpm (preferred, but npm/yarn will work)

### Install dependencies

```bash
pnpm install
```

### Run the dev server

```bash
pnpm dev
```

### Build for production

```bash
pnpm build
```

### Preview production build

```bash
pnpm preview
```

## 🛠 Project Structure

```
src/
 ├─ scripts/
 │   ├─ classes/      # Flap, Board, and AudioManager class modules
 │   ├─ global.ts     # Shared constants and helper functions
 │   └─ main.ts       # App entrypoint
 ├─ styles/
 │   └─ style.css     # Base styles
 └─ index.html        # Root HTML
```

## 📋 Roadmap

* [ ] Add theming (dark/light mode, customizable colors)
* [ ] Allow external data feeds (API integration)
* [ ] Improve mobile keyboard UX

## 🤝 Contributing

PRs are welcome! If you’d like to add features, fix bugs, or improve docs, open a pull request.

## 📜 License

MIT License © 2025
