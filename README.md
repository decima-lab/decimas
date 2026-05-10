# decimas

A directory of websites where users can earn money online.

## Developing Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

Get these values from your Supabase dashboard under **Project Settings → API**.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

For DB setup and seeding, see [db/README.md](db/README.md).
