let adrQuartilesDataCache = null;

function drawAdrQuartilesCancellation(svg) {

  svg.selectAll("*").interrupt().remove();

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

    svg.append("text")
      .attr("x", 400)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .attr("font-size", "18px")
      .attr("font-weight", "bold")
      .text("ADR, quartils i risc de cancel·lació");

    const prepared = prepareAdrQuartileData(rawData);

    const aggregated = new Map(
      aggregateQuartilePercentages(prepared).map(
        ([hotel, values]) => [hotel, new Map(values)]
      )
    );

    const hotels = Array.from(aggregated.keys());
    const quartiles = ["Q1", "Q2", "Q3", "Q4"];

    const totalWidth = 800;
    const gap = 10;
    const panelWidth = (totalWidth - gap) / 2;
    const height = 360;
    const margin = { top: 70, right: 30, bottom: 40, left: 80 };

    const x = d3.scaleLinear()
      .domain([0, 100])
      .range([margin.left, panelWidth - margin.right - 40]);

    const y = d3.scaleBand()
      .domain(quartiles)
      .range([margin.top, height - margin.bottom])
      .padding(0.25);

    const color = d3.scaleOrdinal()
      .domain([0, 1])
      .range(["#4C78A8", "#E45756"]);

    hotels.forEach((hotel, i) => {

      const group = svg.append("g")
        .attr("transform", `translate(${i * (panelWidth + gap)},0)`);

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

      group.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d => d + "%"));

      group.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

      group.append("text")
        .attr("x", panelWidth / 2)
        .attr("y", 55)
        .attr("text-anchor", "middle")
        .attr("font-weight", "bold")
        .text(hotel);

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
        .attr("x", d => x(d[0]))
        .attr("height", y.bandwidth())
        .attr("width", d => x(d[1]) - x(d[0]))
        .style("cursor", "pointer")
        .on("mouseover", (event, d) => {
          tooltip
            .style("opacity", 1)
            .html(`
              <strong>${d.data.hotel}</strong><br/>
              Quartil ${d.data.quartile}<br/>
              ${d3.select(event.currentTarget.parentNode).datum().key === 1
                ? "Cancel·lades"
                : "No cancel·lades"}: <strong>${(d[1] - d[0]).toFixed(1)}%</strong>
            `);
        })
        .on("mousemove", e => {
          tooltip
            .style("left", e.pageX + 10 + "px")
            .style("top", e.pageY + 10 + "px");
        })
        .on("mouseout", () => tooltip.style("opacity", 0))
        .on("click", (event, d) => {
          const canceled = d3.select(event.currentTarget.parentNode).datum().key;
          drawAdrQuartileDrilldown(
            svg,
            rawData,
            d.data.hotel,
            d.data.quartile,
            canceled
          );
        });
    });
  }
}

function drawAdrQuartileDrilldown(svg, rawData, hotel, quartile, canceled) {

  svg.selectAll("*").interrupt().remove();

  const data = rawData.filter(d =>
    d.hotel === hotel &&
    +d.is_canceled === canceled &&
    !isNaN(+d.adr)
  );

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

  let xMin, xMax;
  if (quartile === "Q1") { xMin = d3.min(filtered, d => +d.adr); xMax = q1; }
  else if (quartile === "Q2") { xMin = q1; xMax = q2; }
  else if (quartile === "Q3") { xMin = q2; xMax = q3; }
  else {
    xMin = q3;
    xMax = d3.quantile(filtered.map(d => +d.adr).sort(d3.ascending), 0.98);
  }

  const width = 800;
  const height = 350;
  const margin = { top: 60, right: 70, bottom: 60, left: 60 };

  const x = d3.scaleLinear()
    .domain([xMin, xMax])
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
    .call(d3.axisBottom(x).ticks(6).tickSizeOuter(0));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  svg.selectAll("rect")
    .data(bins)
    .enter()
    .append("rect")
    .attr("x", d => x(d.x0))
    .attr("y", d => y(d.length))
    .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
    .attr("height", d => y(0) - y(d.length))
    .attr("fill", "#4C78A8");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .text(
      `${hotel} — ${quartile} · ${
        canceled === 1 ? "Cancel·lades" : "No cancel·lades"
      } (ADR)`
    );

  svg.append("text")
    .attr("x", margin.left)
    .attr("y", margin.top - 20)
    .attr("fill", "blue")
    .style("cursor", "pointer")
    .text("← Tornar enrere")
    .on("click", () => drawAdrQuartilesCancellation(svg));
}

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

window.drawAdrQuartilesCancellation = drawAdrQuartilesCancellation;