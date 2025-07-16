# 🔧 Netlify Environment Variables Setup

## Required Environment Variables

Your EverGreen Comply app needs these environment variables set in Netlify to connect to Supabase properly.

## 🚀 Step-by-Step Setup

### 1. Access Netlify Environment Variables
1. **Go to your Netlify dashboard:** https://app.netlify.com
2. **Click on your deployed site**
3. **Go to:** Site settings → Environment variables
4. **Click "Add a variable"** for each variable below

### 2. Add These Exact Variables

**Variable 1:**
```
Name: VITE_SUPABASE_URL
Value: https://ghohtdsweojsilngmnap.supabase.co
```

**Variable 2:**
```
Name: VITE_SUPABASE_ANON_KEY  
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdob2h0ZHN3ZW9qc2lsbmdtbmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NjM3OTgsImV4cCI6MjA2ODAzOTc5OH0.p8_P5J3a5oweCCzn8eSQUHqMwRL4c2Wio0sR1B94m3E
```

### 3. Save and Redeploy
1. **Click "Save"** after adding both variables
2. **Go to:** Deploys tab
3. **Click "Trigger deploy"** → "Deploy site"
4. **Wait for deployment** to complete

## ⚠️ Important Notes

- **Variable names are case-sensitive** - must be exactly `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- **The `VITE_` prefix is required** for Vite to include them in the build
- **Redeploy is necessary** after adding environment variables
- **These are public keys** - safe to use in frontend applications

## 🧪 How to Test

After setting environment variables and redeploying:

1. **Visit your Netlify site URL**
2. **Open browser console** (F12 → Console tab)
3. **Look for connection errors** - should be none
4. **Try to log in** with magic link authentication
5. **Test Course Builder functionality**

## 🔍 Troubleshooting

### If Login Doesn't Work:
- Check browser console for errors
- Verify environment variables are exactly as shown above
- Make sure you redeployed after adding variables
- Check that magic link emails are being sent

### If API Calls Fail:
- Environment variables likely missing or incorrect
- Check Network tab in browser dev tools
- Look for 401/403 errors (authentication issues)

### Common Issues:
- **Typo in variable names** (must be exact)
- **Forgot to redeploy** after adding variables
- **Extra spaces** in variable values
- **Missing `VITE_` prefix**

## 📋 Your Current Environment Variables

From your local `.env` file:
```
VITE_SUPABASE_URL=https://ghohtdsweojsilngmnap.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdob2h0ZHN3ZW9qc2lsbmdtbmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NjM3OTgsImV4cCI6MjA2ODAzOTc5OH0.p8_P5J3a5oweCCzn8eSQUHqMwRL4c2Wio0sR1B94m3E
```

**Copy these exact values** to Netlify environment variables.

## ✅ Expected Result

After setting environment variables correctly:
- ✅ Authentication will work (magic links)
- ✅ Course creation will work
- ✅ Course Builder will load properly
- ✅ Database operations will succeed
- ✅ File uploads will work (after running storage permissions fix)

## 🎯 Next Steps

1. **Set environment variables** in Netlify (this guide)
2. **Redeploy your site**
3. **Run storage permissions SQL** (from previous fix)
4. **Test complete functionality**