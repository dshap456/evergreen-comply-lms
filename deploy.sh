#!/bin/bash

echo "Building EverGreen Comply for production..."
npm run build

echo "Deploying to Netlify..."
npx netlify deploy --prod --dir=dist

echo "Deployment complete!"
echo "Don't forget to set environment variables in Netlify dashboard:"
echo "  VITE_SUPABASE_URL=https://ghohtdsweojsilngmnap.supabase.co"
echo "  VITE_SUPABASE_ANON_KEY=your-anon-key"