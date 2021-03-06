// fix issue with resizing in Tree class
// reusing merge instead of join to write shorter functions for enter and update and to allow for smooth transitions on both occasions

// const bookMap = {
//   name: 1,
//   type: 'primaryRoot',
//   children: [{
//     name: 1,
//     type: 'folder',
//     children: [{
//       name: 17,
//       type: 'folder',
//       children: [{
//         name: 4,
//         type: 'book',
//         children: [{
//           name: 8,
//           type: 'sheet'
//         }, {
//           name: 9,
//           type: 'sheet'
//         }, 
//         {
//           name: 10,
//           type: 'sheet'
//         }]
//       }, {
//         name: 5,
//         type: 'book', 
//         children: [{
//           name: 18, 
//           type: 'sheet'
//         }]
//       }]
//     }]
//   }, {
//     name: 2,
//     type: 'folder',
//     children: [{
//       name: 6,
//       type: 'book',
//       children: [{
//         name: 15,
//         type: 'sheet'
//       }]
//     }, {
//       name: 7,
//       type: 'book', 
//       children: [{
//         name: 17, 
//         type: 'sheet'
//       }]
//     }]
//   }]
// };

// tree



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

let treeData = {name: 'primaryRoot', type: 'root', children: []};
let latest;
let excelNameLookup = [];
let bookIndex = 0;
let sheetIndex = 0;
let bookLookup = [];
let bookLins = [];
let sheetLins = [];

