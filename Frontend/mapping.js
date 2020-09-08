/*Frontend Interface of Program Synthesis using Interactive State Diagrams
v1.3.0
Made by TSUI, Yiu Ming and LEUNG, Chun Kit
for the Final Year Project
for the requirement of BEng Information Engineering, CUHK*/

/*DISCLAIMER: This software is based on the work made previously by Evan Wallace licensed in MIT License as below. We hereby appreciate his work.*/

/*
 Finite State Machine Designer (http://madebyevan.com/fsm/)
 License: MIT License (see below)

 Copyright (c) 2010 Evan Wallace

 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.
*/

function Link(a, b) {
  this.nodeA = a;
  this.nodeB = b;
  this.text = '';
  this.lineAngleAdjust = 0; // value to add to textAngle when link is straight line

  // make anchor point relative to the locations of nodeA and nodeB
  this.parallelPart = 0.5; // percentage from nodeA to nodeB
  this.perpendicularPart = 0; // pixels from line between nodeA and nodeB

}

Link.prototype.getAnchorPoint = function() {
  var dx = this.nodeB.x - this.nodeA.x;
  var dy = this.nodeB.y - this.nodeA.y;
  var scale = Math.sqrt(dx * dx + dy * dy);
  return {
    'x': this.nodeA.x + dx * this.parallelPart - dy * this.perpendicularPart / scale,
    'y': this.nodeA.y + dy * this.parallelPart + dx * this.perpendicularPart / scale
  };
};

Link.prototype.setAnchorPoint = function(x, y) {
  var dx = this.nodeB.x - this.nodeA.x;
  var dy = this.nodeB.y - this.nodeA.y;
  var scale = Math.sqrt(dx * dx + dy * dy);
  this.parallelPart = (dx * (x - this.nodeA.x) + dy * (y - this.nodeA.y)) / (scale * scale);
  this.perpendicularPart = (dx * (y - this.nodeA.y) - dy * (x - this.nodeA.x)) / scale;
  // snap to a straight line
  if (this.parallelPart > 0 && this.parallelPart < 1 && Math.abs(this.perpendicularPart) < snapToPadding) {
    this.lineAngleAdjust = (this.perpendicularPart < 0) * Math.PI;
    this.perpendicularPart = 0;
  }
};

Link.prototype.getEndPointsAndCircle = function() {
  if (this.perpendicularPart == 0) {
    var midX = (this.nodeA.x + this.nodeB.x) / 2;
    var midY = (this.nodeA.y + this.nodeB.y) / 2;
    var start = this.nodeA.closestPointOnCircle(midX, midY);
    var end = this.nodeB.closestPointOnCircle(midX, midY);
    return {
      'hasCircle': false,
      'startX': start.x,
      'startY': start.y,
      'endX': end.x,
      'endY': end.y,
    };
  }
  var anchor = this.getAnchorPoint();
  var circle = circleFromThreePoints(this.nodeA.x, this.nodeA.y, this.nodeB.x, this.nodeB.y, anchor.x, anchor.y);
  var isReversed = (this.perpendicularPart > 0);
  var reverseScale = isReversed ? 1 : -1;
  var startAngle = Math.atan2(this.nodeA.y - circle.y, this.nodeA.x - circle.x) - reverseScale * nodeRadius / circle.radius;
  var endAngle = Math.atan2(this.nodeB.y - circle.y, this.nodeB.x - circle.x) + reverseScale * nodeRadius / circle.radius;
  var startX = circle.x + circle.radius * Math.cos(startAngle);
  var startY = circle.y + circle.radius * Math.sin(startAngle);
  var endX = circle.x + circle.radius * Math.cos(endAngle);
  var endY = circle.y + circle.radius * Math.sin(endAngle);
  return {
    'hasCircle': true,
    'startX': startX,
    'startY': startY,
    'endX': endX,
    'endY': endY,
    'startAngle': startAngle,
    'endAngle': endAngle,
    'circleX': circle.x,
    'circleY': circle.y,
    'circleRadius': circle.radius,
    'reverseScale': reverseScale,
    'isReversed': isReversed,
  };
};

Link.prototype.draw = function(c) {
  var stuff = this.getEndPointsAndCircle();
  // draw arc
  c.beginPath();
  if (stuff.hasCircle) {
    c.arc(stuff.circleX, stuff.circleY, stuff.circleRadius, stuff.startAngle, stuff.endAngle, stuff.isReversed);
  } else {
    c.moveTo(stuff.startX, stuff.startY);
    c.lineTo(stuff.endX, stuff.endY);
  }
  c.stroke();
  // draw the head of the arrow
  if (stuff.hasCircle) {
    drawArrow(c, stuff.endX, stuff.endY, stuff.endAngle - stuff.reverseScale * (Math.PI / 2));
  } else {
    drawArrow(c, stuff.endX, stuff.endY, Math.atan2(stuff.endY - stuff.startY, stuff.endX - stuff.startX));
  }
  // draw the text
  if (stuff.hasCircle) {
    var startAngle = stuff.startAngle;
    var endAngle = stuff.endAngle;
    if (endAngle < startAngle) {
      endAngle += Math.PI * 2;
    }
    var textAngle = (startAngle + endAngle) / 2 + stuff.isReversed * Math.PI;
    var textX = stuff.circleX + stuff.circleRadius * Math.cos(textAngle);
    var textY = stuff.circleY + stuff.circleRadius * Math.sin(textAngle);
    drawText(c, this.text, textX, textY, textAngle, selectedObject == this, true);
  } else {
    var textX = (stuff.startX + stuff.endX) / 2;
    var textY = (stuff.startY + stuff.endY) / 2;
    var textAngle = Math.atan2(stuff.endX - stuff.startX, stuff.startY - stuff.endY);
    drawText(c, this.text, textX, textY, textAngle + this.lineAngleAdjust, selectedObject == this, true);
  }
};

