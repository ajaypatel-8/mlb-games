import React, { useState, useMemo, useEffect } from "react";
import { Button, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faChartBar } from "@fortawesome/free-solid-svg-icons";
import mlbTeams from "./mlbTeams.json";
import { mlbService } from "../services/mlbService";
import { useTable } from "react-table";

const LineupModal = ({ team, players, gameDate, gamePk }) => {
  const [showModal, setShowModal] = useState(false);
  const [showExitVelo, setShowExitVelo] = useState(false);
  const [hitData, setHitData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchHitData = async () => {
      try {
        const data = await mlbService.getHitData(gamePk);
        setHitData(data);
      } catch (error) {}
    };

    fetchHitData();
  }, [gamePk]);

  const teamMap = useMemo(() => {
    return mlbTeams.reduce((acc, team) => {
      acc[team.team_abbr] = team;
      return acc;
    }, {});
  }, []);

  const getTeamLogoButton = (teamAbbreviation) => {
    const team = teamMap[teamAbbreviation];
    return team ? team.team_scoreboard_logo_espn : null;
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

  const columns = useMemo(
    () => [
      {
        Header: "Batter",
        accessor: "playerName",
      },
      {
        Header: "Result",
        accessor: "event",
      },
      {
        Header: "Exit Velo",
        accessor: "launchSpeed",
      },
      {
        Header: "LA",
        accessor: "launchAngle",
      },
      {
        Header: "Hit Dist.",
        accessor: "hitDistance",
      },
    ],
    []
  );
  const Table = ({ columns, data }) => {
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
      useTable({ columns, data });

    return (
      <table {...getTableProps()} className="table table-bordered">
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>{column.render("Header")}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  if (cell.column.id === "launchSpeed") {
                    const exitVelo = cell.value;
                    return (
                      <td {...cell.getCellProps()}>
                        {exitVelo} {exitVelo >= 95 ? "🔥" : ""}
                      </td>
                    );
                  }

                  if (cell.column.id === "event") {
                    const result = cell.value;
                    return (
                      <td {...cell.getCellProps()}>
                        {result} {result === "Home Run" ? "🚀" : ""}
                      </td>
                    );
                  }

                  return (
                    <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  const filteredHitters = hitters.filter((player) =>
    player.person.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const MemoizedTable = React.memo(Table);

  return (
    <div>
      <Button
        variant={team === "away" ? "outline-primary" : "outline-success"}
        onClick={() => setShowModal(true)}
        className="d-flex align-items-center gap-2 w-100"
      >
        {getTeamLogoButton(team.abbreviation) ? (
          <img
            src={getTeamLogoButton(team.abbreviation)}
            alt={`${team.teamName} logo`}
            style={{ width: "24px", height: "24px" }}
          />
        ) : (
          <span>{team.abbreviation}</span>
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
              {getTeamLogoButton(team.abbreviation) && (
                <img
                  src={getTeamLogoButton(team.abbreviation)}
                  alt={team.teamName}
                  style={{ width: "30px", height: "30px", marginRight: "10px" }}
                />
              )}
              <Modal.Title>{`${team.teamName} Players`}</Modal.Title>
            </div>

            <div className="d-flex align-items-center gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setShowExitVelo(!showExitVelo)}
              >
                <FontAwesomeIcon icon={faChartBar} className="me-1" />
                {showExitVelo ? "Show Players" : "Exit Velocities"}
              </Button>
              <span className="text-muted">{formattedDate}</span>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body>
          {showExitVelo ? (
            <div>
              <h5>Batted Ball Metrics</h5>
              <input
                type="text"
                placeholder="Search Players"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-3 form-control"
              />

              <MemoizedTable
                columns={columns}
                data={filteredHitters
                  .map((player) => {
                    const hitInfo = hitData.find(
                      (hit) => hit.batterId === player.person.id
                    );
                    if (!hitInfo) return null;

                    return {
                      playerName: (
                        <div>
                          <a
                            href={getPlayerSavantLink(player.person.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={getPlayerHeadshot(player.person.id)}
                              alt={player.person.fullName}
                              style={{
                                width: "30px",
                                height: "30px",
                                borderRadius: "50%",
                                marginRight: "10px",
                              }}
                            />
                          </a>
                          <span>{player.person.fullName}</span>
                        </div>
                      ),
                      event: hitInfo.result,
                      launchSpeed: hitInfo.hitData.launchSpeed,
                      launchAngle: hitInfo.hitData.launchAngle,
                      hitDistance: hitInfo.hitData.totalDistance,
                    };
                  })
                  .filter(Boolean)
                  .sort((a, b) => b.launchSpeed - a.launchSpeed)}
              />
            </div>
          ) : (
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
                        <a
                          href={getPlayerSavantLink(playerId)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={getPlayerHeadshot(playerId)}
                            alt={playerName}
                            style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "50%",
                            }}
                          />
                        </a>
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
                        <span
                          className="text-muted"
                          style={{ fontSize: "0.75rem", marginLeft: "10px" }}
                        >
                          {player.stats.batting?.summary || "N/A"}
                        </span>
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

                    return (
                      <div
                        key={playerId}
                        className="d-flex justify-content-start align-items-center mb-3"
                      >
                        <a
                          href={getPlayerSavantLink(playerId)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={getPlayerHeadshot(playerId)}
                            alt={playerName}
                            style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "50%",
                            }}
                          />
                        </a>
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
                        <span
                          className="text-muted"
                          style={{ fontSize: "0.75rem", marginLeft: "10px" }}
                        >
                          {player.stats.pitching?.summary || "N/A"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default LineupModal;
