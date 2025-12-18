const svg = d3.select("#vis");
const scroller = scrollama();

/* ---------- NETEJA AMB TRANSICIÓ ---------- */
function clearSVG() {
  svg.selectAll("*")
    .transition()
    .duration(300)
    .style("opacity", 0)
    .remove();
}

/* ---------- CONTROL D’ESCENES ---------- */
function handleStepEnter(response) {

  // estat actiu del text
  d3.selectAll(".step").classed("is-active", false);
  d3.select(response.element).classed("is-active", true);

  clearSVG();

  setTimeout(() => {
    switch (response.index) {
      case 0:
        drawOverview(svg);
        break;
      case 1:
        showDistribution(svg);
        break;
      case 2:
        drawMosaic(svg);
        break;
      case 3:
        drawSankey(svg, false);
        break;
      case 4:
        drawTreemap(svg);
        break;
      case 5:
        drawTreemap(svg);
        break;
    }
  }, 350);
}

/* ---------- INIT ---------- */
function init() {
  scroller
    .setup({
      step: ".step",
      offset: 0.55
    })
    .onStepEnter(handleStepEnter);

  window.addEventListener("resize", scroller.resize);
}

window.addEventListener("load", init);

/* ---------- ESCENA INICIAL ---------- */
drawOverview(svg);
