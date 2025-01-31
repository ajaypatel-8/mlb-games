import React, { useState, useEffect, useMemo } from "react";
import { Card, Col, Table } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCircle } from "@fortawesome/free-regular-svg-icons";
import { mlbService } from "../services/mlbService";
import mlbTeams from "./mlbTeams.json";
import LineupModal from "./PlayersModal";

const GameCard = ({ game, gameDate }) => {
  const { away, home } = game.teams;
  const isFinal = game.status.detailedState === "Final";
  const gamePk = game.gamePk;

  const [awayLineup, setAwayLineup] = useState([]);
  const [homeLineup, setHomeLineup] = useState([]);
  const [showAwayLineup, setShowAwayLineup] = useState(false);
  const [showHomeLineup, setShowHomeLineup] = useState(false);

  const [recapLink, setRecapLink] = useState(null);
  const [linescore, setLinescore] = useState([]);
  const [leftOnBase, setLeftOnBase] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [probablePitchers, setProbablePitchers] = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);

  useEffect(() => {
    const fetchGameContent = async () => {
      try {
        const [
          data,
          linescoreData,
          leftOnBaseData,
          decisionsData,
          topPerformersData,
        ] = await Promise.all([
          mlbService.getGameContent(gamePk),
          mlbService.getLinescore(gamePk),
          mlbService.getLeftOnBase(gamePk),
          mlbService.getDecisions(gamePk),
          mlbService.getTopPerformers(gamePk),
        ]);

        if (data.editorial?.recap?.mlb?.slug) {
          setRecapLink(
            `https://www.mlb.com/news/${data.editorial.recap.mlb.slug}`
          );
        }

        setLinescore(linescoreData);
        setLeftOnBase(leftOnBaseData);
        setDecisions(decisionsData);
        setTopPerformers(topPerformersData);

        if (game.status.detailedState === "Scheduled") {
          const startTimeData = await mlbService.getStartTime(gamePk);
          const { time, ampm } = startTimeData;
          setStartTime(`${time} ${ampm}`);

          const probablePitchersData = await mlbService.getProbablePitchers(
            gamePk
          );
          setProbablePitchers(probablePitchersData || null);
        }

        const battersData = await mlbService.getBatters(gamePk);

        setAwayLineup(battersData.away?.players || []);
        setHomeLineup(battersData.home?.players || []);
      } catch (error) {
        console.error("Failed to fetch game content:", error);
        setProbablePitchers(null);
      }
    };

    fetchGameContent();
  }, [gamePk, game.status.detailedState]);

  const toggleAwayLineup = () => setShowAwayLineup((prev) => !prev);
  const toggleHomeLineup = () => setShowHomeLineup((prev) => !prev);

  const teamLogos = useMemo(() => {
    return mlbTeams.reduce((acc, team) => {
      acc[team.team_abbr] = team.team_scoreboard_logo_espn;
      return acc;
    }, {});
  }, []);

  const getTeamLogo = (teamAbbreviation) => {
    const logo = teamLogos[teamAbbreviation];
    if (logo) {
      return (
        <img
          src={logo}
          alt={teamAbbreviation}
          style={{ width: "25px", height: "25px" }}
        />
      );
    }
    return teamAbbreviation;
  };

  const getPlayerHeadshot = (playerId) => {
    return `https://img.mlbstatic.com/mlb-photos/image/upload/w_180,d_people:generic:headshot:silo:current.png,q_auto:best,f_auto/v1/people/${playerId}/headshot/silo/current`;
  };
  const filterPlayerStats = (player) => {
    return (
      (player.stats?.batting && Object.keys(player.stats.batting).length > 0) ||
      (player.stats?.pitching &&
        Object.keys(player.stats.pitching).length > 0) ||
      (player.stats?.fielding && Object.keys(player.stats.fielding).length > 0)
    );
  };

  const sortedAwayLineup = Object.values(awayLineup)
    .filter(filterPlayerStats)
    .map((player) => ({
      ...player,
      battingOrder: parseInt(player.battingOrder, 10),
    }))
    .sort((a, b) => a.battingOrder - b.battingOrder);

  const sortedHomeLineup = Object.values(homeLineup)
    .filter(filterPlayerStats)
    .map((player) => ({
      ...player,
      battingOrder: parseInt(player.battingOrder, 10),
    }))
    .sort((a, b) => a.battingOrder - b.battingOrder);

  const renderEmptyBoxScore = () => (
    <>
      <tr>
        <td>{getTeamLogo(away.team.abbreviation)}</td>
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
        <td>{getTeamLogo(home.team.abbreviation)}</td>
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
            className="text-center"
            style={{ fontSize: "0.9rem", marginBottom: "1rem" }}
          >
            <div>
              ({away.leagueRecord.wins}-{away.leagueRecord.losses}) (
              {home.leagueRecord.wins}-{home.leagueRecord.losses})
            </div>
          </div>

          <Card.Text className="mb-3">
            {!isFinal ? (
              <div className="text-center">
                {game.status.detailedState === "Scheduled" && startTime && (
                  <>
                    <br />
                    <strong>Start Time:</strong> {startTime}
                  </>
                )}
                {game.status.detailedState === "Scheduled" &&
                  probablePitchers && (
                    <>
                      <div
                        className="d-flex justify-content-center"
                        style={{ gap: "0px" }}
                      >
                        <div>
                          <strong>Away: </strong>
                          {probablePitchers.away?.fullName || "TBD"}
                        </div>
                      </div>
                      <div
                        className="d-flex justify-content-center"
                        style={{ gap: "0px" }}
                      >
                        <div>
                          <strong>Home: </strong>
                          {probablePitchers.home?.fullName || "TBD"}
                        </div>
                      </div>
                    </>
                  )}
              </div>
            ) : (
              <div className="text-center">
                <strong>Final Score:</strong> {away.score} - {home.score}
              </div>
            )}
          </Card.Text>

          {linescore.length > 0 && isFinal ? (
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
                  <th>
                    <strong>LOB</strong>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{getTeamLogo(away.team.abbreviation)} </td>
                  {linescore.map((inning, index) => (
                    <td key={index}>{inning.away?.runs || 0}</td>
                  ))}
                  <td>
                    <strong>{leftOnBase?.away?.runs || 0}</strong>
                  </td>
                  <td>
                    <strong>{leftOnBase?.away?.hits || 0}</strong>
                  </td>
                  <td>
                    <strong>{leftOnBase?.away?.errors || 0}</strong>
                  </td>
                  <td>
                    <strong>{leftOnBase?.away?.leftOnBase || 0}</strong>
                  </td>
                </tr>
                <tr>
                  <td>{getTeamLogo(home.team.abbreviation)} </td>
                  {linescore.map((inning, index) => (
                    <td key={index}>{inning.home?.runs || 0}</td>
                  ))}
                  <td>
                    <strong>{leftOnBase?.home?.runs || 0}</strong>
                  </td>
                  <td>
                    <strong>{leftOnBase?.home?.hits || 0}</strong>
                  </td>
                  <td>
                    <strong>{leftOnBase?.home?.errors || 0}</strong>
                  </td>
                  <td>
                    <strong>{leftOnBase?.home?.leftOnBase || 0}</strong>
                  </td>
                </tr>
              </tbody>
            </Table>
          ) : (
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
          )}

          {decisions && (
            <div
              className="text-center mt-3 mb-3"
              style={{ fontSize: "0.85rem" }}
            >
              <div
                className="d-flex justify-content-center align-items-center mb-2"
                style={{ gap: "15px" }}
              >
                {Object.entries(decisions).map(
                  ([role, player]) =>
                    player && (
                      <div
                        key={role}
                        className="d-flex align-items-center"
                        style={{ gap: "10px" }}
                      >
                        <strong>{role.charAt(0).toUpperCase()}:</strong>
                        <a
                          href={`https://baseballsavant.mlb.com/savant-player/${player.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {getPlayerHeadshot(player.id) ? (
                            <img
                              src={getPlayerHeadshot(player.id)}
                              alt={role.toUpperCase()}
                              style={{
                                width: "30px",
                                height: "30px",
                                borderRadius: "50%",
                              }}
                            />
                          ) : (
                            <FontAwesomeIcon
                              icon={faUserCircle}
                              style={{ color: "white", fontSize: "25px" }}
                            />
                          )}
                        </a>
                        <a
                          href={`https://baseballsavant.mlb.com/savant-player/${player.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          {`${
                            player.fullName.split(" ")[0][0]
                          }. ${player.fullName
                            .split(" ")
                            .slice(1)
                            .join(" ")}`}{" "}
                        </a>
                      </div>
                    )
                )}
              </div>
            </div>
          )}

          {isFinal && topPerformers && (
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
                  <a
                    href={`https://baseballsavant.mlb.com/savant-player/${playerId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {getPlayerHeadshot(playerId) ? (
                      <img
                        src={getPlayerHeadshot(playerId)}
                        alt={playerName}
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                        }}
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={faUserCircle}
                        style={{ color: "#6c757d", fontSize: "25px" }}
                      />
                    )}
                  </a>
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

          {isFinal && (
            <div className="d-flex flex-column align-items-center w-100">
              <div className="d-flex justify-content-between w-100 mb-3">
                {recapLink && (
                  <Card.Text className="text-center mb-3 mx-3">
                    <a
                      href={recapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Game Recap
                    </a>
                  </Card.Text>
                )}

                {gamePk && (
                  <Card.Text className="text-center mb-3 mx-3">
                    <a
                      href={`https://baseballsavant.mlb.com/gamefeed?gamePk=${gamePk}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Baseball Savant
                    </a>
                  </Card.Text>
                )}
              </div>

              <div className="d-flex justify-content-between w-100">
                <div className="lineup-modal-container">
                  <LineupModal
                    team={away.team}
                    players={sortedAwayLineup}
                    toggleLineup={toggleAwayLineup}
                    showLineup={showAwayLineup}
                    gameDate={gameDate}
                  />
                </div>

                <div className="lineup-modal-container">
                  <LineupModal
                    team={home.team}
                    players={sortedHomeLineup}
                    toggleLineup={toggleHomeLineup}
                    showLineup={showHomeLineup}
                    gameDate={gameDate}
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