Link.prototype.containsPoint = function(x, y) {
  var stuff = this.getEndPointsAndCircle();
  if (stuff.hasCircle) {
    var dx = x - stuff.circleX;
    var dy = y - stuff.circleY;
    var distance = Math.sqrt(dx * dx + dy * dy) - stuff.circleRadius;
    if (Math.abs(distance) < hitTargetPadding) {
      var angle = Math.atan2(dy, dx);
      var startAngle = stuff.startAngle;
      var endAngle = stuff.endAngle;
      if (stuff.isReversed) {
        var temp = startAngle;
        startAngle = endAngle;
        endAngle = temp;
      }
      if (endAngle < startAngle) {
        endAngle += Math.PI * 2;
      }
      if (angle < startAngle) {
        angle += Math.PI * 2;
      } else if (angle > endAngle) {
        angle -= Math.PI * 2;
      }
      return (angle > startAngle && angle < endAngle);
    }
  } else {
    var dx = stuff.endX - stuff.startX;
    var dy = stuff.endY - stuff.startY;
    var length = Math.sqrt(dx * dx + dy * dy);
    var percent = (dx * (x - stuff.startX) + dy * (y - stuff.startY)) / (length * length);
    var distance = (dx * (y - stuff.startY) - dy * (x - stuff.startX)) / length;
    return (percent > 0 && percent < 1 && Math.abs(distance) < hitTargetPadding);
  }
  return false;
};

function Node(x, y) {
  this.id = undefined;
  this.x = x;
  this.y = y;
  this.mouseOffsetX = 0;
  this.mouseOffsetY = 0;
  //this.isAcceptState = false;
  this.text = '';
  this.entryActions = [];
}

Node.prototype.setMouseStart = function(x, y) {
  this.mouseOffsetX = this.x - x;
  this.mouseOffsetY = this.y - y;
};

Node.prototype.setAnchorPoint = function(x, y) {
  this.x = x + this.mouseOffsetX;
  this.y = y + this.mouseOffsetY;
};

Node.prototype.draw = function(c) {
  // draw the circle
  c.beginPath();
  c.arc(this.x, this.y, nodeRadius, 0, 2 * Math.PI, false);
  c.stroke();
  var node_text = '';
  if (this.id == undefined) {
    node_text = '';
  } else {
    node_text = 'S_' + this.id + ': ' + this.text;
  }
  // draw the text
  drawText(c, node_text, this.x, this.y, null, selectedObject == this, false);
};

Node.prototype.closestPointOnCircle = function(x, y) {
  var dx = x - this.x;
  var dy = y - this.y;
  var scale = Math.sqrt(dx * dx + dy * dy);
  return {
    'x': this.x + dx * nodeRadius / scale,
    'y': this.y + dy * nodeRadius / scale,
  };
};

Node.prototype.containsPoint = function(x, y) {
  return (x - this.x) * (x - this.x) + (y - this.y) * (y - this.y) < nodeRadius * nodeRadius;
};

function SelfLink(node, mouse) {
  this.node = node;
  this.anchorAngle = 0;
  this.mouseOffsetAngle = 0;
  this.text = '';

  if (mouse) {
    this.setAnchorPoint(mouse.x, mouse.y);
  }
}

SelfLink.prototype.setMouseStart = function(x, y) {
  this.mouseOffsetAngle = this.anchorAngle - Math.atan2(y - this.node.y, x - this.node.x);
};

SelfLink.prototype.setAnchorPoint = function(x, y) {
  this.anchorAngle = Math.atan2(y - this.node.y, x - this.node.x) + this.mouseOffsetAngle;
  // snap to 90 degrees
  var snap = Math.round(this.anchorAngle / (Math.PI / 2)) * (Math.PI / 2);
  if (Math.abs(this.anchorAngle - snap) < 0.1) this.anchorAngle = snap;
  // keep in the range -pi to pi so our containsPoint() function always works
  if (this.anchorAngle < -Math.PI) this.anchorAngle += 2 * Math.PI;
  if (this.anchorAngle > Math.PI) this.anchorAngle -= 2 * Math.PI;
};

SelfLink.prototype.getEndPointsAndCircle = function() {
  var circleX = this.node.x + 1.5 * nodeRadius * Math.cos(this.anchorAngle);
  var circleY = this.node.y + 1.5 * nodeRadius * Math.sin(this.anchorAngle);
  var circleRadius = 0.75 * nodeRadius;
  var startAngle = this.anchorAngle - Math.PI * 0.8;
  var endAngle = this.anchorAngle + Math.PI * 0.8;
  var startX = circleX + circleRadius * Math.cos(startAngle);
  var startY = circleY + circleRadius * Math.sin(startAngle);
  var endX = circleX + circleRadius * Math.cos(endAngle);
  var endY = circleY + circleRadius * Math.sin(endAngle);
  return {
    'hasCircle': true,
    'startX': startX,
    'startY': startY,
    'endX': endX,
    'endY': endY,
    'startAngle': startAngle,
    'endAngle': endAngle,
    'circleX': circleX,
    'circleY': circleY,
    'circleRadius': circleRadius
  };
};

