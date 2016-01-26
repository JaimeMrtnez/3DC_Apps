/*
** The Typefoodgraphy Workshop.
**
** The MIT License (MIT)
**
** Copyright (c) 2015 Jaime Martínez Mejías
**
Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.*/


var font= null;
var fontSize= 120;
var textToRender= "";
var baseLineHeight= 230;
var frameDistance= 25;
var previewPath= null;
var snapPath= null;
var snapStrength= 0;
var snapDistance= 1;
var snapX= 0;
var snapY= 0;
var fontFileName= 'fonts/FiraSansMedium.woff';
var currentPoint;
var curve;
var fullPath= [];
var extendedFullPath= [];
var pathShapesLengths= [];
var distances= [];
var extrusions= [];
var ac_extrusions= [];
var gcode;

enableHighDPICanvas('playingField');
openTypeLoad(fontFileName);


function doMouseDown(event) {
    
    pathShapesLengths= [];
    fullPath= [];
    
    //Getting canvas object and values
    var canvas= document.getElementById('playingField');
    var ctx= canvas.getContext('2D');
    var canvasW= canvas.width;
    var canvasY= canvas.height;
    var innerWith= window.innerWidth;
    //Getting sliding paragraph height.
    var expHeight= document.getElementById('explain').style.height;
    
    //Setting coordinates from window to canvas position and from left corner reference to the center of the canvas
    canvasXOffset= 500 + ((innerWith-1000)/2);
    canvasXOffset= Math.round(canvasXOffset);
    var text= document.getElementById('readMore').textContent;
    if(text == 'Read More'){
       canvasYOffset= 385;
    }else if (text == 'Hide'){
        canvasYOffset= 495;
    }
    //Setting offset coordinates
    canvasXCentered= event.pageX - canvasXOffset;
    canvasYCentered= event.pageY - canvasYOffset;

    //Getting arithmetic mean of coordinates to use it in next calculations
    var coordsMaxMean= (canvasW + canvasY)/2;
    //Getting arithmetic sum of coordinates to use it in next calculations
    var coordsSum= (Math.abs(canvasXCentered) + Math.abs(canvasYCentered));
    
    //Setting Snap strength scaling the coordinates mean to a 0-100 period.
    snapStrength= Math.round(coordsSum * (100/coordsMaxMean));
    
    //Setting Snap distance scaling the coordinates mean to a 0-100 period
    //A value of 0, produces no response, so it is necessary to avoid it
    if(snapStrength == 0) {
        snapDistance= 1;
    }else{
        snapDistance= snapStrength;
    }
    
    //Scaling x & y values to a -100,100 period
    snapX= canvasXCentered/5;
    snapY= canvasYCentered/1.5;
    
    canvasToGcode();
    
}

function canvasToGcode(){
    renderText();
    createFullPathArray();
    reverseFullPath(fullPath);
    pathShapesLengths= storeLengths(fullPath);
    extendedFullPath= extendFullPath(fullPath);
    extendedFullPath= offsetAndScale(extendedFullPath);
    fullPath= contractFullPath(extendedFullPath, pathShapesLengths);
    distances= calculateDistances(fullPath);
    extrusions= calculateExtrusions(distances);
    ac_extrusions= calculateAccumulatedExtrusions(extrusions);
    gcode= buildGcode();
    console.log(gcode);
    
    fullPath= [];
    extendedFullPath= [];
    pathShapesLengths= [];
    distances= [];
    extrusions= [];
    ac_extrusions= [];
    snapPath= null;
}

function reverseFullPath(path){
    path.reverse();
    for(var i=0; i< path.length; i++){
        path[i].reverse();
    }
}

function adaptTextSize(){
    var textLength;
    
    textToRender= document.getElementById('textInput').value;
    textLength= textToRender.length;
    switch(textLength) {
        case 1:
            fontSize= 180;
        break;
        case 2:
            fontSize= 180;
        break;
        case 3:
            fontSize= 180;
        break;
        case 4:
            fontSize= 160;
        break;
        case 5:
            fontSize= 150;
        break;
        case 6:
            fontSize= 140;
        break;
        case 7:
            fontSize= 130;
        break;
        case 8:
            fontSize= 120;
        break;
        case 9:
            fontSize= 110;
        break;
        case 10:
            fontSize= 100;
        break;
    } 
}

