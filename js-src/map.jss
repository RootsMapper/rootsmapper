/*
  RootsMapper
  https://github.com/dawithers/rootsmapper
  Copyright (c) 2013 Mitch Withers, Drew Withers
  Released under the MIT licence: http://opensource.org/licenses/mit-license
*/

var map;
var oms;
var layer;
var accesstoken;
var ib;
var ib2;
var genquery;
var delay;
var baseurl;
var version;
var userID;
var userName;
var familyTree;
var discovery;
var grouping;
var tooManyGens;
var title;
var cur_title;
var cur_root;
var cur_gens;
var cur_selected;
var cur_expand;
var get_root;
var get_gens;
var get_selected;
var get_expand;
var fixColors;
var optionvar = false;
var isolate = false;
var onlyPins = false;
var showLayers = true;
var pinsVisible = true;
var treeVar = false;
var statVar = false;
var highlights = true;
var headerBoxVisible = true;

function initialize() {



 	// Load the map (whether user is logged in or not)
 	startGoogleMaps();

	// Set up page elements
	pageSetup();

 	// If user is logged in
    if (accesstoken) {

		setupMenu();

    	// Get discovery resource
        discoveryResource(function () {

        	// Load user information
            currentUser(function () {

        		cur_selected = get_selected;
                cur_expand = get_expand;
                    	// Run with gens from URL parameters
        		if (get_gens == "") {
        			rootsMapper();
        		} else {
                    var options = {
                        generations: get_gens
                    }

                    if (cur_expand) {
                        options.expand = cur_expand.split(';');
                        rootsMapperURL(options);
                    } else {
                        rootsMapper(options);
                    }
                }
            });

        });

    }

}

function unselectItem(strName,spanName) {
	var div = document.getElementById(strName);
	var span = document.getElementById(spanName);
	if (div) {
		div.setAttribute('class','menuButton unselectable');
		div.style.overflow = 'hidden';
	}

	if (span) {
		span.setAttribute('class','menuButtonSpan');
	}

	if (strName == 'countryStatistics') {
		div.style.height = '55px';
	}

}

function setupMenu() {
	var rm = document.getElementById('rootsMapper');
	var vo = document.getElementById('viewOptions');
	var pc = document.getElementById('pedigreeChart');
	var cs = document.getElementById('countryStatistics');
	var ui = document.getElementById('userInfo');

	var rms = document.getElementById('rootsMapperSpan');
	var vos = document.getElementById('viewOptionsSpan');
	var pcs = document.getElementById('pedigreeChartSpan');
	var css = document.getElementById('countryStatisticsSpan');
	var uis = document.getElementById('username');

	rms.onclick = function () {
		if (rm.getAttribute('class').indexOf('selected') !== -1) {
			// currently selected, unselect
			unselectItem('rootsMapper','rootsMapperSpan');
			rm.style.overflow = 'hidden';
		} else {
			// unselected, select it
			rm.setAttribute('class','menuButton selected unselectable');
			rms.setAttribute('class','menuButtonSpan lighted');
			unselectItem('viewOptions','viewOptionsSpan');
			unselectItem('pedigreeChart','pedigreeChartSpan');
			unselectItem('countryStatistics','countryStatisticsSpan');
            unselectItem('userInfo','username');

			setTimeout(function(){
				rm.style.overflow = 'visible';
			},250);
		}
	}

	vos.onclick = function () {
		if (vo.getAttribute('class').indexOf('selected') !== -1) {
			// currently selected, unselect
			unselectItem('viewOptions','viewOptionsSpan');
		} else {
			// unselected, select it
			vo.setAttribute('class','menuButton selected unselectable');
			vos.setAttribute('class','menuButtonSpan lighted');
			unselectItem('rootsMapper','rootsMapperSpan');
			unselectItem('pedigreeChart','pedigreeChartSpan');
			unselectItem('countryStatistics','countryStatisticsSpan');
            unselectItem('userInfo','username');

            setTimeout(function(){
                vo.style.overflow = 'visible';
            },250);
		}

	}

	pcs.onclick = function () {
		if (pc.getAttribute('class').indexOf('selected') !== -1) {
			// currently selected, unselect
			unselectItem('pedigreeChart','pedigreeChartSpan');

		} else {
			// unselected, select it
			pc.setAttribute('class','menuButton selected unselectable');
			pcs.setAttribute('class','menuButtonSpan lighted');
			unselectItem('rootsMapper','rootsMapperSpan');
			unselectItem('viewOptions','viewOptionsSpan');
			unselectItem('countryStatistics','countryStatisticsSpan');
            unselectItem('userInfo','username');
		}
	}

	css.onclick = function () {
		if (css.getAttribute('class').indexOf('lighted') !== -1) {
			// currently selected, unselect
			unselectItem('countryStatistics','countryStatisticsSpan');
		} else {
			// unselected, select it
			css.setAttribute('class','menuButtonSpan lighted');
			unselectItem('rootsMapper','rootsMapperSpan');
			unselectItem('viewOptions','viewOptionsSpan');
			unselectItem('pedigreeChart','pedigreeChartSpan');
            unselectItem('userInfo','username');

			var un = document.getElementById('countryStats').getBoundingClientRect();
			var rd = document.getElementById('logoutbutton');

			cs.style.height = document.getElementById('countryStats').clientHeight + 115 + 'px';
			document.getElementById('countryDiv').style.height = document.getElementById('countryStats').clientHeight + 25 + 'px';

			setTimeout(function(){
				cs.style.overflow = 'visible';
			},250);
		}
	}

	uis.onclick = function(e) {
        if (uis.getAttribute('class').indexOf('lighted') !== -1) {
            // currently selected, unselect
            unselectItem('userInfo','username');
        } else {
            // unselected, select it
            ui.setAttribute('class','menuButton selected unselectable');
            uis.setAttribute('class','menuButtonSpan lighted');
            unselectItem('rootsMapper','rootsMapperSpan');
            unselectItem('viewOptions','viewOptionsSpan');
            unselectItem('pedigreeChart','pedigreeChartSpan');
            unselectItem('countryStatistics','countryStatisticsSpan');
        }
	}
}

function toggleHeaderBox() {
    var div = document.getElementById('headerbox');
    var bt = document.getElementById('toggleHeaderBox');
    var img = document.getElementById('triangleNarrow');
    if (headerBoxVisible) {
        // hide it
        bt.style.backgroundColor = 'rgba(0,0,255,0.8)';

        var before = new Date();
        var step = 0;
        var numSteps = 100; //Change this to set animation resolution
        var timePerStep = 3; //Change this to alter animation speed
        var interval = setInterval(function () {
            var now = new Date();
            var elapsedTime = (now.getTime() - before.getTime())
            if (elapsedTime > timePerStep * numSteps) {
                clearInterval(interval);
                div.style.left = '-500px';
                div.style.top = '-1000px';
                headerBoxVisible = false;
                img.src = "images/triangle-down.png";
                img.style.paddingRight = '0px';
                img.style.position = 'relative';
                img.style.top = '5px';
                img.style.left = '5px';
            } else {
                step = elapsedTime / (timePerStep * numSteps);
                div.style.top = Math.round(-500 * step,0) + 'px';
                div.style.left = Math.round(-200 * step,0) + 'px';
            }
        }, timePerStep);
    } else {
        // show it

        var before = new Date();
        var step = 0;
        var numSteps = 100; //Change this to set animation resolution
        var timePerStep = 3; //Change this to alter animation speed
        var interval = setInterval(function () {
            var now = new Date();
            var elapsedTime = (now.getTime() - before.getTime())
            if (elapsedTime > timePerStep * numSteps) {
                clearInterval(interval);
                div.style.top = '0px';
                div.style.left = '0px';
                bt.style.backgroundColor = '';
                headerBoxVisible = true;
                img.src = "images/triangle-up.png";
                img.style.position = '';
                img.style.top = '';
                img.style.left = '';
            } else {
                step = elapsedTime / (timePerStep * numSteps);
                div.style.top = Math.round(-500 * (1-step),0) + 'px';
                div.style.left = Math.round(-200 * (1-step),0) + 'px';
            }
        }, timePerStep);
    }
}