SelfLink.prototype.draw = function(c) {
  var stuff = this.getEndPointsAndCircle();
  // draw arc
  c.beginPath();
  c.arc(stuff.circleX, stuff.circleY, stuff.circleRadius, stuff.startAngle, stuff.endAngle, false);
  c.stroke();
  // draw the text on the loop farthest from the node
  var textX = stuff.circleX + stuff.circleRadius * Math.cos(this.anchorAngle);
  var textY = stuff.circleY + stuff.circleRadius * Math.sin(this.anchorAngle);
  drawText(c, this.text, textX, textY, this.anchorAngle, selectedObject == this, true);
  // draw the head of the arrow
  drawArrow(c, stuff.endX, stuff.endY, stuff.endAngle + Math.PI * 0.4);
};

SelfLink.prototype.containsPoint = function(x, y) {
  var stuff = this.getEndPointsAndCircle();
  var dx = x - stuff.circleX;
  var dy = y - stuff.circleY;
  var distance = Math.sqrt(dx * dx + dy * dy) - stuff.circleRadius;
  return (Math.abs(distance) < hitTargetPadding);
};

function StartLink(node, start) {
  this.node = node;
  this.deltaX = 0;
  this.deltaY = 0;
  this.text = '';

  if (start) {
    this.setAnchorPoint(start.x, start.y);
  }
}

StartLink.prototype.setAnchorPoint = function(x, y) {
  this.deltaX = x - this.node.x;
  this.deltaY = y - this.node.y;

  if (Math.abs(this.deltaX) < snapToPadding) {
    this.deltaX = 0;
  }

  if (Math.abs(this.deltaY) < snapToPadding) {
    this.deltaY = 0;
  }
};

StartLink.prototype.getEndPoints = function() {
  var startX = this.node.x + this.deltaX;
  var startY = this.node.y + this.deltaY;
  var end = this.node.closestPointOnCircle(startX, startY);
  return {
    'startX': startX,
    'startY': startY,
    'endX': end.x,
    'endY': end.y,
  };
};

StartLink.prototype.draw = function(c) {
  var stuff = this.getEndPoints();

  // draw the line
  c.beginPath();
  c.moveTo(stuff.startX, stuff.startY);
  c.lineTo(stuff.endX, stuff.endY);
  c.stroke();

  // draw the text at the end without the arrow
  var textAngle = Math.atan2(stuff.startY - stuff.endY, stuff.startX - stuff.endX);
  drawText(c, this.text, stuff.startX, stuff.startY, textAngle, selectedObject == this, true);

  // draw the head of the arrow
  drawArrow(c, stuff.endX, stuff.endY, Math.atan2(-this.deltaY, -this.deltaX));
};

StartLink.prototype.containsPoint = function(x, y) {
  var stuff = this.getEndPoints();
  var dx = stuff.endX - stuff.startX;
  var dy = stuff.endY - stuff.startY;
  var length = Math.sqrt(dx * dx + dy * dy);
  var percent = (dx * (x - stuff.startX) + dy * (y - stuff.startY)) / (length * length);
  var distance = (dx * (y - stuff.startY) - dy * (x - stuff.startX)) / length;
  return (percent > 0 && percent < 1 && Math.abs(distance) < hitTargetPadding);
};

function TemporaryLink(from, to) {
  this.from = from;
  this.to = to;
}

TemporaryLink.prototype.draw = function(c) {
  // draw the line
  c.beginPath();
  c.moveTo(this.to.x, this.to.y);
  c.lineTo(this.from.x, this.from.y);
  c.stroke();

  // draw the head of the arrow
  drawArrow(c, this.to.x, this.to.y, Math.atan2(this.to.y - this.from.y, this.to.x - this.from.x));
};


function drawArrow(c, x, y, angle) {
  var dx = Math.cos(angle);
  var dy = Math.sin(angle);
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x - 8 * dx + 5 * dy, y - 8 * dy - 5 * dx);
  c.lineTo(x - 8 * dx - 5 * dy, y - 8 * dy + 5 * dx);
  c.fill();
}

function canvasHasFocus() {
  return (document.activeElement || document.body) == document.body;
}

function drawText(c, originalText, x, y, angleOrNull, isSelected, isLink) {
  text = originalText;
  c.font = '20px "Times New Roman", serif';
  var width = c.measureText(text).width;

  // center the text
  x -= width / 2;

  // position the text intelligently if given an angle
  if (angleOrNull != null) {
    var cos = Math.cos(angleOrNull);
    var sin = Math.sin(angleOrNull);
    var cornerPointX = (width / 2 + 5) * (cos > 0 ? 1 : -1);
    var cornerPointY = (10 + 5) * (sin > 0 ? 1 : -1);
    var slide = sin * Math.pow(Math.abs(sin), 40) * cornerPointX - cos * Math.pow(Math.abs(cos), 10) * cornerPointY;
    x += cornerPointX - sin * slide;
    y += cornerPointY + cos * slide;
  }

  // draw text and caret (round the coordinates so the caret falls on a pixel)
  if ('advancedFillText' in c) {
    c.advancedFillText(text, originalText, x + width / 2, y, angleOrNull);
  } else {
    x = Math.round(x);
    y = Math.round(y);
    c.fillText(text, x, y + 6);
    if (!isLink) {
      if (isSelected && caretVisible && canvasHasFocus() && document.hasFocus()) {
        x += width;
        c.beginPath();
        c.moveTo(x, y - 10);
        c.lineTo(x, y + 10);
        c.stroke();
      }
    }
  }
}

var caretTimer;
var caretVisible = true;

function resetCaret() {
  clearInterval(caretTimer);
  caretTimer = setInterval('caretVisible = !caretVisible; draw()', 500);
  caretVisible = true;
}

var canvas;
var nodeRadius = 40;
var nodes = [];
var links = [];

var snapToPadding = 6; // pixels
var hitTargetPadding = 6; // pixels
var selectedObject = null; // either a Link or a Node
var dblclickSelectedObject = null;
var currentLink = null; // a Link
var movingObject = false;
var originalClick;

