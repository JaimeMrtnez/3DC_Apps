//Shape limits options:
var minPoints= 3;
var maxPoints= 10;
var minRad= window.innerWidth / 10;
var maxRad= window.innerWidth / 4;
            
function drawPath() {
//Sets random values considering defined limits
    var deltaRad = maxRad - minRad;
    var deltaPoints = maxPoints - minPoints;
    var rad = minRad + Math.random() * deltaRad;
    var points = minPoints + Math.floor(Math.random() * deltaPoints);
    //Creates path using auxilliar function below
    var path = setPoints(view.size / 2, rad, points);
    //Color options
    path.fillColor = 'lightgrey';
    path.strokeColor = 'black';
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
    //Shows in javascript console x&y coords and vector angle
    console.log(delta);
    path.add(center + delta);
    }
    var draw= Math.random();
    if (draw<0.5){path.smooth();}
    return path;
}
drawPath();
            