function startGoogleMaps() {

	// Google Maps constructor options
	var style_array = [
    {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "geometry",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "landscape",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#ffffdd"
            }
        ]
    },
    {
        "featureType": "water",
        "stylers": [
            {
                "lightness": -10
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "labels",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "transit",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "administrative",
        "elementType": "geometry",
        "stylers": [
            {
                "lightness": 40
            }
        ]
    }
];
    var lat = 30.0;
    var lng = -30.0;
    var place = new google.maps.LatLng(lat, lng);
    var mapOptions = {
        zoom: 3,
        center: place,
        streetViewControl: false,
        panControl: false,
        zoomControl: false,
        mapTypeControl: true,
		mapTypeControlOptions: {
  			position: google.maps.ControlPosition.TOP_RIGHT
		},
		styles: style_array
    }

    // Construct map
    var mapDisplay = document.getElementById('mapDisplay');
    map = new google.maps.Map(mapDisplay, mapOptions);

    // Set up custom zoom buttons
    var zmi = document.getElementById("zoomIn");
    var zmo = document.getElementById("zoomOut");

	google.maps.event.addDomListener(zmi, 'click', function() {
		var z = map.getZoom();
		map.setZoom(z+1);
	});

	google.maps.event.addDomListener(zmo, 'click', function() {
		var z = map.getZoom();
		map.setZoom(z-1)
	});

	// Close infoBox when user clicks anywhere on the map
	google.maps.event.addListener(map, 'click', function () {
		ib.close();
		expandList({listName:"runList",noExpanding:true});
		expandList({listName:"countryList",noExpanding:true});
	});

}

function pageSetup() {

	// Create tooltips for buttons
	tooltip.set({id: "copyUserId", tip: "Click to set user as root person"});
	tooltip.set({id: "countryButton", tip: "Choose a generation to get totals from this map"});
	tooltip.set({id: "populateUser", tip: "Set yourself as the root person"});
	tooltip.set({id: "runButton", tip: "Begin the plotting process"});
	tooltip.set({id: "feedbackbutton", tip: "Leave some comments about your experience"});
	tooltip.set({id: "faqbutton", tip: "Frequently asked questions"});
	tooltip.set({id: "donatebutton", tip: "Help keep this site up and running"});
	tooltip.set({id: "youtubebutton", tip: "Watch RootsMapper videos on YouTube"});
	tooltip.set({id: "twitterbutton", tip: "Follow @RootsMapper on Twitter"});
	tooltip.set({id: "bloggerbutton", tip: "Go to RootsMapper Blog"});
	tooltip.set({id: "showlines", tip: "Hide connecting lines"});
	tooltip.set({id: "showpins", tip: "Hide pins"});
	tooltip.set({id: "highlight", tip: "Toggle trace back to root person"});
	tooltip.set({id: "isolate", tip: "Show only selected ancestral line"});
	tooltip.set({id: "zoomIn", tip: "Zoom in"});
	tooltip.set({id: "zoomOut", tip: "Zoom out"});

    // Construct spiderfier for overlapping markers
	oms = new OverlappingMarkerSpiderfier(map, { keepSpiderfied: true, nearbyDistance: 35 });


}

function discoveryResource(callback) {
	// Start loading animation to blank the page when first logged in
	loadingAnimationStart();

    fsAPI({ url: baseurl + '/.well-known/app-meta' }, function (result, status) {
        if (status == "OK") {
			// Object "discovery" holds all the available API options
            discovery = result.links;
            typeof callback === 'function' && callback();
        }
    });
}

function currentUser(callback) {
	// Restart loading animation because something in discoveryResource() breaks it
	loadingAnimationStart();
    document.getElementById('loadingMessage').textContent = 'Retrieving user data from FamilySearch...';

    // No template for "current-user-person", so build it manually
    var options = {
        media: 'xml',
        url: discovery["current-user-person"].href + '?&access_token=' + accesstoken
    }

    fsAPI(options, function (result, status) {
        if (status == "OK") {
        	// Some browsers return "gx:person" while others return "person"
            var p = $(result).find("gx\\:person, person");
            var f = $(result).find("gx\\:fullText, fullText");

            // Get user ID and display name
            userID = p[0].getAttribute("id");
            userName = f[0].textContent;

            // Display username in appropriate field
            document.getElementById("username").innerHTML = userName;

            // Set user as root person by default unless URL root parameter is set
            if (get_root == "") {
                populateIdField(userID,userName);
            } else
            {
                populateIdField(get_root);
		checkID();
            }
            typeof callback === 'function' && callback();
        }
    });

}

function expandDelete(optionsExpand) {
    if (optionsExpand.length > 0) {
        var expand = optionsExpand[0].split(',');
        if (expand[2] === "d") {
            var gen = parseInt(expand[0])
            var node = parseInt(expand[1]);

            familyTree.getNode(gen, node).marker.setVisible(false);
            familyTree.getNode(gen, node).polyline.setVisible(false);
            familyTree.getChild(gen, node).marker.isExpanded = false;
            familyTree.getNode(gen, node).isPlotted = false;
            familyTree.setNode(undefined, gen, node);

            countryLoop();

            optionsExpand.shift();
            return expandDelete(optionsExpand);
        } else {
            return optionsExpand;
        }
    } else {
        return optionsExpand;
    }
}

function rootsMapperURL(options) {

    if (options.expand.length > 0) {
        options.callback = function () {
            // run expansion
            // check for deletions
            options.expand = expandDelete(options.expand);
            if (options.expand.length > 0) {
                var expand = options.expand[0].split(',');
                var gen = parseInt(expand[0]);
                var node = parseInt(expand[1]);
                options.expand.shift();

                var p = familyTree.getNode(gen,node);
                p.marker.isExpanded = true;

                var newOptions = {
                    rootGen: gen,
                    rootNode: node,
                    expand: options.expand,
                    rootComplete: true,
                    pid: p.id
                }

                if (expand[2] == "m") {
                    newOptions.father = true;
                    newOptions.generations = 1;
                } else if (expand[2] == "f") {
                    newOptions.mother = true;
                    newOptions.generations = 1;
                } else {
                    newOptions.generations = parseInt(expand[2]);
                }

                rootsMapperURL(newOptions);
            } else {
                infoBoxClick(familyTree.getNode(parseInt(cur_selected.split(",")[0]), parseInt(cur_selected.split(",")[1])).marker);
                firstTime.box = false;
            }

        }
    }

    rootsMapper(options);

}

function rootsMapper(options) {
	options || (options = {});

	// If no id is supplied, get from input box
	options.pid || (options.pid = document.getElementById('personid').value);

	// Default to 3 generations
	options.generations || (options.generations = 3);
	if(!cur_selected) {
		cur_selected = "0,0";
	}
    if (options.generations > 8) {
		// Map as few generations as possible, then expand by 8 gens on each member of the last generation plotted at the start
    	options.tooManyGens = true;
    	options.genQuery = options.generations;
    	options.generations = options.generations - 8;
    }

	// If we're expanding someone in the tree, give their generation and node
	options.rootGen || (options.rootGen = 0);
    options.rootNode || (options.rootNode = 0);
    expand_gens = options.genQuery || options.generations;

    if (options.rootGen == 0 && options.rootNode == 0) {
        if (!options.mother && !options.father) {
            // Not expanding, so reset map
            cur_root = options.pid;
            cur_gens = options.genQuery || options.generations;
            if (!options.expand) {
                cur_expand = '';
            }
            window.history.replaceState("none","", "?root=" + cur_root + "&gens=" + cur_gens + "&selected=" + cur_selected + "&expand=" + cur_expand);
            clearOverlays();
        } else {
            if (cur_expand == '') {
                if (options.mother) {
                    cur_expand = options.rootGen + "," + options.rootNode + ",f";
                } else if (options.father) {
                    cur_expand = options.rootGen + "," + options.rootNode + ",m";
                } else {
                    cur_expand = options.rootGen + "," + options.rootNode + "," + expand_gens;
                }

            } else {
                if (!options.expand) {
                    if (options.mother) {
                        cur_expand = cur_expand + ";" + options.rootGen + "," + options.rootNode + ",f";
                    } else if (options.father) {
                        cur_expand = cur_expand + ";" + options.rootGen + "," + options.rootNode + ",m";
                    } else {
                        cur_expand = cur_expand + ";" + options.rootGen + "," + options.rootNode + "," + expand_gens;
                    }
                }
            }
            window.history.replaceState("none","", "?root=" + cur_root + "&gens=" + cur_gens + "&selected=" + cur_selected + "&expand=" + cur_expand);
        }
    } else {
        if (cur_expand == '') {
            if (options.mother) {
                cur_expand = options.rootGen + "," + options.rootNode + ",f";
            } else if (options.father) {
                cur_expand = options.rootGen + "," + options.rootNode + ",m";
            } else {
                cur_expand = options.rootGen + "," + options.rootNode + "," + expand_gens;
            }

        } else {
            if (!options.expand) {
                if (options.mother) {
                    cur_expand = cur_expand + ";" + options.rootGen + "," + options.rootNode + ",f";
                } else if (options.father) {
                    cur_expand = cur_expand + ";" + options.rootGen + "," + options.rootNode + ",m";
                } else {
                    cur_expand = cur_expand + ";" + options.rootGen + "," + options.rootNode + "," + expand_gens;
                }
            }
        }
        window.history.replaceState("none","", "?root=" + cur_root + "&gens=" + cur_gens + "&selected=" + cur_selected + "&expand=" + cur_expand);
    }

    // Start loading animation
    loadingAnimationStart();
    delay = 1;

    mainRoutine(options, function () {
    	if (options.tooManyGens == true) {

    		mapEightMore(options, function() {

    			loadingAnimationEnd();

	            if (firstTime.box == true) {
        			if (cur_selected) {
                        if (options.expand) {
                            if (options.expand.length == 0) {
                                infoBoxClick(familyTree.getNode(parseInt(cur_selected.split(",")[0]), parseInt(cur_selected.split(",")[1])).marker);
                                firstTime.box = false;
                            }
                        } else {
                            infoBoxClick(familyTree.getNode(parseInt(cur_selected.split(",")[0]), parseInt(cur_selected.split(",")[1])).marker);
                            firstTime.box = false;
                        }
                    } else {
        				infoBoxClick(familyTree.root().marker);
                        firstTime.box = false;
                    }
	            }

	            finish(options);

        		});

    	} else {
    		finish(options);
    	}
    });
}

