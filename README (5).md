# Expense Tracker

A fast, private expense tracker built with plain HTML, CSS and JavaScript. No build step, no dependencies. All data is stored in your browser's `localStorage`.

## Features
- Add, edit and delete income and expense transactions
- Monthly summary: balance, income, expenses
- Monthly budget with a colour-coded progress bar
- Spending-by-category donut chart
- Search and filter by type or category
- Export to CSV
- Light and dark theme
- Responsive (works on mobile)

## Files
```
index.html   – page structure
style.css    – styling and themes
app.js       – all app logic
```

## Run locally
Open `index.html` in a browser, or serve the folder:
```bash
npx serve .
```

## Deploy: GitHub → Vercel
1. Create a new repository on GitHub and push these files:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: expense tracker"
   git branch -M main
   git remote add origin https://github.com/<your-username>/expense-tracker.git
   git push -u origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Set **Framework Preset** to **Other**. Leave Build Command and Output Directory empty.
4. Click **Deploy**. Every push to `main` redeploys automatically.

## Note
Data lives per-browser and per-device. Clearing site data removes it, so use **Export CSV** for backups.
