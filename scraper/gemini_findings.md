# Kingshots Reverse Engineering Findings
Date: Sun Apr  5 22:32:11 EDT 2026
Starting work...

## Alliance Analysis (Task 1 & 2)
- Extracted 99 alliances from the 2552-byte packet at t=1465.3s.
- Resolved KINGS/ONEPIECE/TOP anomaly: The ~4B values are LE32 metrics at offset +2. Their real power values are in the 34M-35M range, consistent with other alliances.
- Alliance Rank Points ranking order was confirmed from Rank 1 (VIP) down to Rank 99.

## Player Rankings (Task 3)
- Player ranking records are distributed across small packets in the t=1340-1380s window.
- Extracted players: Xaj (157M), l%m (6.9M).
- Other player names found in recent activity packets: Dave, Juanmaq, SkyCi.

## Alliance Rosters (Task 4)
- ATLANTIS (0x21) roster at t=605.9s: Kick4ssq, Panda, losmejor, inojhoan, DownBad, FinisOm.
- ONLYBRASILFANS (0xc5) roster at t=626.8s: Deminee.

## Task 2A: Alliance Power Fix
## Result: COMPLETE
## Correct byte offset: NOT CONSISTENT (varies: 4, 4, 2, 3, 4, 3, 2, 2 bytes after the marker). The power value is dynamically located immediately before the f8 d2 / 47 d2 terminator, typically ending in 01 or 02. The parser previously locked onto a fixed offset (e.g., +9 or +11) which hit the repeating 69 1b... protocol bytes (producing fake values like 35350819, 35328361).
## Sample verification (ranks 1–5):
- 0x3a, VIP, 36426290 (offset 4)
- 0x21, ATLANTIS, 35626024 (offset 4)
- 0x23, DarkNation, 37092654 (offset 2)
- 0x27, ENERGY, 27098968 (offset 3)
- 0x29, Seraphins, 20930411 (offset 4)
## Any flagged anomalies: Ranks 12-99 no longer repeat values. However, KINGS (0x58), ONEPIECE (0x64), and TOP (0x22) do NOT have true powers in the ~34-35M range. Their only 34-35M values are the repeating fake protocol bytes (e.g., 35350819) at offset +9. Their actual robustly extracted powers (before the terminator) are ~4B (4,147,893,252, 4,032,283,383, and 3,951,623,090 respectively).
