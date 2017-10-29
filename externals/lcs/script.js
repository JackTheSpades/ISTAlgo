function CommonSubsequence() {
  this.active = false;
  var minStringLength = 1;
  var maxStringLength = 16;
  var verticalString = "";
  var horizontalString = "";
  var rows = 0;
  var cols = 0;
  var g_width = 0;
  var g_height = 0;
  var cell_size = 40;
  var grid_border = 10;

  var content_div;
  var info_div;
  var algo_div;

  var canvas;
  var context;

  var matrix;
  var vStringGrid;
  var hStringGrid;

  var font_size = 24;

  var exec_interval = 50;  //ms
  var speed = 5;

  var sequence_length = 0;
  var sequence = "";

  var direction_indicator_thickness = "3";
  var direction_indicator_color = "#636363"

  var initial_zeroes_color = "#636363"

  var grid_thickness = "5";
  var grid_color = "#222222";

  var default_text_color = "#222222";
  var potential_sequence_color = "#FF8A00";
  var current_selection_color = "#B22222"
  var current_comparator_color = "#FFD700"
  var sequence_color = "#0C9817"
  var finding_sequence_path_color = "#0C9817"

  //global algorithm variables
  var ROW = 1;
  var COL = 1;
  var FILLED = false;
  var FINISHED = false;
  var QUEUE = [];
  var ISPAUSED = true;
  var GOTOEND = false;
  var DRAW = true;

  var verticalDemos = [];
  var horizontalDemos = [];
  var demoIndex;

  this.fillDemos = function() {
    verticalDemos.push("exoampmle");
    horizontalDemos.push("texamplqe");
    
    verticalDemos.push("eauldgocryhitvhm");
    horizontalDemos.push("nhalfgvodrikthmo");

    verticalDemos.push("marltinqborzwan");
    horizontalDemos.push("maxrtinbtorzaxn");

    verticalDemos.push("samestring");
    horizontalDemos.push("samestring");

    verticalDemos.push("onlyxshared");
    horizontalDemos.push("kbgwxfgvz");

    demoIndex = Math.floor(Math.random() * verticalDemos.length);
  }();

  this.initialize = function() {
    content_div = document.getElementById("content")
    info_div = document.getElementById("info")
    algo_div = document.getElementById("algo")

    canvas = document.createElement("canvas")
    canvas.setAttribute("id", "canvas");
    canvas.setAttribute("class", "unselectable");
    context = canvas.getContext("2d");
    content_div.appendChild(canvas);

    var width = cell_size*(maxStringLength+1) + 2*grid_border + 1.75*cell_size;
    content_div.setAttribute("style","width:" + width + "px");
    content_div.style.width=width + 'px';
    info_div.setAttribute("style","width:" + (width+10) + "px");
    info_div.style.width=(width+10) + 'px';
    algo_div.setAttribute("style","width:" + (width+10) + "px");
    algo_div.style.width=(width+10) + 'px';

    document.getElementById("str1").setAttribute("maxlength", maxStringLength);
    document.getElementById("str2").setAttribute("maxlength", maxStringLength);

    this.genExample();

    vStringGrid = this.initVStringArray();
    hStringGrid = this.initHStringArray();
    matrix = this.init2DArray(horizontalString.length + 1, verticalString.length + 1);

    this.redrawCanvas();
  }

  this.drawGrid = function() {
    context.font = "bold "+font_size+"px Consolas"

    //base grid operation
    context.globalCompositeOperation = "destination-over";

    var x_off=0;
    var y_off=0;

    context.beginPath();
    context.lineWidth=grid_thickness;
    context.strokeStyle=grid_color;

    //matrix
    x_off = 1.75*cell_size + grid_border;
    y_off = grid_border;

    for(var r = 0; r < g_height; r+= cell_size) {
      for(var c = 0; c < g_width; c+= cell_size) {
        context.rect(x_off + c, y_off + r, cell_size, cell_size); 
      }
    }

    context.stroke();
    
    context.beginPath();
    context.lineWidth=grid_thickness;
    context.strokeStyle=grid_color;

    //horizontal string
    x_off = 2.75*cell_size + grid_border;
    y_off = g_height + cell_size;
    for(var h = 0; h < horizontalString.length*cell_size; h+= cell_size) {
      context.rect(x_off + h, y_off, cell_size, cell_size); 
    }
    context.stroke();
    
    //arrow line
    context.beginPath();
    context.lineWidth=grid_thickness/4;
    context.strokeStyle=grid_color;
    context.fillStyle=grid_color;

    context.moveTo(x_off,y_off-0.375*cell_size);
    context.lineTo((horizontalString.length+3)*cell_size,y_off-0.375*cell_size);
    context.stroke();

    //arrowhead
    context.beginPath();
    context.moveTo((horizontalString.length+3)*cell_size,y_off-0.375*cell_size);
    context.lineTo((horizontalString.length+2.75)*cell_size,y_off-0.475*cell_size);
    context.lineTo((horizontalString.length+2.75)*cell_size,y_off-0.275*cell_size);
    context.closePath();
    context.stroke();
    context.fill();

    //string variable
    context.font = font_size*0.75+"px Consolas"
    context.fillText("j", x_off-0.6*cell_size, y_off-0.25*cell_size);


    context.beginPath();
    context.lineWidth=grid_thickness;
    context.strokeStyle=grid_color;

    //vertical string
    x_off = grid_border;
    y_off = grid_border;
    for(var v = 0; v < verticalString.length*cell_size; v+= cell_size) {
      context.rect(x_off, y_off + v, cell_size, cell_size); 
    }  
    context.stroke();

    //arrow line
    context.beginPath();
    context.lineWidth=grid_thickness/4;
    context.strokeStyle=grid_color;
    context.fillStyle=grid_color;

    context.moveTo(x_off+1.375*cell_size,y_off);
    context.lineTo(x_off+1.375*cell_size,y_off+verticalString.length*cell_size);
    context.stroke();

    //arrowhead
    context.beginPath();
    context.moveTo(x_off+1.375*cell_size,y_off);
    context.lineTo(x_off+1.275*cell_size,y_off+0.25*cell_size);
    context.lineTo(x_off+1.475*cell_size,y_off+0.25*cell_size);
    context.closePath();
    context.stroke();
    context.fill();

    //string variable
    context.font = font_size*0.75+"px Consolas"
    context.fillText("i", x_off+1.25*cell_size, y_off+(verticalString.length+0.6)*cell_size);


    context.font = "bold "+font_size+"px Consolas"
  }

  this.fillVStringGrid = function() {
    for (var i = 0; i < verticalString.length; i++) {
      var x = vStringGrid[verticalString.length - 1 - i].x;
      var y = vStringGrid[verticalString.length - 1 - i].y + (i*cell_size);
      var v = vStringGrid[verticalString.length - 1 - i].v;
      var width = context.measureText(v).width/2;

      context.fillStyle = vStringGrid[verticalString.length - 1 - i].f.color;

      if(vStringGrid[verticalString.length - 1 - i].f.currCell) {
        context.beginPath();
        stroke = 9;
        context.strokeStyle=current_selection_color;
        context.lineWidth=stroke;

        context.globalCompositeOperation = "source-over";
        context.rect(x, y, cell_size, cell_size);
        context.stroke();
        context.globalCompositeOperation = "destination-over";
      }

      context.fillText(v, x + (cell_size/2) - width, y + (cell_size/2) + font_size/4.0);
    }
  }

  this.fillHStringGrid = function() {  
    for (var i = 0; i < horizontalString.length; i++) {
      var x = hStringGrid[i].x + (i*cell_size);
      var y = hStringGrid[i].y;
      var v = hStringGrid[i].v;
      var width = context.measureText(v).width/2;

      context.fillStyle = hStringGrid[i].f.color;

      if(hStringGrid[i].f.currCell) {
        context.beginPath();
        stroke = 9;
        context.strokeStyle=current_selection_color;
        context.lineWidth=stroke;

        context.globalCompositeOperation = "source-over";
        context.rect(x, y, cell_size, cell_size);
        context.stroke();
        context.globalCompositeOperation = "destination-over";
      }

      context.fillText(v, x + (cell_size/2) - width, y + (cell_size/2) + font_size/4.0);
    }
  }

  this.drawMatrix = function() {
    for(x = 0; x < verticalString.length+1; x++) {
      for(y = 0; y < horizontalString.length+1; y++) {
        var cellval = matrix[x][y];
        this.drawMatrixCell(cellval);
      }
    }
  }

  this.drawMatrixCell = function(cellvalue) {
    var x = cellvalue.x;
    var y = cellvalue.y;
    var v = cellvalue.v;

    context.fillStyle = cellvalue.f.color;

    var m_x_off = 1.75*cell_size + grid_border;
    var m_y_off = grid_border;

    var c_x_center = (cell_size/2) - context.measureText(v).width/2;
    var c_y_center = (cell_size/2) + 7.5;

    context.fillText(v, x*cell_size + m_x_off + c_x_center, (verticalString.length-y)*cell_size + m_y_off + c_y_center);

    if(cellvalue.f.currCell) {
      x_off = 1.75*cell_size + grid_border;
      y_off = grid_border;

      var stroke = 6;

      context.beginPath();
      context.lineWidth=stroke;
      context.strokeStyle=current_comparator_color;

      rect_size = cell_size - (2*stroke);

      context.rect(x_off + (x-1)*cell_size + stroke, y_off + (verticalString.length-(y-1))*cell_size + stroke, rect_size, rect_size);
      context.rect(x_off + (x-1)*cell_size + stroke, y_off + (verticalString.length-y)*cell_size + stroke, rect_size, rect_size);
      context.rect(x_off + x*cell_size + stroke, y_off + (verticalString.length-(y-1))*cell_size + stroke, rect_size, rect_size);

      context.stroke();

      context.beginPath();
      stroke = stroke+3;
      context.strokeStyle=current_selection_color;
      context.lineWidth=stroke;

      context.globalCompositeOperation = "source-over";
      context.rect(x_off + x*cell_size, y_off + (verticalString.length-y)*cell_size, cell_size, cell_size);
      context.stroke();
      context.globalCompositeOperation = "destination-over";
    }

    if(cellvalue.p !== null) {
      context.globalCompositeOperation = "source-over";

      var x_center = x_off + x*cell_size + (cell_size/2);
      var y_center = y_off + (verticalString.length-y)*cell_size + (cell_size/2);

      var parent_x_center = x_off + cellvalue.p.x*cell_size + (cell_size/2);
      var parent_y_center = y_off + (verticalString.length-cellvalue.p.y)*cell_size + (cell_size/2);

      context.beginPath();
      context.strokeStyle=direction_indicator_color;

      if(cellvalue.f.color === finding_sequence_path_color && cellvalue.p.x !== 0 && cellvalue.p.y !== 0) context.strokeStyle=finding_sequence_path_color;

      context.lineWidth=direction_indicator_thickness;

      if(x_center !== parent_x_center) {
        x_center = x_center - (cell_size/4);
        parent_x_center = parent_x_center + (cell_size/4);
      }
      if(y_center !== parent_y_center) {
        y_center = y_center + (cell_size/4);
        parent_y_center = parent_y_center - (cell_size/4);
      }

      context.moveTo(x_center,y_center);
      context.lineTo(parent_x_center,parent_y_center);

      context.stroke();
      context.globalCompositeOperation = "destination-over";
    }
  }

  this.redrawCanvas = function() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if(DRAW) {
      this.drawGrid();
      this.fillVStringGrid();
      this.fillHStringGrid();
      this.drawMatrix();  
    }
  }


  this.newGrid = function() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    verticalString = document.getElementById("str1").value.replace(/[^a-z]/g, '');
    rows = verticalString.length + 1;

    horizontalString = document.getElementById("str2").value.replace(/[^a-z]/g, '');
    cols = horizontalString.length + 1;

    g_height = rows*cell_size;
    g_width = cols*cell_size;

    canvas.width = g_width + 2*grid_border + 1.75*cell_size;
    canvas.height = g_height + 2*grid_border + 1.75*cell_size;

    vStringGrid = this.initVStringArray(verticalString);
    hStringGrid = this.initHStringArray(horizontalString);
    matrix = this.init2DArray(horizontalString.length + 1, verticalString.length + 1);

    ROW = 1;
    COL = 1;
    FILLED = false;
    FINISHED = false;
    QUEUE = [];
    ISPAUSED = true;
    GOTOEND = false;

    sequence_length = 0;
    sequence = "";
    this.updateSequence();
    this.updateSequenceLength();

    for(i = 0; i < (verticalString.length*horizontalString.length); i++) {
      QUEUE.push(this.stepFill);
    }

    this.drawGrid();
    this.fillVStringGrid();
    this.fillHStringGrid();
    this.drawMatrix();
  }

  this.finishGrid = function() {
    ISPAUSED = true;
    DRAW = false;
    while(!FINISHED) {
      this.stepForward();
    }
    DRAW = true;
    ISPAUSED = false;
    this.redrawCanvas();
    this.stepForward();
  }

  this.restrictKeyPress = function(event) {
    var key = String.fromCharCode(event.keyCode);
    if(key.replace(/[^a-z]/g, '') === '') {
      event.preventDefault();
    }
  }

  this.genExample = function() {
    verticalString = verticalDemos[demoIndex];
    horizontalString = horizontalDemos[demoIndex];
    document.getElementById("str1").value = verticalString;
    document.getElementById("str2").value = horizontalString;

    this.newGrid();

    demoIndex++;
    if(demoIndex == verticalDemos.length)
      demoIndex = 0;
  }

  this.randomize = function(textBoxID) {
    if(textBoxID === "str1") {
      verticalString = this.generateString();

      //mix char from horizontal string into vertical string
      //ensuring the common subsequence is at least 1 when randomly generated

      if(horizontalString.length > 0) {
        var parasite_char = horizontalString.charAt(Math.floor(Math.random() * horizontalString.length));
        var host_index = Math.floor(Math.random() * verticalString.length)
        verticalString = verticalString.substr(0, host_index) + parasite_char + verticalString.substr(host_index+1);
      }

      document.getElementById(textBoxID).value = verticalString;
    }

    if(textBoxID === "str2") {
      horizontalString = generateString();

      //mix char from vertical string into horizontal string
      //ensuring the common subsequence is at least 1 when randomly generated

      if(verticalString.length > 0) {
        var parasite_char = verticalString.charAt(Math.floor(Math.random() * verticalString.length));
        var host_index = Math.floor(Math.random() * horizontalString.length)
        horizontalString = horizontalString.substr(0, host_index) + parasite_char + horizontalString.substr(host_index+1);
      }

      document.getElementById(textBoxID).value = horizontalString;
    }

    this.newGrid();
  }

  this.generateString = function() {
    var string = "";
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".toLowerCase();

    var min = minStringLength;
    var max = maxStringLength;

    var length = Math.floor(Math.random() * (max-min+1)) + min

    for(var i=0; i < length; i++) string += characters.charAt(Math.floor(Math.random() * characters.length));

    return string;
  }

  this.validateAndUpdate = function(textbox) {

    textbox.value = textbox.value.replace(/[^a-z]/g, '');
    var string = textbox.value;

    if(string.length < minStringLength) {
      window.prompt("Oops","The input is too short! Let me generate a valid string for you.");
      this.randomize(textbox.id)
    }
  }

  this.onPaste = function(textbox) {
    setTimeout(function() {
      commonSubsequence.validateAndUpdate(textbox)
    }, 10);
  }

  this.onBlur = function(textbox) {
    this.validateAndUpdate(textbox)
  }

  this.initVStringArray = function() {
    x_off = grid_border;
    y_off = grid_border;

    var arr = [];
      for(i = 0; i < verticalString.length; i++) {
          arr[i] = this.CellValue(x_off, y_off, verticalString.charAt(i));  //x and y are not the coordinates, but the offset
      }

      return arr;
  }

  this.initHStringArray = function() {
    x_off = 2.75*cell_size + grid_border;
    y_off = g_height + cell_size;

    var arr = [];
      for(i = 0; i < horizontalString.length; i++) {
          arr[i] = this.CellValue(x_off, y_off, horizontalString.charAt(i));  //x and y are not the coordinates, but the offset
      }

      return arr;
  }

  this.init2DArray = function(width, height) {
    var arr = [];
      for(i = 0; i < height; i++) {
          arr[i] = [];
          for(j = 0; j < width; j++) {
            arr[i][j] = this.CellValue(j, i, "");
          }
      }

      for(i = 0; i < height; i++) {
        arr[i][0].v = 0;
        arr[i][0].f.color = initial_zeroes_color;
      }
    for(i = 0; i < width; i++) {
      arr[0][i].v = 0;
      arr[0][i].f.color = initial_zeroes_color;
    }
      return arr;
  }

  this.CellValue = function(x_coord, y_coord, value) {
    var newCellValue = {
          x : x_coord,
          y : y_coord,  
          v : value,    //cell value
          p : null,    //parent
          f : {      //flags
            color: default_text_color,     
            newChar: false,
            currCell: false
          }    
     };
     return newCellValue;
  }

  this.runInterval = function(){
    if(commonSubsequence.active) {
      if(!ISPAUSED) {
        commonSubsequence.stepForward();
      }
        clearInterval(commonSubsequence.interval);
        runspeed = exec_interval*speed;
        commonSubsequence.interval = setInterval(commonSubsequence.runInterval, runspeed);
    }
  }
  this.interval = setInterval(this.runInterval, exec_interval*speed);

  this.runAlgorithm = function() {
    if(!FINISHED)
      ISPAUSED = false;  
  }

  this.pauseAlgorithm = function() {
    ISPAUSED = true;
  }

  this.stepForward = function() {
    if(FILLED === false) {
      (QUEUE.shift())();    
    } else {
      this.stepFind();
    }  
  }

  this.stepBackward = function() {
    ISPAUSED = true;
    if(stepCount <= 0) return;
    if(FILLED === false) {
      this.stepBackFill();
    } else {
      this.stepBackFind();
    }
  }

  this.stepFill = function() {
    //console.log((ROW-1) + " | " + (COL-1) + " <--> " + horizontalString.charAt(COL-1) + " | " + verticalString.charAt(ROW-1));
    if(horizontalString.charAt(COL-1) == verticalString.charAt(ROW-1)) {
      var num = +((matrix[ROW-1][COL-1].v)+1)
      matrix[ROW][COL].v = num;
      matrix[ROW][COL].f.color = potential_sequence_color;
      sequence_length = Math.max(sequence_length, num);
      commonSubsequence.updateSequenceLength();
      matrix[ROW][COL].p = matrix[ROW-1][COL-1];
      matrix[ROW][COL].f.newChar = true;
    } else {
      if(+(matrix[ROW][COL-1].v) > +(matrix[ROW-1][COL].v)) {
        matrix[ROW][COL].v = matrix[ROW][COL-1].v;
        matrix[ROW][COL].p = matrix[ROW][COL-1];
      } else {
        matrix[ROW][COL].v = matrix[ROW-1][COL].v;
        matrix[ROW][COL].p = matrix[ROW-1][COL];
      }
    }

    matrix[ROW][COL].f.currCell = true;
    vStringGrid[ROW-1].f.currCell = true;
    hStringGrid[COL-1].f.currCell = true;

    if(!GOTOEND) {
      commonSubsequence.redrawCanvas();
    }
    
    matrix[ROW][COL].f.currCell = false;
    vStringGrid[ROW-1].f.currCell = false;
    hStringGrid[COL-1].f.currCell = false;

    if(COL == horizontalString.length) {
      COL = 1;
      ROW++;
    } else {
      COL++;
    }

    if(ROW === rows && COL === 1) {
      FILLED = true;
      return;
    }
  }

  this.stepBackFill = function() {
    ISPAUSED = true;

    if(COL == 1) {
      if(ROW == 1) {
        return;
      }
      COL = horizontalString.length;
      ROW--;
    } else {
      COL--;
    }

    matrix[ROW][COL].v = "";
    matrix[ROW][COL].f.color = default_text_color;
    matrix[ROW][COL].p = null;

    if(matrix[ROW][COL].f.newChar) {
      sequence_length--;
      this.updateSequenceLength();
    }

    //get previous cell
    var prevCol = COL;
    var prevRow = ROW;

    if(COL == 1) {
      prevCol = horizontalString.length;
      prevRow--;
    } else {
      prevCol = COL-1;
    }

    if(prevCol != 0 && prevRow != 0) {
      matrix[prevRow][prevCol].f.currCell = true;
      vStringGrid[prevRow-1].f.currCell = true;
      hStringGrid[prevCol-1].f.currCell = true;
    }

    this.redrawCanvas();

    if(prevCol != 0 && prevRow != 0) {
      matrix[prevRow][prevCol].f.currCell = false;
      vStringGrid[prevRow-1].f.currCell = false;
      hStringGrid[prevCol-1].f.currCell = false;
    }

    QUEUE.unshift(this.stepFill);
  }

  this.stepFind = function() {
    if(FILLED === false) {
      ISPAUSED = true;
      return;
    }

    if(COL === 1 && ROW === rows) {
      COL = cols-1;
      ROW = rows-1;
    }

    if(COL === 0 || ROW === 0) {
      //finished whole algorithm
      ISPAUSED = true;
      FINISHED = true;
      matrix[ROW][COL].f.currCell = true;
      this.redrawCanvas();
      matrix[ROW][COL].f.currCell = false;
      return;
    }

    if(matrix[ROW][COL].f.newChar && sequence.length < sequence_length) {
      sequence = horizontalString.charAt(matrix[ROW][COL].x-1) + sequence;
      this.updateSequence();
    }

    var parent = matrix[ROW][COL].p;

    matrix[ROW][COL].f.color = finding_sequence_path_color;
    matrix[ROW][COL].f.currCell = true;
    vStringGrid[ROW-1].f.currCell = true;
    hStringGrid[COL-1].f.currCell = true;

    if(parent.x === matrix[ROW][COL].x-1 && parent.y === matrix[ROW][COL].y-1) {
      vStringGrid[ROW-1].f.color = sequence_color;
      hStringGrid[COL-1].f.color = sequence_color;
    }

    this.redrawCanvas();

    matrix[ROW][COL].f.currCell = false;
    vStringGrid[ROW-1].f.currCell = false;
    hStringGrid[COL-1].f.currCell = false;

    newCOL = matrix[ROW][COL].p.x;
    newROW = matrix[ROW][COL].p.y;

    if(newCOL !== 0 && newROW !== 0) {
      COL = newCOL;
      ROW = newROW;
    } else {
      ISPAUSED = true;
      FINISHED = true;
    }
  }

  this.stepBackFind = function() {
    ISPAUSED = true;

    if(COL === cols-1 && ROW === rows-1) {
      COL = 1;
      ROW = rows;

      FILLED = false;
      this.stepBackFill();

      return;
    }

    if(FINISHED) {
      newCOL = matrix[ROW][COL].p.x;
      newROW = matrix[ROW][COL].p.y;
      COL = newCOL;
      ROW = newROW;
    }

    FINISHED = false;

    var child = null;

    if(COL == horizontalString.length) {
      child = matrix[ROW+1][COL]
    } 
    else if(ROW == verticalString.length) {
      child = matrix[ROW][COL+1]
    }
    else {
      if(matrix[ROW+1][COL].f.color == finding_sequence_path_color) child = matrix[ROW+1][COL];
      if(matrix[ROW][COL+1].f.color == finding_sequence_path_color) child = matrix[ROW][COL+1];
      if(matrix[ROW+1][COL+1].f.color == finding_sequence_path_color) child = matrix[ROW+1][COL+1];
    }

    child.f.color = default_text_color
    if(child.f.newChar) child.f.color = potential_sequence_color

    COL = child.x
    ROW = child.y

    if(COL === horizontalString.length && ROW === verticalString.length) {
      matrix[ROW][COL].f.color = default_text_color
      if(matrix[ROW][COL].f.newChar) matrix[ROW][COL].f.color = potential_sequence_color
      vStringGrid[ROW-1].f.color = default_text_color;
      hStringGrid[COL-1].f.color = default_text_color;

      matrix[ROW][COL].f.currCell = true;
      vStringGrid[ROW-1].f.currCell = true;
      hStringGrid[COL-1].f.currCell = true;

      this.redrawCanvas();

      matrix[ROW][COL].f.currCell = false;
      vStringGrid[ROW-1].f.currCell = false;
      hStringGrid[COL-1].f.currCell = false;

      if(child.f.newChar) {
        sequence = sequence.substr(1, sequence.length-1);
        this.updateSequence();
      }
      return;
    }

    vStringGrid[ROW-1].f.color = default_text_color;
    hStringGrid[COL-1].f.color = default_text_color;

    if(child.f.newChar) {
      sequence = sequence.substr(1, sequence.length-1);
      this.updateSequence();
    }

    if(COL == horizontalString.length) {
      child = matrix[ROW+1][COL]
    } 
    else if(ROW == verticalString.length) {
      child = matrix[ROW][COL+1]
    }
    else {
      if(matrix[ROW+1][COL].f.color == finding_sequence_path_color) child = matrix[ROW+1][COL];
      if(matrix[ROW][COL+1].f.color == finding_sequence_path_color) child = matrix[ROW][COL+1];
      if(matrix[ROW+1][COL+1].f.color == finding_sequence_path_color) child = matrix[ROW+1][COL+1];
    }

    child.f.currCell = true;
    vStringGrid[child.y-1].f.currCell = true;
    hStringGrid[child.x-1].f.currCell = true;

    this.redrawCanvas();

    child.f.currCell = false;
    vStringGrid[child.y-1].f.currCell = false;
    hStringGrid[child.x-1].f.currCell = false;
  }

  this.updateSpeed = function(new_speed) {
    speed = (11-new_speed);
  }

  this.updateSequenceLength = function() {
    document.getElementById("length_header").innerHTML = sequence_length;
  }

  this.updateSequence = function() {
    document.getElementById("sequence_header").innerHTML = "&quot;" + sequence + "&quot;";
  }
};

commonSubsequence = new CommonSubsequence();