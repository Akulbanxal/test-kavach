# Deployment Guide

This document explains how to configure and deploy the KavachAI application locally.

## Prerequisites
- Node.js (v18+)
- Google Cloud Project with Vertex AI API enabled.

## Environment Variables
Create a `.env` file in the `server/` directory:

```env
PORT=3000
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
EMBEDDING_MODEL=text-embedding-004
SIMILARITY_THRESHOLD_PCT=5
```

## Authentication (Google Cloud)
The system uses Application Default Credentials (ADC).
Run the following command to authenticate your local environment:
```bash
gcloud auth application-default login
```

## Running the Backend
```bash
cd server
npm install
npm start
```
The server will start on `http://localhost:3000`. 
Check `http://localhost:3000/health/vertex` to verify that Vertex SDK and ADC are functioning correctly.

## Running the Frontend
```bash
npm install
npm run dev
```
The frontend will start on `http://localhost:5173`.

## Production Build
To build the frontend for production:
```bash
npm run build
```
You can serve the resulting `dist/` folder using any static web server (e.g., Nginx, Vercel, Netlify).
