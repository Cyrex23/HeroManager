import client from './client';

export const getTeam = () => client.get('/team').then(r => r.data);
export const equipHero = (heroId: number, slotNumber: number) =>
  client.post('/team/equip-hero', { heroId, slotNumber }).then(r => r.data);
export const unequipHero = (slotNumber: number) =>
  client.post('/team/unequip-hero', { slotNumber }).then(r => r.data);
export const equipSummon = (summonId: number) =>
  client.post('/team/equip-summon', { summonId }).then(r => r.data);
export const unequipSummon = () =>
  client.post('/team/unequip-summon').then(r => r.data);
export const reorderTeam = (order: (number | null)[]) =>
  client.post('/team/reorder', { order }).then(r => r.data);
