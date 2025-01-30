import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { mlbService } from "../services/mlbService";
import { Container, Row, Spinner } from "react-bootstrap";
import DatePickerComponent from "./DatePickerComponent";
import GameCard from "./GameCard";

const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSchedule = async (date) => {
    setLoading(true);
    setError(null);
    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const data = await mlbService.getSchedule(formattedDate, formattedDate, null);

      if (data?.dates?.length > 0) {
        setSchedule(data.dates);
      } else {
        setSchedule([]);
        setError("No games found for this date.");
      }
    } catch (err) {
      console.error("Error fetching schedule:", err);
      setError("Failed to load schedule.");
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule(selectedDate);
  }, [selectedDate]);

  return (
    <Container>
      <DatePickerComponent selectedDate={selectedDate} setSelectedDate={setSelectedDate} />

      {loading && <Spinner animation="border" className="d-block mx-auto" />}
      {error && <p className="text-danger text-center">{error}</p>}

      {schedule.length > 0 && !loading && !error ? (
        schedule.map((dateData) => (
          <div key={dateData.date} className="mb-4">
            <Row>
              {dateData.games.map((game) => (
                <GameCard key={game.gamePk} game={game} />
              ))}
            </Row>
          </div>
        ))
      ) : (
        !loading && !error && <p className="text-center">No games scheduled for this date.</p>
      )}
    </Container>
  );
};

export default Schedule;