function getQuadraticCurvePath(currentPoint, curve){
    var t, tSqr, oneMinust, oneMinustSqr;
    var curvePath= [];
    var curvePoint= {};
    
    for(t= 0.0; t< 1.0; t+= 0.05){
        /*** Previous calculations ***/
        tSqr= Math.pow(t, 2);
        oneMinust= (1.0 - t);
        oneMinustSqr= Math.pow(oneMinust, 2);
        //Curve point calculations
        curvePoint.x= oneMinustSqr * currentPoint.x + 2 * oneMinust * t * curve.x1 + tSqr * curve.x;
        curvePoint.y= oneMinustSqr * currentPoint.y + 2 * oneMinust * t * curve.y1 + tSqr * curve.y;
        //Rounding values
        curvePoint.x= parseFloat(curvePoint.x.toFixed(4));
        curvePoint.y= parseFloat(curvePoint.y.toFixed(4));
        //Storing points in an array
        curvePath.push(curvePoint.x);
        curvePath.push(curvePoint.y);
    }
    return curvePath;
}

function getCubicCurvePath(currentPoint, curve){
    var t, tSqr, tCub, ax, bx, cx, ay, by, cy;
    var curvePoint= {};
    var curvePath= [];
    //console.log(currentPoint, curve);
    /*** Previous calculations ***/
    
    //Polynomial coefficients calculations
    cx= 3.0 * (curve.x1 - currentPoint.x);
    cx= parseFloat(cx.toFixed(4));
    bx= 3.0 * (curve.x2 - curve.x1) - cx;
    bx= parseFloat(bx.toFixed(4));
    ax= curve.x - currentPoint.x - cx - bx;
    ax= parseFloat(ax.toFixed(4));
    cy= 3.0 * (curve.y1 - currentPoint.y);
    cy= parseFloat(cy.toFixed(4));
    by= 3.0 * (curve.y2 - curve.y1) - cy;
    by= parseFloat(by.toFixed(4));
    ay= curve.y - currentPoint.y - cy - by;
    ay= parseFloat(ay.toFixed(4));
    //console.log(cx, bx, ax, cy, by, ay);
    
    //Curve point calculations
    for(t= 0.0; t< 1.0; t+= 0.05){
        tSqr= Math.pow(t, 2);
        tSqr= parseFloat(tSqr.toFixed(4));
        tCub= Math.pow(t, 3);
        tCub= parseFloat(tCub.toFixed(4));
        curvePoint.x= (ax * tCub) + (bx * tSqr) + (cx * t) + currentPoint.x;
        curvePoint.x= parseFloat(curvePoint.x.toFixed(4));
        curvePoint.y= (ay * tCub) + (by * tSqr) + (cy * t) + currentPoint.y;
        curvePoint.y= parseFloat(curvePoint.y.toFixed(4));
        //Storing points in an array
        curvePath.push(curvePoint.x);
        curvePath.push(curvePoint.y);
        
    }
    return curvePath;
}

