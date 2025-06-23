# Railway Deployment Guide for ERP System

This guide provides step-by-step visual instructions for managing your ERP deployment on Railway.

## Table of Contents
1. [Finding Your Cloud API URL](#1-finding-your-cloud-api-url)
2. [Adding Environment Variables](#2-adding-environment-variables)
3. [Triggering Rebuild/Redeploy](#3-triggering-rebuildredeploy)

---

## 1. Finding Your Cloud API URL

### Step 1: Access Railway Dashboard
1. Open your browser and go to [https://railway.app](https://railway.app)
2. Click **"Dashboard"** button in the top-right corner
3. Log in with your Railway account

### Step 2: Navigate to Your Project
```
Railway Dashboard
└── Projects Section
    └── Click on "ERP" project tile
```

### Step 3: Select Your Service
In the project view, you'll see multiple service boxes:
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    frontend     │  │   backend-api   │  │   mcp-server    │
│  🟢 Running     │  │  🟢 Running     │  │  🟢 Running     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
                           ↑
                    Click this one
```

### Step 4: Find the Public URL
1. Click on the **"backend-api"** service box
2. In the service dashboard, look for the **"Settings"** tab in the top menu
3. Click on **"Settings"**
4. Scroll down to the **"Domains"** section
5. You'll see your public URL:
   ```
   Public Domain
   ┌────────────────────────────────────────────────┐
   │ https://backend-api-production-5e68.up.railway.app │
   │                                                │
   │ [Copy] button                                  │
   └────────────────────────────────────────────────┘
   ```
6. Click the **"Copy"** button to copy the URL

### Alternative Method: From Service Overview
1. In the service dashboard, the URL is also displayed at the top:
   ```
   backend-api
   ─────────────
   🌐 https://backend-api-production-5e68.up.railway.app
   ```

---

## 2. Adding Environment Variables

### Step 1: Access Service Settings
1. From your project dashboard, click on the service you want to configure
2. Click on the **"Variables"** tab in the top menu bar:
   ```
   [Deployments] [Variables] [Settings] [Logs] [Metrics]
                     ↑
                Click here
   ```

### Step 2: Add New Variables
1. In the Variables section, you'll see:
   ```
   ┌─────────────────────────────────────────┐
   │  RAW EDITOR    FORMATTED               │
   │                                        │
   │  + New Variable                        │
   └─────────────────────────────────────────┘
   ```
2. Click **"+ New Variable"** button

### Step 3: Enter Variable Details
1. A form will appear:
   ```
   ┌─────────────────────────────────────────┐
   │ Variable name                          │
   │ ┌────────────────────────────────┐    │
   │ │ VARIABLE_NAME                   │    │
   │ └────────────────────────────────┘    │
   │                                        │
   │ Value                                  │
   │ ┌────────────────────────────────┐    │
   │ │ your-value-here                │    │
   │ └────────────────────────────────┘    │
   │                                        │
   │ [Add]                                  │
   └─────────────────────────────────────────┘
   ```
2. Enter the variable name (e.g., `DATABASE_URL`)
3. Enter the value
4. Click **"Add"** button

### Step 4: Add Multiple Variables
For the ERP system, add these variables:

```
For backend-api service:
- DATABASE_URL: postgresql://...
- JWT_SECRET: your-secret-key
- NODE_ENV: production

For mcp-server service:
- GOOGLE_CLIENT_ID: your-client-id.apps.googleusercontent.com
- GOOGLE_CLIENT_SECRET: your-client-secret
- GOOGLE_REFRESH_TOKEN: your-refresh-token
- ERP_API_URL: https://backend-api-production-5e68.up.railway.app
- ANTHROPIC_API_KEY: sk-...
```

### Step 5: Save Variables
1. After adding all variables, Railway automatically saves them
2. You'll see a yellow banner: **"Environment variables updated. Redeploy to apply changes."**
3. Click **"Redeploy"** in the banner to apply changes

---

## 3. Triggering Rebuild/Redeploy

### Method 1: Quick Redeploy (No Code Changes)
1. From your service dashboard, look for the deployment section
2. Click the three dots menu (⋮) next to the latest deployment:
   ```
   Latest Deployment
   ┌────────────────────────────────────────┐
   │ #42 main (abc123)  5 minutes ago   ⋮  │
   │ 🟢 Active                              │
   └────────────────────────────────────────┘
                                         ↑
                                    Click here
   ```
3. Select **"Redeploy"** from the dropdown menu

### Method 2: Trigger from Settings
1. Go to service **"Settings"** tab
2. Scroll to **"Deploy"** section
3. Click **"Trigger Deploy"** button:
   ```
   Deploy
   ────────
   Trigger a new deployment
   
   [Trigger Deploy]
   ```

### Method 3: Automatic Deploy on Git Push
1. Railway automatically deploys when you push to GitHub
2. From your local terminal:
   ```bash
   git add .
   git commit -m "Update configuration"
   git push origin main
   ```
3. Railway will automatically detect and deploy

### Method 4: Manual Rebuild with New Image
1. Go to **"Settings"** → **"Build"** section
2. Click **"Clear Build Cache"** if you want a fresh build
3. Then trigger a new deploy using Method 1 or 2

### Monitoring Deployment Progress
1. Click on **"Deployments"** tab
2. You'll see the build progress:
   ```
   Building...
   ┌────────────────────────────────────────┐
   │ 📦 Installing dependencies...          │
   │ 🔨 Building application...             │
   │ 🚀 Deploying...                        │
   │ ✅ Deploy successful!                   │
   └────────────────────────────────────────┘
   ```

### Deployment Logs
1. Click on any deployment to see detailed logs
2. Use the log viewer to debug issues:
   ```
   [Search logs...] [Download] [Settings]
   
   2024-01-15 10:30:15 Starting deployment...
   2024-01-15 10:30:16 Installing dependencies...
   2024-01-15 10:30:45 Build completed
   2024-01-15 10:30:50 Starting server...
   ```

---

## Quick Reference Cheat Sheet

### Finding URLs
```
Dashboard → Project → Service → Settings → Domains → Copy URL
```

### Adding Environment Variables
```
Dashboard → Project → Service → Variables → New Variable → Add
```

### Redeploying
```
Dashboard → Project → Service → Latest Deployment → ⋮ → Redeploy
```

---

## Common Issues and Solutions

### Issue: Changes Not Reflected After Deploy
**Solution**: Clear build cache before redeploying
1. Settings → Build → Clear Build Cache
2. Trigger new deployment

### Issue: Environment Variables Not Working
**Solution**: Ensure you redeployed after adding variables
1. Check Variables tab for typos
2. Redeploy the service
3. Check logs for variable loading errors

### Issue: Can't Find Public URL
**Solution**: 
1. Ensure service is deployed successfully
2. Check Settings → Domains
3. If no domain, click "Generate Domain"

---

## Railway UI Navigation Map

```
railway.app
│
├── Dashboard
│   ├── Projects List
│   │   └── ERP Project
│   │       ├── frontend (service)
│   │       ├── backend-api (service)
│   │       └── mcp-server (service)
│   │
│   └── Each Service Contains:
│       ├── Deployments (build history)
│       ├── Variables (environment vars)
│       ├── Settings
│       │   ├── General
│       │   ├── Domains (URLs here!)
│       │   ├── Build
│       │   └── Deploy
│       ├── Logs (real-time logs)
│       └── Metrics (usage stats)
│
├── Account Settings
└── Team Settings
```

---

## Pro Tips

1. **Bookmark Important URLs**: Save direct links to your services for quick access
2. **Use Railway CLI**: Install `npm i -g @railway/cli` for command-line deployment
3. **Monitor Metrics**: Check the Metrics tab to track resource usage
4. **Set Up Webhooks**: Configure GitHub webhooks for automatic deployments
5. **Use Environment Groups**: Group related variables for easier management

---

## Need More Help?

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app

Remember to always check the deployment logs if something goes wrong!