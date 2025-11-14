# TrackPoint — Delivery Navigator

[![Expo](https://img.shields.io/badge/Expo-%23FFFFFF?style=flat&logo=expo&logoColor=white&color=000)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-%2361DAFB?style=flat&logo=react&logoColor=white)](https://reactnative.dev)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#license)

📍 TrackPoint is a lightweight delivery navigator built with Expo + React Native and a simple Node/Express backend (optional). It helps delivery drivers manage stops, view nearest stops, compute a short multi-stop route, and mark deliveries as completed.

## Quick Overview

- 📦 Add and store customers with addresses and coordinates
- 🚗 View nearest stop and start navigation
- 🗺️ In-app multi-stop map (Leaflet + OpenStreetMap) and single-stop Google Maps embed
- ✅ Mark deliveries as delivered and view history

## Badges & icons

- UI icons: `@expo/vector-icons` (Ionicons)
- README badges: shields from `shields.io` (used above)
- In-app symbols: emoji used for quick visual hints (📍 🚗 ✅)

## Getting Started

Prerequisites

- Node.js 14+ or later
- Expo CLI (optional): `npm install -g expo-cli` (or use `npx expo`)
- MongoDB (if running the backend locally)

Frontend (Expo)

```powershell
cd "c:\Mobile app Projects\LocationApp"
npm install
npm start
```

Open the Expo dev tools and run on emulator/device.

Backend (optional)

```powershell
cd "c:\Mobile app Projects\LocationApp\backend"
# install dependencies if present
npm install
node server.js
# backend default: http://localhost:8000/api
```

## API Endpoints

- `GET /api/customers` — list customers
- `POST /api/customers` — add a customer
- `GET /api/customers/:id` — get customer details
- `PUT /api/customers/:id` — update customer (e.g., mark delivered)

## Project Structure

```
app/                — Expo Router app (screens & tabs)
backend/            — Node + Express API (optional)
services/           — API client + helpers
components/         — shared UI components
assets/             — images and icons
```

## Customization & Notes

- To change the API base URL used by the app, update `services/api.js`.
- Single-stop directions use Google Maps embed (API key required for some features).
- Multi-stop in-app map uses Leaflet + OpenStreetMap (no API key required).

## Troubleshooting

- If you see Metro / Expo CLI errors: remove global `expo-cli` and use the local `npm start` or `npx expo start`.
- Ensure location permissions are granted on the device for map/directions features.

## Contributing

- Fork and open a PR. Keep changes focused and update the README for public-facing changes.

## License

MIT

---

If you'd like, I can add:

- a project screenshot or app icon to the README,
- CI/build badges (EAS, GitHub Actions), or
- a short Usage GIF for the routing feature.

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
