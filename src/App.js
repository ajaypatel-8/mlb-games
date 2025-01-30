import React from "react";
import Schedule from "./components/Schedule";
import "bootstrap/dist/css/bootstrap.min.css";

const App = () => {
  return (
    <div className="container">
      <h1 className="text-center my-4">MLB Games</h1>
      <Schedule />
    </div>
  )
};

export default App;