function mainRoutine(options, callback) {

    // Update loading message
    document.getElementById('loadingMessage').textContent = 'Retrieving FamilySearch ancestry data...';

    // Get FamilySearch pedigree
    getPedigree(options, function () {

        // Geocode birth locations
        placeReadLoop(function () {

            // Update loading message
            document.getElementById('loadingMessage').textContent = 'Plotting...';

            // Plot birth locations
            plotterLoop(function () {

	            // Check for completion
	            completionEvents(options, function () {

                    typeof callback === 'function' && callback();

			    });
			});
        });
    });
}

function mapEightMore(options,callback) {

	// When finished mapping minimum set, loop through last generation and expand each by 8 generations
    familyTree.IDDFS(function (leaf, cont) {

    	// Ignore generations less than the last one
        if (leaf.generation < options.genQuery - 8) {
            cont();

        // Expand these ones
        } else if (leaf.generation == options.genQuery - 8) {
        	var opt = {
        		pid: leaf.value.id,
        		rootGen: leaf.generation,
        		rootNode: leaf.node,
        		generations: 8,
        		tooManyGens: true
        	};

            mainRoutine(opt, function () {
                cont();
            });

        // Since these generations are now populated (and there are TONS of people), stop the loop
        } else {
            typeof callback === 'function' && callback();
        }

	});

}

function getPedigree(options, callback) {
	// Generate API query URL
    var url = urltemplate.parse(discovery['ancestry-query'].template).expand({
        generations: options.generations,
        person: options.pid,
        access_token: accesstoken,
		personDetails: true
    });

	fsAPI({ url: url }, function (result, status) {
		if (status == "OK") {
		    var p = result.persons;
			for (var i = 0; i < p.length; i++) {
			    var n = parseFloat(p[i].display.ascendancyNumber);
				var gen = Math.floor(log2(n));
				var node = n + Math.pow(2, gen) * (options.rootNode - 1);
                p[i].generation = gen+ options.rootGen;
                p[i].node = node;
				if (node < Math.pow(2, gen+ options.rootGen -1)) {
                    p[i].isPaternal = true;
				}
				if (p[i].living == true) {
					p[i].display.deathDate = "Living";
				}
				if (!familyTree.getNode(gen + options.rootGen, node)) {
                    if (options.father == true) {
                        if (n == 0 || isEven(n)) {
                            familyTree.setNode(p[i], (gen +  options.rootGen), node);
                            delete familyTree.getNode(gen + options.rootGen, node).display.ascendancyNumber;
                        }
                    } else if (options.mother == true) {
                        if (n == 0 || !isEven(n)) {
                            familyTree.setNode(p[i], (gen +  options.rootGen), node);
                            delete familyTree.getNode(gen + options.rootGen, node).display.ascendancyNumber;
                        }
                    } else {
                        familyTree.setNode(p[i], (gen +  options.rootGen), node);
                        delete familyTree.getNode(gen + options.rootGen, node).display.ascendancyNumber;
                    }
				}
			}
			if (p.length == 1) {
                if (!options.expand) {
                    alert('No parents found for person with ID: ' + options.pid);
                }
			} else if (p.length == 2) {
                if (!options.expand) {
                    alert('Only one parent found for person with ID: ' + options.pid);
                }
			}
			typeof callback === 'function' && callback();
		} else {
		    loadingAnimationEnd();

		}
	});
}

function personReadLoop(callback) {
	familyTree.IDDFS(function (leaf, cont) {
        var node = leaf.node;
        var gen = leaf.generation;
        if (leaf.value.isPlotted !== true) {
            if (leaf.value.links.self) {
                personRead(leaf.value.links.self.href, function (result) {
                    var person = familyTree.getNode(gen, node);
                    person.generation = gen;
                    person.node = node;
                    if (node < Math.pow(2, gen - 1)) {
                        person.isPaternal = true;
                    }
                    person.display = result.display;
                    person.place = result.place;
                    person.links = result.links;
                });
                cont();
            } else {
                cont();
            };
        } else {
            cont();
        }
    }, function () {
		typeof callback === 'function' && callback();
    });
}

function personRead(url, callback) {
    fsAPI({ media: 'x-gedcomx-v1+json', url: url + '&callback' },
        function (result, status) {
            if (status == "OK") {
                var person = result.persons[0];
                var places = result.places;
                var display = person.display;
                var links = person.links;

                if (person.living == true) {
                    display.deathDate = "Living";
                }

                if (places) {
                    var placestring = places[0].names[0].value;
                } else {
                    var placestring = display.birthPlace;
                }

                var object = {
                    display: display,
                    links: links,
                    place: placestring
                }
			    // Send reply

        		typeof callback === 'function' && callback(object,status);
                // callback(object);
            } else {
            	typeof callback === 'function' && callback(undefined,status);
            }
    });
}

function placeReadLoop(callback) {
	familyTree.IDDFS(function (leaf, cont) {
		var node = leaf.node;
		var gen = leaf.generation;
		if (leaf.value.isPlotted !== true) {
		    getMeABirthPlace(gen, node,cont);
			//cont();
		} else {
			cont();
		}
	}, function() {
		typeof callback === 'function' && callback();
	});
}

function plotterLoop(callback) {
	familyTree.IDDFS(function (leaf, cont) {
		var node = leaf.node;
		var gen = leaf.generation;
		if (leaf.value.isPlotted !== true) {
		    if (!(gen == 0 && node == 0)) {
		        plotParent(gen, node);
		    }
			setTimeout(function () {
				cont();
			}, 50);
		} else {
			cont();
		}
	}, function() {
		typeof callback === 'function' && callback();
    });
}

function finish(options) {

        if (!options.expand) {
            // only update pedigree chart if not running from URL
            makePedigree(options.rootGen,options.rootNode);
        }

    updateLists();

	// Setup spiderfying of pins
	addOMSListeners();

	// Generate country statistics
	countryLoop();

    typeof options.callback === 'function' && options.callback();
}

function updateLists() {
    var gen = Math.floor(log2(familyTree.Nodes.length-1));

    expandList({listName: "countryList", noExpanding: true});
    expandList({listName: "isolateList", noExpanding: true});

    var ilist = document.getElementById('isolateList');
    var clist = document.getElementById('countryList');

    var items = ilist.getElementsByTagName("li");
    var dcont = items[0].parentElement;

    for (var i=items.length-1;i>1;i--) {
        if (items[i].getAttribute('class').indexOf('item') !== -1) {
            dcont.removeChild(items[i]);
        }
    }

    for (var i=0; i<gen; i++) {
        var li = document.createElement('li');
        li.setAttribute('class','item');
        li.innerHTML = getGetOrdinal(i+1) + ' generation';
        li.onclick = function(arg) {
            return function() {
                expandList({listName:'isolateList'});
                isolateLoop('',false,arg+1);
            }
        }(i);
        dcont.appendChild(li);
    }

    var items = clist.getElementsByTagName("li");
    var dcont = items[0].parentElement;

    for (var i=items.length-1;i>1;i--) {
        if (items[i].getAttribute('class').indexOf('item') !== -1) {
            dcont.removeChild(items[i]);
        }
    }

    for (var i=0; i<gen; i++) {
        var li = document.createElement('li');
        li.setAttribute('class','item');
        li.innerHTML = getGetOrdinal(i+1) + ' generation';
        li.onclick = function(arg) {
            return function() {
                expandList({listName:'countryList'});
                countryLoop('',false,arg+1);
            }
        }(i);
        dcont.appendChild(li);
    }

}

function getGetOrdinal(n) {
   var s=["th","st","nd","rd"],
       v=n%100;
   return n+'<sup>'+(s[(v-20)%10]||s[v]||s[0])+'</sup>';
}

