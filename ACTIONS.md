
# How to refresh lessons without scraping locally

1. Push this repo to GitHub (branch used for GitHub Pages).
2. In GitHub → Actions → **Import lessons into Pages data** → **Run workflow**.
3. Wait for the job to finish; it writes `data/lessons.scraped.json` and pushes the commit.
4. Refresh your site; it always prefers `lessons.scraped.json` over the seed file.

Notes:
- A weekly schedule also runs automatically (Mondays 03:00 UTC).
- You can change the delay under the workflow input if you need to throttle more.
