import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, Col, Table } from "react-bootstrap";
import { mlbService } from "../services/mlbService";
import mlbTeams from "./mlbTeams.json";
import LineupModal from "./PlayersModal";

const TeamLogo = React.memo(function TeamLogo({ teamUrl, logoUrl, altText }) {
  return (
    <a href={teamUrl} target="_blank" rel="noopener noreferrer">
      <img src={logoUrl} alt={altText} style={{ width: "25px", height: "25px" }} />
    </a>
  );
});

const PlayerHeadshotLink = React.memo(function PlayerHeadshotLink({
  playerUrl,
  imageUrl,
  altText,
  size = 30,
}) {
  return (
    <a href={playerUrl} target="_blank" rel="noopener noreferrer">
      <img
        src={imageUrl}
        alt={altText}
        style={{ width: `${size}px`, height: `${size}px`, borderRadius: "50%" }}
      />
    </a>
  );
});

const GameCard = ({ game, gameDate, showDetailedStats }) => {
  const liveRefreshMs = 15000;
  // Defining constants that will be used in rendering a game card
  const { away, home } = game.teams;
  const isFinal = [
    "Final",
    "Completed",
    "Completed Early",
    "Game Over",
  ].includes(game.status.detailedState);

  const isInProgress = game.status.detailedState === "In Progress";
  const isRainDelay = ["Delayed", "Rain Delay"].includes(
    game.status.detailedState
  );
  const isPregame = ["Scheduled", "Pre-Game", "Warmup"].includes(
    game.status.detailedState
  );
  const isCancelled = game.status.detailedState === "Cancelled";
  const isPostponed = game.status.detailedState === "Postponed";
  const gamePk = game.gamePk;
  const isSelectedDateToday =
    new Date(gameDate).toDateString() === new Date().toDateString();
  const shouldPollGameData =
    isSelectedDateToday && (isPregame || isInProgress || isRainDelay);

  const [boxScore, setBoxScore] = useState({});
  const [awayLineup, setAwayLineup] = useState([]);
  const [homeLineup, setHomeLineup] = useState([]);

  const [recapLink, setRecapLink] = useState(null);
  const [linescore, setLinescore] = useState([]);
  const [leftOnBase, setLeftOnBase] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [probablePitchers, setProbablePitchers] = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);

  // Function to convert time to user's local time zone
  const convertToLocalTime = useCallback((utcDateTime) => {
    const date = new Date(utcDateTime);

    const timeString = date.toLocaleString(undefined, {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      timeZoneName: "short",
    });

    const timeParts = timeString.split(" ");
    const time = timeParts.slice(0, -1).join(" ");

    return `${time}`;
  }, []);

  const fetchGameContent = useCallback(
    async (liveFeedOptions = {}) => {
      try {
        const [contentData, liveFeedData] = await Promise.all([
          mlbService.getGameContent(gamePk),
          mlbService.getLiveFeed(gamePk, liveFeedOptions),
        ]);

        const recapSlug = contentData?.editorial?.recap?.mlb?.slug;
        setRecapLink(recapSlug ? `https://www.mlb.com/news/${recapSlug}` : null);

        setLinescore(liveFeedData?.liveData?.linescore?.innings || []);
        setLeftOnBase(liveFeedData?.liveData?.linescore?.teams || null);
        setDecisions(liveFeedData?.liveData?.decisions || {});
        setTopPerformers(liveFeedData?.liveData?.boxscore?.topPerformers || []);

        const boxScoreData = liveFeedData?.liveData?.boxscore?.teams || {};
        setBoxScore(boxScoreData);
        setAwayLineup(boxScoreData?.away?.players || []);
        setHomeLineup(boxScoreData?.home?.players || []);

        if (isPregame) {
          const startDateTime = liveFeedData?.gameData?.datetime?.dateTime;
          setStartTime(startDateTime ? convertToLocalTime(startDateTime) : null);
          setProbablePitchers(liveFeedData?.gameData?.probablePitchers || null);
        } else {
          setStartTime(null);
          setProbablePitchers(null);
        }
      } catch (error) {
        console.error("Failed to fetch game content:", error);
        setProbablePitchers(null);
      }
    },
    [gamePk, isPregame, convertToLocalTime]
  );

  useEffect(() => {
    fetchGameContent();
  }, [fetchGameContent]);

  useEffect(() => {
    if (!shouldPollGameData) return;

    const intervalId = setInterval(() => {
      fetchGameContent({ maxAgeMs: 5000 });
    }, liveRefreshMs);

    return () => clearInterval(intervalId);
  }, [shouldPollGameData, fetchGameContent]);

  const teamMap = useMemo(() => {
    return mlbTeams.reduce((acc, team) => {
      acc[team.team_abbr] = team;
      return acc;
    }, {});
  }, []);

  const awayTeamData = teamMap[away.team.abbreviation];
  const homeTeamData = teamMap[home.team.abbreviation];

  const formatPlayerName = (fullName) => {
    if (!fullName) return "TBD";

    const nameParts = fullName.split(" ");
    return nameParts.length > 1
      ? `${nameParts[0][0]}. ${nameParts.slice(1).join(" ")}`
      : fullName;
  };

  const getPlayerHeadshot = (playerId) => {
    return `https://img.mlbstatic.com/mlb-photos/image/upload/w_180,d_people:generic:headshot:silo:current.png,q_auto:best,f_auto/v1/people/${playerId}/headshot/silo/current`;
  };
  const filterPlayerStats = useCallback((player) => {
    return (
      (player.stats?.batting && Object.keys(player.stats.batting).length > 0) ||
      (player.stats?.pitching &&
        Object.keys(player.stats.pitching).length > 0) ||
      (player.stats?.fielding && Object.keys(player.stats.fielding).length > 0)
    );
  }, []);
  const sortLineup = useCallback((lineup) => {
    const players = Object.values(lineup)
      .filter(filterPlayerStats)
      .map((player) => {
        const battingOrder = parseInt(player.battingOrder, 10);
        return { ...player, battingOrder };
      });

    const normalPlayers = [];
    const subbedInPlayers = [];
    const invalidPlayers = [];

    players.forEach((player) => {
      const isSubbedIn =
        player.battingOrder >= 100 &&
        player.battingOrder < 1000 &&
        player.battingOrder % 10 !== 0;

      if (isSubbedIn) {
        subbedInPlayers.push(player);
      } else if (
        isNaN(player.battingOrder) ||
        player.battingOrder < 1 ||
        player.battingOrder > 900
      ) {
        invalidPlayers.push(player);
      } else {
        const position = Math.floor(player.battingOrder / 100) - 1;
        normalPlayers[position] = player;
      }
    });

    return [...normalPlayers, ...subbedInPlayers, ...invalidPlayers];
  }, [filterPlayerStats]);

  const sortedAwayLineup = useMemo(
    () => sortLineup(awayLineup),
    [awayLineup, sortLineup]
  );
  const sortedHomeLineup = useMemo(
    () => sortLineup(homeLineup),
    [homeLineup, sortLineup]
  );
  const awayBattingStats = boxScore?.away?.teamStats?.batting || {};
  const homeBattingStats = boxScore?.home?.teamStats?.batting || {};

  const renderEmptyBoxScore = () => (
    <>
      <tr>
        <td>
          {awayTeamData ? (
            <TeamLogo
              teamUrl={`https://www.mlb.com/${awayTeamData.team_mascot.toLowerCase()}`}
              logoUrl={awayTeamData.team_scoreboard_logo_espn}
              altText={awayTeamData.team_mascot}
            />
          ) : (
            away.team.abbreviation
          )}
        </td>
        {linescore.map((inning, index) => (
          <td key={index}>-</td>
        ))}
        <td>
          <strong>-</strong>
        </td>
        <td>
          <strong>-</strong>
        </td>
        <td>
          <strong>-</strong>
        </td>
      </tr>
      <tr>
        <td>
          {homeTeamData ? (
            <TeamLogo
              teamUrl={`https://www.mlb.com/${homeTeamData.team_mascot.toLowerCase()}`}
              logoUrl={homeTeamData.team_scoreboard_logo_espn}
              altText={homeTeamData.team_mascot}
            />
          ) : (
            home.team.abbreviation
          )}
        </td>
        {linescore.map((inning, index) => (
          <td key={index}>-</td>
        ))}
        <td>
          <strong>-</strong>
        </td>
        <td>
          <strong>-</strong>
        </td>
        <td>
          <strong>-</strong>
        </td>
      </tr>
    </>
  );

  return (
    <Col key={game.gamePk} md={4} className="mb-4">
      <Card
        className="shadow-lg border-0"
        style={{ borderRadius: "15px", position: "relative" }}
      >
        <Card.Body className="p-4">
          <Card.Title
            className="mb-2"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              whiteSpace: "normal",
              wordWrap: "break-word",
              fontSize: "1.1rem",
              margin: "0",
            }}
          >
            {away.team.name} @ {home.team.name}
          </Card.Title>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "10px",
              width: "100%",
            }}
          >
            <div style={{ marginRight: "10px" }}>
              ({away.leagueRecord.wins}-{away.leagueRecord.losses})
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "5px",
              }}
            >
              {isFinal && (
                <span style={{ color: "green", marginRight: "0px" }}>
                  <i
                    className="bi bi-check-circle"
                    style={{ fontSize: "1rem" }}
                  ></i>
                </span>
              )}
              {isInProgress && (
                <span style={{ color: "blue", marginRight: "0px" }}>
                  <i
                    className="bi bi-play-circle"
                    style={{ fontSize: "1rem" }}
                  ></i>
                </span>
              )}
              {isRainDelay && (
                <span style={{ color: "orange", marginRight: "0px" }}>
                  <i
                    className="bi bi-cloud-rain"
                    style={{ fontSize: "1rem" }}
                  ></i>
                </span>
              )}
              {isPregame && (
                <span style={{ color: "orange", marginRight: "0px" }}>
                  <i className="bi bi-clock" style={{ fontSize: "1rem" }}></i>
                </span>
              )}
              {isCancelled && (
                <span style={{ color: "red", marginRight: "0px" }}>
                  <i
                    className="bi bi-x-circle"
                    style={{ fontSize: "1rem" }}
                  ></i>
                </span>
              )}
              {isPostponed && (
                <span style={{ color: "orange", marginRight: "0px" }}>
                  <i
                    className="bi bi-pause-circle"
                    style={{ fontSize: "1rem" }}
                  ></i>
                </span>
              )}
            </div>

            <div style={{ marginLeft: "5px" }}>
              ({home.leagueRecord.wins}-{home.leagueRecord.losses})
            </div>
          </div>
          <Card.Text className="mb-3">
            {isFinal || isInProgress || isRainDelay ? (
              <div className="text-center">
                <span style={{ marginRight: "10px" }}>
                  {awayTeamData ? (
                    <TeamLogo
                      teamUrl={`https://www.mlb.com/${awayTeamData.team_mascot.toLowerCase()}`}
                      logoUrl={awayTeamData.team_scoreboard_logo_espn}
                      altText={awayTeamData.team_mascot}
                    />
                  ) : (
                    away.team.abbreviation
                  )}
                </span>
                <span style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                  {away.score}
                </span>{" "}
                -{" "}
                <span style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                  {home.score}
                </span>
                <span style={{ marginLeft: "10px" }}>
                  {homeTeamData ? (
                    <TeamLogo
                      teamUrl={`https://www.mlb.com/${homeTeamData.team_mascot.toLowerCase()}`}
                      logoUrl={homeTeamData.team_scoreboard_logo_espn}
                      altText={homeTeamData.team_mascot}
                    />
                  ) : (
                    home.team.abbreviation
                  )}
                </span>
              </div>
            ) : (
              isPregame && (
                <div className="text-center">
                  {startTime && (
                    <>
                      <br />
                      <strong>Start Time:</strong> {startTime}
                    </>
                  )}
                  {isPregame && probablePitchers && (
                    <div
                      className="text-center mt-3 mb-3"
                      style={{ fontSize: "0.85rem" }}
                    >
                      <div
                        className="d-flex justify-content-center align-items-center mb-2"
                        style={{
                          gap: "15px",
                          flexWrap: "nowrap",
                          overflow: "hidden",
                        }}
                      >
                        {/* Away Pitcher */}
                        <div
                          className="d-flex align-items-center"
                          style={{ gap: "10px" }}
                        >
                          <strong>{away.team.abbreviation}: </strong>
                          <PlayerHeadshotLink
                            playerUrl={`https://baseballsavant.mlb.com/savant-player/${probablePitchers.away?.id}`}
                            imageUrl={getPlayerHeadshot(probablePitchers.away?.id)}
                            altText={probablePitchers.away?.fullName}
                          />
                          <div>
                            {formatPlayerName(
                              probablePitchers.away?.fullName
                            ) || "TBD"}
                          </div>
                        </div>

                        {/* Home Pitcher */}
                        <div
                          className="d-flex align-items-center"
                          style={{ gap: "10px" }}
                        >
                          <strong>{home.team.abbreviation}: </strong>
                          <PlayerHeadshotLink
                            playerUrl={`https://baseballsavant.mlb.com/savant-player/${probablePitchers.home?.id}`}
                            imageUrl={getPlayerHeadshot(probablePitchers.home?.id)}
                            altText={probablePitchers.home?.fullName}
                          />
                          <div>
                            {formatPlayerName(
                              probablePitchers.home?.fullName
                            ) || "TBD"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </Card.Text>

          {linescore.length > 0 && (isFinal || isInProgress || isRainDelay) ? (
            <div className="scrollable-table-container">
              <Table
                striped
                bordered
                hover
                responsive
                className="table-sm"
                style={{
                  fontSize: "0.85rem",
                  marginBottom: "0.5rem",
                }}
              >
                <thead>
                  <tr>
                    <th></th>
                    {[...Array(Math.max(9, linescore.length))].map(
                      (_, index) => (
                        <th key={index}>{index + 1}</th>
                      )
                    )}

                    <th>
                      <strong>R</strong>
                    </th>
                    <th>
                      <strong>H</strong>
                    </th>
                    <th>
                      <strong>E</strong>
                    </th>
                    {showDetailedStats && (
                      <>
                        <th>LOB</th>
                        <th>BB</th>
                        <th>K</th>
                        <th>SB</th>
                        <th>XBH</th>
                        <th>HR</th>
                        <th>OPS</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {/* Away Team */}
                  <tr>
                    <td>
                      {awayTeamData ? (
                        <TeamLogo
                          teamUrl={`https://www.mlb.com/${awayTeamData.team_mascot.toLowerCase()}`}
                          logoUrl={awayTeamData.team_scoreboard_logo_espn}
                          altText={awayTeamData.team_mascot}
                        />
                      ) : (
                        away.team.abbreviation
                      )}
                    </td>

                    {[...Array(Math.max(9, linescore.length))].map(
                      (_, index) => {
                        const inning = linescore[index];
                        return (
                          <td key={index}>
                            {inning ? inning.away?.runs || 0 : "-"}{" "}
                            {/* Display score if available, else "-" */}
                          </td>
                        );
                      }
                    )}

                    <td>
                      <strong>{leftOnBase?.away?.runs || 0}</strong>
                    </td>
                    <td>
                      <strong>{leftOnBase?.away?.hits || 0}</strong>
                    </td>
                    <td>
                      <strong>{leftOnBase?.away?.errors || 0}</strong>
                    </td>
                    {showDetailedStats && (
                      <>
                        <td>{leftOnBase?.away?.leftOnBase || 0}</td>
                        <td>
                          {awayBattingStats.baseOnBalls || 0}
                        </td>
                        <td>
                          {awayBattingStats.strikeOuts || 0}
                        </td>
                        <td>{awayBattingStats.stolenBases || 0}</td>
                        <td>
                          {(awayBattingStats.doubles || 0) +
                            (awayBattingStats.triples || 0) +
                            (awayBattingStats.homeRuns || 0)}
                        </td>
                        <td>{awayBattingStats.homeRuns || 0}</td>
                        <td>{awayBattingStats.ops || "-"}</td>
                      </>
                    )}
                  </tr>
                  {/* Home Team */}
                  <tr>
                    <td>
                      {homeTeamData ? (
                        <TeamLogo
                          teamUrl={`https://www.mlb.com/${homeTeamData.team_mascot.toLowerCase()}`}
                          logoUrl={homeTeamData.team_scoreboard_logo_espn}
                          altText={homeTeamData.team_mascot}
                        />
                      ) : (
                        home.team.abbreviation
                      )}
                    </td>
                    {[...Array(Math.max(9, linescore.length))].map(
                      (_, index) => {
                        const inning = linescore[index];
                        return (
                          <td key={index}>
                            {inning ? inning.home?.runs || 0 : "-"}{" "}
                          </td>
                        );
                      }
                    )}

                    <td className="table-column">
                      <strong>{leftOnBase?.home?.runs || 0}</strong>
                    </td>
                    <td className="table-column">
                      <strong>{leftOnBase?.home?.hits || 0}</strong>
                    </td>
                    <td className="table-column">
                      <strong>{leftOnBase?.home?.errors || 0}</strong>
                    </td>
                    {showDetailedStats && (
                      <>
                        <td className="table-column">
                          {leftOnBase?.home?.leftOnBase || 0}
                        </td>
                        <td className="table-column">
                          {homeBattingStats.baseOnBalls || 0}
                        </td>
                        <td>
                          {homeBattingStats.strikeOuts || 0}
                        </td>
                        <td className="table-column">
                          {homeBattingStats.stolenBases || 0}
                        </td>
                        <td className="table-column">
                          {(homeBattingStats.doubles || 0) +
                            (homeBattingStats.triples || 0) +
                            (homeBattingStats.homeRuns || 0)}
                        </td>
                        <td className="table-column">
                          {homeBattingStats.homeRuns || 0}
                        </td>
                        <td>{homeBattingStats.ops || "-"}</td>
                      </>
                    )}
                  </tr>
                </tbody>
              </Table>
            </div>
          ) : (
            <>
              <Table
                striped
                bordered
                hover
                responsive
                className="table-sm"
                style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}
              >
                <thead>
                  <tr>
                    <th></th>
                    {linescore.map((inning, index) => (
                      <th key={index}>{inning.num}</th>
                    ))}
                    <th>
                      <strong>R</strong>
                    </th>
                    <th>
                      <strong>H</strong>
                    </th>
                    <th>
                      <strong>E</strong>
                    </th>
                  </tr>
                </thead>
                <tbody>{renderEmptyBoxScore()}</tbody>
              </Table>
              {gamePk && !isCancelled && !isPostponed && (
                <div
                  className="text-center mb-3 mx-3"
                  style={{ fontSize: "1rem" }}
                >
                  <a
                    href={`https://baseballsavant.mlb.com/gamefeed?gamePk=${gamePk}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "1rem" }}
                  >
                    Baseball Savant
                  </a>
                </div>
              )}

              {gamePk && !isCancelled && !isPostponed && (
                <div className="d-flex justify-content-between w-100">
                  <div className="lineup-modal-container">
                    <LineupModal
                      team={away.team}
                      players={sortedAwayLineup || []}
                      gameDate={gameDate}
                      gamePk={gamePk}
                      gameStatus={game.status.detailedState}
                    />
                  </div>

                  <div className="lineup-modal-container">
                    <LineupModal
                      team={home.team}
                      players={sortedHomeLineup || []}
                      gameDate={gameDate}
                      gamePk={gamePk}
                      gameStatus={game.status.detailedState}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {decisions && Object.entries(decisions).length > 0 && (
            <div
              className="text-center mt-3 mb-3"
              style={{ fontSize: "0.85rem" }}
            >
              <div
                className="d-flex justify-content-center align-items-center mb-2"
                style={{ gap: "15px" }}
              >
                {Object.entries(decisions).map(([role, player]) => {
                  if (!player) return null;

                  const playerUrl = `https://baseballsavant.mlb.com/savant-player/${player.id}`;
                  const headshotUrl = getPlayerHeadshot(player.id);
                  const formattedName = formatPlayerName(player.fullName);

                  return (
                    <div
                      key={role}
                      className="d-flex align-items-center"
                      style={{ gap: "10px" }}
                    >
                      <strong>{role.charAt(0).toUpperCase()}:</strong>
                      <PlayerHeadshotLink
                        playerUrl={playerUrl}
                        imageUrl={headshotUrl}
                        altText={role.toUpperCase()}
                      />
                      <a
                        href={playerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          textDecoration: "none",
                          color: "inherit",
                        }}
                      >
                        {formattedName}
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(isFinal || isInProgress) && topPerformers && (
            <div
              className="text-center mt-3 mb-3"
              style={{ fontSize: "0.75rem" }}
            >
              <h5 className="mb-3" style={{ fontSize: "1rem" }}>
                Top Performers
              </h5>
              {topPerformers.map((performer) => {
                const { player } = performer;
                const playerName = player.person.fullName;
                const playerId = player.person.id;

                const abbreviatedName = `${
                  playerName.split(" ")[0][0]
                }. ${playerName.split(" ").slice(1).join(" ")}`;

                const headshot = (
                  <PlayerHeadshotLink
                    playerUrl={`https://baseballsavant.mlb.com/savant-player/${playerId}`}
                    imageUrl={getPlayerHeadshot(playerId)}
                    altText={playerName}
                  />
                );

                let statSummary = [];
                if (player.stats.batting && player.stats.batting.summary) {
                  statSummary.push(player.stats.batting.summary);
                }
                if (player.stats.pitching && player.stats.pitching.summary) {
                  statSummary.push(player.stats.pitching.summary);
                }

                return (
                  <div className="mb-3" key={playerId}>
                    <div
                      className="d-flex justify-content-center align-items-center mb-2"
                      style={{ gap: "10px" }}
                    >
                      {headshot}
                      <span style={{ flex: 1, textAlign: "left" }}>
                        <a
                          href={`https://baseballsavant.mlb.com/savant-player/${playerId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          {abbreviatedName}
                        </a>
                      </span>
                      {statSummary.length > 0 && (
                        <div
                          className="text-muted"
                          style={{
                            fontSize: "0.75rem",
                            textAlign: "right",
                            marginLeft: "10px",
                          }}
                        >
                          {statSummary.join(" | ")}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {(isFinal ||
            isInProgress ||
            isRainDelay ||
            isCancelled ||
            isPostponed) && (
            <div className="d-flex flex-column align-items-center w-100">
              {isCancelled && (
                <div className="text-center mb-1">
                  <strong>Game Cancelled</strong>
                </div>
              )}
              {isPostponed && (
                <div className="text-center mb-1">
                  <strong>Game Postponed</strong>
                </div>
              )}

              <div className="d-flex justify-content-between w-100 mb-1">
                {/*For games that are finished with a recap */}
                {isFinal && recapLink ? (
                  <>
                    {/* Recap link to the left*/}
                    <Card.Text
                      className="text-left mb-3"
                      style={{ fontSize: "1rem" }}
                    >
                      <a
                        href={recapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="recap-link"
                      >
                        Game Recap
                      </a>
                    </Card.Text>

                    {/* Savant link to the right */}
                    <div
                      className="d-flex justify-content-end mb-3"
                      style={{ fontSize: "1rem" }}
                    >
                      <a
                        href={`https://baseballsavant.mlb.com/gamefeed?gamePk=${gamePk}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Baseball Savant
                      </a>
                    </div>
                  </>
                ) : (
                  /* Centered Savant Link for In-Progress Games or Final Games Without Recap */
                  <div className="d-flex justify-content-center w-100 mb-1">
                    {gamePk && (
                      <div className="mb-3 mx-3" style={{ fontSize: "1rem" }}>
                        <a
                          href={`https://baseballsavant.mlb.com/gamefeed?gamePk=${gamePk}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: "1rem" }}
                        >
                          Baseball Savant
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="lineup-flex-container d-flex justify-content-between w-100">
                <div className="lineup-modal-container">
                  <LineupModal
                    team={away.team}
                    players={sortedAwayLineup || []}
                    gameDate={gameDate}
                    gamePk={gamePk}
                    gameStatus={game.status.detailedState}
                  />
                </div>

                <div className="lineup-modal-container">
                  <LineupModal
                    team={home.team}
                    players={sortedHomeLineup || []}
                    gameDate={gameDate}
                    gamePk={gamePk}
                    gameStatus={game.status.detailedState}
                  />
                </div>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </Col>
  );
};
export default GameCard;
