//Shape limits options:
var minPoints= 3;
var maxPoints= 12;
var minRad= document.getElementById("myCanvas").width/10;
var maxRad= document.getElementById("myCanvas").width/5;
            
function drawPath() {
//Sets random values considering defined limits
    var deltaRad = maxRad - minRad;
    var deltaPoints = maxPoints - minPoints;
    var rad = minRad + Math.random() * deltaRad;
    var points = minPoints + Math.floor(Math.random() * deltaPoints);
    //Creates path using auxilliar function below
    var path = setPoints(view.size / 2, rad, points);
    //Random RGB channels values
    var r= Math.random();
    var g= Math.random();
    var b= Math.random();
    //Fill path with random values.
    path.fillColor = new Color(r,g,b);
}
            
//Creates random points considering defined limits
function setPoints(center, maxRad, points) {
    var path= new Path();
    path.closed= true;
    for (var i= 0; i< points; i++) {
        var delta= new Point({
            length: (maxRad * 0.5) + (Math.random() * maxRad * 0.5),
            angle: (360 / points) * i
        });
    path.add(center + delta);
    
    //Shows in javascript console x&y coords and vector angle
    console.log(delta);
    
    //Create a paragraph for each position of points
    var par1= document.createElement("P");
    var txt= document.createTextNode("Point "+(i+1)+":"+delta);
    par1.appendChild(txt);
    document.getElementById("points").appendChild(par1);
    
       
    }
    //Randomly raffles if path is smoothed. Uncomment for random shape smoothing.
    var draw= Math.random();
    if (draw<0.5){path.smooth();}
    return path;
    
}
drawPath();
            