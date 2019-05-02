function LS_Method1() {

  //---------------------------------------------------------------------------
  // Below functionality is the same for all LS_MethodX functions
  //---------------------------------------------------------------------------

  this.selected = "";     //color for cells to be added to current sum
  this.added = "";        //color for cells added to current sum
  this.curser = "";       //color for curser-cell

  this.FINISHED = false;  //algorithm is done
  this.ISPAUSED = true;   //algorithm is running

  this.grid_Ak = [];      //the cells. One cell having variables:
                          //  x(X-coordinate), y(Y-coordinate), c(color), v(value), s(selected)
  this.MAX_SUM = 0;       //largest sum (thus far)
  this.CUR_SUM = 0;       //current sum
  this.STEP = 0;          //which step we're at in the algorithm
  this.VON = 0;           //von wo weg die Summe gilt.
  this.BIS = 0;           //bis wo hin die Summe gilt.

  this.disconnected = false;

  this.setAk = function(Ak, offset) {    
    //reset grid value.
    this.grid_Ak = [];

    //copy passed array over into local Ak and add Y offset.
    var length = Ak.length;
    for (var i = 0; i < length; i++) {
      this.grid_Ak[i] = Object.assign({}, Ak[i]);
      this.grid_Ak[i].y += offset;
    }
  }

  //---------------------------------------------------------------------------
  // Below starts local functionality.
  // Still requires the following functions to be available:
  //  - expectedSteps(n) | basically big O notation
  //  - reset()          | resets all of the local variables below
  //  - stepForward()    | one step in the algorithm
  //---------------------------------------------------------------------------

  this.name = "O(n*2ⁿ)";

  this.expectedSteps = function (n) {
    return Math.pow(2, n) * n;
  }


  var bigLoopCounter = 0;   //the one counting to 2^n  (number of partial sums to check)
  var smallLoopCounter = 0; //the one counting to n    (adding together partial sum);
  var INLOOP = false;
  var last_hit = -1;
  var von = -1;
  var bis = -1;

  this.reset = function () {
    bigLoopCounter = 0;
    smallLoopCounter = 0;
    INLOOP = false;
    last_hit = -1;
    von = -1;
    bis = -1;
    this.disconnected = false;
  }

  this.stepForward = function () {
    if (this.FINISHED)
      return;
    this.STEP++;

    var n = this.grid_Ak.length;

    //when starting a new loop, first, highlight all cells that will be
    //included in the sum.
    if (!INLOOP) {
      for (var i = 0; i < n; i++) {

        //include in current sum
        if ((bigLoopCounter & (1 << i)) != 0) {
          this.grid_Ak[i].c = this.selected;
          this.grid_Ak[i].s = true;
        }
          //not included in current sum
        else {
          this.grid_Ak[i].c = "transparent";
          this.grid_Ak[i].s = false;
        }

      }
      INLOOP = true;
      smallLoopCounter = 0;
      bigLoopCounter++;
      last_hit = -1;
      von = -1;
      bis = -1;
      this.disconnected = false;
      this.CUR_SUM = 0;
    }

    if (this.grid_Ak[smallLoopCounter].s == true) {

      if (last_hit == -1) {
        von = smallLoopCounter;
        last_hit = smallLoopCounter;
      } else if (last_hit == smallLoopCounter - 1) {
        last_hit = smallLoopCounter;
      } else {
        this.disconnected = true;
      }

      this.grid_Ak[smallLoopCounter].c = this.added;
      if (!this.disconnected) {
        this.CUR_SUM += this.grid_Ak[smallLoopCounter].v;
        bis = smallLoopCounter;

        if (this.CUR_SUM >= this.MAX_SUM) {
          this.MAX_SUM = this.CUR_SUM;
          this.BIS = bis;
          this.VON = von;
        }
      }
    }
    else
      this.grid_Ak[smallLoopCounter].c = this.curser;

    if (smallLoopCounter != 0 && this.grid_Ak[smallLoopCounter - 1].s == false) {
      this.grid_Ak[smallLoopCounter - 1].c = "transparent";
    }
    

    smallLoopCounter++;
    INLOOP = smallLoopCounter != n;
    this.FINISHED = this.STEP == this.expectedSteps(n);
  }
}

