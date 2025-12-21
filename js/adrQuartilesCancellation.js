let adrQuartilesDataCache = null;

function drawAdrQuartilesCancellation(svg) {

  svg.selectAll("*").interrupt().remove();

  /* ================= TOOLTIP ================= */
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

  if (adrQuartilesDataCache) {
    render(adrQuartilesDataCache);
  } else {
    d3.csv("hotel_bookings.csv").then(raw => {
      adrQuartilesDataCache = raw;
      render(adrQuartilesDataCache);
    });
  }

  function render(rawData) {

    svg.selectAll("*").interrupt().remove();

    /* ================= TITLE ================= */
    svg.append("text")
      .attr("x", 400)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .attr("font-size", "18px")
      .attr("font-weight", "bold")
      .attr("opacity", 0)
      .text("ADR, quartils i risc de cancel·lació")
      .transition()
      .duration(600)
      .attr("opacity", 1);

    /* ================= DATA PREP ================= */
    const prepared = prepareAdrQuartileData(rawData);

    const aggregated = new Map(
      aggregateQuartilePercentages(prepared).map(
        ([hotel, values]) => [hotel, new Map(values)]
      )
    );

    const hotels = Array.from(aggregated.keys());
    const quartiles = ["Q1", "Q2", "Q3", "Q4"];

    /* ================= SCALES ================= */
    const width = 800;
    const height = 360;
    const margin = { top: 70, right: 40, bottom: 40, left: 90 };

    const x = d3.scaleLinear()
      .domain([0, 100])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleBand()
      .domain(quartiles)
      .range([margin.top, height - margin.bottom])
      .padding(0.2);

    const color = d3.scaleOrdinal()
      .domain([0, 1])
      .range(["#4C78A8", "#E45756"]);

    /* ================= DRAW ================= */
    hotels.forEach((hotel, i) => {

      const group = svg.append("g")
        .attr("transform", `translate(${i * 400},0)`)
        .attr("opacity", 0);

      const hotelData = quartiles.map(q => {
        const entry = aggregated.get(hotel)?.get(q);
        return {
          hotel,
          quartile: q,
          0: entry?.notCanceled || 0,
          1: entry?.canceled || 0
        };
      });

      const stack = d3.stack().keys([0, 1]);
      const stacked = stack(hotelData);

      /* AXES */
      group.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d => d + "%"));

      group.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

      /* HOTEL TITLE */
      group.append("text")
        .attr("x", 200)
        .attr("y", 55)
        .attr("text-anchor", "middle")
        .attr("font-weight", "bold")
        .text(hotel);

      /* STACKED BARS */
      group.selectAll(".layer")
        .data(stacked)
        .enter()
        .append("g")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .enter()
        .append("rect")
        .attr("y", d => y(d.data.quartile))
        .attr("x", x(0))
        .attr("height", y.bandwidth())
        .attr("width", 0)
        .style("cursor", "pointer")
        .on("mouseover", (event, d) => {
          tooltip
            .style("opacity", 1)
            .html(`
              <strong>${d.data.hotel}</strong><br/>
              Quartil ${d.data.quartile}<br/>
              Cancel·lades: <strong>${d.data[1].toFixed(1)}%</strong><br/>
              No cancel·lades: <strong>${d.data[0].toFixed(1)}%</strong>
            `);
          d3.select(event.currentTarget).attr("opacity", 0.8);
        })
        .on("mousemove", event => {
          tooltip
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY + 10 + "px");
        })
        .on("mouseout", event => {
          tooltip.style("opacity", 0);
          d3.select(event.currentTarget).attr("opacity", 1);
        })
        .on("click", (event, d) => {
          tooltip.style("opacity", 0);
          drawAdrQuartileDrilldown(svg, rawData, d.data.hotel, d.data.quartile);
        })
        .transition()
        .delay(i * 400)
        .duration(800)
        .attr("x", d => x(d[0]))
        .attr("width", d => x(d[1]) - x(d[0]));

      group.transition()
        .delay(i * 400)
        .duration(600)
        .attr("opacity", 1);
    });
  }
}

/* ================= DRILL-DOWN ================= */

function drawAdrQuartileDrilldown(svg, rawData, hotel, quartile) {

  svg.selectAll("*").interrupt().remove();

  const data = rawData
    .filter(d => d.hotel === hotel && !isNaN(+d.adr));

  const adrValues = data.map(d => +d.adr).sort(d3.ascending);

  const q1 = d3.quantile(adrValues, 0.25);
  const q2 = d3.quantile(adrValues, 0.5);
  const q3 = d3.quantile(adrValues, 0.75);

  const filtered = data.filter(d => {
    if (quartile === "Q1") return d.adr <= q1;
    if (quartile === "Q2") return d.adr > q1 && d.adr <= q2;
    if (quartile === "Q3") return d.adr > q2 && d.adr <= q3;
    return d.adr > q3;
  });

  const width = 800;
  const height = 350;
  const margin = { top: 60, right: 40, bottom: 60, left: 60 };

  const x = d3.scaleLinear()
    .domain(d3.extent(filtered, d => +d.adr))
    .nice()
    .range([margin.left, width - margin.right]);

  const bins = d3.bin()
    .domain(x.domain())
    .thresholds(20)(filtered.map(d => +d.adr));

  const y = d3.scaleLinear()
    .domain([0, d3.max(bins, d => d.length)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  svg.selectAll("rect")
    .data(bins)
    .enter()
    .append("rect")
    .attr("x", d => x(d.x0))
    .attr("y", y(0))
    .attr("width", d => x(d.x1) - x(d.x0) - 1)
    .attr("height", 0)
    .attr("fill", "#4C78A8")
    .transition()
    .duration(800)
    .attr("y", d => y(d.length))
    .attr("height", d => y(0) - y(d.length));

  svg.append("text")
    .attr("x", 400)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .text(`${hotel} — ${quartile} (Distribució ADR)`);

  svg.append("text")
    .attr("x", margin.left)
    .attr("y", margin.top - 20)
    .attr("fill", "blue")
    .style("cursor", "pointer")
    .text("← Tornar enrere")
    .on("click", () => drawAdrQuartilesCancellation(svg));
}

/* ================= DATA HELPERS ================= */

function prepareAdrQuartileData(rawData) {

  const result = [];
  const byHotel = d3.group(rawData, d => d.hotel);

  byHotel.forEach((rows, hotel) => {

    const adrValues = rows
      .map(d => +d.adr)
      .filter(d => !isNaN(d))
      .sort(d3.ascending);

    const q1 = d3.quantile(adrValues, 0.25);
    const q2 = d3.quantile(adrValues, 0.5);
    const q3 = d3.quantile(adrValues, 0.75);

    rows.forEach(d => {
      let quartile = "Q4";
      if (d.adr <= q1) quartile = "Q1";
      else if (d.adr <= q2) quartile = "Q2";
      else if (d.adr <= q3) quartile = "Q3";

      result.push({
        hotel,
        quartile,
        canceled: +d.is_canceled
      });
    });
  });

  return result;
}

function aggregateQuartilePercentages(data) {

  return d3.rollups(
    data,
    v => {
      const total = v.length;
      return {
        canceled: d3.sum(v, d => d.canceled) / total * 100,
        notCanceled: d3.sum(v, d => d.canceled === 0) / total * 100
      };
    },
    d => d.hotel,
    d => d.quartile
  );
}

/* ================= EXPORT ================= */
window.drawAdrQuartilesCancellation = drawAdrQuartilesCancellation;
