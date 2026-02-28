import axios from "axios";

const BASE_URL = "https://statsapi.mlb.com/api/v1";
const LIVE_FEED_CACHE_TTL_MS = 15000;
const liveFeedCache = new Map();

const fetchData = async (url, params = {}) => {
  try {
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    throw error;
  }
};

const getLiveFeedCacheKey = (gamePk) => String(gamePk);

const fetchLiveData = async (gamePk, options = {}) => {
  const { forceRefresh = false, maxAgeMs = LIVE_FEED_CACHE_TTL_MS } = options;
  const cacheKey = getLiveFeedCacheKey(gamePk);
  const cachedEntry = liveFeedCache.get(cacheKey);
  const now = Date.now();

  if (!forceRefresh && cachedEntry?.data && now - cachedEntry.ts < maxAgeMs) {
    return cachedEntry.data;
  }

  if (!forceRefresh && cachedEntry?.promise) {
    return cachedEntry.promise;
  }

  const requestPromise = fetchData(
    `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`
  )
    .then((data) => {
      liveFeedCache.set(cacheKey, {
        data,
        ts: Date.now(),
        promise: null,
      });
      return data;
    })
    .catch((error) => {
      if (cachedEntry?.data) {
        liveFeedCache.set(cacheKey, {
          data: cachedEntry.data,
          ts: cachedEntry.ts,
          promise: null,
        });
      } else {
        liveFeedCache.delete(cacheKey);
      }
      throw error;
    });

  liveFeedCache.set(cacheKey, {
    data: cachedEntry?.data ?? null,
    ts: cachedEntry?.ts ?? 0,
    promise: requestPromise,
  });

  return requestPromise;
};

export const mlbService = {
  getLiveFeed: (gamePk, options) => fetchLiveData(gamePk, options),

  clearLiveFeedCache: (gamePk) => {
    if (gamePk === undefined || gamePk === null) {
      liveFeedCache.clear();
      return;
    }
    liveFeedCache.delete(getLiveFeedCacheKey(gamePk));
  },

  getSchedule: (startDate, endDate, teamId) => {
    const params = {
      hydrate: "team,lineups",
      sportId: 1,
      startDate,
      endDate,
      teamId,
    };
    return fetchData(`${BASE_URL}/schedule`, params);
  },

  getGameContent: (gamePk) => fetchData(`${BASE_URL}/game/${gamePk}/content`),
};