//This function treats and stores in an array all the points of the path.
function createFullPathArray(){
    //console.log(snapPath);
    var i, j, k, cmd, currentPathLength; 
    var initShapePoint={};
    var currentPoint={};
    var shapePath= [];
    var curvePath= [];
    cmd= snapPath.commands;
    for(i=0; i< cmd.length; i++){
        //Consulting the type of command for different treatment
        switch(cmd[i].type){
            case 'M':
                //Storing initial points for the shape closing
                initShapePoint.x= parseFloat(cmd[i].x);
                initShapePoint.x= initShapePoint.x.toFixed(4);
                initShapePoint.x= parseFloat(initShapePoint.x);
                initShapePoint.y= parseFloat(cmd[i].y);
                initShapePoint.y= initShapePoint.y.toFixed(4);
                initShapePoint.y= parseFloat(initShapePoint.y);
                //Storing values in the fullPath array
                shapePath.push(initShapePoint.x);
                shapePath.push(initShapePoint.y);
            break;
            case 'L':
                //Storing values in the fullPath array
                shapePath.push(parseFloat(cmd[i].x.toFixed(4)));
                shapePath.push(parseFloat(cmd[i].y.toFixed(4)));
            break;
            case 'C':
                //Getting the last point
                currentPoint.x= shapePath[shapePath.length-2];
                currentPoint.y= shapePath[shapePath.length-1];
                //Generating cubic bézier curve path
                curvePath= getCubicCurvePath(currentPoint, cmd[i]);
                //Saving points in the shape array
                for(j=0; j< curvePath.length; j++){
                    shapePath.push(parseFloat(curvePath[j].toFixed(4)));
                }
            break;
            case 'Q':
                //Getting the last point
                currentPoint.x= shapePath[shapePath.length-2];
                currentPoint.y= shapePath[shapePath.length-1];
                //Generating quadratic bézier curve path
                curvePath= getQuadraticCurvePath(currentPoint, cmd[i]);
                //Saving points in the main array
                for(k=0; k< curvePath.length; k++){
                    shapePath.push(parseFloat(curvePath[k].toFixed(4)));
                }   
            break;
            case 'Z':
                //Using first point data to close the shape.
                shapePath.push(initShapePoint.x);
                shapePath.push(initShapePoint.y);
                fullPath.push(shapePath);
                shapePath= [];
            break;
        }
    }
}

function storeLengths(arrayOfArrays){
    var pathLengths= [];
    for(var i=0; i< arrayOfArrays.length; i++){
        pathLengths.push(arrayOfArrays[i].length);
    }
    return pathLengths;
}

function extendFullPath(arrayOfArrays){
    var extendedArray= [];
    for(var i=0; i< arrayOfArrays.length; i++){
        for(var j=0; j<arrayOfArrays[i].length; j++){
            extendedArray.push(arrayOfArrays[i][j]);
        }
    }
    return extendedArray;
}

function contractFullPath(path, lengths){
    var shapes= lengths.length;
    var rebuiltArray= [];
    var currentShape;
    var currentStart= 0;
    var currentEnd;
    
    for(var i=0; i< shapes; i++){
        currentEnd= lengths[i];
        currentShape= path.splice(currentStart, currentEnd);
        rebuiltArray[i]= currentShape;
    }
    
    return rebuiltArray;
}

function calculateDistances(arrayOfArrays){
    var shapes= arrayOfArrays.length;
    var distances= [];
    var i, j, k, l, m;
    var result;
    
    for(i=0; i< shapes; i++){
        var currentShape= arrayOfArrays[i];
        //console.log(currentShape);
        var currentLength= currentShape.length;
        //console.log(currentLength);
        distances[i]= [];
        for(j=0, k=0; j< currentLength-1; j+=2, k++){
            distances[i][k]= Math.sqrt(Math.pow((currentShape[j+2]-currentShape[j]),2)+
                             (Math.pow((currentShape[j+3]-currentShape[j+1]),2)));
            distances[i][k]= parseFloat(distances[i][k].toFixed(4));
        }
    }
    for(l=0; l< shapes; l++){
        var distance_l_length= distances[l].length-1;
        distances[l].splice(distance_l_length, 1); 
    }
    return distances;
}

function calculateExtrusions(distances){
    
    //Getting user values
    var nozzle_d= parseFloat(document.getElementById("nozzle_d").value);
    var material_d= parseFloat(document.getElementById("material_d").value);
    //Calculating nozzle-material surface ratio
    var nozzle_s= Math.PI * Math.pow((nozzle_d/2), 2);
    var material_s= Math.PI * Math.pow((material_d/2), 2);
    var m_s_ratio= nozzle_s / material_s;
    
    var extrusions= [];
    var shapes= distances.length;
    
    for(var i= 0; i< shapes; i++){
        extrusions[i]= [];
        var shape= distances[i].length;
        for(var j= 0; j< shape; j++){
            extrusions[i][j]= distances[i][j] * m_s_ratio;
            extrusions[i][j]= parseFloat(extrusions[i][j].toFixed(4));
        }
    }
    return extrusions;
}
 function calculateAccumulatedExtrusions(extrusions){
     
     var layers= parseInt(document.getElementById("layers").value);
     var ac_extrusions= [];
     var shapes= extrusions.length;
     var first_value= extrusions[0].shift();
     ac_extrusions.push(first_value);
     for(var i=0; i< layers; i++){
         if(i==1){
             extrusions[0].unshift(first_value);
         }
         for(var j=0; j< shapes; j++){
             var shape= extrusions[j].length;
             for(var k=0; k< shape; k++){
                 var ace_length= ac_extrusions.length;
                 var last_sum= ac_extrusions[ace_length-1];
                 var result= last_sum + extrusions[j][k];
                 result= parseFloat(result.toFixed(4));
                 ac_extrusions.push(result);
             }
         }
         
         
     }
     return ac_extrusions;
 }

