# System Patterns

**Architecture:**

*   **MERN Stack:** MongoDB (Database), Express.js (Backend Framework), React.js (Frontend Library), Node.js (Backend Runtime).
*   **Client-Server:** Standard separation between the frontend (browser) and backend (server).
*   **REST API:** Backend exposes a RESTful API for the frontend to consume data and perform actions.
*   **MVC (Model-View-Controller) - Backend:** Controllers handle request logic, Models interact with the database (Mongoose Schemas), and Views are implicitly handled by the API responses (JSON).
*   **Component-Based UI - Frontend:** React components encapsulate UI logic and presentation (`pages`, `components`).

**Key Technical Decisions:**

*   **Database:** MongoDB (NoSQL) chosen, suitable for evolving schemas and nested data (like batches, itinerary within treks). Mongoose ODM used for schema definition, validation, and interaction.
*   **Authentication:** JWT (JSON Web Tokens) stored in cookies (implied by `cookie-parser`) for session management and securing API routes. Passwords hashed using `bcryptjs`.
*   **Routing:** `react-router-dom` for frontend routing, Express Router for backend API routing.
*   **Styling:** `tailwindcss` utility-first CSS framework for frontend styling.
*   **State Management (Frontend):** Primarily component state (`useState`, `useEffect`) and React Context API (`AuthContext`). No external state management library like Redux or Zustand is apparent.
*   **API Communication:** Likely `axios` or `fetch` used within `services/api.js` to interact with the backend API.
*   **Asynchronous Operations:** `async/await` used extensively on both frontend and backend for handling promises (API calls, database operations).

**Component Relationships (High-Level):**

*   `App.js`: Main application component, sets up routing.
*   `Header`/`Footer`: Common layout elements.
*   `pages/`: Top-level components representing distinct views/pages.
*   `components/`: Reusable UI elements used across different pages (e.g., `TrekCard`, `Modal`, `BookingForm`, `AdminLayout`).
*   `services/api.js`: Centralized module for making backend API calls.
*   `contexts/AuthContext.js`: Manages user authentication state globally. 