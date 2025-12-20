let mosaicData = null;

function drawMosaic(svg) {

  const width = 800;
  const height = 400;
  const margin = { top: 60, right: 60, bottom: 60, left: 60 };
  const countryGap = 4;

  const BASE_OPACITY = {
    1: 0.85,
    0: 0.35
  };

  let tooltip = d3.select(".tooltip");
  if (tooltip.empty()) {
    tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("padding", "6px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0);
  }

  if (mosaicData) {
    render(svg, mosaicData);
  } else {
    d3.csv("hotel_bookings.csv").then(raw => {
      mosaicData = raw;
      render(svg, mosaicData);
    });
  }

  function render(svg, raw) {

    svg.selectAll("*").interrupt().remove();

    const topCountries = [
      "AUT","BEL","BRA","CHE","CN","DEU","ESP","FRA",
      "GBR","IRL","ITA","NLD","PRT","SWE"
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
        const vals = values.map(([canceled, count]) => ({
          canceled: +canceled,
          count
        }));
        return {
          country,
          values: vals,
          total: d3.sum(vals, d => d.count)
        };
      })
      .sort((a, b) => b.total - a.total);

    const orderedCountries = countries.map(d => d.country);
    const totalSum = d3.sum(countries, d => d.total);

    const usableWidth = width - margin.left - margin.right;
    const usableHeight = height - margin.top - margin.bottom;

    const countryColor = d3.scaleOrdinal()
      .domain(orderedCountries)
      .range(d3.schemeTableau10);

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", margin.top - 25)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text("Distribució de cancel·lacions per país");

    let x0 = margin.left;

    countries.forEach(country => {

      const countryWidth =
        (country.total / totalSum) * usableWidth - countryGap;

      let y0 = margin.top;

      country.values.forEach(d => {

        const h = (d.count / country.total) * usableHeight;
        const percent = (d.count / country.total * 100).toFixed(1);

        svg.append("rect")
          .attr("x", x0)
          .attr("y", y0)
          .attr("width", countryWidth)
          .attr("height", h)
          .attr("fill", countryColor(country.country))
          .attr("data-country", country.country)
          .attr("data-canceled", d.canceled)
          .attr("opacity", BASE_OPACITY[d.canceled])
          .style("cursor", "pointer")
          .on("mouseover", () => {
            highlightCountry(country.country);
            tooltip
              .style("opacity", 1)
              .html(`
                <strong>${country.country}</strong><br/>
                ${d.canceled === 1 ? "Cancel·lada" : "No cancel·lada"}<br/>
                ${percent}%
              `);
          })
          .on("mousemove", (event) => {
            tooltip
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY + 10 + "px");
          })
          .on("mouseout", () => {
            resetHighlight();
            tooltip.style("opacity", 0);
          })
          .on("click", () => {
            tooltip.style("opacity", 0);
            drawHotelBreakdown(svg, country.country, d.canceled, raw);
          });

        y0 += h;
      });

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

      x0 += countryWidth + countryGap;
    });

    drawCountryLegend(svg, orderedCountries, countryColor, width, margin);
    drawCanceledLegend(svg, width, margin);
  }

  function highlightCountry(country) {
    svg.selectAll("rect")
      .attr("opacity", function () {
        const c = d3.select(this).attr("data-country");
        const canceled = d3.select(this).attr("data-canceled");
        return c === country ? BASE_OPACITY[canceled] : 0.1;
      });
  }

  function resetHighlight() {
    svg.selectAll("rect")
      .attr("opacity", function () {
        const canceled = d3.select(this).attr("data-canceled");
        return BASE_OPACITY[canceled];
      });
  }
}

function drawHotelBreakdown(svg, country, canceled, rawData) {

  svg.selectAll("*").interrupt().remove();

  const width = 800;
  const height = 400;
  const margin = { top: 60, right: 60, bottom: 60, left: 60 };

  let tooltip = d3.select(".tooltip");
  if (tooltip.empty()) {
    tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("padding", "6px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0);
  }

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

  const hotelColor = d3.scaleOrdinal()
    .domain(["City Hotel", "Resort Hotel"])
    .range(["#4C78A8", "#F58518"]);

  const x = d3.scaleBand()
    .domain(hotels.map(d => d.hotel))
    .range([margin.left, width - margin.right])
    .padding(0.4);

  const y = d3.scaleLinear()
    .domain([0, d3.max(hotels, d => d.count)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  svg.selectAll(".bar")
    .data(hotels)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.hotel))
    .attr("y", d => y(0))
    .attr("width", x.bandwidth())
    .attr("height", 0)
    .attr("fill", d => hotelColor(d.hotel))
    .style("cursor", "pointer")
    .on("mouseover", (event, d) => {
      tooltip
        .style("opacity", 1)
        .html(`
          <strong>${d.hotel}</strong><br/>
          ${canceled === 1 ? "Cancel·lades" : "No cancel·lades"}: <strong>${d.count}</strong>
        `);
      d3.select(event.currentTarget).attr("opacity", 0.8);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY + 10 + "px");
    })
    .on("mouseout", (event) => {
      tooltip.style("opacity", 0);
      d3.select(event.currentTarget).attr("opacity", 1);
    })
    .transition()
    .duration(700)
    .attr("y", d => y(d.count))
    .attr("height", d => y(0) - y(d.count));

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .text(
      `${country} — ${canceled === 1 ? "Reserves cancel·lades" : "Reserves no cancel·lades"}`
    );

  const legend = svg.append("g")
    .attr("transform", `translate(${width - 160}, ${margin.top})`);

  legend.append("text")
    .attr("y", -10)
    .attr("font-weight", "bold")
    .text("Tipus d’hotel");

  const legendItems = ["City Hotel", "Resort Hotel"];

  const item = legend.selectAll(".legend-hotel")
    .data(legendItems)
    .enter()
    .append("g")
    .attr("class", "legend-hotel")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`);

  item.append("rect")
    .attr("width", 14)
    .attr("height", 14)
    .attr("fill", d => hotelColor(d));

  item.append("text")
    .attr("x", 20)
    .attr("y", 11)
    .attr("font-size", "11px")
    .text(d => d);

  svg.append("text")
    .attr("x", margin.left)
    .attr("y", margin.top - 20)
    .attr("font-size", "12px")
    .attr("fill", "blue")
    .style("cursor", "pointer")
    .text("← Tornar al mosaic")
    .on("click", () => {
      tooltip.style("opacity", 0);
      svg.selectAll("*").interrupt().remove();
      drawMosaic(svg);
    });
}

window.drawMosaic = drawMosaic;
