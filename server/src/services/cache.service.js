/**
 * Generic Cache Service
 * Provides a simple JSON-based caching API over Redis (with in-memory fallback).
 * All values are stored as JSON strings and parsed on retrieval.
 */

const redis = require('../config/redis');

/**
 * Get a cached value by key
 * @param {string} key - Cache key
 * @returns {Promise<*>} Parsed value or null if not found
 */
const getCache = async (key) => {
  try {
    const cached = await redis.get(key);
    if (cached === null || cached === undefined) return null;
    try {
      return JSON.parse(cached);
    } catch {
      return cached; // Return raw string if not valid JSON
    }
  } catch (error) {
    console.error(`Cache GET error [${key}]:`, error.message);
    return null;
  }
};

/**
 * Set a value in cache
 * @param {string} key - Cache key
 * @param {*} value - Value to cache (will be JSON.stringify'd)
 * @param {number} [ttl] - Time-to-live in seconds (optional)
 * @returns {Promise<boolean>} True if successful
 */
const setCache = async (key, value, ttl) => {
  try {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await redis.set(key, serialized, { EX: ttl });
    } else {
      await redis.set(key, serialized);
    }
    return true;
  } catch (error) {
    console.error(`Cache SET error [${key}]:`, error.message);
    return false;
  }
};

/**
 * Delete a cached value by key
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} True if successful
 */
const deleteCache = async (key) => {
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error(`Cache DEL error [${key}]:`, error.message);
    return false;
  }
};

/**
 * Check if a key exists in cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} True if key exists
 */
const existsInCache = async (key) => {
  try {
    const result = await redis.exists(key);
    return result === 1;
  } catch (error) {
    console.error(`Cache EXISTS error [${key}]:`, error.message);
    return false;
  }
};

/**
 * Get-or-set: Returns cached value if available, otherwise calls fetchFn,
 * caches the result, and returns it.
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to fetch data on cache miss
 * @param {number} [ttl] - Time-to-live in seconds (optional)
 * @returns {Promise<*>} The cached or freshly fetched value
 */
const getCached = async (key, fetchFn, ttl) => {
  try {
    const cached = await getCache(key);
    if (cached !== null) {
      return cached;
    }

    const freshData = await fetchFn();
    if (freshData !== null && freshData !== undefined) {
      await setCache(key, freshData, ttl);
    }
    return freshData;
  } catch (error) {
    console.error(`Cache getCached error [${key}]:`, error.message);
    // Fall through to fetchFn on cache error
    try {
      return await fetchFn();
    } catch (fetchError) {
      throw fetchError;
    }
  }
};

/**
 * Delete all keys matching a glob pattern
 * @param {string} pattern - Glob pattern (e.g., 'user:profile:*')
 * @returns {Promise<number>} Number of keys deleted
 */
const deleteCacheByPattern = async (pattern) => {
  try {
    let cursor = '0';
    let deletedCount = 0;

    do {
      const reply = await redis.scan(cursor, {
        MATCH: pattern,
        COUNT: 100
      });

      cursor = reply.cursor;

      if (reply.keys.length > 0) {
        await Promise.all(reply.keys.map(key => redis.del(key)));
        deletedCount += reply.keys.length;
      }
    } while (cursor !== '0');

    return deletedCount;
  } catch (error) {
    console.error(`Cache DELETE PATTERN error [${pattern}]:`, error.message);
    return 0;
  }
};

/**
 * Set TTL on an existing key
 * @param {string} key - Cache key
 * @param {number} seconds - TTL in seconds
 * @returns {Promise<boolean>} True if successful
 */
const expireCache = async (key, seconds) => {
  try {
    await redis.expire(key, seconds);
    return true;
  } catch (error) {
    console.error(`Cache EXPIRE error [${key}]:`, error.message);
    return false;
  }
};

module.exports = {
  getCache,
  setCache,
  deleteCache,
  existsInCache,
  getCached,
  deleteCacheByPattern,
  expireCache
};