function makePedigree(gen, node) {
	var daddy = document.getElementById('tree1');
	var child = document.getElementById('tree2');
	var mommy = document.getElementById('tree3');

	daddy.innerHTML = '';
	mommy.innerHTML = '';
	child.innerHTML = '';

	daddy.onclick = null;
	mommy.onclick = null;
	child.onclick = null;

	var person = familyTree.getNode(gen, node);
	var father = familyTree.getFather(gen, node);
	var mother = familyTree.getMother(gen, node);

	child.innerHTML = HtmlEncode(person.display.name) + '</br> (' + HtmlEncode(person.display.lifespan) + ')';

	if (person.display.gender == "Male") {
            child.style.backgroundColor = 'dodgerblue';
        } else {
            child.style.backgroundColor = 'pink';
        }

	if (father) {
		daddy.innerHTML = HtmlEncode(father.display.name) + '</br> (' + HtmlEncode(father.display.lifespan) + ')';
		daddy.onclick = function () {
			makePedigree(gen + 1, node * 2);
			infoBoxClick(familyTree.getNode(gen + 1, node * 2).marker);
		}
	} else {
        daddy.innerHTML = "</br><span style='padding-left: 40px'>[+]</span>";
        daddy.onclick = function () {

            var options = {
                pid: person.id,
                generations: 1,
                rootGen: person.generation,
                rootNode: person.node,
                father: true,
                callback: function() {
                    if (familyTree.getNode(gen + 1, node * 2)) {
                        makePedigree(gen + 1, node * 2);
                        infoBoxClick(familyTree.getNode(gen + 1, node * 2).marker);
                    }
                }
            };

            rootsMapper(options);
        }
    }

	if (mother) {
		mommy.innerHTML = HtmlEncode(mother.display.name) + '</br> (' + HtmlEncode(mother.display.lifespan) + ')';
		mommy.onclick = function () {
			makePedigree(gen + 1, node * 2 + 1);
			infoBoxClick(familyTree.getNode(gen + 1, node * 2 + 1).marker);
		}
	} else {
        mommy.innerHTML = "</br><span style='padding-left: 40px'>[+]</span>";
        mommy.onclick = function () {

            var options = {
                pid: person.id,
                generations: 1,
                rootGen: person.generation,
                rootNode: person.node,
                mother: true,
                callback: function() {
                    if (familyTree.getNode(gen + 1, node * 2 + 1)) {
                        makePedigree(gen + 1, node * 2 + 1);
                        infoBoxClick(familyTree.getNode(gen + 1, node * 2 + 1).marker);
                    }
                }
            };

            rootsMapper(options);
        }
    }

	if (gen > 0) {
		child.onclick = function() {
			makePedigree(gen - 1, (node >> 1));
			infoBoxClick(familyTree.getNode(gen - 1, (node >> 1)).marker);
		}
	}
};

function addOMSListeners() {
	// Clear any old listeners
    oms.clearListeners('click');
    oms.clearListeners('spiderfy');

    // When a pin is clicked, bring up the infoBox
    oms.addListener('click', function (mark, event) {
        infoBoxClick(mark);
    });

    // When a pile of pins is clicked, don't bring up an infoBox
    oms.addListener('spiderfy', function (mark) {
        ib.close();
    });
}

function isolateLoop(callback, all, generation) {

    if (all == undefined) {
        all = true;
    }

    familyTree.IDDFS(function (tree, cont) {
        var node = tree.node;
        var gen = tree.generation;
        if (all == true) {
            tree.value.marker.setVisible(pinsVisible);
            if (tree.value.polyline) {
                tree.value.polyline.setVisible(!onlyPins);
            }
        } else if (gen == generation) {
            tree.value.marker.setVisible(pinsVisible);
            if (tree.value.polyline) {
                tree.value.polyline.setVisible(false);
            }
        } else {
            tree.value.marker.setVisible(false);
            if (tree.value.polyline) {
                tree.value.polyline.setVisible(false);
            }
        }
        cont();
    }, function () {
        typeof callback === 'function' && callback(group);
    });
}

function countryLoop(callback, all, generation) {
    var max = 0;
    var group = {};

    if (all == undefined) {
    	all = true;
    }

    familyTree.IDDFS(function (tree, cont) {
        var node = tree.node;
        var gen = tree.generation;
        if (all == true) {
	        var value = scrubCountry(familyTree.getNode(gen, node).display.birthCountry);
	        var n = group[value] = 1 - -(group[value] | 0);
	        if (n > max) { max = n; }
        } else if (gen == generation) {
	        var value = scrubCountry(familyTree.getNode(gen, node).display.birthCountry);
	        var n = group[value] = 1 - -(group[value] | 0);
	        if (n > max) { max = n; }
        }
        cont();
    }, function () {
        displayCountryStats(group);
        typeof callback === 'function' && callback(group);
    });
}

function scrubCountry(val) {
	if (val == 'England') {
		return 'United Kingdom';
	} else {
		return val;
	}
}

function displayCountryStats(group) {
    var cs = document.getElementById('countryStatistics');
    var css = document.getElementById('countryStatisticsSpan');
    if (css.getAttribute('class').indexOf('lighted') !== -1) {
        // currently selected, unselect
        unselectItem('countryStatistics','countryStatisticsSpan');
        var statsOpen = true;
    }

	var div = document.getElementById('countryStats');
    div.innerHTML = '';

	var keys = [];
	var vals = [];

    for (var key in group) {
        if (group.hasOwnProperty(key)) {
            if (key !== 'undefined') {
				keys.push(key);
				vals.push(group[key]);
            }
        }
    }

    var valstore = vals.slice(0);
    var keystore = keys.slice(0);
    // vals.sort(function(a, b){return b-a});

	var absmaxval = Math.max.apply(Math,vals);

	for (var i = 0; i < vals.length; i++) {
        var maxval = Math.max.apply(Math,vals);

        for (var j = 0; j < keys.length; j++) {
            if (group[keys[j]] == maxval) {
                var d = document.createElement('span');
                d.textContent = keys[j] + ': ' + group[keys[j]];
                var br = document.createElement('br');
                div.appendChild(d);
                div.appendChild(br);
                var yc = (Math.round(vals[j] / absmaxval * 5) / 5).toFixed(2) * 200;
                d.style.color = 'rgba(255,' + (200 - yc) + ',' + (200 - yc) + ',1)';
                vals[j] = 0;
                keys[j] = '';
                break;
            }
        }
	}

    if (statsOpen == true) {
        css.setAttribute('class','menuButtonSpan lighted');
        unselectItem('rootsMapper','rootsMapperSpan');
        unselectItem('viewOptions','viewOptionsSpan');
        unselectItem('pedigreeChart','pedigreeChartSpan');

        var un = document.getElementById('countryStats').getBoundingClientRect();
        var rd = document.getElementById('logoutbutton');

        cs.style.height = document.getElementById('countryStats').clientHeight + 115 + 'px';
        document.getElementById('countryDiv').style.height = document.getElementById('countryStats').clientHeight + 25 + 'px';

        setTimeout(function(){
            cs.style.overflow = 'visible';
        },250);
    }

	queryTable(keystore,valstore);
}

function queryTable(countryArray,countryCount) {
    if (showLayers == true) {
    	if (layer) {
    		layer.setMap(null);
    	}

    	var tableid = 424206; // 423734; //
    	var where = "'name' IN ('" + countryArray.join("','") + "')";
    	var maxval = Math.max.apply(Math,countryCount);

    	var styles = [];
    	for (k=0; k<5; k++) {
    		var opacArray = [];
    		for (i=0; i<countryArray.length;i++) {
    			if (countryCount[i] / maxval > (k)/5 && countryCount[i] / maxval <= (k+1)/5) {
    				opacArray.push(countryArray[i]);
    			}
    		}

    		styles[k] = {
    			where: "'name' IN ('" + opacArray.join("','") + "')",
    			polygonOptions: {
    				fillColor: rgbToHex(255,0,0),
    				fillOpacity: (k+1)/10
    			}
    		}

    	}

    	layer = new google.maps.FusionTablesLayer({query:{
    			select: 'kml_4326',
    			from: tableid,
    			where: where
    		},styles: styles,
    		suppressInfoWindows: true
    	});

        layer.setMap(map);
    }
}

function getPhoto(id, gen, node, callback) {
    var person = familyTree.getNode(gen, node);
    if (!person.image) {

        var url = urltemplate.parse(discovery['person-portrait-template'].template).expand({
            pid: id,
            access_token: accesstoken
        });

        fsAPI({ url: url, media: 'img' }, function (result, status) {
            familyTree.getNode(gen, node).image = result;
            typeof callback === 'function' && callback(result);
        }, 10000);

    } else {
        typeof callback === 'function' && callback('');
    }
}

function setPhoto(gen, node, timer) {
    setTimeout(function () {
        var portrait = document.getElementById('portrait');
        if (portrait) {
            var person = familyTree.getNode(gen, node);
            if (person.image) {
                var imageHTML = "<img style='max-height:300px;' src='" + person.image + "'>";
                portrait.setAttribute('src', person.image);
                tooltip.set({id: "portrait", tip: imageHTML, duration: 30000});
            } else {
                tooltip.set({id: "portrait", tip: "A portrait has not been set for this person"});
            }
        } else {
            setPhoto(gen, node, 50)
        }
    }, timer);
}