function LS_Method2() {

  //---------------------------------------------------------------------------
  // Below functionality is the same for all LS_MethodX functions
  //---------------------------------------------------------------------------

  this.selected = "";     //color for cells to be added to current sum
  this.added = "";        //color for cells added to current sum
  this.curser = "";       //color for curser-cell

  this.FINISHED = false;  //algorithm is done
  this.ISPAUSED = true;   //algorithm is running

  this.grid_Ak = [];      //the cells. One cell having variables:
  //  x(X-coordinate), y(Y-coordinate), c(color), v(value), s(selected)
  this.MAX_SUM = 0;       //largest sum (thus far)
  this.CUR_SUM = 0;       //current sum
  this.STEP = 0;          //which step we're at in the algorithm
  this.VON = 0;           //von wo weg die Summe gilt.
  this.BIS = 0;           //bis wo hin die Summe gilt.

  this.setAk = function (Ak, offset) {
    //reset grid value.
    this.grid_Ak = [];

    //copy passed array over into local Ak and add Y offset.
    var length = Ak.length;
    for (var i = 0; i < length; i++) {
      this.grid_Ak[i] = Object.assign({}, Ak[i]);
      this.grid_Ak[i].y += offset;
    }
  }

  //---------------------------------------------------------------------------
  // Below starts local functionality.
  // Still requires the following functions to be available:
  //  - expectedSteps(n) | basically big O notation
  //  - reset()          | resets all of the local variables below
  //  - stepForward()    | one step in the algorithm
  //---------------------------------------------------------------------------

  this.name = "O(n³)  ";

  this.expectedSteps = function (n) {
    return (((1 * Math.pow(n, 3)) + (3 * Math.pow(n, 2)) + (2 * n)) / 6);

    //(((1 * Math.pow(n, 3)) - (2 * Math.pow(n, 2)) + n) / 2) -
    //(((2 * Math.pow(n, 3)) - (3 * Math.pow(n, 2)) + n) / 6);
  }

  var I = 0;
  var J = 0;
  var K = 0;
  var INLOOP_K = false;

  this.reset = function () {
    I = 0;
    J = 0;
    K = 0;
    INLOOP_K = false;
  }

  this.stepForward = function () {
    if (this.FINISHED)
      return;
    this.STEP++;

    var n = this.grid_Ak.length;

    if (!INLOOP_K) {
      //highlight for new loop
      for (var k = 0; k < n; k++) {
        if (k >= I && k <= J) {
          this.grid_Ak[k].c = this.selected;
          this.grid_Ak[k].s = true;
        }
        else {
          this.grid_Ak[k].c = "transparent";
          this.grid_Ak[k].s = false;
        }
      }
    }
    
    if (this.grid_Ak[K].s == true) {
      this.grid_Ak[K].c = this.added;
      this.CUR_SUM += this.grid_Ak[K].v;
    }
    else
      this.grid_Ak[K].c = this.curser;  //actually, should never happen

    K++

    INLOOP_K = K <= J;

    if (K > J) {
      if (this.CUR_SUM > this.MAX_SUM) {
        this.VON = I;
        this.BIS = J;
        this.MAX_SUM = this.CUR_SUM;
      }
      J++;
      K = I;
      this.CUR_SUM = 0;
    }
    if (J >= n) {
      I++;
      J = I;
      K = I;
    }


    this.FINISHED = I == n;
  }
}

