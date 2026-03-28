import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BsArrowLeft, BsArrowRight } from "react-icons/bs";

const DatePickerComponent = ({ selectedDate, setSelectedDate }) => {
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const CustomInput = ({ value, onClick }) => (
    <button className="custom-datepicker-input" onClick={onClick}>
      <span>{value}</span>
    </button>
  );

  return (
    <div className="d-flex align-items-center datepicker-wrapper">
      <button
        onClick={goToPreviousDay}
        className="datepicker-arrow-button"
        aria-label="Previous day"
      >
        <BsArrowLeft size={20} />
      </button>
      <DatePicker
        selected={selectedDate}
        onChange={(date) => setSelectedDate(date)}
        showYearDropdown
        dateFormat="yyyy-MM-dd"
        scrollableYearDropdown
        yearDropdownItemNumber={15}
        customInput={<CustomInput />}
      />

      <button
        onClick={goToNextDay}
        className="datepicker-arrow-button"
        aria-label="Next day"
      >
        <BsArrowRight size={20} />
      </button>
    </div>
  );
};

export default DatePickerComponent;
