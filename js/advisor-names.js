/**
 * advisor-names.js — Name pool and avatar mapping
 * KingshotPro | Phase 1
 *
 * Each advisor gets a random name on archetype selection.
 * Avatar images use gender-based defaults until unique art is plugged in.
 * To add unique art: place {id}.png in /avatars/ and set img to the filename.
 */

var ADVISOR_NAMES = [
  // ── Male (30) ──────────────────────────
  { id: 'arthur',       name: 'Arthur',       gender: 'm', img: null },
  { id: 'conrad',       name: 'Conrad',       gender: 'm', img: null },
  { id: 'leon',         name: 'Leon',         gender: 'm', img: null },
  { id: 'bane',         name: 'Bane',         gender: 'm', img: null },
  { id: 'finn',         name: 'Finn',         gender: 'm', img: null },
  { id: 'seth',         name: 'Seth',         gender: 'm', img: null },
  { id: 'ragnar',       name: 'Ragnar',       gender: 'm', img: null },
  { id: 'magnus',       name: 'Magnus',       gender: 'm', img: null },
  { id: 'cedric',       name: 'Cedric',       gender: 'm', img: null },
  { id: 'leofric',      name: 'Leofric',      gender: 'm', img: null },
  { id: 'bjorn',        name: 'Bjorn',        gender: 'm', img: null },
  { id: 'erik',         name: 'Erik',         gender: 'm', img: null },
  { id: 'ivar',         name: 'Ivar',         gender: 'm', img: null },
  { id: 'leif',         name: 'Leif',         gender: 'm', img: null },
  { id: 'constantine',  name: 'Constantine',  gender: 'm', img: null },
  { id: 'albrecht',     name: 'Albrecht',     gender: 'm', img: null },
  { id: 'edmund',       name: 'Edmund',       gender: 'm', img: null },
  { id: 'gawain',       name: 'Gawain',       gender: 'm', img: null },
  { id: 'percival',     name: 'Percival',     gender: 'm', img: null },
  { id: 'lancelot',     name: 'Lancelot',     gender: 'm', img: null },
  { id: 'uther',        name: 'Uther',        gender: 'm', img: null },
  { id: 'tiberius',     name: 'Tiberius',     gender: 'm', img: null },
  { id: 'maximus',      name: 'Maximus',      gender: 'm', img: null },
  { id: 'cassian',      name: 'Cassian',      gender: 'm', img: null },
  { id: 'lucian',       name: 'Lucian',       gender: 'm', img: null },
  { id: 'octavian',     name: 'Octavian',     gender: 'm', img: null },
  { id: 'hadrian',      name: 'Hadrian',      gender: 'm', img: null },
  { id: 'marcus',       name: 'Marcus',       gender: 'm', img: null },
  { id: 'edric',        name: 'Edric',        gender: 'm', img: null },
  { id: 'lothar',       name: 'Lothar',       gender: 'm', img: null },

  // ── Female (16) ────────────────────────
  { id: 'guinevere',    name: 'Guinevere',    gender: 'f', img: null },
  { id: 'elena',        name: 'Elena',        gender: 'f', img: null },
  { id: 'adelina',      name: 'Adelina',      gender: 'f', img: null },
  { id: 'beatrice',     name: 'Beatrice',     gender: 'f', img: null },
  { id: 'melisande',    name: 'Melisande',    gender: 'f', img: null },
  { id: 'theodora',     name: 'Theodora',     gender: 'f', img: null },
  { id: 'ysabel',       name: 'Ysabel',       gender: 'f', img: 'ysabel_v4.jpg', video: 'ysabel_v4.mp4' },
  { id: 'sigrid',       name: 'Sigrid',       gender: 'f', img: null },
  { id: 'rowena',       name: 'Rowena',       gender: 'f', img: null },
  { id: 'isolde',       name: 'Isolde',       gender: 'f', img: null },
  { id: 'freya',        name: 'Freya',        gender: 'f', img: null },
  { id: 'astrid',       name: 'Astrid',       gender: 'f', img: null },
  { id: 'elara',        name: 'Elara',        gender: 'f', img: null },
  { id: 'brynn',        name: 'Brynn',        gender: 'f', img: null },
  { id: 'seraphine',    name: 'Seraphine',    gender: 'f', img: null },
  { id: 'alarica',      name: 'Alarica',      gender: 'f', img: null },
];

/**
 * Get avatar image path for a given advisor name entry.
 * Falls back to gender default if no unique art exists.
 */
function getAdvisorAvatar(nameEntry) {
  var p = window.location.pathname;
  var base = '';
  if (/\/heroes\/[a-z]/.test(p) && !/\/heroes\.html/.test(p)) base = '../../';
  else if (/\/calculators\/|\/games\/|\/guides\/|\/alliance\//.test(p)) base = '../';

  if (nameEntry.img) {
    return base + 'avatars/' + nameEntry.img;
  }
  return base + 'avatars/' + (nameEntry.gender === 'f' ? 'female_default.png' : 'male_default.png');
}

/**
 * Pick a random name from the pool.
 * Returns the full name entry object.
 */
function pickRandomAdvisorName() {
  return ADVISOR_NAMES[Math.floor(Math.random() * ADVISOR_NAMES.length)];
}

/**
 * Find a name entry by ID.
 */
function getAdvisorNameById(id) {
  for (var i = 0; i < ADVISOR_NAMES.length; i++) {
    if (ADVISOR_NAMES[i].id === id) return ADVISOR_NAMES[i];
  }
  return null;
}
