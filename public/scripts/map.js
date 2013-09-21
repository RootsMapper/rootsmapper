var map;
var oms;
var polyarray = [];
var markarray = [];
var infoarray = [];
var accesstoken;
var infowindow = new google.maps.InfoWindow();
var firstTime = true;
var genquery;
var nSearches;
var delay = 100;
var baseurl;

    function getLocationPoints(progenitors) {
        var len = progenitors.length;
        
        var tryagain = true;


        asyncLoop(len, function (loop) {

            var idx = loop.iteration();

            if (progenitors[idx].birth.placequery) {
                var place = progenitors[idx].birth.placequery;
            } else {
                var place = progenitors[idx].birth.place;
            }
            
            setTimeout(function () {
                getLatLng(place, function (result) {

                    progenitors[idx].birth.latlng = result;
                    if (result == "empty") {
                        delay++
                        loop.prev();
                        loop.next();                        
                    } else if (result == "other") { 
                        var loc = place.split(",");

                        if (tryagain == true) { // Try one more query with City,Country as search text
                            progenitors[idx].birth.placequery = loc[0] + "," + loc[loc.length];
                            tryagain = false;
                            loop.prev();
                            loop.next();
                        } else {
                            if (isEven(idx + 1)) { // male
                                progenitors[idx].birth.latlng = locations[(idx + 1) / 2 - 1].latlng;
                            } else { // female
                                progenitors[idx].latlng = locations[idx / 2 - 1].latlng;
                            }
                            tryagain = true;
                            callLoopNext(loop, progenitors)
                        }
                    } else {
                        callLoopNext(loop, progenitors)
                    }
                })
            }, delay);              
     
        }, function () { });

    }

    function callLoopNext(loop,progenitors) {
        var idx = loop.iteration();

        if ( log2(idx+2) == Math.round(log2(idx + 2)) ) { // Finished a complete generation
            if (idx !== 0) {
                nSearches++;
                var completeGens = "";
                if (log2(nSearches + 1) == Math.round(log2(nSearches + 1))) {
                    //completeGens = log2(nSearches + 1) + " generations."
                }
                console.log("Location search completed " + nSearches + " time(s). " + completeGens);
                plotEmUp(progenitors,loop);
            } else {
                loop.next();
            }
        } else {
            loop.next();
        }
        
    }

    function plotEmUp(progenitors,loop) {
        //map.setCenter(placearray[0]);

        var bounds = new google.maps.LatLngBounds;
        var currentBounds = map.getBounds();

        if (firstTime == true) {
            makeInfoWindow(progenitors, 0);
            firstTime = false;
        }

        var num = 0;
        for (var i = 0; i < progenitors.length; i++) {
            if (progenitors[i].birth.latlng) {
                num++
            }
        }

        for (var i = 0; i < num; i++) {
            if (progenitors[i].birth.latlng) {
                bounds.extend(progenitors[i].birth.latlng);
                if (currentBounds.contains(progenitors[i].birth.latlng) == false) {
                    currentBounds.extend(progenitors[i].birth.latlng);
                    map.fitBounds(currentBounds);
                }
            }
        }
       
        pedigree(progenitors,loop);
    }


    function makeInfoWindow(progenitors,i) {
        var opts = {
            map: map,
            position: progenitors[i].birth.latlng,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillOpacity: 0.5,
                fillColor: 'ff0000',
                strokeOpacity: 1.0,
                strokeColor: 'fff000',
                strokeWeight: 1.0,
                scale: 10 //pixels
            }
        }

        var mark = new google.maps.Marker(opts);
        var gen = log2(progenitors.length+1);
        var expandButton = "";
        if (i + 1 > Math.pow(2, gen - 1) - 1) {
            var expandButton = "<button onclick='ancestorExpand(\"" + progenitors[i].id + "\")'>" + 'EXPAND</button>';
        }

        var contents = "<div id='infow'>" + progenitors[i].name + '<br/>' +
            progenitors[i].birth.place + '<br/>' +
            progenitors[i].birth.date + '<br/>' +
            expandButton +
            "<button onclick='populateIdField(\"" + progenitors[i].id + "\")'>" + 'START HERE</button>' +
            '</div>';
        mark.content = contents;

        google.maps.event.addListener(mark, 'click', function (event) {
            var infoOptions = {
                maxWidth: 300
            };
            infowindow.setContent(this.content);
            //infowindow.constructor(infoOptions);
            infowindow.open(map, this);
        });

        oms.addListener('click', function (event) {
            infowindow.setContent(this.content);
            infowindow.open(map, this);
        });

        oms.addMarker(mark);
        markarray.push(mark);
        infoarray.push(infowindow);
    }

    function pedigree(progenitors, loop) {
        var idx = loop.iteration();

        // Number of generations completed so far
        var gen = log2(idx + 2) - 1;

        var tgen = Math.round(log2(progenitors.length + 1) - 1);
        var f = 64 / Math.pow(2, genquery + 1);
        
        
        //for (var k = 2; k > 0; k--) {

            var paths = Math.pow(2, gen);
            var p = Math.pow(2, gen) / Math.pow(2, genquery) * 64;
            var p = Math.round(gen / genquery * 64);

            for (var j = paths - 1; j < 2 * paths - 1; j++) {
                var patharray = new Array();
                patharray[1] = progenitors[j].birth.latlng;
                var cdx = j;

                
                if (isEven(j + 1)) {
                    // male
                    cdx = (j + 1) / 2 - 1; // child of male
                    patharray[0] = progenitors[cdx].birth.latlng;
                } else {
                    // female ancestor
                    cdx = (cdx) / 2 - 1; // child of female
                    patharray[0] = progenitors[cdx].birth.latlng;
                }
                
                if (j < 3 * paths / 2 - 1) {
                    // Paternal ancestor
                    var q = 50;
                } else {
                    // Maternal ancestor
                    var q = 150;
                }

                if (isEven(j + 1)) {
                    polymap(patharray, rgbToHex(q+p,q+p,255), 1 * (tgen + 1 - gen), j,function (result) {
                        makeInfoWindow(progenitors, result);
                        if (result == 2 * paths - 2) {
                            loop.next()
                        }
                    });
                } else {
                    polymap(patharray, rgbToHex(255,q+p,q+p), 1 * (tgen + 1 - gen), j, function (result) {
                        makeInfoWindow(progenitors, result);
                        if (result == 2 * paths - 2) {
                            loop.next()
                        }
                    });
                }
            }
        //}
    }

    function polymap(coords, color, thick,idx,callback) {

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
            polyarray.push(geodesicPoly);

            var step = 0;
            var numSteps = 250; //Change this to set animation resolution
            var timePerStep = 1; //Change this to alter animation speed
            var interval = setInterval(function () {
                step += 1;
                if (step > numSteps) {
                    clearInterval(interval);
                    callback(idx);
                } else {
                    var are_we_there_yet = google.maps.geometry.spherical.interpolate(c1, c2, step / numSteps);
                    geodesicPoly.setPath([c1, are_we_there_yet]);
                }
            }, timePerStep);
        } else {
            callback(idx);
        }

	$(function() {
		$('#loading').activity(false);
        });
	$(function() {
    		$('#loading').hide();
 	 });

    }

    function getLatLng(place,callback) {

        if (place) {
            var geocoder = new google.maps.Geocoder();
            var georequest = {
                address: place
            };

            //setTimeout( function () {

            geocoder.geocode(georequest, function (result, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    var latlng = result[0].geometry.location;
                    callback(latlng);
                } else {
                    if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                        callback("empty");
                    } else {
                        callback("other");
                    }
                }
            })
        } else {
            callback(place);
        }
    }

    function asyncLoop(iterations, func, callback) {
        var index = 0;
        var done = false;
        var loop = {
            next: function () {
                if (done) {
                    return;
                }

                if (index < iterations) {
                    index++;
                    func(loop);

                } else {
                    done = true;
                    callback();
                }
            },

            prev: function () {
                index--;
            },

            iteration: function () {
                return index - 1;
            },

            break: function () {
                done = true;
                callback();
            }
        };
        loop.next();
        return loop;
    }

    function initialize() {
        //var nav = window.navigator;
        //var geoloc = nav.geolocation;
        //geoloc.getCurrentPosition(successCallback);

        var lat = 30.0;
        var lng = -30.0;
        var place = new google.maps.LatLng(lat, lng);
        var mapOptions = {
            zoom: 3,
            center: place
        }
        map = new google.maps.Map(document.getElementById('mapdisplay'), mapOptions);
        oms = new OverlappingMarkerSpiderfier(map, { keepSpiderfied: true, nearbyDistance: 40 });

        populateUser();
        //var selectMode = document.getElementsByName('mode');
        //selectMode[0].checked = true;
    }

