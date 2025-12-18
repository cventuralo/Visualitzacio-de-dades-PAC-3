/* =========================================================
   MOSAIC — Cancel·lacions per país (NYT scrollytelling)
   ========================================================= */

let mosaicData = null; // 👈 dades carregades UNA SOLA VEGADA

function drawMosaic(svg) {

  const width = 1200;
  const height = 650;
  const margin = { top: 60, right: 260, bottom: 120, left: 60 };
  const countryGap = 4;

  const BASE_OPACITY = {
    1: 0.85,
    0: 0.35
  };

  /* ---------- TOOLTIP (singleton) ---------- */
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

  // 🔹 Si ja tenim dades, dibuixem directament
  if (mosaicData) {
    render(svg, mosaicData);
    return;
  }

  // 🔹 Si no, carreguem CSV UNA SOLA VEGADA
  d3.csv("hotel_bookings.csv").then(raw => {
    mosaicData = raw;
    render(svg, mosaicData);
  });

  /* ===================================================== */

  function render(svg, raw) {

    // 🔥 NETEJA GARANTIDA (evita solapaments)
    svg.selectAll("*").interrupt().remove();

    /* ---------- PREPARACIÓ DE DADES ---------- */

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
    }).sort((a, b) => b.total - a.total);

    const orderedCountries = countries.map(d => d.country);
    const totalSum = d3.sum(countries, d => d.total);

    const usableWidth = width - margin.left - margin.right;
    const usableHeight = height - margin.top - margin.bottom;

    const countryColor = d3.scaleOrdinal()
      .domain(orderedCountries)
      .range(d3.schemeTableau10);

    /* ---------- TÍTOL ---------- */

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", margin.top - 25)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text("Distribució de cancel·lacions per país");

    /* ---------- MOSAIC ---------- */

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

  /* ---------- INTERACCIONS ---------- */

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

/* =========================================================
   DRILL-DOWN — Bar chart
   ========================================================= */

function drawHotelBreakdown(svg, country, canceled, rawData) {

  svg.selectAll("*").interrupt().remove();

  const width = 1200;
  const height = 650;
  const margin = { top: 60, right: 40, bottom: 60, left: 80 };

  const data = rawData.filter(d =>
    d.country === country && +d.is_canceled === canceled
  );

  const grouped = d3.rollups(data, v => v.length, d => d.hotel);

  const hotels = grouped.map(([hotel, count]) => ({ hotel, count }));

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

  svg.selectAll("rect")
    .data(hotels)
    .enter()
    .append("rect")
    .attr("x", d => x(d.hotel))
    .attr("y", d => y(0))
    .attr("width", x.bandwidth())
    .attr("height", 0)
    .attr("fill", "#4C78A8")
    .transition()
    .duration(600)
    .attr("y", d => y(d.count))
    .attr("height", d => y(0) - y(d.count));

  svg.append("text")
    .attr("x", margin.left)
    .attr("y", margin.top - 20)
    .attr("fill", "blue")
    .style("cursor", "pointer")
    .text("← Tornar al mosaic")
    .on("click", () => drawMosaic(svg));
}

/* ---------- exposició global ---------- */
window.drawMosaic = drawMosaic;
