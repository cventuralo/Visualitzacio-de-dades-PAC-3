function drawMosaic(svg) {
  svg.selectAll("*").remove();

  const width = 800;
  const height = 450;
  const margin = { top: 40, right: 20, bottom: 60, left: 40 };

  d3.csv("hotel_bookings.csv").then(raw => {

    // 🔹 Països principals (mateixos que al gràfic original)
    const topCountries = [
      "AUT","BEL","BRA","CHE","CN","DEU","ESP","FRA",
      "GBR","IRL","ITA","NLD","PRT","SWE","USA"
    ];

    const data = raw.filter(d =>
      topCountries.includes(d.country)
    );

    // 🔹 Agregació: country × is_canceled
    const grouped = d3.rollups(
      data,
      v => v.length,
      d => d.country,
      d => d.is_canceled
    );

    const countries = grouped.map(([country, values]) => {
      const obj = {
        country,
        values: values.map(([canceled, count]) => ({
          canceled: +canceled,
          count
        }))
      };
      obj.total = d3.sum(obj.values, d => d.count);
      return obj;
    });

    const totalSum = d3.sum(countries, d => d.total);

    const color = d3.scaleOrdinal()
      .domain(topCountries)
      .range(d3.schemeTableau10);

    let x0 = margin.left;

    countries.forEach(country => {
      const countryWidth =
        (country.total / totalSum) *
        (width - margin.left - margin.right);

      let y0 = margin.top;

      country.values.forEach(d => {
        const rectHeight =
          (d.count / country.total) *
          (height - margin.top - margin.bottom);

        svg.append("rect")
          .attr("x", x0)
          .attr("y", y0)
          .attr("width", countryWidth)
          .attr("height", rectHeight)
          .attr("fill", color(country.country))
          .attr("opacity", d.canceled === 1 ? 0.85 : 0.45);

        y0 += rectHeight;
      });

      // Etiqueta país
      svg.append("text")
        .attr("x", x0 + countryWidth / 2)
        .attr("y", height - margin.bottom + 20)
        .attr("text-anchor", "middle")
        .attr("font-size", "11px")
        .text(country.country);

      x0 += countryWidth;
    });

    // Etiqueta eix Y
    svg.append("text")
      .attr("x", -height / 2)
      .attr("y", 15)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("is_canceled");
  });
}

