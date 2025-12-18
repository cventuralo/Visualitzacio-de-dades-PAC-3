const scroller = scrollama();

scroller
  .setup({
    step: ".step",
    offset: 0.5
  })
  .onStepEnter(response => {
    if (response.index === 0) drawScene1();
    if (response.index === 1) drawScene2();
    if (response.index === 2) drawScene3();
    if (response.index === 3) drawScene3(); // escena final manté el Sankey
  });

drawScene1(); // escena inicial

