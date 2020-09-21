// use merge to control enter and update methods, the problem is that exit remove does not work

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
  { sheetixb: 9,
    sheetixa: 8,
    fgn: 0,
    cnt: 1
  }, 
  { sheetixb: 15,
    sheetixa: 18,
    fgn: 0,
    cnt: 10
  }, 
];



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

const bookLinks = [

  { bookixa: 4,
    sheetixa: 8,
    bookixb: 5,
    sheetixb: 9,
    // fgn: 0,
    cnt: 10
  }, 
  { bookixa: 6,
    sheetixa: 15,
    bookixb: 7,
    sheetixb: 17,
    // fgn: 0,
    cnt: 10
  }, 
  { bookixa: 5,
    sheetixa: 18,
    bookixb: 4,
    sheetixb: 9,
    // fgn: 0,
    cnt: 10
  }, 
]


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
  this.edges = bookLinks;
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

  this.calculateShape = function(h, w, sheets) {
    // this.createEdges(sheets);

    this.treeRoot.descendants().forEach((node)=> {
      node.children ? node.fontSize = 14 : node.fontSize = 10;
      node.boxHeight = stdBoxHeight;
      node.boxWidth = stdBoxWidth;

      if( node.data.type == 'book' ){
        if (sheets){
          if(node._children ){
            node.children = node._children;
            node._children = null;
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
          // node.y = node.children[0].y - margin;
          node.boxHeight = node.children[node.children.length - 1].x - node.children[0].x + stdBoxHeight + 2* margin;
          node.boxWidth = stdBoxWidth + margin * 2;
        }
      }
   })
   console.log("current tree root:")

   console.log(this.treeRoot.descendants());



  
  },

  this.createEdges = function(sheets){
    // this.edges = sheets ?  sheetLinks : bookLinks;

    this.edges.forEach((edge) => {
      edge.sheetixa = this.nodeHash[edge.sheetixa] ? this.nodeHash[edge.sheetixa] : 'fgn';
      edge.sheetixb = this.nodeHash[edge.sheetixb] ? this.nodeHash[edge.sheetixb] : 'fgn';
      edge.bookixa = this.nodeHash[edge.bookixa] ? this.nodeHash[edge.bookixa] : 'fgn';
      edge.bookixb = this.nodeHash[edge.bookixb] ? this.nodeHash[edge.bookixb] : 'fgn';
      edge.cnt = parseInt(edge.cnt);
      // console.log('recalculated edges');

      
    })

    // console.log(this.edges);

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

    // tree.calculateShape(treeGraphHeight, treeGraphWidth, sheetLevelShown);

    animateShape();

    tSvg
      .append('g')
      .attr('class', 'menu')
      .attr('transform', 'translate(20,20)');
    const menu = d3.select('.menu');
    const button = menu.append('g');
    button.append('rect')
      .style('fill', 'lightblue')
      .attr('height', 50)
      .attr('width', 160);   
    button.append('text').text('show sheet level').attr('transform', `translate(10, 30)`);

    button.on('click', animateShape);

    menu.append('text').attr('class', 'sheetStatus').text(sheetLevelShown);

    

    function animateShape(){
      sheetLevelShown = !sheetLevelShown;
      d3.select('.sheetStatus').text(sheetLevelShown);

      tree.calculateShape(treeGraphHeight, treeGraphWidth, sheetLevelShown) ;

      let dataBoundNodes = tG.selectAll('.gNode')
        .data(tree.treeRoot.descendants());

      let dataBoundLinks = tG.selectAll('.gLink')
        .data(tree.treeRoot.links());

      let dataBoundEdges = tG.selectAll('.gEdge')
        .data(tree.edges);


      let gNodes = dataBoundNodes
        .enter()
        .append('g')
        .attr('class', 'gNode');

      let gLinks = dataBoundLinks
        .enter()
        .append('g')
        .attr('class', 'gLink')
      
      gLinks
        .append('line')
        .style('stroke', '#ccc');
      
      

      let gEdges = dataBoundEdges
        .enter()
        .append('g')
        .attr('class', 'gEdge');

        dataBoundEdges.exit().remove();

      gEdges
        .append('path')
        .attr('class', 'inactive')
        .style('fill', 'none')
        .style('opacity', 0.25)

      gNodes
        .append('defs')
        .append('clipPath')
        .append('rect');

      gNodes
        .append('rect')
        // .style('fill', d => colorScale(d.data.type))
        .style('fill', 'gray')
        .style('opacity', 0.1)
        .style('stroke', d => 'black')
        .attr('class', 'treeBox');

        // .attr('opacity', d => console.log(colorScale(d.data.type)));
      gNodes
        .append("text")
        .attr("vertical-align", "top");




      let mergedNodes = gNodes.merge(dataBoundNodes);
      let mergedLinks = gLinks.merge(dataBoundLinks);
      let mergedEdges = gEdges.merge(dataBoundEdges);


      mergedNodes
        .transition()
        .duration(1000)
        .attr('transform', d =>`translate(${d.y}, ${d.x})`);
      mergedNodes.select('clipPath')
        .attr('class', d => 'clip' + '-' + d.data.name);
      mergedNodes.select('clipPath')
        .select('rect')
        .attr('width', d => d.boxWidth)
        .attr('height', d => d.boxHeight)
        .attr('x', d => d.y)
        .attr('y', d => d.x );
      mergedNodes.select('.treeBox')
        .attr('width', d => d.boxWidth)
        .attr('height', d => d.boxHeight)
        // .attr('x', -0.5 * boxWidth)
        .attr('y', d => -0.5 * d.boxHeight)
        // .style('visibility', d =>console.log(d.data.type))
        .attr('clip-path', d => `url(.clip-${d.data.name})`);

      mergedNodes.select('text')
        .attr('clip-path', d => `url(.clip-${d.data.name})`)
        .text(d => (d.data.name + d.data.type))
        .attr("color", d => d.children  ? 'black' : 'gray')
        .attr('transform', function (d)  {
          if(d.data.type == 'book'){
            return `translate(${textPadding}, ${-0.5 * d.boxHeight - textPadding})`
          } else {
            return `translate(${textPadding}, ${0.5 * d.fontSize})` 
          }
        })
        .attr('font-size', d => d.fontSize);


      mergedLinks
        .select('line')
        .transition()
        .duration(1000)
        .attr("x1", d => d.source.data.type === 'book'? 0 : d.source.y + stdBoxWidth)
        .attr("y1", d => d.source.data.type === 'book'? 0 : d.source.x )
        .attr("x2", d => d.source.data.type === 'book'? 0 : d.target.y)
        .attr("y2", d => d.source.data.type === 'book'? 0 : d.target.x)
        // .lower();

      mergedEdges
        .select('path')
        .style('stroke-width', d => d.cnt)
        .transition()
        .duration(1000)
        .attr("d", function (d) {
            let from, to
            if (sheetLevelShown) {
              from = 'sheetixa';
              to = 'sheetixb';
            } else {
              from = 'bookixa';
              to = 'bookixb';
            }
        
        return `M ${d[to].y + d[to].boxWidth} ${d[to].x} 
                C ${d[to].y + d[to].boxWidth + 100} ${d[to].x - 20 }, 
                  ${d[from].y - 100}                   ${d[from].x + 20}, 
                  ${d[from].y} ${d[from].x}`;
      })

      // `M ${d.sheetixb.y + d.sheetixb.boxWidth} ${d.sheetixb.x} 
      // C ${d.sheetixb.y + d.sheetixb.boxWidth + 100} ${d.sheetixb.x - 20 }, 
      //   ${d.sheetixa.y - 100}                   ${d.sheetixa.x + 20}, 
      //   ${d.sheetixa.y} ${d.sheetixa.x}`;


    }
  
  }
}




   