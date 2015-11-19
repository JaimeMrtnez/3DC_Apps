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
var fontSize=140;
var textToRender= "";
var previewPath= null;;
var snapPath= null;
var snapStrength= 60;
var snapDistance= 60;
var snapX= -20;
var snapY= 30;
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
    snapPath = font.getPath(textToRender, 50, 200, fontSize, {kerning: true});
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




