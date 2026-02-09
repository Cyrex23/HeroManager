import client from './client';

export const getOpponents = (page = 0, size = 20) =>
  client.get(`/arena/opponents?page=${page}&size=${size}`).then(r => r.data);
export const challenge = (defenderId: number) =>
  client.post('/arena/challenge', { defenderId }).then(r => r.data);
export const getBattleLog = (page = 0, size = 10) =>
  client.get(`/arena/battle-log?page=${page}&size=${size}`).then(r => r.data);
export const getBattle = (battleId: number) =>
  client.get(`/arena/battle/${battleId}`).then(r => r.data);