function buildGcode(){
    //Getting user settings
    var layers= parseInt(document.getElementById("layers").value);
    var layer_h= parseFloat(document.getElementById("layer_h").value);
    var i_layer_h= parseFloat(document.getElementById("i_layer_h").value);
    var b_pressure= parseFloat(document.getElementById("b_pressure").value);
    var r_pressure= parseFloat(document.getElementById("r_pressure").value);
    var feedrate= parseInt(document.getElementById("feedrate").value);
    var z_travel_h= parseFloat(document.getElementById("z_travel_h").value);
    var retraction= parseFloat(document.getElementById("retraction").value);
    var text;
    var extrusion;
    var latest_extrusions= [];
    var currentRetraction;
    var currentLastExtrusion;
    var last_index;
    var travel;
    var recoveredExtrusion;
    var currentTravelHeight;
    var currentReleasePressure;
    
    //Calculating layers height values
    var total_height= i_layer_h + ((layers-1) * layer_h);
    var ac_layer_h;
    ac_layer_h= i_layer_h;
    
    //Initial instructions block
    text= "G28\r\nG92 E0\r\nG1 X" + fullPath[0][0] +" Y" + fullPath[0][1] + 
        " Z"+ i_layer_h +" F" + feedrate + "\r\n" + 
        "G1 E" + b_pressure + " F200\r\n" + 
        "G92 E0\r\nG1 F" + 
        feedrate + "\r\n";
    
    var shapes= fullPath.length;
    for(var i= 0; i< layers; i++){
        if(i>0){
        text+= "G1 Z"+ ac_layer_h +" F"+ feedrate +"\r\n";
        }
        for(var j= 0; j< shapes; j++){
            recoveredExtrusion= parseFloat((currentRetraction + retraction).toFixed(4));
            text+= "G1 X"+fullPath[j][0]+" Y"+fullPath[j][1]+"\r\n";
            
            if(recoveredExtrusion){
                text+= "G1 E"+ recoveredExtrusion +" F200\r\n";
            }
            if(extrusion){
                text+= "G1 Z"+ ac_layer_h +"\r\n";
            }
            var shape= fullPath[j].length;
            for(var k= 2; k< shape; k= k+2){
            //if(){
                text+= "G1 X"+fullPath[j][k]+" Y"+fullPath[j][k+1];
                last_index= shape-2;
                
                if(k== last_index){
                    extrusion= ac_extrusions.shift();
                    text+= " E"+ extrusion +"\r\n"; 
                    latest_extrusions.push(extrusion);
                }else if(k== 2 && j!= 0){
                    extrusion= ac_extrusions.shift();
                    text+= " E"+ extrusion + " F"+ feedrate +"\r\n";  
                } else {
                    extrusion= ac_extrusions.shift();
                    text+= " E"+ extrusion +"\r\n";
                }
            //}
            }
            currentLastExtrusion= latest_extrusions.shift();
            currentRetraction= parseFloat((currentLastExtrusion - retraction).toFixed(4));
            text+= "G1 E"+ currentRetraction +" F200\r\n";
            currentTravelHeight= ac_layer_h + z_travel_h;
            
            if(j< shapes-1){
                text+= "G1 Z"+ currentTravelHeight +" F"+ feedrate + "\r\n";
            }
        }
        ac_layer_h+= layer_h;
    }
    currentReleasePressure= parseFloat((currentLastExtrusion - r_pressure).toFixed(4));
    
    text+= "G1 E"+ currentReleasePressure +" F200\r\n" + 
           "G1 F"+ feedrate +"\r\n" + 
           "G28\r\nM84"
    
    return text;
}

