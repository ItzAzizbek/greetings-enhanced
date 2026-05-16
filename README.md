# Greetings Enhanced

A people-aware display platform. When a known person is detected, the screen plays a personal greeting. Otherwise it plays ads in a curated loop. Operators manage content from `/admin`, the audience watches on `/output`, individuals follow their own streaks in `/user`, and third parties buy placements via `/collaborations`.

## Structure

```
.
├── icon.png              Logo (used by all surfaces)
├── backend/              Node + Express API, Firebase Admin
├── output/               TV display surface (no auth, kiosk mode)
├── admin/                Operator console (Firebase Auth, admin role)
├── user/                 Personal dashboard with streaks & leaderboard
└── collaborations/       Public site for buying ad placements
```

## Tech Stack

- **Frontend**: React 18 · Vite · Tailwind CSS · React Router · Firebase Web SDK
- **Backend**: Node.js · Express · Firebase Admin SDK
- **Database**: Firestore
- **Auth**: Firebase Auth
- **Payments**: Mock checkout (demo)

## Getting started

1. Create a Firebase project, enable Firestore and Email/Password Auth.
2. Copy `backend/.env.example` → `backend/.env` and fill credentials.
3. Copy each frontend's `.env.example` → `.env.local`.
4. In each directory, run `npm install` then `npm run dev`.

Default dev ports:

| Surface          | Port |
| ---------------- | ---- |
| backend          | 4000 |
| output (TV)      | 5170 |
| admin            | 5171 |
| user             | 5172 |
| collaborations   | 5173 |

## Design language

Warm neutrals, generous whitespace, one accent (deep sage), and a single typeface (Inter). No drop shadows on critical surfaces, no gradients, no emoji UI. Motion is reserved for entry/exit of the greeting overlay.
