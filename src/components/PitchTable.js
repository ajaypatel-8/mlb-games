import React, { useState } from "react";
import { Table, Form } from "react-bootstrap";
import { FaArrowsAltV, FaArrowsAltH } from "react-icons/fa";

const PitchTable = ({ pitches, getPlayerHeadshot, getPlayerSavantLink }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPitches = pitches.filter(
    (pitch) =>
      pitch.pitcherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pitch.batterName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <Form.Group controlId="search" className="mb-3">
        <Form.Control
          type="text"
          placeholder="Search by Pitcher or Batter"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Form.Group>

      <Table striped bordered responsive>
        <thead>
          <tr>
            <th>Pitcher</th>
            <th>Batter</th>
            <th>In.</th>
            <th>#</th>
            <th>Type</th>
            <th>Velo</th>
            <th>
              IVB <FaArrowsAltV />
            </th>
            <th>
              Horz. Break <FaArrowsAltH />
            </th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {filteredPitches.length === 0 ? (
            <tr>
              <td colSpan="10" className="text-center">
                No matching results found.
              </td>
            </tr>
          ) : (
            filteredPitches.map((pitch) => (
              <tr key={pitch.playId}>
                <td>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <a
                      href={getPlayerSavantLink(pitch.pitcherId)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={getPlayerHeadshot(pitch.pitcherId)}
                        alt={pitch.pitcherName}
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          marginRight: "10px",
                        }}
                      />
                    </a>
                    <span>
                      {pitch.pitcherName
                        .split(" ")
                        .map((part, index) =>
                          index === 0 ? part[0] + "." : part
                        )
                        .join(" ")}
                    </span>
                  </div>
                </td>

                <td>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <a
                      href={getPlayerSavantLink(pitch.batterId)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={getPlayerHeadshot(pitch.batterId)}
                        alt={pitch.batterName}
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          marginRight: "10px",
                        }}
                      />
                    </a>
                    <span>
                      {pitch.batterName
                        .split(" ")
                        .map((part, index) =>
                          index === 0 ? part[0] + "." : part
                        )
                        .join(" ")}
                    </span>
                  </div>
                </td>

                <td>{pitch.inning}</td>
                <td>{pitch.paPitchNumber}</td>
                <td>{pitch.pitchType}</td>
                <td>{pitch.startSpeed.toFixed(1)}</td>
                <td>{pitch.inducedVerticalBreak}"</td>
                <td>{pitch.horizontalBreak}"</td>

                <td>
                  <a
                    href={`https://baseballsavant.mlb.com/sporty-videos?playId=${pitch.playId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {pitch.description}{" "}
                  </a>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default PitchTable;
