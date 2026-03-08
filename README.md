# Noor — Islamic Companion App

> **نور** — Arabic for *light*. A comprehensive Islamic web app built with Next.js, designed to be your daily companion for prayer, learning, and remembrance.

---

## Features

### Books
| Feature | Description |
|---|---|
| **Quran** | Full Quran with translation, transliteration, and verse-by-verse reading |
| **Hadith** | Browse and search authentic collections including Sahih Bukhari and Muslim |

### Prayer & Ibadah
| Feature | Description |
|---|---|
| **Prayer Times** | Location-aware daily prayer times with live countdown and Qibla direction |
| **Fasting Schedule** | Suhoor & Iftar times for today, a specific date, or the full month. Includes White Days reminders |
| **Salah Tracker** | Log your five daily prayers and build a consistent streak |
| **Tasbih Counter** | Digital tasbeeh for daily dhikr and remembrance of Allah |

### Learn
| Feature | Description |
|---|---|
| **Seerah & History** | Learn Islamic history through chapters and quizzes. Earn XP and level up |
| **99 Names of Allah** | All 99 Asma ul Husna with Arabic script, transliteration, meaning and audio |

### General
- **4 themes** — Dark, Light, Warm, Midnight
- **PWA** — Installable on Android as a home screen app
- **Push notifications** — Prayer time reminders
- **Authentication** — User accounts with profiles and XP tracking
- **Persistent preferences** — Location, method, and madhab saved across visits

---

## Tech Stack

- **Framework** — [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- **Language** — TypeScript
- **Styling** — Tailwind CSS with custom CSS variables for theming
- **PWA** — [`@ducanh2912/next-pwa`](https://github.com/DuCanhGH/next-pwa)
- **Auth** — Custom `AuthContext` with JWT
- **APIs** — Aladhan (prayer times & Qibla), HadithAPI, Quran API

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/noor.git
cd noor

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_API_URL=your_backend_url
```

### Running Locally

```bash
# Development (PWA disabled)
npm run dev

# Production build (PWA enabled)
npm run build
npm run start
```

> ⚠️ PWA features (service worker, install prompt) only work in production mode (`npm run build && npm run start`). Use a browser on `http://localhost:3000` to test.

---

## PWA Installation (Android)

1. Open the site in **Chrome on Android**
2. Tap the **"Add to Home Screen"** button on the homepage
3. Or use Chrome's menu → **Install app**

The app will install with a home screen icon and run fullscreen with no browser chrome.

---

## Project Structure

```
├── app/
│   ├── (routes)/
│   │   ├── prayer-times/
│   │   ├── fasting/
│   │   ├── quran/
│   │   ├── hadith/
│   │   ├── asma-ul-husna/
│   │   ├── ibadah/
│   │   │   ├── salahtracker/
│   │   │   └── tasbihcounter/
│   │   ├── learn/
│   │   │   └── categories/
│   │   ├── profile/
│   │   └── auth/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Navbar.tsx
│   ├── InstallButton.tsx
│   ├── CountdownTimer.tsx
│   ├── QiblaCompass.tsx
│   ├── LocationButton.tsx
│   └── ErrorBanner.tsx
├── context/
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── lib/
│   └── api.ts
├── public/
│   ├── manifest.json
│   ├── icons/
│   └── screenshots/
└── types/
    └── index.ts
```

---

## Routes

| Path | Page |
|---|---|
| `/` | Home — Bismillah, Hadith of the Day, feature overview |
| `/quran` | Full Quran reader |
| `/hadith` | Hadith browser & search |
| `/prayer-times` | Daily prayer times & Qibla |
| `/fasting` | Suhoor & Iftar schedule |
| `/ibadah/salahtracker` | Salah tracking |
| `/ibadah/tasbihcounter` | Tasbih / dhikr counter |
| `/learn/categories` | Seerah quiz & XP system |
| `/asma-ul-husna` | 99 Names of Allah |
| `/profile` | User profile & stats |
| `/auth/login` | Sign in |

---

## Theming

Themes are powered by CSS custom properties. The four available themes are defined in `lib/api.ts` under `THEME_OPTIONS`:

| Theme | Description |
|---|---|
| `dark` | Default dark mode with gold accents |
| `light` | Clean light mode |
| `warm` | Warm sepia tones |
| `midnight` | Deep navy with starlight accents |

User preference is persisted to `localStorage` and applied via `ThemeContext`.

---

## Acknowledgements

- [Aladhan API](https://aladhan.com/prayer-times-api) — Prayer times, Qibla, Hijri dates
- [HadithAPI.com](https://hadithapi.com) — Hadith collections
- [Quran.com API](https://quran.com) — Quran text and translations

---

## License

MIT License — feel free to use, modify, and distribute with attribution.

---

<p align="center">
<i>May Allah accept this effort and make it beneficial. آمين</i><br/><br/>
  <b>الحمد لله</b>
</p>