function getMeABirthPlace(gen, node, cont, callback) {
    getPlaceAuthority(gen,node,cont, function (result, status) {
        if (status == "OK") {
            familyTree.getNode(gen, node).display.birthLatLng = result.latlng;
            familyTree.getNode(gen, node).display.birthCountry = result.country;
            if (gen == 0 && node == 0) {
                result.cont();
                createMarker(familyTree.root());
                familyTree.root().isPlotted = true;
                map.setCenter(familyTree.root().display.birthLatLng);
                typeof callback === 'function' && callback();
            } else {
                typeof callback === 'function' && callback();
            }
        } else if (status == "EMPTY") {
			if (gen == 0 && node == 0) {
				alert("Root person has no location information in FamilySearch Family Tree. " +
					  "Please update their information or enter a new root person.");
				loadingAnimationEnd();


			} else {
			    typeof result === 'function' && result();
				getChildBirthPlace(gen, node, function (result) {
                    familyTree.getNode(gen, node).display.birthLatLng = result;
                    typeof callback === 'function' && callback();
                });
			}
        } else {
       //     console.log("Place authority fail. Try google.")
            getLatLng(familyTree.getNode(gen, node).display.birthPlace, cont, function (result, status) {
                if (status == "OK") {
                    familyTree.getNode(gen, node).display.birthLatLng = result.latlng;
            		familyTree.getNode(gen, node).display.birthCountry = result.country;
                    if (gen == 0 && node == 0) {
                        result.cont();
                        createMarker(familyTree.root());
                        familyTree.root().isPlotted = true;
                        typeof callback === 'function' && callback();
                    } else {
                        typeof callback === 'function' && callback();
                    }
                } else {
                    //getChildBirthPlace(gen, node, function (result) {
                        if (gen == 0 && node == 0) {
                            alert("Root person's location information in FamilySearch Family Tree does not match any known locations. " +
                                  "Please update their information.");
                            loadingAnimationEnd();

                        } else {
                            getChildBirthPlace(gen, node, function (result) {
                                familyTree.getNode(gen, node).display.birthLatLng = result;
                                typeof callback === 'function' && callback();
                            });
                        }
                    //});
                }
            });
        }
    });
}

function getLatLng(place, cont, callback) {

    if (place) {
        setTimeout(function () {
            var geocoder = new google.maps.Geocoder();
            var georequest = {
                address: place
            };

            geocoder.geocode(georequest, function (result, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    var latlng = result[0].geometry.location;
					var split = place.split(",");
                    var country = split[split.length - 1];
                    while (country.charAt(0) === ' ') {
                        country = country.substr(1);
                    }
                    typeof callback === 'function' && callback({latlng: latlng, country: country, cont: cont}, "OK");
                } else {
                    if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                        //typeof callback === 'function' && callback(undefined, "LIMIT");
            //            console.log("Google throttled. Delay = " + delay + "ms. Place: " + place);
                        delay++;
                        getLatLng(place, cont, callback);
                    } else {
                        typeof callback === 'function' && callback(cont, "NONE");
                    }
                }
            })
        }, delay);
    } else {
        typeof callback === 'function' && callback(cont, "EMPTY");
    }
}

function getPlaceAuthority(gen, node, cont, callback) {
    if (!familyTree.getNode(gen, node).display.ascendancyNumber) {
        var place = familyTree.getNode(gen, node).display.birthPlace;
        //var place = familyTree.getNode(gen, node).place; // uncomment to use normalized place strings
        if (place) {
            if (!(gen == 0 && node == 0)) {
                typeof cont === 'function' && cont();
            }
            var url = discovery.authorities.href + '/v1/place?place=' + encodeURIComponent(place) + "&filter=true&locale=en&sessionId=" + accesstoken;
                fsAPI({ media: 'xml', url: url }, function (result, status) {
                    if (status == "OK") {
                        var form = $(result).find("form");
                        if (form[0]) {
                            var split = form[0].textContent.split(",");
                            var country = split[split.length - 1];
                            while (country.charAt(0) === ' ') {
                                country = country.substr(1);
                            }
                        }
                        var point = $(result).find("point");
                        if (point[0]) {
                            var lat = point[0].childNodes[0].textContent;
                            var lng = point[0].childNodes[1].textContent;
                            var latlng = new google.maps.LatLng(lat, lng);
                            typeof callback === 'function' && callback({latlng: latlng, country: country, cont: cont}, status);
                        } else {
                            typeof callback === 'function' && callback(cont, "NONE");
                        }
                    } else {
                        typeof callback === 'function' && callback(cont, status);
                    }
                });
        } else {
            typeof callback === 'function' && callback(cont, "EMPTY");
        }
    } else {
        if (gen == 0 && node == 0) {
            setTimeout(function () {
                getPlaceAuthority(gen, node, cont, callback)
            }, 100);
        } else {
            typeof cont === 'function' && cont();
            setTimeout(function () {
                getPlaceAuthority(gen, node, '', callback)
            }, 100);
        }
    }
}

function plotParent(gen, node) {
    var parent = familyTree.getNode(gen, node);
    var child = familyTree.getChild(gen, node);

    if (parent.isPaternal == true) {
        var color = rgbToHex(74, 96, 255);
    } else {
        var color = rgbToHex(255, 96, 182);
    }

    if (child.display.birthLatLng && parent.display.birthLatLng) {
        checkBounds(parent.display.birthLatLng);
        polymap([child.display.birthLatLng, parent.display.birthLatLng], color, node, gen, function (result) { //rgbToHex(74,96,255) rgbToHex(0, 176, 240)
            createMarker(familyTree.getNode(gen, node));
            familyTree.getNode(gen, node).isPlotted = true;
        });
    } else {
        //  console.log("Recursion waiting for " + child.name + " ... ");
        setTimeout(function () {
            plotParent(gen, node);
        }, 1000);
    }
}

function checkBounds(latlng) {
    var currentBounds = map.getBounds();
    if (currentBounds.contains(latlng) == false) {
        currentBounds.extend(latlng);
        map.fitBounds(currentBounds);
    }
}

function polymap(coords, color, node, gen, callback) {

    var c1 = coords[0];
    var c2 = coords[1];

    if (c1 && c2) {

        var geodesicOptions = {
            strokeColor: color,
            strokeOpacity: 1.0,
            strokeWeight: 3,
            geodesic: true,
            path: [c1, c1],
            map: map
        };

        var geodesicPoly = new google.maps.Polyline(geodesicOptions);
        geodesicPoly.node = node;
        geodesicPoly.gen = gen;
        familyTree.getNode(gen, node).polyline = geodesicPoly;

        google.maps.event.addListener(geodesicPoly, 'mouseover', function () {
            var gen = this.gen;
            var node = this.node;
            var zindex = familyTree.getNode(gen, node).marker.getZIndex();
            familyTree.getNode(gen, node).marker.setZIndex(9999);
            setTimeout(function () {
                familyTree.getNode(gen, node).marker.setZIndex(zindex);
            }, 300);
        });

        google.maps.event.addListener(geodesicPoly, 'click', function () {
            infoBoxClick(familyTree.getNode(this.gen, this.node).marker);
        });

        if (onlyPins == true) {
            geodesicPoly.setVisible(false);
        }

		var before = new Date();
        var step = 0;
        var numSteps = 100; //Change this to set animation resolution
        var timePerStep = 5; //Change this to alter animation speed
        var interval = setInterval(function () {
			var now = new Date();
			var elapsedTime = (now.getTime() - before.getTime())
			if (elapsedTime > timePerStep * numSteps || onlyPins == true) {
                clearInterval(interval);
				geodesicPoly.setPath([c1, c2]);
				callback();
			} else {
				step = elapsedTime / (timePerStep * numSteps);
				var are_we_there_yet = google.maps.geometry.spherical.interpolate(c1, c2, step);
                geodesicPoly.setPath([c1, are_we_there_yet]);
			}
        }, timePerStep);
    } else {
        callback(idx);
    }

}

