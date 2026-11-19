# Coach Digital RDC – Admin

Administration panel (React 18, Vite, Chakra UI) of Coach Digital for the classroom observation tool of the DRC (PAAF / SERNAFOR), derived from [WBG-Coach](https://github.com/WBG-Coach). The multi-country version (Sierra Leone, Nepal) is kept under the git tag `avant-version-rdc`.

## Setup dev

  - Requirements: Node.js 18+, npm, and the API running (`coach-backend`)
  - Copy `.env.example` to `.env`:
    - `VITE_API_URL`: API URL (e.g. `http://localhost:3000/api`)
    - `VITE_MAX_REGION_LEVEL`: number of region levels
  - Run `npm install`
  - Run `npm run dev`
  - Open `http://localhost:5173/admin/` (not the root of the Vite server)
