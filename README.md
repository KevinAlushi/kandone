# KanDone

A personal Kanban board web app for managing projects and tasks without the hassle.

## Features

- **Google Authentication** — sign in securely with your Google account
- **Project Management** — create and manage multiple projects
- **Kanban Board** — organize tasks across To Do, Working On, Done, and Stuck columns
- **Drag & Drop** — reorder and move tasks between columns with precision
- **Real-time Sync** — changes reflect instantly across devices
- **Analytics** — pie chart and bar chart showing task distribution per project
- **Persistent Storage** — all data saved to the cloud via Supabase

## Tech Stack

- **Frontend** — React 19, TypeScript, Vite
- **Styling** — Tailwind CSS
- **Drag & Drop** — @dnd-kit
- **Charts** — Recharts
- **Backend & Auth** — Supabase (PostgreSQL + Google OAuth)
- **Deployment** — Vercel

## Getting Started

### Prerequisites

- Node.js
- A [Supabase](https://supabase.com) project with Google OAuth enabled

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/KevinAlushi/kandone.git
   cd kandone
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the app locally:
   ```bash
   npm run dev
   ```

## Live Demo

[kandone.vercel.app](https://kandone.vercel.app)
