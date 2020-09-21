const bookMap = {
  name: 1,
  type: 'primaryRoot',
  children: [{
    name: 1,
    type: 'folder',
    children: [{
      name: 17,
      type: 'folder',
      children: [{
        name: 4,
        type: 'book',
        children: [{
          name: 8,
          type: 'sheet'
        }, {
          name: 9,
          type: 'sheet'
        }]
      }, {
        name: 5,
        type: 'book', 
        children: [{
          name: 18, 
          type: 'sheet'
        }]
      }]
    }]
  }, {
    name: 2,
    type: 'folder',
    children: [{
      name: 6,
      type: 'book',
      children: [{
        name: 15,
        type: 'sheet'
      }]
    }, {
      name: 7,
      type: 'book', 
      children: [{
        name: 17, 
        type: 'sheet'
      }]
    }]
  }]
};

const sheetLinks = [
  { fileto: 9,
    filefrom: 8,
    fgn: 0,
    cnt: 1
  }, 
  { fileto: 15,
    filefrom: 18,
    fgn: 0,
    cnt: 10
  }, 
];

const bookLinks = [

  { fileto: 4,
    filefrom: 5,
    fgn: 0,
    cnt: 10
  }, 
]

const data = `#% title	triv2sh
#% project	triv2sh
#% shortname	triv2sh
#% rootdir	/home/theo/projects/untangler/excel2app/in
#% sync	False
#% overwrite	True
#% xm_unnamed	True
#% xm_copies	True
#% xm_calendar	True
#% xm_entropy	True
#% xm_outlier	True
#% nopayload	True
#% project_type	formulator
#% xm_global	True
#% check	True
#% optimized	True
#% outfile	out/triv2sh.shm
#% min-size-canon-consistent-set	10
#% xm_consist	True
#% xm_unstyle	True
0	in/triv2sh.xlsx
	datetime
	daynames
#| bookix, sheetix, col, row, formula, value, type, style, from
#+	s	0	1	0	0	1 `;

let linkCnts = `# fake.lnkcnt
0	in/triv.xlsx
	datetime
1 in/other.xlsx
  sheet1
  sheet2
# pattern for book link counts: bookixa bookixb cnt
#+ b 0 1 18
# pattern for sheet link counts: 
bookixa sheetixa bookixb sheetixb cnt
#+ s 0 0 1 0 7
#+ s 0 0 1 1 11`;


const margin = 20;
const treeBoxWidth = 50;
const animationDelay = 500;
// const boxWidth = 75;
let stdBoxHeight = 40;
let stdBoxWidth = 80;
let innerBoxPadding = 5;
let fontSize = 14;
const textPadding = 5;

function Tree(treeData){
  this.treeData = treeData;
  this.edges = sheetLinks;
  this.generationalEdges = [];

  this.activeNode = {};
  this.treeRoot = {};
  this.currentEdges = [];
  this.nodeHash = {};


  this.createPrimaryRoot = function(sheets) {
    this.treeRoot = d3.hierarchy(this.treeData, node => node.children);
    this.treeRoot.descendants().forEach((d,i) => {
      d._children = d.children;
    })
    this.treeRoot.each(node => {
      this.nodeHash[node.data.name] = node;
    });
    this.createEdges(sheets);
  }

  this.createFullTreeRoot = function() {
    this.treeRoot = d3.hierarchy(this.treeData, node => node.children);
    this.transformLinkArray();
  }

  this.calculateShape = function(h, w, sheets) {
    this.createEdges(sheets);

    this.treeRoot.descendants().forEach((node)=> {
      node.children ? node.fontSize = 14 : node.fontSize = 10;
      node.boxHeight = stdBoxHeight;
      node.boxWidth = stdBoxWidth;

      if( node.data.type == 'book' ){
        if (sheets){
          if(node._children ){
            node.children = node._children;
          }
        }
        else {
          node._children = node.children;
          node.children = null;
        }
      } 
    });
  
    let treeDiagram = d3.cluster().size([h, w])(this.treeRoot);

    this.treeRoot.descendants().forEach((node) => {
      if( node.data.type == 'sheet'){
        node.y = node.parent.y + margin;
      }
      if(node.data.type == 'book'){
        if (sheets){
          node.boxHeight = node.children[node.children.length - 1].x - node.children[0].x + stdBoxHeight + 2* margin;
          node.boxWidth = stdBoxWidth + margin * 2;
        }
      }
   })

  
  },

  this.createEdges = function(sheets){
    this.edges = sheets ?  sheetLinks : bookLinks;

    this.edges.forEach((edge) => {
      edge.filefrom = this.nodeHash[edge.filefrom] ? this.nodeHash[edge.filefrom] : 'fgn';
      edge.fileto = this.nodeHash[edge.fileto] ? this.nodeHash[edge.fileto] : 'fgn';
      edge.cnt = parseInt(edge.cnt);
      console.log('recalculated edges');
      
      
    })

    console.log(this.edges);

  }


}


