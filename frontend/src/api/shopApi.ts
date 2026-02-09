import client from './client';

export const listHeroes = () => client.get('/shop/heroes').then(r => r.data);
export const buySummon = (templateId: number) =>
  client.post('/shop/buy-summon', { templateId }).then(r => r.data);
export const buyHero = (templateId: number) =>
  client.post('/shop/buy-hero', { templateId }).then(r => r.data);
export const listItems = () => client.get('/shop/items').then(r => r.data);
export const buyItem = (itemTemplateId: number, heroId: number, slotNumber: number) =>
  client.post('/shop/buy-item', { itemTemplateId, heroId, slotNumber }).then(r => r.data);
export const listAbilities = (heroId: number) =>
  client.get(`/shop/abilities?heroId=${heroId}`).then(r => r.data);
export const buyAbility = (abilityTemplateId: number, heroId: number) =>
  client.post('/shop/buy-ability', { abilityTemplateId, heroId }).then(r => r.data);