function offsetAndScale(array){
    //Generating Arrays to store points coordinates
    var x_s= [];
    var y_s= [];
    var coords= [];
    
    //Separating xs and ys in different arrays for the treatment
    for(i=0; i< array.length; i= i+2){
        x_s.push(array[i]);
    }
    for(i=1; i< array.length; i= i+2){
        y_s.push(array[i]);
    }
    
    //Finding maximum and minimum values.
    var xMax= Math.max.apply(Math, x_s);
    var xMin= Math.min.apply(Math, x_s);
    var yMax= Math.max.apply(Math, y_s);
    var yMin= Math.min.apply(Math, y_s);
    
    //Calculating Offset
    var xOffset= xMin + ((xMax - yMin)/2);
    var yOffset= yMin + ((yMax - yMin)/2);
    
    //Calculating scale parameters
    var xDiff= xMax - xMin;
    var yDiff= yMax - yMin;
    var maxDiff= Math.max(xDiff, yDiff);
    var xScale= 100/maxDiff;
    var yScale= (yDiff/maxDiff) * xScale;
    
    //Converting x's
    for(i= 0; i< x_s.length; i++){
        x_s[i]= x_s[i] - xOffset;
    }
    for(i= 0; i< x_s.length; i++){
        x_s[i]= x_s[i] * xScale;
    }
    
    //Converting y's
    for(i= 0; i< y_s.length; i++){
        y_s[i]= y_s[i] - yOffset;
    }
    for(i= 0; i< y_s.length; i++){
        y_s[i]= y_s[i] * yScale;
    }
    
    //Rebuilding array with new values
    for(i=0; i< (x_s.length) ; i++){
        coords.push(x_s[i]);
        coords.push(y_s[i]);
    }
    
    //Rounding and parsing numbers
    for (i=0; i< coords.length;i++){
        coords[i]= parseFloat(coords[i].toFixed(4));
    }
    return coords;
}

function changeBaseFont(){
    var fontForm= document.getElementById('fontForm');
    var fontSelected;
    for (var i=0; i< fontForm.length; i++){
        if(fontForm[i].checked){
            fontSelected= fontForm[i].value;
        }
    }
    openTypeLoad(fontSelected);
}

function changeButtonLabel(){
    var text= document.getElementById('readMore').textContent;
    if(text == 'Read More'){
       document.getElementById('readMore').innerHTML= 'Hide';
    }else if (text == 'Hide'){
        document.getElementById('readMore').innerHTML= 'Read More';
    }

}

function unsnap(){
     snapStrength= 0;
     snapDistance= 1;
     snapX= 0;
     snapY= 0;
}

function onBodyLoad() {
    var body= document.body;
    body.addEventListener('load', initialise(), false);
}



function showErrorMessage(message) {
    var el = document.getElementById('message');
    if (!message || message.trim().length === 0) {
        el.style.display = 'none';
    } else {
        el.style.display = 'block';
    }
    el.innerHTML = message;
}

function initialise() {
    var canvas= document.getElementById('playingField');
    canvas.addEventListener('mousedown', doMouseDown, false);
}

function onFontLoaded(font) {
    var i;
    window.font = font;
    amount = Math.min(200, font.glyphs.length);
    for (i = 0; i < amount; i++) {
        glyph = font.glyphs.get(i);
    }
    unsnap();
    renderText();
}




$(document).ready(function(){
function downloadCanvasImage(link, canvasId, filename){
    link.href= document.getElementById(canvasId).toDataURL();
    link.download= filename;
}
});


function saveGcodeFile(){
    var filename = document.getElementById("textFilename").value;
    //Creating text node
    var blob = new Blob([gcode], {type: "text/plain;charset=utf-8"});
    //Saving file
    saveAs(blob, filename +".gcode");
}
function savePngFile(){
    var myCanvas= document.getElementById('playingField');
    var myCtx= myCanvas.getContext('2d');
    var fileName= document.getElementById('textFilename').value;
    fileName= fileName + '.png';
    var link= document.getElementById('saveButton');
    link.href= myCanvas.toDataURL();
    link.download= fileName;
}

