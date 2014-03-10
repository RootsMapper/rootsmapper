
var panelSlide = true;

function panelIn(){
	var panel = document.getElementById("sidePanel");

    var step = 0;
    var numSteps = 50; //Change this to set animation resolution
    var timePerStep = 1; //Change this to alter animation speed
    var interval = setInterval(function () {
		if (step > numSteps) {
            clearInterval(interval);
			panel.style.left = "-400px";
			panel.style.display = "none";
            document.getElementById("panelToggle2").style.display = "block";
            panelSlide = false;
		} else {
			var num = -8 * step;
            panel.style.left = num.toString() + "px";
            step++;
		}
    }, timePerStep);
}

function panelOut() {
	var panel = document.getElementById("sidePanel");
	panel.style.display = "block";
    var step = 0;
    var numSteps = 50; //Change this to set animation resolution
    var timePerStep = 1; //Change this to alter animation speed
    var interval = setInterval(function () {
		if (step > numSteps) {
            clearInterval(interval);
			panel.style.left = "0px";
            ib.close();
		} else {
			var num = -400 + 8 * step;
            panel.style.left = num.toString() + "px";
            step++;
		}
    }, timePerStep);
            document.getElementById("panelToggle2").style.display = "none";
            panelSlide = true;
}