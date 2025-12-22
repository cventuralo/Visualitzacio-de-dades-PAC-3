let familySankeyDataCache = null;

function drawFamilySankey(svg) {

  svg.selectAll("*").interrupt().remove();

  const width = 800;
  const height = 520;

  if (familySankeyDataCache) {
    render(familySankeyDataCache);
  } else {
    d3.csv("hotel_bookings.csv").then(raw => {
      familySankeyDataCache = raw;
      render(familySankeyDataCache);
    });
  }

  function getFamilyType(d) {
    if (+d.babies > 0) return "Amb babies";
    if (+d.children > 0) return "Amb children";
    return "Sense infants";
  }

  function render(raw) {

    svg.selectAll("*").interrupt().remove();

    // Prepare data
    const data = raw.map(d => ({
      family: getFamilyType(d),
      hotel: d.hotel,
      status: +d.is_canceled === 1 ? "Cancel·lada" : "No cancel·lada"
    }));

    // Define nodes with fixed order
    const nodes = [
      { name: "Sense infants", category: "family", column: 0 },
      { name: "Amb children", category: "family", column: 0 },
      { name: "Amb babies", category: "family", column: 0 },

      { name: "City Hotel", category: "hotel", column: 1 },
      { name: "Resort Hotel", category: "hotel", column: 1 },

      { name: "No cancel·lada", category: "status", column: 2 },
      { name: "Cancel·lada", category: "status", column: 2 }
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

    // Family → Hotel
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

    // Hotel → Status
    d3.rollups(
      data,
      v => v.length,
      d => d.hotel,
      d => d.status
    ).forEach(([hotel, statuses]) => {
      statuses.forEach(([status, count]) => {
        addLink(hotel, status, count);
      });
    });

    // Sankey layout with fixed alignment
    const sankey = d3.sankey()
      .nodeWidth(20)
      .nodePadding(24)
      .nodeAlign(d3.sankeyLeft)
      .extent([[20, 80], [width - 20, height - 40]]);

    const { nodes: sankeyNodes, links: sankeyLinks } = sankey({
      nodes: nodes.map(d => ({ ...d })),
      links: links.map(d => ({ ...d }))
    });

    // Color scale
    const color = d3.scaleOrdinal()
      .domain([
        "Sense infants",
        "Amb children",
        "Amb babies",
        "City Hotel",
        "Resort Hotel",
        "No cancel·lada",
        "Cancel·lada"
      ])
      .range([
        "#66c2a5", // sense infants
        "#a6d854", // children
        "#8dd3c7", // babies
        "#4c78a8", // city
        "#f58518", // resort
        "#bdbdbd", // no cancel
        "#e45756"  // cancel
      ]);

    // Draw links
    svg.append("g")
      .attr("fill", "none")
      .attr("stroke-opacity", 0.45)
      .selectAll("path")
      .data(sankeyLinks)
      .enter()
      .append("path")
      .attr("d", d3.sankeyLinkHorizontal())
      .attr("stroke", d => color(d.source.name))
      .attr("stroke-width", d => Math.max(1, d.width));

    // Draw nodes
    const node = svg.append("g")
      .selectAll("rect")
      .data(sankeyNodes)
      .enter()
      .append("rect")
      .attr("x", d => d.x0)
      .attr("y", d => d.y0)
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("fill", d => color(d.name))
      .attr("stroke", "#333");

    // Node titles
    node.append("title")
      .text(d => `${d.name}\n${d.value} reserves`);

    // Labels
    svg.append("g")
      .selectAll("text")
      .data(sankeyNodes)
      .enter()
      .append("text")
      .attr("x", d => d.x0 < width / 2 ? d.x1 + 8 : d.x0 - 8)
      .attr("y", d => (d.y0 + d.y1) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .text(d => d.name);

    // Title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .attr("font-size", "18px")
      .attr("font-weight", "bold")
      .text("Babies, children i cancel·lacions segons el tipus d’hotel");
  }
}

window.drawFamilySankey = drawFamilySankey;