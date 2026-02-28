import React, { useState, useMemo } from "react";
import { Table, Form } from "react-bootstrap";
import { FaArrowsAltV, FaArrowsAltH } from "react-icons/fa";

const PlayerHeadshotLink = React.memo(function PlayerHeadshotLink({
  playerUrl,
  imageUrl,
  altText,
}) {
  return (
    <a href={playerUrl} target="_blank" rel="noopener noreferrer">
      <img src={imageUrl} alt={altText} className="player-img" />
    </a>
  );
});

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
      <PlayerHeadshotLink
        playerUrl={getPlayerSavantLink(id)}
        imageUrl={getPlayerHeadshot(id)}
        altText={name}
      />
      <span>{formatPlayerName(name)}</span>
    </div>
  );

  const formatOneDecimal = (value) =>
    Number.isFinite(value) ? value.toFixed(1) : "-";

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
            <th>Result</th>

            <th>Velo</th>
            <th>
              IVB <FaArrowsAltV />
            </th>
            <th>
              Horz. Break <FaArrowsAltH />
            </th>
            <th>Rel. X </th>
            <th>Rel. Z</th>
          </tr>
        </thead>
        <tbody>
          {filteredPitches.length === 0 ? (
            <tr>
              <td colSpan="11" className="text-center">
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
                <td className="text-center">
                  <a
                    href={`https://baseballsavant.mlb.com/sporty-videos?playId=${pitch.playId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {pitch.description}
                  </a>
                </td>
                <td className="text-center">
                  {formatOneDecimal(pitch.startSpeed)}
                </td>
                <td className="text-center">
                  {formatOneDecimal(pitch.inducedVerticalBreak)}"
                </td>
                <td className="text-center">
                  {formatOneDecimal(pitch.horizontalBreak)}"
                </td>
                <td className="text-center">{formatOneDecimal(pitch.relX)}</td>
                <td className="text-center">{formatOneDecimal(pitch.relZ)}</td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default PitchTable;
