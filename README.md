
# Tania's English Class — Teacher Platform (v3)

This build supports **importing lessons from your sister site (test-english.com)** into a single JSON file GitHub Pages can serve, including **examples, questions, and YouTube listening embeds**.

---

## Quick Start (GitHub Pages)
1. Upload all files to your repo (e.g. `JeepScape/EnglishClass`) on the branch used for GitHub Pages.
2. Visit `https://<username>.github.io/EnglishClass/`.

The site will look for `data/lessons.scraped.json` first. If it doesn't exist, it uses `data/lessons.json` (a small seed).

---

## Import ALL lessons from test-english.com

> You own the content and license it royalty-free. The importer is rate-limited and polite.

### 1) Install dependencies (locally on your laptop)
```bash
python3 -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install requests beautifulsoup4 lxml tqdm
```

### 2) Run the scraper
```bash
python tools/scrape_test_english.py --out data/lessons.scraped.json
```
By default it crawls:
- Grammar: A1–B2
- Vocabulary: A1–B2
- Listening: A1–B2 (extracts embedded YouTube IDs)
- Reading: A1–B2
- Use of English: A1–B2
- Writing: A1–B2

You can target a single level/area, e.g.:
```bash
python tools/scrape_test_english.py --areas listening --levels A2 B1 --out data/lessons.scraped.json
```

### 3) Commit and push
```bash
git add data/lessons.scraped.json
git commit -m "Import test-english lessons"
git push
```

Reload your Pages site — it will auto‑use the scraped file.

---

## Data format
`lessons.scraped.json` schema:
```json
{
  "levels": ["A1","A2","B1","B2"],
  "skills": ["Grammar","Vocabulary","Listening","Reading","Use of English","Writing"],
  "lessons": [{
    "id": "a1-listening-who-is-in-your-new-class",
    "level": "A1",
    "skill": "Listening",
    "title": "Who is in your new class? – A1 English Listening Test",
    "source_url": "https://test-english.com/listening/a1/who-is-in-your-new-class-a1-english-listening-test/",
    "media": { "youtube": ["YOUTUBE_ID_1"] },
    "content_html": "<p>Core explanation / stem HTML here…</p>",
    "questions": [
      {"prompt":"1 Mr Tanaka…","options":["is a musician","is American","can speak Spanish"],"answer_index":2}
    ]
  }]
}
```

---

## Security & privacy
- No user accounts. Everything is static.
- Homework & teacher dashboard are local-only storage.
- If you later need centralised tracking, we can add a tiny Google Sheets backend with Apps Script.

---
