function IterativeHull() {
  this.active = false;
  var width = 640;
  var height = 640;
  var grid_border = 10;

  var content_div;
  var info_div;
  var algo_div;

  var canvas;
  var context;

  var firstPoint = null;
  var secondPoint = null;
  var thirdPoint = null;

  var witnessRandomNumbers = []
  var witnessRandomIndex = 0
  var addPointRandomNumbers = []
  var addPointRandomIndex = 0

  var centerPoint = null;
  var currentWitnessEdge = null;
  var currentDescriptionLine = null;
  var hullVertices = new Array();
  var hullEdges = new Array();
  var removedPoints = new Array();
  var remainingPoints = new Array();
  var unwitnessedPoints = new Array();
  var allPoints = new Array();
  var witnesses = new Map();
  var stepCount = 0;
  var pointLimit = 25;
  var pointCount = 0;

  var addedPoint = null;
  var clockwiseTangentPoint = null;
  var counterclockwiseTangentPoint = null;
  var removedEdges = new Array();

  var font_size = 24;

  var exec_interval = 50;  //ms
  var speed = 5;

  var default_dot_color = "#222222";
  var dot_circle_color = "#BBBBBB";
  var dotted_rectangle_color = "#000000";

  var hull_color = "#000088";
  var valid_witness_color = "#09B516";
  var invalid_witness_color = "#B22222";
  var witness_color = "#FF8A00";
  var center_point_color = "#09B516";
  var dotted_line_color = "#999999"
  var removed_point_color = "#B22222";

  var dotted_thickness = "2";
  var dot_circle_thickness = "2";
  var dot_radius = 5
  var dot_circle = 20
  var min_object_distance = 20;

  var movingPoint = undefined;

  //global algorithm variables
  var FINISHED = false;
  var ISPAUSED = true;
  var DRAW = true;
  var ADDPOINT = true;

  var canvasOffset;
  var offsetX;
  var offsetY;

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

  this.stepForward = function() {
    if(FINISHED) {
      ISPAUSED = true;
      this.redrawCanvas();
      return;
    }
    if(allPoints.length <= 3) {
      stepCount++;
      this.redrawCanvas();
      FINISHED = true;
      ISPAUSED = true;
      return;
    };
    stepCount++;
    if(stepCount == 1) {
      //draw initial triangle
      this.redrawCanvas();
      return;
    }
    currentDescriptionLine = null;
    if(unwitnessedPoints.length != 0) {
      //select random point in unwitnessedPoints and check for witnesses
      randomIndex = -1;
      if(witnessRandomNumbers[witnessRandomIndex] == undefined) {
        //new random number to be generated
        randomIndex = Math.floor(Math.random() * unwitnessedPoints.length);
        witnessRandomNumbers.push(randomIndex)
        witnessRandomIndex++;
      } else {
        randomIndex = witnessRandomNumbers[witnessRandomIndex]
        witnessRandomIndex++;
      }

      randomPoint = unwitnessedPoints[randomIndex];

      descriptionLine = {
        0: randomPoint, 
        1: centerPoint
      }

      //search for witness
      witness = this.searchForHullIntersection(descriptionLine)
      
      currentDescriptionLine = descriptionLine;

      if(witness == null) {
        currentWitnessEdge = null;

        randomPoint.f.removedPoint = true;
        removedPoints.push(randomPoint)

        remainingPoints.splice(remainingPoints.indexOf(randomPoint), 1)
      } else {
        currentDescriptionLine = descriptionLine;
        currentWitnessEdge = witness;

        pointsWitnessedByCurrentWitness = witnesses.get(witness)
        if(pointsWitnessedByCurrentWitness == undefined) {
          witnesses.set(witness, new Array());
        }

        witnesses.get(witness).push(randomPoint)

        randomPoint.w = witness
      }

      unwitnessedPoints.splice(randomIndex, 1);

    } else {
      if(remainingPoints.length == 0 && ADDPOINT) {
        this.redrawCanvas();
        FINISHED = true;
        ISPAUSED = true;
        return;
      }
      if(ADDPOINT) {
        //insert
        //select random point from remaining points and add it to the hull
        randomIndex = -1;
        if(addPointRandomNumbers[addPointRandomIndex] == undefined) {
          //new random number to be generated
          randomIndex = Math.floor(Math.random() * remainingPoints.length);
          addPointRandomNumbers.push(randomIndex)
          addPointRandomIndex++;
        } else {
          randomIndex = addPointRandomNumbers[addPointRandomIndex]
          addPointRandomIndex++;
        }
        randomPoint = remainingPoints[randomIndex];

        originalWitness = randomPoint.w;

        tangentPoints = this.getTangentPoints(randomPoint)

        addedPoint = randomPoint;
        clockwiseTangentPoint = tangentPoints["clockwise"]
        counterclockwiseTangentPoint = tangentPoints["counterclockwise"]

        witnesses.get(addedPoint.w).splice(witnesses.get(addedPoint.w).indexOf(addedPoint), 1)

        hullVertices.push(addedPoint);
        remainingPoints.splice(remainingPoints.indexOf(addedPoint), 1)

        clockwiseEdge = {
          0: clockwiseTangentPoint,
          1: addedPoint
        }

        counterclockwiseEdge = {
          0: addedPoint,
          1: counterclockwiseTangentPoint
        }

        clockwiseIndex = hullEdges.indexOf(removedEdges[0])
        counterclockwiseIndex = hullEdges.indexOf(removedEdges[removedEdges.length-1])

        if(clockwiseIndex == counterclockwiseIndex) {
          counterclockwiseIndex = (counterclockwiseIndex+1) % hullEdges.length
          hullEdges.splice(clockwiseIndex, 0, clockwiseEdge)
          hullEdges.splice(counterclockwiseIndex, 0, counterclockwiseEdge)
        } else if(counterclockwiseIndex > clockwiseIndex) {
          hullEdges.splice(clockwiseIndex, 0, clockwiseEdge)
          counterclockwiseIndex = (counterclockwiseIndex+1) % hullEdges.length
          hullEdges.splice(counterclockwiseIndex, 0, counterclockwiseEdge)
        } else {
          hullEdges.splice(clockwiseIndex, 0, clockwiseEdge)
          hullEdges.splice(counterclockwiseIndex, 0, counterclockwiseEdge)
        }        

        ADDPOINT = false;
      } else {
        removedHullVertices = []

        for(i = 0; i < removedEdges.length; i++) {
          pointA = removedEdges[i][0]
          pointB = removedEdges[i][1]

          if(removedHullVertices.indexOf(pointA) == -1)
            removedHullVertices.push(pointA)
          if(removedHullVertices.indexOf(pointB) == -1)
            removedHullVertices.push(pointB)          

          index = hullEdges.indexOf(removedEdges[i])
          hullEdges.splice(index, 1)

          newlyUnwitnessedPoints = witnesses.get(removedEdges[i])
            if(newlyUnwitnessedPoints != undefined) {
              for(j = 0; j < newlyUnwitnessedPoints.length; j++) {
              newlyUnwitnessedPoints[j].w = null;
              unwitnessedPoints.push(newlyUnwitnessedPoints[j])
            }
            witnesses.delete(removedEdges[i])
          }
        }
        
        removedHullVertices.splice(removedHullVertices.indexOf(clockwiseTangentPoint), 1);
        removedHullVertices.splice(removedHullVertices.indexOf(counterclockwiseTangentPoint), 1);

        hullVertices = hullVertices.filter(function(element) {
          return removedHullVertices.indexOf(element) < 0;
        });

        for(i = 0; i < removedHullVertices.length; i++) {
          unwitnessedPoints.push(removedHullVertices[i])
          remainingPoints.push(removedHullVertices[i])
        }      

        clockwiseTangentPoint = null;
        counterclockwiseTangentPoint = null;
        
        ADDPOINT = true;
      }
    }
    this.redrawCanvas();
  } 

  this.stepBackward = function() {
    ISPAUSED = true;
    if(stepCount <= 0) return;
    var destindex = Math.max(stepCount-1, 0);
    this.resetHull();
    stepCount = 0;
    while(stepCount != destindex) {
      this.stepForward();
    }
    this.redrawCanvas();
  }

  this.getTangentPoints = function(outsidePoint) {
    removedEdges = new Array();

    outsidePointWitness = randomPoint.w;

    indexOfWitness = hullEdges.indexOf(outsidePointWitness)

    biggerIndex = indexOfWitness + 1
    lowerIndex = indexOfWitness - 1

    if(biggerIndex == hullEdges.length)
      biggerIndex = 0;
    if(lowerIndex == -1)
      lowerIndex = hullEdges.length-1 

    ccwiseNeighbourOfWitness = hullEdges[biggerIndex]
    clwiseNeighbourOfWitness = hullEdges[lowerIndex]

    clwisePoint = clwiseNeighbourOfWitness[1]
    ccwisePoint = ccwiseNeighbourOfWitness[0]

    clwiseTangent = {
      0: clwisePoint,
      1: randomPoint
    }

    ccwiseTangent = {
      0: ccwisePoint,
      1: randomPoint
    }

    clockwisePointCounterclockwiseEdge = outsidePointWitness;
    clockwisePointClockwiseEdge = clwiseNeighbourOfWitness;

    counterclockwisePointCounterclockwiseEdge = ccwiseNeighbourOfWitness;
    counterclockwisePointClockwiseEdge = outsidePointWitness;


    clockwiseDifferentSides = (!this.arePointsOnOppositeSidesOfEdge(centerPoint, randomPoint, clockwisePointCounterclockwiseEdge) && 
                  this.arePointsOnOppositeSidesOfEdge(centerPoint, randomPoint, clockwisePointClockwiseEdge)) || 
                   (this.arePointsOnOppositeSidesOfEdge(centerPoint, randomPoint, clockwisePointCounterclockwiseEdge) && 
                   !this.arePointsOnOppositeSidesOfEdge(centerPoint, randomPoint, clockwisePointClockwiseEdge))

    counterclockwiseDifferentSides = (!this.arePointsOnOppositeSidesOfEdge(centerPoint, randomPoint, counterclockwisePointCounterclockwiseEdge) && 
                       this.arePointsOnOppositeSidesOfEdge(centerPoint, randomPoint, counterclockwisePointClockwiseEdge)) || 
                       (this.arePointsOnOppositeSidesOfEdge(centerPoint, randomPoint, counterclockwisePointCounterclockwiseEdge) && 
                       !this.arePointsOnOppositeSidesOfEdge(centerPoint, randomPoint, counterclockwisePointClockwiseEdge))

    while(!clockwiseDifferentSides)
    {  
      guaranteedRemovedEdge = clwiseNeighbourOfWitness;
      indexOfWitness = lowerIndex
      lowerIndex = indexOfWitness - 1
      if(lowerIndex == -1)
        lowerIndex = hullEdges.length-1 
      clwiseNeighbourOfWitness = hullEdges[lowerIndex]
      clwisePoint = clwiseNeighbourOfWitness[1]

      clwiseTangent = {
        0: clwisePoint,
        1: randomPoint
      }

      clockwisePointCounterclockwiseEdge = guaranteedRemovedEdge;
      clockwisePointClockwiseEdge = clwiseNeighbourOfWitness;

      clockwiseDifferentSides = (!this.arePointsOnOppositeSidesOfEdge(centerPoint, randomPoint, clockwisePointCounterclockwiseEdge) && 
                    this.arePointsOnOppositeSidesOfEdge(centerPoint, randomPoint, clockwisePointClockwiseEdge)) || 
                     (this.arePointsOnOppositeSidesOfEdge(centerPoint, randomPoint, clockwisePointCounterclockwiseEdge) && 
                     !this.arePointsOnOppositeSidesOfEdge(centerPoint, randomPoint, clockwisePointClockwiseEdge))

         removedEdges.unshift(guaranteedRemovedEdge)
    }

    removedEdges.push(outsidePointWitness)

    while(!counterclockwiseDifferentSides)
    {  
      guaranteedRemovedEdge = ccwiseNeighbourOfWitness;
      indexOfWitness = biggerIndex
      biggerIndex = indexOfWitness + 1
      if(biggerIndex == hullEdges.length)
        biggerIndex = 0;
      ccwiseNeighbourOfWitness = hullEdges[biggerIndex]
      ccwisePoint = ccwiseNeighbourOfWitness[0]

      ccwiseTangent = {
        0: ccwisePoint,
        1: randomPoint
      }

      counterclockwisePointCounterclockwiseEdge = ccwiseNeighbourOfWitness;
      counterclockwisePointClockwiseEdge = guaranteedRemovedEdge;

        counterclockwiseDifferentSides = (!this.arePointsOnOppositeSidesOfEdge(centerPoint, randomPoint, counterclockwisePointCounterclockwiseEdge) && 
                           this.arePointsOnOppositeSidesOfEdge(centerPoint, randomPoint, counterclockwisePointClockwiseEdge)) || 
                           (this.arePointsOnOppositeSidesOfEdge(centerPoint, randomPoint, counterclockwisePointCounterclockwiseEdge) && 
                           !this.arePointsOnOppositeSidesOfEdge(centerPoint, randomPoint, counterclockwisePointClockwiseEdge))

      removedEdges.push(guaranteedRemovedEdge)
    }

    return {"clockwise": clwisePoint, "counterclockwise": ccwisePoint};
  }

  this.searchForHullIntersection = function(line) {
    foundedge = null;
    hullEdges.forEach(function(edge) {
      x1 = line[0].x
      x2 = line[1].x
      x3 = edge[0].x
      x4 = edge[1].x
      y1 = line[0].y
      y2 = line[1].y
      y3 = edge[0].y
      y4 = edge[1].y

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
         foundedge = edge;   
         return;
        }
    })

    return foundedge;
  }

  //from http://math.stackexchange.com/a/162733
  this.arePointsOnOppositeSidesOfEdge = function(PointA, PointB, Edge) {
     //var Exminus = Edge[1].x - Edge[0].x
     y1 = Edge[0].y
     y2 = Edge[1].y
     x1 = Edge[0].x
     x2 = Edge[1].x

     ax = PointA.x
     ay = PointA.y
     bx = PointB.x
     by = PointB.y

     return ((y1-y2)*(ax-x1)+(x2-x1)*(ay-y1))*((y1-y2)*(bx-x1)+(x2-x1)*(by-y1))<0
  }

  this.draw = function(evt) {
    var rect = canvas.getBoundingClientRect();
    var pos = {
        x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width + 12,
        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height + 12
    };
    var point = iterativeHull.Point(pos.x, pos.y)
    //check if click is outside the min object distance from every other dot and the border
    //border first:
   
    if(iterativeHull.minDistancesValid(point)) {
      if(pointCount == pointLimit) {
        alert("Sorry, the number of points is limited to " + pointLimit + ".")
        return;
      }
      if(evt.button == 2) {
        return;
      }

      ISPAUSED = true;
      pointCount++;

      remainingPoints.push(point);
      if(hullVertices.length < 3) iterativeHull.createInitialHull()
      else unwitnessedPoints.push(point)
      allPoints.push(point);

      iterativeHull.resetHull();
      iterativeHull.redrawCanvas();      
    } else {
      var clickedPoint;
      var clickedPointIndex = -1;
      for(i = 0; i < allPoints.length; i++) {
        if(iterativeHull.euclideanDistance(allPoints[i], point) <= min_object_distance) {
          clickedPoint = allPoints[i];
          clickedPointIndex = i;
          break;
        }
      }

      if(evt.button == 2) { //right mouse button
        iterativeHull.resetHull();
        iterativeHull.redrawCanvas();

        iterativeHull.deletePoint(clickedPoint, clickedPointIndex);

        ISPAUSED = true;

        iterativeHull.resetHull();
        iterativeHull.redrawCanvas();
      } else {
        ISPAUSED = true;
        movingPoint = clickedPoint;
      }
    }
  }

  this.movePoint = function(evt) {
    if(movingPoint == undefined) {
      iterativeHull.redrawCanvas();
      return;
    }
    
    if(stepCount > 0) {
      iterativeHull.resetHull();
      iterativeHull.redrawCanvas();
    }

    var rect = canvas.getBoundingClientRect();
    var pos = {
        x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width + 12,
        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height + 12
    };

    var positionValid = true;
    for(i = 0; i < allPoints.length; i++) {
      if(allPoints[i] == movingPoint) {
        continue;
      }

      if(iterativeHull.euclideanDistance(allPoints[i], pos) < min_object_distance) {
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

    iterativeHull.redrawCanvas();
  }

  this.releasePoint = function(evt) {
    movingPoint = undefined;

    iterativeHull.resetHull();
    iterativeHull.redrawCanvas();
  }

  this.deletePoint = function(point, index) {
    allPoints.splice(index, 1);
    allRemainingPoints = allPoints;

    iterativeHull.clearHull();

    for(index = 0; index < allRemainingPoints.length; index++) {
      copyPoint = allRemainingPoints[index]
      var point = iterativeHull.Point(copyPoint.x, copyPoint.y)

      ISPAUSED = true;
      pointCount++;

      remainingPoints.push(point);
      if(hullVertices.length < 3) iterativeHull.createInitialHull()
      else unwitnessedPoints.push(point)
      allPoints.push(point);
    }

    iterativeHull.resetHull();
    iterativeHull.redrawCanvas();
  }

  this.createInitialHull = function() {
    switch(hullVertices.length) {
      case 0:     //only one point exists on the canvas
        vertex = remainingPoints[0]

        hullVertices.push(vertex)
        remainingPoints.splice(0, 1)
        break;
      case 1:     //two points on the canvas
        vertex = remainingPoints[0]

        hullVertices.push(vertex)
        remainingPoints.splice(0, 1)

        hullEdges.push({
          0: hullVertices[0], 
          1: hullVertices[1]
        })
        break;
      case 2:     //three points on the canvas
        hullEdges = new Array();

        vertex = remainingPoints[0]

        hullVertices.push(vertex)
        remainingPoints.splice(0, 1)

        v1 = hullVertices[0];
        v2 = hullVertices[1];
        v3 = hullVertices[2];

        centerPoint = this.Point((v1.x + v2.x + v3.x)/3.0, 
                 (v1.y + v2.y + v3.y)/3.0)

        sortedPoints = this.sortHullPointsByAngleCounterclockwise([v1, v2, v3])
        
        while(sortedPoints[0] != v1) {
          sortedPoints.push(sortedPoints.shift())
        }    

        firstPoint = sortedPoints[0]
        secondPoint = sortedPoints[1]
        thirdPoint = sortedPoints[2]

        hullEdges.push({
          0: firstPoint, 
          1: secondPoint
        })

        hullEdges.push({
          0: secondPoint, 
          1: thirdPoint
        })

        hullEdges.push({
          0: thirdPoint, 
          1: firstPoint
        })

        break;
      default: return;
    }
  }

  this.sortHullPointsByAngleCounterclockwise = function(array) {
    map = new Map();

    atans = []
    for(i = 0; i < array.length; i++) {
      a = Math.atan2(array[i].y - centerPoint.y, array[i].x - centerPoint.x)
      map.set((this.toDegrees(-a) + 360) % 360, array[i])
      atans.push((this.toDegrees(-a) + 360) % 360)
    }

    atans.sort();

    points = []
    for(i = 0; i < atans.length; i++) {
      points.push(map.get(atans[i]))
    }

    return points;
  }

  this.minDistancesValid = function(point) {
    //x
    if(point.x <= min_object_distance || point.x >= (canvas.width - min_object_distance))
      return false;
    //y
    if(point.y <= min_object_distance || point.y >= (canvas.height - min_object_distance))
      return false;

    var retval = true;
    hullVertices.forEach(function(currPoint) {
      if(iterativeHull.euclideanDistance(currPoint, point) <= min_object_distance) {
        retval = false;
      } 
    })
    removedPoints.forEach(function(currPoint) {
      if(iterativeHull.euclideanDistance(currPoint, point) <= min_object_distance) {
        retval = false;
      } 
    })
    remainingPoints.forEach(function(currPoint) {
      if(iterativeHull.euclideanDistance(currPoint, point) <= min_object_distance) {
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
      this.drawCanvasBoundingBox();
      if(stepCount > 0) {
        this.drawHullEdges();
      
        if(currentDescriptionLine != null) {
          if(currentWitnessEdge == null) {
            this.drawEdge(currentDescriptionLine, invalid_witness_color)
          } else {
            this.drawEdge(currentWitnessEdge, witness_color)
            this.drawEdge(currentDescriptionLine, valid_witness_color)
          }
        }
      }

      this.drawRemovedPoints();
      this.drawRemainingPoints();
      this.drawHullVertices();
      if(stepCount > 0) this.drawCenterPoint();      
      this.drawStep();
    }
  }

  this.drawHullEdges = function() {
    hullEdges.forEach(function(edge) {
      iterativeHull.drawEdge(edge, hull_color)
    })
  }

  this.drawRemovedPoints = function() {
    removedPoints.forEach(function(point) {
      iterativeHull.drawPoint(point)
    })
  }

  this.drawRemainingPoints = function() {
    remainingPoints.forEach(function(point) {
      iterativeHull.drawPoint(point)
    })
  }

  this.drawHullVertices = function() {
    hullVertices.forEach(function(point) {
      iterativeHull.drawPoint(point)
    })
  }
  
  this.drawStep = function() {
    context.fillStyle = "black";
    context.font="24px Consolas";
    context.textAlign="left";
    context.fillText("Step: " + +stepCount, 24, 18);
  }

  this.drawPoint = function(point){
    context.beginPath();
    context.fillStyle = point.f.color;
    if(point.f.removedPoint) context.fillStyle = removed_point_color;
    context.arc(point.x, point.y, dot_radius, 0, 2*Math.PI);
    context.fill();
    /*uncomment for debugging purposes
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

  this.drawCenterPoint = function() {
    if(centerPoint == null) return;
    context.beginPath();
    context.fillStyle = center_point_color;
    context.arc(centerPoint.x, centerPoint.y, dot_radius, 0, 2*Math.PI);
    context.fill();
  }

  this.toDegrees = function(angle) {
    return angle * (180 / Math.PI);
  }

  this.Point = function(x_coord, y_coord) {
    var newPoint = {
      x : x_coord,
      y : y_coord,
      w : null,
      i : pointCount + 1,
      f : {color: default_dot_color,     //flags
         circle: dot_circle_color,
         removedPoint: false}    
      };
     return newPoint;
  }

  this.runInterval = function(){
    if(iterativeHull.active) {
      if(!ISPAUSED) {
        iterativeHull.stepForward();
      }
      clearInterval(iterativeHull.interval);
        runspeed = exec_interval*speed;
        iterativeHull.interval = setInterval(iterativeHull.runInterval, runspeed);
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

  this.toggleExpand = function(checkbox, divname) {
    if(checkbox.checked) {
      document.getElementById(divname).style.maxHeight = "1000px";
    } else {
      document.getElementById(divname).style.maxHeight = "0px";
    }
  }

  this.randomizeOrder = function() {
    witnessRandomNumbers = []
    witnessRandomIndex = 0
    addPointRandomNumbers = []
    addPointRandomIndex = 0

    this.resetHull();
  }

  this.resetHull = function() {
    if(allPoints.length == 0) return;
    if(allPoints.length <= 3) {
      stepCount = 0;
      this.redrawCanvas();

      FINISHED = false;
      ISPAUSED = true;
      DRAW = true;
      ADDPOINT = true;

      return;
    }; 

    witnessRandomIndex = 0
    addPointRandomIndex = 0

    currentWitnessEdge = null;
    currentDescriptionLine = null;
    hullVertices = new Array();
    hullEdges = new Array();
    removedPoints = new Array();
    remainingPoints = new Array();
    unwitnessedPoints = new Array();
    witnesses = new Map();
    stepCount = 0;

    addedPoint = null;
    clockwiseTangentPoint = null;
    counterclockwiseTangentPoint = null;
    removedEdges = new Array();

    FINISHED = false;
    ISPAUSED = true;
    DRAW = true;
    ADDPOINT = true;


    hullEdges.push({
      0: firstPoint, 
      1: secondPoint
    })

    hullEdges.push({
      0: secondPoint, 
      1: thirdPoint
    })

    hullEdges.push({
      0: thirdPoint, 
      1: firstPoint
    })


    hullVertices.push(firstPoint)
    hullVertices.push(secondPoint)
    hullVertices.push(thirdPoint)

    for(i = 0; i < allPoints.length; i++) {
      allPoints[i].w = null;
      allPoints[i].f.removedPoint = false;
      if(allPoints[i] != firstPoint && allPoints[i] != secondPoint && allPoints[i] != thirdPoint) {
        remainingPoints.push(allPoints[i])
        unwitnessedPoints.push(allPoints[i])
      }
    }

    this.redrawCanvas();
  }

  this.clearHull = function() {
    witnessRandomNumbers = []
    witnessRandomIndex = 0
    addPointRandomNumbers = []
    addPointRandomIndex = 0

    firstPoint = null;
    secondPoint = null;
    thirdPoint = null;

    centerPoint = null;
    currentWitnessEdge = null;
    currentDescriptionLine = null;
    hullVertices = new Array();
    hullEdges = new Array();
    removedPoints = new Array();
    remainingPoints = new Array();
    unwitnessedPoints = new Array();
    allPoints = new Array();
    witnesses = new Map();
    stepCount = 0;
    pointCount = 0;

    addedPoint = null;
    clockwiseTangentPoint = null;
    counterclockwiseTangentPoint = null;
    removedEdges = new Array();

    FINISHED = false;
    ISPAUSED = true;
    DRAW = true;
    ADDPOINT = true;

    this.redrawCanvas();  
  }

  this.finishHull = function() {
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

iterativeHull = new IterativeHull();