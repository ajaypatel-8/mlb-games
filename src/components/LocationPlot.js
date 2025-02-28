import React, { useEffect } from "react";
import * as d3 from "d3";

const LocationPlot = ({ pitchData, selectedPitcher, pitchers }) => {
  useEffect(() => {
    if (!selectedPitcher || pitchData.length === 0) return;

    d3.select("#location-plot-container").selectAll("*").remove();

    const pitcherData = pitchData.filter(
      (pitch) => pitch.pitcherName === selectedPitcher
    );

    const margin = { top: 20, right: 60, bottom: 60, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const svg = d3
      .select("#location-plot-container")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([-2, 2]).range([0, width]);
    const y = d3.scaleLinear().domain([0, 5]).range([height, 0]);

    // Removed axes (comment or delete these lines):
    // svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
    // svg.append("g").call(d3.axisLeft(y));

    // Strike zone boundaries
    const strikeZoneTop = 3.5;
    const strikeZoneBottom = 1.5;
    const strikeZoneLeft = -0.83;
    const strikeZoneRight = 0.83;

    svg
      .append("rect")
      .attr("x", x(strikeZoneLeft))
      .attr("y", y(strikeZoneTop))
      .attr("width", x(strikeZoneRight) - x(strikeZoneLeft))
      .attr("height", y(strikeZoneBottom) - y(strikeZoneTop))
      .style("fill", "none")
      .style("stroke", "black")
      .style("stroke-width", 2);

    // Calculate points to draw the subzones from
    const x1 = strikeZoneLeft + (strikeZoneRight - strikeZoneLeft) / 3;
    const x2 = strikeZoneLeft + (strikeZoneRight - strikeZoneLeft) * (2 / 3);
    const y1 = strikeZoneTop - (strikeZoneTop - strikeZoneBottom) / 3;
    const y2 = strikeZoneTop - (strikeZoneTop - strikeZoneBottom) * (2 / 3);

    // Vertical lines to divide the zone
    svg
      .append("line")
      .attr("x1", x(x1))
      .attr("x2", x(x1))
      .attr("y1", y(strikeZoneTop))
      .attr("y2", y(strikeZoneBottom))
      .style("stroke", "black")
      .style("stroke-width", 1)
      .style("stroke-dasharray", "4,4")
      .style("opacity", 0.3);

    svg
      .append("line")
      .attr("x1", x(x2))
      .attr("x2", x(x2))
      .attr("y1", y(strikeZoneTop))
      .attr("y2", y(strikeZoneBottom))
      .style("stroke", "black")
      .style("stroke-width", 1)
      .style("stroke-dasharray", "4,4")
      .style("opacity", 0.3);

    // Horizontal lines to divide the zone
    svg
      .append("line")
      .attr("x1", x(strikeZoneLeft))
      .attr("x2", x(strikeZoneRight))
      .attr("y1", y(y1))
      .attr("y2", y(y1))
      .style("stroke", "black")
      .style("stroke-width", 1)
      .style("stroke-dasharray", "4,4")
      .style("opacity", 0.3);

    svg
      .append("line")
      .attr("x1", x(strikeZoneLeft))
      .attr("x2", x(strikeZoneRight))
      .attr("y1", y(y2))
      .attr("y2", y(y2))
      .style("stroke", "black")
      .style("stroke-width", 1)
      .style("stroke-dasharray", "4,4")
      .style("opacity", 0.3);

    const pitchTypes = Array.from(new Set(pitcherData.map((d) => d.pitchType)));
    const colorScale = d3
      .scaleOrdinal()
      .domain(pitchTypes)
      .range(d3.schemeCategory10);

    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("background", "white")
      .style("border", "1px solid black")
      .style("padding", "5px")
      .style("border-radius", "5px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("display", "none")
      .style("z-index", "100001");

    svg
      .append("g")
      .selectAll("circle")
      .data(pitcherData)
      .join("circle")
      .attr("cx", (d) => x(d.plateX))
      .attr("cy", (d) => y(d.plateZ))
      .attr("r", 5)
      .style("fill", (d) => colorScale(d.pitchType))
      .style("opacity", 0.8)
      .style("stroke", "black")
      .style("stroke-width", 0.5)
      .on("mouseover", function (event, d) {
        d3.select(this).style("stroke-width", 2).style("stroke", "black");
        tooltip.style("display", "block").html(
          `Pitch Type: <strong>${d.pitchType}</strong><br>
                    Outcome: ${d.description}<br>
                    Velo: ${d.startSpeed.toFixed(1)}<br>
                    Horz Break: ${d.horizontalBreak.toFixed(1)}"<br>
                    IVB: ${d.inducedVerticalBreak.toFixed(1)}"`
        );
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 20 + "px");
      })
      .on("mouseout", function () {
        d3.select(this).style("stroke-width", 0.5).style("stroke", "black");

        tooltip.style("display", "none");
      });

    const legendGroup = svg
      .append("g")
      .attr("transform", `translate(${width - 20}, 10)`);

    pitchTypes.forEach((pitchType, i) => {
      const legendItem = legendGroup
        .append("g")
        .attr("transform", `translate(0, ${i * 20})`);

      legendItem
        .append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .style("fill", colorScale(pitchType))
        .style("stroke", "black");

      legendItem
        .append("text")
        .attr("x", 20)
        .attr("y", 8)
        .style("font-size", "12px")
        .style("alignment-baseline", "middle")
        .text(pitchType);
    });

    svg
      .append("text")
      .attr("x", width - 20)
      .attr("y", height + 45)
      .style("font-size", "12px")
      .style("text-anchor", "start")
      .style("font-weight", "bold")
      .text("Lefty Box");

    svg
      .append("text")
      .attr("x", 30)
      .attr("y", height + 45)
      .style("font-size", "12px")
      .style("text-anchor", "end")
      .style("font-weight", "bold")
      .text("Righty Box");

    const homePlatePoints = [
      [x(0), y(0.1)],
      [x(-0.707), y(0.5)],
      [x(-0.6), y(0.7)],
      [x(0.6), y(0.7)],
      [x(0.707), y(0.5)],
      [x(0), y(0.1)],
    ]
      .map((d) => d.join(","))
      .join(" ");

    svg
      .append("polygon")
      .attr("points", homePlatePoints)
      .style("fill", "white")
      .style("stroke", "black")
      .style("stroke-width", 2);
  }, [pitchData, selectedPitcher]);

  return (
    <div
      id="location-plot-container"
      style={{ width: "100%", height: "600px", marginTop: "20px" }}
    ></div>
  );
};

export default LocationPlot;
