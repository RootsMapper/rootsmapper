/* 
  RootsMapper
  https://github.com/dawithers/rootsmapper
  Copyright (c) 2013 Mitch Withers, Drew Withers
  Released under the MIT licence: http://opensource.org/licenses/mit-license
*/

var tooltip = new function(){
	this.set = function(options) {
		if (options.id != undefined) {
			document.getElementById(options.id).onmouseover = function(event) {
				constructor(event,options);
			}
		}
	}

	function constructor(event,options) {
		// Get event element
		var e = event.toElement || event.relatedTarget;

		// Tooltip duration
	    options.duration || (options.duration = 3000);

	    // Mouse resting time to trigger tooltip
	    options.hoverTime || (options.hoverTime = 1000);

	    // Tooltip offset in x-direction
	    options.offsetX || (options.offsetX = 10);

	    // Tooltip offset in y-direction
	    options.offsetY || (options.offsetY = 10);

	    // Elements within this distance to the right of the screen will have the tooltip's right edge appear to the left of the mouse
	    options.xBuffer || (options.xBuffer = 315);

	    // Elements within this distance to the top of the screen will have the tooltip's top edge appear below the mouse
	    options.yBuffer || (options.yBuffer = 50);

	    // Make tooltip appear when mouse stops
	    e.onmousemove = function(event) {
	    	onMouseStop(event,options);
	    }

	    // Clear all events and remove tooltip when mouse leaves
	    e.onmouseout = function() {
	    	clearTimeout(onMouseStop.thread);

	    	if (document.getElementById('tt')) {
	        	var m = document.getElementById('tt');
	        	document.body.removeChild(m);
	    	}

	    	e.onmousemove = null;
	    	e.onmouseout = null;
	    }

	}

	function onMouseStop(event,options) {
		var e = event.toElement || event.relatedTarget;

		clearTimeout(onMouseStop.thread);

		// Remove any lingering tooltips
		if (document.getElementById('tt')) {
	    	var m = document.getElementById('tt');
	    	document.body.removeChild(m);
		}

		// Set up event when mouse stops
		var event = event ? event : window.event, x=event.clientX, y=event.clientY,
		mouseStopEvent = function() {
			// Get window size
			var page = pageDimensions();

			// Create HTML element
			tt = document.createElement('div');
	        tt.setAttribute('id', 'tt');
	        tt.innerHTML = options.tip;

	        // Position tooltip horizontally
	        if (x < page.width - options.xBuffer) {
	        	tt.style.left = x + options.offsetX + 'px';
	        } else {
	        	tt.style.right = page.width - x + options.offsetX + 'px';
	        }

	        // Position tooltip vertically
	        if (y < options.yBuffer) {
	        	tt.style.top = y + options.offsetY + 'px';
	        } else {
	        	tt.style.bottom = page.height - y + options.offsetY + 'px';
	        }

	        // Show tooltip
	        document.body.appendChild(tt);

	        // Prevent further mouse events
	        e.onmousemove = null;

	        // Set tooltip duration
	        var timer = setTimeout(function () {
	            if (document.getElementById('tt')) {
	                var m = document.getElementById('tt');
	                document.body.removeChild(m);
	            }
	        }, options.duration);

		};

		onMouseStop.thread=setTimeout(mouseStopEvent, options.hoverTime);
	}

	function pageDimensions() {

		// Gives the dimensions of the viewable area of the window
		var w = window,
	    	d = document,
	    	e = d.documentElement,
	    	g = d.getElementsByTagName('body')[0],
	    	x = w.innerWidth || e.clientWidth || g.clientWidth,
	    	y = w.innerHeight|| e.clientHeight|| g.clientHeight;

	    return {
	    	width: x,
	    	height: y
	    	};
	}

}();