function createMarker(p,yellow) {
    if (p) {
        if (p.display.birthLatLng) {

            if (p.display.gender == "Male") {
                var icon = 'images/male' + p.generation + '.png?v=' + version;
                var src = 'images/man.png?v=' + version;
            } else {
                var icon = 'images/female' + p.generation + '.png?v=' + version;
                var src = 'images/woman.png?v=' + version;
            }

            if (p.image) {
                var src = p.image;
            }

            var scaleFactor = .5;
            var opts = {
                map: map,
                position: p.display.birthLatLng,
                icon: {
                    url: icon,
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(36 * scaleFactor * 0.5, 36 * scaleFactor * 0.5),
                    scaledSize: new google.maps.Size(36 * scaleFactor, 36 * scaleFactor)
                }
            }

            if (yellow == true) {
                var opts = {
                    map: map,
                    position: p.display.birthLatLng,
                    zIndex: 999,
                    icon: {
                        url: 'images/yellow' + p.generation + '.png?v=' + version,
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(36 * scaleFactor * 0.5, 36 * scaleFactor * 0.5),
                        scaledSize: new google.maps.Size(36 * scaleFactor, 36 * scaleFactor)
                    }
                }
            }

            var mark = new google.maps.Marker(opts);
            createInfoBox(mark, p, icon, src);

            google.maps.event.addListener(mark, 'mouseover', function (e) {
                var content = this.name + ' (' + this.lifespan + ')';
                var lat = e.latLng.lat();
                var lng = e.latLng.lng();
                var div = document.createElement('div');
                div.setAttribute('id', 'tt');
                div.textContent = content;
                div.style.fontSize = 'small';
                ib2.setContent(div);
                var pos = new google.maps.LatLng(lat, lng);
                ib2.setPosition(pos);
                ib2.open(map);
            });

            google.maps.event.addListener(mark, 'mouseout', function () {
                ib2.close();
            });

            oms.addMarker(mark);
            familyTree.getNode(p.generation, p.node).marker = mark;
        }
    }
}

    function createInfoBox(mark, p, icon, src) {
        var father = "<img style='width: 18px; height: 18px; margin-bottom:1px;' src='images/male" + (p.generation + 1) + ".png?v=" + version + "'>";
        var mother = "<img style='width: 18px; height: 18px; margin-top:1px;' src='images/female" + (p.generation + 1) + ".png?v=" + version + "'>";
        var self = "<img style='width: 18px; height: 18px; margin-top: 10px;' src='" + icon + "'>";
        mark.generation = p.generation;
        mark.node = p.node;
        mark.name = p.display.name;
        mark.lifespan = p.display.lifespan;

        mark.expandButton = "<ul id='expandList' class='listClass'>" +
                                "<li id='ebutton' class='main' onclick='expandList({listName:\"expandList\"});'><img class='triangle' src='images/triangle-down.png'><b>Expand</b></li>" +
                                "<li class='item' onclick='expandList({listName:\"expandList\"}); expandClick(" + p.generation + "," + p.node + "," + 1 + ");'>1 generation</li>" +
                                "<li class='item' onclick='expandList({listName:\"expandList\"}); expandClick(" + p.generation + "," + p.node + "," + 2 + ");'>2 generations</li>" +
                                "<li class='item' onclick='expandList({listName:\"expandList\"}); expandClick(" + p.generation + "," + p.node + "," + 3 + ");'>3 generations</li>" +
                                "<li class='item' onclick='expandList({listName:\"expandList\"}); expandClick(" + p.generation + "," + p.node + "," + 4 + ");'>4 generations</li>" +
                                "<li class='item' onclick='expandList({listName:\"expandList\"}); expandClick(" + p.generation + "," + p.node + "," + 5 + ");'>5 generations</li>" +
                                "<li class='item' onclick='expandList({listName:\"expandList\"}); expandClick(" + p.generation + "," + p.node + "," + 6 + ");'>6 generations</li>" +
                                "<li class='item' onclick='expandList({listName:\"expandList\"}); expandClick(" + p.generation + "," + p.node + "," + 7 + ");'>7 generations</li>" +
                                "<li class='item' onclick='expandList({listName:\"expandList\"}); expandClick(" + p.generation + "," + p.node + "," + 8 + ");'>8 generations</li>" +
                            "</ul>";
        mark.deleteButton = "<div style='height: 38px; display:inline-block;'><img id='trashcan' src='images/trash.png?v=" + version +
                          "' style='width:25px; height:26px; margin-top: 12px;' onclick='deleteMarker(" + p.generation + "," + p.node + ") ;'</div>";

        mark.deleteButton = "<button id='trashcan' class='button red' onclick='deleteMarker(" + p.generation + "," + p.node + ") ;'>X</button>";

        mark.personID = p.id;
        var url = baseurl + '/tree/#view=ancestor&person=' + p.id;

        mark.infoBoxContent =
            "<div class='person'>" +
                "<div class='box44'>" +
                    "<img id='portrait' class='profile-image' src='" + src + "'>" +
                "</div>" +
                "<div class='box'>" +
                        "<a class='xlarge' id='fsButton' href='" + url + "' target='_blank'>" + HtmlEncode(p.display.name) + "</a>" +
                    "<div class='large'>" +
                        p.id +
                        "<img id='copyButton' src='images/copy.png?v=" + version + "' onclick='populateIdField(\"" + p.id + "\", \"" + HtmlEncode(p.display.name) + "\"); ib.close();'>" + "</div>" +
                "</div>" +
            "</div>" +
            "<div class='person'>" +
                "<div class='label'>BIRTH</div>" +
                "<div class='box'>" +
                    "<div class='large'>" + (HtmlEncode(p.display.birthDate || "")) + "</div>" +
                    "<div class='small'>" + (HtmlEncode(p.display.birthPlace || "")) + "</div>" +
                "</div>" +
            "</div>" +
            "<div class='person'>" +
                "<div class='label'>DEATH</div>" +
                "<div class='box'>" +
                    "<div class='large'>" + (HtmlEncode(p.display.deathDate || "")) + "</div>" +
                    "<div class='small'>" + (HtmlEncode(p.display.deathPlace || "")) + "</div>" +
                "</div>" +
            "</div>";
    }

    function expandClick(gen, node, gens, callback) {
        var p = familyTree.getNode(gen,node);
        p.marker.isExpanded=true;

        if (callback == undefined) {
            callback = function() {
                infoBoxClick(p.marker);
            }
        }

        var options = {
        	pid: p.id,
        	generations: gens,
        	rootGen: gen,
        	rootNode: node,
            callback: callback
        };

        rootsMapper(options);
    }

    function infoBoxClick(mark) {
        var pathArray = window.location.href.split( '/' );
        var yd = pathArray[pathArray.length-1].indexOf('&selected=');
        if (yd == -1) {yd = undefined;}
        //window.history.replaceState("none","",pathArray[pathArray.length-1].substring(0,yd) + "&selected=" + mark.generation + "," + mark.node);
        cur_title = title + ": " + mark.name + " (" + mark.personID + ")";
	document.title = cur_title;
	       cur_selected = mark.generation + "," + mark.node;
           window.history.replaceState("none","", "?root=" + cur_root + "&gens=" + cur_gens + "&selected=" + cur_selected + "&expand=" + cur_expand);
		if (baseurl.indexOf('sandbox') == -1) {
		    getPhoto(mark.personID, mark.generation, mark.node, function (img) {
		        setPhoto(mark.generation, mark.node,0);
		    });
		}
		var fatherPlotted = false;
		var motherPlotted = false;
		if (familyTree.getFather(mark.generation, mark.node)) {
			if (familyTree.getFather(mark.generation, mark.node).isPlotted == true) {
				fatherPlotted = true;
			}
		}

        if (familyTree.getMother(mark.generation, mark.node)) {
            if (familyTree.getMother(mark.generation, mark.node).isPlotted == true) {
                motherPlotted = true;
            }
        }

        if (motherPlotted == false && fatherPlotted == false) { // neither parent is plotted, okay to show delete button
            if (mark.generation == 0) {
                var buttons = mark.expandButton + "<div style='height: 30px' ></div>" + '</div>';
            } else {
                var buttons = mark.expandButton +mark.deleteButton + '</div>';
            }
        } else if (motherPlotted == true && fatherPlotted == true) {
            var buttons = "";
        } else {
            var buttons = mark.expandButton + "<div style='height: 30px' ></div>" + '</div>';
        }

        if (mark.isExpanded) {
            ib.setContent("<div id='infow' class='unselectable'>" + mark.infoBoxContent + '</div>');
        } else {
            ib.setContent("<div id='infow' class='unselectable'>" + mark.infoBoxContent +buttons + '</div>');

        }

    	ib.open(map, mark);
		makePedigree(mark.generation, mark.node);

		restoreColors();
		if (highlights == true) {
		    getToRoot(mark.generation, mark.node, function (gen, node) {
		        familyTree.getNode(gen, node).offColored = true;
		        if (familyTree.getNode(gen, node).polyline !== undefined) {
		            familyTree.getNode(gen, node).polyline.setOptions({ strokeColor: '#000000', zIndex: 999 });
		        }
		        var scaleFactor = 0.5;
		        var opts = {
		            icon: {
		                url: 'images/yellow' + gen + '.png?v=' + version,
		                origin: new google.maps.Point(0, 0),
		                anchor: new google.maps.Point(36 * scaleFactor * 0.5, 36 * scaleFactor * 0.5),
		                scaledSize: new google.maps.Size(36 * scaleFactor, 36 * scaleFactor)
		            }
		        };
		        familyTree.getNode(gen, node).marker.setOptions(opts);
		        //createMarker(familyTree.getNode(gen, node), true);
		    });
		    fixColors = true;
		    var high = document.getElementById('isolate');
            high.disabled = false;
	        high.className = 'button yellow';
		}
	}

    function getToRoot(gen, node, run, callback) {
		familyTree.generation = gen;
		familyTree.node = node;
		typeof run == 'function' && run(gen,node);
		if (familyTree.child() !== undefined) {
			gen = familyTree.generation;
			node = familyTree.node;
			getToRoot(gen, node, run, callback);
		} else {
			typeof callback === 'function' && callback();
		}
    }

    function restoreColors(callback) {
    	if (fixColors == true) {
			fixColors = false;
			familyTree.IDDFS(function (leaf, cont) {
				var node = leaf.node;
				var gen = leaf.generation;
				if (leaf.value.isPlotted == true) {
				    if (leaf.value.offColored == true) {
				        if (leaf.value.isPaternal == true) {
				            if (leaf.value.polyline !== undefined) {
				                leaf.value.polyline.setOptions({ strokeColor: rgbToHex(74, 96, 255), zIndex: 2 });
				            }
				        } else {
				            if (leaf.value.polyline !== undefined) {
				                leaf.value.polyline.setOptions({ strokeColor: rgbToHex(255, 96, 182), zIndex: 2 });
				            }
				        }
				        if (leaf.value.display.gender == "Male") {
				            var icon = 'images/male' + gen + '.png?v=' + version;
				        } else {
				            var icon = 'images/female' + gen + '.png?v=' + version;
				        }

				        var scaleFactor = .5;
				        var opts = {
				            icon: {
				                url: icon,
				                origin: new google.maps.Point(0, 0),
				                anchor: new google.maps.Point(36 * scaleFactor * 0.5, 36 * scaleFactor * 0.5),
				                scaledSize: new google.maps.Size(36 * scaleFactor, 36 * scaleFactor)
				            }
				        }
				        familyTree.getNode(gen, node).marker.setOptions(opts);
				        leaf.value.offColored = false;
				    }
				}
				cont();
			}, function () {
				typeof callback === 'function' && callback();
			});
		} else {
			typeof callback === 'function' && callback();
		}
	}

    function toggleIsolate(callback) {
        familyTree.IDDFS(function (leaf, cont) {
            if (leaf.value.offColored !== true) {
                if (onlyPins == false) {
                    if (leaf.value.polyline !== undefined) {
                        leaf.value.polyline.setVisible(isolate);
                    }
                }
                leaf.value.marker.setVisible(isolate);
            }
            cont();

        }, function () {
            if (isolate == false) {
                isolate = true;
                document.getElementById('isolate').className = 'button yellow off';
            } else {
                isolate = false;
                document.getElementById('isolate').className = 'button yellow';
            }
            typeof callback === 'function' && callback();
        });
    }

    function toggleLines(callback) {
        familyTree.IDDFS(function (leaf, cont) {
            if (leaf.value.polyline !== undefined) {
                if (isolate == true) {
                    if (leaf.value.offColored == true) {
                        leaf.value.polyline.setVisible(onlyPins);
                    }
                } else {
                    leaf.value.polyline.setVisible(onlyPins);
                }
            }
            cont();
        }, function () {
            if (onlyPins == false) {
                onlyPins = true;
                document.getElementById('showlines').className = 'button yellow';
                //document.getElementById('showlines').innerText = 'Show Lines';
            } else {
                onlyPins = false;
                document.getElementById('showlines').className = 'button yellow off';
                //document.getElementById('showlines').innerText = 'Hide Lines';
            }
            typeof callback === 'function' && callback();
        });
    }

	function togglePins(callback) {
		familyTree.IDDFS(function (leaf, cont) {
			leaf.value.marker.setVisible(!pinsVisible);
			cont();
		},function() {
			if (pinsVisible == false) {
				pinsVisible = true;
				document.getElementById('showpins').className = 'button yellow off';
			} else {
				pinsVisible = false;
				document.getElementById('showpins').className = 'button yellow';
			}
			typeof callback === 'function' && callback();
		});
	}

    function toggleHighlight(callback) {
        var high = document.getElementById('isolate');
        document.getElementById('highlight');
        if (highlights == false) {
            document.getElementById('highlight').className = 'button yellow off';
            highlights = true;
        } else {
            if (isolate == true) {
                toggleIsolate();
            }
            restoreColors();
            document.getElementById('highlight').className = 'button yellow';
            high.disabled = true;
            high.className = 'button yellow disabled';
            highlights = false;
        }
    }

    function toggleLayers(callback) {
        if (showLayers == true) {
            if (layer) {
                layer.setMap(null);
            }
            document.getElementById('countryToggle').className = 'button yellow';
            showLayers = false;
        } else {
            if (layer) {
                layer.setMap(map);
            }
            document.getElementById('countryToggle').className = 'button yellow off';
            showLayers = true;
        }

    }

	function deleteMarker(gen, node) {
		familyTree.getNode(gen, node).marker.setVisible(false);
		familyTree.getNode(gen, node).polyline.setVisible(false);
		familyTree.getChild(gen, node).marker.isExpanded = false;
		familyTree.getNode(gen, node).isPlotted = false;
		familyTree.setNode(undefined, gen, node);

        if (cur_expand == '') {
            cur_expand = gen + "," + node + "," + "d";
        } else {
            cur_expand = cur_expand + ";" + gen + "," + node + "," + "d";
        }
        window.history.replaceState("none","", "?root=" + cur_root + "&gens=" + cur_gens + "&selected=" + cur_selected + "&expand=" + cur_expand);

		// ib.close();
		countryLoop(function (group) {
            infoBoxClick(familyTree.getChild(gen,node).marker);
		});
    }

    function getChildBirthPlace(gen, node, callback) {
        // Call this function if you can't find a person's birthplace
        // It will check if the person has children, and if so, returns the child's birthplace instead

        var child = familyTree.getChild(gen, node);
        if (child.display.birthLatLng) {
            typeof callback === 'function' && callback(child.display.birthLatLng);
        } else {
            setTimeout(function () {
                getChildBirthPlace(gen, node, callback);
            }, 1000);
        }

    }

    function loadingAnimationStart() {
        document.title = "*" + cur_title;
        document.getElementById('loadingDiv').style.visibility = 'visible';
        $(function () {
            $('#loading').show();
        });
        $(function () {
            $('#loading').activity({ segments: 10, width: 10, space: 1, length: 10, color: '#eeeeee', speed: 1.5 });
        });
    }

    function loadingAnimationEnd() {
        document.title = cur_title;
        $(function () {
            $('#loading').activity(false);
        });
        $(function () {
            $('#loading').hide();
            document.getElementById('loadingDiv').style.visibility = 'hidden';
        });
    }

    function clearOverlays() {

	if (layer) {
		layer.setMap(null);
	}

    document.getElementById('tree1').innerHTML = '';
    document.getElementById('tree2').innerHTML = '';
    document.getElementById('tree3').innerHTML = '';


        oms.clearMarkers();
        oms.clearListeners('click');
        if (familyTree) {
            familyTree.IDDFS(function (tree, cont) {
                var node = tree.node;
                var gen = tree.generation;
                if (familyTree.getNode(gen, node).marker) {
                    familyTree.getNode(gen, node).marker.setMap(null);
                }
                if (familyTree.getNode(gen, node).polyline) {
                    familyTree.getNode(gen, node).polyline.setMap(null);
                }
                cont();
            }, function () { });
        }

    	if (ib) {
    		ib.close();
    	}

    	familyTree = new BinaryTree();
    	ib = new InfoBox({ contents: "", maxWidth: 0, pixelOffset: new google.maps.Size(9, 9), boxClass: 'unselectable' });
    	ib2 = new InfoBox({ contents: "", maxWidth: 0, closeBoxURL: "", pixelOffset: new google.maps.Size(9, -37) });

        firstTime = {
            plot: true,
		    box: true
		};

        google.maps.event.addListener(ib, 'domready', function () {

            if (document.getElementById("ebutton")) {
            	tooltip.set({id: "ebutton", tip: "Plot the ancestors of this person"});
			}
            if (document.getElementById("trashcan")) {
            	tooltip.set({id: "trashcan", tip: "Remove this person from the map"});
            }
            tooltip.set({id: "copyButton", tip:"Copy this ID to the Root Person ID"});
            tooltip.set({id: "fsButton", tip: "View this person on FamilySearch.org"});
        });
    }

    function populateIdField(id, name) {
        var personId = document.getElementById("personid");
        personId.value = id;

        if (name) {
        	var personName = document.getElementById("personName");
        	personName.textContent = name;
//			document.getElementById("userInfo").textContent = name;
    	}


        if (document.getElementById('rootsMapper').getAttribute('class').indexOf('selected') == -1) {
            document.getElementById('rootsMapperSpan').onclick();
        }

    }

    function populateUser() {
        if (!userID) {
            personRead("", function (currentUser) {
                populateIdField(currentUser.id,currentUser.display.name);
                userID = currentUser.id;
                var username = document.getElementById("username");
                username.innerHTML = currentUser.name;
            });
        } else {
            populateIdField(userID,userName);
        }
    }

    function completionEvents(options,callback) {

        markerCheckLoop(function () {

        	if (options.tooManyGens == true) {

        	} else {
        		loadingAnimationEnd();

	            if (firstTime.box == true) {
                    if (cur_selected) {
                        if (options.expand) {
                            if (options.expand.length == 0) {
                                infoBoxClick(familyTree.getNode(parseInt(cur_selected.split(",")[0]), parseInt(cur_selected.split(",")[1])).marker);
                                firstTime.box = false;
                            }
                        } else {
                            infoBoxClick(familyTree.getNode(parseInt(cur_selected.split(",")[0]), parseInt(cur_selected.split(",")[1])).marker);
                            firstTime.box = false;
                        }
                    } else {
                        infoBoxClick(familyTree.root().marker);
                        firstTime.box = false;
	                }
	            }
        	}


        	typeof callback === 'function' && callback();
        });

    }

    function markerCheckLoop(callback) {
    	// Makes sure every person is plotted before proceeding
        familyTree.IDDFS(function (leaf, cont) {
            if (!leaf.value.marker) {
                setTimeout(function () {
                    markerCheckLoop(callback);
                }, 1000);
            } else {
                cont();
            }
        }, function () {
            typeof callback === 'function' && callback();
        });
    }

    function customAlert() {
        var div = document.createElement("div");
        div.setAttribute('id', 'alertDiv');
        var child = document.createElement("div");
        child.setAttribute('id', 'alertText');
        var message = "Your FamilySearch session is about to expire. You will be automatically logged out in <span id='timer'></span></br></br>";
        var b = "<button class='button red' onclick='" + "window.location = 'logout.php'" + "';>Logout</button>";

        var count = 5;
        var counter = setInterval(function () {
            count = count - 1;
            if (count <= 0) {
                clearInterval(counter);
                var div = document.getElementById("alertDiv");
                document.body.removeChild(div);
                var root = document.getElementById("rootGrid");
                var inputFrame = document.getElementById("inputFrame");
                root.removeChild(inputFrame);
                var div = document.createElement("div");
                div.setAttribute("id", "inputFrame");
                div.innerHTML = "<div class='hoverdiv'><button id='loginbutton' onclick='window.location='index.php?login=true''>Login to FamilySearch</button></div>";
                root.appendChild(div);

                // Also need to disable functions requiring sessionid or access token
            } else {
                // Adjust this to actually say minutes and seconds, appropriately
                document.getElementById("timer").innerHTML = count + " seconds."; // watch for spelling
            }
        }, 1000);

        var c = "<button class='button green' onclick='emptyQuery(); clearInterval(" + counter + ")';>Keep me logged in</button>";
        var d = "<span id='timer'></span>";
        child.innerHTML = message + c;
        div.appendChild(child);
        document.body.appendChild(div);

    }



    function emptyQuery() {
        var div = document.getElementById("alertDiv");
        document.body.removeChild(div);

        var xhttp;
        var url = baseurl + "/platform/tree/persons/" + userID + "?access_token=" + accesstoken;
        xhttp = new XMLHttpRequest();
        xhttp.open("GET", url);
        xhttp.setRequestHeader('Accept', 'application/xml');

        xhttp.onload = function (e) {
            if (xhttp.readyState === 4) {
                if (xhttp.status === 200) {
                } else if (xhttp.status === 401) {
                    alert("Sorry, your session has already expired. Please log in again.");
                    window.location = 'index.php?login=true';
                }
            }
        }

        xhttp.send();
        sessionHandler();
    }

    function sessionHandler() {
        var handler = setTimeout(function () {
            customAlert();
        }, 10 * 1000);
    }

    function showOptions() {
        if (optionvar == false) {
            document.getElementById('optionDiv').style.visibility = 'visible';
            document.getElementById('optionsButton').className = 'button yellow off';
            optionvar = true;
        } else {
            document.getElementById('optionDiv').style.visibility = 'hidden';
            document.getElementById('optionsButton').className = 'button yellow';
            optionvar = false;
        }
    }

    function expandList(options) {
    	if (document.getElementById(options.listName)) {

	    	var listName = document.getElementById(options.listName);

	    	// By default, arrow should point down (a descending list)
	    	options.arrowUp || (options.arrowUp = false);

	    	if (options.arrowUp == false) {
	    		arrowStart = 'down';
	    		arrowEnd = 'up';
	    	} else {
	    		arrowStart = 'up';
	    		arrowEnd = 'down';
	    	}

	    	// If true, list will collapse but not expand
	    	options.noExpanding || (options.noExpanding = false);

	    	// By default, assume first li item is the main button
	    	(options.buttonIndex != undefined) || (options.buttonIndex = 0);

	    	var triangle = listName.getElementsByTagName("img");

	    	var items = listName.getElementsByTagName("li");

	    	for (i=0;i<items.length;i++) {
	    		if (i!=options.buttonIndex) {
		    		if (items[i].style.display == "block") {
                        listName.style.height = '29px';

		    			items[i].style.display = "none";
		    			triangle[0].src = "images/triangle-"+ arrowStart +".png";
		    		} else {
		    			if (options.noExpanding == false) {
                            listName.style.height = '150px';

		    				items[i].style.display = "block";
		    				triangle[0].src = "images/triangle-"+ arrowEnd+".png";
		    			}
		    		}
	    		}
	    	}


            // $('.listClass').jScrollPane({showArrows: false});

            var element = $('#' + options.listName).jScrollPane();
            var api = element.data('jsp');
            api.reinitialise();
            // var jspContainer = listName.children[0];
            // var jspPane = jspContainer.children[0];
            // var jspVerticalBar = jspContainer.children[1];
            // var jspTrack = jspVerticalBar.children[1];
            // var jspDrag = jspTrack.children[0];
            // jspContainer.style.height = jspPane.clientHeight + 'px';
            // jspTrack.style.height = jspPane.clientHeight + 'px';


    	}


    }

