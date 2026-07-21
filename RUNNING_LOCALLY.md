# RUNNING_LOCALLY.md

Nothing in this project is deployed to Render (or anywhere else) right now — everything runs on your own machine. Here's exactly how to start it, step by step.

## 1. Start MongoDB

You need a running MongoDB instance. Pick one:

- **Local MongoDB installed on your machine**: just make sure the `mongod` service is running. `backend/.env` already points at it (`mongodb://localhost:27017/`) — nothing to change.
- **Don't have MongoDB installed?** Easiest option is a free cloud database:
  1. Sign up at https://www.mongodb.com/cloud/atlas/register
  2. Create a free (M0) cluster
  3. Get the connection string (Database → Connect → Drivers), looks like `mongodb+srv://user:password@cluster.mongodb.net/`
  4. Paste it into `backend/.env` as `MONGO_URI=...`

## 2. Start the backend

```
cd backend
npm install
npm run dev
```

You should see it log that it's listening on port 5000 and connected to MongoDB. **Keep this terminal running** — the app won't work without it.

If you see a MongoDB connection error here, that's step 1 not done yet — fix that first before touching the mobile app.

## 3. Start the mobile app

In a **separate** terminal:

```
cd mobile
npm install
npx expo start -c
```

The `-c` clears Metro's cache — important after all the `.env` and code changes in this zip, otherwise you may still load stale JS (this is very likely what caused the "Pending tab" mismatch from earlier — you were looking at a cached old build).

Press `w` to open it in a web browser (this is what your screenshots showed, `localhost:8081`), or scan the QR code with Expo Go for a physical device, or press `a` for an Android emulator.

## 4. Confirm it's actually connected

Once the app loads, open the browser console (F12). You should **not** see repeated `[Socket] Connection error` messages anymore — instead the socket should connect successfully to `ws://localhost:5000/socket.io/...`. If you still see connection errors, double check step 2's terminal is still running and didn't crash.

## Why the earlier zips pointed at a Render URL

Earlier in this conversation, before you clarified nothing is deployed, `mobile/.env` was set to point at `https://all-in-one-services-eegn.onrender.com` assuming it was a live production backend (it appeared as a fallback URL already present in the original code, from before I started working on this project — I don't know its original purpose or whether it was ever actually deployed by whoever built this originally). That was wrong for your actual setup. It's now fixed to point at `http://localhost:5000/api` by default, matching how you're actually running things.

If/when you do want to deploy this for real (so it works outside your own machine, e.g. for other people to use, or for a real Android build), Render works fine for the backend, but that's a separate step you'd do deliberately later — not needed for local testing.
