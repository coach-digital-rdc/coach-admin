# Coach Digital – Admin

Administration panel (React 18, Vite, Chakra UI).

## Setup dev

  - Requirements: Node.js 18+, npm, and the API running (`coach-backend`)
  - Copy `.env.example` to `.env`:
    - `VITE_API_URL`: API URL **with the country prefix** (e.g. `http://localhost:3000/sl/api`)
    - `VITE_COUNTRY`: same value as `COUNTRY` in the backend
    - `VITE_MAX_REGION_LEVEL`: number of region levels
  - Run `npm install`
  - Run `npm run dev`
  - Open `http://localhost:5173/{COUNTRY}/admin/` (not the root of the Vite server)