linkCntsPerLine = linkCnts.split('\n');
let mapLines = [];
let pathSections = [];
linkCntsPerLine.forEach(line => {
  if (!(/^#.*/).test(line)) { // all file path information
    mapLines.push(line); // purely for logging
    if ((/^\d/).test(line)) { // file paths
      let [wholeString, bookIx, path] = /^(\d+)\s(.+\.xlsx)$/.exec(line);
      bookIndex = +(bookIx);
      pathSections = path.split('/');
      bookLookup.push({
        'bookIndex': bookIndex,
        'name': pathSections[pathSections.length - 1]
      });
      mergeFrom(treeData, pathSections);
      sheetIndex = 0;

    } else {
      let [wholeString, arg, sheet] = /^(\s*)(.+)$/.exec(line);
      bookLookup.push({
        'bookIndex': bookIndex,
        'sheetIndex': sheetIndex,
        'name': sheet
      });
      sheetIndex++;
      // mergeFrom(latest, sheet);
      latest.children.push({
        name: sheet,
        type: 'sheet',
        children: null
      });
    }
  } else { // all book/sheetlink info
    if((/^#\+.*/).test(line)){

      // let [wholeline, type, ...rest] = /^#\+(?:\s(\w+))+$/.exec(line);

      line = line.replace('#+', "").split(' ');
      line.shift();

      let linkObject = {};
      linkObject.bookixa= +line[1];
      linkObject.bookixb = +line[2];
      linkObject.cnt = +line[3];

    
      if(line[0]=='s'){
        linkObject.bookixa = +line[1];
        linkObject.sheetixa = +line[2];
        linkObject.bookixb = +line[3];
        linkObject.sheetixb = +line[4];
        linkObject.cnt = +line[5];
      }

      bookLins.push(linkObject);


    }
  };
  console.log(bookLookup);

  function mergeFrom(curNode, pathRest) {
    console.log(treeData);
    while (pathRest.length) {
      let folder = pathRest.shift();
      let exists = false;
      curNode.children.forEach((ch) => {
        if (ch.name == folder) {
          mergeFrom(ch, pathRest);
          exists = true;
        }
      });
      if (!(exists)) {
        let type = folder.split('.').includes('xlsx') ? 'book' : 'folder';

        let newNode = {
          name: folder,
          type: type,
          children: []
        };
        latest = newNode;
        curNode.children.push(newNode);
        mergeFrom(newNode, pathRest);
      }
    }
  }
})

console.log(bookLins);

// const bookLinks = [

//   { bookixa: 4,
//     sheetixa: 8,
//     bookixb: 5,
//     sheetixb: 18,
//     // fgn: 0,
//     cnt: 10
//   }, 
//   { bookixa: 6,
//     sheetixa: 15,
//     bookixb: 7,
//     sheetixb: 17,
//     // fgn: 0,
//     cnt: 10
//   }, 
//   { bookixa: 5,
//     sheetixa: 18,
//     bookixb: 4,
//     sheetixb: 9,
//     // fgn: 0,
//     cnt: 10
//   }, 
//   { bookixa: 4,
//     sheetixa: 10,
//     bookixb: 4,
//     sheetixb: 9,
//     // fgn: 0,
//     cnt: 10
//   }, 
// ]


const margin = 20;
const treeBoxWidth = 50;
const animationDelay = 500;
// const boxWidth = 75;
let stdBoxHeight = 40;
let stdBoxWidth = 80;
let innerBoxPadding = 5;
let fontSize = 14;
let sheetLevelShown = false;
const textPadding = 5;


function Tree(treeData){
  this.treeData = treeData;
  this.edges = bookLins;
  this.treeRoot = {};
  this.currentEdges = [];
  this.nodeHash = {};

  this.createPrimaryRoot = function(sheets) {
    this.treeRoot = d3.hierarchy(this.treeData, node => node.children);
    this.treeRoot.descendants().forEach((d,i) => {
      d._children = d.children;
    })
    this.treeRoot.each(node => {
      // for (let ref of excelNameLookup){
      //   if (ref.name === node.data.name ){
      //     this.nodeHash[]
      //   }
      // }
      this.nodeHash[node.data.name] = node;
    });
    this.createEdges(sheets);
  }

  this.calculateShape = function(h, w, sheets) {
    this.treeRoot.descendants().forEach((node)=> {
      node.children ? node.fontSize = 14 : node.fontSize = 10;
      node.boxHeight = stdBoxHeight;
      node.boxWidth = stdBoxWidth;

      if( node.data.type == 'book' ){
        if (sheets){
          if(node._children ){
            node.children = node._children;
            // node._children = null;
          }
        }
        else {
          // node._children = node.children;
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
        if(node.children){
          if (sheets){
            // node.y = node.children[0].y - margin;
            node.boxHeight = node.children[node.children.length - 1].x - node.children[0].x + stdBoxHeight + 2* margin;
            node.boxWidth = stdBoxWidth + margin * 2;
          }
        }
      }
    })
  },

  this.createEdges = function(sheets){
    let matchedLookupa = [];
    let matchedLookupb = [];
    this.edges.forEach((edge) => {
      bookLookup.forEach((lookup) => {
        console.log(edge.bookixa);
        console.log(`lookup.bookIndex: ${lookup.bookIndex}`);

        if( edge.bookixa === lookup.bookIndex ){
          matchedLookupa.push(lookup);
          matchedLookupa.forEach(ml => {
            if(edge.sheetIndex){
              if(ml.sheetIndex == edge.sheetixa){
                return edge.sheetixa = this.nodeHash[ml.name];
              }
            } else {
              return edge.bookixa = this.nodeHash[ml.name];
            }
          })
        }

        if( edge.bookixb === lookup.bookIndex ){
          matchedLookupb.push(lookup);
          matchedLookupb.forEach(ml => {
            if(edge.sheetIndex){
              if(ml.sheetIndex == edge.sheetixb){
                return  edge.sheetixb =  this.nodeHash[ml.name];;
              } else {
                return edge.bookixb = this.nodeHash[ml.name];
              }
            }
          })
        }

      })
     
      //  this.nodeHash[edge.bookixa] ? this.nodeHash[edge.bookixa] : 'fgn';
      // edge.bookixb = this.nodeHash[edge.bookixb] ? this.nodeHash[edge.bookixb] : 'fgn';
      // edge.cnt = parseInt(edge.cnt);
    })

    // this.edges.forEach((edge) => {
    //   edge.sheetixa = this.nodeHash[edge.sheetixa] ? this.nodeHash[edge.sheetixa] : 'fgn';
    //   edge.sheetixb = this.nodeHash[edge.sheetixb] ? this.nodeHash[edge.sheetixb] : 'fgn';
    //   edge.bookixa = this.nodeHash[edge.bookixa] ? this.nodeHash[edge.bookixa] : 'fgn';
    //   edge.bookixb = this.nodeHash[edge.bookixb] ? this.nodeHash[edge.bookixb] : 'fgn';
    //   edge.cnt = parseInt(edge.cnt);
    // })

    console.log(`this.edges: `);
    console.log(this.edges);
    console.log(this.nodeHash);


  }

}


function makeTree(){
  // const tree = new Tree(bookMap);
  const tree = new Tree(treeData);

  tree.createPrimaryRoot(sheetLevelShown);
  const treeDiv = d3.select('#treeDiagram');
  const tSvg = treeDiv.select('svg');
  let tG = tSvg.append('g');
  // const colorScale = ['red', 'orange', 'yellow', 'green', 'blue'];
  const colors = d3.schemePastel2;
  const nodeTypes = ['root', 'folder', 'book', 'sheet', 'cell'];
  const colorScale = d3.scaleOrdinal().domain(nodeTypes).range(colors).unknown('#333');
  const t = tSvg.transition().duration(1000);

  const toolDiv = d3.select('body')
                .append('div')
                .attr('class', 'toolTip')
                .style('opacity', 0);

  const menuDiv = d3.select('body')
  .append('div')
  .attr('class', 'menu');
  const menu = d3.select('.menu');
  const button = menu.append('div');
  button.append('button')
        .text('show sheet level');   
  menu.append('p').attr('class', 'sheetStatus').text(sheetLevelShown);

  const showTooltip = function(d) {
    toolDiv
      .transition().duration(200)
      .style('opacity', 0.8);
    toolDiv.html('name: ' + d.data.name + '<br>' + 'type: ' + d.data.type)
      .style('left', (d3.event.pageX) + "px")
      .style("top", (d3.event.pageY - 28) + "px");
  }

  function hideTooltip(d){
    toolDiv
    .transition().duration(100)
    .style("opacity", 0);	
  }

  window.addEventListener("resize", redraw);
  redraw();

  function redraw(){
    const treeDivWidth = treeDiv.node().getBoundingClientRect().width - 2 * margin;
    const treeGraphHeight = treeDiv.node().getBoundingClientRect().height - 2 * margin;
    const treeGraphWidth = treeDivWidth - 2 * margin - 2 * treeBoxWidth;
    tG.attr("transform", `translate(${0.5 * treeBoxWidth + margin}, ${margin})`)

    animateShape();
    button.on('click', function removeOrAddLevel(d) {
      sheetLevelShown = !sheetLevelShown;
      animateShape()
    });

    function animateShape(){
      d3.select('.sheetStatus').text(sheetLevelShown);
      tree.calculateShape(treeGraphHeight, treeGraphWidth, sheetLevelShown) ;

      let dataBoundNodes = tG.selectAll('.gNode')
        .data(tree.treeRoot.descendants());
      
      // dataBoundNodes.select('rect').exit().transition(t).attr('color', 'red');
      dataBoundNodes.exit().remove();
      let dataBoundLinks = tG.selectAll('.gLink')
        .data(tree.treeRoot.links());
      dataBoundLinks.exit().remove();

      let dataBoundEdges = tG.selectAll('.gEdge')
        .data(tree.edges);
      dataBoundEdges.exit().remove();

      let gNodes = dataBoundNodes
        .enter()
        .append('g')
        .attr('class', 'gNode');
      gNodes
        .on('mouseover', showTooltip)
        .on('mouseout', hideTooltip)
        .append('rect')
        .attr('class', 'treeBox')
        .attr('fill', 'grey')
        .style('opacity', 0.3)
        .style('stroke', d => 'black');
      gNodes.append('text');
      gNodes.append('clipPath')
        .attr('id', d => `clip${d.data.name}`)
        .append('rect');

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
      gEdges
        .append('path')
        .attr('class', 'inactive')
        .style('fill', 'none')
        .style('opacity', 0.25)

      let mergedNodes = gNodes.merge(dataBoundNodes);
      let mergedLinks = gLinks.merge(dataBoundLinks);
      let mergedEdges = gEdges.merge(dataBoundEdges);

      mergedNodes
        .transition(t)
        .attr('transform', d =>`translate(${d.y}, ${d.x})`)
      mergedNodes
        .select('rect')
        .style('stroke', d => 'black')
        .attr('width', d => d.boxWidth)
        .attr('height', d => d.boxHeight)
        .attr('y', d => -0.5 * d.boxHeight);
      mergedNodes
        .select('clipPath')
        .select('rect')
        .attr('width', d => d.boxWidth - 2 * textPadding)
        .attr('height', d => d.boxHeight)
        .attr('y', d => -0.5 * d.boxHeight);
      mergedNodes
        .select('text')
        .attr('clip-path', d => `url(#clip${d.data.name})`)
        .text(d => (d.data.name + d.data.type))
        .attr("color", d => d.children  ? 'black' : 'gray')
        .attr('transform', function (d) {
          if(d.data.type == 'book'){
            if(sheetLevelShown){
              return `translate(${textPadding}, ${-0.5 * d.boxHeight - textPadding})`;
            }
          } 
          return `translate(${textPadding}, ${0.5 * d.fontSize})`;
        })
        .attr('font-size', d => d.fontSize);

      mergedLinks
        .select('line')
        .transition(t)
        // .duration(1000)
        .attr("x1", d => d.source.data.type === 'book' ? 0 : d.source.y + stdBoxWidth)
        .attr("y1", d => d.source.data.type === 'book' ? 0 : d.source.x)
        .attr("x2", d => d.source.data.type === 'book' ? 0 : d.target.y)
        .attr("y2", d => d.source.data.type === 'book' ? 0 : d.target.x);

      mergedEdges
        .select('path')
        .style('stroke-width', d => d.cnt)
        .transition(t)
        // .duration(1000)
        .attr("d", function (d) {
          let from, to
          if (sheetLevelShown) {
            from = 'sheetixa';
            to = 'sheetixb';
          } else {
            from = 'bookixa';
            to = 'bookixb';
            if(d[from] === d[to]) { return; }
          }
        
          return `M ${d[to].y + d[to].boxWidth} ${d[to].x} 
                  C ${d[to].y + d[to].boxWidth + 100} ${d[to].x - 20 }, 
                    ${d[from].y - 100}                   ${d[from].x + 20}, 
                    ${d[from].y} ${d[from].x}`;
        })
    }
  }
}
