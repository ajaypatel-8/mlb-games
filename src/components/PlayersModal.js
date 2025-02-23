import React, { useState, useMemo, useEffect } from "react";
import { Button, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faChartBar } from "@fortawesome/free-solid-svg-icons";
import mlbTeams from "./mlbTeams.json";
import { mlbService } from "../services/mlbService";
import { useTable } from "react-table";
import { Dropdown } from "react-bootstrap";
import { FaArrowsAltV, FaArrowsAltH } from "react-icons/fa";

const LineupModal = ({ team, players, gameDate, gamePk }) => {
  const [showModal, setShowModal] = useState(false);
  const [currentView, setCurrentView] = useState("players");
  const [hitData, setHitData] = useState([]);
  const [pitchData, setPitchData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hitDataResponse, pitchDataResponse] = await Promise.all([
          mlbService.getHitData(gamePk),
          mlbService.getPitchData(gamePk),
        ]);
        setHitData(hitDataResponse);
        setPitchData(pitchDataResponse);
      } catch (error) {
        console.error("Error fetching data", error);
      }
    };

    fetchData();
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

  const teamLogo = getTeamLogoButton(team.abbreviation);

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

  const processPitchData = (pitchData) => {
    const groupedData = {};

    // Group data by pitcherName, pitchType
    pitchData.forEach((pitch) => {
      const {
        pitcherName,
        pitcherId,
        pitchType,
        startSpeed,
        inducedVerticalBreak,
        horizontalBreak,
        isCalledStrike,
        isWhiff,
      } = pitch;

      // Create a unique key for each grouping
      const groupKey = `${pitcherName}-${pitchType}`;

      // Initialize the group if not already created
      if (!groupedData[groupKey]) {
        groupedData[groupKey] = {
          pitcherName,
          pitcherId,
          pitchType,
          totalPitches: 0,
          totalStartSpeed: 0,
          totalVerticalBreak: 0,
          totalHorizontalBreak: 0,
          totalCalledStrike: 0,
          totalWhiff: 0,
        };
      }

      // Accumulate data for the group
      const group = groupedData[groupKey];
      group.totalPitches++;
      group.totalStartSpeed += startSpeed;
      group.totalVerticalBreak += inducedVerticalBreak;
      group.totalHorizontalBreak += horizontalBreak;
      group.totalCalledStrike += isCalledStrike ? 1 : 0;
      group.totalWhiff += isWhiff ? 1 : 0;
    });

    // Prepare the final result with averages and rates
    return Object.values(groupedData).map((group) => {
      const numPitches = group.totalPitches;
      const avgStartSpeed = (group.totalStartSpeed / numPitches).toFixed(1);
      const avgVerticalBreak = (group.totalVerticalBreak / numPitches).toFixed(
        1
      );
      const avgHorizontalBreak = (
        group.totalHorizontalBreak / numPitches
      ).toFixed(1);
      const calledStrikeWhiffRate = Math.round(
        ((group.totalCalledStrike + group.totalWhiff) / numPitches) * 100
      );

      return {
        pitcherName: group.pitcherName,
        pitcherId: group.pitcherId,
        pitchType: group.pitchType,
        numPitches,
        avgStartSpeed,
        avgVerticalBreak,
        avgHorizontalBreak,
        calledStrikeWhiffRate: `${calledStrikeWhiffRate}%`,
      };
    });
  };

  const processedData = processPitchData(pitchData).filter((data) =>
    pitchers.some((pitcher) => pitcher.person.id === data.pitcherId)
  );

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

  const filteredHitters = useMemo(
    () =>
      hitters.filter((player) =>
        player.person.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [hitters, searchTerm]
  );

  const filteredPitchers = useMemo(
    () =>
      processedData.filter((item) =>
        item.pitcherName.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [processedData, searchTerm]
  );

  const MemoizedTable = React.memo(Table);

  return (
    <div>
      <Button
        variant={team === "away" ? "outline-primary" : "outline-success"}
        onClick={() => setShowModal(true)}
        className="d-flex align-items-center gap-2 w-100"
      >
        {teamLogo ? (
          <img
            src={teamLogo}
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
              {teamLogo && (
                <img
                  src={teamLogo}
                  alt={team.teamName}
                  style={{ width: "30px", height: "30px", marginRight: "10px" }}
                />
              )}
              <Modal.Title>{`${team.teamName} Players`}</Modal.Title>
            </div>

            <div className="d-flex align-items-center gap-2">
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" size="sm">
                  <FontAwesomeIcon icon={faChartBar} className="me-1" />
                  {currentView === "players"
                    ? "Players"
                    : currentView === "exitVelo"
                    ? "Exit Velocities"
                    : "Pitch Data"}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item
                    onClick={() => setCurrentView("players")}
                    active={currentView === "players"}
                  >
                    All Players
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => setCurrentView("exitVelo")}
                    active={currentView === "exitVelo"}
                  >
                    Exit Velocities
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => setCurrentView("pitchData")}
                    active={currentView === "pitchData"}
                  >
                    Pitch Data
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>

              <span className="text-muted">{formattedDate}</span>
            </div>
          </div>
        </Modal.Header>
        <Modal.Body>
          {currentView === "exitVelo" ? (
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
          ) : currentView === "pitchData" ? (
            <div>
              <h5>Pitch Data</h5>
              <input
                type="text"
                placeholder="Search Pitchers"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-3 form-control"
              />
              <MemoizedTable
                columns={[
                  {
                    Header: "Pitcher",
                    accessor: "pitcherName",
                    Cell: ({ row }) => (
                      <div>
                        <a
                          href={getPlayerSavantLink(row.original.pitcherId)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={getPlayerHeadshot(row.original.pitcherId)}
                            alt={row.original.pitcherName}
                            style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "50%",
                              marginRight: "10px",
                            }}
                          />
                        </a>
                        <span>{row.original.pitcherName}</span>{" "}
                      </div>
                    ),
                  },
                  { Header: "Pitch", accessor: "pitchType" },
                  { Header: "#", accessor: "numPitches" },
                  { Header: "Velo", accessor: "avgStartSpeed" },
                  {
                    Header: (
                      <div>
                        IVB <FaArrowsAltV />
                      </div>
                    ),
                    accessor: "avgVerticalBreak",
                  },
                  {
                    Header: (
                      <div>
                        Horz. Break <FaArrowsAltH />
                      </div>
                    ),
                    accessor: "avgHorizontalBreak",
                  },
                  {
                    Header: "CSW%",
                    accessor: "calledStrikeWhiffRate",
                  },
                ]}
                data={filteredPitchers}
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