google.maps.event.addDomListener(window, 'load', initialize);

    function getSessionId(gen) {

                ancestors(accesstoken,gen);

    }

    function ancestors(id,gen,root) {
        var generations = gen;

        
        if (root) {
            personId = root;
            // if empty, use user default
        } else {
            var querythis = document.getElementById('personid');
            var personId = querythis.value;
        }

        var url = baseurl + "pedigree/" + personId + "?ancestors=" + generations + "&properties=all&sessionId=" + id;

		var xhttp;
		xhttp=new XMLHttpRequest();
		xhttp.open("GET",url);
		xhttp.send();

		xhttp.onload = function (e) {
		    if (xhttp.readyState === 4) {
		        if (xhttp.status === 200) {
		            console.log("Pedigree result returned successful.");

		            var xmlDocument = xhttp.responseXML.documentElement;
		          
                        var persons = xmlDocument.getElementsByTagName("person");
                        var tags = new Array();
                
                        tags[0] = persons[0].getAttribute("id");
                        for (var i = 0; i < Math.pow(2, generations) - 1; i++) {
                    
                            var parents = persons[i].getElementsByTagName("parent");
                            if (parents.length > 1) {
                                tags[(i + 1) * 2 - 1] = parents[0].getAttribute("id");
                                tags[(i + 1) * 2] = parents[1].getAttribute("id");
                            } else {
                                //tags[(i + 1) * 2 - 1] = "";
                                //tags[(i + 1) * 2] = "";
                            }
                            
                        }

                        getLocations(tags, id);
		        } else {
		            console.error(xhttp.statusText);
		        }
            }
		};
    }

    function getLocations(persons,sessionId) {
        var people = persons.length;
        var locations = new Array();
        var progenitors = new Array();

        asyncLoop(people, function (loop) {

            var idx = loop.iteration();
            var id = persons[idx];
            if (id) {
                personRead(id, function (result) {
                    progenitors[idx] = result;
                    //progress(idx, progenitors, loop)
                    loop.next();
                });
            } else {
                //progress(idx, progenitors, loop)
                loop.next();
            }


                

                
            },
        function () {
	    getLocationPoints(progenitors);
                    }
        );
    }

    function progress(idx,progenitors,loop) {
        if (log2(idx + 2) == Math.round(log2(idx + 2))) {
            var thisGen = log2(idx + 2)-1; // 0, 2, 6
            var lastGen = Math.pow(2, thisGen - 1) - 1;
            var lastGen = Math.pow(2, thisGen) - Math.pow(2, thisGen - 1) - 1;

            if (thisGen == 1) {
                lastGen = 0;
            }
            if (idx == 0) {
                loop.next()
            } else {
                for (var i = lastGen; i < Math.pow(2, thisGen)-1 ; i++) {
                    //var prog = progenitors.slice(lastGen, idx + 1);
                    var prog = new Array();
                    prog[0] = progenitors[i];
                    prog[1] = progenitors[(i + 1) * 2 - 1];
                    prog[2] = progenitors[(i + 1) * 2];
                    getLocationPoints(prog);
                    
                }
                loop.next();
            }
        } else {
            loop.next();
        }
    }

    function asyncLoop(iterations, func, callback) {
        var index = 0;
        var done = false;
        var loop = {
            next: function () {
                if (done) {
                    return;
                }

                if (index < iterations) {
                    index++;
                    func(loop);

                } else {
                    done = true;
                    callback();
                }
            },

            prev: function () {
                index--;
            },

            iteration: function () {
                return index - 1;
            },

            break: function () {
                done = true;
                callback();
            }
        };
        loop.next();
        return loop;
    }

    function locationPromise(id, sessionId, callback) {

        var url = baseurl + "person/" + id + "?&events=standard&sessionId=" + sessionId;

        if (id !== "") {
            var xhttp;
            xhttp = new XMLHttpRequest();
            xhttp.open("GET", url);
            xhttp.send();

            xhttp.onload = function (e) {
                if (xhttp.readyState === 4) {
                    if (xhttp.status === 200) {
                      //  console.log(xhttp.responseText);
                        var xmlDocument = xhttp.responseXML.documentElement;

                        var locString = "";
                        var name = "";
                        var date = "";
                        var events = xmlDocument.getElementsByTagName("events");
                        var fullText = xmlDocument.getElementsByTagName("fullText");
                        if (events[0]) {


                            var value = events[0].getElementsByTagName("value");

                            if (value[0].getAttribute("type") == "Birth") {

                                var dates = value[0].getElementsByTagName("date");
                                var places = value[0].getElementsByTagName("place");

                                if (places[0]) {
                                    if (places[0].childNodes[1]) {
                                        var locString = places[0].childNodes[1].textContent;
                                    } else {
                                        var locString = places[0].childNodes[0].textContent;
                                    }
                                }
                                if (dates[0]) {
                                    if (dates[0].childNodes[1]) {
                                        var date = dates[0].childNodes[1].textContent;
                                    } else {
                                        var date = dates[0].childNodes[0].textContent;
                                    }
                                }
                            }
                        }
                        if (fullText[0]) {
                            var name = fullText[0].textContent;
                        }
                        var obj = {
                            name: name,
                            place: locString,
                            date: date,
                            id: id
                        }
                        callback(obj);

                    } else {
                        console.error(xhttp.statusText);
                    }
                }
            };
        } else {
            var obj = {
                name: "",
                place: "",
                date: "",
                id: ""
            }
            callback(obj);
        }

    }



