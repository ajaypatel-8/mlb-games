import React from "react";
import Schedule from "./components/Schedule";
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTwitter, faGithub } from "@fortawesome/free-brands-svg-icons";
import { faLink } from "@fortawesome/free-solid-svg-icons";

const App = () => {
  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center my-4">
        <img
          src="https://www.mlbstatic.com/team-logos/league-on-dark/1.svg"
          alt="MLB Logo"
          style={{ width: "120px", height: "auto" }}
        />
        <h1 className="text-center flex-grow-1">MLB Scoressss</h1>
        <div className="d-flex align-items-center">
          <a
            href="https://x.com/ajaypatel8_"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-2"
          >
            <FontAwesomeIcon icon={faTwitter} size="lg" />
          </a>
          <a
            href="https://github.com/ajaypatel-8"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-2"
          >
            <FontAwesomeIcon icon={faGithub} size="lg" />
          </a>
          <a
            href="https://ajaypatel-8.github.io"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-2"
          >
            <FontAwesomeIcon icon={faLink} size="lg" />
          </a>
        </div>
      </div>
      <h5 className="text-center smaller-text">
        All Data Courtesy Of MLB Advanced Media. By Ajay Patel
      </h5>
      <Schedule />
    </div>
  );
};

export default App;
