import { getCanonicalMemberIdFromName, getCanonicalMemberIdFromMember, getOwnPickLimitForMember } from '../identity';

describe('identity utils', () => {
  test('canonicalization of member display names', () => {
    expect(getCanonicalMemberIdFromName('Member A')).toBe('member_a');
    expect(getCanonicalMemberIdFromName('member-a')).toBe('member_a');
    expect(getCanonicalMemberIdFromName('Member F')).toBe('member_f');
  });

  test('canonicalization from member object', () => {
    expect(getCanonicalMemberIdFromMember({ id: 1, name: 'Member A' })).toBe('member_a');
    expect(getCanonicalMemberIdFromMember({ id: 6, name: 'Custom Label' })).toBe('member_f');
    expect(getCanonicalMemberIdFromMember({ id: 99, name: 'Member A', canonicalId: 'member_b' })).toBe('member_b');
  });

  test('own pick limits', () => {
    expect(getOwnPickLimitForMember('member_a')).toBe(1);
    expect(getOwnPickLimitForMember('member_f')).toBe(1);
  });
});


