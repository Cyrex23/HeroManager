import client from './client';

export const getMe = () => client.get('/player/me').then(r => r.data);
export const getHeroes = () => client.get('/player/heroes').then(r => r.data);
export const getSummons = () => client.get('/player/summons').then(r => r.data);
