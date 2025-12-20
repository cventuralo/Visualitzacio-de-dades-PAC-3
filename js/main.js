const svg = d3.select("#vis");
const scroller = scrollama();

function clearSVG() {
  svg.selectAll("*")
    .interrupt()
    .remove();
}

function handleStepEnter(response) {

  d3.selectAll(".step").classed("is-active", false);
  d3.select(response.element).classed("is-active", true);

  clearSVG();

  switch (response.index) {
    case 0:
      drawStackedHotelCancellations(svg);
      break;
    case 1:
      // drawMonthlyCancellations(svg);
      drawMonthlyCancellationHeatmap
      break;
    case 2:
      drawMosaic(svg);
      break;
  }
}

function init() {
  scroller
    .setup({
      step: ".step",
      offset: 0.5
    })
    .onStepEnter(handleStepEnter);

  window.addEventListener("resize", scroller.resize);
}

window.addEventListener("load", init);

// escena inicial
drawOverview(svg);
