function drawTreemap(svg) {

  svg.selectAll("*").remove();

  const width = 800;
  const height = 450;

  const marginTop = 30;

  // 🔹 Carregar CSV
  d3.csv("hotel_bookings.csv").then(raw => {

    // 🔹 Països principals
    const topCountries = [
      "AUT","BEL","BRA","CHE","CN","DEU","ESP","FRA",
      "GBR","IRL","ITA","NLD","PRT","SWE","USA"
    ];

    const filtered = raw.filter(d =>
      topCountries.includes(d.country)
    );

    // 🔹 Construcció jeràrquica
    const data = {
      name: "Total",
      children: Array.from(
        d3.group(filtered, d => d.country),
        ([country, rows]) => ({
          name: country,
          children: Array.from(
            d3.group(rows, d => d.is_canceled),
            ([canceled, rows2]) => ({
              name: canceled === "1" ? "Cancel·lada" : "No cancel·lada",
              children: Array.from(
                d3.group(rows2, d => d.hotel),
                ([hotel, rows3]) => ({
                  name: hotel,
                  value: rows3.length
                })
              )
            })
          )
        })
      )
    };

    // 🔹 Layout jeràrquic
    const root = d3.hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

    d3.treemap()
      .size([width, height])
      .paddingInner(1)
      (root);

    const x = d3.scaleLinear().range([0, width]);
    const y = d3.scaleLinear().range([0, height]);

    const color = d3.scaleOrdinal()
      .domain([1, 2, 3])
      .range(["#69b3a2", "#4C78A8", "#F58518"]);

    const format = d3.format(",d");
    const name = d => d.ancestors().reverse().map(d => d.data.name).join(" / ");

    svg
      .attr("viewBox", [0, -marginTop, width, height + marginTop])
      .style("font", "11px sans-serif");

    let group = svg.append("g")
      .call(render, root);

    // 🔹 RENDER
    function render(group, root) {

      const node = group.selectAll("g")
        .data(root.children.concat(root))
        .join("g");

      node
        .filter(d => d === root ? d.parent : d.children)
        .attr("cursor", "pointer")
        .on("click", (event, d) => {
          d === root ? zoomout(root) : zoomin(d);
        });

      node.append("title")
        .text(d => `${name(d)}\n${format(d.value || 0)}`);

      node.append("rect")
        .attr("fill", d => d === root ? "#fff" : color(d.depth))
        .attr("stroke", "#fff");

      node.append("text")
        .attr("x", 4)
        .attr("y", 14)
        .attr("font-weight", d => d === root ? "bold" : null)
        .attr("fill-opacity", d => d.children ? 1 : 0.7)
        .text(d => d === root ? name(d) : d.data.name);

      group.call(position, root);
    }

    // 🔹 POSICIONAMENT
    function position(group, root) {
      group.selectAll("g")
        .attr("transform", d =>
          d === root
            ? `translate(0,${-marginTop})`
            : `translate(${x(d.x0)},${y(d.y0)})`
        )
        .select("rect")
        .attr("width", d => d === root ? width : x(d.x1) - x(d.x0))
        .attr("height", d => d === root ? marginTop : y(d.y1) - y(d.y0));
    }

    // 🔹 ZOOM IN
    function zoomin(d) {
      const group0 = group.attr("pointer-events", "none");
      const group1 = group = svg.append("g").call(render, d);

      x.domain([d.x0, d.x1]);
      y.domain([d.y0, d.y1]);

      svg.transition()
        .duration(750)
        .call(t => group0.transition(t).remove()
          .call(position, d.parent))
        .call(t => group1.transition(t)
          .attrTween("opacity", () => d3.interpolate(0, 1))
          .call(position, d));
    }

    // 🔹 ZOOM OUT
    function zoomout(d) {
      const group0 = group.attr("pointer-events", "none");
      const group1 = group = svg.insert("g", "*").call(render, d.parent);

      x.domain([d.parent.x0, d.parent.x1]);
      y.domain([d.parent.y0, d.parent.y1]);

      svg.transition()
        .duration(750)
        .call(t => group0.transition(t).remove()
          .attrTween("opacity", () => d3.interpolate(1, 0))
          .call(position, d))
        .call(t => group1.transition(t)
          .call(position, d.parent));
    }
  });
}

