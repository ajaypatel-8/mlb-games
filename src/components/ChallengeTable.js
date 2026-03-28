import React, { useMemo } from "react";
import { Card, Col, Row, Table } from "react-bootstrap";
import mlbTeams from "./mlbTeams.json";

const TeamLogo = React.memo(function TeamLogo({
  logoUrl,
  altText,
  size = 28,
}) {
  if (!logoUrl) return null;

  return (
    <img
      src={logoUrl}
      alt={altText}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
});

const PlayerHeadshot = React.memo(function PlayerHeadshot({
  playerId,
  playerName,
  size = 36,
}) {
  if (!playerId) return null;

  return (
    <img
      src={`https://img.mlbstatic.com/mlb-photos/image/upload/w_180,d_people:generic:headshot:silo:current.png,q_auto:best,f_auto/v1/people/${playerId}/headshot/silo/current`}
      alt={playerName}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        objectFit: "cover",
      }}
    />
  );
});

const formatPlayerName = (name) => {
  if (!name) return "Player unavailable";

  const parts = name.split(" ");
  return parts.length > 1
    ? `${parts[0][0]}. ${parts.slice(1).join(" ")}`
    : name;
};

const SummaryCard = ({ title, rows, columns, subtitle }) => {
  return (
    <Card className="shadow-sm border-0 h-100">
      <Card.Body>
        <div className="mb-3">
          <div>
            <h6 className="mb-1">{title}</h6>
            <div className="text-muted" style={{ fontSize: "0.85rem" }}>
              {subtitle}
            </div>
          </div>
        </div>

        <Table responsive bordered hover className="mb-0 align-middle text-center">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.teamId}>
                {columns.map((column) => (
                  <td key={`${row.teamId}-${column.key}`}>
                    {row[column.key] ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

const ChallengeTable = ({ challengeData, selectedTeam }) => {
  const teamMap = useMemo(
    () => Object.fromEntries(mlbTeams.map((team) => [team.team_id_num, team])),
    []
  );

  const teams = challengeData?.teams || {};
  const events = challengeData?.events || [];

  const getTeamPresentation = (teamId, fallbackTeam) => {
    const teamMeta = teamMap[teamId] || null;
    const fallbackAbbreviation = fallbackTeam?.abbreviation ?? "";

    return {
      teamId: teamId ?? fallbackAbbreviation,
      teamName: fallbackTeam?.name || teamMeta?.team_name || fallbackAbbreviation,
      abbreviation: fallbackAbbreviation || teamMeta?.team_abbr || "",
      logoUrl:
        teamMeta?.team_scoreboard_logo_espn ||
        (fallbackAbbreviation
          ? mlbTeams.find((team) => team.team_abbr === fallbackAbbreviation)
              ?.team_scoreboard_logo_espn
          : null) ||
        null,
    };
  };

  const awayTeam = getTeamPresentation(teams?.away?.id, teams?.away);
  const homeTeam = getTeamPresentation(teams?.home?.id, teams?.home);
  const selectedTeamId = selectedTeam?.id;
  const selectedTeamPresentation =
    selectedTeamId === awayTeam.teamId ? awayTeam : homeTeam;

  const absTeamData =
    selectedTeamId === teams?.away?.id
      ? challengeData?.absChallenges?.away
      : challengeData?.absChallenges?.home;

  const reviewTeamData =
    selectedTeamId === teams?.away?.id
      ? challengeData?.review?.away
      : challengeData?.review?.home;

  const absRows = [
    {
      ...selectedTeamPresentation,
      successful: absTeamData?.usedSuccessful ?? 0,
      failed: absTeamData?.usedFailed ?? 0,
      remaining: absTeamData?.remaining ?? "-",
    },
  ];

  const reviewRows = [
    {
      ...selectedTeamPresentation,
      used: reviewTeamData?.used ?? 0,
      remaining: reviewTeamData?.remaining ?? "-",
    },
  ];

  const eventRows = events.map((event, index) => {
    const team = getTeamPresentation(
      event.challengeTeamId,
      event.challengeTeamId === teams?.away?.id ? teams?.away : teams?.home
    );

    return {
      ...event,
      key: `${event.playId}-${index}`,
      team,
    };
  }).filter((event) => event.challengeTeamId === selectedTeamId);

  const formatInning = (event) => {
    if (!event.inning) return "-";
    const half = event.inningHalf
      ? `${event.inningHalf.slice(0, 1).toUpperCase()}${event.inningHalf.slice(1, 3).toLowerCase()}`
      : "";
    return half ? `${half} ${event.inning}` : `${event.inning}`;
  };

  const formatCount = (event) => {
    const balls = event.count?.balls;
    const strikes = event.count?.strikes;

    if (
      typeof balls !== "number" &&
      typeof strikes !== "number"
    ) {
      return "-";
    }

    let displayBalls = balls;
    let displayStrikes = strikes;

    if (typeof balls === "number" && typeof strikes === "number") {
      if (event.challengePitchCode === "B" && balls > 0) {
        displayBalls = balls - 1;
      } else if (event.challengePitchCode === "C" && strikes > 0) {
        displayStrikes = strikes - 1;
      }
    }

    const pitchCount =
      typeof displayBalls === "number" && typeof displayStrikes === "number"
        ? `${displayBalls}-${displayStrikes}`
        : "-";

    return pitchCount;
  };

  const getDecisionLabel = (event) => {
    if (event.inProgress) return "In Progress";
    return event.isOverturned ? "Overturned" : "Confirmed";
  };

  const getInitialCall = (event) => {
    if (!event.challengePitchCode && !event.challengePitchDescription) return "-";

    if (
      event.challengePitchCode === "B" ||
      event.challengePitchDescription === "Ball"
    ) {
      return "Ball";
    }

    if (
      event.challengePitchCode === "C" ||
      event.challengePitchDescription === "Called Strike"
    ) {
      return "Strike";
    }

    return event.challengePitchDescription || "-";
  };

  const getFinalCall = (event) => {
    const initialCall = getInitialCall(event);
    if (initialCall === "-") return "-";

    if (!event.isOverturned) return initialCall;

    if (initialCall === "Ball") return "Strike";
    if (initialCall === "Strike") return "Ball";

    return initialCall;
  };

  const getChallengerRoleLabel = (event) => {
    const positionType = event.challengerPosition?.type;
    const positionName = event.challengerPosition?.name;

    if (positionType === "Pitcher" || positionName === "Pitcher") {
      return "Pitcher";
    }

    if (positionType === "Catcher" || positionName === "Catcher") {
      return "Catcher";
    }

    return "Batter";
  };

  const getOutcomeSummary = (event) => {
    if (!event.description) return "-";

    const separatorIndex = event.description.indexOf(":");
    if (separatorIndex >= 0) {
      return event.description.slice(separatorIndex + 1).trim();
    }

    return event.description;
  };

  const getPlayerSavantLink = (playerId) =>
    `https://baseballsavant.mlb.com/savant-player/${playerId}`;

  return (
    <div>
      <Row className="g-3 mb-4">
        <Col md={6}>
          <SummaryCard
            title="ABS Challenges"
            rows={absRows}
            columns={[
              { key: "successful", label: "Successful ✅" },
              { key: "failed", label: "Failed ❌" },
              { key: "remaining", label: "Remaining" },
            ]}
            subtitle="ABS challenge totals for this team"
          />
        </Col>
        <Col md={6}>
          <SummaryCard
            title="Review Challenges"
            rows={reviewRows}
            columns={[
              { key: "used", label: "Used" },
              { key: "remaining", label: "Remaining" },
            ]}
            subtitle="Review challenge totals for this team"
          />
        </Col>
      </Row>

      <div style={{ width: "100%" }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">Challenge Log</h6>
          <div
            className="text-muted"
            style={{ fontSize: "0.85rem", fontWeight: 600 }}
          >
            {eventRows.length} event{eventRows.length === 1 ? "" : "s"}
          </div>
        </div>

        {eventRows.length === 0 ? (
          <div className="text-muted">No detailed challenge events available for this game.</div>
        ) : (
            <Table
              responsive
              bordered
              hover
              className="mb-0 align-middle w-100 text-center"
            >
              <thead>
              <tr className="text-center">
                <th style={{ whiteSpace: "nowrap" }}>Type</th>
                <th style={{ whiteSpace: "nowrap" }}>Challenger</th>
                <th style={{ whiteSpace: "nowrap" }}>Inning</th>
                <th style={{ whiteSpace: "nowrap" }}>Count</th>
                <th style={{ whiteSpace: "nowrap" }}>Init. Call</th>
                <th style={{ whiteSpace: "nowrap" }}>Final Call</th>
                <th style={{ whiteSpace: "nowrap" }}>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {eventRows.map((event) => (
                <tr key={event.key}>
                  <td className="text-center" style={{ fontWeight: 600 }}>
                    {event.type === "ABS Challenge" ? "ABS" : "Review"}
                  </td>
                  <td className="text-center">
                    {event.type === "ABS Challenge" && event.challenger?.id ? (
                      <div
                        className="d-flex align-items-center justify-content-center gap-2"
                        style={{ flexWrap: "nowrap", whiteSpace: "nowrap" }}
                      >
                        <a
                          href={getPlayerSavantLink(event.challenger.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <PlayerHeadshot
                            playerId={event.challenger.id}
                            playerName={event.challenger.fullName}
                            size={32}
                          />
                        </a>
                        <div>
                          <div style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                            <a
                              href={getPlayerSavantLink(event.challenger.id)}
                              target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "inherit", textDecoration: "none" }}
                              >
                              {formatPlayerName(event.challenger.fullName)}
                            </a>
                          </div>
                          <div
                            className="text-muted"
                            style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}
                          >
                            {getChallengerRoleLabel(event)}
                          </div>
                        </div>
                      </div>
                      ) : (
                        <div className="d-flex align-items-center justify-content-center gap-2">
                          <TeamLogo
                            logoUrl={event.team.logoUrl}
                            altText={event.team.teamName}
                          size={24}
                        />
                        <span style={{ fontWeight: 600 }}>{event.team.teamName}</span>
                      </div>
                    )}
                  </td>
                  <td className="text-center">{formatInning(event)}</td>
                  <td className="text-center">{formatCount(event)}</td>
                  <td
                    className="text-center"
                    style={event.isOverturned ? { color: "#6c757d" } : undefined}
                  >
                    {getInitialCall(event)}
                  </td>
                  <td className="text-center">{getFinalCall(event)}</td>
                  <td className="text-center">
                    <div style={{ fontWeight: 600 }}>{getDecisionLabel(event)}</div>
                    <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                      {getOutcomeSummary(event)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default ChallengeTable;
