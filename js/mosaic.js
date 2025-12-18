function drawMosaic(svg) {
  svg.selectAll("*").remove();

  const width = 800;
  const height = 450;
  const margin = { top: 40, right: 220, bottom: 120, left: 40 };

  d3.csv("hotel_bookings.csv").then(raw => {

    const topCountries = [
      "AUT","BEL","BRA","CHE","CN","DEU","ESP","FRA",
      "GBR","IRL","ITA","NLD","PRT","SWE","USA"
    ];

    const filtered = raw.filter(d =>
      topCountries.includes(d.country)
    );

    // 🔹 Agregació: country × hotel × is_canceled
    const grouped = d3.rollups(
      filtered,
      v => v.length,
      d => d.country,
      d => d.hotel,
      d => d.is_canceled
    );

    const countries = grouped.map(([country, hotels]) => {
      const hotelData = hotels.map(([hotel, statuses]) => {
        const vals = statuses.map(([canceled, count]) => ({
          canceled: +canceled,
          count
        }));
        return {
          hotel,
          values: vals,
          total: d3.sum(vals, d => d.count)
        };
      });
      return {
        country,
        hotels: hotelData,
        total: d3.sum(hotelData, d => d.total)
      };
    });

    const totalSum = d3.sum(countries, d => d.total);

    const countryColor = d3.scaleOrdinal()
      .domain(topCountries)
      .range(d3.schemeTableau10);

    const hotelOrder = ["City Hotel", "Resort Hotel"];

    let x0 = margin.left;
    const usableWidth = width - margin.left - margin.right;
    const usableHeight = height - margin.top - margin.bottom;

    // 🔹 DIBUIX MOSAIC
    countries.forEach(country => {
      const countryWidth = (country.total / totalSum) * usableWidth;
      let yCountry = margin.top;

      hotelOrder.forEach(hotelName => {
        const hotel = country.hotels.find(h => h.hotel === hotelName);
        if (!hotel) return;

        const hotelHeight = (hotel.total / country.total) * usableHeight;
        let yHotel = yCountry;

        hotel.values.forEach(d => {
          const h = (d.count / hotel.total) * hotelHeight;

          svg.append("rect")
            .attr("x", x0)
            .attr("y", yHotel)
            .attr("width", countryWidth)
            .attr("height", h)
            .attr("fill", countryColor(country.country))
            .attr("opacity", d.canceled === 1 ? 0.9 : 0.45);

          yHotel += h;
        });

        yCountry += hotelHeight;
      });

      // 🔹 Label país (vertical)
      svg.append("text")
        .attr("x", x0 + countryWidth / 2)
        .attr("y", height - margin.bottom + 70)
        .attr("transform",
          `rotate(-90, ${x0 + countryWidth / 2}, ${height - margin.bottom + 70})`
        )
        .attr("text-anchor", "end")
        .attr("font-size", "11px")
        .text(country.country);

      x0 += countryWidth;
    });

    // 🔹 LLEGENDA
    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);

    // Estat reserva
    const statusLegend = [
      { label: "No cancel·lada", opacity: 0.45 },
      { label: "Cancel·lada", opacity: 0.9 }
    ];

    legend.append("text")
      .attr("y", -10)
      .attr("font-weight", "bold")
      .text("Estat reserva");

    legend.selectAll(".statusRect")
      .data(statusLegend)
      .enter()
      .append("rect")
      .attr("x", 0)
      .attr("y", (d, i) => i * 25)
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", "#999")
      .attr("opacity", d => d.opacity);

    legend.selectAll(".statusText")
      .data(statusLegend)
      .enter()
      .append("text")
      .attr("x", 26)
      .attr("y", (d, i) => i * 25 + 13)
      .text(d => d.label);

    // Tipus hotel
    const hotelLegend = [
      { label: "City Hotel" },
      { label: "Resort Hotel" }
    ];

    const hotelLegendGroup = svg.append("g")
      .attr("transform", `translate(${width - margin.right + 20}, ${margin.top + 90})`);

    hotelLegendGroup.append("text")
      .attr("y", -10)
      .attr("font-weight", "bold")
      .text("Tipus d’hotel");

    hotelLegendGroup.selectAll("rect")
      .data(hotelLegend)
      .enter()
      .append("rect")
      .attr("x", 0)
      .attr("y", (d, i) => i * 25)
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", "#ccc");

    hotelLegendGroup.selectAll("text")
      .data(hotelLegend)
      .enter()
      .append("text")
      .attr("x", 26)
      .attr("y", (d, i) => i * 25 + 13)
      .text(d => d.label);
  })
  .catch(err => {
    console.error("Error mosaic:", err);
  });
}
