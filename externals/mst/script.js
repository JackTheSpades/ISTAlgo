function MinimalSpanningTree() {
  this.active = false;
  var width = 840;
  var height = 640;
  var grid_border = 10;

  var content_div;
  var info_div;
  var algo_div;

  var canvas;
  var context;

  var font_size = 24;

  var exec_interval = 50;  //ms
  var speed = 5;

  var default_dot_color = "#222222";
  var dot_circle_color = "#BBBBBB";
  var dotted_rectangle_color = "#000000";

  var kruskal_offset = (width/2);

  var stepCount = 0;
  var pointLimit = 25;
  var pointCount = 0;

  var primPoints = new Array();
  var primTree = new Array();
  var primQueue = new Array();
  var primEdges = new Array();
  var primLastEdgeAdded = null;

  var kruskalPoints = new Array();
  var kruskalTrees = new Array();
  var kruskalEdges = new Array();
  var kruskalSortedEdges = new Array();
  var kruskalLastEdgeAdded = null;

  var primEdgeColor = "#000088";
  var primShortestEdgeColor = "#B22222";
  var primNotShortestEdgeColor = "#FF8A00";
  var primLastAddedEdgeColor = "#09B516";

  var kruskalEdgeColor = "#000088";
  var kruskalShortestEdgeColor = "#B22222";
  var kruskalNotShortestEdgeColor = "#FF8A00";
  var kruskalLastAddedEdgeColor = "#09B516";

  var dotted_thickness = "2";
  var dot_circle_thickness = "2";
  var dot_radius = 5
  var dot_circle = 20
  var min_object_distance = 20;

  var primMovingPoint = undefined;
  var kruskalMovingPoint = undefined;

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

    canvas.addEventListener('mousemove', this.movePoint, true);
    canvas.addEventListener('mousedown', this.draw, true);
    canvas.addEventListener('mouseup', this.releasePoint, true);

    $("canvas#canvas").on("mouseover",function() {$(this).css('cursor', 'url(res/crosshair.png), auto');}).mouseout(function(){$(this).css('cursor', 'auto');});
    $("canvas#canvas").on("contextmenu", function(e){ return false; });

    this.redrawCanvas();
  }

  this.drawCanvasBoundingBoxes = function() {
    context.setLineDash([5, 5]);
    
    context.beginPath();
    context.lineWidth = dotted_thickness;
    context.strokeStyle = dotted_rectangle_color;
    context.rect(dotted_thickness/2 + min_object_distance, dotted_thickness/2 + min_object_distance, 
              (canvas.width/2)-dotted_thickness-2*min_object_distance, canvas.height-dotted_thickness-2*min_object_distance); 

    context.rect(kruskal_offset + dotted_thickness/2 + min_object_distance, dotted_thickness/2 + min_object_distance, 
              (canvas.width/2)-dotted_thickness-2*min_object_distance, canvas.height-dotted_thickness-2*min_object_distance); 

    context.stroke();

    context.font="24px Consolas";
    context.textAlign="center";
    context.fillText("Prim", (canvas.width/4), 18);
    context.fillText("Kruskal", (canvas.width*3/4), 18);

    context.setLineDash([])
  }

  
  this.stepForward = function() {
    if(FINISHED) return;
    stepCount++;
    
    this.stepForwardPrim();
    this.stepForwardKruskal();

    this.redrawCanvas();
  } 

  this.stepForwardPrim = function() {
    if(primQueue.length == 0) {
      primLastEdgeAdded = null;
      FINISHED = true;
      return;
    }

    lowestCostPoint = primQueue.splice(this.findMinimumCostInPrimQueue(), 1)[0]

    if(stepCount != 1) {
      primTree.push(lowestCostPoint);
      if(lowestCostPoint.e != null) {
        primEdges.push(lowestCostPoint.e)
        primLastEdgeAdded = lowestCostPoint.e
      }
    }

    //loop over all points in queue
    for(i = 0; i < primQueue.length; i++) {
      queuePoint = primQueue[i];
      edgeWeight = this.euclideanDistance(lowestCostPoint, queuePoint)

      if(edgeWeight < queuePoint.c) {
        queuePoint.c = edgeWeight;
        queuePoint.e = {
          0: queuePoint,
          1: lowestCostPoint
        }
      }
    }
  }

  this.stepForwardKruskal = function() {
    if(kruskalSortedEdges.length == 0) {
      kruskalLastEdgeAdded = null;
      FINISHED = true;
      return;
    }
    
    if(stepCount == 1) return;  //skip first step

    edge = kruskalSortedEdges.shift();

    u = edge[0]
    v = edge[1]

    i = this.findKruskalTreeIndex(u)
    j = this.findKruskalTreeIndex(v)

    if(i != j) {
      kruskalEdges.push(edge)
      this.unifyTrees(i, j)
      kruskalLastEdgeAdded = edge;
    } else {
      this.stepForwardKruskal();
    }
  }

  this.findMinimumCostInPrimQueue = function() {
    minIndex = 0;
    min = Infinity
    for(i = 0; i < primQueue.length; i++) {
      if(primQueue[i].c <= min) {
        minIndex = i;
        min = primQueue[minIndex].c
      }
    }

    return minIndex;
  }

  this.findKruskalTreeIndex = function(point) {
    for(k = 0; k < kruskalTrees.length; k++) {
      if(kruskalTrees[k].indexOf(point) !== -1) return k
    }
  }

  this.unifyTrees = function(i, j) {
    kruskalTrees[i] = kruskalTrees[i].concat(kruskalTrees[j])
    kruskalTrees.splice(j, 1)
  }

  this.stepBackward = function() {
    ISPAUSED = true;
    if(stepCount <= 0) return;
    var destindex = Math.max(stepCount-1, 0);
    DRAW = false;
    this.resetTree();
    while(stepCount != destindex) {
      this.stepForward();
    }
    DRAW = true;
    this.redrawCanvas();
  }

  this.draw = function(evt) {
    var rect = canvas.getBoundingClientRect();
    var pos = {
        x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width + 12,
        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height + 12
    };

    var primPoint
    var kruskalPoint

    if(pos.x < canvas.width/2) {
      //prim point
      primPoint = spanningTree.Point(pos.x, pos.y)
      kruskalPoint = spanningTree.Point(pos.x + kruskal_offset, pos.y)

    } else {
      //kruskal point
      kruskalPoint = spanningTree.Point(pos.x, pos.y)
      primPoint = spanningTree.Point(pos.x - kruskal_offset, pos.y)
    }      

    //check if click is outside the min object distance from every other dot and the border
    //border first:
   
    if(spanningTree.minDistancesValidPrimSide(primPoint)) {
      if(pointCount == pointLimit) {
        alert("Sorry, the number of points is limited to " + pointLimit + ".")
        return;
      }

      pointCount++;

      if(pointCount == 1) primPoint.c = 0;
        
      primQueue.push(primPoint)
      primPoints.push(primPoint);

      for(i = 0; i < kruskalPoints.length; i++) {
        kruskalSortedEdges.push({
          0 : kruskalPoint,
          1 : kruskalPoints[i]
        })
      }
      kruskalSortedEdges.sort(function(A, B) {
        a = spanningTree.euclideanDistance(A[0], A[1])
        b = spanningTree.euclideanDistance(B[0], B[1])

        return a-b
      })
      kruskalPoints.push(kruskalPoint);
      kruskalTrees.push([kruskalPoint])

      spanningTree.resetTree();
      spanningTree.redrawCanvas();      
    } else {
      var primClickedPoint;
      var kruskalClickedPoint;
      var clickedPointIndex = -1;

      for(i = 0; i < primPoints.length; i++) {
        if(spanningTree.euclideanDistance(primPoints[i], primPoint) <= min_object_distance) {
          primClickedPoint = primPoints[i];
          kruskalClickedPoint = kruskalPoints[i];
          clickedPointIndex = i;
          break;
        }
      }

      if(evt.button == 2) { //right mouse button
        spanningTree.resetTree();
        spanningTree.redrawCanvas();

        spanningTree.deletePoint(primClickedPoint, kruskalClickedPoint, clickedPointIndex);

        ISPAUSED = true;

        spanningTree.resetTree();
        spanningTree.redrawCanvas();
      } else {
        ISPAUSED = true;
        primMovingPoint = primClickedPoint;
        kruskalMovingPoint = kruskalClickedPoint;
      }
    }
  }

  this.movePoint = function(evt) {
    if(primMovingPoint == undefined) {
      spanningTree.redrawCanvas();
      return;
    }
    
    if(stepCount > 0) {
      spanningTree.resetTree();
      spanningTree.redrawCanvas();
    }

    var rect = canvas.getBoundingClientRect();
    var pos = {
        x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width + 12,
        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height + 12
    };

    var primPos = {x: pos.x, y: pos.y}
    var kruskalPos = {x: pos.x, y: pos.y}

    if(pos.x < canvas.width/2) {
      //prim side drag
      kruskalPos.x = kruskalPos.x + kruskal_offset;
    } else {
      //kruskal side dragl
      primPos.x = primPos.x - kruskal_offset;
    } 

    var positionValid = true;
    for(i = 0; i < primPoints.length; i++) {
      if(primPoints[i] == primMovingPoint) {
        continue;
      }

      if(spanningTree.euclideanDistance(primPoints[i], primPos) < min_object_distance) {
        positionValid = false;
        break;
      }
    }

    if(primPos.x < (min_object_distance) || primPos.x > ((canvas.width/2) - min_object_distance)) 
      positionValid = false;

    if(primPos.y < (min_object_distance) || primPos.y > (canvas.height - min_object_distance)) 
      positionValid = false;


    if(positionValid) {
      primMovingPoint.x = primPos.x;
      primMovingPoint.y = primPos.y;

      kruskalMovingPoint.x = kruskalPos.x;
      kruskalMovingPoint.y = kruskalPos.y;
    }

    spanningTree.redrawCanvas();
  }

  this.releasePoint = function(evt) {
    primMovingPoint = undefined;
    kruskalMovingPoint = undefined;

    kruskalSortedEdges.sort(function(A, B) {
      a = spanningTree.euclideanDistance(A[0], A[1])
      b = spanningTree.euclideanDistance(B[0], B[1])

      return a-b
    })

    spanningTree.resetTree()
    spanningTree.redrawCanvas();
  }

  this.deletePoint = function(primPoint, kruskalPoint, index) {
    primPoints.splice(index, 1);
    remainingPrimPoints = primPoints;

    spanningTree.clearTree();

    for(index = 0; index < remainingPrimPoints.length; index++) {
      copyPoint = remainingPrimPoints[index]
      var primPoint = spanningTree.Point(copyPoint.x, copyPoint.y)
      var kruskalPoint = spanningTree.Point(copyPoint.x + kruskal_offset, copyPoint.y)

      pointCount++;

      if(pointCount == 1) primPoint.c = 0;
        
      primQueue.push(primPoint)
      primPoints.push(primPoint);

      for(i = 0; i < kruskalPoints.length; i++) {
        kruskalSortedEdges.push({
          0 : kruskalPoint,
          1 : kruskalPoints[i]
        })
      }
      kruskalSortedEdges.sort(function(A, B) {
        a = spanningTree.euclideanDistance(A[0], A[1])
        b = spanningTree.euclideanDistance(B[0], B[1])

        return a-b
      })
      kruskalPoints.push(kruskalPoint);
      kruskalTrees.push([kruskalPoint])
    }

    spanningTree.resetTree();
    spanningTree.redrawCanvas(); 
  }

  this.minDistancesValidPrimSide = function(point) {
    //Prim
    //x
    if(point.x <= min_object_distance || point.x >= ((canvas.width/2) - min_object_distance))
      return false;
    //y
    if(point.y <= min_object_distance || point.y >= (canvas.height - min_object_distance))
      return false;

    var retval = true;
    primPoints.forEach(function(currPoint) {
      if(spanningTree.euclideanDistance(currPoint, point) <= min_object_distance) {
        retval = false;
      } 
    })
    return retval;
  }

  this.euclideanDistance = function(p1, p2) {
    return Math.sqrt(((p1.x - p2.x)*(p1.x - p2.x)) + ((p1.y - p2.y)*(p1.y - p2.y)));
  }

  this.redrawCanvas = function() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if(DRAW) {
      this.drawCanvasBoundingBoxes();

      this.drawPrimTree();
      this.drawKruskalTree();
    }
  }

  this.drawPrimTree = function() {
    context.save();
    context.setLineDash([4, 4]);
    context.lineWidth = "1";
    primQueue.forEach(function(point) {
      if(point.e == null) return;
      color = primNotShortestEdgeColor;
      if(point == primQueue[spanningTree.findMinimumCostInPrimQueue()]) color = primShortestEdgeColor;
      spanningTree.drawEdge(point.e, color)
      
    })
    context.restore();


    primEdges.forEach(function(edge) {
      if(primLastEdgeAdded == edge) spanningTree.drawEdge(edge, primLastAddedEdgeColor)
      else spanningTree.drawEdge(edge, primEdgeColor)
    })

    primPoints.forEach(function(point) {
      spanningTree.drawPoint(point)
    })
  }

  this.drawKruskalTree = function() {
    kruskalEdges.forEach(function(edge) {
      if(kruskalLastEdgeAdded == edge) spanningTree.drawEdge(edge, kruskalLastAddedEdgeColor)
      else spanningTree.drawEdge(edge, kruskalEdgeColor)
    })

    kruskalPoints.forEach(function(point) {
      spanningTree.drawPoint(point)
    })
  }

  this.drawPoint = function(point){
    context.beginPath();
    context.fillStyle = point.f.color
    if(point.f.removedPoint) context.fillStyle = removed_point_color;
    context.arc(point.x, point.y, dot_radius, 0, 2*Math.PI);
    context.fill();
    
    //uncomment for debugging purposes
    /*
    context.font="15px Consolas";
    context.textAlign="center";
    context.fillText(+point.i,point.x,(point.y-13));
    context.fillStyle = "black";
    */

    if(stepCount != 0) return;

    context.beginPath();
    context.setLineDash([4, 4]);
    context.strokeStyle = point.f.circle;
    context.lineWidth = dot_circle_thickness;
    context.arc(point.x, point.y, dot_circle, 0, 2*Math.PI);
    context.stroke();
    context.setLineDash([]);
  }

  this.drawEdge = function(edge, color) {
    context.beginPath()
    context.strokeStyle = color
    context.moveTo(edge[0].x, edge[0].y)
    context.lineTo(edge[1].x, edge[1].y)
    context.stroke()
  }


  this.Point = function(x_coord, y_coord) {
    var newPoint = {
      x : x_coord,
      y : y_coord,
      c : Infinity,    //cost
      e : null,      //edge
      i : pointCount + 1,
      f : {color: default_dot_color,     //flags
         circle: dot_circle_color}    
      };
     return newPoint;
  }

  this.runInterval = function(){
    if(spanningTree.active) {
      if(!ISPAUSED) {
        spanningTree.stepForward();
      }
      clearInterval(spanningTree.interval);
        runspeed = exec_interval*speed;
        spanningTree.interval = setInterval(spanningTree.runInterval, runspeed);
    }
  }
  this.interval = setInterval(this.runInterval, exec_interval*speed);

  this.runAlgorithm = function() {
    if(primPoints.length > 0 && !FINISHED)
      ISPAUSED = false;  
  }

  this.pauseAlgorithm = function() {
    ISPAUSED = true;
  }

  this.updateSpeed = function(new_speed) {
    speed = (11-new_speed);
  }

  this.randomizeStart = function() {
    this.resetTree();
    
    lowestCostIndex = this.findMinimumCostInPrimQueue();
    randomIndex = Math.floor(Math.random() * (primQueue.length-1))
    while(randomIndex == lowestCostIndex) {
      randomIndex = Math.floor(Math.random() * (primQueue.length-1))
    }

    primQueue[lowestCostIndex].c = Infinity;
    primQueue[randomIndex].c = 0;

    primPoints[lowestCostIndex].c = Infinity;
    primPoints[randomIndex].c = 0;
  }

  this.resetTree = function() {
    stepCount = 0;

    for(i = 0; i < primPoints.length; i++) {
      primPoints[i].e = null;
      if(primPoints[i].c != 0) primPoints[i].c = Infinity;
    }

    primTree = new Array();
    primQueue = primPoints.concat(new Array());
    primEdges = new Array();
    primLastEdgeAdded = null;

    kruskalTrees = new Array();
    kruskalEdges = new Array();
    kruskalSortedEdges = new Array();
    kruskalLastEdgeAdded = null;

    for(i = 0; i < kruskalPoints.length; i++) {
      kruskalTrees.push([kruskalPoints[i]])

      for(j = 0; j < kruskalPoints.length; j++) {
        if(j == i) continue;

        kruskalSortedEdges.push({
            0 : kruskalPoints[i],
            1 : kruskalPoints[j]
          })
      }
    }

    kruskalSortedEdges.sort(function(A, B) {
        a = spanningTree.euclideanDistance(A[0], A[1])
        b = spanningTree.euclideanDistance(B[0], B[1])

        return a-b
      })  

    FINISHED = false;
    DRAW = true;
    ISPAUSED = true;

    this.redrawCanvas();
  }

  this.clearTree = function() {
    stepCount = 0;

    primPoints = new Array();
    primTree = new Array();
    primQueue = new Array();
    primEdges = new Array();
    primLastEdgeAdded = null;

    kruskalPoints = new Array();
    kruskalTrees = new Array();
    kruskalEdges = new Array();
    kruskalSortedEdges = new Array();
    kruskalLastEdgeAdded = null;

    pointCount = 0;

    FINISHED = false;
    DRAW = true;
    ISPAUSED = true;

    this.redrawCanvas();  
  }

  this.finishTree = function() {
    if(pointCount < 4) return;
    ISPAUSED = true;
    DRAW = false;
    while(!FINISHED) {
      this.stepForward();
    }
    DRAW = true;
    this.redrawCanvas();
  }
};

spanningTree = new MinimalSpanningTree();