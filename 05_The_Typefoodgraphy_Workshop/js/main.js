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
var fontSize=120;
var textToRender= "";
var previewPath= null;;
var snapPath= null;
var snapStrength= 0;
var snapDistance= 1;
var snapX= 0;
var snapY= 0;
var fontFileName= "fonts/FiraSansMedium.woff";

enableHighDPICanvas("playingField");

opentype.load(fontFileName, function(err, font) {
    var amount, glyph, ctx, x, y, fontSize;
    if (err) {
        showErrorMessage(err.toString());
        return;
    }
    onFontLoaded(font);
    renderText();
});

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
    var canvas= document.getElementById("playingField");
    canvas.addEventListener("mousedown", doMouseDown, false);
}

function doMouseDown(event) {
    
    //Getting canvas object and values
    var canvas= document.getElementById("playingField");
    var ctx= canvas.getContext('2D');
    var canvasW= canvas.width;
    var canvasY= canvas.height;
    
    //Getting sliding paragraph height.
    var expHeight= document.getElementById('explain').style.height;
    //Setting coordinates from window to canvas position and from left corner reference to the center of the canvas
    canvasXOffset= 510;
    if (expHeight == 0){
        canvasYOffset= 380;
    } else {
        canvasYOffset= 470;
    }
    //Setting offset coordinates
    canvasXCentered= event.pageX - canvasXOffset;
    canvasYCentered= event.pageY - canvasYOffset;
    console.log(canvasXCentered);
    console.log(canvasYCentered);
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
    
    renderText(); 
}

function onBodyLoad() {
    var body= document.body;
    body.addEventListener("load", initialise(), false);
}

function changeButtonLabel(){
    var text= document.getElementById('readMore').textContent;
    if(text == 'Read More'){
       document.getElementById('readMore').innerHTML= 'Hide';
    }else if (text == 'Hide'){
        document.getElementById('readMore').innerHTML= 'Read More';
    }

}

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

function renderText() {
    if (!font) return;
    textToRender = document.getElementById('textInput').value;
    snapPath = font.getPath(textToRender, 30, 200, fontSize, {kerning: true});
    doSnap(snapPath);
    var snapCtx = document.getElementById('playingField').getContext('2d');
    snapCtx.clearRect(0, 0, 1000, 400);
    snapPath.draw(snapCtx);
    console.log(snapPath.commands);
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

function onFontLoaded(font) {
    var i;
    window.font = font;
    amount = Math.min(100, font.glyphs.length);
    for (i = 0; i < amount; i++) {
        glyph = font.glyphs.get(i);
    }
    renderText();
}




