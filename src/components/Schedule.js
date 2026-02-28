import React, { useState, useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { mlbService } from "../services/mlbService";
import { Container, Row, Spinner, Button } from "react-bootstrap";
import DatePickerComponent from "./DatePickerComponent";
import GameCard from "./GameCard";

const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const [showOnlyLiveGames, setShowOnlyLiveGames] = useState(false);

  const lastValidDate = "2024-10-31";
  const refreshMs = 20000;

  const getGamePriority = useCallback((game) => {
    const state = (game?.status?.detailedState || "").toLowerCase();

    if (state.includes("in progress") || state.includes("delay")) return 0;
    if (
      state.includes("scheduled") ||
      state.includes("pre-game") ||
      state.includes("warmup")
    ) {
      return 1;
    }
    if (
      state.includes("final") ||
      state.includes("completed") ||
      state.includes("game over")
    ) {
      return 2;
    }
    if (state.includes("postponed") || state.includes("cancelled")) return 3;
    return 4;
  }, []);

  const isLiveGame = useCallback((game) => {
    const state = (game?.status?.detailedState || "").toLowerCase();
    return state.includes("in progress") || state.includes("delay");
  }, []);

  const hasScheduleChanged = useCallback((currentSchedule, nextSchedule) => {
    if (currentSchedule.length !== nextSchedule.length) return true;

    for (let dateIndex = 0; dateIndex < nextSchedule.length; dateIndex++) {
      const currentDateData = currentSchedule[dateIndex];
      const nextDateData = nextSchedule[dateIndex];

      if (!currentDateData || currentDateData.date !== nextDateData.date) {
        return true;
      }

      if (currentDateData.games.length !== nextDateData.games.length) {
        return true;
      }

      for (let gameIndex = 0; gameIndex < nextDateData.games.length; gameIndex++) {
        const currentGame = currentDateData.games[gameIndex];
        const nextGame = nextDateData.games[gameIndex];

        if (!currentGame || currentGame.gamePk !== nextGame.gamePk) return true;

        const currentState = currentGame.status?.detailedState;
        const nextState = nextGame.status?.detailedState;
        if (currentState !== nextState) return true;

        const currentAwayScore = currentGame.teams?.away?.score;
        const nextAwayScore = nextGame.teams?.away?.score;
        if (currentAwayScore !== nextAwayScore) return true;

        const currentHomeScore = currentGame.teams?.home?.score;
        const nextHomeScore = nextGame.teams?.home?.score;
        if (currentHomeScore !== nextHomeScore) return true;
      }
    }

    return false;
  }, []);

  const fetchSchedule = useCallback(async (date, options = {}) => {
    const { background = false } = options;

    if (!background) {
      setLoading(true);
      setError(null);
    }

    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const data = await mlbService.getSchedule(
        formattedDate,
        formattedDate,
        null
      );

      if (data?.dates?.length > 0) {
        setSchedule((previousSchedule) =>
          hasScheduleChanged(previousSchedule, data.dates)
            ? data.dates
            : previousSchedule
        );
        if (!background) {
          setError(null);
        }
      } else {
        if (!background) {
          setSchedule([]);
          setError("No games found for this date.");
        }
      }
    } catch (err) {
      console.error("Error fetching schedule:", err);
      if (!background) {
        setError("Failed to load schedule.");
        setSchedule([]);
      }
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  }, [hasScheduleChanged]);

  useEffect(() => {
    fetchSchedule(selectedDate);
  }, [selectedDate, fetchSchedule]);

  useEffect(() => {
    if (!hasLoaded && !loading && error && !schedule.length) {
      setSelectedDate(new Date(lastValidDate));
      setHasLoaded(true);
    }
  }, [error, loading, schedule, hasLoaded]);

  useEffect(() => {
    const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
    const todayStr = format(new Date(), "yyyy-MM-dd");
    if (selectedDateStr !== todayStr) return;

    const intervalId = setInterval(() => {
      fetchSchedule(selectedDate, { background: true });
    }, refreshMs);

    return () => clearInterval(intervalId);
  }, [selectedDate, fetchSchedule]);

  const prioritizedSchedule = useMemo(
    () =>
      schedule.map((dateData) => {
        const gamesWithIndex = dateData.games.map((game, index) => ({
          game,
          index,
          priority: getGamePriority(game),
        }));

        gamesWithIndex.sort((a, b) => {
          if (a.priority !== b.priority) {
            return a.priority - b.priority;
          }
          return a.index - b.index;
        });

        return {
          ...dateData,
          games: gamesWithIndex.map((item) => item.game),
        };
      }),
    [schedule, getGamePriority]
  );

  const displayedSchedule = useMemo(() => {
    if (!showOnlyLiveGames) return prioritizedSchedule;

    return prioritizedSchedule
      .map((dateData) => ({
        ...dateData,
        games: dateData.games.filter(isLiveGame),
      }))
      .filter((dateData) => dateData.games.length > 0);
  }, [prioritizedSchedule, showOnlyLiveGames, isLiveGame]);

  const toggleDetailedStats = () => setShowDetailedStats(!showDetailedStats);
  const toggleOnlyLiveGames = () => setShowOnlyLiveGames(!showOnlyLiveGames);

  return (
    <Container>
      <DatePickerComponent
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />

      <div className="d-flex justify-content-center mb-3">
        <Button
          variant="primary"
          onClick={toggleDetailedStats}
          className="me-2"
          size="sm"
        >
          {showDetailedStats ? "Hide Detailed Stats" : "Show Detailed Stats"}
        </Button>
        <Button
          variant={showOnlyLiveGames ? "success" : "outline-success"}
          onClick={toggleOnlyLiveGames}
          size="sm"
        >
          {showOnlyLiveGames ? "Showing Live Games" : "Only Live Games"}
        </Button>
      </div>

      {loading && <Spinner animation="border" className="d-block mx-auto" />}
      {error && !schedule.length && (
        <p className="text-danger text-center">
          No games scheduled for this date.
        </p>
      )}

      {displayedSchedule.length > 0
        ? displayedSchedule.map((dateData) => (
            <div key={dateData.date} className="mb-4">
              <Row>
                {dateData.games.map((game) => (
                  <GameCard
                    key={game.gamePk}
                    game={game}
                    gameDate={selectedDate}
                    showDetailedStats={showDetailedStats}
                  />
                ))}
              </Row>
            </div>
          ))
        : !loading &&
          !error && (
            <p className="text-center">
              {showOnlyLiveGames
                ? "No live games right now."
                : "No games scheduled for this date!"}
            </p>
          )}
    </Container>
  );
};

export default Schedule;
