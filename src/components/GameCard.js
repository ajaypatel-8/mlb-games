import React, { useState, useEffect } from "react";
import { Card, Col, Table } from "react-bootstrap";
import LineupDropdown from "./LineupDropdown";
import { mlbService } from "../services/mlbService"; // Adjust path if needed

const GameCard = ({ game }) => {
  const { away, home } = game.teams;
  const isFinal = game.status.detailedState === "Final";
  const gamePk = game.gamePk;

  // Extract lineups for both teams
  const awayLineup = game.lineups?.awayPlayers || [];
  const homeLineup = game.lineups?.homePlayers || [];

  // State to handle which dropdown is expanded
  const [showAwayLineup, setShowAwayLineup] = useState(false);
  const [showHomeLineup, setShowHomeLineup] = useState(false);

  // State to store the recap article link
  const [recapLink, setRecapLink] = useState(null);
  // State to store linescore data
  const [linescore, setLinescore] = useState([]);

  useEffect(() => {
    const fetchGameContent = async () => {
      try {
        const data = await mlbService.getGameContent(gamePk);
        const recapSlug = data.editorial?.recap?.mlb?.slug;

        // Set recap link if it exists
        if (recapSlug) {
          setRecapLink(`https://www.mlb.com/news/${recapSlug}`);
        }

        // Fetch linescore data
        const linescoreData = await mlbService.getLinescore(gamePk);
        setLinescore(linescoreData); // Set the linescore state

      } catch (error) {
        console.error("Failed to fetch game content:", error);
      }
    };

    fetchGameContent();
  }, [gamePk]);

  const toggleAwayLineup = () => setShowAwayLineup(prev => !prev);
  const toggleHomeLineup = () => setShowHomeLineup(prev => !prev);

  // Calculate totals for both teams
  const calculateTotal = (teamType, stat) => {
    return linescore.reduce((total, inning) => total + (inning[teamType]?.[stat] || 0), 0);
  };

  return (
    <Col key={game.gamePk} md={4} className="mb-4">
      <Card className="shadow-lg rounded border-0">
        <Card.Body className="p-4">
          <Card.Title align="center" className="mb-2">
            <h5>
              {away.team.name} @ {home.team.name}
            </h5>
          </Card.Title>

          <div className="text-center" style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
            <div>({away.leagueRecord.wins}-{away.leagueRecord.losses}) ({home.leagueRecord.wins}-{home.leagueRecord.losses})</div>
          </div>

          <Card.Text className="mb-3">
            {!isFinal && (
              <>
                <strong>Status:</strong> {game.status.detailedState}
                <br />
              </>
            )}
            {isFinal ? (
              <div className="text-center">
                <strong>Final Score:</strong> {away.score} - {home.score}
              </div>
            ) : (
              <div className="text-center">
                <strong>Start Time:</strong> {new Date(game.gameDate).toLocaleTimeString()}
              </div>
            )}
          </Card.Text>

          {recapLink && (
            <Card.Text className="text-center">
              <a href={recapLink} target="_blank" rel="noopener noreferrer">Recap</a>
            </Card.Text>
          )}

          {/* Box Score Table */}
          {linescore.length > 0 && (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Inning</th>
                  {linescore.map((inning, index) => (
                    <th key={index}>{inning.num}</th>
                  ))}
                  <th><strong>R</strong></th> {/* Total column header */}
                  <th><strong>H</strong></th> {/* Hits column header */}
                  <th><strong>E</strong></th> {/* Errors column header */}
                </tr>
              </thead>
              <tbody>
                {/* Away Team Row */}
                <tr>
                  <td><strong>{away.team.name}</strong></td>
                  {linescore.map((inning, index) => (
                    <td key={index}>{inning.away?.runs || 0}</td>
                  ))}
                  <td><strong>{calculateTotal("away", "runs")}</strong></td> {/* Total Runs for Away */}
                  <td><strong>{calculateTotal("away", "hits")}</strong></td> {/* Total Hits for Away */}
                  <td><strong>{calculateTotal("away", "errors")}</strong></td> {/* Total Errors for Away */}
                </tr>

                {/* Home Team Row */}
                <tr>
                  <td><strong>{home.team.name}</strong></td>
                  {linescore.map((inning, index) => (
                    <td key={index}>{inning.home?.runs || 0}</td>
                  ))}
                  <td><strong>{calculateTotal("home", "runs")}</strong></td> {/* Total Runs for Home */}
                  <td><strong>{calculateTotal("home", "hits")}</strong></td> {/* Total Hits for Home */}
                  <td><strong>{calculateTotal("home", "errors")}</strong></td> {/* Total Errors for Home */}
                </tr>
              </tbody>
            </Table>
          )}

          <div className="d-flex justify-content-between align-items-center">
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
        </Card.Body>
      </Card>
    </Col>
  );
};

export default GameCard;