function drawUsing(c) {
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.save();
  c.translate(0.5, 0.5);

  for (var i = 0; i < nodes.length; i++) {
    c.lineWidth = 1;
    c.fillStyle = c.strokeStyle = (nodes[i] == selectedObject) ? 'blue' : 'black';
    nodes[i].draw(c);
  }
  for (var i = 0; i < links.length; i++) {
    c.lineWidth = 1;
    c.fillStyle = c.strokeStyle = (links[i] == selectedObject) ? 'blue' : 'black';
    links[i].draw(c);
  }
  if (currentLink != null) {
    c.lineWidth = 1;
    c.fillStyle = c.strokeStyle = 'black';
    currentLink.draw(c);
  }

  c.restore();
}

function draw() {
  drawUsing(canvas.getContext('2d'));
  saveBackup();
}

function selectObject(x, y) {
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].containsPoint(x, y)) {
      return nodes[i];
    }
  }
  for (var i = 0; i < links.length; i++) {
    if (links[i].containsPoint(x, y)) {
      return links[i];
    }
  }
  return null;
}

function snapNode(node) {
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i] == node) continue;

    if (Math.abs(node.x - nodes[i].x) < snapToPadding) {
      node.x = nodes[i].x;
    }

    if (Math.abs(node.y - nodes[i].y) < snapToPadding) {
      node.y = nodes[i].y;
    }
  }
}

