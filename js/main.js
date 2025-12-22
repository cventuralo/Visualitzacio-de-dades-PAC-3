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
      drawCancellationsOverview(svg);
      break;
    case 1:
      // drawMonthlyCancellations(svg);
      drawMonthlyCancellationHeatmap(svg)
      break;
    case 2:
      drawMosaic(svg);
      break;
    case 3:
      drawAdrQuartilesCancellation(svg);
      break;
    case 4:
      drawFamilySankey(svg);
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
drawCancellationsOverview(svg);
