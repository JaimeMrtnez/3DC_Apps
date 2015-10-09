function saveFile(){
    //Getting values
    var text = document.getElementById("textBox").value;
    var filename = document.getElementById("textFilename").value;
    //Creating text node
    var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
    //Saving file
    saveAs(blob, filename+".gcode");
}