import React, { useState, useEffect } from "react";
import { Card, Col, Table } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCircle } from "@fortawesome/free-regular-svg-icons";
import LineupDropdown from "./LineupDropdown";
import { mlbService } from "../services/mlbService";
import mlbTeams from "/Users/ajaypatel/mlb-games/src/mlbTeams.json";

const GameCard = ({ game }) => {
  const { away, home } = game.teams;
  const isFinal = game.status.detailedState === "Final";
  const gamePk = game.gamePk;

  const awayLineup = game.lineups?.awayPlayers || [];
  const homeLineup = game.lineups?.homePlayers || [];

  const [showAwayLineup, setShowAwayLineup] = useState(false);
  const [showHomeLineup, setShowHomeLineup] = useState(false);
  const [recapLink, setRecapLink] = useState(null);
  const [linescore, setLinescore] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [probablePitchers, setProbablePitchers] = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);

  useEffect(() => {
    const fetchGameContent = async () => {
      try {
        const data = await mlbService.getGameContent(gamePk);
        const recapSlug = data.editorial?.recap?.mlb?.slug;
        if (recapSlug) setRecapLink(`https://www.mlb.com/news/${recapSlug}`);

        const linescoreData = await mlbService.getLinescore(gamePk);
        setLinescore(linescoreData);

        const decisionsData = await mlbService.getDecisions(gamePk);
        setDecisions(decisionsData);

        const topPerformersData = await mlbService.getTopPerformers(gamePk);
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
      } catch (error) {
        console.error("Failed to fetch game content:", error);
        setProbablePitchers(null);
      }
    };

    fetchGameContent();
  }, [gamePk, game.status.detailedState]);

  console.log(topPerformers);

  const toggleAwayLineup = () => setShowAwayLineup((prev) => !prev);
  const toggleHomeLineup = () => setShowHomeLineup((prev) => !prev);

  const calculateTotal = (teamType, stat) =>
    linescore.reduce(
      (total, inning) => total + (inning[teamType]?.[stat] || 0),
      0
    );

  const getTeamLogo = (teamAbbreviation) => {
    const team = mlbTeams.find((t) => t.team_abbr === teamAbbreviation);
    return team ? team.team_scoreboard_logo_espn : "";
  };

  const getPlayerHeadshot = (playerId) => {
    return `https://img.mlbstatic.com/mlb-photos/image/upload/w_180,d_people:generic:headshot:silo:current.png,q_auto:best,f_auto/v1/people/${playerId}/headshot/silo/current`;
  };

  const renderEmptyBoxScore = () => (
    <>
      <tr>
        <td>
          <img
            src={getTeamLogo(away.team.abbreviation)}
            alt={away.team.name}
            style={{ width: "25px", height: "25px" }}
          />
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
          <img
            src={getTeamLogo(home.team.abbreviation)}
            alt={home.team.name}
            style={{ width: "25px", height: "25px" }}
          />
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
              whiteSpace: "nowrap",
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
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <img
                      src={getTeamLogo(away.team.abbreviation)}
                      alt={away.team.name}
                      style={{ width: "25px", height: "25px" }}
                    />
                  </td>
                  {linescore.map((inning, index) => (
                    <td key={index}>{inning.away?.runs || 0}</td>
                  ))}
                  <td>
                    <strong>{calculateTotal("away", "runs")}</strong>
                  </td>
                  <td>
                    <strong>{calculateTotal("away", "hits")}</strong>
                  </td>
                  <td>
                    <strong>{calculateTotal("away", "errors")}</strong>
                  </td>
                </tr>
                <tr>
                  <td>
                    <img
                      src={getTeamLogo(home.team.abbreviation)}
                      alt={home.team.name}
                      style={{ width: "25px", height: "25px" }}
                    />
                  </td>
                  {linescore.map((inning, index) => (
                    <td key={index}>{inning.home?.runs || 0}</td>
                  ))}
                  <td>
                    <strong>{calculateTotal("home", "runs")}</strong>
                  </td>
                  <td>
                    <strong>{calculateTotal("home", "hits")}</strong>
                  </td>
                  <td>
                    <strong>{calculateTotal("home", "errors")}</strong>
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
              {/* Main wrapper for winning/losing pitcher */}
              <div
                className="d-flex justify-content-center mb-2"
                style={{ gap: "15px" }}
              >
                {Object.entries(decisions)
                  .filter(([role]) => role !== "save") // Exclude save from the main row
                  .map(
                    ([role, player]) =>
                      player && (
                        <div
                          key={role}
                          className="d-flex align-items-center justify-content-center mb-2"
                          style={{ gap: "10px" }}
                        >
                          {role.charAt(0).toUpperCase()}:
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
                              style={{ color: "#white", fontSize: "25px" }}
                            />
                          )}
                          {player.fullName}
                        </div>
                      )
                  )}
              </div>

              {/* Save displayed on a new line if it exists */}
              {decisions.save && (
                <div
                  key="save"
                  className="d-flex align-items-center justify-content-center mb-2"
                  style={{ gap: "10px" }}
                >
                  <strong>S:</strong>
                  {getPlayerHeadshot(decisions.save.id) ? (
                    <img
                      src={getPlayerHeadshot(decisions.save.id)}
                      alt="Save"
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                      }}
                    />
                  ) : (
                    <FontAwesomeIcon
                      icon={faUserCircle}
                      style={{ color: "#white", fontSize: "25px" }}
                    />
                  )}
                  {decisions.save.fullName}
                </div>
              )}
            </div>
          )}

          <div className="d-flex flex-column align-items-center">
            {recapLink && (
              <Card.Text className="text-center mb-3">
                <a href={recapLink} target="_blank" rel="noopener noreferrer">
                  Recap
                </a>
              </Card.Text>
            )}
            <div className="d-flex justify-content-between align-items-center w-100">
              <LineupDropdown
                team={away.team}
                players={awayLineup}
                toggleLineup={toggleAwayLineup}
                showLineup={showAwayLineup}
              />
              <LineupDropdown
                team={home.team}
                players={homeLineup}
                toggleLineup={toggleHomeLineup}
                showLineup={showHomeLineup}
              />
            </div>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );
};

export default GameCard;
