import React, { useMemo } from "react";
import { Table } from "react-bootstrap";
import mlbTeams from "./mlbTeams.json";

const ChallengeTable = ({ challengeData }) => {
  const awayTeamAbb = challengeData?.teams?.away?.abbreviation ?? "";
  const homeTeamAbb = challengeData?.teams?.home?.abbreviation ?? "";

  const teamMap = useMemo(
    () => Object.fromEntries(mlbTeams.map((team) => [team.team_abbr, team])),
    []
  );

  const getTeamLogo = (teamAbbreviation) =>
    teamMap[teamAbbreviation]?.team_scoreboard_logo_espn ?? null;

  const TeamLogo = ({ teamAbbr }) => {
    const logo = getTeamLogo(teamAbbr);
    return logo ? (
      <img
        src={logo}
        alt={teamAbbr}
        style={{ width: "30px", height: "30px", marginRight: "10px" }}
      />
    ) : null;
  };

  return (
    <div>
      <Table striped bordered responsive className="text-center">
        <thead>
          <tr>
            <th>Type</th>
            <th>Team</th>
            <th>Successful ✅</th>
            <th>Failed ❌</th>
            <th>Remaining</th>
          </tr>
        </thead>
        <tbody>
          {[
            {
              type: "ABS Challenges",
              data: challengeData?.absChallenges,
            },
            {
              type: "Review Challenges",
              data: challengeData?.review,
            },
          ].map(({ type, data }) => (
            <React.Fragment key={type}>
              <tr>
                <td rowSpan="2">{type}</td>
                <td>
                  <TeamLogo teamAbbr={awayTeamAbb} />
                </td>
                <td>{data?.away?.usedSuccessful ?? "-"}</td>
                <td>{data?.away?.usedFailed ?? "-"}</td>
                <td>{data?.away?.remaining ?? "-"}</td>
              </tr>
              <tr>
                <td>
                  <TeamLogo teamAbbr={homeTeamAbb} />
                </td>
                <td>{data?.home?.usedSuccessful ?? "-"}</td>
                <td>{data?.home?.usedFailed ?? "-"}</td>
                <td>{data?.home?.remaining ?? "-"}</td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default ChallengeTable;
