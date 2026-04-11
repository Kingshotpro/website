import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = path.join(process.cwd(), 'data', 'kingwatch.db')

// Ensure data directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

let _db: ReturnType<typeof Database> | null = null

export function getDb() {
  if (_db) return _db
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  initSchema(_db)
  return _db
}

function initSchema(db: ReturnType<typeof Database>) {
  db.exec(`
    -- Kingdoms
    CREATE TABLE IF NOT EXISTS kingdoms (
      id          INTEGER PRIMARY KEY,   -- in-game kingdom number e.g. 223
      name        TEXT,                  -- optional custom name
      tier        TEXT,                  -- S/A/B/C/D
      notes       TEXT,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    -- Alliances (canonical record per alliance ID per kingdom)
    CREATE TABLE IF NOT EXISTS alliances (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      kingdom_id  INTEGER NOT NULL REFERENCES kingdoms(id),
      game_id     TEXT NOT NULL,         -- 2-byte hex e.g. "5101"
      name        TEXT,
      tag         TEXT,
      first_seen  TEXT DEFAULT (datetime('now')),
      UNIQUE(kingdom_id, game_id)
    );

    -- Snapshots (one per data submission)
    CREATE TABLE IF NOT EXISTS snapshots (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      kingdom_id    INTEGER NOT NULL REFERENCES kingdoms(id),
      captured_at   TEXT NOT NULL,       -- when the player saw this in-game
      submitted_at  TEXT DEFAULT (datetime('now')),
      submitted_by  TEXT,                -- optional contributor handle
      source        TEXT DEFAULT 'manual' -- 'manual' | 'screenshot' | 'auto'
    );

    -- Alliance rankings within a snapshot
    CREATE TABLE IF NOT EXISTS rankings (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_id INTEGER NOT NULL REFERENCES snapshots(id) ON DELETE CASCADE,
      rank        INTEGER NOT NULL,
      game_id     TEXT NOT NULL,
      name        TEXT,
      tag         TEXT,
      power       INTEGER NOT NULL,
      kingdom_id  INTEGER NOT NULL REFERENCES kingdoms(id)
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_rankings_kingdom  ON rankings(kingdom_id);
    CREATE INDEX IF NOT EXISTS idx_rankings_snapshot ON rankings(snapshot_id);
    CREATE INDEX IF NOT EXISTS idx_snapshots_kingdom ON snapshots(kingdom_id);
    CREATE INDEX IF NOT EXISTS idx_alliances_kingdom ON alliances(kingdom_id);
  `)
}

// ── Query helpers ────────────────────────────────────────────────────────────

export interface Kingdom {
  id: number
  name: string | null
  tier: string | null
  notes: string | null
  latest_snapshot: string | null
  alliance_count: number
}

export interface RankingRow {
  rank: number
  game_id: string
  name: string | null
  tag: string | null
  power: number
  captured_at: string
}

export function getAllKingdoms(): Kingdom[] {
  const db = getDb()
  return db.prepare(`
    SELECT
      k.id,
      k.name,
      k.tier,
      k.notes,
      MAX(s.captured_at) as latest_snapshot,
      COUNT(DISTINCT r.game_id) as alliance_count
    FROM kingdoms k
    LEFT JOIN snapshots s ON s.kingdom_id = k.id
    LEFT JOIN rankings r  ON r.kingdom_id = k.id
    GROUP BY k.id
    ORDER BY k.id ASC
  `).all() as Kingdom[]
}

export function getKingdom(id: number): Kingdom | null {
  const db = getDb()
  return db.prepare(`
    SELECT
      k.id, k.name, k.tier, k.notes,
      MAX(s.captured_at) as latest_snapshot,
      COUNT(DISTINCT r.game_id) as alliance_count
    FROM kingdoms k
    LEFT JOIN snapshots s ON s.kingdom_id = k.id
    LEFT JOIN rankings r  ON r.kingdom_id = k.id
    WHERE k.id = ?
    GROUP BY k.id
  `).get(id) as Kingdom | null
}

export function getLatestRankings(kingdomId: number): RankingRow[] {
  const db = getDb()
  // Get the most recent snapshot for this kingdom
  const snap = db.prepare(`
    SELECT id, captured_at FROM snapshots
    WHERE kingdom_id = ?
    ORDER BY captured_at DESC
    LIMIT 1
  `).get(kingdomId) as { id: number; captured_at: string } | null

  if (!snap) return []

  return db.prepare(`
    SELECT rank, game_id, name, tag, power, ? as captured_at
    FROM rankings
    WHERE snapshot_id = ?
    ORDER BY rank ASC
  `).all(snap.captured_at, snap.id) as RankingRow[]
}

export function getPowerHistory(kingdomId: number, gameId: string) {
  const db = getDb()
  return db.prepare(`
    SELECT s.captured_at, r.rank, r.power
    FROM rankings r
    JOIN snapshots s ON s.id = r.snapshot_id
    WHERE r.kingdom_id = ? AND r.game_id = ?
    ORDER BY s.captured_at ASC
  `).all(kingdomId, gameId)
}

export function insertSnapshot(
  kingdomId: number,
  capturedAt: string,
  submittedBy: string | null,
  source: string,
  rankings: Array<{ rank: number; game_id: string; name: string; tag: string; power: number }>
) {
  const db = getDb()

  // Ensure kingdom exists
  db.prepare(`INSERT OR IGNORE INTO kingdoms (id) VALUES (?)`).run(kingdomId)

  const snap = db.prepare(`
    INSERT INTO snapshots (kingdom_id, captured_at, submitted_by, source)
    VALUES (?, ?, ?, ?)
  `).run(kingdomId, capturedAt, submittedBy, source)

  const snapId = snap.lastInsertRowid

  const insertRanking = db.prepare(`
    INSERT INTO rankings (snapshot_id, kingdom_id, rank, game_id, name, tag, power)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertAlliance = db.prepare(`
    INSERT OR IGNORE INTO alliances (kingdom_id, game_id, name, tag)
    VALUES (?, ?, ?, ?)
  `)

  const insertMany = db.transaction(() => {
    for (const r of rankings) {
      insertRanking.run(snapId, kingdomId, r.rank, r.game_id, r.name || null, r.tag || null, r.power)
      if (r.name) {
        insertAlliance.run(kingdomId, r.game_id, r.name, r.tag || null)
      }
    }
  })

  insertMany()
  return snapId
}
