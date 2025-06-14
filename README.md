# Trading Terminal

This repository contains a simple trading dashboard built with **FastAPI** for the backend and **React** for the frontend.

## Overview

The backend exposes a REST API that communicates with MetaTrader5 to place and manage trades. Multiple trading accounts can be configured and trades will be executed across them. The frontend is a React application that interacts with the API to display data and manage sessions.

## Getting Started

### Backend

1. Install Python dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

2. Start the FastAPI server:
   ```bash
   uvicorn backend.trade_api:app --reload
   ```

### Frontend

1. Navigate to the `frontend` directory and install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Run the React development server:
   ```bash
   npm start
   ```

The React app will be available at [http://localhost:3000](http://localhost:3000) and expects the FastAPI server to be running on [http://localhost:8000](http://localhost:8000).

## Account Configuration

Trading account credentials are defined in `backend/trade_api.py` under `ACCOUNTS_CONFIG`. To avoid hard coding sensitive data you can set environment variables for each field (e.g. `ACCOUNT_1`, `PASSWORD_1`, `SERVER_1`, `VOLUME_1`, etc.) and update the config to read from those variables before starting the server.

