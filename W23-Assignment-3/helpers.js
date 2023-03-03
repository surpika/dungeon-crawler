

var playSound = function (path) {
    var audio = new Audio(path);
    audio.loop = false;
    audio.play(); 
}

export default playSound