# Daily refresh

Runs every day before 12 PM IST. Both people are freshers, so skip senior roles (merge.py also
filters them). Search country IN in the cities listed for each person.

## Anusha (categories: Accounting, Tax, Payroll, AP / AR)

Cities: Bengaluru, Kochi and Hyderabad (run every search in all three). Keep the city name in
each job's location, e.g. "Kaloor, Kochi", so merge.py can tag it; jobs elsewhere are dropped.

Searches: "accountant fresher", "junior accountant", "accounts executive", "tax associate",
"GST tax executive", "payroll executive", "payroll associate", "accounts payable associate",
"accounts receivable executive", "record to report associate".

## Arjun (categories: RTL Design, Design Verification, Functional Verification, SoC Integration, Front-End Design)

City: Bengaluru.

Searches: "design verification engineer", "verification engineer SystemVerilog UVM",
"functional verification engineer", "RTL design engineer", "SoC integration engineer",
"ASIC front end design engineer", "digital design engineer Verilog", "VLSI fresher".

## Steps

1. Run the searches, keep only roles matching the person's categories (no physical design,
   analog, software, sales or HR roles), and write each person's matches to a candidates file:
   a JSON list of {title, company, location, posted (YYYY-MM-DD), url, category}.
2. `python3 scripts/merge.py anusha /tmp/anusha.json` and the same for arjun.
3. Commit to main and push. GitHub Pages republishes within a minute or two.

Never put phone numbers, emails or resume details in this repo; it is public.

## If the Indeed connector is down

Use web search to find Glassdoor India search pages for the same queries and cities, then
fetch them one at a time (parallel fetches get rate limited). Only take listings whose direct
`glassdoor.co.in/job-listing/...` URL is on the page, convert the "Nd ago" age into a posted
date, and set `"source": "Glassdoor"`. Skip any listing whose URL or date you can't confirm.
