/*** Generates a random shape and its corresponding 3D printer g-code
**** Jaime Martínez for 3DigitalCooks.com 
**** Open Source Tool ***/

//Shape limits options:
var minPoints= 3;
var maxPoints= 12;
var minRad= 200;
var maxRad= 300;

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
        coords[i]= coords[i].toFixed(2);
    }
    return coords;
}

         
function drawPath() {

    //Sets random values considering defined limits
    var deltaRad = maxRad - minRad;
    var deltaPoints = maxPoints - minPoints;
    var rad = minRad + Math.random() * deltaRad;
    var points = minPoints + Math.floor(Math.random() * deltaPoints);
    
    //Creates path using setPoints() function
    var path = setPoints(view.size, rad, points);
    
    //Random RGB channels values
    var r= Math.random();
    var g= Math.random();
    var b= Math.random();
    
    //Sets path with RGB random values.
    path.strokeWidth = 6;
    path.strokeColor = new Color(r,g,b);
}
            
function setPoints(center, maxRad, points) {
    
    //Creates a Path object to be used by drawPath() function
    var path= new Path();
    path.closed= true;
    for (var i= 0; i< points; i++) {
        var delta= new Point({
            length: (maxRad * 0.5) + (Math.random() * maxRad * 0.5),
            angle: (360 / points) * i
        });
    path.add(center/2 + delta);
    
    //Creates some hidden text nodes to be trated by saveFile() fuction    
    var par2= document.createElement("P");
    var plain_txt= document.createTextNode(delta);
    par2.appendChild(plain_txt);
    document.getElementById("txtPoints").appendChild(par2);
    }
    
    return path;
}

//Needs revision, it doesn't work correctly in some cases :(
function roundFloat(floatNum){
    floatNum= floatNum.toFixed(4);
    floatNum= parseFloat(floatNum);
}


