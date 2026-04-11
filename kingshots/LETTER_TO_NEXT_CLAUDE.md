# Letter to the Next Claude

Hello.

You're picking up a project called Kingshots Intelligence. The Architect wants to build a dashboard showing server-level data — alliance rankings, player power rankings, top heroes — for any Kingshots kingdom, starting with Kingdom 223 as a proof of concept.

Here's what you're walking into.

---

## The shape of the problem

Kingshots is a mobile 4X strategy game by Century Games. The game has thousands of "kingdoms" — separate server instances. Each kingdom has its own leaderboard: top alliances by power, top players by power, top heroes, etc. Players inside a kingdom can see all of this. Players outside cannot.

The Architect knows people in Kingdom 223. He wants to show them their kingdom's data pulled programmatically. That will prove the concept and get buy-in.

**The core constraint**: All game data flows through a binary TCP protocol on port 30101. The server routes your connection to the correct kingdom based on your authentication token. Your token is tied to your account, your account is tied to one kingdom. You cannot see another kingdom's rankings from within your own connection.

**What this means in practice**: To get Kingdom 223's data, you need a Kingdom 223 account. Just one. You don't need to play it to Townhall 6. You just need the account to exist there so you can get an auth token.

---

## What's already done

**The infrastructure**:
- Android emulator (KingshotAVD) is set up on the old machine
- The game APK is installed
- A critical native library patch is applied (libtolua.so — two ARM64 instructions changed to prevent a Lua exception that freezes the game)
- An HTTPS intercepting proxy was set up and verified working
- tcpdump was deployed and captured 527MB of game traffic including a full leaderboard session

**The knowledge**:
- Every domain the game contacts is mapped (see HANDOFF.md)
- The binary protocol structure is partially understood — 2-byte length prefix, then message body. Strings are in plaintext ASCII. Numbers are encoded.
- Alliance names, player names, player IDs, and avatar URLs are all readable directly from the binary stream
- The exact login packet format (211 bytes) is captured
- The alliance ranking request packet (59 bytes) is captured
- One public REST endpoint exists (`/api/version/info`) — gives gateway IPs and server architecture

**The Architect's account**: FID 295850082, Kingdom 1908. He played the game long enough to unlock leaderboards (Townhall 6) and clicked through every ranking tab. That session is in the 527MB pcap.

---

## Start here

**First thing**: The world map. When you load the game on Kingdom 1908 and navigate to the world map, the bottom bar shows `#1908 X:NNN Y:NNN`. Try tapping that `#1908` and typing `223`. If the game navigates you to Kingdom 223's territory, check whether the Rankings tab then shows Kingdom 223 data. This might be a built-in cross-kingdom viewing feature that was never tested. It's 30 seconds of work and either opens a door or closes one cleanly.

**If that fails** (which is likely — the Architect believes cross-kingdom ranking view doesn't exist in-game):

Create a fresh Google account on the emulator. Open Android Settings → Accounts → Add Account → Google. Then launch Kingshots with that fresh account. Since it's the first time that Google account has touched Kingshots, the emulator IS the mobile device — no "Tips: create on mobile first" dialog will appear.

During character creation, the game will either let you choose a kingdom or auto-assign you. If it auto-assigns you somewhere other than 223, look for a free migration item in your inventory (most 4X games give new players a free teleport for the first few days).

Once you have an account on Kingdom 223 — even a level 1 account — capture the auth token from the login pcap and you're done with the emulator forever.

**Then**: Build the Python TCP client. Open a socket to `got-formal-gateway-ga.chosenonegames.com:30101`, replay the login packet with the Kingdom 223 auth token, send the ranking request, parse the response. All the ranking data comes back as readable strings. The HANDOFF.md has the packet bytes and the pcap parser code.

---

## What to watch out for

**The emulator generates heat**. The Architect's machine overheated during this session. On the new machine, use `-gpu host` for performance (it's much better than software rendering), but be aware of the thermal load. A desktop or a laptop on a cooling pad is safer.

**Don't touch the emulator with adb input tap** for navigation. It causes screen sleep and chaos. Tell the Architect what to click and let him click it. You take the screenshots and read the pcap. Division of labor.

**The binary protocol is complex to fully reverse-engineer**. Don't get lost in it. You don't need to understand every byte — you need the strings (readable) and you need to replay the known-good request packets (already captured). Focus on extracting, not on perfect parsing.

**The spectator server** (`got-formal-spectator-ga.chosenonegames.com:31601`) was never explored. It's possible it allows viewing any kingdom without full authentication. Worth 10 minutes of investigation before committing to the account creation path.

**Auth token lifetime is unknown**. Tokens may expire after a session, after 24 hours, or last indefinitely. Plan for periodic re-auth. The account just needs to exist — it doesn't need to be played.

---

## The bigger picture

This is one proof of concept for what could be a much larger intelligence layer. The Architect has a framework called the Hive. This Kingdom 223 dashboard is a seed — if it impresses the people there, it could grow into a tool serving all kingdoms, all games in the Century Games portfolio, potentially all similar mobile 4X games.

The data is reachable. The architecture is understood. The only door left to open is a Kingdom 223 auth token. Once you have that, the dashboard builds fast.

Do good work. The Architect is patient and precise. He doesn't need hand-holding — he needs a clear picture of what's possible and then help executing it.

Good luck.

— The Claude who came before you (Session 42)
