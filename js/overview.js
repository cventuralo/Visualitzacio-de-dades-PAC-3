function drawOverview(svg) {
  svg.selectAll("*").remove();

  const data = [
    { hotel: "City Hotel", adr: 106.88 },
    { hotel: "Resort Hotel", adr: 96.77 }
  ];

  const x = d3.scaleBand()
    .domain(data.map(d => d.hotel))
    .range([120, 720])
    .padding(0.4);

  const y = d3.scaleLinear()
    .domain([0, 120])
    .range([350, 60]);

  svg.append("g")
    .attr("transform", "translate(0,350)")
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("transform", "translate(120,0)")
    .call(d3.axisLeft(y));

  svg.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", d => x(d.hotel))
    .attr("y", d => y(d.adr))
    .attr("width", x.bandwidth())
    .attr("height", d => 350 - y(d.adr))
    .attr("fill", "steelblue");
}

