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

const fetchLiveData = async (gamePk) => {
  return fetchData(
    `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`
  );
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

  getGameContent: (gamePk) => fetchData(`${BASE_URL}/game/${gamePk}/content`),

  getLinescore: (gamePk) =>
    fetchLiveData(gamePk).then((data) => data.liveData.linescore.innings),

  getLeftOnBase: (gamePk) =>
    fetchLiveData(gamePk).then((data) => data.liveData.linescore.teams),

  getBoxScore: (gamePk) =>
    fetchLiveData(gamePk).then((data) => data.liveData.boxscore.teams),

  getDecisions: (gamePk) =>
    fetchLiveData(gamePk).then((data) => data.liveData.decisions),

  getStartTime: (gamePk) =>
    fetchLiveData(gamePk).then((data) => data.gameData.datetime),

  getProbablePitchers: (gamePk) =>
    fetchLiveData(gamePk).then((data) => data.gameData.probablePitchers),

  getTopPerformers: (gamePk) =>
    fetchLiveData(gamePk).then((data) => data.liveData.boxscore.topPerformers),

  getHitData: async (gamePk) => {
    try {
      const response = await fetchLiveData(gamePk);
      const plays = response.liveData.plays.allPlays;
      const hitData = [];

      plays.forEach((play, playIndex) => {
        play.playEvents.forEach((event, eventIndex) => {
          if (event.hitData) {
            const batter = play.matchup.batter;
            const result = play.result.event;

            hitData.push({
              playIndex,
              eventIndex,
              batterId: batter.id,
              result,
              batterName: batter.fullName,
              hitData: event.hitData,
            });
          }
        });
      });

      return hitData;
    } catch (error) {
      console.error("Error fetching hit data:", error);
      return [];
    }
  },
  getPitchData: async (gamePk) => {
    try {
      const response = await fetchLiveData(gamePk);
      const plays = response.liveData.plays.allPlays;
      const pitchData = [];

      plays.forEach((play) => {
        play.playEvents.forEach((event) => {
          if (event.details?.type?.description) {
            const pitcher = play.matchup.pitcher;
            const batterHand = play.matchup.batSide.description;
            const pitchType = event.details.type.code;
            const startSpeed = event.pitchData?.startSpeed;
            const inducedVerticalBreak =
              event.pitchData?.breaks?.breakVerticalInduced;
            const horizontalBreak = event.pitchData?.breaks?.breakHorizontal;
            const description = event.details.description;

            const isWhiff =
              description === "Swinging Strike" ||
              description === "Swinging Strike (Blocked)";
            const isCalledStrike = description === "Called Strike";

            pitchData.push({
              pitcherId: pitcher.id,
              pitcherName: pitcher.fullName,
              batterHand,
              pitchType,
              startSpeed,
              inducedVerticalBreak,
              horizontalBreak,
              isCalledStrike,
              isWhiff,
            });
          }
        });
      });

      return pitchData;
    } catch (error) {
      console.error("Error fetching pitch data:", error);
      return [];
    }
  },
};