function getAndProcessText(){
    
    //Getting text node
    var text = document.getElementById("txtPoints").textContent;
    
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
    
    //Rounding to 4 decimals
    for (i= 0; i< pointsArray.length; i++){
        pointsArray[i]= parseFloat(pointsArray[i]);
        pointsArray[i]= pointsArray[i].toFixed(4);
        pointsArray[i]= parseFloat(pointsArray[i]);
    }
    
    //Recalculating points positions
    pointsArray= offsetAndScale(pointsArray);
    
    //Calculating distances between points
    var distance= [];
    for (i= 0, j= 0; i< pointsArray.length; i= i+2, j++){
        distance[j]= Math.sqrt(Math.pow((pointsArray[i+2]-pointsArray[i]), 2) + 
                     Math.pow((pointsArray[i+3]-pointsArray[i+1]), 2));
    }
    //Deleting last segment NaN value
    distance.splice(distance.length-1, 1);
    
    //Calculating last segment distance
    var closingDistance= Math.sqrt(Math.pow((pointsArray[pointsArray.length-2]-pointsArray[0]),2) + 
                                   Math.pow((pointsArray[pointsArray.length-1]-pointsArray[1]),2));

    //Adding segment to the array
    distance.push(closingDistance);
   
    /***** Calculating printing values *****/
    
    //Getting user values
    var nozzle_d= parseFloat(document.getElementById("nozzle_d").value);
    var material_d= parseFloat(document.getElementById("material_d").value);
    var feedrate= document.getElementById("feedrate").value;
    var b_pressure= parseFloat(document.getElementById("b_pressure").value);
    var r_pressure= parseFloat(document.getElementById("r_pressure").value);
    
    //Getting layers settings
    var layers= parseInt(document.getElementById("layers").value);
    var layer_h= parseFloat(document.getElementById("layer_h").value);
    var i_layer_h= parseFloat(document.getElementById("i_layer_h").value);
    
    //Calculating total height
    var total_height= i_layer_h + ((layers-1) * layer_h);
    
    //Calculating nozzle-material surface ratio
    var nozzle_s= Math.PI * Math.pow((nozzle_d/2), 2);
    var material_s= Math.PI * Math.pow((material_d/2), 2);
    var m_s_ratio= nozzle_s / material_s;
    
    //Calculating extrusion values of each segment
    var extrusion= [];
    for (i= 0; i< distance.length; i++){
        extrusion[i]= m_s_ratio * distance[i];
            
            //Rounding values
            extrusion[i]= extrusion[i].toFixed(4);
            extrusion[i]= parseFloat(extrusion[i]);
    }
    
    //Storing total extrusion of each layer
    var total_layer_extrusion= 0;
    for (i=0; i< extrusion.length; i++){
        total_layer_extrusion= total_layer_extrusion+ extrusion[i];     
    }
    
        //Rounding values
        total_layer_extrusion= total_layer_extrusion.toFixed(4);
        total_layer_extrusion= parseFloat(total_layer_extrusion);
    
    console.log(extrusion);
    console.log(total_layer_extrusion);
    
    //Calculating accumulated extrusion values of one layer
    var ac_extrusion= [];
    ac_extrusion[0]= extrusion[0];
    for (i= 1; i< extrusion.length; i++){
        ac_extrusion[i]= ac_extrusion[i-1] + extrusion[i];
        
            //Rounding values
            ac_extrusion[i]= ac_extrusion[i].toFixed(4);
            ac_extrusion[i]= parseFloat(ac_extrusion[i]);
    }
    
    
    /*** Rebuilding text node content for the printer ***/
    
    //Initial instructions block
    text= "G28\r\nG92 E0\r\nG1 X" + pointsArray[0] +" Y" + pointsArray[1] + 
        " Z"+ i_layer_h +" F" + feedrate + "\r\nG1 E" + b_pressure + " F200\r\nG92 E0\r\nG1 F" 
        + feedrate + "\r\n";
    
    
    //Calculating accumulated layer height values
    var ac_layer_h;
    ac_layer_h= i_layer_h + layer_h;
    
    /***** Layers loop *****/
    
    for (k= 0; k< layers; k++){
        
        //Movements and extrusions
        for(i= 2, j= 0; i< pointsArray.length; i= i+2, j++){
            text= text + "G1 X" + pointsArray[i] +" Y"+ pointsArray[i+1] + 
                  " E" +ac_extrusion[j]+"\r\n";
        }
        
        //Adding last segment
        var l_s_extrusion= ac_extrusion[ac_extrusion.length-1];
        text= text + "G1 X" + pointsArray[0] +" Y" +pointsArray[1] + 
              " E" + l_s_extrusion + "\r\n";
        
        //Increasing Z axis (if necessary)
        if (ac_layer_h<= total_height){
            text= text + "G1 Z"+ (ac_layer_h) +"\r\n";
        }
        ac_layer_h= ac_layer_h + layer_h;
        
        //Recalculating extrusion values for the next layer
        for (x= 1; x< ac_extrusion.length; x++){
            
            //Setting first segment extrusion
            ac_extrusion[0]= l_s_extrusion + extrusion[0];
            
                //Rounding values
                ac_extrusion[0]= ac_extrusion[0].toFixed(4);
                ac_extrusion[0]= parseFloat(ac_extrusion[0]);
            
            //Calculating remaining values
            ac_extrusion[x]= ac_extrusion[x-1] + extrusion[x];
            
                //Rounding values
                ac_extrusion[x]= ac_extrusion[x].toFixed(4);
                ac_extrusion[x]= parseFloat(ac_extrusion[x]);
            
            //Resetting last extrusion
            l_s_extrusion= ac_extrusion[ac_extrusion.length-1];
            
                //Rounding values
                l_s_extrusion= l_s_extrusion.toFixed(4);
                l_s_extrusion= parseFloat(l_s_extrusion);
            }
        console.log(ac_extrusion);
    }
    
    
    /*** Calculating release pressure ***/
    l_s_extrusion= ac_extrusion[ac_extrusion.length-1]-total_layer_extrusion;
    r_pressure= l_s_extrusion - r_pressure;
    r_pressure= r_pressure.toFixed(4);
    
    //Final instructions block
    text= text + "G1 E" + r_pressure + " F200\r\n\G1 F" + feedrate+ "\r\nG28\r\nM84\r\n";
    
    return text;
}

function saveFile(){
    
    var text= getAndProcessText();
    var filename = document.getElementById("textFilename").value;
    //Creating text node
    var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
    //Saving file
    saveAs(blob, filename+".gcode");
}

/*** Function calls ***/

//Building Shape
drawPath();

//Processing text node to display it by screen (styleless, just for developement purposes)
/*var formatted_text= getAndProcessText();
formatted_text= formatted_text.replace(/G/g,"<br>G");
formatted_text= formatted_text.replace(/M/g,"<br>M");
formatted_text= formatted_text.replace(/<br>/,"");
document.getElementById("gcode").innerHTML= formatted_text;*/
