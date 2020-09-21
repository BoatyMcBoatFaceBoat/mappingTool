'use strict';

let linkCnts = `# fake.lnkcnt
0	in/triv.xlsx
	datetime
1 in/other.xlsx
  sheet1
  sheet2
# pattern for book link counts: bookixa bookixb cnt
#+ b 0 1 18
# pattern for sheet link counts: bookixa sheetixa bookixb sheetixb cnt
#+ s 0 0 1 0 7
#+ s 0 0 1 1 11`;

let treeData = {name: 'primaryRoot', type: 'root', children: []};
let latest;
let bookIndex;
let sheetIndex;
let bookLinks = [];
let sheetLinks = [];
let bookNodeRegister = [];
let sheetNodeRegister = [];
let linkCntsPerLine = linkCnts.split('\n');
let mapLines = [];
let pathSections = [];
let curBookIx;
linkCntsPerLine.forEach(line => {
  let hasHash, isLink;
  if (/^#/.test(line)) {
    hasHash = true;
    isLink = /^#\+/.test(line);
  }
  if (!hasHash) {
    const match = line.match(/^(\d+)\s+(.+)$/);
    if (match) {
      bookIndex = +match[1];
      sheetIndex = -1;
      let pathSections = match[2].split('/');
      mergeFrom(treeData, pathSections, bookIndex);
    } else {
      let sheetName = line.trim();
      sheetIndex++;
      latest.children.push({
        name: sheetName,
        type: 'sheet',
        ix: sheetIndex,
        children: null
      });
    } 
  } else if (isLink) {
    let args = line.split(/\s+/);
    args.shift();

    let linkObject = {};
  
    if(args[0]=='s'){
      linkObject.bookixa = +args[1];
      linkObject.sheetixa = +args[2];
      linkObject.bookixb = +args[3];
      linkObject.sheetixb = +args[4];
      linkObject.cnt = +args[5];
      sheetLinks.push(linkObject);
    } else {
      let booklinkObject = {};
      booklinkObject.bookixa = +args[1];
      booklinkObject.bookixb = +args[2];
      booklinkObject.cnt = +args[3];
      bookLinks.push(booklinkObject);
    }
  }
});

function mergeFrom(curNode, pathRest, bookIx) {
  while (pathRest.length) {
    let folder = pathRest.shift();
    let exists = false;
    curNode.children.forEach((ch) => {
      if (ch.name == folder) {
        mergeFrom(ch, pathRest, bookIx);
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
      if (type == 'book') {
        newNode['ix'] = bookIx;
      }
      latest = newNode;
      curNode.children.push(newNode);
      mergeFrom(newNode, pathRest, bookIx);
    }
  }
}


const margin = 20;
const treeBoxWidth = 50;
const animationDelay = 500;
let stdBoxHeight = 40;
let stdBoxWidth = 80;
let innerBoxPadding = 5;
let fontSize = 14;
let sheetLevelShown = false;
const textPadding = 5;


function Tree(treeData){
  this.treeData = treeData;
  this.treeRoot = {};
  this.currentEdges = [];
  this.nodeHash = {};

  this.bookLookUp = [];
  this.bookEdges = [];
  this.sheetEdges = [];

  this.createPrimaryRoot = function(sheets) {
    this.treeRoot = d3.hierarchy(this.treeData, node => node.children);
    this.treeRoot.descendants().forEach((d,i) => {
      d._children = d.children;
    })
       
    this.treeRoot.descendants().forEach(node => {
      if(node.data.type == 'book'){
        { bookNodeRegister[node.data.ix] = node;
          sheetNodeRegister[node.data.ix] = node;
        }
      }
    })

    this.treeRoot.descendants().forEach(node => {
      if(node.data.type == 'sheet') {
        sheetNodeRegister[node.parent.data.ix][node.data.ix] = node;
      }
    });
    this.createEdges();
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
          }
        }
        else {
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
            node.boxHeight = node.children[node.children.length - 1].x - node.children[0].x + stdBoxHeight + 2* margin;
            node.boxWidth = stdBoxWidth + margin * 2;
          }
        }
      }
    })
  },

  this.createEdges = function(){
    sheetLinks.forEach((linkObj) => {
      linkObj.sheeta = sheetNodeRegister[linkObj.bookixa][linkObj.sheetixa];
      linkObj.sheetb = sheetNodeRegister[linkObj.bookixb][linkObj.sheetixb];
      linkObj.cnt = parseInt(linkObj.cnt);
      this.sheetEdges = linkObj;
    })
    bookLinks.forEach((linkObj) => {
      linkObj.booka = bookNodeRegister[linkObj.bookixa];
      linkObj.bookb = bookNodeRegister[linkObj.bookixb];

      linkObj.cnt = parseInt(linkObj.cnt);
      this.bookEdges = linkObj;
    })
  }
}


function makeTree(){
 let tree = new Tree(treeData);
 tree.createPrimaryRoot();
 tree.calculateShape(10, 10, true);
}
