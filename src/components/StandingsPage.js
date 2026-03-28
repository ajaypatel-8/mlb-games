import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Col, Container, Form, Row, Spinner, Table } from "react-bootstrap";
import { mlbService } from "../services/mlbService";
import AppViewNav from "./AppViewNav";
import mlbTeams from "./mlbTeams.json";

const DIVISION_ORDER = [
  { id: 201, label: "AL East", league: "American League" },
  { id: 202, label: "AL Central", league: "American League" },
  { id: 200, label: "AL West", league: "American League" },
  { id: 204, label: "NL East", league: "National League" },
  { id: 205, label: "NL Central", league: "National League" },
  { id: 203, label: "NL West", league: "National League" },
];

const SEASON_START_YEAR = 2000;

const StandingsPage = () => {
  const currentSeason = new Date().getFullYear();
  const [selectedSeason, setSelectedSeason] = useState(currentSeason);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const teamMap = useMemo(
    () => Object.fromEntries(mlbTeams.map((team) => [team.team_id_num, team])),
    []
  );

  const divisionMap = useMemo(
    () => Object.fromEntries(DIVISION_ORDER.map((division) => [division.id, division])),
    []
  );

  const seasonOptions = useMemo(
    () =>
      Array.from(
        { length: currentSeason - SEASON_START_YEAR + 1 },
        (_, index) => currentSeason - index
      ),
    [currentSeason]
  );

  const fetchStandings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await mlbService.getStandings(selectedSeason);
      setStandings(data?.records || []);
    } catch (err) {
      console.error("Error fetching standings:", err);
      setError("Failed to load standings.");
      setStandings([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSeason]);

  useEffect(() => {
    fetchStandings();
  }, [fetchStandings]);

  const groupedStandings = useMemo(() => {
    const groups = standings
      .map((record) => {
        const divisionId = record?.division?.id;
        const divisionMeta = divisionMap[divisionId];

        if (!divisionMeta) return null;

        return {
          ...divisionMeta,
          teams: (record?.teamRecords || []).map((teamRecord) => {
            const teamMeta = teamMap[teamRecord?.team?.id];

            return {
              id: teamRecord?.team?.id,
              name: teamMeta?.team_name || teamRecord?.team?.name,
              abbreviation: teamRecord?.team?.abbreviation,
              logo: teamMeta?.team_scoreboard_logo_espn || null,
              wins: teamRecord?.wins ?? 0,
              losses: teamRecord?.losses ?? 0,
              pct: teamRecord?.winningPercentage ?? "-",
              gamesBack: teamRecord?.divisionGamesBack ?? teamRecord?.gamesBack ?? "-",
              streak: teamRecord?.streak?.streakCode ?? "-",
              divisionRank: teamRecord?.divisionRank ?? "-",
              runDifferential: teamRecord?.runDifferential ?? "-",
            };
          }),
        };
      })
      .filter(Boolean);

    return DIVISION_ORDER.map(
      (division) => groups.find((group) => group.id === division.id) || { ...division, teams: [] }
    );
  }, [standings, divisionMap, teamMap]);

  const americanLeagueStandings = groupedStandings.filter(
    (division) => division.league === "American League"
  );

  const nationalLeagueStandings = groupedStandings.filter(
    (division) => division.league === "National League"
  );

  const getRunDifferentialClassName = (runDifferential) => {
    const numericValue = Number(runDifferential);

    if (Number.isNaN(numericValue)) {
      return "";
    }

    if (numericValue > 0) {
      return "standings-run-differential-positive";
    }

    if (numericValue < 0) {
      return "standings-run-differential-negative";
    }

    return "";
  };

  return (
    <Container fluid className="standings-page">
      <div className="standings-toolbar mb-4">
        <AppViewNav />
        <div className="standings-toolbar-season">
          <Form.Select
            aria-label="Select standings season"
            className="standings-season-select"
            value={selectedSeason}
            onChange={(event) => setSelectedSeason(Number(event.target.value))}
          >
            {seasonOptions.map((season) => (
              <option key={season} value={season}>
                {season}
              </option>
            ))}
          </Form.Select>
          <span className="text-muted standings-season-label">Regular Season</span>
        </div>
      </div>

      {loading && <Spinner animation="border" className="d-block mx-auto" />}
      {error && !loading && <p className="text-danger text-center">{error}</p>}

      {!loading && !error && (
        <Row className="g-4">
          {[
            {
              league: "American League",
              divisions: americanLeagueStandings,
            },
            {
              league: "National League",
              divisions: nationalLeagueStandings,
            },
          ].map((leagueGroup) => (
            <Col xl={6} key={leagueGroup.league}>
              <div className="standings-league-column">
                <div className="mb-3 standings-league-header">
                  <h3 className="mb-0">{leagueGroup.league}</h3>
                </div>

                <div className="d-flex flex-column gap-4">
                  {leagueGroup.divisions.map((division) => (
                    <Card className="shadow-sm border-0 standings-card" key={division.id}>
                      <Card.Body>
                        <div className="mb-3">
                          <h4 className="mb-1">{division.label}</h4>
                        </div>

                        <Table responsive bordered hover className="mb-0 align-middle standings-table">
                          <thead>
                            <tr className="text-center">
                              <th className="text-start">Team</th>
                              <th>W</th>
                              <th>L</th>
                              <th>PCT</th>
                              <th>GB</th>
                              <th>STRK</th>
                              <th>RD</th>
                            </tr>
                          </thead>
                          <tbody>
                            {division.teams.length === 0 ? (
                              <tr>
                                <td colSpan="7" className="text-center text-muted">
                                  No standings available yet.
                                </td>
                              </tr>
                            ) : (
                              division.teams.map((team) => (
                                <tr key={team.id}>
                                  <td>
                                    <div className="d-flex align-items-center gap-2 standings-team-cell">
                                      {team.logo && (
                                        <img
                                          src={team.logo}
                                          alt={team.name}
                                          style={{ width: "24px", height: "24px" }}
                                        />
                                      )}
                                      <span>{team.name}</span>
                                    </div>
                                  </td>
                                  <td className="text-center">{team.wins}</td>
                                  <td className="text-center">{team.losses}</td>
                                  <td className="text-center">{team.pct}</td>
                                  <td className="text-center">{team.gamesBack}</td>
                                  <td className="text-center">{team.streak}</td>
                                  <td
                                    className={`text-center ${getRunDifferentialClassName(
                                      team.runDifferential
                                    )}`}
                                  >
                                    {team.runDifferential}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default StandingsPage;
