import React, { useMemo } from "react";
import { Table } from "react-bootstrap";
import mlbTeams from "./mlbTeams.json";

const TeamLogo = React.memo(function TeamLogo({ logoUrl, altText }) {
  if (!logoUrl) return null;
  return (
    <img
      src={logoUrl}
      alt={altText}
      style={{ width: "30px", height: "30px", marginRight: "10px" }}
    />
  );
});

const ChallengeTable = ({ challengeData }) => {
  const awayTeamAbb = challengeData?.teams?.away?.abbreviation ?? "";
  const homeTeamAbb = challengeData?.teams?.home?.abbreviation ?? "";

  const teamMap = useMemo(
    () => Object.fromEntries(mlbTeams.map((team) => [team.team_abbr, team])),
    []
  );

  const awayLogo = teamMap[awayTeamAbb]?.team_scoreboard_logo_espn ?? null;
  const homeLogo = teamMap[homeTeamAbb]?.team_scoreboard_logo_espn ?? null;

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
                  <TeamLogo logoUrl={awayLogo} altText={awayTeamAbb} />
                </td>
                <td>{data?.away?.usedSuccessful ?? "-"}</td>
                <td>{data?.away?.usedFailed ?? "-"}</td>
                <td>{data?.away?.remaining ?? "-"}</td>
              </tr>
              <tr>
                <td>
                  <TeamLogo logoUrl={homeLogo} altText={homeTeamAbb} />
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
