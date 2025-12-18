// ⚠️ FUNCIÓ GLOBAL (FORA DE TOT)
function drawTreemap(svg) {
  console.log("drawTreemap cridada");

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

    const data = {
      name: "Total",
      children: Array.from(
        d3.group(filtered, d => d.country),
        ([country, rows]) => ({
          name: country,
          children: Array.from(
            d3.group(rows, d => d.is_canceled),
            ([canceled, rows2]) => ({
              name: canceled === "1" ? "Cancel·lada" : "No cancel·lada",
              children: Array.from(
                d3.group(rows2, d => d.hotel),
                ([hotel, rows3]) => ({
                  name: hotel,
                  value: rows3.length
                })
              )
            })
          )
        })
      )
    };

    const root = d3.hierarchy(data)
      .sum(d => d.value || 0);

    d3.treemap()
      .size([width, height])
      .paddingInner(1)
      (root);

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    const g = svg.append("g");

    const nodes = g.selectAll("g")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`);

    nodes.append("rect")
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("fill", d => d.depth === 0 ? "#fff" : color(d.depth))
      .attr("stroke", "#fff");

    nodes.append("title")
      .text(d =>
        d.ancestors().map(d => d.data.name).reverse().join(" / ") +
        "\n" + d.value
      );

    nodes.append("text")
      .attr("x", 4)
      .attr("y", 14)
      .attr("font-size", "10px")
      .attr("fill-opacity", d => d.children ? 1 : 0.7)
      .text(d => d.data.name);
  });
}

// 🔥 FORÇAR EXPOSICIÓ GLOBAL (CLAU)
window.drawTreemap = drawTreemap;