function ancestorgens() {
    clearOverlays();
    $(function() {
    	$('#loading').show();
    });
    $(function() {
		$('#loading').activity({segments: 12, width: 5.5, space: 6, length: 13, color: '#252525', speed: 1.5});
    });
    var start = document.getElementById('start');
    genquery = parseFloat(start.value);
    getSessionId(genquery);

}

function clearOverlays() {
    for (var i = 0; i < markarray.length; i++) {
        markarray[i].setMap(null);
    }

    for (var i = 0; i < polyarray.length; i++) {
        polyarray[i].setMap(null);
    }

    markarray.length = 0;
    polyarray.length = 0;
    firstTime = true;
    nSearches = 0;
    oms.clearMarkers();

}

function ancestorExpand(id) {
    $(function () {
        $('#loading').show();
    });
    $(function () {
        $('#loading').activity({ segments: 12, width: 5.5, space: 6, length: 13, color: '#252525', speed: 1.5 });
    });
    var start = document.getElementById('start');
    var gen = parseFloat(start.value);
    ancestors(accesstoken, 1,id);

}

    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    function rgbToHex(r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    function personRead(id,callback) {

        var url = baseurl + "person/" + id + "?&events=standard&sessionId=" + accesstoken;

        var xhttp;
        xhttp = new XMLHttpRequest();
        xhttp.open("GET", url);
        xhttp.send();

        xhttp.onload = function (e) {
            if (xhttp.readyState === 4) {
                if (xhttp.status === 200) {
                    
                    var xmlDocument = xhttp.responseXML.documentElement;
                    
                    // Get full name of individual
                    var fullText = xmlDocument.getElementsByTagName("fullText");
                    if (fullText[0]) {
                        var name = fullText[0].textContent;
                    }

                    // Get user id if none was supplied
                    if (id == "") {
                        var person = xmlDocument.getElementsByTagName("person");
                        if (person[0]) {
                            id = person[0].getAttribute("id");
                        }
                    }

                    // Get birth date and location
                    var events = xmlDocument.getElementsByTagName("events");
                    if (events[0]) {
                        var value = events[0].getElementsByTagName("value");

                        if (value[0].getAttribute("type") == "Birth") {

                            var dates = value[0].getElementsByTagName("date");
                            var places = value[0].getElementsByTagName("place");

                            if (places[0]) {
                                if (places[0].childNodes[1]) {
                                    var birthPlace = places[0].childNodes[1].textContent;
                                } else {
                                    var birthPlace = places[0].childNodes[0].textContent;
                                }
                            }
                            if (dates[0]) {
                                if (dates[0].childNodes[1]) {
                                    var birthDate = dates[0].childNodes[1].textContent;
                                } else {
                                    var birthDate = dates[0].childNodes[0].textContent;
                                }
                            }
                        }
                    }
                    
                    // Package birth information
                    var birth = {
                        date: birthDate,
                        place: birthPlace
                    }

                    // Package individual summary
                    var personObject = {
                        name: name,
                        id: id,
                        birth: birth
                    }

                    console.log("Person search for " + name + " (" + id + ")" + " returned successful.");
                    // Send reply
                    callback(personObject);
                    
                }
            }
        }
    }

    function populateIdField(id) {
        var personId = document.getElementById("personid");
        personId.value = id;
    }

    function populateUser() {
        personRead("", function (currentUser) {
            populateIdField(currentUser.id);
        });
    }

    function isEven(num) {
        // Returns true for even numbers and false for odd
        if (num / 2 == Math.round(num / 2)) {
            return true;
        } else {
            return false;
        }
    }

    function log2(num) {
        // Base 2 logarithm of number
        return Math.log(num) / Math.log(2);
    }
