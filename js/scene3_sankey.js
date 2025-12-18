function drawScene3() {
  const svg = d3.select("#vis");
  svg.selectAll("*").remove();

  d3.json("data/cancellations_sankey.json").then(data => {

    const sankey = d3.sankey()
      .nodeWidth(20)
      .nodePadding(30)
      .extent([[50, 50], [750, 400]]);

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
      .attr("stroke", "#999")
      .attr("stroke-width", d => d.width)
      .attr("fill", "none")
      .attr("opacity", 0.6);

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
  });
}

