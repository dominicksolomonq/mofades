# MO STYLES - Barber Website

This project is a modern, 3D-enabled website for a barber shop, built with React, Vite, Three.js, and a Node.js backend.

## Running the Full-Stack Application Locally

This project consists of two main parts: a **frontend** React application and a **backend** Node.js server. You need to run both simultaneously.

### 1. Running the Backend Server

The backend server handles appointment data and logic.

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install backend dependencies:**
    ```bash
    npm install
    ```

3.  **Start the backend server:**
    This will run the server in development mode using `nodemon`.
    ```bash
    npm run dev
    ```

The backend will be running on `http://localhost:3001`. Keep this terminal window open.

### 2. Running the Frontend Application

1.  **Open a new terminal window.**

2.  **Navigate to the project's root directory** (if you are in the `backend` directory, go back one level `cd ..`).

3.  **Install frontend dependencies:**
    ```bash
    npm install
    ```

4.  **Start the frontend development server:**
    ```bash
    npm run dev
    ```

Your browser should open to the local development server, and the application should now be fully functional, connected to your local backend.
