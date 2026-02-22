# Deploy backend to Render

## 1. Push backend to GitHub

- Either use the **same repo** with root directory set to `backend`, or a **separate repo** that contains only the backend (e.g. copy the `backend` folder and push it).

## 2. Create a Web Service on Render

1. Go to [dashboard.render.com](https://dashboard.render.com) → **New** → **Web Service**.
2. Connect your GitHub repo (the one that contains the backend code).
3. Configure:
   - **Name:** e.g. `dashboard-api`
   - **Region:** choose one (e.g. Oregon).
   - **Root Directory:** `backend` (if the backend lives in a `backend` folder). Leave blank if the repo root is the backend.
   - **Runtime:** Node.
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
4. Under **Environment** add:

   | Key          | Value (example) |
   |--------------|------------------|
   | `NODE_ENV`   | `production`     |
   | `DB_HOST`    | `test-db.c6dskocumuuy.us-east-1.rds.amazonaws.com` |
   | `DB_PORT`    | `5432`           |
   | `DB_NAME`    | `spamsite`       |
   | `DB_USER`    | `omar`           |
   | `DB_PASSWORD`| `omar12345`      |

   (Do not commit real credentials; set them in Render’s dashboard and keep `.env` in `.gitignore`.)

5. Click **Create Web Service**.

Render will build and deploy. Your API URL will be like:  
`https://dashboard-api-xxxx.onrender.com`

## 3. Point Vercel frontend to this API

In the **Vercel** project (frontend):

- **Settings** → **Environment Variables**
- Set `VITE_API_URL` = `https://dashboard-api-xxxx.onrender.com` (your Render URL, no trailing slash).
- Redeploy the frontend.

## 4. Free tier note

On the free tier, the service may spin down after inactivity; the first request after idle can be slow (cold start). For always-on, use a paid plan.
