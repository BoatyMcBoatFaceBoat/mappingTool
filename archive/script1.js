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
          type: 'sheet',
          children: [{
              name: 10,
              type: 'cell'
            },
            {
              name: 11,
              type: 'cell'
            },
            {
              name: 12,
              type: 'cell'
            },
            {
              name: 13,
              type: 'cell'
            },
            {
              name: 14,
              type: 'cell'
            }
          ]
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
        type: 'sheet',
        children: [{
          name: 16, 
          type: 'cell'
        }]
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

const links = [
  // { fileto: 1,
  //   filefrom: 3,
  //   fgn: 0,
  //   cnt: 1
  // },
  // { fileto: 9,
  //   filefrom: 8,
  //   fgn: 0,
  //   cnt: 1
  // },
  // { fileto: 13,
  //   filefrom: 14,
  //   fgn: 0,
  //   cnt: 1
  // },
  // { fileto: 12,
  //   filefrom: 14,
  //   fgn: 0,
  //   cnt: 1
  // }, 
  { fileto: 18,
    filefrom: 8,
    fgn: 0,
    cnt: 1
  }, 
  { fileto: 15,
    filefrom: 5,
    fgn: 0,
    cnt: 1
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
  this.edges = links;
  this.generationalEdges = [];

  this.activeNode = {};
  this.treeRoot = {};
  this.currentEdges = [];
  this.nodeHash = {};


  this.createPrimaryRoot = function() {
    this.treeRoot = d3.hierarchy(this.treeData, node => node.children);
    this.treeRoot.descendants().forEach((d,i) => {
      if(d.data.type == 'sheet'){
        d._parent = null;
        d._children = d.children;
        d.children = null;
        return d;
      } 
    })
    this.createEdges();
  }

  this.createFullTreeRoot = function() {
    this.treeRoot = d3.hierarchy(this.treeData, node => node.children);
    this.transformLinkArray();
  }

  this.calculateShape = function(h, w) {
    let treeDiagram = d3.cluster().size([h, w])(this.treeRoot);
    this.treeRoot.leaves().forEach(leave => {
      // console.log(`x coordinate ${leave.x}`);
      // console.log(`x coordinate parent ${leave.parent.x}`);
      leave.y = leave.parent.y + margin;
      
    });

    this.treeRoot.descendants().forEach((node)=> {
      node.children ? node.fontSize = 14 : node.fontSize = 10;

      if( node.data.type == 'book' ){
        if(node.children ){
          node.boxHeight = node.children[node.children.length - 1].x - node.children[0].x + stdBoxHeight + 2* margin;
          node.boxWidth = stdBoxWidth + margin * 2;
        }
      }
      else {
        node.boxHeight = stdBoxHeight;
        node.boxWidth = stdBoxWidth;


      }
    })
  }

  this.createEdges = function(){
    this.treeRoot.each(node => {
      this.nodeHash[node.data.name] = node;
    });

    this.edges.forEach((edge) => {
      edge.filefrom = this.nodeHash[edge.filefrom] ? this.nodeHash[edge.filefrom] : 'fgn';
      edge.fileto = this.nodeHash[edge.fileto] ? this.nodeHash[edge.fileto] : 'fgn';
      edge.cnt = parseInt(edge.cnt);
      console.log(edge);
      
    })
  },

  this.transformLinkArray = function(){
    edge.filefrom.ancestors().forEach((af, i) => {
      if (af){
        if (edge.fileto.ancestors()[i]){
          this.generationalEdges.push(({
            filefrom: af,
            fileto: edge.fileto.ancestors()[i],
            cnt: edge.cnt
          })) 
        }
      }
    });
  }
    

}


function makeTree(){
  const tree = new Tree(bookMap);
  tree.createPrimaryRoot();


  const treeDiv = d3.select('#treeDiagram');
  const tSvg = treeDiv.select('svg');
  const tG = tSvg.append('g');
  // const colorScale = ['red', 'orange', 'yellow', 'green', 'blue'];
  const colors = d3.schemePastel2;
  const nodeTypes = ['root', 'folder', 'book', 'sheet', 'cell'];
  const colorScale = d3.scaleOrdinal().domain(nodeTypes).range(colors).unknown('#333');

  // const hierarchyLinks = tG.selectAll('.gLink');
  // let gNodes, circles;

  redraw();
  animateLevelDown();

  function redraw(){
    const treeDivWidth = treeDiv.node().getBoundingClientRect().width - 2 * margin;
    const treeGraphHeight = treeDiv.node().getBoundingClientRect().height - 2 * margin;
    const treeGraphWidth = treeDivWidth - 2 * margin - 2 * treeBoxWidth;
    // tSvg.attr('width', treeDivWidth).attr('height', treeGraphHeight);
    tG.attr("transform", `translate(${0.5 * treeBoxWidth + margin}, ${margin})`)

    
    tree.calculateShape(treeGraphHeight, treeGraphWidth);
    // let treeDiagram = d3.cluster().size([treeGraphHeight, treeGraphWidth])(tree.treeRoot);
    console.log(tree.treeRoot);

    // let gNodes = g.selectAll('.gNode')
    // gNodes.remove();
    
    drawTree();
    function drawTree(){
      tG.selectAll('.tNode')
        .data(tree.treeRoot.descendants())
        // .exit()
        // .remove()
        .enter()
        .append('g')
        .attr('class', 'tNode')
        .attr('transform', d =>`translate(${d.y}, ${d.x})`)
      const tNodes = d3.selectAll('.tNode');
      tNodes
        .append('defs')
        .append('clipPath').attr('class', d => 'clip' + '-' + d.data.name)
        .append('rect')
        .attr('width', d => d.boxWidth)
        .attr('height', d => d.boxHeight)
        .attr('x', d => d.y)
        .attr('y', d => d.x );

      tNodes
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
      tNodes
        .append("text")
        .attr('clip-path', d => `url(.clip-${d.data.name})`)
        .text(d => (d.data.name + d.data.type))
        // .attr("text-anchor", 'middle' )
        
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

      const hierarchyLinks = tG.selectAll('.gLink')
        .data(tree.treeRoot.links())
      //   .exit()
      //   .remove()
      // hierarchyLinks
        .enter()
        .append('line')
        .attr('class', 'gLink')
        .style('stroke', '#ccc')
        .attr("x1", d => d.source.data.type === 'book'? 0 : d.source.y + stdBoxWidth)
        .attr("y1", d => d.source.data.type === 'book'? 0 : d.source.x )
        .attr("x2", d => d.source.data.type === 'book'? 0 : d.target.y)
        .attr("y2", d => d.source.data.type === 'book'? 0 : d.target.x)
        .lower();

      tNodes.on('click', showRelations);

      const edgeG = tG.selectAll('#edgeG')
        .data(tree.edges)
        // .exit()
        // .remove()
        .enter()
        .append('g')
        .attr('class', 'edge');

      edgeG
        // .merge(edgeG)
        .append('path')
        .style('stroke-width', d => d.cnt * 0.0005 > 1 ? d.cnt * 0.0005 : 1)
        .attr('class', 'inactive')
        .style('fill', 'none')
        .style('opacity', 0.25)
        // .attr('d',  function (d,i) {
        //   // const draw = d3.line()
        //   //                 .curve(d3.curveBasis);
        //   const midX = (d.filefrom.x + d.fileto.x)/2;
        //   const midY = -75;
        //   const drawRad = d3.lineRadial()
        //                     .curve(d3.curveBundle.beta(betaScale(d.lt)))
        //   return drawRad([[d.filefrom.x, d.filefrom.y], [midX, midY], [d.fileto.x, d.fileto.y]]);
        // });
        .attr("d", function (d) {
          console.log(d);
          // if (d.filefrom === undefined) {
          //   if (d.fileto === undefined){return}
          // }
          // if (fileto === undefined) { return;}
          // else {
            return `M ${d.fileto.y + d.fileto.boxWidth} ${d.fileto.x} 
            C ${d.fileto.y + d.fileto.boxWidth + 100} ${d.fileto.x - 20 }, 
              ${d.filefrom.y - 100}                   ${d.filefrom.x + 20}, 
              ${d.filefrom.y} ${d.filefrom.x}`;
          })
          // })

    }
    


    function showRelations(clicked){
      tree.filterRelations(clicked);
      // console.log(tree.currentEdges);
    }

  }




  function animateLevelUp(){
    const gNodes = d3.selectAll('.gNode');
    gNodes.attr('fill', d => d.data.name == tree.prevRoot.data.name ? console.log(`${tree.prevRoot.data.name}, ${d.data.name}, prevX,Y: ${tree.prevRootX}, ${tree.prevRootY}`) : console.log('nee'));

    gNodes
     .attr('visibility','hidden')
     .attr('transform', d => ` translate(${ h(d.parent.y, d.parent.x) }, ${ v(d.parent.y, d.parent.x)} )`);

    gNodes
     .transition()
     .duration(animationDelay)
     .delay((d,i) => d.data.name == tree.prevRoot.data.name ? 0 : (d.depth ) * animationDelay)
     .attr('visibility', 'visible')
     .attr('transform', d => `translate(${h(d.y, d.x)}, ${ v(d.y, d.x)})`);

    hierarchyLinks
      .transition()
      .duration(animationDelay)
      .delay((d,i) => (d.target.depth) * animationDelay)
      .attr('visibility', 'visible')
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

  }
  function animateLevelDown(){
    const gNodes = d3.selectAll('.gNode');
    const hierarchyLinks = d3.selectAll('gLink');

    gNodes
    .attr('visibility', d => d.parent ? 'hidden': 'visible')
    .attr('transform', d => ` translate(
      ${d.parent ? h(d.parent.y, d.parent.x) : tree.prevRootX}, 
      ${d.parent ? v(d.parent.y, d.parent.x) : tree.prevRootY} 
      )`);
    gNodes
      .transition()
      .duration(animationDelay)
      .delay((d,i) =>  (d.depth ) * animationDelay)
      .attr('visibility', 'visible')
      .attr('transform', d => ` translate(${h(d.y, d.x)}, ${v(d.y, d.x)})`);

    hierarchyLinks
      .transition()
      .duration(animationDelay)
      .delay((d,i) => (d.target.depth) * animationDelay)
      .attr('visibility', 'visible')
      .attr("x2", d => h(d.target.y, d.target.x))
      .attr("y2", d => v(d.target.y, d.target.x));
  }
  
}




    // links.forEach((link) => {
    //   // if (link.data.type !== 'folder'){
    //     link.filefrom = this.nodeHash[link.filefrom] ? this.nodeHash[link.filefrom] : 'fgn';
    //     link.fileto = this.nodeHash[link.fileto] ? this.nodeHash[link.fileto] : 'fgn';
    //     link.cnt = parseInt(link.cnt);
    //   // }
    // }) 

    // this.linkRelations = (links);
 

    // function findRelationLinks(ls){
    //   ls.forEach((link) => {
    //     if(link.fileto.parent && link.filefrom.parent){
    //       this.linkRelations.push(findRelationLinks([link.filefrom.parent, link.fileto.parent]));

    //     } else {
    //       return {
    //           fileto: link.filefrom,
    //           filefrom: link.fileto,
    //           fgn: link.fgn,
    //           cnt: link.cnt
    //         }
          
    //     }
    //   })
    // }
    // findRelationLinks(links);