var actionOptions = [ //can be altered with JSON input
  {
    name: 'Green_LED',
    type: 'toggle'
  },
  {
    name: 'Amber_LED',
    type: 'toggle'
  },
  {
    name: 'Red_LED',
    type: 'toggle'
  },
  {
    name: 'LED_Display',
    type: 'numerical',
    min: '0',
    max: '9999'
  }
];
var transitOptions = [ //can be altered with JSON input
  {
    name: 'time'
  },
  {
    name: 'SW14'
  },
  {
    name: 'SW15'
  }
];
var entryActions = document.querySelector("#entryActionContainer");
window.onload = function() {
  var actionArea = document.querySelector("#actionArea");
  var selectedObjectName = document.querySelector("#selectedObjectName");
  var applyButton = document.querySelector("#actionApplyButton");
  var resetButton = document.querySelector("#actionResetButton");
  canvas = document.getElementById('canvas');
  restoreBackup();
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    node.id = i;
  }
  draw();
  canvas.oncontextmenu = function() {
    return false;
  }

  canvas.onmousedown = function(e) {
    var whichKey = e.button; //Left click:0, right click: 2
    var mouse = crossBrowserRelativeMousePos(e);
    selectedObject = selectObject(mouse.x, mouse.y);
    movingObject = false;
    originalClick = mouse;

    if (selectedObject != null) {
      if (whichKey === 2 && selectedObject instanceof Node) {
        currentLink = new SelfLink(selectedObject, mouse);
      } else if (whichKey === 0) {
        if (!(selectedObject === dblclickSelectedObject)) {
          actionArea.style.visibility = "hidden";
          document.querySelectorAll('.controlBox').forEach(function(element) {
            element.remove();
          });
          document.querySelectorAll('.boolean_container').forEach(function(bool) {
            bool.remove();
          });
          selectedObjectName.innerHTML = "";
        }
        movingObject = true;
        deltaMouseX = deltaMouseY = 0;
        if (selectedObject.setMouseStart) {
          selectedObject.setMouseStart(mouse.x, mouse.y);
        }
      }
      resetCaret();
    }
    // else if (shift)
    else if (selectedObject == null && whichKey === 2) {
      currentLink = new TemporaryLink(mouse, mouse);
    } else if (selectedObject == null && whichKey === 0) { //reseting the entry actions
      actionArea.style.visibility = "hidden";
      document.querySelectorAll('.controlBox').forEach(function(element) {
        element.remove();
      });
      document.querySelectorAll('.boolean_container').forEach(function(bool) {
        bool.remove();
      });
      selectedObjectName.innerHTML = "";
    }
    draw();
    if (canvasHasFocus()) {
      // disable drag-and-drop only if the canvas is already focused
      return false;
    } else {
      // otherwise, let the browser switch the focus away from wherever it was
      resetCaret();
      return true;
    }
  };

  canvas.ondblclick = function(e) {
    dblclickSelectedObject = selectedObject;
    var mouse = crossBrowserRelativeMousePos(e);
    selectedObject = selectObject(mouse.x, mouse.y);
    var isNode = (selectedObject instanceof Node);
    if (dblclickSelectedObject == null) {
      selectedObject = new Node(mouse.x, mouse.y);
      nodes.push(selectedObject);
      resetCaret();
      draw();
    } else {
      document.querySelectorAll('.controlBox').forEach(function(element) {
        element.remove();
      });
      document.querySelectorAll('.boolean_container').forEach(function(bool) {
        bool.remove();
      });
      //presenting the action entry form
      if (isNode) {
        selectedObjectName.textContent = 'Node= S_' + selectedObject.id + ':' + selectedObject.text;
        if (selectedObject.entryActions.length != 0) {
          for (var i = 0; i < selectedObject.entryActions.length; i++) {
            var action = controlBoxCreate(isNode);
            action.value = selectedObject.entryActions[i].action;
            var outputValue = outputValueCreate(action.value, isNode);
            outputValue.value = selectedObject.entryActions[i].value;
            action.after(outputValue);
          }
        }
      } else if (dblclickSelectedObject instanceof SelfLink) {
        selectedObjectName.textContent = 'Link= S_' + dblclickSelectedObject.node.id + ' -> S_' + dblclickSelectedObject.node.id;
      } else if (dblclickSelectedObject instanceof Link) {
        selectedObjectName.textContent = 'Link= S_' + dblclickSelectedObject.nodeA.id + ' -> S_' + dblclickSelectedObject.nodeB.id;
      }
      loadLinkText();
      actionArea.style.visibility = "visible";
    }
  };

  canvas.onmousemove = function(e) {
    var whichKey = e.button;
    var mouse = crossBrowserRelativeMousePos(e);

    if (currentLink != null) {
      var targetNode = selectObject(mouse.x, mouse.y);
      if (!(targetNode instanceof Node)) {
        targetNode = null;
      }
      if (selectedObject == null) {
        if (targetNode != null) {
          currentLink = new StartLink(targetNode, originalClick);
        } else {
          currentLink = new TemporaryLink(originalClick, mouse);
        }
      } else {
        if (targetNode == selectedObject) {
          currentLink = new SelfLink(selectedObject, mouse);
        } else if (targetNode != null) {
          currentLink = new Link(selectedObject, targetNode);
        } else {
          currentLink = new TemporaryLink(selectedObject.closestPointOnCircle(mouse.x, mouse.y), mouse);
        }
      }
      draw();
    }

    if (movingObject) {
      selectedObject.setAnchorPoint(mouse.x, mouse.y);
      if (selectedObject instanceof Node) {
        snapNode(selectedObject);
      }
      draw();
    }
  };

  canvas.onmouseup = function(e) {
    movingObject = false;

    if (currentLink != null) {
      if (!(currentLink instanceof TemporaryLink)) {
        selectedObject = currentLink;
        links.push(currentLink);
        resetCaret();
      }
      currentLink = null;
      draw();
    }
  };

  applyButton.addEventListener('click', function() {
    if (dblclickSelectedObject instanceof Node) {
      var tmp = [];
      var outputOptionsArray = document.querySelectorAll('select.output');
      var outputValueArray = document.querySelectorAll('.outputValue');
      for (var i = 0; i < outputOptionsArray.length; i++) {
        var outputAction = {
          action: outputOptionsArray[i].value,
          value: outputValueArray[i].value
        }
        tmp.push(outputAction);
      }
      dblclickSelectedObject.entryActions = tmp;
    } else if ((dblclickSelectedObject instanceof Link) || (dblclickSelectedObject instanceof SelfLink)) {
      var tmp = '';
      var outputOptionsArray = document.querySelectorAll('select.output');
      var outputValueArray = document.querySelectorAll('.linkValue');
      var booleanBeforeArray = document.querySelectorAll('.boolBefore');
      var booleanAfterArray = document.querySelectorAll('.boolAfter');

      for (var i = 0; i < outputOptionsArray.length; i++) {
        var booleanBeforeOptionArray = booleanBeforeArray[i].querySelectorAll('select.boolean_options');
        var booleanAfterOptionArray = booleanAfterArray[i].querySelectorAll('select.boolean_options');
        for (var j = 0; j < booleanBeforeOptionArray.length; j++) {
          tmp += booleanBeforeOptionArray[j].value;
        }
        tmp += ' ' + outputOptionsArray[i].value + '=' + outputValueArray[i].value + ' ';
        for (var j = 0; j < booleanAfterOptionArray.length; j++) {
          tmp += booleanAfterOptionArray[j].value;
        }
        tmp += ' ';
      }
      dblclickSelectedObject.text = tmp;
    }
    saveBackup();
  });

  resetButton.addEventListener('click', function() {
    document.querySelectorAll('.controlBox').forEach(function(element) {
      element.remove();
    });
    document.querySelectorAll('.boolean_container').forEach(function(bool) {
      bool.remove();
    });

    if (dblclickSelectedObject instanceof Node) {
      if (dblclickSelectedObject.entryActions.length != 0) {
        for (var i = 0; i < dblclickSelectedObject.entryActions.length; i++) {
          var action = controlBoxCreate(true);
          action.value = dblclickSelectedObject.entryActions[i].action;
          var outputValue = outputValueCreate(action.value, true);
          outputValue.value = dblclickSelectedObject.entryActions[i].value;
          action.after(outputValue);
        }
      }
    } else if (dblclickSelectedObject) {
      if (dblclickSelectedObject.text.length != 0) {
        loadLinkText();
      }
    }
  });
}

document.onkeydown = function(e) {
  var key = crossBrowserKey(e);
  if (!canvasHasFocus()) {
    // don't read keystrokes when other things have focus
    return true;
  } else if (key == 8 && selectedObject instanceof Node) { // backspace key
    if (selectedObject != null && 'text' in selectedObject) {
      selectedObject.text = selectedObject.text.substr(0, selectedObject.text.length - 1);
      resetCaret();
      draw();
    }

    // backspace is a shortcut for the back button, but do NOT want to change pages
    return false;
  } else if (key == 46) { // delete key
    if (selectedObject != null) {
      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i] == selectedObject) {
          nodes.splice(i--, 1);
        }
      }
      for (var i = 0; i < links.length; i++) {
        if (links[i] == selectedObject || links[i].node == selectedObject || links[i].nodeA == selectedObject || links[i].nodeB == selectedObject) {
          links.splice(i--, 1);
        }
      }
      selectedObject = null;
      draw();
      actionArea.style.visibility = 'hidden';
    }
  }
};

