import React from "react";
import { DropdownButton, Dropdown } from "react-bootstrap";

const LineupDropdown = ({ team, players, toggleLineup, showLineup }) => {
  const getPlayerSavantLink = (id) => {
    return `https://baseballsavant.mlb.com/savant-player/${id}`;
  };

  return (
    <DropdownButton
      variant={team === "away" ? "outline-primary" : "outline-success"}
      id={`dropdown-${team}-lineup`}
      title={team === "away" ? team.teamName : team.teamName} // Display team name
      onClick={toggleLineup}
      className="mb-2"
      style={{ zIndex: 9999, position: "relative" }} // Add z-index and position
    >
      {players.length > 0 ? (
        players.map((player, index) => (
          <Dropdown.Item key={index}>
            <a
              href={getPlayerSavantLink(player.id)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {player.fullName} - {player.primaryPosition.abbreviation}
            </a>
          </Dropdown.Item>
        ))
      ) : (
        <Dropdown.Item disabled>No lineup available</Dropdown.Item>
      )}
    </DropdownButton>
  );
};

export default LineupDropdown;
