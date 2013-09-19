var map;
var polyarray = [];
var markarray = [];
var infoarray = [];
var accesstoken;


    function getLocationPoints(locations) {

        var placearray = new Array();
        var len = locations.length;
        var delay = 25;
        var tryagain = true;


        asyncLoop(len, function (loop) {

            var idx = loop.iteration();
            var place = locations[idx].place;

            var placesplit = place.split(",");
            if (placesplit.length > 2) {
                //var place = placesplit[0] + "," + placesplit[2];
            }
            setTimeout(function () {
                getLatLng(place, function (result) {

                    // log the iteration
                    placearray[loop.iteration()] = result;
                    locations[loop.iteration()].latlng = result;
                    if (result == "empty") {
                        delay++;
                        loop.prev();
                        loop.next();

                        
                    } else if (result == "other") { 
                        
                        if (placesplit.length > 2) {
                            locations[loop.iteration()].place = placesplit[0] + "," + placesplit[2];
                            if (tryagain == true) {
                                tryagain = false;
                                loop.prev();
                                loop.next();
                            } else {
                                if ((loop.iteration() + 1) / 2 == Math.round((loop.iteration() + 1) / 2)) { // male

                                    placearray[loop.iteration()] = placearray[(loop.iteration() + 1) / 2 - 1];
                                    locations[loop.iteration()].latlng = locations[(loop.iteration() + 1) / 2 - 1].latlng;
                                } else { // female ancestor

                                    placearray[loop.iteration()] = placearray[(loop.iteration()) / 2 - 1];
                                    locations[loop.iteration()].latlng = locations[(loop.iteration()) / 2 - 1].latlng;
                                }
                                tryagain = true;
                                loop.next();

                            }
                        } else {
                            if ((loop.iteration() + 1) / 2 == Math.round((loop.iteration() + 1) / 2)) { // male

                                placearray[loop.iteration()] = placearray[(loop.iteration() + 1) / 2 - 1];
                                locations[loop.iteration()].latlng = locations[(loop.iteration() + 1) / 2 - 1].latlng;
                            } else { // female ancestor

                                placearray[loop.iteration()] = placearray[(loop.iteration()) / 2 - 1];
                                locations[loop.iteration()].latlng = locations[(loop.iteration()) / 2 - 1].latlng;
                            }
                            loop.next();
                        }

                    delay = 25;
                    } else {
                        loop.next();
			delay = 25;
                    }
                })
            }, delay);
                // Okay, for cycle could continue
                
           
        },
        function () {
            //map.setCenter(placearray[0]);
            var infowindow = new google.maps.InfoWindow();
            var bounds = new google.maps.LatLngBounds;
            for (var i = 0; i < locations.length; i++) {
                bounds.extend(locations[i].latlng);
                var opts = {
                    map: map,
                    position: locations[i].latlng,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        fillOpacity: 0.5,
                        fillColor: 'ff0000',
                        strokeOpacity: 1.0,
                        strokeColor: 'fff000',
                        strokeWeight: 1.0,
                        scale: 5 //pixels
                    }
                }
                var mark = new google.maps.Marker(opts);

                var contents = "<div id='infow'>" + locations[i].name + '<br/>' + locations[i].place + '<br/>' + locations[i].date + '</div>';
                mark.content = contents;
                google.maps.event.addListener(mark, 'click', function (event) {
                    var infoOptions = {
                        maxWidth: 300
                    };
                    infowindow.setContent(this.content);
                    //infowindow.constructor(infoOptions);
                    infowindow.open(map, this);
                });
                markarray.push(mark);
                infoarray.push(infowindow);

            }
            map.fitBounds(bounds);
            pedigree(locations);
        }
        );

    }


    function pedigree(places) {
    
        var num = places.length + 1;
        var gen = Math.round(Math.log(num) / Math.log(2) - 1);

        for (var k = gen; k > 0; k--) {


            var paths = Math.pow(2, k);

            for (var j = paths - 1; j < 2 * paths - 1; j++) {
                var patharray = new Array();
                patharray[k] = places[j].latlng;
                var cdx = j;

                for (var i = k - 1; i > 0; i--) {
                    if ((cdx + 1) / 2 == Math.round((cdx + 1) / 2)) { // male
                        cdx = (cdx + 1) / 2 - 1;
                        patharray[i] = places[cdx].latlng;
                    } else { // female ancestor
                        cdx = (cdx) / 2 - 1;
                        patharray[i] = places[cdx].latlng;
                    }
                }
                patharray[0] = places[0].latlng;
                if (j < 3 * paths / 2 - 1) {
                    polymap(patharray, 'blue', 1 * (gen + 1 - k));
                } else {
                    polymap(patharray, '#CC0099', 1 * (gen + 1 - k));
                }
            }
        }
    }

    function polymap(coords, color, thick) {

        var geodesicOptions = {
            strokeColor: color,
            strokeOpacity: 1.0,
            strokeWeight: thick,
            geodesic: true,
            path: coords,
            map: map
        };

        var geodesicPoly = new google.maps.Polyline(geodesicOptions);
        polyarray.push(geodesicPoly);
	$(function() {
		$('#loading').activity(false);
        });
	$(function() {
    		$('#loading').hide();
 	 });

    }

    function getLatLng(place,callback) {
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
    
        //var selectMode = document.getElementsByName('mode');
        //selectMode[0].checked = true;
    }

google.maps.event.addDomListener(window, 'load', initialize);

    function getSessionId(gen) {

                ancestors(accesstoken,gen);

    }

    function ancestors(id,gen) {
        var generations = gen;

        var querythis = document.getElementById('personid');
        var personId = querythis.value;

        if (personId == "") {
            // if empty, use user default
        }

        var url = "https://sandbox.familysearch.org/familytree/v2/pedigree/" + personId + "?ancestors=" + generations + "&properties=all&sessionId=" + id;

		var xhttp;
		xhttp=new XMLHttpRequest();
		xhttp.open("GET",url);
		xhttp.send();

		xhttp.onload = function (e) {
		    if (xhttp.readyState === 4) {
		        if (xhttp.status === 200) {
		            console.log(xhttp.responseText);

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
                                tags[(i + 1) * 2 - 1] = "";
                                tags[(i + 1) * 2] = "";
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

        asyncLoop(people, function (loop) {

            var idx = loop.iteration();
            var id = persons[idx];
            
            locationPromise(id,sessionId, function (result) {

                // log the iteration
                locations[loop.iteration()] = result;
                if (result.place == "") {
                    if ((loop.iteration() + 1) / 2 == Math.round((loop.iteration() + 1) / 2)) { // male

                        locations[loop.iteration()].place = locations[(loop.iteration() + 1) / 2 - 1].place;
                    } else { // female ancestor

                        locations[loop.iteration()].place = locations[(loop.iteration()) / 2 - 1].place;
                    }
                }
                // Okay, for cycle could continue
                loop.next();
            })
            },
        function () {
	    getLocationPoints(locations);
                    }
        );
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

        var url = "https://sandbox.familysearch.org/familytree/v2/person/" + id + "?&events=standard&sessionId=" + sessionId;

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
                            date: date
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
                date: ""
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
    var gen = parseFloat(start.value);
    getSessionId(gen);

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

}
