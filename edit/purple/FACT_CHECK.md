# Fact-check log — Best one mp4

Checked 2026-10-22 against primary sources. The script is unchanged; anything stale or revised is flagged here for Ben.

| Claim in the script | Verdict | Source (retrieved 2026-10-22) |
|---|---|---|
| "Inflation in the U.S. was running at 3.4% in August" | ✅ Correct. CPI-U (not seasonally adjusted) Aug 2026 334.980 vs Aug 2025 323.976 = +3.40 %. **Note:** September CPI (3.7 %) came out Oct 14, so 3.4 % is no longer the latest reading. | FRED series CPIAUCNS (BLS data): https://fred.stlouisfed.org/series/CPIAUCNS · US Inflation Calculator: https://www.usinflationcalculator.com/inflation/current-inflation-rates/ ("…was 3.7% for the 12 months ending September, up from 3.4% in August"). bls.gov blocks automated browsers, so it couldn't be captured directly. |
| "$20,000 sitting still … buying about what 14,300 buys today, 10 years from now" | ✅ 20,000 ÷ 1.034¹⁰ = $14,316 (assumes 3.4 % a year for 10 years). | Arithmetic |
| "$1,000 a month at 8% … roughly a million in about 27 years" | ✅ 12,000 a year × ((1.08²⁷ − 1) ÷ 0.08) = $1,048,209. Monthly compounding gives about $1.14 M. Either way, "roughly a million". | Arithmetic |
| "The average 30-year mortgage was 7.28% on October 1st, up from 6.34% a year earlier" | ✅ PMMS 30-yr fixed 7.28 % (week of 2026-10-01) and 6.34 % (2025-10-02). Latest week is 7.32 % (2026-10-22). | Freddie Mac PMMS via FRED MORTGAGE30US: https://fred.stlouisfed.org/data/MORTGAGE30US.txt · https://www.freddiemac.com/pmms |
| "The S&P 500 closed at 7,801.77 on October 7th just after hitting a new record" | ✅ Close 7,801.77 on 2026-10-07. Record close 7,818.93 the day before (2026-10-06). | FRED SP500 (S&P Dow Jones Indices): https://fred.stlouisfed.org/data/SP500.txt |
| "…as oil went above $100 a barrel" | ✅ for Brent ($126.00 on Oct 7; above $100 all month). ⚠️ WTI was $95.02 on Oct 7; it was above $100 in mid-September and again from Oct 15. Fine as said, but if the viewer thinks "WTI", it wasn't above $100 that exact week. | FRED DCOILBRENTEU, DCOILWTICO |
| "…and the 10-year Treasury yield climbed past 5%" | ✅ 5.28 % on Oct 7 (above 5 % since Sept 23). | FRED DGS10 |
| "Americans filed 578,926 new business applications in July, the most since the Census Bureau started tracking in 2004" | ⚠️ **Revised.** July 2026 is still the highest month since the series began in 2004, but the current, revised figure is **576,264** (seasonally adjusted). 578,926 matches the first print. On screen the edit shows the number as spoken. | Census Business Formation Statistics, bfs_monthly.csv: https://www.census.gov/econ/bfs/current/index.html |
| "The Census expects only about 29,959 of them to become businesses with payroll within a year" | ⚠️ **Revised.** Current projected business formations within 4 quarters for July 2026: **29,697** (first print 29,959). Projections are "within 4 quarters", which the script's "within a year" matches. | Same Census file (series BF_PBF4Q) |
| "Take a minute to check what your savings account is paying today. If it's close to nothing…" | ✅ The FDIC national average savings rate is 0.38 % (Oct 19, 2026), shown highlighted on screen. | FDIC National Rates and Rate Caps: https://www.fdic.gov/national-rates-and-rate-caps |
| "Say you owe 5,000 on a card charging 20%. That's about $1,000 a year" | ✅ 5,000 × 20 % = $1,000. Simple interest, ignoring compounding and minimum payments. | Arithmetic |
| Nokia "owned the phone market", then smartphones flipped it | ✅ General history (Nokia led global handset share through 2011). No number on screen. | — |

## Live captures used on screen (Stage 2)

| Beat | Page | Proof highlighted | File |
|---|---|---|---|
| Inflation | usinflationcalculator.com, current inflation rates | "3.4% in August" | `captures/cpi_calc.png` |
| Mortgage | FRED MORTGAGE30US data | 2026-10-01 7.28, then 2025-10-02 6.34 (scrolls between them) | `captures/mortgage.png` |
| S&P 500 | FRED SP500 data | 2026-10-07 7801.77, then 2026-10-06 7818.93 (the record) | `captures/sp500.png` |
| Census | census.gov Business Formation Statistics | "Business Formation Statistics" title | `captures/census.png` |
| Savings | fdic.gov National Rates and Rate Caps | Savings row, 0.38 % | `captures/fdic.png` |

Highlight regions (image px, 2880-wide captures) are logged in `scenes/purple.js` (`WEB`), and the phrase boxes in `captures/*.json`.