function checkID() {
	id = document.getElementById('personid').value;
	var url = urltemplate.parse(discovery['person-template'].template).expand({
	    pid: id,
	    access_token: accesstoken
	});

	personRead(url,function(result,status) {
		if (status == "OK") {
			document.getElementById("personName").textContent = result.display.name;
		} else {
			alert('No person found with ID: ' + id);
		}
	})
}

    google.maps.event.addDomListener(window, 'load', initialize);

function createKML() {
	var string = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"

	var doc = document.implementation.createDocument(null,null,null);
	var xml = doc.createElement("xml");

	// Make "kml" the root node
	var kml = doc.createElement("kml");
	kml.setAttribute("xmlns","http://www.opengis.net/kml/2.2");
	xml.appendChild(kml);

	// Append "Document" node
	var Document = doc.createElement("Document");
	kml.appendChild(Document);

    familyTree.IDDFS(function (leaf, cont) {

    	// for each person in familyTree...
		var Placemark = doc.createElement("Placemark");
		Document.appendChild(Placemark);

		var name = doc.createElement("name");
		name.textContent = HtmlEncode(leaf.value.display.name);
		Placemark.appendChild(name);

		var description = doc.createElement("description");
		description.textContent = familyTree.btSMF(leaf.generation,leaf.node);
		Placemark.appendChild(description);

        var ExtendedData = doc.createElement("ExtendedData");

        ExtendedData.appendChild(createDataElement(doc,"id",leaf.value.id));
        ExtendedData.appendChild(createDataElement(doc,"generation",leaf.generation));
        ExtendedData.appendChild(createDataElement(doc,"node",leaf.node));
        ExtendedData.appendChild(createDataElement(doc,"gender",leaf.value.display.gender));
        ExtendedData.appendChild(createDataElement(doc,"lifespan",leaf.value.display.lifespan));
        ExtendedData.appendChild(createDataElement(doc,"birthDate",leaf.value.display.birthDate));
        ExtendedData.appendChild(createDataElement(doc,"birthPlace",leaf.value.display.birthPlace));
        ExtendedData.appendChild(createDataElement(doc,"birthCountry",leaf.value.display.birthCountry));
        ExtendedData.appendChild(createDataElement(doc,"deathDate",leaf.value.display.deathDate));
        ExtendedData.appendChild(createDataElement(doc,"deathPlace",leaf.value.display.deathPlace));

        Placemark.appendChild(ExtendedData);

		var Point = doc.createElement("Point");
		Placemark.appendChild(Point);

		var coordinates = doc.createElement("coordinates");
		coordinates.textContent = leaf.value.marker.getPosition().lng() + ',' + leaf.value.marker.getPosition().lat();
		Point.appendChild(coordinates);



		cont();
	});

    var text = string + xml.innerHTML;
    return text;

}


function createDataElement(doc,name,value) {
    var Data = doc.createElement("Data");
    Data.setAttribute("name",name);

    var val = doc.createElement("value");
    if (value != undefined) {
        val.textContent = value;
    }

    Data.appendChild(val);

    return Data;
}
