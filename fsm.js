function FSMDesigner(a){this.snapToPadding=20;this.hitTargetPadding=20;this.undo_history_size=32;this.canvas=a;this.originalClick=null;this.cursorVisible=true;this.selectedObject=null;this.currentLink=null;this.movingObject=false;this.inOutputMode=false;this.textEntryTimeout=null;this.textEnteredRecently=false;this.textUndoDelay=2000;this.nodes=[];this.links=[];this.undo_stack=[];this.redo_stack=[];this.modalBehavior=FSMDesigner.ModalBehaviors.POINTER;var b=this;this.canvas.onmousedown=function(c){b.handlemousedown(c)};this.canvas.ondblclick=function(c){b.handledoubleclick(c)};this.canvas.onmousemove=function(c){b.handlemousemove(c)};this.canvas.onmouseup=function(c){b.handlemouseup(c)};this.canvas.addEventListener("drop",function(c){b.handledrop(c)},false);document.onkeypress=function(c){b.handlekeypress(c)};document.onkeydown=function(c){b.handlekeydown(c)};document.onkeyup=function(c){b.handlekeyup(c)}}FSMDesigner.ModalBehaviors={POINTER:"pointer",CREATE:"create"};FSMDesigner.KeyCodes={BACKSPACE:8,SHIFT:16,DELETE:46,UNDO:26,REDO:25,z:122,Z:90};FSMDesigner.prototype.handledrop=function(a){a.stopPropagation();a.preventDefault();if(a.dataTransfer.files.length!=1){return}this.loadFromFile(a.dataTransfer.files[0])};FSMDesigner.prototype.exportPNG=function(){var b=this.selectedObject;this.selectedObject=null;this.draw();var a=canvas.toDataURL("image/png");window.open(a,"_blank");window.focus();this.selectedObject=b;this.draw()};FSMDesigner.prototype.loadFromFile=function(b){this.saveUndoStep();var a=new FileReader();var c=this;a.onload=function(d){c.recreateState(d.target.result)};a.readAsText(b)};FSMDesigner.stepsEquivalent=function(d,c){return JSON.stringify(d)==JSON.stringify(c)};FSMDesigner.prototype.saveFileHTML5=function(){var b=JSON.stringify(this.createBackup());var a="data:application/x-fsm,"+encodeURIComponent(b);document.location.href=a};FSMDesigner.prototype.getDataToSave=function(){return JSON.stringify(this.createBackup())};FSMDesigner.prototype.saveUndoStep=function(){var b=this.createBackup();var a=this.undo_stack[this.undo_stack.length-1];if(FSMDesigner.stepsEquivalent(b,a)){return}if(this.undo_stack.length>=this.undo_history_size){this.undo_stack.shift()}this.undo_stack.push(b)};FSMDesigner.prototype.saveRedoStep=function(){if(this.redo_stack.length>=this.redo_history_size){this.redo_stack.shift()}this.redo_stack.push(this.createBackup())};FSMDesigner.prototype.undo=function(){if(this.undo_stack.length==0){return}this.saveRedoStep();this.recreateState(this.undo_stack.pop());this.draw()};FSMDesigner.prototype.redo=function(){if(this.redo_stack.length==0){return}this.saveUndoStep();this.recreateState(this.redo_stack.pop());this.draw()};FSMDesigner.prototype.clear=function(a){if(!a){this.saveUndoStep()}this.nodes=[];this.links=[];this.selectedObject=null;this.currentTarget=null;this.draw()};FSMDesigner.prototype.selectObject=function(a,c){for(var b=0;b<this.nodes.length;b++){if(this.nodes[b].containsPoint(a,c)){return this.nodes[b]}}for(var b=0;b<this.links.length;b++){if(this.links[b].containsPoint(a,c)){return this.links[b]}}return null};FSMDesigner.prototype.deleteObject=function(a){this.deleteNode(a);this.deleteLink(a)};FSMDesigner.prototype.deleteNode=function(d,c){var b=this.nodes.indexOf(d);if(b!=-1){if(!c){this.saveUndoStep()}if(this.selectedObject==d){this.selectedObject=null}this.nodes.splice(b--,1);for(var a=0;a<this.links.length;a++){if(this.links[a].connectedTo(d)){this.deleteLink(this.links[a],true);a--}}if(!c){this.draw()}}};FSMDesigner.prototype.deleteLink=function(c,b){var a=this.links.indexOf(c);if(a!=-1){if(!b){this.saveUndoStep()}if(this.selectedObject==c){this.selectedObject=null}this.links.splice(a--,1);if(!b){this.draw()}}};FSMDesigner.prototype.handlekeydown=function(b){var a=crossBrowserKey(b);if(a==FSMDesigner.KeyCodes.SHIFT){this.modalBehavior=FSMDesigner.ModalBehaviors.CREATE}else{if(!this.hasFocus()){return true}else{if(this.selectedObject!=null){if(a==FSMDesigner.KeyCodes.BACKSPACE){this.handleTextUndoStep();if(this.inOutputMode&&this.selectedObject.outputs){this.selectedObject.outputs=this.selectedObject.outputs.substr(0,this.selectedObject.outputs.length-1)}else{if(!this.inOutputMode&&this.selectedObject.text){this.selectedObject.text=this.selectedObject.text.substr(0,this.selectedObject.text.length-1)}}resetCaret();this.draw()}else{if(a==FSMDesigner.KeyCodes.DELETE){this.deleteObject(this.selectedObject)}}}}}if(a==FSMDesigner.KeyCodes.BACKSPACE){return false}};FSMDesigner.prototype.handlekeyup=function(b){var a=crossBrowserKey(b);if(a==FSMDesigner.KeyCodes.SHIFT){this.modalBehavior=FSMDesigner.ModalBehaviors.POINTER}};FSMDesigner.prototype.handleTextUndoStep=function(){var b=this;var a=function(){b.textEnteredRecently=b.textEntryTimeout=null};if(this.textEntryTimeout){clearTimeout(this.textEntryTimeout)}else{this.saveUndoStep()}this.textEnteredRecently=true;this.textEntryTimeout=setTimeout(a,this.textUndoDelay)};FSMDesigner.prototype.handlekeypress=function(b){var a=crossBrowserKey(b);if(!this.hasFocus()){return true}else{if(a>=32&&a<=126&&!b.metaKey&&!b.altKey&&!b.ctrlKey&&this.selectedObject!=null&&"text" in this.selectedObject){this.handleTextUndoStep();if(this.inOutputMode){this.selectedObject.outputs+=String.fromCharCode(a)}else{this.selectedObject.text+=String.fromCharCode(a)}resetCaret();this.draw();return false}else{if((a==FSMDesigner.KeyCodes.z&&b.ctrlKey&&!b.shiftKey)||(a==FSMDesigner.KeyCodes.UNDO&&!b.shiftKey)){this.undo()}else{if((a==FSMDesigner.KeyCodes.Y&&b.ctrlKey)||(a==FSMDesigner.KeyCodes.REDO)||(a==FSMDesigner.KeyCodes.z&&b.ctrlKey&&b.shiftKey)||(a==FSMDesigner.KeyCodes.UNDO&&b.shiftKey)){this.redo()}else{if(a==8){return false}}}}}};FSMDesigner.prototype.drawUsing=function(b){b.clearRect(0,0,this.canvas.width,this.canvas.height);b.save();b.translate(0.5,0.5);for(var a=0;a<this.nodes.length;a++){this.nodes[a].draw(b)}for(var a=0;a<this.links.length;a++){this.links[a].draw(b)}if(this.currentLink!=null){this.currentLink.draw(b)}b.restore()};FSMDesigner.prototype.draw=function(){var a=this.canvas.getContext("2d");a.canvas.width=window.innerWidth;a.canvas.height=window.innerHeight-document.getElementById("toolbar").offsetHeight;a.canvas.style.width=window.innerWidth+"px";a.canvas.style.height=window.innerHeight+"px";this.drawUsing(a);this.saveBackup()};FSMDesigner.prototype.saveBackup=function(){if(!localStorage||!JSON){return}localStorage.fsm=JSON.stringify(this.createBackup())};FSMDesigner.prototype.createBackup=function(){var c={nodes:[],links:[]};for(var d=0;d<this.nodes.length;d++){var f=this.nodes[d];var b={x:f.x,y:f.y,text:f.text,outputs:f.outputs,isAcceptState:f.isAcceptState,radius:f.radius};c.nodes.push(b)}for(var d=0;d<this.links.length;d++){var e=this.links[d];var a=null;if(e instanceof SelfLink){a={type:"SelfLink",node:this.nodes.indexOf(e.node),text:e.text,anchorAngle:e.anchorAngle}}else{if(e instanceof StartLink){a={type:"StartLink",node:this.nodes.indexOf(e.node),text:e.text,deltaX:e.deltaX,deltaY:e.deltaY}}else{if(e instanceof Link){a={type:"Link",nodeA:this.nodes.indexOf(e.nodeA),nodeB:this.nodes.indexOf(e.nodeB),text:e.text,lineAngleAdjust:e.lineAngleAdjust,parallelPart:e.parallelPart,perpendicularPart:e.perpendicularPart}}}}if(a!=null){c.links.push(a)}}return c};FSMDesigner.prototype.recreateState=function(c){if(c==null){try{if(!localStorage||!JSON){return false}c=JSON.parse(localStorage.fsm)}catch(h){localStorage.fsm=""}}if(typeof c=="string"){try{c=JSON.parse(c)}catch(h){}}if(!c){return}this.clear(true);for(var d=0;d<c.nodes.length;d++){var b=c.nodes[d];var g=new Node(b.x,b.y,this);g.isAcceptState=b.isAcceptState;g.text=b.text;g.outputs=b.outputs;g.radius=b.radius;this.nodes.push(g)}for(var d=0;d<c.links.length;d++){var a=c.links[d];var f=null;if(a.type=="SelfLink"){f=new SelfLink(this.nodes[a.node],null,this);f.anchorAngle=a.anchorAngle;f.text=a.text}else{if(a.type=="StartLink"){f=new StartLink(this.nodes[a.node],null,this);f.deltaX=a.deltaAboutX;f.deltaY=a.deltaY;f.text=a.text}else{if(a.type=="Link"){f=new Link(this.nodes[a.nodeA],this.nodes[a.nodeB],this);f.parallelPart=a.parallelPart;f.perpendicularPart=a.perpendicularPart;f.text=a.text;f.lineAngleAdjust=a.lineAngleAdjust}}}if(f!=null){this.links.push(f)}}this.draw()};function canvasHasFocus(){return(document.activeElement||document.body)==document.body}FSMDesigner.prototype.hasFocus=function(){if(document.getElementById("helppanel").style.visibility=="visible"){return false}return(document.activeElement||document.body)==document.body};FSMDesigner.prototype.handlemouseup=function(a){if(this.dialogOpen()){return}this.movingObject=false;if(this.currentLink!=null){if(!(this.currentLink instanceof TemporaryLink)){this.saveUndoStep();this.selectedObject=this.currentLink;this.textEnteredRecently=false;this.links.push(this.currentLink);resetCaret()}this.currentLink=null;this.draw()}};FSMDesigner.prototype.dialogOpen=function(){return document.getElementById("helppanel").style.visibility=="visible"};FSMDesigner.prototype.handlemousemove=function(c){if(this.dialogOpen()){return}var a=crossBrowserRelativeMousePos(c);if(this.currentLink!=null){var b=this.selectObject(a.x,a.y);if(!(b instanceof Node)){b=null}if(this.selectedObject==null){if(b!=null){this.currentLink=new StartLink(b,this.originalClick,this)}else{this.currentLink=new TemporaryLink(this.originalClick,a)}}else{if(b==this.selectedObject){this.currentLink=new SelfLink(this.selectedObject,a,this)}else{if(b!=null){this.currentLink=new Link(this.selectedObject,b,this)}else{this.currentLink=new TemporaryLink(this.selectedObject.closestPointOnCircle(a.x,a.y),a)}}}this.draw()}if(this.movingObject){this.selectedObject.setAnchorPoint(a.x,a.y);if(this.selectedObject instanceof Node){this.handleSnap()}this.draw()}};FSMDesigner.prototype.handleSnap=function(){node=this.selectedObject;for(var a=0;a<this.nodes.length;a++){if(this.nodes[a]==node){continue}if(Math.abs(node.x-this.nodes[a].x)<this.snapToPadding){node.x=this.nodes[a].x}if(Math.abs(node.y-this.nodes[a].y)<this.snapToPadding){node.y=this.nodes[a].y}}};FSMDesigner.prototype.handledoubleclick=function(c){handleModalBehavior();var a=crossBrowserRelativeMousePos(c);this.selectedObject=this.selectObject(a.x,a.y);this.textEnteredRecently=false;this.inOutputMode=false;if(this.selectedObject==null){this.saveUndoStep();this.selectedObject=new Node(a.x,a.y,this);this.nodes.push(this.selectedObject);resetCaret();this.draw()}else{if(this.selectedObject instanceof Node){this.inOutputMode=true;this.draw()}}if(document.selection&&document.selection.empty){document.selection.empty()}else{if(window.getSelection){var b=window.getSelection();b.removeAllRanges()}}};FSMDesigner.prototype.handlemousedown=function(b){if(this.dialogOpen()){return}var a=crossBrowserRelativeMousePos(b);this.selectedObject=this.selectObject(a.x,a.y);this.movingObject=false;this.inOutputMode=false;this.textEnteredRecently=false;this.originalClick=a;if(this.selectedObject!=null){if(this.modalBehavior==FSMDesigner.ModalBehaviors.CREATE&&this.selectedObject instanceof Node){this.currentLink=new SelfLink(this.selectedObject,a,this)}else{this.saveUndoStep();this.movingObject=true;this.deltaMouseX=this.deltaMouseY=0;if(this.selectedObject.setMouseStart){this.selectedObject.setMouseStart(a.x,a.y)}}resetCaret()}else{if(this.modalBehavior==FSMDesigner.ModalBehaviors.CREATE){this.currentLink=new TemporaryLink(a,a)}}this.draw();if(this.hasFocus()){return false}else{resetCaret();return true}};function Link(d,c,e){Link.setDefaults(this);this.parent=e;this.nodeA=d;this.nodeB=c;this.text="";this.lineAngleAdjust=0;this.parallelPart=0.5;this.perpendicularPart=0}Link.setDefaults=function(a){a.font='16px "Inconsolata", monospace';a.fgColor="black";a.bgColor="white";a.selectedColor="blue"};Link.prototype.connectedTo=function(a){return(this.nodeA==a||this.nodeB==a)};Link.prototype.getAnchorPoint=function(){var b=this.nodeB.x-this.nodeA.x;var a=this.nodeB.y-this.nodeA.y;var c=Math.sqrt(b*b+a*a);return{x:this.nodeA.x+b*this.parallelPart-a*this.perpendicularPart/c,y:this.nodeA.y+a*this.parallelPart+b*this.perpendicularPart/c}};Link.prototype.setAnchorPoint=function(a,e){var c=this.nodeB.x-this.nodeA.x;var b=this.nodeB.y-this.nodeA.y;var d=Math.sqrt(c*c+b*b);this.parallelPart=(c*(a-this.nodeA.x)+b*(e-this.nodeA.y))/(d*d);this.perpendicularPart=(c*(e-this.nodeA.y)-b*(a-this.nodeA.x))/d;if(this.parallelPart>0&&this.parallelPart<1&&Math.abs(this.perpendicularPart)<this.parent.snapToPadding){this.lineAngleAdjust=(this.perpendicularPart<0)*Math.PI;this.perpendicularPart=0}};Link.prototype.getEndPointsAndCircle=function(){if(this.perpendicularPart==0){var l=(this.nodeA.x+this.nodeB.x)/2;var k=(this.nodeA.y+this.nodeB.y)/2;var b=this.nodeA.closestPointOnCircle(l,k);var e=this.nodeB.closestPointOnCircle(l,k);return{hasCircle:false,startX:b.x,startY:b.y,endX:e.x,endY:e.y}}var g=this.getAnchorPoint();var a=circleFromThreePoints(this.nodeA.x,this.nodeA.y,this.nodeB.x,this.nodeB.y,g.x,g.y);var c=(this.perpendicularPart>0);var i=c?1:-1;var j=Math.atan2(this.nodeA.y-a.y,this.nodeA.x-a.x)-i*this.nodeA.radius/a.radius;var d=Math.atan2(this.nodeB.y-a.y,this.nodeB.x-a.x)+i*this.nodeB.radius/a.radius;var h=a.x+a.radius*Math.cos(j);var f=a.y+a.radius*Math.sin(j);var n=a.x+a.radius*Math.cos(d);var m=a.y+a.radius*Math.sin(d);return{hasCircle:true,startX:h,startY:f,endX:n,endY:m,startAngle:j,endAngle:d,circleX:a.x,circleY:a.y,circleRadius:a.radius,reverseScale:i,isReversed:c}};Link.applySelectColors=function(a,b){if(a.parent.selectedObject==a){b.fillStyle=b.strokeStyle=a.selectedColor}else{b.fillStyle=b.strokeStyle=a.fgColor}};Link.prototype.draw=function(h){var g=this.getEndPointsAndCircle();Link.applySelectColors(this,h);h.beginPath();if(g.hasCircle){h.arc(g.circleX,g.circleY,g.circleRadius,g.startAngle,g.endAngle,g.isReversed)}else{h.moveTo(g.startX,g.startY);h.lineTo(g.endX,g.endY)}h.stroke();if(g.hasCircle){drawArrow(h,g.endX,g.endY,g.endAngle-g.reverseScale*(Math.PI/2))}else{drawArrow(h,g.endX,g.endY,Math.atan2(g.endY-g.startY,g.endX-g.startX))}if(g.hasCircle){var f=g.startAngle;var e=g.endAngle;if(e<f){e+=Math.PI*2}var d=(f+e)/2+g.isReversed*Math.PI;var b=g.circleX+g.circleRadius*Math.cos(d);var a=g.circleY+g.circleRadius*Math.sin(d);drawText(h,this.text,b,a,d,this.parent.selectedObject==this,this.font)}else{var b=(g.startX+g.endX)/2;var a=(g.startY+g.endY)/2;var d=Math.atan2(g.endX-g.startX,g.startY-g.endY);drawText(h,this.text,b,a,d+this.lineAngleAdjust,this.parent.selectedObject==this,this.font)}};Link.prototype.containsPoint=function(i,h){var d=this.getEndPointsAndCircle();if(d.hasCircle){var l=i-d.circleX;var k=h-d.circleY;var a=Math.sqrt(l*l+k*k)-d.circleRadius;if(Math.abs(a)<this.parent.hitTargetPadding){var e=Math.atan2(k,l);var g=d.startAngle;var c=d.endAngle;if(d.isReversed){var j=g;g=c;c=j}if(c<g){c+=Math.PI*2}if(e<g){e+=Math.PI*2}else{if(e>c){e-=Math.PI*2}}return(e>g&&e<c)}}else{var l=d.endX-d.startX;var k=d.endY-d.startY;var b=Math.sqrt(l*l+k*k);var f=(l*(i-d.startX)+k*(h-d.startY))/(b*b);var a=(l*(h-d.startY)-k*(i-d.startX))/b;return(f>0&&f<1&&Math.abs(a)<this.parent.hitTargetPadding)}return false};function Node(a,c,b){this.parent=b;this.radius=55;this.outline=2;this.fgColor="black";this.bgColor="white";this.selectedColor="blue";this.font='16px "Droid Sans", sans-serif';this.outputPadding=14;this.outputFont='20px "Inconsolata", monospace';this.outputColor="#101010";this.x=a;this.y=c;this.mouseOffsetX=0;this.mouseOffsetY=0;this.isAcceptState=false;this.text="";this.outputs=""}Node.prototype.setMouseStart=function(a,b){this.mouseOffsetX=this.x-a;this.mouseOffsetY=this.y-b};Node.prototype.setAnchorPoint=function(a,b){this.x=a+this.mouseOffsetX;this.y=b+this.mouseOffsetY};Node.prototype.draw=function(a){a.lineWidth=this.outline;a.beginPath();a.arc(this.x,this.y,this.radius,0,2*Math.PI,false);a.fillStyle=this.bgColor;a.fill();a.strokeStyle=(this.parent.selectedObject===this&&!this.parent.inOutputMode)?this.selectedColor:this.fgColor;a.stroke();a.fillStyle=(this.parent.selectedObject===this&&!this.parent.inOutputMode)?this.selectedColor:this.fgColor;drawText(a,this.text,this.x,this.y,null,this.parent.selectedObject==this&&!this.parent.inOutputMode,this.font);a.fillStyle=(this.parent.selectedObject===this&&this.parent.inOutputMode)?this.selectedColor:this.outputColor;drawText(a,this.outputs,this.x,this.y+this.radius+this.outputPadding,null,this.parent.selectedObject==this&&this.parent.inOutputMode,this.outputFont);a.fillStyle=(this.parent.selectedObject===this)?this.selectedColor:this.fgColor;if(this.isAcceptState){a.beginPath();a.arc(this.x,this.y,this.radius-6,0,2*Math.PI,false);a.stroke()}};Node.prototype.closestPointOnCircle=function(a,e){var c=a-this.x;var b=e-this.y;var d=Math.sqrt(c*c+b*b);return{x:this.x+c*this.radius/d,y:this.y+b*this.radius/d}};Node.prototype.containsPoint=function(a,b){return(a-this.x)*(a-this.x)+(b-this.y)*(b-this.y)<this.radius*this.radius};function SelfLink(c,a,b){this.parent=b;Link.setDefaults(this);this.node=c;this.anchorAngle=0;this.mouseOffsetAngle=0;this.text="";if(a){this.setAnchorPoint(a.x,a.y)}}SelfLink.prototype.connectedTo=function(a){return(this.node==a)};SelfLink.prototype.setMouseStart=function(a,b){this.mouseOffsetAngle=this.anchorAngle-Math.atan2(b-this.node.y,a-this.node.x)};SelfLink.prototype.setAnchorPoint=function(b,c){this.anchorAngle=Math.atan2(c-this.node.y,b-this.node.x)+this.mouseOffsetAngle;var a=Math.round(this.anchorAngle/(Math.PI/2))*(Math.PI/2);if(Math.abs(this.anchorAngle-a)<0.1){this.anchorAngle=a}if(this.anchorAngle<-Math.PI){this.anchorAngle+=2*Math.PI}if(this.anchorAngle>Math.PI){this.anchorAngle-=2*Math.PI}};SelfLink.prototype.getEndPointsAndCircle=function(){var f=this.node.x+1.5*this.node.radius*Math.cos(this.anchorAngle);var e=this.node.y+1.5*this.node.radius*Math.sin(this.anchorAngle);var g=0.75*this.node.radius;var d=this.anchorAngle-Math.PI*0.8;var a=this.anchorAngle+Math.PI*0.8;var c=f+g*Math.cos(d);var b=e+g*Math.sin(d);var i=f+g*Math.cos(a);var h=e+g*Math.sin(a);return{hasCircle:true,startX:c,startY:b,endX:i,endY:h,startAngle:d,endAngle:a,circleX:f,circleY:e,circleRadius:g}};SelfLink.prototype.draw=function(e){var d=this.getEndPointsAndCircle();Link.applySelectColors(this,e);e.beginPath();e.arc(d.circleX,d.circleY,d.circleRadius,d.startAngle,d.endAngle,false);e.stroke();var b=d.circleX+d.circleRadius*Math.cos(this.anchorAngle);var a=d.circleY+d.circleRadius*Math.sin(this.anchorAngle);drawText(e,this.text,b,a,this.anchorAngle,this.parent.selectedObject==this,this.font);drawArrow(e,d.endX,d.endY,d.endAngle+Math.PI*0.4)};SelfLink.prototype.containsPoint=function(a,f){var d=this.getEndPointsAndCircle();var c=a-d.circleX;var b=f-d.circleY;var e=Math.sqrt(c*c+b*b)-d.circleRadius;return(Math.abs(e)<this.parent.hitTargetPadding)};function StartLink(b,c,a){this.parent=a;Link.setDefaults(this);this.node=b;this.deltaX=0;this.deltaY=0;this.text="";if(c){this.setAnchorPoint(c.x,c.y)}}StartLink.prototype.connectedTo=function(a){return(this.node==a)};StartLink.prototype.setAnchorPoint=function(a,b){if(!this.node){return}this.deltaX=a-this.node.x;this.deltaY=b-this.node.y;if(Math.abs(this.deltaX)<this.parent.snapToPadding){this.deltaX=0}if(Math.abs(this.deltaY)<this.parent.snapToPadding){this.deltaY=0}};StartLink.prototype.getEndPoints=function(){var c=this.node.x+this.deltaX;var a=this.node.y+this.deltaY;var b=this.node.closestPointOnCircle(c,a);return{startX:c,startY:a,endX:b.x,endY:b.y}};StartLink.prototype.draw=function(d){if(!this.node){return}var b=this.getEndPoints();Link.applySelectColors(this,d);d.beginPath();d.moveTo(b.startX,b.startY);d.lineTo(b.endX,b.endY);d.stroke();var a=Math.atan2(b.startY-b.endY,b.startX-b.endX);drawText(d,this.text,b.startX,b.startY,a,this.parent.selectedObject==this,this.linkFont);drawArrow(d,b.endX,b.endY,Math.atan2(-this.deltaY,-this.deltaX))};StartLink.prototype.containsPoint=function(a,h){if(!this.node){return false}var f=this.getEndPoints();var c=f.endX-f.startX;var b=f.endY-f.startY;var e=Math.sqrt(c*c+b*b);var d=(c*(a-f.startX)+b*(h-f.startY))/(e*e);var g=(c*(h-f.startY)-b*(a-f.startX))/e;return(d>0&&d<1&&Math.abs(g)<this.parent.hitTargetPadding)};function TemporaryLink(b,a){this.from=b;this.to=a}TemporaryLink.prototype.draw=function(a){a.beginPath();a.moveTo(this.to.x,this.to.y);a.lineTo(this.from.x,this.from.y);a.stroke();drawArrow(a,this.to.x,this.to.y,Math.atan2(this.to.y-this.from.y,this.to.x-this.from.x))};function ExportAsLaTeX(){this._points=[];this._texData="";this._scale=0.1;this.toLaTeX=function(){return"\\documentclass[12pt]{article}\n\\usepackage{tikz}\n\n\\begin{document}\n\n\\begin{center}\n\\begin{tikzpicture}[scale=0.2]\n\\tikzstyle{every node}+=[inner sep=0pt]\n"+this._texData+"\\end{tikzpicture}\n\\end{center}\n\n\\end{document}\n"};this.beginPath=function(){this._points=[]};this.arc=function(b,g,a,e,d,f){b*=this._scale;g*=this._scale;a*=this._scale;if(d-e==Math.PI*2){this._texData+="\\draw ["+this.strokeStyle+"] ("+fixed(b,3)+","+fixed(-g,3)+") circle ("+fixed(a,3)+");\n"}else{if(f){var c=e;e=d;d=c}if(d<e){d+=Math.PI*2}if(Math.min(e,d)<-2*Math.PI){e+=2*Math.PI;d+=2*Math.PI}else{if(Math.max(e,d)>2*Math.PI){e-=2*Math.PI;d-=2*Math.PI}}e=-e;d=-d;this._texData+="\\draw ["+this.strokeStyle+"] ("+fixed(b+a*Math.cos(e),3)+","+fixed(-g+a*Math.sin(e),3)+") arc ("+fixed(e*180/Math.PI,5)+":"+fixed(d*180/Math.PI,5)+":"+fixed(a,3)+");\n"}};this.moveTo=this.lineTo=function(a,b){a*=this._scale;b*=this._scale;this._points.push({x:a,y:b})};this.stroke=function(){if(this._points.length==0){return}this._texData+="\\draw ["+this.strokeStyle+"]";for(var a=0;a<this._points.length;a++){var b=this._points[a];this._texData+=(a>0?" --":"")+" ("+fixed(b.x,2)+","+fixed(-b.y,2)+")"}this._texData+=";\n"};this.fill=function(){if(this._points.length==0){return}this._texData+="\\fill ["+this.strokeStyle+"]";for(var a=0;a<this._points.length;a++){var b=this._points[a];this._texData+=(a>0?" --":"")+" ("+fixed(b.x,2)+","+fixed(-b.y,2)+")"}this._texData+=";\n"};this.measureText=function(b,a){var d=canvas.getContext("2d");if(a!==null){d.font=a}else{d.font=nodeFont}return d.measureText(b)};this.advancedFillText=function(g,b,e,d,f){if(g.replace(" ","").length>0){var c="";if(f!=null){var a=this.measureText(g).width;var i=Math.cos(f);var h=Math.sin(f);if(Math.abs(i)>Math.abs(h)){if(i>0){c="[right] ";e-=a/2}else{c="[left] ";e+=a/2}}else{if(h>0){c="[below] ";d-=10}else{c="[above] ";d+=10}}}e*=this._scale;d*=this._scale;this._texData+="\\draw ("+fixed(e,2)+","+fixed(-d,2)+") node "+c+"{$"+b.replace(/ /g,"\\mbox{ }")+"$};\n"}};this.translate=this.save=this.restore=this.clearRect=function(){}}function ExportAsSVG(){this.fillStyle="black";this.strokeStyle="black";this.lineWidth=1;this.font="12px Arial, sans-serif";this._points=[];this._svgData="";this._transX=0;this._transY=0;this.toSVG=function(){return'<?xml version="1.0" standalone="no"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n\n<svg width="800" height="600" version="1.1" xmlns="http://www.w3.org/2000/svg">\n'+this._svgData+"</svg>\n"};this.beginPath=function(){this._points=[]};this.arc=function(j,i,g,h,c,b){j+=this._transX;i+=this._transY;var a='stroke="'+this.strokeStyle+'" stroke-width="'+this.lineWidth+'" fill="none"';if(c-h==Math.PI*2){this._svgData+="\t<ellipse "+a+' cx="'+fixed(j,3)+'" cy="'+fixed(i,3)+'" rx="'+fixed(g,3)+'" ry="'+fixed(g,3)+'"/>\n'}else{if(b){var l=h;h=c;c=l}if(c<h){c+=Math.PI*2}var e=j+g*Math.cos(h);var d=i+g*Math.sin(h);var n=j+g*Math.cos(c);var k=i+g*Math.sin(c);var m=(Math.abs(c-h)>Math.PI);var f=1;this._svgData+="\t<path "+a+' d="';this._svgData+="M "+fixed(e,3)+","+fixed(d,3)+" ";this._svgData+="A "+fixed(g,3)+","+fixed(g,3)+" ";this._svgData+="0 ";this._svgData+=+m+" ";this._svgData+=+f+" ";this._svgData+=fixed(n,3)+","+fixed(k,3);this._svgData+='"/>\n'}};this.moveTo=this.lineTo=function(a,b){a+=this._transX;b+=this._transY;this._points.push({x:a,y:b})};this.stroke=function(){if(this._points.length==0){return}this._svgData+='\t<polygon stroke="'+this.strokeStyle+'" stroke-width="'+this.lineWidth+'" points="';for(var a=0;a<this._points.length;a++){this._svgData+=(a>0?" ":"")+fixed(this._points[a].x,3)+","+fixed(this._points[a].y,3)}this._svgData+='"/>\n'};this.fill=function(){if(this._points.length==0){return}this._svgData+='\t<polygon fill="'+this.fillStyle+'" stroke-width="'+this.lineWidth+'" points="';for(var a=0;a<this._points.length;a++){this._svgData+=(a>0?" ":"")+fixed(this._points[a].x,3)+","+fixed(this._points[a].y,3)}this._svgData+='"/>\n'};this.measureText=function(a){var b=canvas.getContext("2d");b.font=nodeFont;return b.measureText(a)};this.fillText=function(b,a,c){a+=this._transX;c+=this._transY;if(b.replace(" ","").length>0){this._svgData+='\t<text x="'+fixed(a,3)+'" y="'+fixed(c,3)+'" font-family="Times New Roman" font-size="20">'+textToXML(b)+"</text>\n"}};this.translate=function(a,b){this._transX=a;this._transY=b};this.save=this.restore=this.clearRect=function(){}}var greekLetterNames=["Alpha","Beta","Gamma","Delta","Epsilon","Zeta","Eta","Theta","Iota","Kappa","Lambda","Mu","Nu","Xi","Omicron","Pi","Rho","Sigma","Tau","Upsilon","Phi","Chi","Psi","Omega"];function convertLatexShortcuts(c){for(var b=0;b<greekLetterNames.length;b++){var a=greekLetterNames[b];c=c.replace(new RegExp("\\\\"+a,"g"),String.fromCharCode(913+b+(b>16)));c=c.replace(new RegExp("\\\\"+a.toLowerCase(),"g"),String.fromCharCode(945+b+(b>16)))}for(var b=0;b<10;b++){c=c.replace(new RegExp("_"+b,"g"),String.fromCharCode(8320+b))}return c}function textToXML(d){d=d.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");var a="";for(var b=0;b<d.length;b++){var e=d.charCodeAt(b);if(e>=32&&e<=126){a+=d[b]}else{a+="&#"+e+";"}}return a}function drawArrow(g,a,f,e){var d=Math.cos(e);var b=Math.sin(e);g.beginPath();g.moveTo(a,f);g.lineTo(a-8*d+5*b,f-8*b-5*d);g.lineTo(a-8*d-5*b,f-8*b+5*d);g.fill()}function drawText(h,e,j,i,k,b,d){text=convertLatexShortcuts(e);h.font=d;var a=h.measureText(text,d).width;j-=a/2;if(k!=null){var l=Math.cos(k);var g=Math.sin(k);var n=(a/2+5)*(l>0?1:-1);var m=(10+5)*(g>0?1:-1);var f=g*Math.pow(Math.abs(g),40)*n-l*Math.pow(Math.abs(l),10)*m;j+=n-g*f;i+=m+l*f}if("advancedFillText" in h){h.advancedFillText(text,e,j+a/2,i,k)}else{j=Math.round(j);i=Math.round(i);h.fillText(text,j,i+6);if(b&&caretVisible&&canvasHasFocus()&&document.hasFocus()){j+=a;h.beginPath();h.moveTo(j,i-10);h.lineTo(j,i+10);h.stroke()}}}var caretTimer;var caretVisible=true;function resetCaret(){clearInterval(caretTimer);caretTimer=setInterval("caretVisible = !caretVisible; redrawAll()",500);caretVisible=true}var designers=[];function redrawAll(){for(var a=0;a<designers.length;++a){designers[a].draw()}}function register_new_designer(a){designers.push(a)}function load_fonts(){WebFontConfig={google:{families:["Droid+Sans:400,700:latin"]},active:function(){redrawAll()}};(function(){var a=document.createElement("script");a.src=("https:"==document.location.protocol?"https":"http")+"://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js";a.type="text/javascript";a.async="true";var b=document.getElementsByTagName("script")[0];b.parentNode.insertBefore(a,b)})()}function manualOpenFallback(){document.getElementById("staging").style.visibility="visible"}function handleOpen(a,b){if(typeof(FileReader)=="undefined"){return}if(b.target.files.length!=1){return}a.loadFromFile(b.target.files[0])}window.onload=function(){load_fonts();canvas=document.getElementById("canvas");designer=new FSMDesigner(canvas);designer.recreateState();designer.draw();register_new_designer(designer);document.getElementById("btnNew").onclick=function(){designer.clear()};document.getElementById("btnUndo").onclick=function(){designer.undo()};document.getElementById("btnRedo").onclick=function(){designer.redo()};window.onresize=function(){redrawAll()};var a={swf:"lib/downloadify.swf",downloadImage:"img/download.gif",width:document.getElementById("btnSaveDummy").offsetWidth,height:document.getElementById("btnSaveDummy").offsetHeight,append:true,transparent:true,filename:"FiniteStateMachine.fsmd",data:function(){return designer.getDataToSave()}};Downloadify.create("btnSave",a);document.getElementById("btnSaveDummy").style.zIndex=-100;document.getElementById("btnSave").style.zIndex=100;document.getElementById("btnSaveDummy").onclick=function(){designer.saveFileHTML5()};document.getElementById("btnOpen").onclick=function(){handleOpenButton()};document.getElementById("fileOpen").onchange=function(b){handleOpen(designer,b)};document.getElementById("cancelOpen").onclick=function(){closeOpenDialog()};document.getElementById("btnSavePNG").onclick=function(){designer.exportPNG()};document.getElementById("btnHelp").onclick=function(){toggleHelp()};document.getElementById("btnDismissHelp").onclick=function(){toggleHelp()};if(localStorage.seenFSMDesigner==undefined){document.getElementById("btnHelp").click();localStorage.seenFSMDesigner="yes"}};function handleOpenButton(){if(typeof(FileReader)!="undefined"){document.getElementById("fileOpen").click()}else{manualOpenFallback()}}function toggleHelp(){var a=document.getElementById("helppanel");if(a.style.visibility=="visible"){a.style.opacity=0;setTimeout(function(){a.style.visibility="hidden"},0.2*1000)}else{a.style.visibility="visible";a.style.opacity=1}}function closeOpenDialog(){var a=document.getElementById("staging");a.style.visibility="hidden"}function handleModalBehavior(){if(document.getElementById("helppanel").style.visibility=="visible"){toggleHelp()}if(document.getElementById("staging").style.visibility=="visible"){closeOpenDialog()}}function crossBrowserKey(a){a=a||window.event;return a.which||a.keyCode}function crossBrowserElementPos(c){c=c||window.event;var b=c.target||c.srcElement;var a=0,d=0;while(b.offsetParent){a+=b.offsetLeft;d+=b.offsetTop;b=b.offsetParent}return{x:a,y:d}}function crossBrowserMousePos(a){a=a||window.event;return{x:a.pageX||a.clientX+document.body.scrollLeft+document.documentElement.scrollLeft,y:a.pageY||a.clientY+document.body.scrollTop+document.documentElement.scrollTop}}function crossBrowserRelativeMousePos(c){var b=crossBrowserElementPos(c);var a=crossBrowserMousePos(c);return{x:a.x-b.x,y:a.y-b.y}}function output(b){var a=document.getElementById("output");a.style.display="block";a.value=b}function saveAsSVG(){var b=new ExportAsSVG();var c=selectedObject;selectedObject=null;drawUsing(b);selectedObject=c;var a=b.toSVG();output(a)}function saveAsLaTeX(){var b=new ExportAsLaTeX();var c=selectedObject;selectedObject=null;drawUsing(b);selectedObject=c;var a=b.toLaTeX();output(a)}function det(r,q,p,o,n,m,l,k,j){return r*n*j+q*m*l+p*o*k-r*m*k-q*o*j-p*n*l}function circleFromThreePoints(e,k,d,j,b,i){var l=det(e,k,1,d,j,1,b,i,1);var h=-det(e*e+k*k,k,1,d*d+j*j,j,1,b*b+i*i,i,1);var f=det(e*e+k*k,e,1,d*d+j*j,d,1,b*b+i*i,b,1);var g=-det(e*e+k*k,e,k,d*d+j*j,d,j,b*b+i*i,b,i);return{x:-h/(2*l),y:-f/(2*l),radius:Math.sqrt(h*h+f*f-4*l*g)/(2*Math.abs(l))}}function fixed(a,b){return a.toFixed(b).replace(/0+$/,"").replace(/\.$/,"")};