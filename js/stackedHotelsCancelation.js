let stackedDataCache = null;

function drawStackedHotelCancellations(svg) {

  svg.selectAll("*").interrupt().remove();

  const width = 800;
  const height = 400;
  const margin = { top: 60, right: 60, bottom: 60, left: 60 };

  if (stackedDataCache) {
    render(svg, stackedDataCache);
    return;
  }

  d3.csv("hotel_bookings.csv").then(raw => {
    stackedDataCache = raw;
    render(svg, stackedDataCache);
  });

  function render(svg, rawData) {

    svg.selectAll("*").interrupt().remove();

    const aggregated = d3.rollups(
      rawData,
      v => v.length,
      d => d.hotel,
      d => +d.is_canceled
    ).flatMap(([hotel, values]) =>
      values.map(([canceled, count]) => ({
        hotel,
        canceled,
        count
      }))
    );

    const hotels = ["City Hotel", "Resort Hotel"];
    const statuses = [0, 1];

    const dataByHotel = hotels.map(hotel => {
      const entry = { hotel };
      statuses.forEach(s => {
        entry[s] = aggregated.find(
          d => d.hotel === hotel && d.canceled === s
        )?.count || 0;
      });
      return entry;
    });

    const stack = d3.stack().keys(statuses);
    const stacked = stack(dataByHotel);

    const x = d3.scaleBand()
      .domain(hotels)
      .range([margin.left, width - margin.right])
      .padding(0.4);

    const y = d3.scaleLinear()
      .domain([0, d3.max(stacked, d => d3.max(d, v => v[1]))])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal()
      .domain(statuses)
      .range(["#4C78A8", "#E45756"]);

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x));

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
      .attr("x", d => x(d.data.hotel))
      .attr("y", d => y(d[1]))
      .attr("height", d => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth());

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text("Cancel·lacions per tipus d’hotel");

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

window.drawStackedHotelCancellations = drawStackedHotelCancellations;
