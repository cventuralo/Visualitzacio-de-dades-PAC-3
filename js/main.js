const svg = d3.select("#vis");
const scroller = scrollama();

scroller
  .setup({
    step: ".step",
    offset: 0.6
  })
  .onStepEnter(response => {
    switch (response.index) {
      case 0:
        drawOverview(svg);
        break;
      case 1:
        showDistribution(svg);
        break;
      case 2:
        drawSankey(svg, false);
        break;
      case 3:
        drawSankey(svg, true);
        break;
    }
  });

// escena inicial
drawOverview(svg);

