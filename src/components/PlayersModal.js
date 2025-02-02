import React, { useState, useMemo } from "react";
import { Button, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCircle, faArrowRight } from "@fortawesome/free-solid-svg-icons"; // Add the arrow icon
import mlbTeams from "./mlbTeams.json";

const LineupModal = ({ team, players, gameDate }) => {
  const [showModal, setShowModal] = useState(false);

  const teamLogos = useMemo(() => {
    return mlbTeams.reduce((acc, team) => {
      acc[team.team_abbr] = team.team_scoreboard_logo_espn;
      return acc;
    }, {});
  }, []);

  const getTeamLogo = (teamAbbreviation) => {
    return teamLogos[teamAbbreviation] || null;
  };

  const getPlayerSavantLink = (id) => {
    return `https://baseballsavant.mlb.com/savant-player/${id}`;
  };

  const getPlayerHeadshot = (playerId) => {
    return `https://img.mlbstatic.com/mlb-photos/image/upload/w_180,d_people:generic:headshot:silo:current.png,q_auto:best,f_auto/v1/people/${playerId}/headshot/silo/current`;
  };

  const sortedPlayers = Array.isArray(players)
    ? players
        .map((player) => ({
          ...player,
          battingOrder: parseInt(player.battingOrder, 10),
        }))
        .sort((a, b) => a.battingOrder - b.battingOrder)
    : [];

  const hitters = sortedPlayers.filter(
    (player) => player.position.type !== "Pitcher"
  );
  const pitchers = sortedPlayers.filter(
    (player) => player.position.type === "Pitcher"
  );

  const sortedPitchers = pitchers.sort((a, b) => {
    const ipA = a.stats.pitching?.inningsPitched || 0;
    const ipB = b.stats.pitching?.inningsPitched || 0;
    return ipB - ipA;
  });

  const formattedDate = new Date(gameDate).toLocaleDateString();

  return (
    <div>
      <Button
        variant={team === "away" ? "outline-primary" : "outline-success"}
        onClick={() => setShowModal(true)}
        className="d-flex align-items-center gap-2"
      >
        {getTeamLogo(team.abbreviation) && (
          <img
            src={getTeamLogo(team.abbreviation)}
            alt={`${team.teamName} logo`}
            style={{ width: "24px", height: "24px" }}
          />
        )}
        Players
      </Button>

      {/* Modal to display lineup */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        className="wide-modal"
      >
        <Modal.Header closeButton>
          <div className="d-flex w-100 justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              {getTeamLogo(team.abbreviation) && (
                <img
                  src={getTeamLogo(team.abbreviation)}
                  alt={team.teamName}
                  style={{ width: "30px", height: "30px", marginRight: "10px" }}
                />
              )}
              <Modal.Title>{`${team.teamName} Players`}</Modal.Title>
            </div>

            <span className="text-muted">{formattedDate}</span>
          </div>
        </Modal.Header>

        <Modal.Body>
          <div className="row">
            {hitters.length > 0 && (
              <div className="col-md-6">
                <h5>Hitters</h5>
                {hitters.map((player) => {
                  const { person } = player;
                  const playerName = person.fullName;
                  const playerId = person.id;
                  const abbreviatedName = `${
                    playerName.split(" ")[0][0]
                  }. ${playerName.split(" ").slice(1).join(" ")}`;

                  const headshot = (
                    <a
                      href={getPlayerSavantLink(playerId)}
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

                  return (
                    <div
                      key={playerId}
                      className="d-flex justify-content-start align-items-center mb-3"
                    >
                      {player.battingOrder >= 100 &&
                        player.battingOrder < 1000 &&
                        player.battingOrder % 10 !== 0 && (
                          <FontAwesomeIcon
                            icon={faArrowRight}
                            style={{
                              color: "#6c757d",
                              fontSize: "20px",
                              marginRight: "10px",
                            }}
                          />
                        )}
                      {headshot}
                      <span
                        style={{
                          flex: 1,
                          marginLeft: "10px",
                          fontWeight: "bold",
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          window.open(getPlayerSavantLink(playerId), "_blank")
                        }
                      >
                        {abbreviatedName} - {player.position.abbreviation}
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
                  );
                })}
              </div>
            )}

            {sortedPitchers.length > 0 && (
              <div className="col-md-6">
                <h5>Pitchers</h5>
                {sortedPitchers.map((player) => {
                  const { person } = player;
                  const playerName = person.fullName;
                  const playerId = person.id;
                  const abbreviatedName = `${
                    playerName.split(" ")[0][0]
                  }. ${playerName.split(" ").slice(1).join(" ")}`;

                  const headshot = (
                    <a
                      href={getPlayerSavantLink(playerId)}
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
                  if (player.stats.pitching && player.stats.pitching.summary) {
                    statSummary.push(player.stats.pitching.summary);
                  }

                  return (
                    <div
                      key={playerId}
                      className="d-flex justify-content-start align-items-center mb-3"
                    >
                      {player.battingOrder >= 100 &&
                        player.battingOrder < 1000 &&
                        player.battingOrder % 10 !== 0 && (
                          <FontAwesomeIcon
                            icon={faArrowRight}
                            style={{
                              color: "#6c757d",
                              fontSize: "20px",
                              marginRight: "10px",
                            }}
                          />
                        )}
                      {headshot}
                      <span
                        style={{
                          flex: 1,
                          marginLeft: "10px",
                          fontWeight: "bold",
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          window.open(getPlayerSavantLink(playerId), "_blank")
                        }
                      >
                        {abbreviatedName} - {player.position.abbreviation}
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
                  );
                })}
              </div>
            )}
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default LineupModal;
