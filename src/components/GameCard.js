import React, { useState, useEffect } from "react";
import { Card, Col, Table } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCircle } from "@fortawesome/free-regular-svg-icons"; // Ensure correct import
import LineupDropdown from "./LineupDropdown";
import { mlbService } from "../services/mlbService";
import mlbTeams from "/Users/ajaypatel/mlb-games/src/mlbTeams.json";
import mlbHeadshots from "/Users/ajaypatel/mlb-games/src/mlbHeadshots.json";

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
      } catch (error) {
        console.error("Failed to fetch game content:", error);
      }
    };
    fetchGameContent();
  }, [gamePk]);

  const toggleAwayLineup = () => setShowAwayLineup(prev => !prev);
  const toggleHomeLineup = () => setShowHomeLineup(prev => !prev);

  const calculateTotal = (teamType, stat) =>
    linescore.reduce((total, inning) => total + (inning[teamType]?.[stat] || 0), 0);

  const getTeamLogo = (teamAbbreviation) => {
    const team = mlbTeams.find(t => t.team_abbr === teamAbbreviation);
    return team ? team.team_scoreboard_logo_espn : "";
  };

  const getPlayerHeadshot = (playerId) => {
    const player = mlbHeadshots.find((p) => p.savant_id === playerId);
    return player ? player.espn_headshot : null; // Return null if no headshot
  };

  return (
    <Col key={game.gamePk} md={4} className="mb-4">
      <Card className="shadow-lg border-0" style={{ borderRadius: "15px", position: "relative" }}>
        <Card.Body className="p-4">
          <Card.Title className="mb-2 text-center" style={{ fontSize: "1.1rem", margin: "0" }}>
            {away.team.name} @ {home.team.name}
          </Card.Title>

          <div className="text-center" style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
            <div>
              ({away.leagueRecord.wins}-{away.leagueRecord.losses}) ({home.leagueRecord.wins}-{home.leagueRecord.losses})
            </div>
          </div>

          <Card.Text className="mb-3">
            {!isFinal ? (
              <>
                <strong>Status:</strong> {game.status.detailedState}
                <br />
              </>
            ) : (
              <div className="text-center">
                <strong>Final Score:</strong> {away.score} - {home.score}
              </div>
            )}
          </Card.Text>

          {linescore.length > 0 && (
            <Table striped bordered hover responsive className="table-sm" style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              <thead>
                <tr>
                  <th></th>
                  {linescore.map((inning, index) => (
                    <th key={index}>{inning.num}</th>
                  ))}
                  <th><strong>R</strong></th>
                  <th><strong>H</strong></th>
                  <th><strong>E</strong></th>
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
                  <td><strong>{calculateTotal("away", "runs")}</strong></td>
                  <td><strong>{calculateTotal("away", "hits")}</strong></td>
                  <td><strong>{calculateTotal("away", "errors")}</strong></td>
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
                  <td><strong>{calculateTotal("home", "runs")}</strong></td>
                  <td><strong>{calculateTotal("home", "hits")}</strong></td>
                  <td><strong>{calculateTotal("home", "errors")}</strong></td>
                </tr>
              </tbody>
            </Table>
          )}

          {decisions && (
            <div className="text-center mt-3 mb-3" style={{ fontSize: "0.85rem" }}> {/* Adjusted text size */}
              {Object.entries(decisions).map(([role, player]) => (
                player && (
                  <div key={role} className="d-flex align-items-center justify-content-center mb-2" style={{ gap: "10px" }}> {/* Ensured even spacing */}
                    {role.charAt(0).toUpperCase() + role.slice(1)}:
                    {getPlayerHeadshot(player.id) ? (
                      <img
                        src={getPlayerHeadshot(player.id)}
                        alt={role.toUpperCase()}
                        style={{ width: "30px", height: "30px", borderRadius: "50%" }}
                      />
                    ) : (
                        <FontAwesomeIcon icon={faUserCircle} style={{ color: "#white", fontSize: "25px" }} />
                    )}
                    {player.fullName}
                  </div>
                )
              ))}
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
              <LineupDropdown team={away.team} players={awayLineup} toggleLineup={toggleAwayLineup} showLineup={showAwayLineup} />
              <LineupDropdown team={home.team} players={homeLineup} toggleLineup={toggleHomeLineup} showLineup={showHomeLineup} />
            </div>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );
};

export default GameCard;
