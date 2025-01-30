import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BsArrowLeft, BsArrowRight } from "react-icons/bs";

const DatePickerComponent = ({ selectedDate, setSelectedDate }) => {
  // Function to navigate to the previous day
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  // Function to navigate to the next day
  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  // Custom Input to style the DatePicker and center the text
  const CustomInput = ({ value, onClick }) => (
    <button className="custom-datepicker-input" onClick={onClick}>
      <span>{value}</span>
    </button>
  );

  return (
    <div className="d-flex justify-content-center mb-4 align-items-center">
      {/* Previous Day Arrow */}
      <button onClick={goToPreviousDay}>
        <BsArrowLeft size={20} />
      </button>

      {/* Date Picker Component with Custom Input */}
      <DatePicker
        selected={selectedDate}
        onChange={(date) => setSelectedDate(date)}
        dateFormat="yyyy-MM-dd"
        customInput={<CustomInput />}
      />

      {/* Next Day Arrow */}
      <button onClick={goToNextDay}>
        <BsArrowRight size={20} />
      </button>
    </div>
  );
};

export default DatePickerComponent;
