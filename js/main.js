const svg = d3.select("#vis");
const scroller = scrollama();

function handleStepEnter(response) {
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
      drawSankey(svg, true);
      break;
  }
}

function init() {
  scroller
    .setup({
      step: ".step",
      offset: 0.6
    })
    .onStepEnter(handleStepEnter);

  window.addEventListener("resize", scroller.resize);
}

// 🔥 AIXÒ ÉS OBLIGATORI
window.addEventListener("load", init);

// escena inicial
drawOverview(svg);
