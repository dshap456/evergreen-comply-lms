# EverGreen Comply

A learning management system migrated from Base44 to Supabase with Magic Links authentication.

## Features

- 🔐 Magic Links Authentication (Supabase Auth)
- 📚 Course Management System
- 👥 User Roles (Super Admin, Team Manager, Learner)
- 🏢 Organization & Team Management
- 📊 Progress Tracking & Analytics
- 📜 Certificate Generation
- 💳 Payment Integration (Stripe)

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Authentication**: Magic Links via Supabase
- **Deployment**: Vercel

## Environment Variables

Set these in your deployment platform:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```

## Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `supabase-schema.sql`
3. Configure environment variables
4. Deploy and test Magic Links authentication

## Migration Status

✅ Authentication system (Base44 → Supabase Magic Links)  
✅ Database schema migration  
✅ User management system  
✅ Course & enrollment system  
✅ Progress tracking  
✅ Team & organization management  

## Deployment

This project is configured for seamless deployment to Vercel with automatic environment variable detection.