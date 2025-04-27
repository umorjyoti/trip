# Tech Context

**Frontend:**

*   **Framework/Library:** React.js
*   **Routing:** `react-router-dom`
*   **Styling:** `tailwindcss`
*   **State Management:** React Hooks (`useState`, `useEffect`), React Context API (`AuthContext`)
*   **API Client:** Likely `axios` or `fetch` (via `services/api.js`)
*   **UI Enhancements:** `framer-motion` (animations), `react-hot-toast`/`react-toastify` (notifications), `react-icons`
*   **Charting:** `chart.js` with `react-chartjs-2` wrapper
*   **Package Manager:** npm or yarn (based on `package.json` presence, though not shown for frontend)

**Backend:**

*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB
*   **ODM:** Mongoose
*   **Authentication:** `jsonwebtoken` (JWT), `bcryptjs` (hashing)
*   **Middleware:** `cors`, `morgan`, `cookie-parser`, `express.json()`, `multer` (for file uploads)
*   **Package Manager:** npm (`package.json` provided)

**Development Environment:**

*   **Backend:** Requires Node.js and npm installed. Run `npm install` in the `backend` directory. Run `npm run dev` (uses `nodemon` for auto-restarts) or `npm start`. Requires a MongoDB instance running and connection string (likely via `.env` file, e.g., `MONGODB_URI`).
*   **Frontend:** Requires Node.js and npm/yarn installed. Run `npm install` (or `yarn install`) in the `frontend` directory. Run `npm start` (or `yarn start`).
*   **Environment Variables:** A `.env` file is likely used in the backend (referenced by `process.env`) for `MONGODB_URI`, `JWT_SECRET`, `PORT`, `FRONTEND_URL`.

**Dependencies:**

*   See `backend/package.json` for backend dependencies.
*   Frontend dependencies are inferred from imports but a `frontend/package.json` would provide the exact list.

**Technical Constraints:**

*   Relies on a running MongoDB database.
*   Frontend depends on the backend API being available.
*   Current state management might become complex as the application grows; consider more advanced solutions if needed.
*   File upload strategy (storage location, CDN usage, etc.) needs clarification if scaling is required. 