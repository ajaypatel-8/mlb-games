import axios from "axios";

const BASE_URL = "https://statsapi.mlb.com/api/v1";

const fetchData = async (url, params = {}) => {
  try {
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    throw error;
  }
};

export const mlbService = {
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

  getGameContent: (gamePk) => {
    return fetchData(`${BASE_URL}/game/${gamePk}/content`);
  },

  getLinescore: (gamePk) => {
    return fetchData(
      `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`
    ).then((data) => data.liveData.linescore.innings);
  },

  getDecisions: (gamePk) => {
    return fetchData(
      `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`
    ).then((data) => data.liveData.decisions);
  },
  getStartTime: (gamePk) => {
    return fetchData(
      `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`
    ).then((data) => data.gameData.datetime);
  },
  getProbablePitchers: (gamePk) => {
    return fetchData(
      `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`
    ).then((data) => data.gameData.probablePitchers);
  },
  getTopPerformers: (gamePk) => {
    return fetchData(
      `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`
    ).then((data) => data.liveData.boxscore.topPerformers);
  },
};
