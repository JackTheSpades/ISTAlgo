function LineSegmentIntersection() {
  this.active = false;
  var width = 640;
  var height = 640;
  var grid_border = 10;

  var content_div;
  var info_div;
  var algo_div;

  var canvas;
  var context;

  var font_size = 24;

  var exec_interval = 50; //ms
  var speed = 5;

  var default_dot_color = "#222222";
  var dot_circle_color = "#BBBBBB";
  var dotted_rectangle_color = "#000000";

  var lineLimit = 25;
  var lineCount = 0;
  var stepCount = 0;
  var pointCount = 0;

  var startingPoint = null;
  var mousedown_active = false;
  var outOfBoundsEdge = null;

  var lineMap = new Map();
  var lineLabelsMap = new Map();

  var pointMap = new Map();
  var pointLabelsMap = new Map();

  var linePoints = new Array();
  var intersections = new Array();
  var events = new Array();
  var previousLabels = new Array();
  var labels = new Array();
  var newNeighbouringLabels = new Array();
  var sweepLine = null;

  var lineSegmentColor = "#000088";
  var drawingSegmentColor = "#FF8A00";
  var sweeplineColor = "#B22222";
  var intersectionPointColor = "#09B516";

  var dotted_thickness = "2";
  var dot_circle_thickness = "2";
  var dot_radius = 5;
  var dot_circle = 20;
  var min_object_distance = 20;

  var movingPoint = undefined;

  //global algorithm variables
  var FINISHED = false;
  var ISPAUSED = true;
  var DRAW = true;


  this.initialize = function() {
    content_div = document.getElementById("content")
    info_div = document.getElementById("info")
    algo_div = document.getElementById("algo")

    canvas = document.createElement("canvas")
    canvas.setAttribute("id", "canvas");
    canvas.setAttribute("class", "unselectable");
    canvas.width = width;
    canvas.height = height;
    context = canvas.getContext("2d");
    content_div.appendChild(canvas);

    content_div.setAttribute("style","width:" + width + "px");
    content_div.style.width=width + 'px';
    info_div.setAttribute("style","width:" + (width+10) + "px");
    info_div.style.width=(width+10) + 'px';
    algo_div.setAttribute("style","width:" + (width+10) + "px");
    algo_div.style.width=(width+10) + 'px';

    canvas.addEventListener('mousemove', this.moveOrDraw, true);
    canvas.addEventListener('mousedown', this.drawStartingPoint, true);
    canvas.addEventListener('mouseup', this.drawEndingPoint, true);

    $("canvas#canvas").on("mouseover",function() {$(this).css('cursor', 'url(res/crosshair.png), auto');}).mouseout(function(){$(this).css('cursor', 'auto');});
    $("canvas#canvas").on("contextmenu", function(e){ return false; });

    this.redrawCanvas();
  }

  this.drawCanvasBoundingBox = function() {
    context.setLineDash([5, 5]);
    
    context.beginPath();
    context.lineWidth = dotted_thickness;
    context.strokeStyle = dotted_rectangle_color;
    context.rect(dotted_thickness/2 + min_object_distance, dotted_thickness/2 + min_object_distance, 
              canvas.width-dotted_thickness-2*min_object_distance, canvas.height-dotted_thickness-2*min_object_distance); 

    context.stroke();
    context.setLineDash([])
  }

  this.drawOutOfBoundsEdge = function() {
    if(outOfBoundsEdge == null) return;
    this.drawEdge(outOfBoundsEdge, drawingSegmentColor);
    lineIntersections.drawPoint(outOfBoundsEdge[0]);
  }

  
  this.stepForward = function() {
    if(FINISHED) return;
    stepCount++;
  
    if(events.length == 0) {
      FINISHED = true;
      sweepLine = null;
      this.redrawCanvas();
      return;
    }

    point = events.shift();
    sweepLine = {
      0: (this.Point(point.x, min_object_distance+1)),
      1: (this.Point(point.x, (canvas.height - min_object_distance)-1)),
      i: -lineCount
    }

    this.redrawCanvas();

    if(point.t == "start") {
      this.insertIntoLabels(point.l)
    }
    if(point.t == "intersection") {
      this.swapLabels(point.l[0], point.l[1])
    }
    if(point.t == "end") {
      this.removeFromLabels(point.l)
    }

    //fill newNeighbouringLabels here
    this.findNewNeighbours();

    for(i = 0; i < newNeighbouringLabels.length; i++) {   
      lineA = lineLabelsMap.get(newNeighbouringLabels[i][0].toString())
      edgeA = {
        0 : pointLabelsMap.get(lineA[0].toString()),
        1 : pointLabelsMap.get(lineA[1].toString())
      }

      lineB = lineLabelsMap.get(newNeighbouringLabels[i][1].toString())
      edgeB = {
        0 : pointLabelsMap.get(lineB[0].toString()),
        1 : pointLabelsMap.get(lineB[1].toString())
      }

      possibleIntersection = this.getIntersectionOfLines(edgeA, edgeB)
      if(possibleIntersection != null && possibleIntersection.x > point.x) {
        possibleIntersection.i = pointMap.size+1;
        possibleIntersection.t = "intersection";
        possibleIntersection.f.color = intersectionPointColor;
        possibleIntersection.l = [newNeighbouringLabels[i][0], newNeighbouringLabels[i][1]];

        if(pointMap.get([possibleIntersection.x, possibleIntersection.y].toString()) == undefined) {
          pointMap.set([possibleIntersection.x, possibleIntersection.y].toString(), possibleIntersection)
          pointLabelsMap.set(possibleIntersection.i.toString(), possibleIntersection)
          events.push(possibleIntersection)
          intersections.push(possibleIntersection);
        }
      }
    }

    this.sortEvents();

    previousLabels = new Array();
    for(i = 0; i < labels.length; i++) {
      previousLabels.push(labels[i])
    }
    newNeighbouringLabels = new Array();

    this.redrawCanvas();
  } 

  this.stepBackward = function() {
    var destindex = Math.max(stepCount-1, 0);
    DRAW = false;
    this.resetSweep();
    while(stepCount != destindex) {
      this.stepForward();
    }
    DRAW = true;
    this.redrawCanvas();
  }

  this.sortEvents = function() {
    events.sort(function(a, b) {
      return a.x - b.x
    })
  }

  this.insertIntoLabels = function(label) {
    //determine the position by determining the intersection with the sweepline
    line = lineLabelsMap.get(label.toString())
    edge = {
      0 : pointLabelsMap.get(line[0].toString()),
      1 : pointLabelsMap.get(line[1].toString())
    }

    newYvalue = this.getIntersectionOfLines(sweepLine, edge).y;

    for(i = 0; i < labels.length; i++) {
      curline = lineLabelsMap.get(labels[i].toString())
      curedge = {
        0 : pointLabelsMap.get(curline[0].toString()),
        1 : pointLabelsMap.get(curline[1].toString())
      }

      Yvalue = this.getIntersectionOfLines(sweepLine, curedge).y


      if(newYvalue < Yvalue) {
        labels.splice(i, 0, label);
        return;
      }
    }
    labels.push(label)
  }

  this.swapLabels = function(labelA, labelB) {
    indexA = labels.indexOf(labelA)
    indexB = labels.indexOf(labelB)

    tempLabel = labels[indexA]
    labels[indexA] = labels[indexB]
    labels[indexB] = tempLabel;
  }

  this.removeFromLabels = function(label) {
    index = labels.indexOf(label);
    labels.splice(index, 1);
  }

  this.findNewNeighbours = function() {
    newNeighboursMap = new Map();

    for(i = 0; i < labels.length; i++) {
      if(labels[i+1] != undefined) {
        newNeighboursMap.set(labels[i] + labels[i+1], null)
      }
    }

    for(i = 0; i < previousLabels.length; i++) {
      if(previousLabels[i+1] != undefined) {
        newNeighboursMap.delete(previousLabels[i] + previousLabels[i+1])
        newNeighboursMap.delete(previousLabels[i+1] + previousLabels[i])
      }
    } 

    for(value of newNeighboursMap) {
      neighbours = value[0]
      newNeighbouringLabels.push([neighbours.substring(0, 1), neighbours.substring(1, 2)])
    }
  }

  this.getIntersectionOfLines = function(lineA, lineB) {
    x1 = lineA[0].x
    x2 = lineA[1].x
    x3 = lineB[0].x
    x4 = lineB[1].x
    y1 = lineA[0].y
    y2 = lineA[1].y
    y3 = lineB[0].y
    y4 = lineB[1].y

    //from http://stackoverflow.com/a/38977789
    var ua, ub, 
    denom = (y4 - y3)*(x2 - x1) - (x4 - x3)*(y2 - y1);

    if (denom == 0) {
        return null;
    }

    ua = ((x4 - x3)*(y1 - y3) - (y4 - y3)*(x1 - x3))/denom;
    ub = ((x2 - x1)*(y1 - y3) - (y2 - y1)*(x1 - x3))/denom;
    
    x = x1 + ua*(x2 - x1)
    y = y1 + ua*(y2 - y1)

    if(ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {   
       return this.Point(x, y);
    }

    return null;
  }

  this.drawStartingPoint = function(evt) {
    var rect = canvas.getBoundingClientRect();
    var pos = {
        x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width + 12,
        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height + 12
    };

    var point = lineIntersections.Point(pos.x, pos.y)
   
    if(lineIntersections.minDistancesValid(point)) {
      if(lineCount == lineLimit) {
        alert("Sorry, the number of lines is limited to " + lineLimit + ".")
        return;
      }

      startingPoint = point;
      mousedown_active = true;

      lineIntersections.redrawCanvas();     
    } else {
      var clickedPoint;
      var clickedPointIndex = -1;
      for(i = 0; i < linePoints.length; i++) {
        if(lineIntersections.euclideanDistance(linePoints[i], point) <= min_object_distance) {
          clickedPoint = linePoints[i];
          clickedPointIndex = i;
          break;
        }
      }

      if(evt.button == 2) { //right mouse button
        //DELETE POINT
        lineIntersections.resetSweep();
        lineIntersections.redrawCanvas();

        ISPAUSED = true;

        lineIntersections.deletePoint(clickedPoint, clickedPointIndex);


        lineIntersections.resetSweep();
        lineIntersections.redrawCanvas();
      } else {
        ISPAUSED = true;
        movingPoint = clickedPoint;
      }
    }
  }

  this.moveOrDraw = function(evt) {
    if(movingPoint == undefined)
      lineIntersections.drawLine(evt);
    else
      lineIntersections.movePoint(evt);
  }

  this.drawLine = function(evt) {
    if(!mousedown_active) {
      lineIntersections.redrawCanvas();
      return;
    }
    var rect = canvas.getBoundingClientRect();
    var pos = {
        x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width + 12,
        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height + 12
    };
    
    var point = lineIntersections.Point(pos.x, pos.y)
   
    if(outOfBoundsEdge != null) {
      if(lineIntersections.minDistancesValid(point)) {
        startingPoint = outOfBoundsEdge[0];
        outOfBoundsEdge = null;
      } else {
        lineIntersections.redrawCanvas();
        return;
      }
    }

    if(lineIntersections.minDistancesValid(point)) {
      if(lineCount == lineLimit) {
        alert("Sorry, the number of lines is limited to " + lineLimit + ".")
        return;
      }

      lineIntersections.redrawCanvas();     

      edge = {
        0: startingPoint,
        1: point,
        i: -1
      }

      lineIntersections.drawCanvasBoundingBox();
      lineIntersections.drawEdge(edge, drawingSegmentColor)
      lineIntersections.drawPoint(startingPoint)
      lineIntersections.drawPoint(point)
    } else {
      lineIntersections.redrawCanvas();
      if(outOfBoundsEdge == null)
        outOfBoundsEdge = edge;
      startingPoint = null;
    }
  }

  this.movePoint = function(evt) {
    if(movingPoint == undefined) {
      lineIntersections.redrawCanvas();
      return;
    }
    
    if(stepCount > 0) {
      lineIntersections.resetSweep();
      lineIntersections.redrawCanvas();
    }

    var rect = canvas.getBoundingClientRect();
    var pos = {
        x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width + 12,
        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height + 12
    };

    var positionValid = true;
    for(i = 0; i < linePoints.length; i++) {
      if(linePoints[i] == movingPoint) {
        continue;
      }

      if(lineIntersections.euclideanDistance(linePoints[i], pos) < min_object_distance) {
        positionValid = false;
        break;
      }
    }

    if(pos.x < (min_object_distance) || pos.x > (canvas.width - min_object_distance)) 
      positionValid = false;

    if(pos.y < (min_object_distance) || pos.y > (canvas.height - min_object_distance)) 
      positionValid = false;

    if(positionValid) {
      movingPoint.x = pos.x;
      movingPoint.y = pos.y;
    }

    lineIntersections.redrawCanvas();
  }

  this.deletePoint = function(point, index) {
    line = lineLabelsMap.get(point.l.toString())

    delstart = pointLabelsMap.get(line[0].toString())
    delend = pointLabelsMap.get(line[1].toString())

    for(i = 0; i < linePoints.length; i++) {
      if(linePoints[i] == delstart) {
        linePoints.splice(i, 1);
        i--;
      }

      if(linePoints[i] == delend) {
        linePoints.splice(i, 1);
        i--;
      }
    }
    
    pointsCopy = linePoints;

    lineIntersections.clearLines();

    for(i = 0; i < pointsCopy.length; i = i + 2) {
      lineCount++;
      line = null;

      startingPoint = pointsCopy[i]
      endingPoint = pointsCopy[i+1]

      start = lineIntersections.Point(startingPoint.x, startingPoint.y);
      start.i = pointMap.size+1;
      start.l = String.fromCharCode(97 + lineMap.size);
      pointMap.set([start.x, start.y].toString(), start)
      pointLabelsMap.set(start.i.toString(), start)

      end = lineIntersections.Point(endingPoint.x, endingPoint.y);
      end.i = pointMap.size+1;
      end.l = String.fromCharCode(97 + lineMap.size);
      pointMap.set([end.x, end.y].toString(), end)
      pointLabelsMap.set(end.i.toString(), end)
      
      if(start.x < end.x) {
        start.t = "start";
        end.t = "end";
        line = lineIntersections.Line(start.i, end.i, String.fromCharCode(97 + lineMap.size))
      }

      if(start.x > end.x) {
        end.t = "start";
        start.t = "end";
        line = lineIntersections.Line(end.i, start.i, String.fromCharCode(97 + lineMap.size))
      }

      lineMap.set([line[0], line[1]].toString(), line)
      lineLabelsMap.set(line.label.toString(), line)

      events.push(start)
      events.push(end)

      linePoints.push(start)
      linePoints.push(end)
    }

    lineIntersections.resetSweep();
    lineIntersections.redrawCanvas();
  }

  this.drawEndingPoint = function(evt) {
    if(movingPoint != undefined) {
      movingPoint = undefined;

      lineIntersections.resetSweep();
      lineIntersections.redrawCanvas();
      return;
    }

    if(!mousedown_active) {
      return;
    };
    var rect = canvas.getBoundingClientRect();
    var pos = {
        x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width + 12,
        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height + 12
    };

    var point = lineIntersections.Point(pos.x, pos.y)
    
    if(outOfBoundsEdge != null) {
      outOfBoundsEdge = null;
      mousedown_active = false;
      startingPoint = null;
      lineIntersections.redrawCanvas();
      return;
    }

    if(lineIntersections.euclideanDistance(point, startingPoint) == 0 || startingPoint.x == point.x) {
      mousedown_active = false;
      startingPoint = null;
      lineIntersections.redrawCanvas();
      return;
    };

    if(lineIntersections.minDistancesValid(point)) {
      if(lineCount == lineLimit) {
        alert("Sorry, the number of lines is limited to " + lineLimit + ".")
        return;
      }

      lineIntersections.resetSweep();

      lineCount++;
      line = null; 

      lineLabel = String.fromCharCode(97 + lineMap.size)

      startPointIndex = pointMap.size+1;
      startingPoint.i = startPointIndex;
      startingPoint.l = lineLabel;
      pointMap.set([startingPoint.x, startingPoint.y].toString(), startingPoint)
      pointLabelsMap.set(startingPoint.i.toString(), startingPoint)

      pointIndex = pointMap.size+1;
      point.i = pointIndex;
      point.l = lineLabel;
      pointMap.set([point.x, point.y].toString(), point)
      pointLabelsMap.set(point.i.toString(), point)

      if(startingPoint.x < point.x) {
        startingPoint.t = "start";
        point.t = "end";
        line = lineIntersections.Line(startingPoint.i, point.i, lineLabel)
      }
      
      if(startingPoint.x > point.x) {
        point.t = "start";
        startingPoint.t = "end";
        line = lineIntersections.Line(point.i, startingPoint.i, lineLabel)
      }

      mousedown_active = false;

      lineMap.set([line[0], line[1]].toString(), line)
      lineLabelsMap.set(line.label.toString(), line)

      events.push(startingPoint)
      events.push(point)

      linePoints.push(startingPoint)
      linePoints.push(point)

      lineIntersections.sortEvents();
      lineIntersections.redrawCanvas();     
    }
  }

  this.minDistancesValid = function(point) {
    //x
    if(point.x <= min_object_distance || point.x >= (canvas.width - min_object_distance))
      return false;
    //y
    if(point.y <= min_object_distance || point.y >= (canvas.height - min_object_distance))
      return false;

    var retval = true;
    linePoints.forEach(function(currPoint) {
      if(lineIntersections.euclideanDistance(currPoint, point) <= min_object_distance) {
        retval = false;
      } 
    })
    return retval;

    return true;
  }

  this.euclideanDistance = function(p1, p2) {
    return Math.sqrt(((p1.x - p2.x)*(p1.x - p2.x)) + ((p1.y - p2.y)*(p1.y - p2.y)));
  }

  this.redrawCanvas = function() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if(DRAW) {
      this.drawCanvasBoundingBox();
      this.drawOutOfBoundsEdge();

      if(sweepLine != null) {
        context.setLineDash([5, 5]);
        this.drawEdge(sweepLine, sweeplineColor);
        context.setLineDash([]);
      }
      
      this.drawAllLines();
      this.drawAllIntersections();
    }
  }

  this.drawAllLines = function() {
    lineLabelsMap.forEach(function(value, key, map) {
      line = {
        0 : pointLabelsMap.get(value[0].toString()),
        1 : pointLabelsMap.get(value[1].toString()),
        i : value.label
      }
      lineIntersections.drawEdge(line, lineSegmentColor)

      lineIntersections.drawPoint(line[0])
      lineIntersections.drawPoint(line[1])
    })
  }

  this.drawAllIntersections = function() {
    intersections.forEach(function(point) {
      lineIntersections.drawPoint(point)
    })
  }

  this.drawPoint = function(point){
    context.beginPath();
    context.fillStyle = point.f.color
    if(point.f.removedPoint) context.fillStyle = removed_point_color;
    context.arc(point.x, point.y, dot_radius, 0, 2*Math.PI);
    context.fill();

    if(stepCount == 0) {
      context.beginPath();
      context.setLineDash([4, 4]);
      context.strokeStyle = point.f.circle;
      context.lineWidth = dot_circle_thickness;
      context.arc(point.x, point.y, dot_circle, 0, 2*Math.PI);
      context.stroke();
      context.setLineDash([]);
    }
    
    /*uncomment for debugging purposes
    context.font="15px Consolas";
    context.textAlign="center";
    context.fillStyle = "red";
    context.fillText(+point.i,point.x,(point.y-13));
    context.fillStyle = "black";*/
  }

  this.drawEdge = function(edge, color) {
    context.beginPath()
    context.strokeStyle = color
    context.moveTo(edge[0].x, edge[0].y)
    context.lineTo(edge[1].x, edge[1].y)
    context.stroke()

    /*uncomment for debugging
    if(edge == sweepLine || edge.i < 0) return;
    context.font="15px Consolas";
    context.textAlign="center";
    context.fillStyle = "red";
    context.fillText(""+edge.i, (edge[0].x + edge[1].x)/2,(edge[0].y + edge[1].y)/2 - 13);
    context.fillStyle = "black";*/
  }

  this.Line = function(APointlabel, BPointlabel, label) {
    var newLine = {
      0 : APointlabel,
      1 : BPointlabel,
      label : label
    }
    return newLine;
  }

  this.Point = function(x_coord, y_coord) {
    var newPoint = {
      x : x_coord,
      y : y_coord,
      t : null, //start point, intersecting point, end point
      l : null, //edge
      i : -1,
      f : {
        color: default_dot_color,
        circle: dot_circle_color,
      }    
      };
     return newPoint;
  }

  this.printEvents = function() {
    text = "EVENTS: <";
    for(k = 0; k < events.length; k++) {
      text = text + "" + events[k].i;
      if(k != events.length-1) text = text + "|";
    }
    text = text + ">"
    console.log(text)
  }

  this.printLabels = function() {
    text = "LABELS: <";
    for(k = 0; k < labels.length; k++) {
      text = text + "" + labels[k];
      if(k != labels.length-1) text = text + "|";
    }
    text = text + ">"
    console.log(text)
  }

  this.printNeighbours = function() {
    text = "NEW NEIGHBOURS: <";
    for(k = 0; k < newNeighbouringLabels.length; k++) {
      neighbourA = newNeighbouringLabels[k][0]
      neighbourB = newNeighbouringLabels[k][1]
      text = text + "(" + neighbourA + "," + neighbourB + ")";
      if(k != newNeighbouringLabels.length-1) text = text + "|";
    }
    text = text + ">"
    console.log(text)
  }

  this.runInterval = function(){
    if(lineIntersections.active) {
      if(!ISPAUSED) {
        lineIntersections.stepForward();
      }
      clearInterval(lineIntersections.interval);
        runspeed = exec_interval*speed;
        lineIntersections.interval = setInterval(lineIntersections.runInterval, runspeed);
    }
  }
  this.interval = setInterval(this.runInterval, exec_interval*speed);

  this.runAlgorithm = function() {
    ISPAUSED = false; 
  }

  this.pauseAlgorithm = function() {
    ISPAUSED = true;
  }

  this.updateSpeed = function(new_speed) {
    speed = (11-new_speed);
  }

  this.resetSweep = function() {
    for(i = 0; i < intersections.length; i++) {
      pointLabelsMap.delete(intersections[i].i.toString())
      pointMap.delete([intersections[i].x, intersections[i].y].toString())
    }

    stepCount = 0;

    intersections = new Array();
    events = new Array();
    previousLabels = new Array();
    labels = new Array();

    newNeighbouringLabels = new Array();
    sweepLine = null;

    for(i = 0; i < linePoints.length; i++) {
      events.push(linePoints[i])
    }

    this.sortEvents();

    FINISHED = false;
    DRAW = true;
    ISPAUSED = true;

    this.redrawCanvas();
  }

  this.clearLines = function() {
    stepCount = 0;
    lineCount = 0;
    pointCount = 0;

    startingPoint = null;
    mousedown_active = false;

    lineMap = new Map();
    lineLabelsMap = new Map();

    pointMap = new Map();
    pointLabelsMap = new Map();

    linePoints = new Array();
    intersections = new Array();
    events = new Array();
    previousLabels = new Array();
    labels = new Array();
    newNeighbouringLabels = new Array();
    sweepLine = null;

    FINISHED = false;
    DRAW = true;
    ISPAUSED = true;

    this.redrawCanvas();  
  }

  this.finishSweep = function() {
    if(lineCount == 0) return;
    ISPAUSED = true;
    DRAW = false;
    while(!FINISHED) {
      this.stepForward();
    }
    DRAW = true;
    this.redrawCanvas();
  }
};

lineIntersections = new LineSegmentIntersection();
