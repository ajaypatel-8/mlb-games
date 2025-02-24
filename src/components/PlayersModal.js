import React, { useState, useMemo, useEffect } from "react";
import { Button, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faChartBar } from "@fortawesome/free-solid-svg-icons";
import mlbTeams from "./mlbTeams.json";
import { mlbService } from "../services/mlbService";
import { useTable } from "react-table";
import { Dropdown } from "react-bootstrap";
import { FaArrowsAltV, FaArrowsAltH } from "react-icons/fa";
import * as d3 from "d3";

const LineupModal = ({ team, players, gameDate, gamePk }) => {
  const [showModal, setShowModal] = useState(false);
  const [currentView, setCurrentView] = useState("players");
  const [hitData, setHitData] = useState([]);
  const [pitchData, setPitchData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPitcher, setSelectedPitcher] = useState(null);

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
  useEffect(() => {
    if (
      currentView === "pitchPlot" &&
      pitchData.filter((data) =>
        pitchers.some((pitcher) => pitcher.person.id === data.pitcherId)
      ).length > 0
    ) {
      const pitcherName =
        selectedPitcher ||
        pitchData.filter((data) =>
          pitchers.some((pitcher) => pitcher.person.id === data.pitcherId)
        )[0].pitcherName;
      const pitcherData = pitchData.filter(
        (pitch) => pitch.pitcherName === pitcherName
      );

      d3.select("#pitch-plot-container").html("");

      const margin = { top: 20, right: 60, bottom: 60, left: 60 };
      const width = 500 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      const svg = d3
        .select("#pitch-plot-container")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3.scaleLinear().domain([-25, 25]).range([0, width]);
      const y = d3.scaleLinear().domain([-25, 25]).range([height, 0]);

      svg
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5));
      svg.append("g").attr("class", "y-axis").call(d3.axisLeft(y).ticks(5));

      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height + 50)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Horizontal Break (inches)");

      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Induced Vertical Break (inches)");

      svg
        .append("line")
        .attr("x1", x(0))
        .attr("x2", x(0))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "#bbb")
        .attr("stroke-dasharray", "5,5");

      svg
        .append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", y(0))
        .attr("y2", y(0))
        .attr("stroke", "#bbb")
        .attr("stroke-dasharray", "5,5");

      const pitchTypes = Array.from(
        new Set(pitcherData.map((d) => d.pitchType))
      );
      const colorScale = d3
        .scaleOrdinal()
        .domain(pitchTypes)
        .range(d3.schemeCategory10);

      svg
        .append("g")
        .selectAll("circle")
        .data(pitcherData)
        .join("circle")
        .attr("cx", (d) => x(d.horizontalBreak))
        .attr("cy", (d) => y(d.inducedVerticalBreak))
        .attr("r", 5)
        .style("fill", (d) => colorScale(d.pitchType))
        .style("opacity", 0.8)
        .style("stroke", "black")
        .style("stroke-width", 0.5);

      const legend = d3
        .select("#pitch-plot-container")
        .append("svg")
        .attr("width", 150)
        .attr("height", pitchTypes.length * 20 + 20)
        .attr("transform", `translate(${width + margin.left + 20},0)`);

      const legendGroup = legend.append("g");

      pitchTypes.forEach((pitchType, i) => {
        const legendItem = legendGroup
          .append("g")
          .attr("transform", `translate(0,${i * 20})`);
        legendItem
          .append("rect")
          .attr("width", 15)
          .attr("height", 15)
          .style("fill", colorScale(pitchType));
        legendItem
          .append("text")
          .attr("x", 20)
          .attr("y", 12)
          .style("font-size", "12px")
          .text(pitchType);
      });

      svg
        .append("text")
        .attr("x", width - 20)
        .attr("y", height + 45)
        .style("font-size", "12px")
        .style("text-anchor", "start")
        .style("font-weight", "bold")
        .text("R Arm Side ->");

      svg
        .append("text")
        .attr("x", 20)
        .attr("y", height + 45)
        .style("font-size", "12px")
        .style("text-anchor", "end")
        .style("font-weight", "bold")
        .text("<- L Arm Side");
    }
  }, [currentView, pitchData, pitchers, selectedPitcher]);

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
        inducedVerticalBreak,
        horizontalBreak,
        isCalledStrike,
        isWhiff,
      } = pitch;

      const groupKey = `${pitcherName}-${pitchType}`;

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

      const group = groupedData[groupKey];
      group.totalPitches++;
      group.totalStartSpeed += startSpeed;
      group.totalVerticalBreak += inducedVerticalBreak;
      group.totalHorizontalBreak += horizontalBreak;
      group.totalCalledStrike += isCalledStrike ? 1 : 0;
      group.totalWhiff += isWhiff ? 1 : 0;
    });

    const processedData = Object.values(groupedData).map((group) => {
      const numPitches = group.totalPitches;
      return {
        pitcherName: group.pitcherName,
        pitcherId: group.pitcherId,
        pitchType: group.pitchType,
        pitchTypeLabel: `${group.pitchType} (${numPitches})`,
        avgStartSpeed: (group.totalStartSpeed / numPitches).toFixed(1),
        avgVerticalBreak: (group.totalVerticalBreak / numPitches).toFixed(1),
        avgHorizontalBreak: (group.totalHorizontalBreak / numPitches).toFixed(
          1
        ),
        calledStrikeWhiffRate: `${Math.round(
          ((group.totalCalledStrike + group.totalWhiff) / numPitches) * 100
        )}%`,
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
      .sort((a, b) => {
        const totalA = a.reduce((sum, p) => sum + p.totalPitches, 0);
        const totalB = b.reduce((sum, p) => sum + p.totalPitches, 0);
        return totalB - totalA;
      })
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
        Cell: ({ value }) => `${value}°`,
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
      <table {...getTableProps()} className="table table-bordered">
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th
                  {...column.getHeaderProps()}
                  style={{
                    textAlign: column.id === "playerName" ? "left" : "center", // Left-align "Batter" header, center the others
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
                  const isBatter = cell.column.id === "playerName"; // Check if the cell is for "Batter"
                  return (
                    <td
                      {...cell.getCellProps()}
                      style={{
                        textAlign: isBatter ? "left" : "center", // Left-align Batter, center the others
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
                    : currentView === "pitchData"
                    ? "Pitch Data"
                    : "Pitch Plots"}{" "}
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
                  <Dropdown.Item
                    onClick={() => setCurrentView("pitchPlot")}
                    active={currentView === "pitchPlot"}
                  >
                    Pitch Plots
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
                        <span>{row.original.pitcherName}</span>
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
                ]}
                data={filteredPitchers}
              />
            </div>
          ) : currentView === "pitchPlot" ? (
            <>
              <div style={{ display: "flex", alignItems: "center" }}>
                <h5 style={{ marginRight: "10px" }}>Movement Plot</h5>
                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary" size="sm">
                    {selectedPitcher ||
                      (pitchData.length > 0 &&
                        pitchData.filter((data) =>
                          pitchers.some(
                            (pitcher) => pitcher.person.id === data.pitcherId
                          )
                        )[0].pitcherName) ||
                      "Select Pitcher"}
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    {pitchData
                      .filter((data) =>
                        pitchers.some(
                          (pitcher) => pitcher.person.id === data.pitcherId
                        )
                      )
                      .filter(
                        (value, index, self) =>
                          self.findIndex(
                            (v) => v.pitcherName === value.pitcherName
                          ) === index
                      ).length > 0 ? (
                      pitchData
                        .filter((data) =>
                          pitchers.some(
                            (pitcher) => pitcher.person.id === data.pitcherId
                          )
                        )
                        .filter(
                          (value, index, self) =>
                            self.findIndex(
                              (v) => v.pitcherName === value.pitcherName
                            ) === index
                        )
                        .map((pitch, index) => (
                          <Dropdown.Item
                            key={index}
                            onClick={() =>
                              setSelectedPitcher(pitch.pitcherName)
                            }
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
              <div
                id="pitch-plot-container"
                style={{ width: "100%", height: "400px", marginTop: "20px" }}
              ></div>
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
