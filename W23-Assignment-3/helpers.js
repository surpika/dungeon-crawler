

var playSound = function (path, loop) {
    var audio = new Audio(path);
    audio.loop = loop;
    audio.play(); 
}

export default playSound