//'Dowload File' button behavior
$(document).ready(function(){
    var link= document.getElementById('saveButton');
    link.addEventListener('mousedown', function(){
        link.style.borderTopColor= '#666';
        link.style.borderLeftColor= '#666';
        link.style.borderBottomColor= '#bbb';
        link.style.borderRightColor= '#bbb';
    }, false);
    link.addEventListener('mouseup', function(){
        link.style.borderTopColor= '#bbb';
        link.style.borderLeftColor= '#bbb';
        link.style.borderBottomColor= '#666';
        link.style.borderRightColor= '#666';
    }, false); 
    
});


//Slides in/out the introduction paragraph
$(document).ready(function(){
    $('#readMore').click(function() {
        var height = $("#explain").height();
        if( height > 0 ) {
            $('#explain').css('height','0');
        } else {
            var clone = $('#explain').clone()
                    .css({'position':'absolute','visibility':'hidden','height':'auto'})
                    .addClass('slideClone')
                    .appendTo('body');
        
            var newHeight = $(".slideClone").height();
            $(".slideClone").remove();
            $('#explain').css('height',newHeight + 'px');
        }
    });
});
//Slides in/out the printer settings
$(document).ready(function(){
    $('#settingsButton').click(function() {
        var height = $("#printerSettings").height();
        if( height > 0 ) {
            $('#printerSettings').css('height','0');
        } else {
            var clone = $('#printerSettings').clone()
                    .css({'position':'absolute','visibility':'hidden','height':'auto'})
                    .addClass('slideClone2')
                    .appendTo('body');
        
            var newHeight = $(".slideClone2").height();
            $(".slideClone2").remove();
            $('#printerSettings').css('height',newHeight + 'px');
        }
    });
});





/*The MIT License (MIT)

Copyright (c) 2015 Frederik De Bleser

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
function openTypeLoad(fontFileName){
    opentype.load(fontFileName, function(err, font) {
    var amount, glyph, ctx, x, y, fontSize;
    if (err) {
        showErrorMessage(err.toString());
        return;
    }
    onFontLoaded(font);
});
}


function renderText() {
    var snapCtx;
    if (!font) return;
    textToRender = document.getElementById('textInput').value;
    snapPath = font.getPath(textToRender, frameDistance, baseLineHeight, fontSize, {kerning: true});
    doSnap(snapPath);
    snapCtx = document.getElementById('playingField').getContext('2d');
    snapCtx.clearRect(0, 0, 1000, 300);
    snapPath.draw(snapCtx);
}


function snap(value, distance, strength) {
    return (value * (1.0 - strength)) + (strength * Math.round(value / distance) * distance);
}

function doSnap(path) {
    var i;
    var strength = snapStrength / 100.0;
    for (i = 0; i < path.commands.length; i++) {
        var cmd = path.commands[i];
        if (cmd.type !== 'Z') {
            cmd.x = snap(cmd.x + snapX, snapDistance, strength) - snapX;
            cmd.y = snap(cmd.y + snapY, snapDistance, strength) - snapY;
        }
        if (cmd.type === 'Q' || cmd.type === 'C') {
            cmd.x1 = snap(cmd.x1 + snapX, snapDistance, strength) - snapX;
            cmd.y1 = snap(cmd.y1 + snapY, snapDistance, strength) - snapY;
        }
        if (cmd.type === 'C') {
            cmd.x2 = snap(cmd.x2 + snapX, snapDistance, strength) - snapX;
            cmd.y2 = snap(cmd.y2 + snapY, snapDistance, strength) - snapY;
        }
    }
}



function enableHighDPICanvas(canvas) {
    if (typeof canvas === 'string') {
        canvas = document.getElementById(canvas);
    }
    var pixelRatio = window.devicePixelRatio || 1;
    if (pixelRatio === 1) return;
    var oldWidth = canvas.width;
    var oldHeight = canvas.height;
    canvas.width = oldWidth * pixelRatio;
    canvas.height = oldHeight * pixelRatio;
    canvas.style.width = oldWidth + 'px';
    canvas.style.height = oldHeight + 'px';
    canvas.getContext('2d').scale(pixelRatio, pixelRatio);
}







