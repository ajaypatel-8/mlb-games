import React from "react";
import { NavLink } from "react-router-dom";

const AppViewNav = () => {
  return (
    <div className="d-flex justify-content-center app-nav">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `app-nav-link ${isActive ? "app-nav-link-active" : ""}`
        }
      >
        Scores
      </NavLink>
      <NavLink
        to="/standings"
        className={({ isActive }) =>
          `app-nav-link ${isActive ? "app-nav-link-active" : ""}`
        }
      >
        Standings
      </NavLink>
    </div>
  );
};

export default AppViewNav;
