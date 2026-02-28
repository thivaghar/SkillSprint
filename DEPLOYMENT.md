# SkillSprint - Deployment Guide

## 🚀 Hosting on Vercel (Frontend) + Railway/Render (Backend)

### **Architecture**
- **Frontend**: React + Vite → Vercel
- **Backend**: Flask + Python → Railway or Render
- **Database**: MySQL (managed service)

---

## **Part 1: Deploy Frontend to Vercel** ✅

### Prerequisites
- GitHub account (already have it)
- Vercel account (free)

### Steps:

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign in with GitHub**
3. **Click "New Project"**
4. **Select `thivaghar/SkillSprint` repository**
5. **Configure:**
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

6. **Environment Variables:**
   Add under "Environment Variables":
   ```
   VITE_API_URL = https://your-backend-url.railway.app/api/v1
   ```

7. **Click "Deploy"** 🎉

Your frontend will be live at: `https://skillsprint-xxx.vercel.app`

---

## **Part 2: Deploy Backend to Railway** ⭐ (Recommended)

### Why Railway?
- Native Python support
- Built-in MySQL database
- Easy GitHub integration
- Free tier available

### Steps:

1. **Go to [railway.app](https://railway.app)**
2. **Sign in with GitHub**
3. **Create new Project → GitHub Repo**
4. **Select `thivaghar/SkillSprint`**
5. **Configure Root Directory**: `backend`
6. **Add MySQL Service:**
   - Click "Add Service" → MySQL
   - Railway creates database automatically

7. **Set Environment Variables:**
   Railway automatically detects:
   - `DATABASE_URL` (from MySQL service)
   
   Add manually:
   ```
   JWT_SECRET_KEY = your-secret-key-123
   GEMINI_API_KEY = your-gemini-key
   STRIPE_SECRET_KEY = your-stripe-key
   SECRET_KEY = your-flask-key
   ```

8. **Deploy!** 🚀

Backend will be at: `https://your-railway-app.up.railway.app/api/v1`

---

## **Alternative: Deploy Backend to Render**

### Steps:

1. **Go to [render.com](https://render.com)**
2. **New → Web Service**
3. **Connect GitHub repository**
4. **Configure:**
   - Name: `skillsprint-backend`
   - Environment: `Python 3`
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `cd backend && gunicorn app:app`
   - Root Directory: (leave blank or `/`)

5. **Add PostgreSQL Database** (Render's native database)
6. **Set Environment Variables**
7. **Deploy** 🎉

---

## **Step 3: Update Frontend API URL**

After backend is deployed, update frontend:

### Edit `frontend/src/services/api.js`:
```javascript
const API_URL = 'https://your-backend-url.railway.app/api/v1';
```

### Push to GitHub:
```bash
cd d:\Dev\habit
git add .
git commit -m "Update API URL for production"
git push
```

Vercel will auto-redeploy! 🚀

---

## **Complete Setup Checklist**

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Railway/Render
- [ ] MySQL database created
- [ ] Environment variables set
- [ ] API URL updated in frontend
- [ ] CORS enabled in backend (✅ already done)
- [ ] Test API connection

---

## **Quick Commands**

### Test locally before deploying:
```bash
# Frontend
cd frontend
npm run build
npm run preview

# Backend
cd backend
python app.py
```

### Monitor deployments:
- Vercel: Dashboard.vercel.com
- Railway: Dashboard.railway.app
- Render: Dashboard.render.com

---

## **Estimated Costs**
- **Vercel**: Free
- **Railway**: Free tier (paid if exceeded)
- **Render**: Free tier
- **MySQL** (managed): Free tier available

---

## **Need Help?**
- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
