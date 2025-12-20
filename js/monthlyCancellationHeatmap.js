let heatmapDataCache = null;

function drawMonthlyCancellationHeatmap(svg) {

  svg.selectAll("*").interrupt().remove();

  const width = 800;
  const height = 350;
  const margin = { top: 60, right: 60, bottom: 80, left: 100 };

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const statuses = [
    { key: 0, label: "No cancel·lada" },
    { key: 1, label: "Cancel·lada" }
  ];

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

  if (heatmapDataCache) {
    renderHeatmap(svg, heatmapDataCache);
    return;
  }

  d3.csv("hotel_bookings.csv").then(raw => {
    heatmapDataCache = raw;
    renderHeatmap(svg, heatmapDataCache);
  });

  function renderHeatmap(svg, rawData) {

    svg.selectAll("*").interrupt().remove();

    const aggregated = d3.rollups(
      rawData,
      v => v.length,
      d => d.arrival_date_month,
      d => +d.is_canceled
    ).flatMap(([month, values]) =>
      values.map(([canceled, count]) => ({
        month,
        canceled,
        count
      }))
    );

    const data = [];

    months.forEach(month => {
      statuses.forEach(s => {
        data.push({
          month,
          status: s.label,
          canceled: s.key,
          count: aggregated.find(
            d => d.month === month && d.canceled === s.key
          )?.count || 0
        });
      });
    });

    const x = d3.scaleBand()
      .domain(months)
      .range([margin.left, width - margin.right])
      .padding(0.05);

    const y = d3.scaleBand()
      .domain(statuses.map(d => d.label))
      .range([margin.top, height - margin.bottom])
      .padding(0.05);

    const color = d3.scaleSequential()
      .interpolator(d3.interpolateBlues)
      .domain([0, d3.max(data, d => d.count)]);

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-40)")
      .style("text-anchor", "end");

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    svg.selectAll("rect.cell")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "cell")
      .attr("x", d => x(d.month))
      .attr("y", d => y(d.status))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("fill", d => color(d.count))
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(`
            <strong>${d.month}</strong><br/>
            ${d.status}<br/>
            Reserves: <strong>${d.count}</strong>
          `);
        d3.select(event.currentTarget)
          .attr("stroke", "#333")
          .attr("stroke-width", 1);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY + 10 + "px");
      })
      .on("mouseout", (event) => {
        tooltip.style("opacity", 0);
        d3.select(event.currentTarget).attr("stroke", "none");
      })
      .on("click", (event, d) => {
        tooltip.style("opacity", 0);
        drawHotelBarFromMonth(svg, d.month, d.canceled, rawData);
      });

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text("Estacionalitat de les cancel·lacions per mes d’arribada");
  }

  function drawHotelBarFromMonth(svg, month, canceled, rawData) {

    svg.selectAll("*").interrupt().remove();

    const margin = { top: 60, right: 60, bottom: 80, left: 60 };

    const data = rawData.filter(d =>
      d.arrival_date_month === month && +d.is_canceled === canceled
    );

    const grouped = d3.rollups(
      data,
      v => v.length,
      d => d.hotel
    );

    const hotels = grouped.map(([hotel, count]) => ({ hotel, count }));

    const x = d3.scaleBand()
      .domain(hotels.map(d => d.hotel))
      .range([margin.left, width - margin.right])
      .padding(0.4);

    const y = d3.scaleLinear()
      .domain([0, d3.max(hotels, d => d.count)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const hotelColor = d3.scaleOrdinal()
      .domain(["City Hotel", "Resort Hotel"])
      .range(["#4C78A8", "#F58518"]);

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
      .attr("y", d => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", d => y(0) - y(d.count))
      .attr("fill", d => hotelColor(d.hotel))
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(`
            <strong>${d.hotel}</strong><br/>
            Reserves: <strong>${d.count}</strong>
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
      });

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text(
        `${month} — ${canceled === 1 ? "Reserves cancel·lades" : "Reserves no cancel·lades"}`
      );

    svg.append("text")
      .attr("x", margin.left)
      .attr("y", margin.top - 20)
      .attr("font-size", "12px")
      .attr("fill", "blue")
      .style("cursor", "pointer")
      .text("← Tornar al heatmap")
      .on("click", () => {
        drawMonthlyCancellationHeatmap(svg);
      });
  }
}

window.drawMonthlyCancellationHeatmap = drawMonthlyCancellationHeatmap;
