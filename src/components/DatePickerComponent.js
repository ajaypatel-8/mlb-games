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
    <div className="d-flex justify-content-center mb-4 align-items-center datepicker-wrapper">
      <button onClick={goToPreviousDay}>
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

      <button onClick={goToNextDay}>
        <BsArrowRight size={20} />
      </button>
    </div>
  );
};

export default DatePickerComponent;
