let cancellationsDataCache = null;

function drawCancellationsOverview(svg) {

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

  if (cancellationsDataCache) {
    render(cancellationsDataCache);
  } else {
    d3.csv("hotel_bookings.csv").then(raw => {
      cancellationsDataCache = raw;
      render(cancellationsDataCache);
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
      .attr("opacity", 0)
      .text("Visió global i detall de les cancel·lacions")
      .transition()
      .duration(600)
      .attr("opacity", 1);

    const pieGroup = svg.append("g")
      .attr("transform", "translate(220,240)")
      .attr("opacity", 0);

    drawCancellationPie(pieGroup, rawData, tooltip);

    pieGroup
      .transition()
      .delay(200)
      .duration(700)
      .attr("opacity", 1);

    const stackedGroup = svg.append("g")
      .attr("transform", "translate(380,0)")
      .attr("opacity", 0);

    drawStackedHotelCancellations(stackedGroup, rawData, tooltip);

    stackedGroup
      .transition()
      .delay(700)
      .duration(700)
      .attr("opacity", 1);
  }
}

function drawCancellationPie(group, rawData, tooltip) {

  const data = d3.rollups(
    rawData,
    v => v.length,
    d => d.is_canceled
  ).map(([key, value]) => ({
    name: key === "1" ? "Cancel·lades" : "No cancel·lades",
    value
  }));

  const total = d3.sum(data, d => d.value);
  const radius = 120;

  const color = d3.scaleOrdinal()
    .domain(data.map(d => d.name))
    .range(["#4C78A8", "#E45756"]);

  const pie = d3.pie().value(d => d.value);
  const arc = d3.arc().innerRadius(0).outerRadius(radius);
  const arcStart = d3.arc().innerRadius(0).outerRadius(0);

  const arcs = group.selectAll("path")
    .data(pie(data))
    .enter()
    .append("path")
    .attr("fill", d => color(d.data.name))
    .attr("d", arcStart)
    .style("cursor", "pointer")
    .on("mouseover", (event, d) => {
      const percent = ((d.data.value / total) * 100).toFixed(1);

      tooltip
        .style("opacity", 1)
        .html(`
          <strong>${d.data.name}</strong><br/>
          Reserves: <strong>${d.data.value}</strong><br/>
          Percentatge: <strong>${percent}%</strong>
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
      d3.select(event.currentTarget)
        .attr("stroke", "none");
    });

  arcs
    .transition()
    .duration(800)
    .attrTween("d", d => {
      const i = d3.interpolate(
        { startAngle: d.startAngle, endAngle: d.startAngle },
        d
      );
      return t => arc(i(t));
    });

  group.selectAll("text")
    .data(pie(data))
    .enter()
    .append("text")
    .attr("transform", d => `translate(${arc.centroid(d)})`)
    .attr("text-anchor", "middle")
    .attr("font-size", "11px")
    .attr("fill", "white")
    .attr("opacity", 0)
    .text(d => d.data.name)
    .transition()
    .delay(700)
    .duration(400)
    .attr("opacity", 1);
}

function drawStackedHotelCancellations(svg, rawData, tooltip) {

  const width = 400;
  const height = 400;
  const margin = { top: 60, right: 40, bottom: 60, left: 60 };

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
    .attr("y", y(0))
    .attr("height", 0)
    .attr("width", x.bandwidth())
    .style("cursor", "pointer")
    .on("mouseover", (event, d) => {
      const statusText = d[0] === 0 ? "No cancel·lades" : "Cancel·lades";
      const value = d[1] - d[0];

      tooltip
        .style("opacity", 1)
        .html(`
          <strong>${d.data.hotel}</strong><br/>
          ${statusText}<br/>
          Reserves: <strong>${value}</strong>
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
    .duration(800)
    .delay((d, i) => i * 100)
    .attr("y", d => y(d[1]))
    .attr("height", d => y(d[0]) - y(d[1]));
}

window.drawCancellationsOverview = drawCancellationsOverview;