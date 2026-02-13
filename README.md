# Smart Bookmark App

A real-time bookmark manager built with **Next.js 14 (App Router)**, **Supabase (Auth, Database, Realtime)**, and **Tailwind CSS**.

## 🚀 Features
- **Google OAuth Login:** Secure passwordless authentication.
- **Row Level Security (RLS):** Data is isolated; users can only access their own bookmarks.
- **Real-time Sync:** Bookmarks appear instantly across all tabs/devices using Supabase Realtime (PostgreSQL Replication).
- **Responsive UI:** Built with Tailwind CSS for mobile and desktop.

## 🛠 Tech Stack
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL)
- **Deployment:** Vercel

## 🧠 Challenges & Solutions

### 1. Real-time Subscription Security
**Problem:** Initially, the real-time subscription was connecting before the user session was fully established. This caused RLS policies to block the `INSERT` events, so the UI wouldn't update until a refresh.
**Solution:** I refactored the `useEffect` hook to explicitly wait for `supabase.auth.getSession()` before initializing the channel. This ensures the WebSocket connection is authenticated, allowing it to bypass the RLS filter for the user's own data.

### 2. Next.js App Router & Auth
**Problem:** Managing authentication state between Server Components (for initial render) and Client Components (for interactivity) can be tricky.
**Solution:** I implemented the `createClient` pattern (separate clients for Server and Browser) to handle cookie management securely. The Server Component handles the initial data fetch (SSR) for performance, while the Client Component takes over for real-time updates.

## 📦 How to Run Locally

1. Clone the repo:
   \`\`\`bash
   git clone https://github.com/your-username/smart-bookmark-app.git
   \`\`\`
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Create a `.env.local` file with your Supabase keys:
   \`\`\`env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   \`\`\`
4. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`