document.onkeypress = function(e) {
  // don't read keystrokes when other things have focus
  var key = crossBrowserKey(e);
  if (!canvasHasFocus() || !(selectedObject instanceof Node)) {
    // don't read keystrokes when other things have focus
    return true;
  } else if (key >= 0x20 && key <= 0x7E && !e.metaKey && !e.altKey && !e.ctrlKey && selectedObject != null && 'text' in selectedObject && selectedObject instanceof Node) {
    selectedObject.text += String.fromCharCode(key);
    resetCaret();
    draw();

    // don't let keys do their actions (like space scrolls down the page)
    return false;
  } else if (key == 8) {
    // backspace is a shortcut for the back button, but do NOT want to change pages
    return false;
  }
};

function crossBrowserKey(e) {
  e = e || window.event;
  return e.which || e.keyCode;
}

function crossBrowserElementPos(e) {
  e = e || window.event;
  var obj = e.target || e.srcElement;
  var x = 0,
    y = 0;
  while (obj.offsetParent) {
    x += obj.offsetLeft;
    y += obj.offsetTop;
    obj = obj.offsetParent;
  }
  return {
    'x': x,
    'y': y
  };
}

function crossBrowserMousePos(e) {
  e = e || window.event;
  return {
    'x': e.pageX || e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft,
    'y': e.pageY || e.clientY + document.body.scrollTop + document.documentElement.scrollTop,
  };
}

function crossBrowserRelativeMousePos(e) {
  var element = crossBrowserElementPos(e);
  var mouse = crossBrowserMousePos(e);
  return {
    'x': mouse.x - element.x,
    'y': mouse.y - element.y
  };
}

function det(a, b, c, d, e, f, g, h, i) {
  return a * e * i + b * f * g + c * d * h - a * f * h - b * d * i - c * e * g;
}

function circleFromThreePoints(x1, y1, x2, y2, x3, y3) {
  var a = det(x1, y1, 1, x2, y2, 1, x3, y3, 1);
  var bx = -det(x1 * x1 + y1 * y1, y1, 1, x2 * x2 + y2 * y2, y2, 1, x3 * x3 + y3 * y3, y3, 1);
  var by = det(x1 * x1 + y1 * y1, x1, 1, x2 * x2 + y2 * y2, x2, 1, x3 * x3 + y3 * y3, x3, 1);
  var c = -det(x1 * x1 + y1 * y1, x1, y1, x2 * x2 + y2 * y2, x2, y2, x3 * x3 + y3 * y3, x3, y3);
  return {
    'x': -bx / (2 * a),
    'y': -by / (2 * a),
    'radius': Math.sqrt(bx * bx + by * by - 4 * a * c) / (2 * Math.abs(a))
  };
}

function fixed(number, digits) {
  return number.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '');
}

function restoreBackup() {
  if (!localStorage || !JSON) {
    return;
  }

  try {
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    nodes = [];
    links = [];

    var backup = JSON.parse(localStorage['fsm']);

    for (var i = 0; i < backup.nodes.length; i++) {
      var backupNode = backup.nodes[i];
      var node = new Node(backupNode.visualInfo.x, backupNode.visualInfo.y);
      node.text = backupNode.text;
      node.entryActions = backupNode.entryActions;
      nodes.push(node);
    }
    for (var i = 0; i < backup.links.length; i++) {
      var backupLink = backup.links[i];
      var link = null;
      if (backupLink.type == 'SelfLink') {
        link = new SelfLink(nodes[backupLink.node]);
        link.anchorAngle = backupLink.visualInfo.anchorAngle;
        link.text = backupLink.text;
      } else if (backupLink.type == 'StartLink') {
        link = new StartLink(nodes[backupLink.node]);
        link.deltaX = backupLink.visualInfo.deltaX;
        link.deltaY = backupLink.visualInfo.deltaY;
        link.text = backupLink.text;
      } else if (backupLink.type == 'Link') {
        link = new Link(nodes[backupLink.nodeA], nodes[backupLink.nodeB]);
        link.parallelPart = backupLink.visualInfo.parallelPart;
        link.perpendicularPart = backupLink.visualInfo.perpendicularPart;
        link.text = backupLink.text;
        link.lineAngleAdjust = backupLink.visualInfo.lineAngleAdjust;
      }
      if (link != null) {
        links.push(link);
      }
    }
  } catch (e) {
    localStorage['fsm'] = '';
  }
}

function saveBackup() {
  if (!localStorage || !JSON) {
    return;
  }

  var backup = {
    'nodes': [],
    'links': [],
  };
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    node.id = i;
    var backupNode = {
      'id': i,
      'text': node.text,
      'visualInfo': {
        'x': node.x,
        'y': node.y,
      },
      'entryActions': node.entryActions
    };
    backup.nodes.push(backupNode);
  }
  for (var i = 0; i < links.length; i++) {
    var link = links[i];
    var backupLink = null;
    if (link instanceof SelfLink) {
      backupLink = {
        'type': 'SelfLink',
        'node': nodes.indexOf(link.node),
        'text': link.text,
        'visualInfo': {
          'anchorAngle': link.anchorAngle
        }
      };
    } else if (link instanceof StartLink) {
      backupLink = {
        'type': 'StartLink',
        'node': nodes.indexOf(link.node),
        'text': link.text,
        'visualInfo': {
          'deltaX': link.deltaX,
          'deltaY': link.deltaY,
        }
      };
    } else if (link instanceof Link) {
      backupLink = {
        'type': 'Link',
        'text': link.text,
        'nodeA': nodes.indexOf(link.nodeA),
        'nodeB': nodes.indexOf(link.nodeB),
        "visualInfo": {
          'lineAngleAdjust': link.lineAngleAdjust,
          'parallelPart': link.parallelPart,
          'perpendicularPart': link.perpendicularPart,
        }
      };
    }
    if (backupLink != null) {
      backup.links.push(backupLink);
    }
  }

  localStorage['fsm'] = JSON.stringify(backup, null, 2);
}


