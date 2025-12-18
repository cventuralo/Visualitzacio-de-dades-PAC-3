function showDistribution(svg) {
  svg.selectAll("*").remove();

  const data = [
    { hotel: "City Hotel", adr: 80 },
    { hotel: "City Hotel", adr: 120 },
    { hotel: "City Hotel", adr: 150 },
    { hotel: "Resort Hotel", adr: 70 },
    { hotel: "Resort Hotel", adr: 100 },
    { hotel: "Resort Hotel", adr: 160 }
  ];

  const x = d3.scaleBand()
    .domain(["City Hotel", "Resort Hotel"])
    .range([180, 680])
    .padding(0.5);

  const y = d3.scaleLinear()
    .domain([0, 200])
    .range([350, 60]);

  svg.append("g")
    .attr("transform", "translate(0,350)")
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("transform", "translate(180,0)")
    .call(d3.axisLeft(y));

  svg.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => x(d.hotel) + x.bandwidth()/2 + (Math.random()*20-10))
    .attr("cy", d => y(d.adr))
    .attr("r", 6)
    .attr("fill", d => d.hotel === "City Hotel" ? "steelblue" : "seagreen");
}

