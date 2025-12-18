function drawScene1() {
  const svg = d3.select("#vis");
  svg.selectAll("*").remove();

  d3.json("data/adr_mean.json").then(data => {

    const x = d3.scaleBand()
      .domain(data.map(d => d.hotel))
      .range([100, 700])
      .padding(0.4);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.adr)])
      .range([350, 50]);

    svg.append("g")
      .attr("transform", "translate(0,350)")
      .call(d3.axisBottom(x));

    svg.append("g")
      .attr("transform", "translate(100,0)")
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
  });
}

