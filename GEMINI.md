# GEMINI Project Overview: MO STYLES Website

## 1. Project Overview

This is a full-stack web application for **MO STYLES**, a modern barber shop. The application features a visually-driven frontend with a 3D model centerpiece and a functional backend to manage appointments.

### ✅ Current Status & Recent Achievements (22.01.2026)
-   **Deployment**: Validated Nginx configuration for Raspberry Pi. Critical finding: The `/uploads` route **must** use `proxy_pass http://localhost:3001` to bypass Nginx permission issues with user home directories.
-   **Gallery Admin**: Implemented a split-view interface ("Eingang" vs "Live") for better moderation workflow.
-   **Animations**: Implemented a 1:1 Apple Pay success animation (Circle Draw -> Checkmark -> Bounce) synced with sound.
-   **Backend**: Fixed TypeScript/Multer issues for production builds.

### Architecture
-   **Frontend**: A single-page application built with **React** and **Vite**. It uses **TypeScript** for type safety.
-   **Backend**: A **Node.js** server using the **Express** framework, also written in **TypeScript**.
-   **3D Graphics**: The frontend heavily utilizes **Three.js** via the `@react-three/fiber` and `@react-three/drei` libraries to render and animate a 3D model.
-   **Styling**: Styling is handled by **Tailwind CSS**, loaded via a CDN in the `index.html` file.

### Key Features
-   **3D Model Showcase**: The homepage prominently features an interactive 3D model.
-   **Appointment Booking**: A sleek, multi-step booking overlay allows users to select a date and time, and enter their details.
-   **Admin Panel**: A password-protected admin section allows for viewing all appointments and managing their status (e.g., blocking or freeing up slots).
-   **Webhook Integration**: The backend is set up to send a webhook POST request to a configurable URL (e.g., for `make.com` or `n8n`) upon successful booking, enabling email confirmations or other automations.
-   **Community Gallery**: A user-driven image feed where clients can upload their haircut styles. Includes image moderation (admin approval), automatic avatar generation, and a modern masonry grid layout.

## 2. Building and Running

The project requires two separate terminal sessions to run the frontend and backend concurrently.

### Backend Server
1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server (with auto-reload):
    ```bash
    npm run dev
    ```
The backend will run on `http://localhost:3001`.

### Frontend Application
1.  In a **new terminal**, navigate to the project's root directory.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
Vite will automatically open your browser to the correct address (usually `http://localhost:3000` or `http://localhost:5173`).

## 3. Development Conventions

-   **Project Structure**:
    -   `src/`: Contains all frontend React/TypeScript source code.
    -   `src/components/`: Houses individual React components.
    -   `src/types.ts`: Defines shared TypeScript types for the frontend.
    -   `public/`: Contains static assets like the favicon and 3D models.
    -   `backend/`: Contains the entire Node.js/Express server application.
    -   `backend/src/`: Contains the backend's TypeScript source code.
-   **Data Management**: The backend currently uses a simple **in-memory array** to store appointments. This is reset every time the server restarts. For production, this should be replaced with a persistent database.
-   **Authentication**: Admin authentication is handled by a simple, non-secure password check in the backend (`/api/login`). This is for demonstration purposes only.
-   **Environment Variables**: The project uses `.env` files to manage environment-specific variables.
    -   **Backend (`backend/.env`):** Manages the `WEBHOOK_URL` for sending booking confirmations to services like Make.com or n8n. An example file (`.env.example`) is provided.
    -   **Frontend (`.env.local`):** Manages the `VITE_MODEL_URL` for specifying the path to the 3D model. This allows for easier configuration of the model's location.
    -   **Frontend (`.env.local`):** Manages the `VITE_MODEL_URL` for specifying the path to the 3D model. This allows for easier configuration of the model's location.
-   **Styling**: The project uses Tailwind CSS class names directly in the JSX of the components.
-   **Raspberry Pi / Production Deployment**:
    -   **Nginx Reverse Proxy**: Essential for the application to function in production. The proxy handles routing `/api` and `/uploads` requests to the backend (Port 3001) while serving the frontend static files. See `RASPBERRY_PI_DEPLOYMENT.md` for the config block.
    -   **.env File**: The `.env` file containing the `WEBHOOK_URL` is **NOT** synced via Git. It must be manually created in `backend/.env` on the Raspberry Pi for email confirmations to work.
    -   **Upload Permissions**: The `backend/uploads` directory must have write permissions for the backend process, and Nginx must be configured to serve these files or proxy the requests.
