let monthlyDataCache = null;

function drawMonthlyCancellations(svg) {

  svg.selectAll("*").interrupt().remove();

  const width = 800;
  const height = 400;
  const margin = { top: 60, right: 60, bottom: 80, left: 60 };

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
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

  if (monthlyDataCache) {
    render(svg, monthlyDataCache);
    return;
  }

  d3.csv("hotel_bookings.csv").then(raw => {
    monthlyDataCache = raw;
    render(svg, monthlyDataCache);
  });

  function render(svg, rawData) {

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

    const statuses = [0, 1];

    const dataByMonth = months.map(month => {
      const entry = { month };
      statuses.forEach(s => {
        entry[s] = aggregated.find(
          d => d.month === month && d.canceled === s
        )?.count || 0;
      });
      return entry;
    });

    const stack = d3.stack().keys(statuses);
    const stacked = stack(dataByMonth);

    const x = d3.scaleBand()
      .domain(months)
      .range([margin.left, width - margin.right])
      .padding(0.15);

    const y = d3.scaleLinear()
      .domain([0, d3.max(stacked, d => d3.max(d, v => v[1]))])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal()
      .domain(statuses)
      .range(["#4C78A8", "#E45756"]);

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-40)")
      .style("text-anchor", "end");

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    svg.selectAll(".layer")
      .data(stacked)
      .enter()
      .append("g")
      .attr("fill", d => color(d.key))
      .selectAll("rect")
      .data(d => d)
      .enter()
      .append("rect")
      .attr("x", d => x(d.data.month))
      .attr("y", d => y(d[1]))
      .attr("height", d => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth())
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        const statusText = d[0] === 0 ? "No cancel·lades" : "Cancel·lades";
        const value = d[1] - d[0];

        tooltip
          .style("opacity", 1)
          .html(`
            <strong>${d.data.month}</strong><br/>
            ${statusText}: <strong>${value}</strong>
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
      .text("Cancel·lacions segons el mes d’arribada");

    const legendData = [
      { label: "No cancel·lada", value: 0 },
      { label: "Cancel·lada", value: 1 }
    ];

    const legend = svg.append("g")
      .attr("transform", `translate(${width - 180}, ${margin.top})`);

    const item = legend.selectAll("g")
      .data(legendData)
      .enter()
      .append("g")
      .attr("transform", (d, i) => `translate(0, ${i * 20})`);

    item.append("rect")
      .attr("width", 14)
      .attr("height", 14)
      .attr("fill", d => color(d.value));

    item.append("text")
      .attr("x", 20)
      .attr("y", 11)
      .attr("font-size", "11px")
      .text(d => d.label);
  }
}

window.drawMonthlyCancellations = drawMonthlyCancellations;

