function RandomSearchTree() {
  this.active = false;

  //consts.
  const font_size = 24;
  const bit_count = 6;      
  const max_count = 16;     // maximum allowed size for the input array.
  const header_diff = 150;  // distance of the 'seperator' from the right side
                            // between the tree-area and the grid-area.
  const cell_size = 40;
  const grid_border = 10;
  const exec_interval = 50;  //ms

  const radius = 20;
  
  var canvas;
  var context;
  
  var speed = 5;
    
  const grid_thickness = 3;
  const grid_color = "#222222";
  

  //global algorithm variables
  var X = [];       //variables to be stored in tree
  var PX = [];      //priority of variables
  var Tree = null;  //the tree itself
  var I = 0;        //counter for X / PX

  var STEP = 0;


  var FINISHED = false;
  var ISPAUSED = true;
    
  this.initialize = function() {
    var content_div = document.getElementById("content")
    var info_div = document.getElementById("info")
    var algo_div = document.getElementById("algo")

    canvas = document.createElement("canvas")
    canvas.setAttribute("id", "canvas");
    canvas.setAttribute("class", "unselectable");
    context = canvas.getContext("2d");
    content_div.appendChild(canvas);

    var width = cell_size * max_count + header_diff + 2 * grid_border;

    content_div.style.width=width + 'px';
    info_div.style.width=(width+10) + 'px';
    algo_div.style.width=(width+10) + 'px';
    
    this.genExample();

    return;

    canvas.width = 1000;
    canvas.height = 500;

    /*
    //Test Tree
    Tree =
      {
        x: 0,
        y: 0,
        v: 1,
        l: {
          x: 0,
          y: 0,
          v: 2,
          l: {
            x: 0,
            y: 0,
            v: 4,
            l: null,
            r: null,
          },
          r: {
            x: 0,
            y: 0,
            v: 5,
            l: null,
            r: null,
          },
        },
        r: {
          x: 0,
          y: 0,
          v: 3,
          l: {
            x: 0,
            y: 0,
            v: 6,
            l: {
              x: 0,
              y: 0,
              v: 8,
              l: null,
              r: null,
            },
            r: {
              x: 0,
              y: 0,
              v: 9,
              l: null,
              r: null,
            }
          },
          r: {
            x: 0,
            y: 0,
            v: 7,
            l: null,
            r: null,
          },
        },
      };
    */

    this.drawTree();

  }
  
  this.restrictKeyPress = function (event) {

    var keycode = event.keyCode;
    var charCode = event.charCode;

    //information source: https://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes

    var valid =
      (keycode >= 8 && keycode <= 46) ||     //control keys
      (charCode >= 48 && charCode <= 57) ||  //numbers
      charCode == 44;                        // ,

    if(!valid)
      event.preventDefault();
  }

  // fills the Array A with the contents of the textbox
  // and draws the grid for k and A[k]
  this.validateAndUpdate = function(textbox) {
    var resStr = textbox.value.split(",");
    X = [];

    var warn = false;
    for (var i = 0; i < resStr.length && i < max_count; i++) {
      X[i] = parseInt(resStr[i]);

      if (X[i] < 0 || isNaN(X[i])) {
        warn = true;
        X[i] = 0;
      }
      else if (X[i] > 20) {
        warn = true;
        X[i] = 20;
      }
    }
    if (resStr.length > max_count)
      warn = true;

    if (warn)
      window.alert("Some elements were cropped to be within 0 and 20 and the total of " + max_count + " elements.");
  }
    
  this.onBlur = function(textbox) {
    this.validateAndUpdate(textbox)
    this.calculateCells();
    this.drawCells();
    this.clear();
  }

  this.clear = function () {
    ISPAUSED = true;
    FINISHED = false;
    Tree = null;
    I = 0;
    add = true;
    last_node = null;
    STEP = 0;
    QUEUE = [];
  }

  this.genExample = function () {
    X = []; 

    // random value inbetween 5 and max_count for the length of the input array.
    var length = Math.floor(Math.random() * (max_count - 5)) + 5; 

    // we fill X with numbers 1,2,3,... length-1 and shuffle them
    // thus creating an example that will be easier to follow then multiple same numbers.
    var arr = [];
    for (i = 0; i < length; i++)
      arr[i] = i + 1;
    for (i = 0; i < length; i++) {
      var index = Math.floor(Math.random() * arr.length);
      X[i] = arr[index];
      arr.splice(index, 1);
    }

    var textbox = document.getElementById("avals").value = X.toString();
    this.calculateCells();
    this.drawCells();
    this.clear();
  }

  this.calculateCells = function () {

    PX = [];
    for (var i = 0; i < X.length; i++)
      PX[i] = Array(bit_count + 1).join("_")

    canvas.height = grid_border * 2 + cell_size * (X.length + 1);
    canvas.width = 800;
  }


  this.drawCells = function () {

    //clear right side of canvas for table.
    context.clearRect(canvas.width - header_diff, 0, header_diff, canvas.height);
    context.font = "bold " + font_size + "px Consolas"
    context.globalCompositeOperation = "source-over";

    //top left corner of the grid
    var x_off = canvas.width - header_diff + grid_border;
    var y_off = grid_border;
    var px_cell_width = cell_size * 2.5;

    //draw top-left box for [x]
    context.beginPath();
    context.strokeStyle = grid_color;
    context.lineWidth = grid_thickness;
    context.rect(x_off, y_off, cell_size, cell_size);
    context.stroke();
    var str_width = context.measureText("x").width;
    context.fillStyle = grid_color;
    context.fillText("x", x_off + (cell_size / 2) - (str_width / 2), y_off + (cell_size / 2) + font_size / 4.0);

    //draw top-right box for [p(x)]
    context.beginPath();
    context.strokeStyle = grid_color;
    context.lineWidth = grid_thickness;
    context.rect(x_off + cell_size, y_off, px_cell_width, cell_size);
    context.stroke();
    str_width = context.measureText("p(x)").width;
    context.fillStyle = grid_color;
    context.fillText("p(x)", x_off + (cell_size + (px_cell_width / 2)) - (str_width / 2), y_off + (cell_size / 2) + font_size / 4.0);

    y_off += cell_size;

    //draw actual content for x and p(x)
    for (var i = 0; i < X.length; i++) {
      
      //draw box for content of [X[i]]
      context.beginPath();
      context.strokeStyle = grid_color;
      context.lineWidth = grid_thickness;
      context.rect(x_off, y_off, cell_size, cell_size);
      context.stroke();
      str_width = context.measureText(X[i]).width;
      context.fillStyle = grid_color;
      context.fillText(X[i], x_off + (cell_size / 2) - (str_width / 2), y_off + (cell_size / 2) + font_size / 4.0);

      //draw box for content of [p(X[i])]
      context.beginPath();
      context.strokeStyle = grid_color;
      context.lineWidth = grid_thickness;
      context.rect(x_off + cell_size, y_off, px_cell_width, cell_size);
      context.stroke();
      str_width = context.measureText(PX[i]).width;
      context.fillStyle = grid_color;
      context.fillText(PX[i], x_off + (cell_size + (px_cell_width / 2)) - (str_width / 2), y_off + (cell_size / 2) + font_size / 4.0);

      y_off += cell_size;
    }

  }

  // recalculates the position of every node on the canvas and then draws the entire tree
  this.drawTree = function() {

    //delete grid-row across entire width of canvas for the cells.
    context.clearRect(0, 0, canvas.width - header_diff, canvas.height);

    context.font = "bold " + font_size + "px Consolas"
    context.globalCompositeOperation = "source-over";

    var curLevel = [Tree];      //The horizontal level (line) for the currently drawn tree.
                                // an array containing the nodes that are placed on said level in order.
                                // or null if there is no node.
    var dont_continue = false;
    var y = 50;                 // y distance from the top of canvas. 

    while (!dont_continue) {
      
      var node_count_on_level = curLevel.length;
      var node_distance_x = (canvas.width - header_diff) / (node_count_on_level + 1);

      for (var i = 0; i < node_count_on_level; i++) {
        if (curLevel[i] == null)
          continue;

        var x = node_distance_x * (i + 1);
        curLevel[i].x = x;
        curLevel[i].y = y;
      }

      // build the curLevel array with all the nodes or 'null' necessary
      // if there are no further nodes (all null) we end the loop.

      dont_continue = true;
      var tmpLevel = [];

      for (var i = 0; i < curLevel.length; i++) {   //go over all nodes on the current level
        var node = curLevel[i];
        if (node == null) {         // if, on current level, one node is null (not present)
          tmpLevel.push(null);      // we push two child nodes as null.
          tmpLevel.push(null);      // this is done for spacing, otherwise the real child nodes are gonne be misplaced.
        }
        else {
          tmpLevel.push(node.l);
          tmpLevel.push(node.r);
          dont_continue = false;
        }
      }
      curLevel = tmpLevel;

      y += radius * 2 + 10;
    }

    this.drawNode(Tree);
  }

  // Draws the passed node at it's given x and y coordinates as well as all
  // of it's sub nodes.
  this.drawNode = function(node) {
    
    if(node == null)
      return;

    //draw line to left sub-node
    if (node.l != null) {
      context.beginPath();
      context.lineWidth = 0.5;
      context.moveTo(node.x, node.y);
      context.lineTo(node.l.x, node.l.y);
      context.stroke();
    }
    //draw line to right sub-node
    if (node.r != null) {
      context.beginPath();
      context.lineWidth = 0.5;
      context.moveTo(node.x, node.y);
      context.lineTo(node.r.x, node.r.y);
      context.stroke();
    }

    //draw white circle with black outline
    context.beginPath();
    context.lineWidth = 1.5;
    context.strokeStyle = "black";
    context.fillStyle = node.c;
    context.arc(node.x, node.y, radius, 0, 2 * Math.PI);
    context.fill();
    context.stroke();

    //write text
    var str_width = context.measureText(node.v).width;
    context.fillStyle = grid_color;
    context.fillText(node.v, node.x - str_width / 2, node.y + font_size / 4.0);

    this.drawNode(node.l);
    this.drawNode(node.r);
  }
  
  // returns a tree node object
  //  c: color
  //  i: index
  //  v: value
  //  r: right sub-node
  //  l: left sub-node
  //  p: parent
  //  x: x-position of node (will be written and updated later)
  //  y: y-position of node (will be written and updated later)
  this.nodeValue = function(value, index) {
    var newNodeValue = {
      c: "white",
      i: index,
      v: value,
      p: null,
      x: 0,
      y: 0,
      l: null,
      r: null,
    };
    return newNodeValue;
  }

  // inserts node into the tree as a leaf at the end.
  // depending on the internal value, we walk down the tree until we reach a 'null' leaf where the node
  // will be attached.
  // Note: The tree is itself just a node.
  this.insert = function (tree, node) {

    if (node == null)
      return;

    var leaf = tree;

    // loop until we reach a null-leaf and then break
    // (could probably also have been done as recursive call, but I think this is easier to read)
    while (true) {

      //continue down the right sub-node
      if (node.v >= leaf.v) {
        //add node
        if (leaf.r == null) {
          leaf.r = node;
          node.p = leaf;
          break;
        } else {
          //continue with right sub-node
          leaf = leaf.r;
          continue;
        }
      }

      //continue down the left sub-node
      if (node.v < leaf.v) {
        //add node
        if (leaf.l == null) {
          leaf.l = node;
          node.p = leaf;
          break;
        } else {
          //continue with right sub-node
          leaf = leaf.l;
          continue;
        }
      }
    }
  }

  // checks if the priorities from the passed node upwards until the root
  // are in order.
  this.checkNode = function (node) {

    //when at root, just return.
    if (node.p == null)
      return true;
    
    //bits are from right to left, as oppose to the expected left to righ
    for (var i = 0; i < bit_count; i++) {
      
      //set bits of priority if they haven't been calculated yet.
      if(PX[node.i][i] == '_')
        PX[node.i] = PX[node.i].replaceAt(i, Math.round(Math.random()).toString());       // if priority on bit-index is '_', set it to random '1' or '0'
      if (PX[node.p.i][i] == '_')
        PX[node.p.i] = PX[node.p.i].replaceAt(i, Math.round(Math.random()).toString());   // same for parent node.

      //compare: if prio(parent) is bigger than prio(node), return true, otherwise false
      //         if equal, continue.
      if (PX[node.p.i][i] > PX[node.i][i])   //compare the chars '1' and '0'
        return true;
      if (PX[node.p.i][i] < PX[node.i][i])   //compare the chars '1' and '0'
        return false;
      
    }
    
    //getting here means both have the exact same priority.
    return true;

  }
  
  String.prototype.replaceAt = function (index, replacement) {
    return this.substr(0, index) + replacement + this.substr(index + replacement.length);
  }

  //method for periodic execution
  // if ISPAUSED is not set it will call stepForward()
  this.runInterval = function () {
    if (randomSearchTree.active) {
      if (!ISPAUSED) {
        randomSearchTree.stepForward();
      }
    }
  }
  //js function for periodic execution of given function...
  this.interval = setInterval(this.runInterval, exec_interval * speed);
  
  this.runAlgorithm = function () {
    if (!FINISHED)
      ISPAUSED = false;
  }

  this.pauseAlgorithm = function () {
    ISPAUSED = true;
  }
  

  //variable to check if in the next step we want to add a new node, or still sort the last one
  var add = true;
  var last_node = null;

  this.stepForward = function () {

    if (FINISHED)
      return;


    if (add) {
      var node = this.nodeValue(X[I], I);

      if (Tree == null)
        Tree = node;
      else {
        this.insert(Tree, node);
      }
      last_node = node;
      I++;
    }

    // if not in add mode, we need to move the last_node up until the tree is OK
    else {

      //when rotating the node upwards, we may have to adjust up to 6 nodes:
      //grandparent, parent, self, sibling, left_child and right_child.

      /*        g
              /   \
             -     p
                 /   \
                s     t
                    /   \
                   l     r

      Notation: g(randparent), p(arent), s(ibling), t(his), l(eft child), r(ight child)
      We want to swap p and t, thus potentially effecting all of the connected nodes.
      */

      var parent = last_node.p;       //last_node cannot be root, or this.checkNode would have returned true.
      var grandparent = parent.p;     //might be null.
      
      var sibling =                   //sibling is the child of the parent, that is not last_node
        (parent.l == last_node) ?     //might also be null.
        parent.r : parent.l;

      var left_child = last_node.l;   //left child, might be null.
      var right_child = last_node.r;  //right child, might be null.


      //now to the swapping:

      if (grandparent != null) {
        //figure out which side the parent was on and set last_node there.
        if (grandparent.v > parent.v)
          grandparent.l = last_node;
        else
          grandparent.r = last_node;
      }

      last_node.p = grandparent;
      last_node.l = null;
      last_node.r = null;
      parent.l = null;
      parent.r = null;

      //now just insert
      this.insert(last_node, parent);
      this.insert(last_node, sibling);
      this.insert(last_node, left_child);
      this.insert(last_node, right_child);
      

      if (parent == Tree)
        Tree = last_node;
    }

    // after adding or moving the node up by one,
    // we check the tree to see if it is now in proper priority order.
    // ... it not, we need to keep on 'sorting' (indicated by add==false).
    add = this.checkNode(last_node);
    if (add)
      last_node.c = "white";
    else
      last_node.c = "lime";

    this.drawCells();
    this.drawTree();
    
    // if add is true (indicating that tree is sorted)
    // and the Index counter is the same as the array length, we are done.
    if(add)
      FINISHED = I == X.length;
  }

  this.stepBackward = function () {

    if (STEP == 0)
      return;
  }

  this.stepFill = function () {
    while(!FINISHED)
      this.stepForward();
  }

  this.stepBackFill = function () {

    STEP = 0;
    FINISHED = false;

    if (QUEUE.length > STEP) {
      Tree = QUEUE[STEP].tree;
      add = QUEUE[STEP].a;
      I = QUEUE[STEP].i;
      last_node = QUEUE[STEP].l;
      PX = QUEUE[STEP].p;
      return;
    }

    this.drawCells();
    this.drawTree();
  }


  this.updateSpeed = function (new_speed) {
    speed = 11 - new_speed;
    clearInterval(randomSearchTree.interval);
    runspeed = exec_interval * speed;
    randomSearchTree.interval = setInterval(randomSearchTree.runInterval, runspeed);
  }
};

randomSearchTree = new RandomSearchTree();