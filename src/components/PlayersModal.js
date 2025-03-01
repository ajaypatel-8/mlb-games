import React, { useState, useMemo, useEffect } from "react";
import { Button, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faChartBar } from "@fortawesome/free-solid-svg-icons";
import mlbTeams from "./mlbTeams.json";
import { mlbService } from "../services/mlbService";
import { useTable } from "react-table";
import { Dropdown } from "react-bootstrap";
import { FaArrowsAltV, FaArrowsAltH } from "react-icons/fa";
import "../index.css";
import MovementPlot from "./MovementPlot";
import LocationPlot from "./LocationPlot";
import RollingPlot from "./RollingPlot";
import PitchTable from "./PitchTable";

const LineupModal = ({ team, players, gameDate, gamePk }) => {
  const [showModal, setShowModal] = useState(false);
  const [currentView, setCurrentView] = useState("players");
  const [hitData, setHitData] = useState([]);
  const [pitchData, setPitchData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPitcher, setSelectedPitcher] = useState(null);

  const viewOptions = {
    players: "Players",
    exitVelo: "Exit Velocities",
    pitchData: "Pitch Data",
    movementPlot: "Movement Plots",
    locationPlot: "Location Plots",
    rollingPlots: "Rolling Plots",

    pitchByPitch: "Pitch By Pitch",
  };

  console.log(pitchData);

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

  console.log(pitchData);

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

  const formatPlayerName = (name) => {
    const parts = name.split(" ");
    return parts.length > 1
      ? `${parts[0][0]}. ${parts.slice(1).join(" ")}`
      : name;
  };

  const getPlayerHeadshot = (playerId) => {
    return `https://img.mlbstatic.com/mlb-photos/image/upload/w_180,d_people:generic:headshot:silo:current.png,q_auto:best,f_auto/v1/people/${playerId}/headshot/silo/current`;
  };

  const sortedPitchers = pitchers.sort((a, b) => {
    const ipA = a.stats.pitching?.inningsPitched || 0;
    const ipB = b.stats.pitching?.inningsPitched || 0;
    return ipB - ipA;
  });
  const processPitchData = (pitchData) => {
    const groupedData = {};

    pitchData.forEach((pitch) => {
      const {
        pitcherName,
        pitcherId,
        pitchType,
        startSpeed,
        extension,
        inducedVerticalBreak,
        horizontalBreak,
        relX,
        relZ,
        isCalledStrike,
        isWhiff,
        launchSpeed,
      } = pitch;

      const groupKey = `${pitcherName}-${pitchType}`;

      if (!groupedData[groupKey]) {
        groupedData[groupKey] = {
          pitcherName,
          pitcherId,
          pitchType,
          totalPitches: 0,
          totalBBE: 0,
          totalStartSpeed: 0,
          totalExtension: 0,
          totalVerticalBreak: 0,
          totalHorizontalBreak: 0,
          totalRelX: 0,
          totalRelZ: 0,
          totalCalledStrike: 0,
          totalWhiff: 0,
          totalLaunchSpeed: 0,
        };
      }

      const group = groupedData[groupKey];
      group.totalPitches++;
      group.totalStartSpeed += startSpeed;
      group.totalExtension += extension;
      group.totalVerticalBreak += inducedVerticalBreak;
      group.totalHorizontalBreak += horizontalBreak;
      group.totalRelX += relX;
      group.totalRelZ += relZ;
      group.totalCalledStrike += isCalledStrike ? 1 : 0;
      group.totalWhiff += isWhiff ? 1 : 0;
      if (launchSpeed != null) {
        group.totalBBE++;
        group.totalLaunchSpeed += launchSpeed;
      }
    });

    const processedData = Object.values(groupedData).map((group) => {
      const numPitches = group.totalPitches;
      const avg = (total, count) =>
        count ? (total / count).toFixed(1) : "---";

      return {
        pitcherName: group.pitcherName,
        pitcherId: group.pitcherId,
        pitchType: group.pitchType,
        pitchTypeLabel: `${group.pitchType} (${numPitches})`,
        avgStartSpeed: avg(group.totalStartSpeed, numPitches),
        avgExtension: avg(group.totalExtension, numPitches),
        avgVerticalBreak: avg(group.totalVerticalBreak, numPitches),
        avgHorizontalBreak: avg(group.totalHorizontalBreak, numPitches),
        avgRelX: avg(group.totalRelX, numPitches),
        avgRelZ: avg(group.totalRelZ, numPitches),
        calledStrikeWhiffRate: `${Math.round(
          ((group.totalCalledStrike + group.totalWhiff) / numPitches) * 100
        )}%`,
        averageEV: avg(group.totalLaunchSpeed, group.totalBBE),
        totalPitches: numPitches,
      };
    });

    const groupedByPitcher = processedData.reduce((acc, pitch) => {
      if (!acc[pitch.pitcherName]) {
        acc[pitch.pitcherName] = [];
      }
      acc[pitch.pitcherName].push(pitch);
      return acc;
    }, {});

    return Object.values(groupedByPitcher)
      .sort(
        (a, b) =>
          b.reduce((sum, p) => sum + p.totalPitches, 0) -
          a.reduce((sum, p) => sum + p.totalPitches, 0)
      )
      .flat();
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
        Cell: ({ value }) => (value !== undefined ? `${value} ft.` : ""),
      },
      {
        Header: "Hit Dist.",
        accessor: "hitDistance",
        Cell: ({ value }) => (value !== undefined ? `${value} ft.` : ""),
      },
    ],
    []
  );

  const Table = ({ columns, data }) => {
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
      useTable({ columns, data });

    return (
      <table
        {...getTableProps()}
        className="table table-bordered table-striped table-responsive"
      >
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th
                  {...column.getHeaderProps()}
                  style={{
                    textAlign: column.id === "playerName" ? "left" : "center",
                  }}
                >
                  {column.render("Header")}
                </th>
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
                  const isBatter = cell.column.id === "playerName";
                  return (
                    <td
                      {...cell.getCellProps()}
                      style={{
                        textAlign: isBatter ? "left" : "center",
                      }}
                    >
                      {cell.column.id === "launchSpeed" ? (
                        <>
                          {cell.value} {cell.value >= 95 ? "🔥" : ""}
                        </>
                      ) : cell.column.id === "event" ? (
                        <>
                          {cell.value} {cell.value === "Home Run" ? "🚀" : ""}
                        </>
                      ) : (
                        cell.render("Cell")
                      )}
                    </td>
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

  const filteredPitchersPlots = pitchData
    .filter((data) =>
      pitchers.some((pitcher) => pitcher.person.id === data.pitcherId)
    )
    .filter(
      (value, index, self) =>
        self.findIndex((v) => v.pitcherName === value.pitcherName) === index
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
              <Modal.Title>{`${team.teamName}`}</Modal.Title>
            </div>

            <div className="d-flex align-items-center gap-2">
              <Dropdown>
                <Dropdown.Toggle variant="outline-primary" size="sm">
                  <FontAwesomeIcon icon={faChartBar} className="me-1" />
                  {viewOptions[currentView] || ""}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  {Object.entries(viewOptions).map(([key, label]) => (
                    <Dropdown.Item
                      key={key}
                      onClick={() => setCurrentView(key)}
                      active={currentView === key}
                    >
                      {label}
                    </Dropdown.Item>
                  ))}
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
                    const playerHitData = hitData.filter(
                      (hit) => hit.batterId === player.person.id
                    );

                    if (playerHitData.length === 0) return null;

                    const playerData = playerHitData.map((hitInfo) => ({
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
                    }));

                    return playerData;
                  })
                  .flat()
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
                      <div style={{ display: "flex", alignItems: "center" }}>
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
                        <span>
                          {formatPlayerName(row.original.pitcherName)}
                        </span>
                      </div>
                    ),
                  },
                  {
                    Header: <div style={{ textAlign: "center" }}>Pitch</div>,
                    accessor: "pitchTypeLabel",
                    Cell: ({ value }) => (
                      <div style={{ textAlign: "center" }}>{value}</div>
                    ),
                  },
                  {
                    Header: <div style={{ textAlign: "center" }}>Velo</div>,
                    accessor: "avgStartSpeed",
                    Cell: ({ value }) => (
                      <div style={{ textAlign: "center" }}>{value}</div>
                    ),
                  },
                  {
                    Header: <div style={{ textAlign: "center" }}>Ext.</div>,
                    accessor: "avgExtension",
                    Cell: ({ value }) => (
                      <div style={{ textAlign: "center" }}>{value}</div>
                    ),
                  },
                  {
                    Header: <div style={{ textAlign: "center" }}>Rel. X</div>,
                    accessor: "avgRelX",
                    Cell: ({ value }) => (
                      <div style={{ textAlign: "center" }}>{value}</div>
                    ),
                  },
                  {
                    Header: <div style={{ textAlign: "center" }}>Rel. Z</div>,
                    accessor: "avgRelZ",
                    Cell: ({ value }) => (
                      <div style={{ textAlign: "center" }}>{value}</div>
                    ),
                  },
                  {
                    Header: (
                      <div style={{ textAlign: "center" }}>
                        IVB <FaArrowsAltV />
                      </div>
                    ),
                    accessor: "avgVerticalBreak",
                    Cell: ({ value }) => (
                      <div style={{ textAlign: "center" }}>{value}"</div>
                    ),
                  },
                  {
                    Header: (
                      <div style={{ textAlign: "center" }}>
                        Horz. Break <FaArrowsAltH />
                      </div>
                    ),
                    accessor: "avgHorizontalBreak",
                    Cell: ({ value }) => (
                      <div style={{ textAlign: "center" }}>{value}"</div>
                    ),
                  },
                  {
                    Header: <div style={{ textAlign: "center" }}>CSW%</div>,
                    accessor: "calledStrikeWhiffRate",
                    Cell: ({ value }) => (
                      <div style={{ textAlign: "center" }}>{value}</div>
                    ),
                  },
                  {
                    Header: <div style={{ textAlign: "center" }}>Avg. EV</div>,
                    accessor: "averageEV",
                    Cell: ({ value }) => (
                      <div style={{ textAlign: "center" }}>{value}</div>
                    ),
                  },
                ]}
                data={filteredPitchers}
              />
            </div>
          ) : currentView === "movementPlot" ? (
            <>
              <div style={{ display: "flex", alignItems: "center" }}>
                <h5 style={{ marginRight: "10px" }}>Movement Plot</h5>
                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary" size="sm">
                    {selectedPitcher || "Choose A Pitcher"}
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.Item disabled>Choose A Pitcher</Dropdown.Item>
                    {filteredPitchersPlots.length > 0 ? (
                      filteredPitchersPlots.map((pitch, index) => (
                        <Dropdown.Item
                          key={index}
                          onClick={() => setSelectedPitcher(pitch.pitcherName)}
                        >
                          {pitch.pitcherName}
                        </Dropdown.Item>
                      ))
                    ) : (
                      <Dropdown.Item disabled>No Statcast Data</Dropdown.Item>
                    )}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
              <MovementPlot
                pitchData={pitchData}
                selectedPitcher={selectedPitcher}
                pitchers={pitchers}
              />
            </>
          ) : currentView === "locationPlot" ? (
            <>
              <div style={{ display: "flex", alignItems: "center" }}>
                <h5 style={{ marginRight: "10px" }}>Location Plot</h5>
                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary" size="sm">
                    {selectedPitcher || "Choose A Pitcher"}
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.Item disabled>Choose A Pitcher</Dropdown.Item>
                    {filteredPitchersPlots.length > 0 ? (
                      filteredPitchersPlots.map((pitch, index) => (
                        <Dropdown.Item
                          key={index}
                          onClick={() => setSelectedPitcher(pitch.pitcherName)}
                        >
                          {pitch.pitcherName}
                        </Dropdown.Item>
                      ))
                    ) : (
                      <Dropdown.Item disabled>No Statcast Data</Dropdown.Item>
                    )}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
              <LocationPlot
                pitchData={pitchData}
                selectedPitcher={selectedPitcher}
                pitchers={pitchers}
              />
            </>
          ) : currentView === "pitchByPitch" ? (
            <div className="container">
              <h5>Pitch By Pitch Data</h5>
              <PitchTable
                pitches={pitchData}
                getPlayerHeadshot={getPlayerHeadshot}
                getPlayerSavantLink={getPlayerSavantLink}
              />
            </div>
          ) : currentView === "rollingPlots" ? (
            <>
              <div style={{ display: "flex", alignItems: "center" }}>
                <h5 style={{ marginRight: "10px" }}>Rolling Plots</h5>
                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary" size="sm">
                    {selectedPitcher || "Choose A Pitcher"}
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.Item disabled>Choose A Pitcher</Dropdown.Item>
                    {filteredPitchersPlots.length > 0 ? (
                      filteredPitchersPlots.map((pitch, index) => (
                        <Dropdown.Item
                          key={index}
                          onClick={() => setSelectedPitcher(pitch.pitcherName)}
                        >
                          {pitch.pitcherName}
                        </Dropdown.Item>
                      ))
                    ) : (
                      <Dropdown.Item disabled>No Statcast Data</Dropdown.Item>
                    )}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
              <RollingPlot
                pitchData={pitchData}
                selectedPitcher={selectedPitcher}
                pitchers={pitchers}
              />
            </>
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
