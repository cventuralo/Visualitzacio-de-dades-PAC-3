function drawMosaic(svg) {
  svg.selectAll("*").remove();

  const width = 800;
  const height = 450;
  const margin = { top: 40, right: 260, bottom: 120, left: 40 };
  const countryGap = 4;

  const BASE_OPACITY = {
    1: 0.85, // cancel·lada
    0: 0.35  // no cancel·lada
  };

  // 🔹 Tooltip
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "6px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", 0);

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

    let countries = grouped.map(([country, values]) => {
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

    countries.sort((a, b) => b.total - a.total);
    const orderedCountries = countries.map(d => d.country);

    const totalSum = d3.sum(countries, d => d.total);
    const usableWidth = width - margin.left - margin.right;
    const usableHeight = height - margin.top - margin.bottom;

    const countryColor = d3.scaleOrdinal()
      .domain(orderedCountries)
      .range(d3.schemeTableau10);

    let x0 = margin.left;

    // 🔹 MOSAIC
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
          .attr("opacity", BASE_OPACITY[d.canceled])
          .attr("data-country", country.country)
          .attr("data-canceled", d.canceled)
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
            tooltip.remove();
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

    // 🔹 HIGHLIGHT CORRECTE
    function highlightCountry(country) {
      svg.selectAll("rect")
        .attr("opacity", function () {
          const c = d3.select(this).attr("data-country");
          const canceled = d3.select(this).attr("data-canceled");
          if (!c) return 1;
          return c === country ? BASE_OPACITY[canceled] : 0.1;
        });

      svg.selectAll(".legend-country")
        .attr("opacity", d => d === country ? 1 : 0.3);
    }

    function resetHighlight() {
      svg.selectAll("rect")
        .attr("opacity", function () {
          const canceled = d3.select(this).attr("data-canceled");
          return canceled !== null ? BASE_OPACITY[canceled] : 1;
        });

      svg.selectAll(".legend-country")
        .attr("opacity", 1);
    }
  });
}

/* ===== LLEGENDES I DRILL-DOWN (sense canvis funcionals) ===== */

function drawCountryLegend(svg, countries, color, width, margin) {
  const legend = svg.append("g")
    .attr(
      "transform",
      `translate(${width - margin.right + 20}, ${margin.top})`
    );

  legend.append("text")
    .attr("y", -10)
    .attr("font-weight", "bold")
    .text("Països");

  const itemH = 18;

  const items = legend.selectAll(".legend-country")
    .data(countries)
    .enter()
    .append("g")
    .attr("class", "legend-country")
    .attr("transform", (d, i) => `translate(0, ${i * itemH})`);

  items.append("rect")
    .attr("width", 14)
    .attr("height", 14)
    .attr("fill", d => color(d));

  items.append("text")
    .attr("x", 20)
    .attr("y", 11)
    .attr("font-size", "11px")
    .text(d => d);
}

function drawCanceledLegend(svg, width, margin) {
  const legend = svg.append("g")
    .attr(
      "transform",
      `translate(${width - margin.right + 20}, ${margin.top + 300})`
    );

  legend.append("text")
    .attr("y", -10)
    .attr("font-weight", "bold")
    .text("Estat reserva");

  const items = [
    { label: "Cancel·lada", opacity: 0.85 },
    { label: "No cancel·lada", opacity: 0.35 }
  ];

  const itemH = 20;

  const g = legend.selectAll(".legend-cancel")
    .data(items)
    .enter()
    .append("g")
    .attr("class", "legend-cancel")
    .attr("transform", (d, i) => `translate(0, ${i * itemH})`);

  g.append("rect")
    .attr("width", 14)
    .attr("height", 14)
    .attr("fill", "#999")
    .attr("opacity", d => d.opacity);

  g.append("text")
    .attr("x", 20)
    .attr("y", 11)
    .attr("font-size", "11px")
    .text(d => d.label);
}

// exposició global
window.drawMosaic = drawMosaic;
