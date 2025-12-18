function drawScene2() {
  const svg = d3.select("#vis");
  svg.selectAll("*").remove();

  d3.json("data/adr_distribution.json").then(data => {

    const x = d3.scaleBand()
      .domain(["City Hotel", "Resort Hotel"])
      .range([150, 650])
      .padding(0.5);

    const y = d3.scaleLinear()
      .domain([0, 200])
      .range([350, 50]);

    svg.append("g")
      .attr("transform", "translate(0,350)")
      .call(d3.axisBottom(x));

    svg.append("g")
      .attr("transform", "translate(150,0)")
      .call(d3.axisLeft(y));

    svg.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.hotel) + x.bandwidth()/2 + (Math.random()*20-10))
      .attr("cy", d => y(d.adr))
      .attr("r", 5)
      .attr("fill", d => d.hotel === "City Hotel" ? "steelblue" : "seagreen");
  });
}

