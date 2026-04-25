# Tutorial Tap Measurements — K1008 Playthrough

Successful measurements for tutorial tap targets. All for Samsung A16 (1080x2340).

## State: Character Creation Confirm dialog
- **Confirm button** (teal): center = **(767, 1420)** → advances to loading screen

## State: Opening cutscene (Prince William dialogue)
- **Skip button** (top-right dark pill): center = **(890, 280)** → skips cutscene

## State: First forced interaction (tap the building)
- **Building (pickaxe/saw/kitchen) center**: x=[190,595], y=[775,990], center = **(392, 882)**
- Tapping center advanced cutscene.

## State: Combat role selection
- **Summon button** (cyan): x=[339,741], y=[1692,1752], center = **(540, 1722)** → triggers battle

## State: First battle (Pause to retreat)
- **Pause button** (cyan circle, bottom-left): x=[105,192], y=[2155,2218], center = **(148, 2186)**
- In my test the battle ended immediately after I tapped pause (not sure if tap on pause = tap on battlefield = auto-fight). Worth re-investigating.

## State: Post-battle cutscene
- **Skip button**: (890, 280)

## State: Pen/plot construction placement (STUCK HERE)
- Hand cursor body (white): x=[554,662], y=[1002,1098], center = **(608, 1050)**
- Gold trim+ring: x=[208,698], y=[818,1098]
- My taps at (395, 800), (390, 900), etc. all IGNORED. Hand is at (608, 1050) not where I was looking.
- TRY: tap (608, 1098) — at the finger base where the ring is.

## Screen region conventions
- Skip buttons: top-right, ~(890, 280)
- Dialogue continue: anywhere in dialogue box lower half ~(540, 1500)
- Pause button: bottom-left cyan circle ~(148, 2186)
- Confirm/Summon buttons: center-ish, teal, ~x=540
