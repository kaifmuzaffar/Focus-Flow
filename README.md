# FocusFlow 🎓

FocusFlow is a high-density, performance-centric analytics hub and study tracker designed to maximize your productivity. Built with modern web technologies, it features strict authentication guards, a beautifully designed custom login interface, and advanced data visualization.

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Authentication**: [NextAuth.js (Auth.js)](https://next-auth.js.org/) with Google OAuth & Custom Login Page
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas/database) via Mongoose & `@auth/mongodb-adapter`
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) (currently using local storage persistence)
- **Charts & Visualization**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Utilities**: `date-fns`, `clsx`, `tailwind-merge`, `canvas-confetti`

---

## 🔒 Security & Routing Architecture

FocusFlow implements a strict, sequential routing architecture to ensure data integrity and security:
1. **`AuthGuard`**: Wraps the entire application. If a user is not authenticated via Google, they are instantly redirected to the custom `/login` interface.
2. **`TargetGuard`**: Once authenticated, the system checks if the user has an active study target. If not, they are forced to `/target-config` before they can access the dashboard.
3. **`AppShell`**: Only after passing both guards is the user granted access to the Sidebar and the main application routes.

---

## 🚀 Deployment Guide: Finalizing Production

The application currently handles Authentication securely via MongoDB, but the *user's study data* (Courses, Sessions, Targets) is still temporarily saved in their browser's `localStorage` via Zustand.

To deploy FocusFlow for production with full multi-user support, follow these final steps:

### Step 1: Connect MongoDB Atlas
1. Ensure your MongoDB Atlas Cluster is created and network access is set to allow `0.0.0.0/0`.
2. Add your MongoDB URI to the `.env` file:
   ```env
   MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/studytracker?retryWrites=true&w=majority"
   ```
   > [!WARNING]
   > If your MongoDB password contains special characters like `@`, `!`, or `#`, you **must** URL-encode them. For example, if your password is `flow@123`, it must be written as `flow%40123` in the URI, otherwise the connection will fail with a `querySrv ENOTFOUND` error!

### Step 2: Implement Google Authentication (Already Done!)
Google Authentication is **fully implemented** with a custom, glassmorphism login page.
1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/).
2. Set up the OAuth consent screen and create OAuth 2.0 Client IDs.
3. Add Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google` (and your live Vercel URL later).
4. Update your `.env` file with the generated credentials:
   ```env
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   NEXTAUTH_SECRET="a-random-secure-string"
   NEXTAUTH_URL="http://localhost:3000"
   ```

### Step 3: Connect Zustand Data to MongoDB
Currently, Zustand persists study data purely to `localStorage`. To sync it with your MongoDB Atlas database:
1. **Create Mongoose Models:** Create a new folder `src/models/` and build schemas (`Course.ts`, `Session.ts`, `Target.ts`) that match your Zustand store interfaces.
2. **Create Next.js API Routes:** Build endpoints (e.g., `src/app/api/courses/route.ts`) to handle database CRUD operations. Ensure these routes check `getServerSession` to verify the user making the request is authenticated.
3. **Update Zustand Actions:** Modify the actions in `src/store/useStore.ts` (like `addCourse`, `startSession`) to make asynchronous `fetch` calls to your new API routes instead of relying on `persist`.
4. **Fetch Initial Data:** On app load, fetch the user's data from MongoDB and initialize the Zustand store.

### Step 4: Deploy to Vercel
1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com/), click "Add New Project", and import your repository.
3. In the **Environment Variables** section on Vercel, securely add all 5 variables from your local `.env` file.
   - *Note: Update `NEXTAUTH_URL` to your production URL (e.g., `https://your-app.vercel.app`).*
4. Click **Deploy**. Vercel will automatically build and host your Next.js application!
