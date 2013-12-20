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
var ib2;
var genquery;
var delay;
var baseurl;
var version;
var userID;
var familyTree;
var discovery;
var queue = 1;
var grouping;
var tooManyGens;
var title;
var fixColors;
var optionvar = false;
var isolate = false;
var onlyPins = false;
var treeVar = false;
var statVar = false;
var highlights = true;

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

            ancestorgens(3);
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
            document.getElementById("personid").onmouseover = function () { tooltip("Enter the ID for the root person","personid","",10); }
        }
        if (document.getElementById("populateUser")) {
            document.getElementById("populateUser").onmouseover = function () { tooltip("Set yourself as the root person", "populateUser","", 10); }
        }

        if (document.getElementById("genSelect")) {
            document.getElementById("genSelect").onmouseover = function () { tooltip("Select the number of generations to plot","genSelect","",10); }
        }

        if (document.getElementById("runButton")) {
            document.getElementById("runButton").onmouseover = function () { tooltip("Begin the plotting process", "runButton", "", 10); }
        }

        if (document.getElementById("feedbackbutton")) {
            document.getElementById("feedbackbutton").onmouseover = function () { tooltip("Leave some comments about your experience", "feedbackbutton", "", -75, -100); }
        }

        if (document.getElementById("donatebutton")) {
            document.getElementById("donatebutton").onmouseover = function () { tooltip("Help keep this site up and running", "donatebutton", "", -65, -65); }
        }
        
        if (document.getElementById("showTree")) {
            document.getElementById("showTree").onmouseover = function () { tooltip("Toggle pedigree information", "showTree", "", 10); }
        }
        
        if (document.getElementById("showStats")) {
            document.getElementById("showStats").onmouseover = function () { tooltip("Toggle country statistics", "showStats", "", 10); }
        }

        if (document.getElementById("showlines")) {
            document.getElementById("showlines").onmouseover = function () { tooltip("Toggle connecting lines", "showlines", "", 10); }
        }

        if (document.getElementById("highlight")) {
            document.getElementById("highlight").onmouseover = function () { tooltip("Toggle trace back to root person", "highlight", "", 10); }
        }

        if (document.getElementById("isolate")) {
            document.getElementById("isolate").onmouseover = function () { tooltip("Toggle isolation of trace", "isolate", "", 10); }
        }

        if (accesstoken) {
            discoveryResource();
        }

        google.maps.event.addListener(map, 'click', function () {
        	ib.close();
			//restoreColors();
        });
    }

    function ancestorgens(gens) {

        clearOverlays();
        startEvents();
	    var select = document.getElementById('genSelect');
	    genquery = (gens || parseFloat(select.value));
	    tooManyGens = false;
	    if (genquery > 8) {
	        tooManyGens = true;
	    }
	    mapper(genquery);

    }

    function expandAncestor(id, rootGen, rootNode, gens) {
        startEvents();
        var select = document.getElementById('genSelect');
        genquery = (gens || parseFloat(select.value));
        tooManyGens = false;
        if (genquery > 8) {
            tooManyGens = true;
        }
        mapper(genquery, id, rootGen, rootNode);
    }

    function ancestorExpand(id, rootGen, rootNode,gens,where,callback) {

        startEvents();
        var select = document.getElementById('genSelect');
        genquery = (gens || parseFloat(select.value));
        mapper(genquery, id, rootGen, rootNode,where,callback);

    }
    
    function fsAPI(options, callback, timeout) {
        // Generic function for FamilySearch API requests
        // options.url = API url (Required)
        // options.media = "xml" for xml, else JSON
        var xhttp;
        xhttp = new XMLHttpRequest();
        if (options.media == "img" ) {
          xhttp.open("HEAD", options.url);
          xhttp.setRequestHeader('Accept', '*/*');
        } else {
          xhttp.open("GET", options.url);
          xhttp.setRequestHeader('Accept', 'application/' + (options.media || 'json'));
        }
        if (timeout) {
            xhttp.timeout = timeout;
            xhttp.ontimeout = function () {
                typeof callback === 'function' && callback(undefined, "Operation Timed Out");
            }
        }
        xhttp.onload = function (e) {
            if (this.readyState === 4) {
                if (this.status === 204 && options.media == "img") {
                  queue = 1;
                  var status = this.statusText;
                  var result = '';
                  typeof callback === 'function' && callback(result, status);
                } else if (this.status === 200) { // works
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
        
        id = id ? id : document.getElementById('personid').value;
        if (generations > 8) {
            generations = generations - 8;
        }
        var url = urltemplate.parse(discovery['ancestry-query'].template).expand({
            generations: generations,
            person: id,
            access_token: accesstoken,
			personDetails: true
        });

		fsAPI({ url: url }, function (result, status) {
			if (status == "OK") {
			    var p = result.persons;
				for (var i = 0; i < p.length; i++) {
				    var n = parseFloat(p[i].display.ascendancyNumber);
					var gen = Math.floor(log2(n));
					var node = n + Math.pow(2, gen) * (rootNode - 1);
                    p[i].generation = gen+rootGen;
                    p[i].node = node;
					if (node < Math.pow(2, gen+rootGen -1)) {
                        p[i].isPaternal = true;
					}
					if (p[i].living == true) {
						p[i].display.deathDate = "Living";
					}
					if (!familyTree.getNode(gen +rootGen, node)) {
						familyTree.setNode(p[i], (gen + rootGen), node);
						delete familyTree.getNode(gen +rootGen, node).display.ascendancyNumber;
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

			    var optionsButton = document.getElementById('optionsButton');
			    optionsButton.disabled = false;
			    if (optionvar == true) {
			        optionsButton.className = 'button yellow off';
			    } else {
			        optionsButton.className = 'button yellow';
			    }
			}
		});  
    }

    function mapper(generations, id, rootGen, rootNode, where, callback) {
        rootGen || (rootGen = 0);
        rootNode || (rootNode = 0);

        document.getElementById('loadingMessage').textContent = 'Retrieving FamilySearch data...';
        getPedigree(generations, id, rootGen, rootNode, function () {
            if (where == 'pedigree') {
                typeof callback === 'function' && callback();
            }
            //personReadLoop(function () {
            //    if (where == 'person') {
            //        typeof callback === 'function' && callback();
            //    }
                placeReadLoop(function () {
                    if (where == 'place') {
                        typeof callback === 'function' && callback();
                    }

                    document.getElementById('loadingMessage').textContent = 'Plotting...';
                    plotterLoop(function () {
    		            if (where == 'plot') {
    		                typeof callback === 'function' && callback();
    		            }
    		            completionEvents(rootGen, rootNode, function () {
    		                addOMSListeners();
    		                if (where == 'done') {
    		                    typeof callback === 'function' && callback();
    		                }
    		                countryLoop(function (group) {
    		                    grouping = group;
    		                    listLoop();
    				            //if (baseurl.indexOf('sandbox') == -1) {
    				            //    photoLoop();
    				            //}
    				        });
    				    });
					});
                });
            //});
        });
    }

    function addOMSListeners() {
        oms.clearListeners('click');
        oms.addListener('click', function (mark, event) {
            infoBoxClick(mark);
        });
        oms.clearListeners('spiderfy');
        oms.addListener('spiderfy', function (mark) {
            ib.close();
            //restoreColors();
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

	function countryLoop(callback) {
	    var max = 0;
	    var group = {};
	    familyTree.IDDFS(function (tree, cont) {
	        var node = tree.node;
	        var gen = tree.generation;
	        var value = familyTree.getNode(gen, node).display.birthCountry;
	        var n = group[value] = 1 - -(group[value] | 0);
	        if (n > max) { max = n; }
	        cont();
	    }, function () {
	        var div = document.getElementById('countryStats');
	        div.innerHTML = '';
	        b = document.createElement('b');
	        b.textContent = 'Country Statistics';
	        div.appendChild(b);
	        //div.innerText = 'Country Stats';
	        div.appendChild(document.createElement('br'));
	        for (var key in group) {
	            if (group.hasOwnProperty(key)) {
	                if (key !== 'undefined') {
	                    var d = document.createElement('span');
	                    d.textContent = key + ': ' + group[key];
	                    var br = document.createElement('br');
	                    div.appendChild(d);
	                    div.appendChild(br);
	                }
	            }
	        }
	        typeof callback === 'function' && callback(group);
	    });
	}

	function listLoop() {
	    //if (document.getElementById('pedigreeChart')) {
	        document.getElementById('pedigreeChart').innerHTML = '';
	    //} else {
	    //    var br = document.createElement('br');
	    //    var div = document.createElement('div');
	    //    //div.className = 'hoverdiv';
	    //    div.setAttribute('id', 'pedigreeWrapper');

	    //    var div2 = document.createElement('div');
	    //    div2.setAttribute('id', 'pedigreeChart');
	    //    div.appendChild(div2);
	    //    //document.getElementById('optionDiv').appendChild(br);
	    //    document.getElementById('optionDiv').appendChild(div);
	    //}

	    var rootElement = document.createElement("ul");
	    rootElement.className = "collapsibleList";
	    rootElement.setAttribute("id", "-1,0");
	    document.getElementById("pedigreeChart").appendChild(rootElement);
	    familyTree.root();
	    familyTree.DFS(function (person, cont) {
	        var li = document.createElement("li");
	        li.innerHTML = HtmlEncode(person.value.display.name) + ' (' + HtmlEncode(person.value.display.lifespan) + ')';
	        if (familyTree.getFather(person.generation, person.node) || familyTree.getMother(person.generation, person.node)) {
	            var lastGen = false;
	            if (person.value.display.gender == "Female") {
	                li.className = person.value.display.gender + ' lastChild';
	            } else {
	                li.className = person.value.display.gender;
	            }
	        } else {
	            var lastGen = true;
	            if (person.value.display.gender == "Female") {
	                li.className = person.value.display.gender + ' lastGen lastChild';
	            } else {
	                li.className = person.value.display.gender + ' lastGen';
	            }
	        }
	        
	        if (person.generation == 0) {
	            li.className = li.className + ' Root';
	        }

	        var ul = document.createElement("ul");
	        ul.setAttribute("id", person.generation + ',' + person.node );

	        if (lastGen == false) {
	            li.appendChild(ul);
	        }

	        if (person.value.display.gender == "Male") {
	            var childNode = person.node / 2;
	        } else {
	            var childNode = (person.node - 1) / 2;
	        }

	        if (person.generation == 0) {
	            childNode = 0;
	        }

	        var childUl = document.getElementById((person.generation - 1) + ',' + childNode );
	        childUl.appendChild(li);
	    });
	    //CollapsibleLists.apply();
	    CollapsibleLists.applyTo(document.getElementById('-1,0'));
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
                    callback(object);
                }
        });
    }

    function getPhoto(id, gen, node, callback) {
        var person = familyTree.getNode(gen, node);
        if (!person.image) {
            var url = urltemplate.parse(discovery['person-portrait-template'].template).expand({
                pid: id,
                access_token: accesstoken,
                default: person.imageIcon
            });

            familyTree.getNode(gen, node).image = url;
            typeof callback === 'function' && callback(url);
            //var url = discovery.persons.href + '/' + id + '/portrait?access_token=' + accesstoken;
            //fsAPI({ url: url, media: 'img' }, function (result, status) {
            //    if (status == "No Content") {
            //        //familyTree.getNode(gen, node).imageIcon = url;
            //        familyTree.getNode(gen, node).image = url;
            //        typeof callback === 'function' && callback(result);
            //    } else {
            //        //familyTree.getNode(gen, node).imageIcon = "none";
            //        familyTree.getNode(gen, node).image = url;
            //        typeof callback === 'function' && callback(result);
            //    }
            //}, 3000);
        } else {
            typeof callback === 'function' && callback('');
        }
    }

    function setPhoto(gen, node, timer) {
        setTimeout(function () {
            var portrait = document.getElementById('portrait');
            if (portrait) {
                var person = familyTree.getNode(gen, node);
                if (person.image && person.imageIcon) {
                    if (person.image.indexOf('rootsmapper') != -1) {
                        portrait.onmouseover = function () { tooltip("Image unavailable", "portrait", "", 10); }
                    } else {
                        var imageHTML = "<img style='max-height:300px;' src='" + person.image + "'>";
                        //var imageHTML = "<img src='" + person.image + "'>";
                        portrait.setAttribute('src', person.image);
                        portrait.onmouseover = function () { tooltip(imageHTML, "portrait", 600000, 10); }
                    }
                } else {
                    setPhoto(gen, node, 50)
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
					var runButton = document.getElementById('runButton');
					runButton.disabled = false;
					runButton.className = 'button green';

					var optionsButton = document.getElementById('optionsButton');
					optionsButton.disabled = false;
					if (optionvar == true) {
					    optionsButton.className = 'button yellow off';
					} else {
					    optionsButton.className = 'button yellow';
					}
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
                                var runButton = document.getElementById('runButton');
                                runButton.disabled = false;
                                runButton.className = 'button green';

                                if (optionvar == true) {
                                    optionsButton.className = 'button yellow off';
                                } else {
                                    optionsButton.className = 'button yellow';
                                }
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
                        typeof callback === 'function' && callback({latlng: latlng, cont: cont}, "OK");
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
                var url = discovery.authorities.href + '/v1/place?place=' + place + "&filter=true&locale=en&sessionId=" + accesstoken;
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

                
                p.imageIcon = src;
                var mark = new google.maps.Marker(opts);
                createInfoBox(mark, p, icon, src);
                
                //oms.addListener('click', function (mark, event) {
                //    infoBoxClick(mark);
                //});

                //oms.addListener('spiderfy', function (mark) {
                //	ib.close();
				//	//restoreColors();
                //});

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
        mark.expandButton = "<div  style='height:38px;'>" +
                            "<div id='ebutton' onclick='familyTree.getNode(" + p.generation + "," + p.node + ").marker.isExpanded=true; expandAncestor(\"" + p.id +
                            "\"," + p.generation + "," + p.node + ",1); ib.close();'>" +
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
                "<div class='box44'>" +
                    "<img id='portrait' class='profile-image' src='" + src + "'>" +
                "</div>" +
                "<div class='box'>" +
                        "<a class='xlarge' id='fsButton' href='" + url + "' target='_blank'>" + HtmlEncode(p.display.name) + "</a>" +
                    "<div class='large'>" + 
                        p.id +
                        "<img id='copyButton' src='images/copy.png?v=" + version + "' onclick='populateIdField(\"" + p.id + "\"); ib.close();'>" + "</div>" +
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

    function infoBoxClick(mark) {
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
			//setPhoto(mark.generation, mark.node, 0);
		}

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

    function toggleTree(callback) {
        if (treeVar == false) {
            document.getElementById('countryStats').style.display = 'none';
            document.getElementById('showStats').className = 'button yellow';
            statVar = false;
            document.getElementById('pedigreeWrapper').style.display = 'list-item';
            document.getElementById('showTree').className = 'button yellow off';
            treeVar = true;
        } else {
            document.getElementById('pedigreeWrapper').style.display = 'none';
            document.getElementById('showTree').className = 'button yellow';
            treeVar = false;
        }
    }

    function toggleStats(callback) {
        if (statVar == false) {
            document.getElementById('pedigreeWrapper').style.display = 'none';
            document.getElementById('showTree').className = 'button yellow';
            treeVar = false;
            document.getElementById('countryStats').style.display = 'block';
            document.getElementById('showStats').className = 'button yellow off';
            statVar = true;
        } else {
            document.getElementById('countryStats').style.display = 'none';
            document.getElementById('showStats').className = 'button yellow';
            statVar = false;
        }
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

	function deleteMarker(gen, node) {
		familyTree.getNode(gen, node).marker.setVisible(false);
		familyTree.getNode(gen, node).polyline.setVisible(false);
		familyTree.getChild(gen, node).marker.isExpanded = false;
		familyTree.getNode(gen, node).isPlotted = false;
		familyTree.setNode(undefined, gen, node);
		ib.close();
		countryLoop(function (group) {
		    listLoop();
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
        document.title = "*" + title;
        document.getElementById('loadingDiv').style.visibility = 'visible';
        $(function () {
            $('#loading').show();
        });
        $(function () {
            $('#loading').activity({ segments: 10, width: 2, space: 1, length: 5, color: '#FFFFFF', speed: 1.5 });
        });
    }

    function loadingAnimationEnd() {
        document.title = title;
        $(function () {
            $('#loading').activity(false);
        });
        $(function () {
            $('#loading').hide();
            document.getElementById('loadingDiv').style.visibility = 'hidden';
        });
    }

    function clearOverlays() {

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
    	ib = new InfoBox({ contents: "", maxWidth: 0, pixelOffset: new google.maps.Size(9, 9) });
    	ib2 = new InfoBox({ contents: "", maxWidth: 0, closeBoxURL: "", pixelOffset: new google.maps.Size(9, -37) });

        firstTime = {
            plot: true,
		    box: true
		};

        google.maps.event.addListener(ib, 'domready', function () {

            if (document.getElementById("ebutton")) {
                document.getElementById("ebutton").onmouseover = function () { tooltip("Plot the parents of this person", "ebutton", "", 10); }
			}
            if (document.getElementById("trashcan")) { 
                document.getElementById("trashcan").onmouseover = function () { tooltip("Remove this pin and connector line", "trashcan", "", 10); }
            }
            document.getElementById("copyButton").onmouseover = function () { tooltip("Copy this ID to Root Person ID", "copyButton", "", 10); }
            document.getElementById("fsButton").onmouseover = function () { tooltip("View this person on FamilySearch.org", "fsButton", "", 10); }

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

        if (optionvar == true) {
            showOptions();
        }
        var optionsButton = document.getElementById('optionsButton');
        optionsButton.disabled = true;
        optionsButton.className = 'button disabled';
    }

    function completionEvents(rootGen, rootNode, callback) {
        
        markerCheckLoop(function () {
            if (genquery > 8) {
                var origins = genquery;
                familyTree.IDDFS(function (leaf, cont) {
                    var expandGen = origins + rootGen - 8;

                    if (leaf.generation == expandGen && leaf.node > rootNode * Math.pow(2, origins-8) - 1 && leaf.node < rootNode * Math.pow(2, origins-8) + Math.pow(2, origins-8)) {
                        //if (leaf.node == rootNode * Math.pow(2, origins - 8) + Math.pow(2, origins - 8) - 1) {
                            ancestorExpand(leaf.value.id, leaf.generation, leaf.node, 8, 'done', function () {
                                cont();
                            });
                        //} else {
                        //    ancestorExpand(leaf.value.id, leaf.generation, leaf.node, 8, 'plot', function () {
                        //        cont();
                        //    });
                        //}
                    } else {
                        cont();
                    }
                }, function () {
                    loadingAnimationEnd();
                    var runButton = document.getElementById('runButton');
                    runButton.disabled = false;
                    runButton.className = 'button green';

                    var optionsButton = document.getElementById('optionsButton');
                    optionsButton.disabled = false;
                    if (optionvar == true) {
                        optionsButton.className = 'button yellow off';
                    } else {
                        optionsButton.className = 'button yellow';
                    }
                    if (firstTime.box == true) {
                        infoBoxClick(familyTree.root().marker);
                        firstTime.box = false;
                    }
                    typeof callback === 'function' && callback();
                });
            } else {
                if (tooManyGens == false) {
                    loadingAnimationEnd();
                    var runButton = document.getElementById('runButton');
                    runButton.disabled = false;
                    runButton.className = 'button green';

                    var optionsButton = document.getElementById('optionsButton');
                    optionsButton.disabled = false;
                    if (optionvar == true) {
                        optionsButton.className = 'button yellow off';
                    } else {
                        optionsButton.className = 'button yellow';
                    }
                    if (firstTime.box == true) {
                        infoBoxClick(familyTree.root().marker);
                        firstTime.box = false;
                    }
                }
                typeof callback === 'function' && callback();
            }
        });

    }

    function markerCheckLoop(callback) {
        familyTree.IDDFS(function (leaf, cont) {
            if (!leaf.value.marker) {
                setTimeout(function () {
                    markerCheckLoop(callback);
                  //  console.log("Test");
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

    function tooltip(tip, el, stay, v, h) {
        var vert;
        var horiz;
        stay || (stay = 4000);
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
            }, stay);

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

    google.maps.event.addDomListener(window, 'load', initialize);