function LS_Method3() {

  //---------------------------------------------------------------------------
  // Below functionality is the same for all LS_MethodX functions
  //---------------------------------------------------------------------------

  this.selected = "";     //color for cells to be added to current sum
  this.added = "";        //color for cells added to current sum
  this.curser = "";       //color for curser-cell

  this.FINISHED = false;  //algorithm is done
  this.ISPAUSED = true;   //algorithm is running

  this.grid_Ak = [];      //the cells. One cell having variables:
  //  x(X-coordinate), y(Y-coordinate), c(color), v(value), s(selected)
  this.MAX_SUM = 0;       //largest sum (thus far)
  this.CUR_SUM = 0;       //current sum
  this.STEP = 0;          //which step we're at in the algorithm
  this.VON = 0;           //von wo weg die Summe gilt.
  this.BIS = 0;           //bis wo hin die Summe gilt.

  this.setAk = function (Ak, offset) {
    //reset grid value.
    this.grid_Ak = [];

    //copy passed array over into local Ak and add Y offset.
    var length = Ak.length;
    for (var i = 0; i < length; i++) {
      this.grid_Ak[i] = Object.assign({}, Ak[i]);
      this.grid_Ak[i].y += offset;
    }
  }

  //---------------------------------------------------------------------------
  // Below starts local functionality.
  // Still requires the following functions to be available:
  //  - expectedSteps(n) | basically big O notation
  //  - reset()          | resets all of the local variables below
  //  - stepForward()    | one step in the algorithm
  //---------------------------------------------------------------------------

  this.name = "O(n²)  ";

  this.expectedSteps = function (n) {
    return Math.pow(n, 2) / 2 + (n / 2);
  }

  var I = 0;
  var J = 0;
  var INLOOP_J = false;

  this.reset = function () {
    I = 0;
    J = 0;
    INLOOP_J = false;
  }

  this.stepForward = function () {
    if (this.FINISHED)
      return;
    this.STEP++;

    var n = this.grid_Ak.length;

    if (!INLOOP_J) {
      //highlight for new loop
      for (var j = 0; j < n; j++) {
        if (j >= I) {
          this.grid_Ak[j].c = this.selected;
          this.grid_Ak[j].s = true;
        }
        else {
          this.grid_Ak[j].c = "transparent";
          this.grid_Ak[j].s = false;
        }
      }
    }

    if (this.grid_Ak[J].s == true) {
      this.grid_Ak[J].c = this.added;
      this.CUR_SUM += this.grid_Ak[J].v;
      if (this.CUR_SUM > this.MAX_SUM) {
        this.MAX_SUM = this.CUR_SUM;
        this.VON = I;
        this.BIS = J;
      }
    }
    else
      this.grid_Ak[J].c = this.curser;  //actually, should never happen

    J++

    INLOOP_J = J < n;

    if (J >= n) {
      I++;
      J = I;
      this.CUR_SUM = 0;
    }


    this.FINISHED = I == n;
  }
}

function LS_Method4() {

  //---------------------------------------------------------------------------
  // Below functionality is the same for all LS_MethodX functions
  //---------------------------------------------------------------------------

  this.selected = "";     //color for cells to be added to current sum
  this.added = "";        //color for cells added to current sum
  this.curser = "";       //color for curser-cell

  this.FINISHED = false;  //algorithm is done
  this.ISPAUSED = true;   //algorithm is running

  this.grid_Ak = [];      //the cells. One cell having variables:
  //  x(X-coordinate), y(Y-coordinate), c(color), v(value), s(selected)
  this.MAX_SUM = 0;       //largest sum (thus far)
  this.CUR_SUM = 0;       //current sum
  this.STEP = 0;          //which step we're at in the algorithm
  this.VON = 0;           //von wo weg die Summe gilt.
  this.BIS = 0;           //bis wo hin die Summe gilt.

  this.setAk = function (Ak, offset) {
    //reset grid value.
    this.grid_Ak = [];

    //copy passed array over into local Ak and add Y offset.
    var length = Ak.length;
    for (var i = 0; i < length; i++) {
      this.grid_Ak[i] = Object.assign({}, Ak[i]);
      this.grid_Ak[i].y += offset;
    }
  }

  //---------------------------------------------------------------------------
  // Below starts local functionality.
  // Still requires the following functions to be available:
  //  - expectedSteps(n) | basically big O notation
  //  - reset()          | resets all of the local variables below
  //  - stepForward()    | one step in the algorithm
  //---------------------------------------------------------------------------

  this.name = "O(n)   ";

  this.expectedSteps = function (n) {
    return n;
  }

  var I = 0;
  var von = 0;

  this.reset = function () {
    I = 0;
    von = 0;
  }

  this.stepForward = function () {
    if (this.FINISHED)
      return;
    this.STEP++;

    var n = this.grid_Ak.length;
    
    this.CUR_SUM += this.grid_Ak[I].v;
    if (this.CUR_SUM < 0) {
      von = I + 1;
      this.CUR_SUM = 0;
    }
    else if (this.CUR_SUM > this.MAX_SUM) {
      this.MAX_SUM = this.CUR_SUM;
      this.VON = von;
      this.BIS = I;
    }

    for (var i = 0; i < n; i++) {
      if(i === I)
        this.grid_Ak[i].c = this.curser;
      else if (i >= von && i <= this.BIS)
        this.grid_Ak[i].c = this.added;
      else if (i >= von && i <= I)
        this.grid_Ak[i].c = this.selected;
      else
        this.grid_Ak[i].c = "transparent";
    }

    I++;
    this.FINISHED = I === n;
  }
}

