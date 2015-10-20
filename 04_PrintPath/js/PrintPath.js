function offsetAndScale(array){
    
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
        coords[i]= coords[i].toFixed(2);
    }
    return coords;
}


//Shape limits options:
var minPoints= 3;
var maxPoints= 12;
var minRad= 100;
var maxRad= 200;
            
function drawPath() {

    //Sets random values considering defined limits
    var deltaRad = maxRad - minRad;
    var deltaPoints = maxPoints - minPoints;
    var rad = minRad + Math.random() * deltaRad;
    var points = minPoints + Math.floor(Math.random() * deltaPoints);
    
    //Creates path using setPoints() function
    var path = setPoints(view.size / 2, rad, points);
    
    //Random RGB channels values
    var r= Math.random();
    var g= Math.random();
    var b= Math.random();
    
    //Fill path with random values.
    path.fillColor = new Color(r,g,b);
}
            
function setPoints(center, maxRad, points) {
    
    //Creates a Point object to be used by drawPath() function
    var path= new Path();
    path.closed= true;
    for (var i= 0; i< points; i++) {
        var delta= new Point({
            length: (maxRad * 0.5) + (Math.random() * maxRad * 0.5),
            angle: (360 / points) * i
        });
    path.add(center + delta);
    
    //Creates some hidden text nodes to be trated by saveFile() fuction    
    var par2= document.createElement("P");
    var plain_txt= document.createTextNode(delta);
    par2.appendChild(plain_txt);
    document.getElementById("txtPoints").appendChild(par2);
    }
    
    return path;
}

function saveFile(){
    
    //Getting values
    var text = document.getElementById("txtPoints").textContent;
    var filename = document.getElementById("textFilename").value;
    
    /***** Formatting text for offsetAndScale() function *****/
    //Deleting unwanted characters
    text= text.replace(/{|:|x|y/g,"");
    //Adding commas between points
    text= text.replace(/}/g,",");
    //Deleting whitespaces
    text= text.replace(/\s/g,"");
    //Changing commas by spaces
    text= text.replace(/,/g," ");
    //Deleting first and last space
    text= text.trim();
    //Coverting text into an Array of points
    var pointsArray= text.split(" ");
    
    /***** Treating the Array *****/
    //Rounding to 2 decimals
    for(i=0; i< pointsArray.length; i++){
        pointsArray[i]= parseFloat(pointsArray[i]);
        pointsArray[i]= pointsArray[i].toFixed(2);
        pointsArray[i]= parseFloat(pointsArray[i]);
    }
    //Recalculating points positions
    pointsArray= offsetAndScale(pointsArray);
    
    //Rebuilding text node content for the printer.
    text= "G28\r\nG1 X" + pointsArray[0] +" Y" + pointsArray[1] + " Z0 F3000\r\n";
    for(i=2; i< pointsArray.length; i= i+2){
        text= text + "G1 X" + pointsArray[i] +" Y"+ pointsArray[i+1] + "\r\n";
    }
    text= text + "G28\r\nM84\r\n";
    //Creating text node
    var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
    //Saving file
    saveAs(blob, filename+".gcode");
} 



drawPath();
            