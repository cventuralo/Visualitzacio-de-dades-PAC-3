function drawMosaic(svg) {
  svg.selectAll("*").remove();

  const width = 800;
  const height = 450;
  const margin = { top: 40, right: 200, bottom: 120, left: 40 };

  d3.csv("hotel_bookings.csv").then(raw => {

    const topCountries = [
      "AUT","BEL","BRA","CHE","CN","DEU","ESP","FRA",
      "GBR","IRL","ITA","NLD","PRT","SWE","USA"
    ];

    const filtered = raw.filter(d =>
      topCountries.includes(d.country)
    );

    // country × is_canceled
    const grouped = d3.rollups(
      filtered,
      v => v.length,
      d => d.country,
      d => d.is_canceled
    );

    const countries = grouped.map(([country, values]) => {
      const vals = values.map(([canceled, count]) => ({
        canceled: +canceled,
        count
      }));
      return {
        country,
        values: vals,
        total: d3.sum(vals, d => d.count)
      };
    });

    const totalSum = d3.sum(countries, d => d.total);
    const usableWidth = width - margin.left - margin.right;
    const usableHeight = height - margin.top - margin.bottom;

    const color = d3.scaleOrdinal()
      .domain(topCountries)
      .range(d3.schemeTableau10);

    let x0 = margin.left;

    // 🔹 MOSAIC PRINCIPAL
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
          .attr("opacity", d.canceled === 1 ? 0.85 : 0.45)
          .style("cursor", "pointer")
          .on("click", () => {
            drawHotelBreakdown(svg, country.country, d.canceled, raw);
          });

        y0 += h;
      });

      // Label país (vertical)
      svg.append("text")
        .attr("x", x0 + countryWidth / 2)
        .attr("y", height - margin.bottom + 70)
        .attr(
          "transform",
          `rotate(-90, ${x0 + countryWidth / 2}, ${height - margin.bottom + 70})`
        )
        .attr("text-anchor", "end")
        .attr("font-size", "11px")
        .text(country.country);

      x0 += countryWidth;
    });

    // Etiqueta Y
    svg.append("text")
      .attr("x", -height / 2)
      .attr("y", 15)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .text("is_canceled");
  });
}

function drawHotelBreakdown(svg, country, canceled, rawData) {
  svg.selectAll("*").remove();

  const width = 800;
  const height = 450;
  const margin = { top: 60, right: 40, bottom: 60, left: 80 };

  const data = rawData.filter(d =>
    d.country === country && +d.is_canceled === canceled
  );

  const grouped = d3.rollups(
    data,
    v => v.length,
    d => d.hotel
  );

  const hotels = grouped.map(([hotel, count]) => ({
    hotel,
    count
  }));

  const x = d3.scaleBand()
    .domain(hotels.map(d => d.hotel))
    .range([margin.left, width - margin.right])
    .padding(0.4);

  const y = d3.scaleLinear()
    .domain([0, d3.max(hotels, d => d.count)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Eixos
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // Barres
  svg.selectAll("rect")
    .data(hotels)
    .enter()
    .append("rect")
    .attr("x", d => x(d.hotel))
    .attr("y", d => y(d.count))
    .attr("width", x.bandwidth())
    .attr("height", d => y(0) - y(d.count))
    .attr("fill", "#69b3a2");

  // Títol
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .text(
      `${country} — ${canceled === 1 ? "Cancel·lades" : "No cancel·lades"}`
    );

  // Tornar enrere
  svg.append("text")
    .attr("x", margin.left)
    .attr("y", margin.top - 20)
    .attr("font-size", "12px")
    .attr("fill", "blue")
    .style("cursor", "pointer")
    .text("← Tornar al mosaic")
    .on("click", () => drawMosaic(svg));
}
