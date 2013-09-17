var map;
var polyarray = [];
var markarray = [];
var infoarray = [];

(function () {
    "use strict";

    function receiveMessage(e) {
        if (e.origin === "ms-appx://" + window.location.host) {
            var response = e.data;
            getLocationPoints(response);
            
        }
    };

    function getLocationPoints(locations) {

        var placearray = new Array();
        var len = locations.length;
        var delay = 100;


        asyncLoop(len, function (loop) {

            var idx = loop.iteration();
            var place = locations[idx];

            var placesplit = place.split(",");
            if (placesplit.length > 2) {
                //var place = placesplit[0] + "," + placesplit[2];
            }
            setTimeout(function () {
                getLatLng(place, function (result) {

                    // log the iteration
                    placearray[loop.iteration()] = result;
                    if (result == "empty") {
                        delay++
                        loop.prev();
                        loop.next();

                        
                    } else if (result == "other") { 
                        if ((loop.iteration() + 1) / 2 == Math.round((loop.iteration() + 1) / 2)) { // male

                            placearray[loop.iteration()] = placearray[(loop.iteration() + 1) / 2 - 1];
                        } else { // female ancestor

                            placearray[loop.iteration()] = placearray[(loop.iteration()) / 2 - 1];
                        }
                        loop.next();
                    } else {
                        loop.next();
                    }
                })
            }, delay);
                // Okay, for cycle could continue
                
           
        },
        function () {
            //map.setCenter(placearray[0]);

            var bounds = new google.maps.LatLngBounds;
            for (var i = 0; i < placearray.length; i++) {
                bounds.extend(placearray[i]);
                var opts = {
                    map: map,
                    position: placearray[i],
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
                markarray.push(mark);
                
            }
            map.fitBounds(bounds);
            pedigree(placearray);
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
                patharray[k] = places[j];
                var cdx = j;

                for (var i = k - 1; i > 0; i--) {
                    if ((cdx + 1) / 2 == Math.round((cdx + 1) / 2)) { // male
                        cdx = (cdx + 1) / 2 - 1;
                        patharray[i] = places[cdx];
                    } else { // female ancestor
                        cdx = (cdx) / 2 - 1;
                        patharray[i] = places[cdx];
                    }
                }
                patharray[0] = places[0];
                if (j < 3 * paths / 2 - 1) {
                    polymap(patharray, 'blue', 1 * (gen  + 1 - k));
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

window.addEventListener("message", receiveMessage, false);

})();


function ancestors() {
    clearOverlays();

    var start = document.getElementById('start');
    var gen = parseFloat(start.value);
    window.parent.postMessage(gen, "*");

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