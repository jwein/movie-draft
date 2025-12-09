/**
 * Test script to verify pick sequence, especially at pick 7 (Round 2 start)
 * This simulates the draft state transitions to ensure currentPickIndex and currentMember
 * advance correctly through the snake draft.
 */

const DRAFT_CONFIG = {
  TOTAL_ROUNDS: 6,
  TOTAL_MEMBERS: 6,
};

const DEFAULT_MEMBERS = [
  { id: 1, name: 'Doodie (G)' },
  { id: 2, name: 'Doodie (Z)' },
  { id: 3, name: 'Coach Josh' },
  { id: 4, name: 'Relvis' },
  { id: 5, name: 'Pittsburgh Matt' },
  { id: 6, name: 'Question Marc' },
];

// Generate snake draft order (same logic as useDraftState.js)
function generateSnakeDraftOrder(members) {
  const order = [];
  for (let round = 0; round < DRAFT_CONFIG.TOTAL_ROUNDS; round++) {
    const roundOrder = round % 2 === 0 
      ? [...members] 
      : [...members].reverse();
    order.push(...roundOrder.map(m => m.id));
  }
  return order;
}

// Simulate draft state
function simulateDraft() {
  const members = [...DEFAULT_MEMBERS];
  const draftOrder = generateSnakeDraftOrder(members);
  
  console.log('=== Draft Order Generation Test ===\n');
  console.log(`Total picks: ${draftOrder.length} (expected: ${DRAFT_CONFIG.TOTAL_ROUNDS * DRAFT_CONFIG.TOTAL_MEMBERS})`);
  console.log(`Draft order: [${draftOrder.join(', ')}]\n`);
  
  // Verify each pick
  console.log('=== Pick Sequence Verification ===\n');
  for (let pickIndex = 0; pickIndex < Math.min(12, draftOrder.length); pickIndex++) {
    const memberId = draftOrder[pickIndex];
    const member = members.find(m => m.id === memberId);
    const round = Math.floor(pickIndex / DRAFT_CONFIG.TOTAL_MEMBERS) + 1;
    const pickNumber = pickIndex + 1;
    
    const status = member 
      ? `✓ Pick ${pickNumber} (Round ${round}, Index ${pickIndex}): Member ${memberId} (${member.name})`
      : `✗ Pick ${pickNumber} (Round ${round}, Index ${pickIndex}): Member ${memberId} NOT FOUND`;
    
    console.log(status);
    
    // Highlight pick 7 (Round 2 start)
    if (pickIndex === 6) {
      console.log('  ⚠️  This is pick 7 - first pick of Round 2 (snake reversal)');
      console.log(`  Expected: Member 6 (${members[5].name})`);
      console.log(`  Actual: Member ${memberId} (${member?.name || 'NOT FOUND'})`);
      if (memberId !== 6 || !member) {
        console.error('  ❌ ERROR: Pick 7 validation failed!');
        return false;
      } else {
        console.log('  ✅ Pick 7 validation passed!');
      }
    }
  }
  
  // Verify member ID consistency
  console.log('\n=== Member ID Consistency Check ===\n');
  const memberIds = new Set(members.map(m => m.id));
  const invalidIds = draftOrder.filter(id => !memberIds.has(id));
  
  if (invalidIds.length > 0) {
    console.error(`❌ Found ${invalidIds.length} invalid member IDs in draftOrder: ${invalidIds.join(', ')}`);
    return false;
  } else {
    console.log('✅ All member IDs in draftOrder are valid');
  }
  
  // Verify snake pattern
  console.log('\n=== Snake Pattern Verification ===\n');
  for (let round = 0; round < 2; round++) {
    const startIdx = round * DRAFT_CONFIG.TOTAL_MEMBERS;
    const roundPicks = draftOrder.slice(startIdx, startIdx + DRAFT_CONFIG.TOTAL_MEMBERS);
    const expectedOrder = round % 2 === 0
      ? [1, 2, 3, 4, 5, 6]
      : [6, 5, 4, 3, 2, 1];
    
    const matches = JSON.stringify(roundPicks) === JSON.stringify(expectedOrder);
    console.log(`Round ${round + 1} (picks ${startIdx + 1}-${startIdx + DRAFT_CONFIG.TOTAL_MEMBERS}):`);
    console.log(`  Expected: [${expectedOrder.join(', ')}]`);
    console.log(`  Actual:   [${roundPicks.join(', ')}]`);
    console.log(`  ${matches ? '✅' : '❌'} ${matches ? 'Matches' : 'Mismatch'}`);
    
    if (!matches) return false;
  }
  
  console.log('\n✅ All tests passed!');
  return true;
}

// Run simulation
const success = simulateDraft();
process.exit(success ? 0 : 1);

