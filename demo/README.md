# Kinetic Input Demo

Interactive showcase for `@tensil/kinetic-input` components.

## Features

- Live component preview with all variants
- Interactive code playground with syntax highlighting
- Preset gallery showing different configurations
- Real-time theme customization
- Haptics and capabilities detection

## Running Locally

From the monorepo root:

```bash
npm install
npm run build        # Build the library first
npm run dev:demo     # Start dev server
```

The demo will be available at `http://localhost:3001`

## Building for Production

```bash
npm run build:demo
```

Output will be in `demo/dist/`

## Tech Stack

- React 19
- Vite
- TailwindCSS
- Framer Motion
- @tensil/kinetic-input (workspace package)
