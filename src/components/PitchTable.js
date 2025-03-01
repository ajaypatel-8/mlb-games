import React, { useState, useMemo } from "react";
import { Table, Form } from "react-bootstrap";
import { FaArrowsAltV, FaArrowsAltH } from "react-icons/fa";

const PitchTable = ({ pitches, getPlayerHeadshot, getPlayerSavantLink }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Function to transform a First Last to F. Last for player names
  const formatPlayerName = (name) => {
    const parts = name.split(" ");
    return parts.length > 1
      ? `${parts[0][0]}. ${parts.slice(1).join(" ")}`
      : name;
  };

  const filteredPitches = useMemo(
    () =>
      pitches.filter(
        (pitch) =>
          pitch.pitcherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pitch.batterName.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [searchTerm, pitches]
  );

  const getPlayerCell = (id, name) => (
    <div className="player-cell">
      <a
        href={getPlayerSavantLink(id)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src={getPlayerHeadshot(id)} alt={name} className="player-img" />
      </a>
      <span>{formatPlayerName(name)}</span>
    </div>
  );

  return (
    <div>
      <Form.Group controlId="search" className="mb-3">
        <Form.Control
          type="text"
          placeholder="Search by Player"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Form.Group>

      <Table striped bordered responsive>
        <thead>
          <tr className="text-center">
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
              <td colSpan="9" className="text-center">
                No Statcast Data :(
              </td>
            </tr>
          ) : (
            filteredPitches.map((pitch) => (
              <tr key={pitch.playId}>
                <td>{getPlayerCell(pitch.pitcherId, pitch.pitcherName)}</td>
                <td>{getPlayerCell(pitch.batterId, pitch.batterName)}</td>
                <td className="text-center">{pitch.inning}</td>
                <td className="text-center">{pitch.paPitchNumber}</td>
                <td className="text-center">{pitch.pitchType}</td>
                <td className="text-center">{pitch.startSpeed.toFixed(1)}</td>
                <td className="text-center">{pitch.inducedVerticalBreak}"</td>
                <td className="text-center">{pitch.horizontalBreak}"</td>
                <td className="text-center">
                  <a
                    href={`https://baseballsavant.mlb.com/sporty-videos?playId=${pitch.playId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {pitch.description}
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
