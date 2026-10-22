"""Merge freshly found jobs into data/<person>.json.

Usage: python3 scripts/merge.py <person> <candidates.json>

candidates.json is a list of {title, company, location, posted (YYYY-MM-DD), url, category}.
When the data file lists `cities`, each job is tagged with the city named in its location,
and jobs outside those cities are skipped.
New jobs get today's IST date as `added`; listings first added more than 30 days ago are dropped.
"""
import json
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

IST = timezone(timedelta(hours=5, minutes=30))
KEEP_DAYS = 30
TOO_SENIOR = re.compile(
    r"\b(senior|sr\.?|staff|principal|lead|director|head|architect|manager)\b"
    r"|\b([3-9]|1\d)\s*\+?\s*(-|to)?\s*\d*\s*(yrs|years)",
    re.I,
)
FRESHER_OK = re.compile(r"fresher|assistant manager - business finance", re.I)


def city_of(location, cities):
    for c in cities:
        if c.lower() in location.lower() or (c == "Bengaluru" and "bangalore" in location.lower()):
            return c
    return None


def key(job):
    return (job["title"].strip().lower(), job["company"].strip().lower(), job.get("city", ""))


def main(person, cand_path):
    root = Path(__file__).resolve().parent.parent
    path = root / "data" / f"{person}.json"
    data = json.loads(path.read_text())
    now = datetime.now(IST)
    today = now.date().isoformat()
    cutoff = (now.date() - timedelta(days=KEEP_DAYS)).isoformat()

    jobs = [j for j in data["jobs"] if j["added"] >= cutoff]
    seen_urls = {j["url"] for j in jobs}
    seen_keys = {key(j) for j in jobs}
    cities = data.get("cities", [])
    added = 0
    for c in json.loads(Path(cand_path).read_text()):
        if cities:
            c["city"] = city_of(c["location"], cities)
            if not c["city"]:
                continue
        if TOO_SENIOR.search(c["title"]) and not FRESHER_OK.search(c["title"]):
            continue
        if c["category"] not in data["categories"]:
            continue
        if c["url"] in seen_urls or key(c) in seen_keys:
            continue
        job = {k: c[k] for k in ("title", "company", "location", "posted", "url", "category")}
        if cities:
            job["city"] = c["city"]
        job.update(added=today, source=c.get("source", "Indeed"))
        jobs.append(job)
        seen_urls.add(job["url"])
        seen_keys.add(key(job))
        added += 1

    jobs.sort(key=lambda j: (j["added"], j["posted"]), reverse=True)
    data["jobs"] = jobs
    data["updated"] = now.isoformat(timespec="minutes")
    path.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n")
    print(f"{person}: {added} new, {len(jobs)} listed")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
