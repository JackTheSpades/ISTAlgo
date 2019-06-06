function RandomSearchTree() {
  this.active = false;

  //consts.
  const font_size = 24;
  const bit_count = 6;
  const max_bit_count = 6;  //
  const max_count = 16;     // maximum allowed size for the input array.
  const header_diff = 150;  // distance of the 'seperator' from the right side
                            // between the tree-area and the grid-area.
  const cell_size = 40;
  const grid_border = 10;
  const exec_interval = 50;  //ms

  const radius = 20;
  const grid_thickness = 3;
  const grid_color = "#222222";
  
  var canvas;
  var context;
  
  var speed = 5;
    
  

  //global algorithm variables
  var X = [];               //variables to be stored in tree
  var PX = [];              //priority of variables
  var P_VisibleQueue = [];
  var Tree = null;          //the tree itself
  var I = 0;                //counter for X / PX

  var STEP = 0;


  var FINISHED = false;
  var ISPAUSED = true;
    
  this.initialize = function() {
    var content_div = document.getElementById("content");
    var info_div = document.getElementById("info");
    var algo_div = document.getElementById("algo");

    canvas = document.createElement("canvas");
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

    //canvas.width = 1000;
    //canvas.height = 500;

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

    //this.drawTree();

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
    this.validateAndUpdate(textbox);
    this.clear();
    this.calculateCells();
    this.drawCells();
  }

  this.clear = function () {
    ISPAUSED = true;
    FINISHED = false;
    Tree = null;
    I = 0;
    add = true;
    last_node = null;
    STEP = 0;
  }

  this.genExample = function () {
    X = [];

    // random value inbetween 5 and max_count for the length of the input array.
    var length = Math.floor(Math.random() * (max_count - 5)) + 5;

    // we fill X with numbers 1,2,3,... length-1 and shuffle them
    // thus creating an example that will be easier to follow then multiple same numbers.
    var arr = [];
    for (var i = 0; i < length; i++)
      arr[i] = i + 1;
    for (i = 0; i < length; i++) {
      var index = Math.floor(Math.random() * arr.length);
      X[i] = arr[index];
      arr.splice(index, 1);
    }

    document.getElementById("avals").value = X.toString();
    this.clear();
    this.calculateCells();
    this.drawCells();
  };

  this.clearPrior = function () {
    this.clear();
    this.calculateCells();
    this.drawCells();
  };

  this.shuffle = function () {
    this.clear();
    
    var PX_Old = PX;
    var X_Old = X;

    var length = X.length;
    X = [];
    PX = [];
    
    var indices = [];
    for (var i = 0; i < length; i++)
      indices[i] = i;
       
    for (i = 0; i < length; i++) {

      var sub_index = Math.floor(Math.random() * indices.length);
      var main_index = indices[sub_index];
      indices.splice(sub_index, 1);

      X[i] = X_Old[main_index];
      PX[i] = PX_Old[main_index];
    }

    document.getElementById("avals").value = X.toString();
    canvas.height = grid_border * 2 + cell_size * (X.length + 1);
    canvas.width = 800;
    this.drawCells();
  }

  this.calculateCells = function () {

    PX = [];
    //P_VisibleQueue = [];
    //P_VisibleQueue = new Array(X.length).fill(0);
    for (var i = 0; i < X.length; i++) {
      PX[i] = [];
    }


    canvas.height = grid_border * 2 + cell_size * (X.length + 1);
    canvas.width = 800;
  }


  this.drawCells = function () {

    //clear right side of canvas for table.
    context.clearRect(canvas.width - header_diff, 0, header_diff, canvas.height);
    context.font = "bold " + font_size + "px Consolas";
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

      var px_text = new Array(max_bit_count).fill("_");
      for (var j = 0; j < PX[i].length && j < max_bit_count; j++)
        px_text[j] = PX[i][j];
      var litteral = px_text.join('');

      //draw box for content of [p(X[i])]
      context.beginPath();
      context.strokeStyle = grid_color;
      context.lineWidth = grid_thickness;
      context.rect(x_off + cell_size, y_off, px_cell_width, cell_size);
      context.stroke();
      str_width = context.measureText(litteral).width;
      context.fillStyle = grid_color;
      context.fillText(litteral, x_off + (cell_size + (px_cell_width / 2)) - (str_width / 2), y_off + (cell_size / 2) + font_size / 4.0);

      y_off += cell_size;
    }

  }

  // recalculates the position of every node on the canvas and then draws the entire tree
  this.drawTree = function() {

    //delete grid-row across entire width of canvas for the cells.
    context.clearRect(0, 0, canvas.width - header_diff, canvas.height);

    context.font = "bold " + font_size + "px Consolas";
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

  this.write = function (lines) {

    var x = 5;
    var y = 5;

    context.fillStyle = "#000000";
    context.font = "bold 18px TimesNewRoman";
    context.globalCompositeOperation = "source-over";

    for (var i = 0; i < lines.length; i++) {
      context.fillText(lines[i], x, y + 15 + font_size / 4.0);
      y += 18;
    }
  }

  this.arrow = function (fromx, fromy, tox, toy) {
    var headlen = 10;   // length of head in pixels
    var angle = Math.atan2(toy - fromy, tox - fromx);
    context.beginPath();
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    context.moveTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    context.stroke();
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
    //we loop until we get two different bits.
    for (var i = 0; true; i++) {
      
      //set bits of priority if they haven't been calculated yet.
      if (PX[node.i].length == i) {
        PX[node.i].push(Math.round(Math.random()).toString());     // if priority on bit-index is '_', set it to random '1' or '0'
        //P_VisibleQueue[node.i]++;
      }
      if (PX[node.p.i].length == i) {
        PX[node.p.i].push(Math.round(Math.random()).toString());   // same for parent node.
        //P_VisibleQueue[node.p.i]++;
      }

      //compare: if prio(parent) is bigger than prio(node), return true, otherwise false
      //         if equal, continue.
      if (PX[node.p.i][i] > PX[node.i][i])   //compare the chars '1' and '0'
        return true;
      if (PX[node.p.i][i] < PX[node.i][i])   //compare the chars '1' and '0'
        return false;
      
    }
  }
  
  //method for periodic execution
  // if ISPAUSED is not set it will call stepForward()
  this.runInterval = function () {
    if (randomSearchTree.active) {
      if (!ISPAUSED) {
        randomSearchTree.stepForward();
      }
      if (FINISHED)
        ISPAUSED = true;
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



  this.animationInterval = null;
  this.animationContext = null;

  this.moveNode = function () {
    randomSearchTree.animationContext.counter++;
    if (randomSearchTree.animationContext.counter === 100)
      randomSearchTree.stepForward();
    else {
      randomSearchTree.drawCells();
      randomSearchTree.drawTree();

      randomSearchTree.animationContext.node.x += randomSearchTree.animationContext.dx;
      randomSearchTree.animationContext.node.y += randomSearchTree.animationContext.dy;

      randomSearchTree.drawNode(randomSearchTree.animationContext.node);
    }
  }  



  //variable to check if in the next step we want to add a new node, or still sort the last one
  var add = true;
  var last_node = null;
  var compare_node = null;
  var insert_done = false;


  this.stepForward = function () {

    if (this.animationInterval !== null) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
      this.animationContext = null;
    }

    if (this.animationContext !== null) {
      this.animationInterval = setInterval(this.moveNode, 10);
      return;
    }

    if (FINISHED)
      return;



    var text = [];
    var next_compare_node = null;
    var left = false;

    if (add) {
      var node = this.nodeValue(X[I], I);

      if (Tree === null) {
        Tree = node;
        insert_done = true;
        text.push(`Inserted Root: ${X[I]}`);
      } else {

        if (compare_node === null) {
          this.insert(Tree, node);
          text.push(`Inserted: ${X[I]}`);
          insert_done = true;
        } else {

          text.push(`Inserting: ${X[I]}`);
          text.push(`Compare with: ${compare_node.v}`);
          if (compare_node.v <= node.v) {
            text.push(`Value greater-equal. Going right.`);
            next_compare_node = compare_node.r;
            left = false;
          } else {
            text.push(`Value less. Going left.`);
            next_compare_node = compare_node.l;
            left = true;
          }

          node.x = compare_node.x + radius * 2;
          node.y = compare_node.y;
          node.c = "rgba(0,0,128,0.25)";

          if (next_compare_node !== null && ISPAUSED === true) {
            this.animationContext = {
              node: node,
              counter: 0,
              dx: (next_compare_node.x - compare_node.x) / 100,
              dy: (next_compare_node.y - compare_node.y) / 100,
            };
          }
          else if (next_compare_node === null && ISPAUSED === true) {

            var pow = 0;
            var tmp = compare_node.p;
            while (tmp !== null) {
              pow++;
              tmp = tmp.p;
            }

            var node_count_on_level = Math.pow(2, pow);
            var node_distance_x = (canvas.width - header_diff) / (node_count_on_level + 1);
            var index = Math.round((compare_node.x / node_distance_x) - 1) * 2;
            node_count_on_level *= 2;
            node_distance_x = (canvas.width - header_diff) / (node_count_on_level + 1);

            var x = node_distance_x * (index + (left ? 1 : 2));

            this.animationContext = {
              node: node,
              counter: 0,
              dx: (x - compare_node.x - 2 * radius) / 100,
              dy: (radius * 2 + 10) / 100,
            };

          }
        }


      }

      if (insert_done) {
        last_node = node;
        I++;
      }
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

    STEP++;

    // after adding or moving the node up by one,
    // we check the tree to see if it is now in proper priority order.
    // ... it not, we need to keep on 'sorting' (indicated by add==false). 
    add = this.checkNode(last_node);
    if (add) {
      if (insert_done) {
        last_node.c = "lime";
        insert_done = false;
        text.push(`Priority Less. Node stays.`);
        next_compare_node = Tree;
      } else
        last_node.c = "white";
    }
    else {
      last_node.c = "crimson";
      text.push(`Priority More. Rotate up.`);
    }

    this.drawCells();
    this.drawTree();

    //-------------------------------------
    
    this.drawNode(node);

    //-------------------------------------

    this.write(text);

    compare_node = next_compare_node;

    // if add is true (indicating that tree is sorted)
    // and the Index counter is the same as the array length, we are done.
    if (add)
      FINISHED = I === X.length;
  }

  this.stepBackward = function () {
    ISPAUSED = true;
    if (STEP == 0)
      return;
    var prev_STEP = STEP - 1;
    this.clear();
    this.drawCells();
    this.drawTree();
    while (prev_STEP > STEP)
      this.stepForward();
  }

  this.stepFill = function () {
    while(!FINISHED)
      this.stepForward();
  }

  this.stepBackFill = function () {
    this.clear();
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