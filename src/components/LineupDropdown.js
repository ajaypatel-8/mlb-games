import React from "react";
import { DropdownButton, Dropdown } from "react-bootstrap";

const LineupDropdown = ({ team, players, toggleLineup, showLineup }) => {
  const getPlayerSavantLink = (id) => {
    return `https://baseballsavant.mlb.com/savant-player/${id}`;
  };

  // Ensure players is an array and sort them based on battingOrder
  const sortedPlayers = Array.isArray(players)
    ? players
        .map((player) => ({
          ...player,
          battingOrder: parseInt(player.battingOrder, 10), // Ensure it's an integer
        }))
        .sort((a, b) => a.battingOrder - b.battingOrder) // Sort by batting order
    : [];

  return (
    <DropdownButton
      variant={team === "away" ? "outline-primary" : "outline-success"}
      id={`dropdown-${team}-lineup`}
      title={`${team.teamName}`} // Display team name with 'Lineup'
      onClick={toggleLineup}
      className="mb-2"
      style={{ zIndex: 9999, position: "relative" }} // Add z-index and position
    >
      {showLineup && sortedPlayers.length > 0 ? (
        sortedPlayers.map((player) => (
          <Dropdown.Item
            key={player.person.id}
            as="button" // Make this a button to directly handle click
            onClick={() =>
              window.open(getPlayerSavantLink(player.person.id), "_blank")
            } // Open Savant link on click
          >
            <strong>{player.person.fullName}</strong> -{" "}
            {player.position.abbreviation}
            <br />
            <small>
              {player.position.code === "P"
                ? player.stats.pitching?.summary
                : player.stats.batting?.summary}{" "}
            </small>
          </Dropdown.Item>
        ))
      ) : (
        <Dropdown.Item disabled>No lineup available</Dropdown.Item>
      )}
    </DropdownButton>
  );
};

export default LineupDropdown;