// function loading() { //used in old ver. for ref.
//   var text = localStorage['fsm'];
//   var allcookies = localStorage.getItem('GetData');
//   document.forms.coding_area.coding.value = text;
// }

// function saving() { //used in old ver. for ref.
//   var text = document.forms.coding_area.coding.value;
//   localStorage['fsm'] = text;
//   restoreBackup();
//   localStorage['fsm'] = '';
// }

function clearcanvas() {
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  nodes = [];
  links = [];
  localStorage['fsm'] = '';
  actionArea.style.visibility = "hidden";
}

function controlBoxCreate(isNode) {
  var type;
  if (isNode == true) {
    type = actionOptions; //for node
  } else {
    type = transitOptions; //for link
  }

  var control_box = document.createElement('div');
  control_box.className = 'controlBox';
  var options_box = document.createElement('div');
  options_box.className = 'options_box';
  var minus_container = document.createElement('div');
  minus_container.className = 'minus_container';
  var minusButton = document.createElement('span');
  minusButton.className = 'minusButton';
  minusButton.textContent = '-';
  minus_container.appendChild(minusButton);
  control_box.appendChild(options_box);
  control_box.appendChild(minus_container);
  document.querySelector('.plus_container').before(control_box);

  var optionsMenu = document.createElement('select');
  optionsMenu.className = 'output';
  var placeholder = document.createElement('option');
  placeholder.setAttribute('disabled', '');
  placeholder.value = "";
  placeholder.text = "--Please Select--"
  optionsMenu.appendChild(placeholder);
  for (var i = 0; i < type.length; i++) {
    var action = document.createElement('option');
    action.value = type[i].name;
    action.textContent = type[i].name;
    optionsMenu.appendChild(action);
  }
  options_box.appendChild(optionsMenu);
  optionsMenu.addEventListener('change', function() {
    if (this.nextElementSibling) {
      this.nextElementSibling.remove();
    }
    var outputValue = outputValueCreate(this.value, isNode);
    this.after(outputValue);
  });
  minusButton.addEventListener('click', function() {
    if (isNode != true) {
      control_box.previousElementSibling.remove();
      control_box.nextElementSibling.remove();
    }
    control_box.remove();
  });
  return optionsMenu;
}

function outputValueCreate(action, isNode) {
  var actionValue = undefined;
  var type = undefined;
  if (isNode) {
    for (var i = 0; i < actionOptions.length; i++) {
      if (action == actionOptions[i].name) {
        type = actionOptions[i].type;
        if (type == 'toggle') {
          actionValue = document.createElement('select');
          actionValue.className = 'toggle';
          var on = document.createElement('option');
          on.value = 'On';
          on.textContent = 'On';
          var off = document.createElement('option');
          off.value = 'Off';
          off.textContent = 'Off';
          actionValue.appendChild(on);
          actionValue.appendChild(off);
        } else if (type == 'numerical') {
          actionValue = document.createElement('input');
          actionValue.className = 'numerical';
          actionValue.setAttribute('type', 'number');
          actionValue.setAttribute('min', actionOptions[i].min);
          actionValue.setAttribute('max', actionOptions[i].max);
          actionValue.value = actionOptions[i].min;
          actionValue.addEventListener('change', function() {
            if (this.value > actionOptions[i].max) {
              this.value = actionOptions[i].max;
            } else if (this.value < actionOptions[i].min) {
              this.value = actionOptions[i].min;
            }
          });
        }
        actionValue.classList.add('outputValue');
        break;
      }
    }
  } else {
    if (action == 'time' || action == 'count') {
      actionValue = document.createElement('input');
      actionValue.className = 'numerical';
      actionValue.setAttribute('type', 'number');
      actionValue.setAttribute('min', '0');
      actionValue.value = 0;
      actionValue.addEventListener('change', function() {
        if (this.value < 0) {
          this.value = 0;
        }
      });
      actionValue.classList.add('linkValue');
    } else if (action == 'SW14' || action == 'SW15') {
      actionValue = document.createElement('select');
      var pressed = document.createElement('option');
      pressed.value = 'Pressed';
      actionValue.appendChild(pressed);
      actionValue.value =


    }
  }

  return actionValue;
}

function booleanOptionCreate() {
  var boolean_container = document.createElement('div');
  boolean_container.className = 'boolean_container';
  // var boolean_option = booleanOperatorCreate();
  var addButton = document.createElement('span');
  addButton.textContent = '+';
  addButton.className = 'booleanAddButton';
  addButton.addEventListener('click', function() {
    var newBooleanOption = booleanOperatorCreate();
    boolean_container.appendChild(newBooleanOption);
  });
  var minusButton = document.createElement('span');
  minusButton.textContent = '-';
  minusButton.className = 'booleanMinusButton';
  minusButton.addEventListener('click', function() {
    var lastChild = boolean_container.querySelector('select.boolean_options:last-child');
    if (lastChild) {
      lastChild.remove();
    }
  });
  boolean_container.appendChild(addButton);
  boolean_container.appendChild(minusButton);
  return boolean_container;
}

function booleanOperatorCreate() {
  var boolean_select = document.createElement('select');
  boolean_select.className = 'boolean_options';
  var boolean_array = ['(', ')', '!', '||', '&&'];
  for (var i = 0; i < boolean_array.length; i++) {
    var operator = document.createElement('option');
    operator.value = boolean_array[i];
    operator.textContent = boolean_array[i];
    boolean_select.appendChild(operator);
  }
  return boolean_select;
}

