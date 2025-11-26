import Redis from 'ioredis';

// Create Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
});

// Redis connection events
redis.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

redis.on('close', () => {
  console.log('Redis connection closed');
});

// Helper functions for token storage
export const storeRefreshToken = async (token, data, ttl = 7 * 24 * 60 * 60) => {
  try {
    await redis.setex(
      `refresh_token:${token}`,
      ttl,
      JSON.stringify(data)
    );
    return true;
  } catch (error) {
    console.error('Error storing refresh token:', error);
    throw error;
  }
};

export const getRefreshToken = async (token) => {
  try {
    const data = await redis.get(`refresh_token:${token}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting refresh token:', error);
    throw error;
  }
};

export const deleteRefreshToken = async (token) => {
  try {
    await redis.del(`refresh_token:${token}`);
    return true;
  } catch (error) {
    console.error('Error deleting refresh token:', error);
    throw error;
  }
};

export const storeFailedAttempt = async (ip, data, ttl = 15 * 60) => {
  try {
    await redis.setex(
      `failed_attempt:${ip}`,
      ttl,
      JSON.stringify(data)
    );
    return true;
  } catch (error) {
    console.error('Error storing failed attempt:', error);
    throw error;
  }
};

export const getFailedAttempt = async (ip) => {
  try {
    const data = await redis.get(`failed_attempt:${ip}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting failed attempt:', error);
    throw error;
  }
};

export const deleteFailedAttempt = async (ip) => {
  try {
    await redis.del(`failed_attempt:${ip}`);
    return true;
  } catch (error) {
    console.error('Error deleting failed attempt:', error);
    throw error;
  }
};

// Cleanup expired data (run periodically)
export const cleanupExpiredData = async () => {
  // Redis automatically expires keys based on TTL
  console.log('Redis cleanup completed');
};

export default redis;