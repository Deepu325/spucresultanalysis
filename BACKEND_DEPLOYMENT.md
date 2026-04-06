# Quick Backend Deployment to Render

## Step 1: Prepare Your Repository
✅ Already done:
- `requirements.txt` in `aris_backend/` directory
- `.env.example` with all needed variables
- Django configured for environment variables

## Step 2: Deploy to Render

### Option A: Using Render Dashboard (Easiest)

1. Go to [render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `https://github.com/Deepu325/spucresultanalysis`
4. Configure:
   - **Name**: `spuc-aris-backend`
   - **Environment**: Python
   - **Build Command**: `pip install -r aris_backend/requirements.txt`
   - **Start Command**: `cd aris_backend && gunicorn aris_backend.wsgi:application`
   - **Root Directory**: (leave empty, Render handles it)

5. **Add Environment Variables:**
   ```
   SECRET_KEY=your-very-secret-key-here-make-it-long
   DEBUG=False
   ALLOWED_HOSTS=spuc-aris-backend.onrender.com
   ```

6. Click **"Create Web Service"**
7. Wait 3-5 minutes for deployment
8. You'll get a URL like: `https://spuc-aris-backend.onrender.com`

## Step 3: Update Vercel Frontend

1. Go to Vercel Dashboard
2. Select your project
3. **Settings** → **Environment Variables**
4. Add/Update:
   ```
   VITE_API_URL=https://spuc-aris-backend.onrender.com/api
   ```
5. **Redeploy** (trigger new deployment)

## Step 4: Test

1. Go to your Vercel app: `https://spucresultanalysis.vercel.app`
2. Try uploading an Excel file
3. Should work without CORS errors! ✅

---

## Alternative Platforms

### Railway (Very Simple)
1. Go to `railway.app`
2. Connect GitHub
3. Set environment variables
4. Deploy
5. Get URL like `https://your-project.railway.app`

### Heroku (More Complex but Popular)
1. Requires credit card (but has free trial)
2. Similar setup as Render

---

## Local Testing BEFORE Deployment

1. Make sure backend runs locally:
   ```bash
   cd aris_backend
   python manage.py runserver
   ```

2. Test API:
   ```bash
   curl http://127.0.0.1:8000/api/status/
   ```

3. Should return empty data or success response

---

## Troubleshooting

**"Application Error" on Render?**
- Check build logs in Render dashboard
- Make sure `requirements.txt` is in `aris_backend/`
- Verify `ALLOWED_HOSTS` includes your Render domain

**Still getting CORS errors?**
- Clear browser cache (Ctrl+Shift+Delete)
- Verify `VITE_API_URL` is set correctly in Vercel
- Check Django CORS settings allow your Vercel domain

---

## Need Help?

Run this locally to verify:
```bash
cd aris_backend
python manage.py check
python manage.py runserver 0.0.0.0:8000
```

Then test from another machine/browser if possible.
