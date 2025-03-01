import React, { useEffect, useState } from "react";
import * as d3 from "d3";
import { Dropdown } from "react-bootstrap";

const RollingPlot = ({ pitchData, selectedPitcher }) => {
  const [selectedMetric, setSelectedMetric] = useState("startSpeed");

  const handleMetricChange = (metric) => {
    setSelectedMetric(metric);
  };

  useEffect(() => {
    if (!selectedPitcher || pitchData.length === 0) return;

    d3.select("#rolling-plot-container").selectAll("*").remove();

    const pitcherData = pitchData.filter(
      (pitch) => pitch.pitcherName === selectedPitcher
    );

    const pitchTypeIndexes = {};

    pitcherData.forEach((pitch, i) => {
      if (!pitchTypeIndexes[pitch.pitchType]) {
        pitchTypeIndexes[pitch.pitchType] = 0;
      }
      pitch.index = ++pitchTypeIndexes[pitch.pitchType];
    });

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3
      .select("#rolling-plot-container")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const y = d3
      .scaleLinear()
      .domain(
        selectedMetric === "extension" || "relX" || "relZ"
          ? [
              d3.min(pitcherData, (d) => d[selectedMetric]) - 0.1,
              d3.max(pitcherData, (d) => d[selectedMetric]) + 0.1,
            ]
          : [
              d3.min(pitcherData, (d) => d[selectedMetric]) - 5,
              d3.max(pitcherData, (d) => d[selectedMetric]) + 5,
            ]
      )
      .nice()
      .range([height, 0]);

    const tickFormat =
      selectedMetric === "extension" || "relX" || "relZ"
        ? d3.format(".1f")
        : d3.format(".0f");

    const yAxis = d3.axisLeft(y).ticks(5).tickFormat(tickFormat);

    svg
      .append("g")
      .call(yAxis)
      .append("text")
      .attr("x", -height / 2)
      .attr("y", -40)
      .attr("fill", "black")
      .attr("transform", "rotate(-90)")
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text(
        selectedMetric === "startSpeed"
          ? "Velocity (mph)"
          : selectedMetric === "inducedVerticalBreak"
          ? "Induced Vertical Break (in.)"
          : selectedMetric === "horizontalBreak"
          ? "Horizontal Break (in.)"
          : selectedMetric === "extension"
          ? "Extension (ft.)"
          : selectedMetric === "relX"
          ? "Release Point X (ft.)"
          : selectedMetric === "relZ"
          ? "Release Point Z (ft.)"
          : selectedMetric
      );

    const totalPitches = Math.max(
      ...Object.values(pitchTypeIndexes).map((count) => count)
    );

    const x = d3.scaleLinear().domain([1, totalPitches]).range([0, width]);

    const xAxis = d3.axisBottom(x).ticks(10);

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .append("text")
      .attr("x", width / 12)
      .attr("y", 35)
      .attr("fill", "black")
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text("Pitch Number");

    const pitchTypes = Array.from(new Set(pitcherData.map((d) => d.pitchType)));

    const colorScale = d3
      .scaleOrdinal()
      .domain(pitchTypes)
      .range(d3.schemeCategory10);

    pitchTypes.forEach((pitchType) => {
      const pitchTypeData = pitcherData.filter(
        (d) => d.pitchType === pitchType
      );

      const line = d3
        .line()
        .x((d) => x(d.index))
        .y((d) => y(d[selectedMetric]));

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
        .append("path")
        .datum(pitchTypeData)
        .attr("fill", "none")
        .attr("stroke", colorScale(pitchType))
        .attr("stroke-width", 2)
        .attr("d", line);

      svg
        .selectAll(`.point-${pitchType}`)
        .data(pitchTypeData)
        .enter()
        .append("circle")
        .attr("class", `point-${pitchType}`)
        .attr("cx", (d) => x(d.index))
        .attr("cy", (d) => y(d[selectedMetric]))
        .attr("r", 4)
        .style("fill", colorScale(pitchType))
        .attr("stroke", "black")
        .attr("stroke-width", 1)
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
        // Legend is positioned below the x-axis
        .attr("transform", `translate(170, ${height + 21})`);

      // Set the width for each legend item
      const legendItemWidth = 40;

      pitchTypes.forEach((pitchType, i) => {
        const legendItem = legendGroup
          .append("g")
          .attr("transform", `translate(${i * legendItemWidth}, 0)`);

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
    });
  }, [pitchData, selectedPitcher, selectedMetric]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Dropdown onSelect={handleMetricChange}>
        <Dropdown.Toggle
          variant="outline-secondary"
          id="dropdown-basic"
          size="sm"
        >
          {selectedMetric === "startSpeed"
            ? "Velocity"
            : selectedMetric === "inducedVerticalBreak"
            ? "IVB"
            : selectedMetric === "horizontalBreak"
            ? "Horz. Break"
            : selectedMetric === "extension"
            ? "Extension"
            : selectedMetric === "relX"
            ? "Rel. X"
            : selectedMetric === "relZ"
            ? "Rel. Z"
            : ""}
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <Dropdown.Item eventKey="startSpeed">Velocity</Dropdown.Item>
          <Dropdown.Item eventKey="inducedVerticalBreak">IVB</Dropdown.Item>
          <Dropdown.Item eventKey="horizontalBreak">Horz. Break</Dropdown.Item>
          <Dropdown.Item eventKey="extension">Extension</Dropdown.Item>
          <Dropdown.Item eventKey="relX">Rel. X</Dropdown.Item>
          <Dropdown.Item eventKey="relZ">Rel. Z</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
      <div
        style={{
          flex: 1,
          minHeight: "300px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "auto",
        }}
      >
        <div
          id="rolling-plot-container"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflowX: "auto",
          }}
        ></div>{" "}
      </div>
    </div>
  );
};

export default RollingPlot;
