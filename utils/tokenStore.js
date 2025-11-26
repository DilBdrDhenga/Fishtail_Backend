import redis from '../config/redis.js';

export const storeRefreshToken = async (token, data) => {
  await redis.setex(
    `refresh_token:${token}`, 
    7 * 24 * 60 * 60, // 7 days in seconds
    JSON.stringify(data)
  );
};

export const getRefreshToken = async (token) => {
  const data = await redis.get(`refresh_token:${token}`);
  return data ? JSON.parse(data) : null;
};

export const deleteRefreshToken = async (token) => {
  await redis.del(`refresh_token:${token}`);
};