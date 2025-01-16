# Cursor App - React + FastAPI

This project consists of a **React** frontend and a **FastAPI** backend. The frontend interacts with the backend via HTTP requests to perform various actions like moving a cursor and focusing it.

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (for running React)
- **Python 3.7+** (for running FastAPI)
- **pip** (for installing Python dependencies)

## Getting Started

### 1. Backend Setup (FastAPI)

1. Navigate to backend directory:
   ```bash
   cd morphle/backend
   ```

2. Create a virtual environment:
    ```bash
    python -m venv venv
    ```

3. Activate the virtual environment:
    ```bash
   source venv/bin/activate
   ```

4. Install backend dependencies:
    ```bash
    pip install -r requirements.txt
    ```

5. Run the FastAPI server
    ```bash
    uvicorn main:app --reload
    ```

### 2. Frontend Setup (React)

1. Navigate to the frontend directory:
    ```bash
    cd morphle/cursor-app
    ```

2. Install frontend dependencies:
    ```bash
    npm install
    ```

3. Run the React application:
    ```bash
    npm start
    ```

### The React app will run on http://localhost:3000.

   