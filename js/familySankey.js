function drawFamilySankey(svg) {

  svg.selectAll("*").interrupt().remove();

  const width = 800;
  const height = 450;

  d3.csv("hotel_bookings.csv").then(raw => {

    const data = raw.map(d => ({
      family:
        (+d.Children > 0 || +d.Babies > 0) ? "Amb infants" : "Sense infants",
      hotel: d.hotel,
      canceled: +d.is_canceled === 1 ? "Cancel·lada" : "No cancel·lada"
    }));

    const nodes = [
      { name: "Amb infants", category: "family" },
      { name: "Sense infants", category: "family" },
      { name: "City Hotel", category: "hotel" },
      { name: "Resort Hotel", category: "hotel" },
      { name: "Cancel·lada", category: "status" },
      { name: "No cancel·lada", category: "status" }
    ];

    const nodeIndex = new Map(nodes.map((d, i) => [d.name, i]));

    const links = [];

    function addLink(source, target, value) {
      links.push({
        source: nodeIndex.get(source),
        target: nodeIndex.get(target),
        value
      });
    }

    // Family - Hotel
    d3.rollups(
      data,
      v => v.length,
      d => d.family,
      d => d.hotel
    ).forEach(([family, hotels]) => {
      hotels.forEach(([hotel, count]) => {
        addLink(family, hotel, count);
      });
    });

    // Hotel - Cancel·lació
    d3.rollups(
      data,
      v => v.length,
      d => d.hotel,
      d => d.canceled
    ).forEach(([hotel, statuses]) => {
      statuses.forEach(([status, count]) => {
        addLink(hotel, status, count);
      });
    });

    const sankey = d3.sankey()
      .nodeWidth(18)
      .nodePadding(14)
      .extent([[1, 40], [width - 1, height - 10]]);

    const { nodes: sankeyNodes, links: sankeyLinks } =
      sankey({
        nodes: nodes.map(d => ({ ...d })),
        links: links.map(d => ({ ...d }))
      });

    const color = d3.scaleOrdinal()
      .domain(["family", "hotel", "status"])
      .range(["#72B7B2", "#4C78A8", "#E45756"]);

    svg.append("g")
      .attr("fill", "none")
      .attr("stroke-opacity", 0.4)
      .selectAll("path")
      .data(sankeyLinks)
      .enter()
      .append("path")
      .attr("d", d3.sankeyLinkHorizontal())
      .attr("stroke", d => color(d.source.category))
      .attr("stroke-width", d => Math.max(1, d.width));

    const node = svg.append("g")
      .selectAll("rect")
      .data(sankeyNodes)
      .enter()
      .append("rect")
      .attr("x", d => d.x0)
      .attr("y", d => d.y0)
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("fill", d => color(d.category))
      .attr("stroke", "#000");

    node.append("title")
      .text(d => `${d.name}\n${d.value} reserves`);

    svg.append("g")
      .selectAll("text")
      .data(sankeyNodes)
      .enter()
      .append("text")
      .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr("y", d => (d.y0 + d.y1) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
      .attr("font-size", "11px")
      .text(d => d.name);

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text("Influència de babies i children en la cancel·lació");
  });
}

window.drawFamilySankey = drawFamilySankey;