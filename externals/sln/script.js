function Scanline() {
  this.active = false;

  //consts.
  const font_size = 24;
  const max_count = 20;
  const header_diff = 70;
  const cell_size = 40;
  const grid_border = 10;
  const exec_interval = 50;  //ms
  
  var canvas;
  var context;
  
  var speed = 5;

  var direction_indicator_thickness = "3";
  var direction_indicator_color = "#636363"
  
  var grid_thickness = "5";
  var grid_color = "#222222";

  var colors = [
    "#07FF00",  //green
    "#0FFFF0",  //turquise
    "#D700FF",  //purple
    "#FF8000",  //orange
  ];

  var default_text_color = "#222222";
  var potential_sequence_color = "#FF8A00";
  var current_selection_color = "#B22222"
  var current_comparator_color = "#FFD700"
  var sequence_color = "#0C9817"
  var finding_sequence_path_color = "#0C9817"


  var grid_Ak = [];
  var grid_k = [];

  //global algorithm variables
  var A = [];
  
  var VON = 1;
  var BIS = 1;
  var MAX = 0;
  var V = 1;
  var K = 1;
  var T = 0;
  var ALL_QUEUE = [];

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
  }
  
  this.restrictKeyPress = function (event) {

    var keycode = event.keyCode;

    //information source: https://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes

    var valid =
      (keycode >= 8 && keycode <= 46) ||   //control keys
      (keycode >= 48 && keycode <= 57) ||  //numbers
      (keycode >= 96 && keycode <= 105) || //numbers on number pad
      keycode == 188 ||                    // ,
      keycode == 173;                      // -

    if(!valid)
      event.preventDefault();
  }

  // fills the Array A with the contents of the textbox
  // and draws the grid for k and A[k]
  this.validateAndUpdate = function(textbox) {
    var resStr = textbox.value.split(",");
    A = [];

    var warn = false;
    for (var i = 0; i < resStr.length && i < max_count; i++) {
      A[i] = parseInt(resStr[i]);

      if (A[i] < -10) {
          warn = true;
          A[i] = -10;
      }
      else if (A[i] > 10) {
          warn = true;
          A[i] = 10;
      }
    }

    if (warn)
      window.alert("Some elements were cropped to be within -10 and 10 and the total of " + max_count + " elements.");
  }
    
  this.onBlur = function(textbox) {
    this.validateAndUpdate(textbox)
    this.calculateCells();
    this.drawCellsAll();
    this.clear();
  }

  this.clear = function () {
    VON = 1;
    BIS = 1;
    MAX = 0;
    V = 1;
    K = 1;
    T = 0;

    FINISHED = false;
    ISPAUSED = true;
    ALL_QUEUE = [];
  }

  this.genExample = function () {
    A = [];
    var length = Math.floor(Math.random() * (max_count - 5)) + 5; //random value inbetween 5 and max_count
    for(i = 0; i < length; i++)
      A[i] = Math.floor(Math.random() * 20) - 10;

    var textbox = document.getElementById("avals").value = A.toString();
    this.calculateCells();
    this.drawCellsAll();
    this.clear();
  }

  this.calculateCells = function () {

    //top left corner of the grid
    var x_off = grid_border + header_diff;
    var y_off = grid_border;

    grid_Ak.length = 0;
    grid_k.length = 0;    // actually grid_k always has the same values, only length changes, but recalculating doesn't take long
                          // and for organization sake, I keep it here.

    for(i = 0; i < A.length; i++) {
      grid_k[i] = this.CellValue(
        x_off + (i * cell_size),
        y_off,
        i + 1);
      grid_Ak[i] = this.CellValue(
        x_off + (i * cell_size),
        y_off + cell_size,
        A[i]);
    }

    canvas.width = grid_border * 2 + A.length * cell_size + header_diff;
    canvas.height = cell_size * 3;
  }

  this.drawCellsAll = function () {
    this.drawCellsAk();
    this.drawCellsK();
  }
  this.drawCellsAk = function() {
    this.drawCells(grid_Ak, "A[k]=");
  }
  this.drawCellsK = function () {
    this.drawCells(grid_k, "  k =");
  }

  // draws an array of cells with a name in the header column.
  this.drawCells = function (cells, name) {

    context.clearRect(0, cells[0].y, canvas.width, cell_size);

    context.font = "bold " + font_size + "px Consolas"
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
    
    var strlen = context.measureText(name).width + grid_border;
    context.fillText(name, cells[0].x - strlen, cells[0].y + (cell_size / 2) + font_size / 4.0)
  }

  // returns a cell object with 4 variables:
  //  x: x-offset
  //  y: y-offset
  //  c: cell-color
  //  v: value
  this.CellValue = function(x_coord, y_coord, value) {
    var newCellValue = {
      x: x_coord,       //
      y: y_coord,       //
      c: "transparent", //c - color
      v: value,         //v - cell value   
    };
    return newCellValue;
  }
  
  //method for periodic execution
  // if ISPAUSED is not set it will call stepForward()
  this.runInterval = function () {
    if (scanline.active) {
      if (!ISPAUSED) {
        scanline.stepForward();
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
  
  this.stepForward = function () {

    if (FINISHED)
      return;
    
    this.updateCells();

    T += A[K - 1];
    if (T <= 0) {
      V = K + 1;
      T = 0;
    }
    else if (T > MAX)
      this.updateLargest();
    this.updateCurrent();
    
    K++;
    FINISHED = K > A.length;
  }

  this.stepBackward = function () {
    FINISHED = false;
    if (K == 1)
      return;
    K--;
    var past = ALL_QUEUE[K - 1];
    V = past.v;
    T = past.t;
    //VON = past.von;
    //BIS = past.bis;
    //MAX = past.max;

    this.updateCells();
    this.updateCurrent();
    this.updateLargest();
  }

  this.stepFill = function () {
    while (!FINISHED)
      this.stepForward();
  }

  this.stepBackFill = function() {
  }


  this.updateSpeed = function (new_speed) {
    speed = 11 - new_speed;
    clearInterval(scanline.interval);
    runspeed = exec_interval * speed;
    scanline.interval = setInterval(scanline.runInterval, runspeed);
  }


  this.updateCurrent = function () {
    var this_v = V;
    if (this_v > K)
      this_v--;
    document.getElementById("current_sum_header").innerHTML =
      "Sum  = " + T + "<br>" +
      "From = " + this_v + "<br>" +
      "To   = " + K;

    ALL_QUEUE[K - 1] = {
      v: this_v,
      //k: K,
      t: T,
      von: VON,
      bis: BIS,
      max: MAX,
    };
  }

  this.updateLargest = function () {
    MAX = T;
    VON = V;
    BIS = K;
    document.getElementById("largest_sum_header").innerHTML =
      "Sum  = " + MAX + "<br>" +
      "From = " + VON + "<br>" +
      "To   = " + BIS;
  }

  this.updateCells = function () {

    for (i = 0; i < grid_k.length; i++)
      grid_k[i].c = "transparent";

    grid_k[K - 1].c = "lavender";
    grid_k[V - 1].c = "lightcoral";
    this.drawCellsK();
  }
};

scanline = new Scanline();