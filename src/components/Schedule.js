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
      const formattedDate = format(date, "yyyy-MM-dd"); // Format date for API
      console.log(`Fetching schedule for date: ${formattedDate}`);  // Debug log

      const data = await mlbService.getSchedule(formattedDate, formattedDate, null);

      // Log response for debugging
      console.log("API response:", data);

      if (data && data.dates && data.dates.length > 0) {
        setSchedule(data.dates);
      } else {
        setError("No games found for this date.");
      }
    } catch (err) {
      console.error("Error fetching schedule:", err); // More detailed error logging
      setError("Failed to load schedule.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule(selectedDate);
  }, [selectedDate]);

  return (
    <Container>
      {/* Date Picker */}
      <DatePickerComponent selectedDate={selectedDate} setSelectedDate={setSelectedDate} />

      {loading && <Spinner animation="border" className="d-block mx-auto" />}
      {error && <p className="text-danger text-center">{error}</p>}

      {schedule.map((dateData) => (
        <div key={dateData.date} className="mb-4">
          <Row>
            {dateData.games.map((game) => (
              <GameCard key={game.gamePk} game={game} />
            ))}
          </Row>
        </div>
      ))}
    </Container>
  );
};

export default Schedule;
