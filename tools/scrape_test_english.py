
#!/usr/bin/env python3
import argparse, time, re, json, sys
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup
from tqdm import tqdm

BASE = "https://test-english.com/"
HEADERS = {"User-Agent":"Mozilla/5.0 (compatible; TaniaTeacherBot/1.0; +https://github.com/JeepScape/EnglishClass)"}

AREAS = {
  "Grammar": [ "grammar-points/a1/", "grammar-points/a2/", "grammar-points/b1/", "grammar-points/b2/" ],
  "Vocabulary": [ "vocabulary/a1/", "vocabulary/a2/", "vocabulary/b1/", "vocabulary/b2/" ],
  "Listening": [ "listening/a1/", "listening/a2/", "listening/b1/", "listening/b2/" ],
  "Reading": [ "reading/a1/", "reading/a2/", "reading/b1/", "reading/b2/" ],
  "Use of English": [ "use-of-english/a1/", "use-of-english/a2/", "use-of-english/b1/", "use-of-english/b2/" ],
  "Writing": [ "writing/a1/", "writing/a2/", "writing/b1/", "writing/b2/" ],
}

LEVEL_MAP = {"a1":"A1","a2":"A2","b1":"B1","b1+":"B1+","b2":"B2"}

def get(url):
  r = requests.get(url, headers=HEADERS, timeout=20)
  r.raise_for_status()
  return r.text

def textnorm(s):
  return re.sub(r"\s+", " ", s or "").strip()

def extract_links(listing_html, base_url):
  soup = BeautifulSoup(listing_html, "lxml")
  # collect main content links (avoid nav/footer)
  links = []
  for a in soup.find_all("a", href=True):
    href = a["href"]
    if not href.startswith("http"):
      href = urljoin(base_url, href)
    if "test-english.com" not in href: 
      continue
    # heuristics: lesson pages usually are not category roots and have slashes > 4
    path = urlparse(href).path
    if path.endswith("/") and path.count("/") >= 3:
      # Exclude known non-lesson paths
      if any(seg in path for seg in ["/privacy-policy","/terms-of-use","/cookie","/level-","/contact","/site-map"]):
        continue
      links.append(href)
  return sorted(set(links))

def extract_youtube_ids(soup):
  ids = []
  # standard iframe embeds
  for iframe in soup.select("iframe"):
    src = iframe.get("src","") or iframe.get("data-src","") or ""
    if "youtube.com" in src or "youtu.be" in src:
      m = re.search(r"(?:embed/|v=|youtu\.be/)([A-Za-z0-9_-]{6,})", src)
      if m: ids.append(m.group(1))
  # lite-youtube style (if any)
  for div in soup.select("[data-youtube-id]"):
    ids.append(div["data-youtube-id"])
  return sorted(set(ids))

def extract_questions(soup):
  # Very simple extraction: find numbered lines under "Questions" or "Exercise"
  # We capture texts near numbers 1..30 and the options below each.
  questions = []
  main = soup
  # Search blocks by headings
  blocks = []
  for h in soup.find_all(re.compile("^h[2-6]$")):
    ht = textnorm(h.get_text())
    if any(key in ht.lower() for key in ["exercise", "questions"]):
      # take sibling elements until next heading of same or higher level
      cur = h.find_next_sibling()
      buf = []
      while cur and cur.name and not re.match(r"^h[2-6]$", cur.name or "", re.I):
        buf.append(cur)
        cur = cur.find_next_sibling()
      blocks.extend(buf)
  if not blocks:
    blocks = soup.select("main, article") or [soup]
  # Now parse lines
  text_lines = []
  for b in blocks:
    t = b.get_text("\n", strip=True)
    if t:
      for line in t.split("\n"):
        line=line.strip()
        if line: text_lines.append(line)
  # Group by question stems starting with number, collect following 1-4 optionish lines (A., B., C.)
  i=0
  while i < len(text_lines):
    line = text_lines[i]
    if re.match(r"^([0-9]{1,2})[). ]", line):
      stem = re.sub(r"^[0-9]{1,2}[). ]\s*", "", line).strip()
      opts = []
      j=i+1
      while j < len(text_lines) and (re.match(r"^[A-Da-d][). ]", text_lines[j]) or len(opts)<3 and len(text_lines[j])<200):
        m = re.match(r"^[A-Da-d][). ]\s*(.*)$", text_lines[j])
        opts.append((m.group(1) if m else text_lines[j]).strip())
        if len(opts)>=3 and (len(opts)<=5):
          # Heuristic break when options look complete
          pass
        j+=1
      questions.append({"prompt": stem, "options": opts, "answer_index": None})
      i=j; continue
    i+=1
  return questions