function LargestSum() {

  this.active = false;
  this.selected = "DarkSeaGreen";
  this.added = "Lime";
  this.curser = "PeachPuff";

  const algo_count = 4;
  var algo_method1 = new LS_Method1();
  var algo_method2 = new LS_Method2();
  var algo_method3 = new LS_Method3();
  var algo_method4 = new LS_Method4();

  //consts.
  const font_size = 24;
  const max_count = 20;
  const max_value = 99;
  const header_diff = 100;
  const cell_size = 40;
  const grid_border = 10;
  const exec_interval = 50;  //ms
  
  var canvas;
  var context;
  
  var speed = 5;
    
  var grid_thickness = "5";
  var grid_color = "#222222";
  var grid_selected = "#DD2222";
  
  
  //global algorithm variables
  var A = [];
  var K = [];

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

    //content_div.style.width=width + 'px';
    info_div.style.width = (width + 10) + 'px';
    algo_div.style.width = (width + 10) + 'px';

    for (var i = 0; i < algo_count; i++) {
      this.getAlgo(i).added = this.added;
      this.getAlgo(i).curser = this.curser;
      this.getAlgo(i).selected = this.selected;
    }
    
    this.genExample();
  }

  this.getAlgo = function (i) {
    switch (i) {
      case 0:
        return algo_method1;
      case 1:
        return algo_method2;
      case 2:
        return algo_method3;
      case 3:
        return algo_method4;
      default:
        return null;
    }
  }
  
  this.restrictKeyPress = function (event) {

    var keycode = event.keyCode;
    var charCode = event.charCode;

    //information source: https://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes

    var valid =
      (keycode >= 8 && keycode <= 46) ||     //control keys
      (charCode >= 48 && charCode <= 57) ||  //numbers
      charCode === 44 ||                     // ,
      charCode === 45;                       // -

    if (!valid)
      event.preventDefault();
    else if (keycode === 13)
      this.onBlur(document.getElementById("avals"));
  }

  // fills the Array A with the contents of the textbox
  // and draws the grid for k and A[k]
  this.validateAndUpdate = function(textbox) {
    var resStr = textbox.value.split(",");
    A = [];

    var warn = false;
    for (var i = 0; i < resStr.length && i < max_count; i++) {
      A[i] = parseInt(resStr[i]);

      if (A[i] < -max_value) {
        warn = true;
        A[i] = -max_value;
      }
      else if (A[i] > max_value) {
        warn = true;
        A[i] = max_value;
      }
      else if (A[i] === undefined) {
        warn = true;
        A[i] = 0;
      }
    }

    if (warn) {
      window.alert("Some elements were cropped to be within -" + max_value + " and " + max_value + " and the total of " + max_count + " elements.");
      textbox.value = A.toString();
    }
  }
    
  this.onBlur = function(textbox) {
    this.validateAndUpdate(textbox);
    this.reset();
  }
  this.reset = function () {
    this.calculateCells();
    this.drawCellsAll();
    this.clear();
  }

  this.clear = function () {
    for (var i = 0; i < algo_count; i++) {
      var algo = this.getAlgo(i);
      algo.reset();
      algo.FINISHED = false;
      algo.ISPAUSED = true;
      algo.CUR_SUM = 0;
      algo.MAX_SUM = 0;
      algo.STEP = 0;
      algo.VON = -1;
      algo.BIS = -1;
    }
  }

  this.genExample = function () {
    A = [];
    var length = Math.floor(Math.random() * (max_count - 5)) + 5; //random value inbetween 5 and max_count
    for(i = 0; i < length; i++)
      A[i] = Math.floor(Math.random() * (max_value * 2)) - max_value;

    document.getElementById("avals").value = A.toString();
    this.calculateCells();
    this.drawCellsAll();
    this.clear();
  }

  this.calculateCells = function () {

    //top left corner of the grid
    var x_off = grid_border + header_diff;
    var y_off = grid_border;

    var grid_Ak = [];
    K = [];

    //for all entries...
    for (i = 0; i < A.length; i++) {
      grid_Ak[i] = this.CellValue(
        x_off + (i * cell_size),    //x offset = left-offset of the grid + (current index * cell size)
        y_off,                      //y offset = const top-offset of the grid + cell size (that is to say, one grid row lower)
        A[i]);                      //value    = current value in A.
      K[i] = this.CellValue(
        x_off + (i * cell_size),
        y_off + (4 * cell_size),
        i + 1);
    }


    for (var i = 0; i < algo_count; i++) {
      var algo = this.getAlgo(i);
      algo.setAk(grid_Ak, i * cell_size);
    }

    canvas.width = grid_border * 2 + A.length * cell_size + header_diff;
    canvas.height = cell_size * 6;
  }

  this.drawCellsAll = function () {
    for (var i = 0; i < algo_count; i++) {
      var algo = this.getAlgo(i);
      this.drawCells(algo.grid_Ak, algo.name);
    }
    this.drawCells(K, "k      ");
    this.updateText();
    for (i = 0; i < algo_count; i++) {
      algo = this.getAlgo(i);
      if (algo.VON < 0)
        continue;

      context.beginPath();
      context.strokeStyle = grid_selected;
      context.lineWidth = 3;
      var width = algo.grid_Ak[algo.BIS].x - algo.grid_Ak[algo.VON].x + cell_size;
      context.rect(algo.grid_Ak[algo.VON].x, algo.grid_Ak[algo.VON].y, width, cell_size);
      context.stroke();
    }
  }

  // draws an array of cells with a name in the header column.
  this.drawCells = function (cells, name) {

    context.clearRect(0, cells[0].y, canvas.width, cell_size);

    context.font = "bold " + font_size + "px Consolas";
    context.globalCompositeOperation = "source-over";

    for (i = 0; i < A.length; i++) {
      var cell = cells[i];
      var width = context.measureText(cell.v).width / 2;

      //background color:
      context.beginPath();
      context.rect(cell.x, cell.y, cell_size, cell_size);
      context.fillStyle = cell.c;
      context.fill();

      //border:
      context.beginPath();
      context.strokeStyle = grid_color;
      context.lineWidth = 3;
      context.rect(cell.x, cell.y, cell_size, cell_size);
      context.stroke();

      //text:
      context.fillStyle = grid_color;
      context.fillText(cell.v, cell.x + (cell_size / 2) - width, cell.y + (cell_size / 2) + font_size / 4.0);
    }

    //write name before the grid row.
    var strlen = context.measureText(name).width + grid_border;
    context.fillText(name, cells[0].x - strlen, cells[0].y + (cell_size / 2) + font_size / 4.0)
  }

  // returns a cell object with 4 variables:
  //  x: x-offset
  //  y: y-offset
  //  c: cell-color
  //  v: value
  //  s: selected
  this.CellValue = function(x_coord, y_coord, value) {
    var newCellValue = {
      x: x_coord,       //
      y: y_coord,       //
      c: "transparent", //c - color
      v: value,         //v - cell value   
      s: false,         //s - selected
    };
    return newCellValue;
  }



  this.updateSpeed = function (new_speed) {
    speed = 11 - new_speed;
    clearInterval(largestSum.interval);
    runspeed = exec_interval * speed;
    largestSum.interval = setInterval(largestSum.runInterval, runspeed);
  }

  //method for periodic execution
  // if ISPAUSED is not set it will call stepForward()
  this.runInterval = function () {
    if (largestSum.active) {
      for (var i = 0; i < algo_count; i++) {
        var algo = largestSum.getAlgo(i);
        if (!algo.ISPAUSED)
          algo.stepForward();
      }
      largestSum.drawCellsAll();
    }
  }
  //js function for periodic execution of given function...
  this.interval = setInterval(this.runInterval, exec_interval * speed);
  
  this.runAlgorithm = function (algoNum) {
    var algo = this.getAlgo(algoNum);
    if (!algo.FINISHED)
      algo.ISPAUSED = false;
  }

  this.pauseAlgorithm = function (algoNum) {
    this.getAlgo(algoNum).ISPAUSED = true;
  }
  
  this.stepFill = function (algoNum) {
    var algo = this.getAlgo(algoNum);
    algo.ISPAUSED = true;
    algo.stepForward();
    this.drawCells(algo.grid_Ak, algo.name);
    this.updateText();
  }


  this.updateText = function () {

    for (var i = 0; i < algo_count; i++) {
      var algo = this.getAlgo(i);
      var id = "method_" + (i + 1) + "_header";

      document.getElementById(id).innerHTML =
        "step: " + algo.STEP + "/" + algo.expectedSteps(A.length) + "<br>" +
        "current sum = " + algo.CUR_SUM + ((i == 0 && algo.disconnected) ? ", DISC.<br>" : "<br>") +
        "max sum = " + algo.MAX_SUM + ", from " + (algo.VON < 0 ? "_" : algo.VON + 1) + " to " + (algo.BIS < 0 ? "_" : algo.BIS + 1);
    }
  }
};

largestSum = new LargestSum();