# Lymoon

A multi-tenant shift scheduling mobile app for small businesses (restaurants, cafes, retail).

## Project Structure

```
Lymoon/
  lymoon-mobile/    # Expo React Native app (TypeScript)
  Lymoon.API/       # ASP.NET Core Web API (.NET 8)
  docs/             # Project documentation
```

## Getting Started

### Mobile (lymoon-mobile)

```bash
cd lymoon-mobile
npm install
npx expo start
```

### Backend API (Lymoon.API)

```bash
cd Lymoon.API
dotnet run
```

API runs on `https://localhost:7xxx` by default (see `Properties/launchSettings.json` for the exact port).
