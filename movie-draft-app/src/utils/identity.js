// Utilities for canonicalizing member identities and own-pick limits.
//
// Canonical member IDs are stable placeholders so the public repo does not
// ship personally identifying labels in source or sample data.

export const CANONICAL_MEMBER_IDS = [
  'member_a',
  'member_b',
  'member_c',
  'member_d',
  'member_e',
  'member_f',
];

const SOURCE_NAME_TO_CANONICAL = {
  'member a': 'member_a',
  'member_a': 'member_a',
  'member-a': 'member_a',
  'member b': 'member_b',
  'member_b': 'member_b',
  'member-b': 'member_b',
  'member c': 'member_c',
  'member_c': 'member_c',
  'member-c': 'member_c',
  'member d': 'member_d',
  'member_d': 'member_d',
  'member-d': 'member_d',
  'member e': 'member_e',
  'member_e': 'member_e',
  'member-e': 'member_e',
  'member f': 'member_f',
  'member_f': 'member_f',
  'member-f': 'member_f',
};

const MEMBER_ID_TO_CANONICAL = {
  1: 'member_a',
  2: 'member_b',
  3: 'member_c',
  4: 'member_d',
  5: 'member_e',
  6: 'member_f',
};

export function getCanonicalMemberIdFromName(name) {
  if (!name || typeof name !== 'string') return null;
  const key = name.trim().toLowerCase();
  return SOURCE_NAME_TO_CANONICAL[key] || null;
}

export function getCanonicalMemberIdFromMember(member) {
  if (!member) return null;
  if (typeof member.canonicalId === 'string') {
    return isCanonicalId(member.canonicalId) ? member.canonicalId : null;
  }
  if (typeof member.id === 'number') {
    return MEMBER_ID_TO_CANONICAL[member.id] || null;
  }
  return getCanonicalMemberIdFromName(member.name);
}

const CANONICAL_DISPLAY_NAME = {
  member_a: 'Member A',
  member_b: 'Member B',
  member_c: 'Member C',
  member_d: 'Member D',
  member_e: 'Member E',
  member_f: 'Member F',
};

export function getDisplayNameForCanonicalId(canonicalId) {
  return CANONICAL_DISPLAY_NAME[canonicalId] || canonicalId;
}

const OWN_PICK_LIMITS = {
  member_a: 1,
  member_b: 1,
  member_c: 1,
  member_d: 1,
  member_e: 1,
  member_f: 1,
};

export function getOwnPickLimitForMember(canonicalId) {
  return OWN_PICK_LIMITS[canonicalId] ?? 1;
}

export function isCanonicalId(value) {
  return typeof value === 'string' && CANONICAL_MEMBER_IDS.includes(value);
}