def extract_body_html(soup):
  # Try to capture the "Explanation" and any initial description
  # We select the main content area and remove navigational cruft.
  main = soup.find("article") or soup.find("main") or soup
  # remove share, footer etc
  for sel in ["footer",".site-footer",".entry-footer",".post-meta",".share",".related-posts"]:
    for el in main.select(sel): el.decompose()
  # Keep the first ~6 paragraphs and any lists/charts before "We are working on this!" notice
  parts = []
  for el in main.find_all(["p","ul","ol","table","figure","img","h3","h4"], recursive=True):
    txt = textnorm(el.get_text())
    if "We are working on this!" in txt:
      break
    parts.append(str(el))
    if len(parts) >= 12: # cap to keep it concise
      break
  return "\n".join(parts)

def detect_level_from_url(url):
  m = re.search(r"/(a1|a2|b1|b2|b1\+)/", url)
  if m:
    key = m.group(1).lower()
    return LEVEL_MAP.get(key, key.upper())
  return ""

def detect_skill_from_url(url):
  if "/grammar" in url: return "Grammar"
  if "/vocabulary" in url: return "Vocabulary"
  if "/listening" in url: return "Listening"
  if "/reading" in url: return "Reading"
  if "/use-of-english" in url: return "Use of English"
  if "/writing" in url: return "Writing"
  return ""

def slugify(s):
  s = s.lower()
  s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
  return s[:120]

def scrape_lesson(url):
  html = get(url)
  soup = BeautifulSoup(html, "lxml")
  title = textnorm((soup.find("h1") or {}).get_text() if soup.find("h1") else "")
  level = detect_level_from_url(url)
  skill = detect_skill_from_url(url)
  body_html = extract_body_html(soup)
  q = extract_questions(soup)
  yt = extract_youtube_ids(soup)

  # Build lesson entry
  lid = f"{level or 'NA'}-{skill or 'Lesson'}-{slugify(title) or slugify(url)}"
  entry = {
    "id": lid,
    "level": level or "",
    "skill": skill or "",
    "title": title or url,
    "source_url": url,
    "media": {"youtube": yt},
    "content_html": body_html,
    "questions": q
  }
  return entry

def crawl_listing(listing_url):
  html = get(listing_url)
  links = extract_links(html, listing_url)
  # Filter to same area
  area_root = "/".join(urlparse(listing_url).path.strip("/").split("/")[:1])
  return links

def main():
  ap = argparse.ArgumentParser()
  ap.add_argument("--areas", nargs="+", default=list(AREAS.keys()), help="Areas to crawl")
  ap.add_argument("--levels", nargs="+", default=["A1","A2","B1","B2"], help="Levels to include")
  ap.add_argument("--out", default="data/lessons.scraped.json")
  ap.add_argument("--delay", type=float, default=0.7, help="Seconds between requests")
  args = ap.parse_args()

  areas = [a for a in args.areas if a in AREAS]
  levels = set([lv.upper() for lv in args.levels])

  all_links = []
  for a in areas:
    for path in AREAS[a]:
      if LEVEL_MAP.get(path.split("/")[1], path.split("/")[1].upper()) not in levels:
        continue
      url = urljoin(BASE, path)
      try:
        links = crawl_listing(url)
        all_links.extend(links)
      except Exception as e:
        print(f"[WARN] listing fail {url}: {e}", file=sys.stderr)

  all_links = sorted(set(all_links))
  lessons = []
  for u in tqdm(all_links, desc="Scraping lessons"):
    try:
      entry = scrape_lesson(u)
      # keep only chosen levels
      if entry.get("level","").upper() not in levels: 
        continue
      lessons.append(entry)
      time.sleep(args.delay)
    except Exception as e:
      print(f"[WARN] lesson fail {u}: {e}", file=sys.stderr)

  # Build catalog
  catalog = {
    "levels": ["A1","A2","B1","B2"],
    "skills": list(AREAS.keys()),
    "lessons": lessons
  }
  with open(args.out, "w", encoding="utf-8") as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)
  print(f"Wrote {args.out} with {len(lessons)} lessons.")

if __name__ == "__main__":
  main()
