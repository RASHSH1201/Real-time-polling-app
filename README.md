# Live Polling App

A real-time polling platform built with Node.js, Express, Socket.io, and MongoDB. Create a poll, share it, and watch votes and results update live for every connected viewer with no page refresh.

## How it works

- **Backend:** Express serves a small REST API for creating polls and casting votes. Poll data (question, options, vote counts) is persisted in MongoDB via Mongoose.
- **Real-time layer:** Socket.io rooms are used per-poll — clients join a room named after the poll's ID, and whenever a vote is cast, the server broadcasts the updated poll only to clients viewing that poll.
- **Frontend:** A single static page lets you build a poll with any number of options, then renders live vote bars that animate as votes come in from any connected client.

## Stack

- Node.js / Express
- Socket.io
- MongoDB / Mongoose
- Vanilla JS frontend (no framework, no build step)

## Running locally

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and point `MONGO_URI` at a local or hosted MongoDB instance.
3. Start the dev server:
   ```
   npm run dev
   ```
4. Open `http://localhost:3000` in two browser tabs, create a poll in one, and vote from either — both update instantly.

## Status / next steps

This is a work in progress. Planned next:
- Multiple poll types (multi-select, ranked choice)
- Basic analytics (votes over time)
- Auth so only the poll creator can close/delete a poll
