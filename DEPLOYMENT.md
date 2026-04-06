# SPUC ARIS - Deployment Guide

## Frontend Deployment (Vercel)

### Steps:
1. Push code to GitHub (main branch)
2. Go to [Vercel](https://vercel.com)
3. Click "Add New Project"
4. Import your GitHub repository
5. Set build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add environment variables:
   ```
   VITE_API_URL=https://your-backend-domain.com/api
   ```
7. Deploy!

The `vercel.json` file automatically handles SPA routing (404 fixes on refresh).

---

## Backend Deployment (Railway/Heroku/Render)

### Prerequisites:
- `requirements.txt` in `aris_backend/` directory ✅
- `.env` file with environment variables
- Database (SQLite or PostgreSQL)

### Environment Variables Required:
```
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-backend-domain.com
```

### Recommended Platforms:
- **Railway**: `railway.app` (easy, free tier)
- **Render**: `render.com` (always free tier)
- **Heroku**: `heroku.com` (paid, but reliable)

### Quick Setup (Railway):
1. Connect GitHub repo
2. Set environment variables
3. Select `aris_backend` directory as root
4. Deploy!

### Update Vercel CORS:
Once backend is deployed, update `VITE_API_URL` in Vercel environment variables to your backend domain.

---

## Local Development

Frontend:
```bash
cd aris_frontend
npm install
npm run dev
```

Backend:
```bash
cd aris_backend
pip install -r requirements.txt
python manage.py runserver
```

Create `aris_frontend/.env.local`:
```
VITE_API_URL=http://127.0.0.1:8000/api
```
