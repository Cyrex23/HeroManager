import client from './client';

export const getHeroEquipment = (heroId: number) =>
  client.get(`/equipment/hero/${heroId}`).then(r => r.data);
export const equipItem = (heroId: number, itemTemplateId: number, slotNumber: number) =>
  client.post('/equipment/equip-item', { heroId, itemTemplateId, slotNumber }).then(r => r.data);
export const unequipItem = (heroId: number, slotNumber: number) =>
  client.post('/equipment/unequip-item', { heroId, slotNumber }).then(r => r.data);
export const sellItem = (heroId: number, slotNumber: number) =>
  client.post('/equipment/sell-item', { heroId, slotNumber }).then(r => r.data);
export const unequipAbility = (heroId: number, abilityTemplateId: number) =>
  client.post('/equipment/unequip-ability', { heroId, abilityTemplateId }).then(r => r.data);
