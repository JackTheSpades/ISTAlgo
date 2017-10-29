function GrahamHull() {
  this.active = false;
  var width = 640;
  var height = 640;
  var grid_border = 10;

  var content_div;
  var info_div;
  var algo_div;

  var canvas;
  var context;

  var index = 3;
  var stack = new Array();
  var allPoints = new Array();
  var stepCount = 0;
  var pointLimit = 25;

  var font_size = 24;

  var exec_interval = 50;  //ms
  var speed = 5;

  var default_dot_color = "#222222";
  var dot_circle_color = "#BBBBBB";
  var dotted_rectangle_color = "#000000";

  var current_selection_color = "#B22222";

  var hull_color = "#000088";
  var valid_angle_color = "#09B516";
  var invalid_angle_color = "#880000";
  var dotted_line_color = "#999999"

  var dotted_thickness = "2";
  var dot_circle_thickness = "2";
  var dot_radius = 5;
  var dot_circle = 20;
  var min_object_distance = 20;

  var movingPoint = undefined;

  var stack_width = 100;
  var stack_x_off = width-stack_width-dotted_thickness+10;
  var stack_y_off;
  var stack_elem_height = 20;

  //global algorithm variables
  var ANGLE = true;
  var validAngle = true;
  var drawTopOfStack = true;
  var FINISHED = false;
  var QUEUE = [];
  var ISPAUSED = true;
  var GOTOEND = false;
  var DRAW = true;

  var demos = [];

  var canvasOffset;
  var offsetX;
  var offsetY;

  this.fillDemos = function() {
    demoIndex = Math.floor(Math.random() * demos.length);
  }();

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

    canvas.addEventListener('mousemove', this.movePoint, true);
    canvas.addEventListener('mousemove', this.movePoint, true);
    canvas.addEventListener('mousedown', this.draw, true);
    canvas.addEventListener('mouseup', this.releasePoint, true);

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
              canvas.width-stack_width-dotted_thickness-2*min_object_distance, canvas.height-dotted_thickness-2*min_object_distance); 
    context.stroke();
    context.setLineDash([])
  }

  this.drawStack = function() {
    stack_y_off = canvas.height-dotted_thickness/2-min_object_distance-2*stack_elem_height

    context.beginPath();
    context.lineWidth = dotted_thickness;
    context.strokeStyle = dotted_rectangle_color;
    context.rect(stack_x_off, stack_y_off, 
              stack_width-10, 2*stack_elem_height-dotted_thickness); 
    context.stroke();
    context.font="20px Consolas";
    context.textAlign="center";
    context.fillText("STACK", stack_x_off + (stack_width-10)/2, stack_y_off+25);

    //draw stack
    length = stack.length;
    if(!drawTopOfStack) {
    	length = length - 1;
    	drawTopOfStack = true;
    }
    for(i = 0; i < length; i++) {
      var point = stack[i];

      context.beginPath();
      context.lineWidth = dotted_thickness;
      context.strokeStyle = dotted_rectangle_color;
      context.rect(stack_x_off, stack_y_off-(i+1)*stack_elem_height, stack_width-10, stack_elem_height); 
      context.stroke();

      context.font="15px Consolas";
      context.fillStyle = point.f.color;
      if(point.f.lowestPoint) context.fillStyle = current_selection_color;
      context.textAlign="center";
      context.fillText(point.i, stack_x_off + (stack_width-10)/2, stack_y_off-(i+1)*stack_elem_height+15);

      context.beginPath();
      context.arc(stack_x_off + 15, stack_y_off-(i+1)*stack_elem_height+10, dot_radius, 0, 2*Math.PI);
      context.fill();
    }

    var hull = stack.slice();

    if(allPoints.length > 3) {
      if(!validAngle) {
        hull.push(allPoints[index])
      }
    }

    if(stepCount != 0) {
      for(i = 0; i < hull.length; i++) {
        if(hull[i+1] == undefined) {
          context.beginPath();
          context.strokeStyle = hull_color;
          context.moveTo(hull[i].x, hull[i].y);
          context.lineTo(hull[0].x, hull[0].y);
          context.stroke();
        } else {
          context.beginPath();
          context.strokeStyle = hull_color;
          context.moveTo(hull[i].x, hull[i].y);
          context.lineTo(hull[i+1].x, hull[i+1].y);
          context.stroke();
        }
      }
    }
  }

  this.stepForward = function() {
    if(FINISHED) return;
    if(allPoints.length < 4) {
      stepCount++;
      this.redrawCanvas();
      FINISHED = true;
      return;
    }
    stepCount++;
    if(stepCount == 1) {
      //draw initial triangle
      this.redrawCanvas();
      return;
    }
    
    if(ANGLE) {
      var top = stack.length-1;
      var top2 = stack.length-2;

      var left, center, right, pushed, popped

      left = stack[top2];
      center = stack[top];
      right = allPoints[index];


      if(right === undefined) {
        FINISHED = true;
        stepCount--;
        return;
      }

      startingPoint = this.Point(left.x-center.x, Math.abs(left.y-center.y)); 
      if(left.y < center.y) 
        startingPoint = this.Point(left.x-center.x, left.y-center.y);

      endingPoint = this.Point(right.x-center.x, Math.abs(right.y-center.y)); 
      if(right.y < center.y) 
        endingPoint = this.Point(right.x-center.x, right.y-center.y);  

      startingAngle = Math.atan2(startingPoint.y, startingPoint.x);
      endingAngle = Math.atan2(endingPoint.y, endingPoint.x);
      
      degrees = this.toDegrees(startingAngle - endingAngle);
      if(this.toDegrees(startingAngle) < 0) {
        degrees = 360 + degrees;
      }

      if(degrees <= 180 && degrees > 0) {
        validAngle = true;
      } else {
        validAngle = false;
      }

      if(validAngle) {
        pushed = right
        stack.push(pushed)
        drawTopOfStack = false;
        index++
      } 

      ANGLE = false;
      this.redrawCanvas();
      this.drawAngle(left, center, right);  

      if(!validAngle) {
        popped = stack.pop()
        ANGLE = true
      }      
    } else {
      this.redrawCanvas();
      ANGLE = true;
    }
  } 

  this.stepBackward = function() {
    ISPAUSED = true;
    if(stepCount <= 0) return;
    var destindex = Math.max(stepCount-1, 0);
    this.resetStack()
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
  	var point = grahamHull.Point(pos.x, pos.y)
  	//check if click is outside the min object distance from every other dot and the border
  	//border first:
    
    if(grahamHull.minDistancesValid(point)) {
  		if(allPoints.length == pointLimit) {
  		  alert("Sorry, the number of points is limited to " + pointLimit + ".")
  		  return;
  		}
      if(evt.button == 2) {
        return;
      }

  		ANGLE = true; 
  		validAngle = true;
  		FINISHED = false;
  		QUEUE = [];
  		ISPAUSED = true;
  		GOTOEND = false;
  		DRAW = true;

  		index = 3;
  		stepCount = 0;

  		allPoints.push(point);
  		grahamHull.calculateAndSortByPhi();
  		grahamHull.refillStack();
  		grahamHull.redrawCanvas();      
  	} else {
      var clickedPoint;
      var clickedPointIndex = -1;
      for(i = 0; i < allPoints.length; i++) {
        if(grahamHull.euclideanDistance(allPoints[i], point) <= min_object_distance) {
          clickedPoint = allPoints[i];
          clickedPointIndex = i;
          break;
        }
      }

      if(evt.button == 2) { //right mouse button
        grahamHull.deletePoint(clickedPoint, clickedPointIndex);

        ANGLE = true; 
        validAngle = true;
        FINISHED = false;
        QUEUE = [];
        ISPAUSED = true;
        GOTOEND = false;
        DRAW = true;

        index = 3;
        stepCount = 0;

        grahamHull.calculateAndSortByPhi();
        grahamHull.refillStack();
        grahamHull.redrawCanvas();
      } else {
        movingPoint = clickedPoint;
      }
    }
  } 

  this.movePoint = function(evt) {
    if(movingPoint == undefined) {
      grahamHull.redrawCanvas();
      return;
    }
    
    if(stepCount > 0) {
      ANGLE = true; 
      validAngle = true;
      FINISHED = false;
      QUEUE = [];
      ISPAUSED = true;
      GOTOEND = false;
      DRAW = true;

      index = 3;
      stepCount = 0;

      grahamHull.calculateAndSortByPhi();
      grahamHull.refillStack();
      grahamHull.redrawCanvas();
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

      if(grahamHull.euclideanDistance(allPoints[i], pos) < min_object_distance) {
        positionValid = false;
        break;
      }
    }

    if(pos.x < (min_object_distance) || pos.x > (canvas.width - min_object_distance - stack_width)) 
      positionValid = false;

    if(pos.y < (min_object_distance) || pos.y > (canvas.height - min_object_distance)) 
      positionValid = false;

    if(positionValid) {
      movingPoint.x = pos.x;
      movingPoint.y = pos.y;
    }

    grahamHull.redrawCanvas();
  }

  this.releasePoint = function(evt) {
    movingPoint = undefined;

    ANGLE = true; 
    validAngle = true;
    FINISHED = false;
    QUEUE = [];
    ISPAUSED = true;
    GOTOEND = false;
    DRAW = true;

    index = 3;
    stepCount = 0;

    grahamHull.calculateAndSortByPhi();
    grahamHull.refillStack();
    grahamHull.redrawCanvas();
  }

  this.deletePoint = function(point, index) {
    allPoints.splice(index, 1);
  }

  this.minDistancesValid = function(point) {
    //x
    if(point.x <= min_object_distance || point.x >= (canvas.width - min_object_distance - stack_width))
      return false;
    //y
    if(point.y <= min_object_distance || point.y >= (canvas.height - min_object_distance))
      return false;

    var retval = true;
    allPoints.forEach(function(currPoint) {
      if(grahamHull.euclideanDistance(currPoint, point) <= min_object_distance) {
        retval = false;
      } 
    })
    return retval;
  }

  this.euclideanDistance = function(p1, p2) {
    return Math.sqrt(((p1.x - p2.x)*(p1.x - p2.x)) + ((p1.y - p2.y)*(p1.y - p2.y)));
  }

  this.calculateAndSortByPhi = function() {
    //get lowest point first:
    if(allPoints.length == 0) return;
    allPoints.sort(this.sortByY());
    base = allPoints[0];
    allPoints.forEach(function(point) {
      point.f.lowestPoint = false;
      newPoint = grahamHull.Point(point.x-base.x, Math.abs(point.y-base.y));
      point.f.phi = Math.atan2(newPoint.y, newPoint.x);
    });
    base.f.lowestPoint = true;
    base.f.phi = Infinity;
    allPoints.sort(this.sortByPhi());
    allPoints.forEach(function(point) {
      point.i = (allPoints.indexOf(point) + 1);
    });
  }

  this.refillStack = function() {
    stack = new Array();

    for(i = 0; i < 3; i++) {
      if(allPoints[i] !== undefined) 
        stack.push(allPoints[i])
    }
  }

  this.redrawCanvas = function() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if(DRAW) {
      this.drawCanvasBoundingBox();
      this.drawStack();
      allPoints.forEach(function(point) { grahamHull.drawPoint(point); });
    }
  }

  this.drawPoint = function(point){
    context.beginPath();
    context.fillStyle = point.f.color;
    if(point.f.lowestPoint) context.fillStyle = current_selection_color;
    context.arc(point.x, point.y, dot_radius, 0, 2*Math.PI);
    context.fill();
    
    context.font="15px Consolas";
    context.textAlign="center";
    context.fillText(+point.i,point.x,(point.y-13));
    context.fillStyle = default_dot_color;
    if(stepCount != 0) return;

    context.beginPath();
    context.setLineDash([4, 4]);
    context.strokeStyle = point.f.circle;
    context.lineWidth = dot_circle_thickness;
    context.arc(point.x, point.y, dot_circle, 0, 2*Math.PI);
    context.stroke();
    context.setLineDash([]);
    
  }

  this.Point = function(x_coord, y_coord) {
    var newPoint = {
      x : x_coord,
      y : y_coord,
      i : allPoints.length+1,
      f : {
         color: default_dot_color,     
         circle: dot_circle_color,
         currPoint: false,
         lowestPoint: false,
         phi: 0}    
      };
     return newPoint;
  }

  this.runInterval = function(){
    if(grahamHull.active) {
      if(!ISPAUSED) {
        grahamHull.stepForward();
      }
      clearInterval(grahamHull.interval);
        runspeed = exec_interval*speed;
        grahamHull.interval = setInterval(grahamHull.runInterval, runspeed);
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

  this.drawAngle = function(left, center, right) {
    startingPoint = this.Point(left.x-center.x, Math.abs(left.y-center.y)); 
    if(left.y < center.y) 
      startingPoint = this.Point(left.x-center.x, left.y-center.y);

    endingPoint = this.Point(right.x-center.x, Math.abs(right.y-center.y)); 
    if(right.y < center.y) 
      endingPoint = this.Point(right.x-center.x, right.y-center.y);  

    startingAngle = Math.atan2(startingPoint.y, startingPoint.x);
    endingAngle = Math.atan2(endingPoint.y, endingPoint.x);
    
    degrees = this.toDegrees(startingAngle - endingAngle);
    if(this.toDegrees(startingAngle) < 0) {
      degrees = 360 + degrees;
    }

    context.lineWidth = 2*dotted_thickness;
    if(degrees <= 180 && degrees > 0) {
      context.strokeStyle = valid_angle_color;
    } else {
      context.strokeStyle = invalid_angle_color;
    }

    context.beginPath();
    context.moveTo(center.x, center.y);
    context.lineTo(center.x + dot_circle * 2 * Math.cos(startingAngle), center.y + dot_circle * 2 * Math.sin(startingAngle));
    context.stroke();

    context.beginPath();
    context.moveTo(center.x, center.y);
    context.lineTo(center.x + dot_circle * 2 * Math.cos(endingAngle), center.y + dot_circle * 2 * Math.sin(endingAngle));
    context.stroke();

    context.beginPath();
    context.arc(center.x, center.y, dot_circle, endingAngle, startingAngle);
    context.stroke();

    context.lineWidth = dotted_thickness;

    context.beginPath();
    context.fillStyle = center.f.color;
    if(center.f.lowestPoint) context.fillStyle = current_selection_color;
    context.arc(center.x, center.y, dot_radius, 0, 2*Math.PI);
    context.fill();
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

  this.sortByY = function(){
      return function(pointA, pointB){
          if (pointA.y > pointB.y)
           return -1;
        if (pointA.y < pointB.y)
          return 1;
        return 0;
      };
  }

  this.sortByPhi = function(){
      return function(pointA, pointB){
          if (pointA.f.phi > pointB.f.phi)
           return -1;
        if (pointA.f.phi < pointB.f.phi)
          return 1;
        return 0;
      };
  }

  this.resetStack = function() {
    ANGLE = true;
    validAngle = true;
    drawTopOfStack = true;
    FINISHED = false;
    QUEUE = [];
    ISPAUSED = true;
    GOTOEND = false;
    DRAW = true;

    index = 3;
    stack = new Array();  
    stepCount = 0;

    this.calculateAndSortByPhi();
    this.refillStack();
    this.redrawCanvas();  
  }

  this.clearStack = function() {
    ANGLE = true;
    validAngle = true;
    drawTopOfStack = true;
    FINISHED = false;
    QUEUE = [];
    ISPAUSED = true;
    GOTOEND = false;
    DRAW = true;

    stack = new Array();
    index = 3;
    stepCount = 0;

    allPoints = new Array();

    this.redrawCanvas();  
  }

  this.finishHull = function() {
    if(allPoints.length < 4) return;
    ANGLE = true;
    validAngle = true;
    drawTopOfStack = true;
    QUEUE = [];
    ISPAUSED = true;
    GOTOEND = false;
    DRAW = false;
    while(!FINISHED) {
      this.stepForward();
    }
    DRAW = true;
    ISPAUSED = false;
    this.redrawCanvas();
  }

  this.toRadians = function(angle) {
    return angle * (Math.PI / 180);
  }

  this.toDegrees = function(angle) {
    return angle * (180 / Math.PI);
  }
};

grahamHull = new GrahamHull();
