import React, { useEffect } from "react";
import * as d3 from "d3";

const MovementPlot = ({ pitchData, selectedPitcher, pitchers }) => {
  useEffect(() => {
    if (
      selectedPitcher &&
      pitchData.some((data) =>
        pitchers.some((pitcher) => pitcher.person.id === data.pitcherId)
      )
    ) {
      d3.select("#movement-plot-container").selectAll("*").remove();

      const pitcherName =
        selectedPitcher ??
        pitchData.find((data) =>
          pitchers.some((pitcher) => pitcher.person.id === data.pitcherId)
        )?.pitcherName;

      if (!pitcherName) return;

      const pitcherData = pitchData.filter(
        (pitch) => pitch.pitcherName === pitcherName
      );

      const margin = { top: 20, right: 60, bottom: 60, left: 60 };
      const width = 500 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      const svg = d3
        .select("#movement-plot-container")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3.scaleLinear().domain([-25, 25]).range([0, width]);
      const y = d3.scaleLinear().domain([-25, 25]).range([height, 0]);

      svg
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5));
      svg.append("g").attr("class", "y-axis").call(d3.axisLeft(y).ticks(5));

      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height + 50)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Horizontal Break (inches)");

      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Induced Vertical Break (inches)");

      svg
        .append("line")
        .attr("x1", x(0))
        .attr("x2", x(0))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "#bbb")
        .attr("stroke-dasharray", "5,5");

      svg
        .append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", y(0))
        .attr("y2", y(0))
        .attr("stroke", "#bbb")
        .attr("stroke-dasharray", "5,5");

      const circleRadii = [1, 2, 3];
      const pixelPerInch = 52;

      circleRadii.forEach((r) => {
        svg
          .append("circle")
          .attr("cx", x(0))
          .attr("cy", y(0))
          .attr("r", r * pixelPerInch)
          .attr("fill", "none")
          .attr("stroke", "#bbb")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "4,4");
      });

      const pitchTypes = Array.from(
        new Set(pitcherData.map((d) => d.pitchType))
      );
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
        .attr("cx", (d) => x(d.horizontalBreak))
        .attr("cy", (d) => y(d.inducedVerticalBreak))
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
          .attr("y", 12)
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
        .text("R Arm Side ->");

      svg
        .append("text")
        .attr("x", 8)
        .attr("y", height + 45)
        .style("font-size", "12px")
        .style("text-anchor", "end")
        .style("font-weight", "bold")
        .text("<- L Arm Side");
    }
    // eslint-disable-next-line
  }, [pitchData, selectedPitcher]);

  return (
    <div
      id="movement-plot-container"
      style={{ width: "100%", height: "400px", marginTop: "20px" }}
    ></div>
  );
};

export default MovementPlot;