function makeTree(){
  let sheetLevelShown = false;

  const tree = new Tree(bookMap);
  tree.createPrimaryRoot(sheetLevelShown);


  const treeDiv = d3.select('#treeDiagram');
  const tSvg = treeDiv.select('svg');
  let tG = tSvg.append('g');
  // const colorScale = ['red', 'orange', 'yellow', 'green', 'blue'];
  const colors = d3.schemePastel2;
  const nodeTypes = ['root', 'folder', 'book', 'sheet', 'cell'];
  const colorScale = d3.scaleOrdinal().domain(nodeTypes).range(colors).unknown('#333');

  tSvg
    .append('g')
    .attr('class', 'button')
    .attr('transform', 'translate(20,20)');
  const button = d3.select('.button');
  button.append('rect')
    .style('fill', 'lightblue')
    .attr('height', 50)
    .attr('width', 160);   
  button.append('text').text('show sheet level').attr('transform', `translate(10, 30)`);

  button.on('click', () =>{
    sheetLevelShown = !sheetLevelShown;
    console.log('click');
    console.log(`sheetLevelShown: ${sheetLevelShown}`);
    // redraw();
  });

  redraw();

  function redraw(){
    const treeDivWidth = treeDiv.node().getBoundingClientRect().width - 2 * margin;
    const treeGraphHeight = treeDiv.node().getBoundingClientRect().height - 2 * margin;
    const treeGraphWidth = treeDivWidth - 2 * margin - 2 * treeBoxWidth;
  
    tG.remove();
    tG = tSvg.append('g');
    tG.attr("transform", `translate(${0.5 * treeBoxWidth + margin}, ${margin})`)

    tree.calculateShape(treeGraphHeight, treeGraphWidth, sheetLevelShown);

    let gNodes = tG.selectAll('.gNode')
      .data(tree.treeRoot.descendants())
      .enter()
      .append('g')
      .attr('class', 'gNode')
      .attr('transform', d =>`translate(${d.y}, ${d.x})`)
    gNodes = d3.selectAll('.gNode');
    gNodes
      .append('defs')
      .append('clipPath').attr('class', d => 'clip' + '-' + d.data.name)
      .append('rect')
      .attr('width', d => d.boxWidth)
      .attr('height', d => d.boxHeight)
      .attr('x', d => d.y)
      .attr('y', d => d.x );

    gNodes
      .append('rect')
      .attr('width', d => d.boxWidth)
      .attr('height', d => d.boxHeight)
      // .attr('x', -0.5 * boxWidth)
      .attr('y', d => -0.5 * d.boxHeight)
      .attr('clip-path', d => `url(.clip-${d.data.name})`)
      // .style('fill', d => colorScale(d.data.type))
      .style('fill', 'gray')
      .style('opacity', 0.1)
      .style('stroke', d => 'black');
      // .attr('opacity', d => console.log(colorScale(d.data.type)));
    gNodes
      .append("text")
      .attr('clip-path', d => `url(.clip-${d.data.name})`)
      .text(d => (d.data.name + d.data.type))
      .attr("color", d => d.children  ? 'black' : 'gray')
      .attr("vertical-align", "top")
      .attr('transform', function (d)  {
        if(d.data.type == 'book'){
          return `translate(${textPadding}, ${-0.5 * d.boxHeight - textPadding})`
        } else {
          return `translate(${textPadding}, ${0.5 * d.fontSize})` 
        }
      })
      .attr('font-size', d => d.fontSize);

    const gLinks = tG.selectAll('.gLink')
      .data(tree.treeRoot.links())
      .enter()
      .append('line')
      .attr('class', 'gLink')
      .style('stroke', '#ccc')
      .attr("x1", d => d.source.data.type === 'book'? 0 : d.source.y + stdBoxWidth)
      .attr("y1", d => d.source.data.type === 'book'? 0 : d.source.x )
      .attr("x2", d => d.source.data.type === 'book'? 0 : d.target.y)
      .attr("y2", d => d.source.data.type === 'book'? 0 : d.target.x)
      .lower();


    const gEdges = tG.selectAll('.gEdge')
      .data(tree.edges)
      .enter()
      .append('g')
      .attr('class', 'gEdge');

    gEdges
      .append('path')
      .style('stroke-width', d => d.cnt)
      .attr('class', 'inactive')
      .style('fill', 'none')
      .style('opacity', 0.25)
      .attr("d", function (d) {
          return `M ${d.fileto.y + d.fileto.boxWidth} ${d.fileto.x} 
          C ${d.fileto.y + d.fileto.boxWidth + 100} ${d.fileto.x - 20 }, 
            ${d.filefrom.y - 100}                   ${d.filefrom.x + 20}, 
            ${d.filefrom.y} ${d.filefrom.x}`;
      })

    tSvg
      .append('g')
      .attr('class', 'button')
      .attr('transform', 'translate(20,20)');
    const button = d3.select('.button');
    button.append('rect')
      .style('fill', 'lightblue')
      .attr('height', 50)
      .attr('width', 160);   
    button.append('text').text('show sheet level').attr('transform', `translate(10, 30)`);
  
    button.on('click', animateShape);
    
    function animateShape(){
      sheetLevelShown = !sheetLevelShown;
      console.log('click');
      console.log(`sheetLevelShown: ${sheetLevelShown}`);
      // redraw();

      tree.calculateShape(innerHeight, innerWidth, sheetLevelShown);

      gNodes.data(tree.treeRoot.descendants());

      // gNodes.transition()
      //   .duration(1000)
      //   .attr('transform', d =>`translate(${d.y}, ${d.x})`)

      gNodes.exit().remove();
      let newNodes = gNodes.enter().append('g').attr('class', 'gNode').merge(gNodes);

      newNodes.append('rect');

      newNodes.selectAll('rect')
        .transition()
        .duration(1000)
        .attr('width', d => d.boxWidth)
        .attr('height', d => d.boxHeight);
    }
  
  }
}




   