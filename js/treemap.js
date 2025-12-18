function drawTreemap(svg) {
  svg.selectAll("*").remove();

  const width = 800;
  const height = 450;

  svg
    .attr("width", width)
    .attr("height", height)
    .style("font", "11px sans-serif");

  d3.csv("hotel_bookings.csv").then(raw => {

    const topCountries = [
      "AUT","BEL","BRA","CHE","CN","DEU","ESP","FRA",
      "GBR","IRL","ITA","NLD","PRT","SWE","USA"
    ];

    const filtered = raw.filter(d =>
      topCountries.includes(d.country)
    );

    // 🔹 JERARQUIA CORRECTA
    const data = {
      name: "Total",
      children: Array.from(
        d3.group(filtered, d => d.country),
        ([country, rowsCountry]) => ({
          name: country,
          children: Array.from(
            d3.group(rowsCountry, d => d.is_canceled),
            ([canceled, rowsStatus]) => ({
              name: canceled === "1" ? "Cancel·lada" : "No cancel·lada",
              children: Array.from(
                d3.group(rowsStatus, d => d.hotel),
                ([hotel, rowsHotel]) => ({
                  name: hotel,
                  value: rowsHotel.length
                })
              )
            })
          )
        })
      )
    };

    const root = d3.hierarchy(data)
      .sum(d => d.value || 0)
      .sort((a, b) => b.value - a.value);

    const treemap = d3.treemap()
      .size([width, height])
      .paddingInner(1);

    treemap(root);

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    let currentRoot = root;

    const g = svg.append("g");

    render(currentRoot);

    // 🔹 RENDER CONTROLAT
    function render(nodeRoot) {

      g.selectAll("*").remove();

      const nodes = g.selectAll("g")
        .data(nodeRoot.children)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`)
        .style("cursor", d => d.children ? "pointer" : "default")
        .on("click", (event, d) => {
          if (d.children) {
            currentRoot = d;
            render(d);
          }
        });

      nodes.append("rect")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", d => color(d.depth))
        .attr("stroke", "#fff");

      nodes.append("title")
        .text(d =>
          d.ancestors().map(d => d.data.name).reverse().join(" / ") +
          "\n" + d.value
        );

      nodes.append("text")
        .attr("x", 4)
        .attr("y", 14)
        .attr("font-size", "11px")
        .attr("fill-opacity", d => d.children ? 1 : 0.7)
        .text(d => d.data.name);

      // 🔙 BOTÓ TORNAR
      if (nodeRoot.parent) {
        svg.append("text")
          .attr("x", 10)
          .attr("y", 20)
          .attr("font-size", "12px")
          .attr("fill", "blue")
          .style("cursor", "pointer")
          .text("← Tornar enrere")
          .on("click", () => {
            currentRoot = nodeRoot.parent;
            render(currentRoot);
          });
      }
    }
  });
}

// exposició global
window.drawTreemap = drawTreemap;
