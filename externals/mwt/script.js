function MinimumWeightTriangulation() {
  this.active = false;
  var width = 1000;
  var height = 640;
  var grid_border = 10;

  var content_div;
  var info_div;
  var algo_div;

  var canvas;
  var context;

  var canvasGrid;
  var contextGrid;

  var allPoints = new Array();
  var stepCount = 0;
  var pointLimit = 10;

  var font_size = 18;

  var exec_interval = 50;  //ms
  var speed = 5;

  var default_dot_color = "#222222";
  var dot_circle_color = "#BBBBBB";
  var dotted_rectangle_color = "#000000";
  var intersect_color = "#CC0000";
  var current_selection_color = "#B22222";

  var hull_color = "#000088";
  var dotted_line_color = "#999999"

  var dotted_thickness = "2";
  var dot_circle_thickness = "2";
  var dot_radius = 5;
  var dot_circle = 20;
  var min_object_distance = 20;

  var movingPoint = undefined;
  
  //global algorithm variables
  var FINISHED = false;
  var ISPAUSED = true;
  
  var I;
  var l;
  var L = [];
  var S = [];
  var K;

  var IN_I = false;
  var IN_K = false;

  this.initialize = function () {
    content_div = document.getElementById("content")
    info_div = document.getElementById("info")
    algo_div = document.getElementById("algo")

    canvas = document.createElement("canvas")
    canvas.setAttribute("id", "canvas");
    canvas.setAttribute("class", "unselectable");
    canvas.width = width / 2;
    canvas.height = height;
    context = canvas.getContext("2d");
    content_div.appendChild(canvas);

    canvasGrid = document.createElement("canvas")
    //canvasGrid.setAttribute("id", "canvas");
    canvasGrid.setAttribute("class", "unselectable");
    canvasGrid.width = width / 2;
    canvasGrid.height = height;
    contextGrid = canvasGrid.getContext("2d");
    content_div.appendChild(canvasGrid);

    content_div.setAttribute("style","width:" + width + "px");
    content_div.style.width=width + 'px';
    info_div.setAttribute("style","width:" + (width+10) + "px");
    info_div.style.width=(width+10) + 'px';
    algo_div.setAttribute("style","width:" + (width+10) + "px");
    algo_div.style.width=(width+10) + 'px';

    //canvas.addEventListener('mousemove', this.movePoint, true);
    canvas.addEventListener('mousemove', this.movePoint, true);
    canvas.addEventListener('mousedown', this.draw, true);
    canvas.addEventListener('mouseup', this.releasePoint, true);

    $("canvas#canvas").on("mouseover",function() {$(this).css('cursor', 'url(res/crosshair.png), auto');}).mouseout(function(){$(this).css('cursor', 'auto');});
    $("canvas#canvas").on("contextmenu", function(e){ return false; });

    this.redrawCanvas();
  }

  this.reset = function () {
    stepCount = 0;
    FINISHED = false;
    ISPAUSED = true;
    I = 0;
    l = 0;
    K = 1;
    IN_I = false;
    IN_K = false;

    L = [];
    S = [];
    L.length = allPoints.length;
    S.length = allPoints.length;
    for (var i = 0; i < L.length; i++) {
      L[i] = [];
      L[i].length = allPoints.length;
      L[i][i + 1] = 0;

      S[i] = [];
      S[i].length = allPoints.length;
    }

  }

  this.drawCanvasBoundingBox = function() {
    context.setLineDash([5, 5]);
    
    context.beginPath();
    context.lineWidth = dotted_thickness;
    context.strokeStyle = dotted_rectangle_color;
    context.rect(
              dotted_thickness / 2 + min_object_distance,
              dotted_thickness / 2 + min_object_distance,
              canvas.width  - dotted_thickness - 2 * min_object_distance,
              canvas.height - dotted_thickness - 2 * min_object_distance);
    context.stroke();
    context.setLineDash([])
  }
  this.drawGrids = function() {
    
    contextGrid.clearRect(0, 0, canvasGrid.width, canvasGrid.height);
    if (L.length < 3)
      return;

    var border = dotted_thickness / 2 + min_object_distance;
    var cell_size = 40;
    var x = 0;
    var y = 0;

    for(var i = 0; i < L.length; i++)
      for (var j = i + 1; j < L.length; j++) {

        x = border + (cell_size * (j - 1));
        y = border + (cell_size * i) + 2 * cell_size; //add additional 2 cell_sizes to make room for indecies.

        contextGrid.beginPath();
        contextGrid.strokeStyle = dotted_rectangle_color;
        contextGrid.lineWidth = dotted_thickness;
        contextGrid.strokeStyle = dotted_rectangle_color;
        contextGrid.rect(x, y, cell_size, cell_size);
        contextGrid.stroke();

        if (l != 0 && I == i && j == (I + l)) {
          contextGrid.fillStyle = "rgba(0,128,0,0.25)";
          contextGrid.fillRect(x, y, cell_size, cell_size);
        }

        contextGrid.fillStyle = "#000000";
        contextGrid.font = font_size + "px Consolas";
        contextGrid.globalCompositeOperation = "source-over";
        if (i < L.length && j < L[i].length && !(L[i][j] === undefined)) {          
          var text = "\u221E";  //infinity
          if (!isNaN(L[i][j]))
            text = Math.round(L[i][j] / 10);
          var width = contextGrid.measureText(text).width / 2;
          contextGrid.fillText(text, x + (cell_size / 2) - width, y + (cell_size / 2) + font_size / 4.0);
        }
      }

    //indecies for j ->
    for (var j = 1; j < L.length; j++) {
      x = border + (cell_size * (j - 1));
      y = border + cell_size;

      contextGrid.fillStyle = "#000000";
      contextGrid.font = "bold " + font_size + "px Consolas";
      contextGrid.globalCompositeOperation = "source-over";
      var text = j + 1;
      var width = contextGrid.measureText(text).width / 2;
      contextGrid.fillText(text, x + (cell_size / 2) - width, y + (cell_size / 2) + font_size / 4.0);
    }
    //text for j ->
    {
      x = border;
      y = border;
      var text = "j";
      var width = contextGrid.measureText(text).width / 2;
      contextGrid.fillText(text, x + (cell_size / 2) - width, y + (cell_size / 2) + font_size / 4.0);
      this.arrow(x + cell_size, y + cell_size / 2, x + cell_size * 3, y + cell_size / 2);
    }
    //indecies for i ->
    for (var i = 0; i < L.length - 1; i++) {
      x = border + (cell_size * (L.length - 1));
      y = border + cell_size * (i + 2);

      contextGrid.fillStyle = "#000000";
      contextGrid.font = "bold " + font_size + "px Consolas";
      contextGrid.globalCompositeOperation = "source-over";
      var text = i + 1;
      var width = contextGrid.measureText(text).width / 2;
      contextGrid.fillText(text, x + (cell_size / 2) - width, y + (cell_size / 2) + font_size / 4.0);
    }
    //text for i ->
    {
      x = border + cell_size * L.length;
      y = border + cell_size * 2;
      var text = "i";
      var width = contextGrid.measureText(text).width / 2;
      contextGrid.fillText(text, x + (cell_size / 2) - width, y + (cell_size / 2) + font_size / 4.0);
      this.arrow(x + cell_size / 2, y + cell_size, x + cell_size / 2, y + cell_size * 3);
    }

  }
  
  this.arrow = function (fromx, fromy, tox, toy) { 
    var headlen = 10;   // length of head in pixels
    var angle = Math.atan2(toy - fromy, tox - fromx);
    contextGrid.beginPath();
    contextGrid.moveTo(fromx, fromy);
    contextGrid.lineTo(tox, toy);
    contextGrid.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    contextGrid.moveTo(tox, toy);
    contextGrid.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    contextGrid.stroke();
  }


  this.write = function (lines) {
    var border = dotted_thickness / 2 + min_object_distance;
    var x = border;
    var y = canvas.height - ((lines.length + 1) * 30);  //30px as line height, +1 for padding

    contextGrid.fillStyle = "#000000";
    contextGrid.font = "bold " + font_size + "px TimesNewRoman";
    contextGrid.globalCompositeOperation = "source-over";
    for (var i = 0; i < lines.length; i++) {
      contextGrid.fillText(lines[i].replace("NaN", "\u221E"), x, y + 15 + font_size / 4.0)
      y += 30;
    }
  }


  //checks if the line segment from p1-p2 intersects with q1-q2
  this.intersect = function (p1, p2, q1, q2) {

    //line equation: y(x) = kx + d; k=slope, d=offset

    var pk = (p1.y - p2.y) / (p1.x - p2.x);
    var pd = p1.y - (pk * p1.x);

    var qk = (q1.y - q2.y) / (q1.x - q2.x);
    var qd = q1.y - (qk * q1.x);

    //boundry boxes.
    var pRect = {
      left: Math.min(p1.x, p2.x),
      right: Math.max(p1.x, p2.x),
      top: Math.min(p1.y, p2.y),
      bottom: Math.max(p1.y, p2.y)
    };
    var qRect = {
      left: Math.min(q1.x, q2.x),
      right: Math.max(q1.x, q2.x),
      top: Math.min(q1.y, q2.y),
      bottom: Math.max(q1.y, q2.y)
    };

    //lines are parallel
    if (pk == qk) {
      //lines have different offset
      if (pd != qd)
        return false;

      //lines have same offset

      return ((pRect.left <= qRect.right) || (qRect.left <= pRect.right)) &&
        ((pRect.top >= qRect.bottom) || qRect.top >= pRect.bottom);
    }

    //intersection of lines
    var x = (qd - pd) / (pk - qk);
    var y = pk * x + pd;

    //true if intersection is in both boundry boxes.
    return (pRect.left <= x && pRect.right >= x) &&
      (pRect.top <= y && pRect.bottom >= y) &&
      (qRect.left <= x && qRect.right >= x) &&
      (qRect.top <= y && qRect.bottom >= y);

  }

  this.redrawCanvas = function () {
    context.clearRect(0, 0, canvas.width, canvas.height);
    this.drawCanvasBoundingBox();

    if (allPoints.length >= 2) {
      context.beginPath();
      context.lineWidth = dot_circle_thickness;
      context.strokeStyle = "#000000";
      context.moveTo(allPoints[0].x, allPoints[0].y);
      for (var i = 1; i < allPoints.length; i++) {
        context.lineTo(allPoints[i].x, allPoints[i].y);
      }
      context.closePath();
      context.stroke();
    }

    allPoints.forEach(function (point) { minimumweighttriangulation.drawPoint(point); });

    if (!FINISHED || true) {
      if (l != 0) {
        //current polygon from i to j
        context.beginPath();
        context.fillStyle = "rgba(0,0,128,0.10)";
        context.moveTo(allPoints[I].x, allPoints[I].y);
        for (var i = 1; i <= l; i++)
          context.lineTo(allPoints[I + i].x, allPoints[I + i].y);
        context.fill();


        //current triangle with i, j, k
        context.beginPath();
        context.fillStyle = "rgba(0,128,0,0.25)";
        context.moveTo(allPoints[I].x, allPoints[I].y);
        context.lineTo(allPoints[K].x, allPoints[K].y);
        context.lineTo(allPoints[I + l].x, allPoints[I + l].y);
        context.fill();
      }
    }
    else {
      this.drawTriangle(0, allPoints.length - 1);
    }

    this.drawGrids();
  }
  this.drawTriangle = function (a, b) {
    if (a == b)
      return;

    var min = Math.min(a, b);
    var max = Math.max(a, b);


    var s1 = S[min][max];
    var s2 = S[max][min];

    if(s1 === undefined && s2 == undefined)
      return;

    var s = s2;
    if (s2 === undefined)
      s = s1;

    context.lineWidth = dot_circle_thickness;
    context.strokeStyle = dot_circle_color;
    context.beginPath();
    context.moveTo(allPoints[min].x, allPoints[min].y);
    context.lineTo(allPoints[max].x, allPoints[max].y);
    context.lineTo(allPoints[s].x, allPoints[s].y);
    context.closePath();
    context.stroke();

    this.drawTriangle(min, s);
    this.drawTriangle(s, max);
  }

  this.drawPoint = function (point) {
    context.beginPath();
    context.fillStyle = point.f.color;
    if (point.f.lowestPoint) context.fillStyle = current_selection_color;
    context.arc(point.x, point.y, dot_radius, 0, 2 * Math.PI);
    context.fill();

    if (stepCount == 0) {
      context.beginPath();
      context.setLineDash([4, 4]);
      context.strokeStyle = point.f.circle;
      context.lineWidth = dot_circle_thickness;
      context.arc(point.x, point.y, dot_circle, 0, 2 * Math.PI);
      context.stroke();
      context.setLineDash([]);
    }

    context.font = "15px Consolas";
    context.textAlign = "center";
    context.fillText(+point.i, point.x, (point.y - 13));
    context.fillStyle = default_dot_color;
  }

  this.round = function (val, precision) {
    return Math.round(val * Math.pow(10, precision)) / Math.pow(10, precision);
  }

  this.stepForward = function() {
    if (FINISHED) {
      this.redrawCanvas();
      return;
    }

    stepCount++;

    //initialize
    if (l == 0) {
      l = 2;
      I = 0;
      K = 1;
      L[I][I + l] = Number.NaN;
    }

    var J = I + l;
    var prev = L[I][J];
    var u = this.circumfrence(I, J, K);
    var cur = L[I][K] + L[K][J] + u;

    if (isNaN(prev))
      L[I][J] = cur;
    else if (!isNaN(cur) && cur < prev) {
      L[I][J] = cur;
      S[I][J] = K;
    }

    this.redrawCanvas();
    this.write([
      `i = ${I + 1},  j = ${J + 1},  k=${K + 1}`,
      `u(${I + 1},${J + 1},${K + 1}) = ${this.round(u, 3)}`,
      `L[${I +1},${K +1}] = ${this.round(L[I][K], 3)},    L[${K +1},${J +1}] = ${this.round(L[K][J], 3)}`,
      `Prev: L[${I + 1},${J + 1}] = ${this.round(prev, 3)}, Current: ${this.round(cur, 3)}`
    ]);

    K++;
    if (K >= J) {
      I++;
      J = I + l;
      L[I][J] = Number.NaN;
      K = I + 1;
    }

    if (I >= allPoints.length - l) {
      l++;
      I = 0;
      K = 1;
      J = I + l;
      L[I][J] = Number.NaN;
    }

    if (l >= allPoints.length) {
      FINISHED = true;
      ISPAUSED = true;
    }


  } 

  this.stepBackward = function() {
    ISPAUSED = true;
    if (stepCount <= 0)
      return;
    var destindex = stepCount - 1;
    this.reset();
    while(stepCount != destindex) {
      this.stepForward();
    }
  }

  this.draw = function(evt) {
    var rect = canvas.getBoundingClientRect();
  	var pos = {
  	  x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width + 12,
  	  y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height + 12
  	};
  	var point = minimumweighttriangulation.Point(pos.x, pos.y)

  	//check if click is outside the min object distance from every other dot and the border
  	//border first:
  	if (minimumweighttriangulation.minDistancesValid(point)) {
  		if(allPoints.length == pointLimit) {
  		  alert("Sorry, the number of points is limited to " + pointLimit + ".")
  		  return;
  		}
      if(evt.button == 2) {
        return;
      }

      allPoints.push(point);
      minimumweighttriangulation.reset();
      minimumweighttriangulation.redrawCanvas();

  	} else {
      var clickedPoint;
      var clickedPointIndex = -1;
      for(i = 0; i < allPoints.length; i++) {
        if(minimumweighttriangulation.euclideanDistance(allPoints[i], point) <= min_object_distance) {
          clickedPoint = allPoints[i];
          clickedPointIndex = i;
          break;
        }
      }

      if(evt.button == 2) { //right mouse button
        minimumweighttriangulation.deletePoint(clickedPoint, clickedPointIndex);

        FINISHED = false;
        ISPAUSED = true;

        stepCount = 0;

        minimumweighttriangulation.redrawCanvas();
      } else {
        movingPoint = clickedPoint;
      }
    }
  }

  this.clearPoints = function () {
    allPoints = [];
    this.reset();
    this.redrawCanvas();
  }

  this.movePoint = function(evt) {
    if(movingPoint == undefined) {
      //minimumweighttriangulation.redrawCanvas();
      return;
    }
    
    if (stepCount > 0) {
      minimumweighttriangulation.reset();
      minimumweighttriangulation.redrawCanvas();
    }

    var rect = canvas.getBoundingClientRect();
    var pos = {
        x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width + 12,
        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height + 12
    };

    var oldx = -1;
    var oldy = -1;

    var positionValid = true;
    for(i = 0; i < allPoints.length; i++) {
      if(allPoints[i] == movingPoint) {
        continue;
      }

      if (minimumweighttriangulation.euclideanDistance(allPoints[i], pos) < min_object_distance) {
        positionValid = false;
        break;
      }
    }

    if(pos.x < (min_object_distance) || pos.x > (canvas.width - min_object_distance )) 
      positionValid = false;
    if(pos.y < (min_object_distance) || pos.y > (canvas.height - min_object_distance)) 
      positionValid = false;

    if(positionValid) {
      movingPoint.x = pos.x;
      movingPoint.y = pos.y;
    }

    minimumweighttriangulation.redrawCanvas();
  }

  this.releasePoint = function(evt) {
    movingPoint = undefined;

    minimumweighttriangulation.reset();
    minimumweighttriangulation.redrawCanvas();
  }

  this.deletePoint = function(point, index) {
    allPoints.splice(index, 1);
  }

  this.minDistancesValid = function(point) {
    //x
    if(point.x <= min_object_distance || point.x >= (canvas.width - min_object_distance))
      return false;
    //y
    if(point.y <= min_object_distance || point.y >= (canvas.height - min_object_distance))
      return false;

    var returnValue = true;
    allPoints.forEach(function(currPoint) {
      if (minimumweighttriangulation.euclideanDistance(currPoint, point) <= min_object_distance) {
        returnValue = false;
      } 
    })
    return returnValue;
  }

  this.euclideanDistance = function(p1, p2) {
    return Math.sqrt(((p1.x - p2.x)*(p1.x - p2.x)) + ((p1.y - p2.y)*(p1.y - p2.y)));
  }

  this.circumfrence = function(i, j, k) {

    //check if point k is within the polygon spanned by all points except k.
    //if so, then the triangle is outside the full polygon and thus we return NaN.

    //we use raycast
    var inside = false;

    if(((j + 1) % allPoints.length != i) && false) {
      for(var cnt = 0; cnt < allPoints.length; cnt++) {

        var p1 = cnt;
        var p2 = (cnt + 1) % allPoints.length;

        //if (this.intersect(allPoints[i], allPoints[j], allPoints[p1], allPoints[p2]))
        //  inside = !inside;

          //if (((point1.y > pointK.y) != (point2.y > pointK.y)) &&
          //  (pointK.x < (point2.x - point1.x) * (pointK.y - point1.y) / (point2.y - point1.y) + point1.x))
          //  inside = !inside;
      }

      if(inside)
        return Number.NaN;
    }

    return this.euclideanDistance(allPoints[i], allPoints[j]) + 
      this.euclideanDistance(allPoints[j], allPoints[k]) + 
      this.euclideanDistance(allPoints[k], allPoints[i]);

  }

  this.Point = function(x_coord, y_coord) {
    var newPoint = {
      x : x_coord,
      y : y_coord,
      i : allPoints.length+1,
      f : {
         color: default_dot_color,     
         circle: dot_circle_color,
         }    
      };
     return newPoint;
  }

  this.runInterval = function(){
    if(minimumweighttriangulation.active) {
      if(!ISPAUSED) {
        minimumweighttriangulation.stepForward();
      }
      clearInterval(minimumweighttriangulation.interval);
        runspeed = exec_interval*speed;
        minimumweighttriangulation.interval = setInterval(minimumweighttriangulation.runInterval, runspeed);
    }
  }
  this.interval = setInterval(this.runInterval, exec_interval*speed);

  this.runAlgorithm = function() {
    if(allPoints.length > 0 && !FINISHED)
      ISPAUSED = false;  
  }

  this.pauseAlgorithm = function() {
    ISPAUSED = true;
  }

  this.updateSpeed = function(new_speed) {
    speed = (11-new_speed);
  }

  this.toggleExpand = function(checkbox, divname) {
    if(checkbox.checked) {
      document.getElementById(divname).style.maxHeight = "1000px";
    } else {
      document.getElementById(divname).style.maxHeight = "0px";
    }
  }
};

minimumweighttriangulation = new MinimumWeightTriangulation();
