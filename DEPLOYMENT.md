# Static Deployment Guide (Frontend Only)

This guide now covers deploying ONLY the React frontend of MentorMatch as a static demo on **GitHub Pages**. The backend (Django API) is NOT deployed and all interactive features (login, swipe, chat) have been replaced with mock data in `src/api.js`.

If you later want full functionality again, you can reintroduce the backend deployment steps (Render, environment variables, database). For the static demo, skip all backend instructions.

## Prerequisites

- GitHub account
- Render account (sign up at https://render.com - free)
- Git installed locally

---

git init
git add .
git commit -m "Initial commit - MentorMatch app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mentormatch.git
git push -u origin main
## Step 1: Push Code to GitHub

If you have not already:
```bash
cd /Users/lennonrozo/Desktop/mentormatch
git init
git add .
git commit -m "Initial commit - static demo"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mentormatch.git
git push -u origin main
```

## Step 2: Ensure Static Mock Mode

The file `mentormatch_frontend/src/api.js` has been converted to use in-memory mock data. It does not call a backend. You can edit the mock arrays to customize demo content.

## Step 3: Update Vite Config (Confirm Base)

### Step 1: Update Vite Config

Edit `mentormatch_frontend/vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/mentormatch/',  // ⚠️ Change to YOUR repo name
  build: {
    outDir: 'dist',
  },
})
```

## Step 4: Remove Backend Secrets (If Present)

You do NOT need any secrets for static mode. If `VITE_API_BASE_URL` was previously added, you can leave it or delete it—it is unused.

## Step 5: Enable GitHub Pages

1. In your GitHub repo, go to **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Save

## Step 6: Trigger Deployment

Push your changes to trigger the deployment:

```bash
git add .
git commit -m "Configure for production deployment"
git push
```

GitHub Actions will automatically:
- Build your React app
- Deploy to GitHub Pages

## Step 7: Access Your Site

Your frontend will be live at:
```
https://YOUR_USERNAME.github.io/mentormatch/
```

---

## Verify Static Demo

1. Visit your GitHub Pages URL.
2. Navigate through pages (Sign In / Sign Up will show mock flows).
3. Matches, Messages, Profile use mock data only.
4. Editing profile updates the in-memory object until page refresh.

---

## Troubleshooting

### Buttons referring to network fail
Expected—no live API. The static client suppresses real HTTP calls.

### Data not persisting between reloads
Mock data lives in memory; reload resets state.

---

## Cost Breakdown

**GitHub Pages:** Free, no runtime limits for static assets.

Backend costs removed (no Render usage in static mode).

---

## Next Steps

### Optional Improvements:

1. Re-enable backend: restore original `api.js`, redeploy Django.
2. Add persistent storage: Implement real media uploads when backend returns.
3. Replace mock auth with JWT against live API.

---

## Quick Reference Commands

### Local Development (Static Only)
```bash
cd mentormatch_frontend
npm install
npm run dev
```

### Demo URL
- Frontend: `https://YOUR_USERNAME.github.io/mentormatch/`

---

## Support

If you encounter issues:
Check browser console for any build/runtime errors. There is no backend, so network failures are expected if code still references old endpoints.

For full deployment later, reintroduce backend steps.
