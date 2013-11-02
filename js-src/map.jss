/* 
  RootsMapper
  https://github.com/dawithers/rootsmapper
  Copyright (c) 2013 Mitch Withers, Drew Withers
  Released under the MIT licence: http://opensource.org/licenses/mit-license
*/

var map;
var oms;
var accesstoken;
var ib;
var genquery;
var delay;
var baseurl;
var version;
var userID;
var familyTree;
var discovery;
var queue = 1;



function discoveryResource() {
    fsAPI({ url: baseurl + '/.well-known/app-meta' }, function (result, status) {
        if (status == "OK") {
            discovery = result.links;
            currentUser();
        }
    });
}

function currentUser() {
    var options = {
        media: 'xml',
        url: discovery["current-user-person"].href + '?&access_token=' + accesstoken
    }

    fsAPI(options, function (result, status) {
        if (status == "OK") {
            var p = $(result).find("gx\\:person, person");
            var f = $(result).find("gx\\:fullText, fullText");
            userID = p[0].getAttribute("id");
            populateIdField(userID);
            document.getElementById("username").innerHTML = f[0].textContent;

            ancestorgens();
        }
    });
    
}


function initialize() {
 
        var lat = 30.0;
        var lng = -30.0;
        var place = new google.maps.LatLng(lat, lng);
        var mapOptions = {
            zoom: 3,
            center: place,
            streetViewControl: false,
            panControl: false,
            zoomControl: true,
            zoomControlOptions: {
                style: google.maps.ZoomControlStyle.DEFAULT,
                position: google.maps.ControlPosition.LEFT_BOTTOM
            }
        }
        map = new google.maps.Map(document.getElementById('mapdisplay'), mapOptions);
        oms = new OverlappingMarkerSpiderfier(map, { keepSpiderfied: true, nearbyDistance: 35 });

        if (document.getElementById("personid")) {
            document.getElementById("personid").onmouseover = function () { tooltip("Enter the ID for the root person","personid",10); }
        }
        if (document.getElementById("populateUser")) {
            document.getElementById("populateUser").onmouseover = function () { tooltip("Set yourself as the root person", "populateUser", 10); }
        }

        if (document.getElementById("genSelect")) {
            document.getElementById("genSelect").onmouseover = function () { tooltip("Select the number of generations to plot","genSelect",10); }
        }

        if (document.getElementById("runButton")) {
            document.getElementById("runButton").onmouseover = function () { tooltip("Begin the plotting process","runButton",10); }
        }

        if (document.getElementById("feedbackbutton")) {
            document.getElementById("feedbackbutton").onmouseover = function () { tooltip("Leave some comments about your experience","feedbackbutton",-75,-100); }
        }

        if (document.getElementById("donatebutton")) {
            document.getElementById("donatebutton").onmouseover = function () { tooltip("Help keep this site up and running","donatebutton",-65,-65); }
        }
        
        if (accesstoken) {
            discoveryResource();
        }

        google.maps.event.addListener(map, 'click', function () {
            ib.close();
        });
    }

    function ancestorgens(gens) {

        clearOverlays();
        startEvents();
	    var select = document.getElementById('genSelect');
	    genquery = parseFloat(select.value);
	    mapper(genquery);

    }

    function ancestorExpand(id, rootGen, rootNode) {

        startEvents();
        genquery = 1;
        mapper(1, id, rootGen, rootNode);

    }
    
    function fsAPI(options, callback, timeout) {
        // Generic function for FamilySearch API requests
        // options.url = API url (Required)
        // options.media = "xml" for xml, else JSON
        var xhttp;
        xhttp = new XMLHttpRequest();
        xhttp.open("GET", options.url);
        xhttp.setRequestHeader('Accept', 'application/' + (options.media || 'json'));
        if (timeout) {
            xhttp.timeout = timeout;
            xhttp.ontimeout = function () {
                typeof callback === 'function' && callback(undefined, "Operation Timed Out");
            }
        }
        xhttp.onload = function (e) {
            if (this.readyState === 4) {
                if (this.status === 200) { // works
                    queue = 1;
                    var status = this.statusText;
                    if (options.media == "xml") {
                        var result = this.responseXML.documentElement;
                    } else {
                        var result = JSON.parse(this.response);
                    }
                    typeof callback === 'function' && callback(result, status);
                } else if (this.status === 429) { // throttled
                    queue++;
                    setTimeout(function () {
                        fsAPI(options, callback);
                    }, 5 * 1000);
                } else if (this.status === 401) { // session expired
                    alert("Your session has expired. Please log in again.");
                    window.location = 'index.php?login=true';
                } else { // some other error
                    var status = this.statusText;
                    typeof callback === 'function' && callback(undefined, status);
                }
            }
        }
        xhttp.send();
    }

    function getPedigree(generations, id, rootGen, rootNode, callback) {
        rootGen || (rootGen = 0);
        rootNode || (rootNode = 0);
        id = id ? id: document.getElementById('personid').value;

        var url = urltemplate.parse(discovery['ancestry-query'].template).expand({
            generations: generations,
            person: id,
            access_token: accesstoken
        });

		fsAPI({ media: 'xml', url: url }, function (result, status) {
			if (status == "OK") {
			    var p = $(result).find("gx\\:person, person");
				for (var i = 0; i < p.length; i++) {
					var num = $(p[i]).find("gx\\:ascendancyNumber,ascendancyNumber");
					var n = parseFloat(num[0].textContent);
					var gen = Math.floor(log2(n));
					var node = n +Math.pow(2, gen) * (rootNode -1);
					if (!familyTree.getNode(gen +rootGen, node)) {
						familyTree.setNode({ id: p[i].getAttribute("id") }, (gen +rootGen), node);
					}
				}
				if (p.length == 1) {
				    alert('No parents found for person with ID: ' + id);
				} else if (p.length == 2) {
				    alert('Only one parent found for person with ID: ' + id);
				}
				typeof callback === 'function' && callback();
			} else {
			    loadingAnimationEnd();
			    var runButton = document.getElementById('runButton');
			    runButton.disabled = false;
			    runButton.className = 'button green';
			}
		});  
    }

    function mapper(generations,id,rootGen,rootNode) {
        getPedigree(generations,id,rootGen,rootNode, function () { 
            personReadLoop(function () {
    		    placeReadLoop(function () {
    			    setTimeout(function () {
    				    plotterLoop(function () {	
    					    completionEvents();
						    if (baseurl.indexOf('sandbox') == -1) {
    						    photoLoop();
						    }
					    });
				    },1);
                });
            });
        });
    }

	function personReadLoop(callback) {
		familyTree.IDDFS(function (leaf, cont) {
            var node = leaf.node;
            var gen = leaf.generation;
            if (leaf.value.isPlotted !== true) {
                personRead(leaf.value.id, function (result) {
                    result.generation = gen;
                    result.node = node;
                    if (node < Math.pow(2, gen -1)) {
                        result.isPaternal = true;
                    }
                    familyTree.setNode(result, gen, node)
                });
                cont();
            } else {
                cont();
            }
        }, function () { 
			typeof callback === 'function' && callback();
        });
    }

	function placeReadLoop(callback) {
		familyTree.IDDFS(function (leaf, cont) {
    		var node = leaf.node;
    		var gen = leaf.generation;
    		if (leaf.value.isPlotted !== true) {
    			getMeABirthPlace(gen, node);
				cont();
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

	function photoLoop(callback) {
		familyTree.IDDFS(function (tree, cont) {
    		var node = tree.node;
    		var gen = tree.generation;
    		if (!familyTree.getNode(gen, node).image) {
    			var ID = familyTree.getNode(gen, node).id;
    			getPhoto(ID, gen, node, cont);
    		}
		}, function () {
			typeof callback === 'function' && callback();
		});
	}

    function personRead(id, callback) {

        var url = discovery.persons.href + '/' + id + '?&access_token=' +accesstoken;
        fsAPI({
			url: url
			}, function (result, status) {
            if (status == "OK") {
                var person = result.persons[0];
                var display = person.display;
                var places = result.places;

                var birth = {
                	date: display.birthDate,
                	place: display.birthPlace
                }

                var death = {
                	date: display.deathDate,
                	place: display.deathPlace
                }

                if (person.living == true) {
                    death.date = "Living";
                }

                if (places) {
                    var placestring = places[0].names[0].value;
                } else {
                    var placestring = birth.place;
                }

                var personObject = {
                	name: display.name,
                	id: person.id,
                	birth: birth,
                	death: death,
                	gender: display.gender,
                	place: placestring
			}

				// Send reply
                callback(personObject);
            }
        });
    }

    function getPhoto(id, gen, node, callback) {
        var person = familyTree.getNode(gen, node);
        if (!person.image && !person.imageIcon) {
            var url = discovery.persons.href + '/' + id + '/memories?&type=photo&access_token=' + accesstoken;
            fsAPI({ url: url }, function (result, status) {
                if (status == "OK") {
                    var sourceDescriptions = result.sourceDescriptions;
                    if (sourceDescriptions[0]) {
                        var url = sourceDescriptions[0].links["image-icon"].href;
                        var bigurl = sourceDescriptions[0].links.image.href;
                        familyTree.getNode(gen, node).imageIcon = url;
                        familyTree.getNode(gen, node).image = bigurl;
                        typeof callback === 'function' && callback();
                    } else {
                        familyTree.getNode(gen, node).imageIcon = "none";
                        familyTree.getNode(gen, node).image = "none";
                        typeof callback === 'function' && callback();
                    }
                } else {
                    familyTree.getNode(gen, node).imageIcon = "none";
                    familyTree.getNode(gen, node).image = "none";
                    typeof callback === 'function' && callback();
                }
            }, 3000);
        }
    }

    function setPhoto(gen, node, timer) {
        setTimeout(function () {
            var portrait = document.getElementById('portrait');
            if (portrait) {
                var person = familyTree.getNode(gen, node);
                if (person.image && person.imageIcon) {
                    if (person.image == "none" && person.imageIcon == "none") {
                        portrait.onmouseover = function () { tooltip("Image unavailable", "portrait", 10); }
                    } else {
                        var imageHTML = "<img style='height:300px;' src='" + person.image + "'>";
                        portrait.setAttribute('src', person.imageIcon);
                        portrait.onmouseover = function () { tooltip(imageHTML, "portrait", 10); }
                    }
                } else {
                    setPhoto(gen, node, 50)
                }
            } else {
                setPhoto(gen, node, 50)
            }
        }, timer);
    }

    function getMeABirthPlace(gen, node, callback) {
        getPlaceAuthority(gen,node, function (result, status) {
            if (status == "OK") {
                familyTree.getNode(gen, node).birth.latlng = result;
                if (gen == 0 && node == 0) {
                    createMarker(familyTree.root());
                    familyTree.root().isPlotted = true;
                    typeof callback === 'function' && callback();
                } else {
                    typeof callback === 'function' && callback();
                }
            } else {
           //     console.log("Place authority fail. Try google.")
                getLatLng(familyTree.getNode(gen, node).birth.place, function (result, status) {
                    if (status == "OK") {
                        familyTree.getNode(gen, node).birth.latlng = result;
                        if (gen == 0 && node == 0) {
                            createMarker(familyTree.root());
                            familyTree.root().isPlotted = true;
                            typeof callback === 'function' && callback();
                        } else {
                            typeof callback === 'function' && callback();
                        }
                    } else {
                        getChildBirthPlace(gen, node, function (result) {
                            familyTree.getNode(gen, node).birth.latlng = result;
                            typeof callback === 'function' && callback();
                        });
                    }
                });   
            }
        });
    }

    function getLatLng(place, callback) {

        if (place) {
            setTimeout(function () {
                var geocoder = new google.maps.Geocoder();
                var georequest = {
                    address: place
                };

                geocoder.geocode(georequest, function (result, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        var latlng = result[0].geometry.location;
                        typeof callback === 'function' && callback(latlng, "OK");
                    } else {
                        if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                            //typeof callback === 'function' && callback(undefined, "LIMIT");
                //            console.log("Google throttled. Delay = " + delay + "ms. Place: " + place);
                            delay++;
                            getLatLng(place, callback);
                        } else {
                            typeof callback === 'function' && callback(undefined, "NONE");
                        }
                    }
                })
            }, delay);
        } else {
            typeof callback === 'function' && callback(undefined,"EMPTY");
        }
    }

    function getPlaceAuthority(gen, node, callback) {
        if (familyTree.getNode(gen, node).birth) {
            var place = familyTree.getNode(gen, node).birth.place;
            if (place) {
                var url = discovery.authorities.href + '/v1/place?place=' + place + "&locale=en&sessionId=" + accesstoken;
                    fsAPI({ media: 'xml', url: url }, function (result, status) {
                        if (status == "OK") {
                            var point = $(result).find("point");
                            if (point[0]) {
                                var lat = point[0].childNodes[0].textContent;
                                var lng = point[0].childNodes[1].textContent;
                                var latlng = new google.maps.LatLng(lat, lng);
                                typeof callback === 'function' && callback(latlng, status);
                            } else {
                                typeof callback === 'function' && callback(undefined, "NONE");
                            }
                        } else {
                            typeof callback === 'function' && callback(undefined, status);
                        }
                    });
            } else {
                typeof callback === 'function' && callback(undefined, "EMPTY");
            }
        } else {
            setTimeout(function () {
                getPlaceAuthority(gen, node, callback)
            }, 100);
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

        if (child.birth && parent.birth) {

            if (child.birth.latlng && parent.birth.latlng) {
                polymap([child.birth.latlng, parent.birth.latlng], color, node, gen, function (result) { //rgbToHex(74,96,255) rgbToHex(0, 176, 240)
                    createMarker(familyTree.getNode(gen, node));
                    familyTree.getNode(gen, node).isPlotted = true;
                });
            } else {
              //  console.log("Recursion waiting for " + child.name + " ... ");
                setTimeout(function () {
                    plotParent(gen, node);
                }, 1000);
            }
        } else {
            //console.log("Recursion waiting for " + child + " ... ");
            setTimeout(function () {
                plotParent(gen, node);
            }, 1000);
        }
            

    }

    function checkBounds(progenitors,loop) {

        var bounds = new google.maps.LatLngBounds;
        var currentBounds = map.getBounds();

        if (firstTime.plot == true) {
            createMarker(progenitors[0]);
            firstTime.plot = false;
        }

        for (var i = 0; i < progenitors.length; i++) {
            if (progenitors[i]) {
                if (progenitors[i].birth.latlng) {
                    if (currentBounds.contains(progenitors[i].birth.latlng) == false) {
                        currentBounds.extend(progenitors[i].birth.latlng);
                        map.fitBounds(currentBounds);
                    }
                }
            }
        }
       
        plotNextGeneration(progenitors,loop);
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
            familyTree.getNode(gen, node).polyline = geodesicPoly;

			var before = new Date();
            var step = 0;
            var numSteps = 200; //Change this to set animation resolution
            var timePerStep = 5; //Change this to alter animation speed
            var interval = setInterval(function () {
				var now = new Date();
				var elapsedTime = (now.getTime() - before.getTime())
				if (elapsedTime > timePerStep * numSteps) {
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

    function createMarker(p) {
        if (p) {
            if (p.birth.latlng) {

                if (p.gender == "Male") {
                    var icon = 'images/male' + p.generation + '.png?v=' + version;
                    var src = 'images/man.png?v=' + version;
                } else {
                    var icon = 'images/female' + p.generation + '.png?v=' + version;
                    var src = 'images/woman.png?v=' + version;
                }
                var scaleFactor = .5;
                var opts = {
                    map: map,
                    position: p.birth.latlng,
                    icon: {
                        url: icon,
                        origin: new google.maps.Point(0,0),
                        anchor: new google.maps.Point(36*scaleFactor*0.5,36*scaleFactor*0.5),
                        scaledSize: new google.maps.Size(36*scaleFactor,36*scaleFactor)
                    }
                }

                var mark = new google.maps.Marker(opts);
                createInfoBox(mark, p, icon, src);
                
                oms.addListener('click', function (mark, event) {
                    infoBoxClick(mark);
                });

                oms.addListener('spiderfy', function (mark) {
                    ib.close();
                });

                //google.maps.event.addListener(mark, 'mouseover', function () {
                //    tooltip("This is a test", "map", 10);
                //});

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
        mark.expandButton = "<div  style='height:38px;'>" +
                            "<div id='ebutton' onclick='familyTree.getNode(" + p.generation + "," + p.node + ").marker.isExpanded=true; ancestorExpand(\"" + p.id +
                            "\"," + p.generation + "," + p.node + "); ib.close();'>" +
                                "<div style='height: 38px; display:inline-block; vertical-align:top;'>" + self + "</div>" +
                                "<div style='height: 38px; display:inline-block; vertical-align:top; padding-top:7px; padding-left:3px; font-size: 16px; font-weight:bold;'>&#8594;</div>" +
                                "<div style='height: 38px; display:inline-block;'>" + father + "</br>" + mother + "</div>" +
                            '</div>';

        mark.deleteButton = "<div style='height: 38px; display:inline-block;'><img id='trashcan' src='images/trash.png?v=" + version +
                          "' style='width:25px; height:26px; margin-top: 12px;' onclick='deleteMarker(" + p.generation + "," + p.node + ") ;'</div>";

        mark.personID = p.id;
        var url = baseurl + '/tree/#view=ancestor&person=' + p.id;

        mark.infoBoxContent =
        "<div id='infow'>" +
            "<div class='person'>" +
                "<img id='portrait' class='profile-image' src='" + src + "'>" +
                "<div class='box'>" +
                    "<div class='xlarge'>" + p.name + "</div>" +
                    "<div class='large'>" + p.id +
                    "<img id='copyButton' src='images/copy.png?v=" + version + "' onclick='populateIdField(\"" + p.id + "\"); ib.close();'>" + '</div>' +
                "</div>" + "<img id='fsButton' class='profile-image' src='images/fs_logo.png?v=" + version + "' onclick='window.open(\"" + url + "\");'>" +
            "</div>" +
            "<div class='person'>" +
                "<div class='label'>BIRTH</div>" +
                "<div class='box'>" +
                    "<div class='large'>" + (p.birth.date || "") + "</div>" +
                    "<div class='small'>" + (p.birth.place || "") + "</div>" +
                "</div>" +
            "</div>" +
            "<div class='person'>" +
                "<div class='label'>DEATH</div>" +
                "<div class='box'>" +
                    "<div class='large'>" + (p.death.date || "") + "</div>" +
                    "<div class='small'>" + (p.death.place || "") + "</div>" +
                "</div>" +
            "</div>";
    }

    function infoBoxClick(mark) {
		if (baseurl.indexOf('sandbox') == -1) {
		    getPhoto(mark.personID, mark.generation, mark.node);
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
            var buttons = mark.expandButton +mark.deleteButton + '</div>';
        } else if (motherPlotted == true && fatherPlotted == true) { 
            var buttons = "";
        } else {
            var buttons = mark.expandButton + '</div>';
        }

        if (mark.isExpanded) {
            ib.setContent(mark.infoBoxContent + '</div>');
        } else {
            ib.setContent(mark.infoBoxContent +buttons + '</div>');
        }

        ib.open(map, mark);

		if (baseurl.indexOf('sandbox') == -1) {
			setPhoto(mark.generation, mark.node, 0);
		}

    }

    function deleteMarker(gen, node) {
        familyTree.getNode(gen,node).marker.setVisible(false);
        familyTree.getNode(gen,node).polyline.setVisible(false);
        familyTree.getChild(gen,node).marker.isExpanded = false;
        familyTree.getNode(gen,node).isPlotted = false;
        familyTree.setNode(undefined, gen, node);
        ib.close();
    }

    function getChildBirthPlace(gen, node, callback) {
        // Call this function if you can't find a person's birthplace
        // It will check if the person has children, and if so, returns the child's birthplace instead

        var child = familyTree.getChild(gen, node);
        if (child.birth) {
            if (child.birth.latlng) {
                typeof callback === 'function' && callback(child.birth.latlng);
            } else {
                setTimeout(function () {
                    getChildBirthPlace(gen, node, callback);
                }, 1000);
            }
        } else {
            setTimeout(function () {
                getChildBirthPlace(gen, node, callback);
            }, 1000);
        }

    }

    function loadingAnimationStart() {
        $(function () {
            $('#loading').show();
        });
        $(function () {
            $('#loading').activity({ segments: 10, width: 2, space: 1, length: 5, color: '#FFFFFF', speed: 1.5 });
        });
    }

    function loadingAnimationEnd() {
        $(function () {
            $('#loading').activity(false);
        });
        $(function () {
            $('#loading').hide();
        });
    }

    function clearOverlays() {
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
    	ib = new InfoBox({ contents: "", maxWidth: 0 });

        firstTime = {
            plot: true,
		    box: true
		};
        oms.clearMarkers();

        google.maps.event.addListener(ib, 'domready', function () {

            if (document.getElementById("ebutton")) {
                document.getElementById("ebutton").onmouseover = function () { tooltip("Plot the parents of this person", "ebutton", 10); }    
			}
            if (document.getElementById("trashcan")) { 
                document.getElementById("trashcan").onmouseover = function () { tooltip("Remove this pin and connector line", "trashcan", 10); }
            }
        document.getElementById("copyButton").onmouseover = function () { tooltip("Copy this ID to Root Person ID", "copyButton", 10); }
        document.getElementById("fsButton").onmouseover = function () { tooltip("View this person on FamilySearch.org", "fsButton", 10); }

        });
    }

    function populateIdField(id) {
        var personId = document.getElementById("personid");
        personId.value = id;
    }

    function populateUser() {
        if (!userID) {
            personRead("", function (currentUser) {
                populateIdField(currentUser.id);
                userID = currentUser.id;
                var username = document.getElementById("username");
                username.innerHTML = currentUser.name;
                ancestorgens();
            });
        } else {
            populateIdField(userID);
        }
    }

    function isEven(num) {
        // Returns true for even numbers and false for odd
        if (num / 2 == Math.round(num / 2)) {
            return true;
        } else {
            return false;
        }
    }

    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    function rgbToHex(r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    function log2(num) {
        // Base 2 logarithm of number
        return Math.log(num) / Math.log(2);
    }

    function startEvents() {
        delay = 1;
        loadingAnimationStart();
        var runButton = document.getElementById('runButton');
        runButton.disabled = true;
        runButton.className = 'button disabled';
    }

    function completionEvents() {
        markerCheckLoop(function () {
            loadingAnimationEnd();
            var runButton = document.getElementById('runButton');
            runButton.disabled = false;
            runButton.className = 'button green';
            if (firstTime.box == true) {
                infoBoxClick(familyTree.root().marker);
                firstTime.box = false;
            }
        });

    }

    function markerCheckLoop(callback) {
        familyTree.IDDFS(function (leaf, cont) {
            if (!leaf.value.marker) {
                setTimeout(function () {
                    markerCheckLoop(callback);
                  //  console.log("Test");
                }, 500);
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

    function tooltip(tip, el, v, h) {
        var vert;
        var horiz;
        if (v) { vert = v } else { vert = 0 }
        if (h) { horiz = h } else { horiz = 0 }
        var tt;
        var that = document.getElementById(el);

        var timeoutId = setTimeout(function () {
            tt = document.createElement('div');
            tt.setAttribute('id', 'tt');
            tt.innerHTML = tip;
            var rect = that.getBoundingClientRect();
            tt.style.top = (rect.bottom + vert) + 'px';
            tt.style.left = (rect.left + horiz) + 'px';

            document.body.appendChild(tt);

            var timer = setTimeout(function () {
                if (document.getElementById('tt')) {
                    var m = document.getElementById('tt');
                    document.body.removeChild(m);
                }
            }, 4000);

            that.onmouseout = function () {
                clearTimeout(timer);
                if (document.getElementById('tt')) {
                    var m = document.getElementById('tt');
                    document.body.removeChild(tt);
                }
            };
        }, 500);

        that.onmouseout = function () {
            clearTimeout(timeoutId);
            if (document.getElementById('tt')) {
                var m = document.getElementById('tt');
                document.body.removeChild(m);
            }
        };

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

    google.maps.event.addDomListener(window, 'load', initialize);
