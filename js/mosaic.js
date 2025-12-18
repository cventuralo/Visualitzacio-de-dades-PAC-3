function drawMosaic(svg) {
  svg.selectAll("*").remove();

  const width = 800;
  const height = 450;
  const margin = { top: 40, right: 160, bottom: 100, left: 40 };

  d3.csv("hotel_bookings.csv").then(raw => {

    const topCountries = [
      "AUT","BEL","BRA","CHE","CN","DEU","ESP","FRA",
      "GBR","IRL","ITA","NLD","PRT","SWE","USA"
    ];

    const filtered = raw.filter(d =>
      topCountries.includes(d.country)
    );

    const grouped = d3.rollups(
      filtered,
      v => v.length,
      d => d.country,
      d => d.is_canceled
    );

    const countries = grouped
      .map(([country, values]) => {
        const v = values.map(([canceled, count]) => ({
          canceled: +canceled,
          count
        }));
        return {
          country,
          values: v,
          total: d3.sum(v, d => d.count)
        };
      })
      .filter(d => d.total > 0);

    const totalSum = d3.sum(countries, d => d.total);

    const color = d3.scaleOrdinal()
      .domain(topCountries)
      .range(d3.schemeTableau10);

    let x0 = margin.left;
    const usableWidth = width - margin.left - margin.right;
    const usableHeight = height - margin.top - margin.bottom;

    // 🔹 Dibuix del mosaic
    countries.forEach(country => {
      const countryWidth = (country.total / totalSum) * usableWidth;
      let y0 = margin.top;

      country.values.forEach(d => {
        const h = (d.count / country.total) * usableHeight;

        svg.append("rect")
          .attr("x", x0)
          .attr("y", y0)
          .attr("width", countryWidth)
          .attr("height", h)
          .attr("fill", color(country.country))
          .attr("opacity", d.canceled === 1 ? 0.85 : 0.45);

        y0 += h;
      });

      // 🔹 Label X en vertical (país)
      svg.append("text")
        .attr("x", x0 + countryWidth / 2)
        .attr("y", height - margin.bottom + 60)
        .attr("transform",
          `rotate(-90, ${x0 + countryWidth / 2}, ${height - margin.bottom + 60})`
        )
        .attr("text-anchor", "end")
        .attr("font-size", "11px")
        .text(country.country);

      x0 += countryWidth;
    });

    // 🔹 Etiqueta eix Y
    svg.append("text")
      .attr("x", -height / 2)
      .attr("y", 15)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("is_canceled");

    // 🔹 LLEGENDA
    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);

    const legendData = [
      { label: "No cancel·lada", opacity: 0.45 },
      { label: "Cancel·lada", opacity: 0.85 }
    ];

    legend.selectAll("rect")
      .data(legendData)
      .enter()
      .append("rect")
      .attr("x", 0)
      .attr("y", (d, i) => i * 25)
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", "#999")
      .attr("opacity", d => d.opacity);

    legend.selectAll("text")
      .data(legendData)
      .enter()
      .append("text")
      .attr("x", 26)
      .attr("y", (d, i) => i * 25 + 13)
      .attr("font-size", "12px")
      .text(d => d.label);
  })
  .catch(err => {
    console.error("Error carregant el CSV:", err);
  });
}
