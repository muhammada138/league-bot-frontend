
# Keema Scores — Frontend

A static dark-themed site to upload `.rofl` files and view Scoreboard and Champion leaderboards.
Works with your FastAPI backend on Render.

## Local preview
- Just open `index.html` in a browser.

## Configure
- Click **Settings** to set your API Base (default is `https://league-bot-backend.onrender.com`) and your Admin Key.
- Values are saved in your browser only (localStorage).

## Deploy to GitHub Pages
1. Create a new public repo (e.g. `league-bot-frontend`).
2. Put these three files into the repo:
   - `index.html`
   - `styles.css`
   - `app.js`
3. Commit and push.
4. In the repo: Settings → Pages → Deploy from `main` (root). Wait for it to build.
5. Open your Pages URL, go to **Settings** tab on the site and ensure the API Base is your Render URL.