function loadLinkText() {
  var textArray = dblclickSelectedObject.text.split(' ');
  var controlLocation = [];
  for (var i = 0; i < textArray.length; i++) {
    if (textArray[i].indexOf('=') != -1) {
      controlLocation.push(i);
    }
  }
  for (var i = 0; i < controlLocation.length; i++) {
    var location = controlLocation[i];
    var linkOptions = textArray[location].split('=');
    var boolBeforeOptions = textArray[location - 1].split('');
    var boolAfterOptions = textArray[location + 1].split('');

    var controlOption = controlBoxCreate(false);
    controlOption.value = linkOptions[0];
    var controlValue = outputValueCreate(controlOption.value, false);
    controlValue.value = linkOptions[1];
    controlOption.after(controlValue);

    var bool1 = booleanOptionCreate();
    var bool2 = booleanOptionCreate();
    bool1.classList.add('boolBefore');
    bool2.classList.add('boolAfter');
    var controlBox = controlOption.parentElement.parentElement;
    controlBox.before(bool1);
    controlBox.after(bool2);
    for (var j = 0; j < boolBeforeOptions.length; j++) {
      var operator = booleanOperatorCreate();
      operator.value = boolBeforeOptions[j];
      bool1.appendChild(operator);
    }
    for (var j = 0; j < boolAfterOptions.length; j++) {
      var operator2 = booleanOperatorCreate();
      operator2.value = boolAfterOptions[j];
      bool2.appendChild(operator2);
    }
  }
}

var clear = document.getElementById("clear");
clear.addEventListener('click', clearcanvas);
var plusButton = document.getElementById('plusButton');
plusButton.addEventListener('click', function() {
  var objectType = (selectedObject instanceof Node);
  var addedControl = controlBoxCreate(objectType);
  addedControl.value = '';
  if (!objectType) {
    var controlBox = addedControl.parentElement.parentElement;
    var bool1 = booleanOptionCreate();
    var bool2 = booleanOptionCreate();
    bool1.classList.add('boolBefore');
    bool2.classList.add('boolAfter');
    controlBox.before(bool1);
    controlBox.after(bool2);
  }
});

var fsmForm = document.getElementById('fsmForm');
fsmForm.addEventListener('submit', function(event) {
  compilerFSM(event);
});

function compilerFSM(event) {

  event.preventDefault();

  try { //check the FSM if there is any error
    // if (!localStorage || !JSON) {
    //   throw new FSM_Error('Cannot find FSM');
    // }

    var fsm = JSON.parse(localStorage['fsm']);
    var syntaxErrorFlag = false;
    var error_messages = [];
    var startLinkCounter = 0;
    //check on links
    for (var i = 0; i < fsm.links.length; i++) { //loop on links
      var link = fsm.links[i];
      if (link.type == 'StartLink') {
        startLinkCounter++;
      } else if (link.text == '') {
        if (link.type == 'SelfLink') {
          error_messages.push('Self link of S_' + link.node + ': The condidtion of has not been specified.');
        } else if (link.type == 'Link') {
          error_messages.push('link of S_' + link.nodeA + '->S_' + link.nodeB + ': The condidtion has not been specified.');
        }
        syntaxErrorFlag = true;
      }
    }
    if (startLinkCounter > 1) {
      error_messages.push("More than one start link. Please delete them to specify the start state clearly.");
      syntaxErrorFlag = true;
    } else if (startLinkCounter <= 0) {
      error_messages.push("No start link is found. Please add a start link to specify the start state.");
      syntaxErrorFlag = true;
    }

    //check on nodes
    for (var i = 0; i < fsm.nodes.length; i++) {
      var node = fsm.nodes[i];
      if (node.entryActions.length == 0) {
        error_messages.push('Node S_' + node.id + ': No entry action is found');
        syntaxErrorFlag = true;
      }
      // else {
      //   for (var i = 0; i < node.entryActions.length - 1; i++) {
      //     for (var j = i + 1; j < node.entryActions.length; j++) {
      //       if (node.entryActions[i].name == node.entryActions[j].name) {
      //         error_messages.push('Node S_:' + node.id + ': Repeated action options have been set up.');
      //         syntaxErrorFlag = true;
      //         break;
      //       }
      //     }
      //   }
      // }
    }
    if (syntaxErrorFlag == true) {
      throw new fsm_Syntax_Error('Syntax error is spotted');
    }

    //send data to the server through hidden form


    var fsmJSON = document.createElement('input');
    fsmJSON.setAttribute('type', 'hidden');
    fsmJSON.setAttribute('name', 'fsm');
    fsmJSON.setAttribute('value', localStorage['fsm']);

    fsmForm.appendChild(fsmJSON);
    fsmForm.submit();
  } catch { //present the errors
    var popUpWindowContainer = document.getElementById('popUpWindowContainer');
    var popupTitle = document.getElementById('popup-title');
    var popupCloseButton = document.getElementById('closeButton');
    var popupContent = document.getElementById('popup-content-list');
    popupTitle.textContent = 'Compile Error!';
    for (var i = 0; i < error_messages.length; i++) {
      var message = document.createElement('li');
      message.textContent = error_messages[i];
      popupContent.appendChild(message);
    }
    popUpWindowContainer.style.visibility = 'visible';

    popupCloseButton.addEventListener('click', function() {
      var childContents = popupContent.children;
      for (var i = 0; i < childContents.length; i++) {
        childContents[i].remove();
      }
      error_messages.length = [];
      popUpWindowContainer.style.visibility = 'hidden';
    });

    window.addEventListener('click', function(e) {
      if (e.target == popUpWindowContainer) {
        var childContents = popupContent.children;
        for (var i = 0; i < childContents.length; i++) {
          childContents[i].remove();
        }
        error_messages.length = [];
        popUpWindowContainer.style.visibility = 'hidden';
      }
    });
  }
}