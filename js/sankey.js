function drawSankey(svg, highlight = false) {
  svg.selectAll("*").remove();

  const data = {
    nodes: [
      { name: "City Hotel" },
      { name: "Resort Hotel" },
      { name: "Check-Out" },
      { name: "Canceled" }
    ],
    links: [
      { source: 0, target: 2, value: 48000 },
      { source: 0, target: 3, value: 30000 },
      { source: 1, target: 2, value: 27000 },
      { source: 1, target: 3, value: 12000 }
    ]
  };

  const sankey = d3.sankey()
    .nodeWidth(20)
    .nodePadding(30)
    .extent([[80, 60], [720, 380]]);

  const graph = sankey(data);

  svg.append("g")
    .selectAll("rect")
    .data(graph.nodes)
    .enter()
    .append("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("fill", "#69b3a2");

  svg.append("g")
    .selectAll("path")
    .data(graph.links)
    .enter()
    .append("path")
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("stroke", d =>
      highlight && d.target.name === "Canceled" ? "red" : "#999"
    )
    .attr("stroke-width", d => d.width)
    .attr("fill", "none")
    .attr("opacity", highlight ? 0.9 : 0.5);

  svg.append("g")
    .selectAll("text")
    .data(graph.nodes)
    .enter()
    .append("text")
    .attr("x", d => d.x0 - 6)
    .attr("y", d => (d.y0 + d.y1) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "end")
    .text(d => d.name);
}

