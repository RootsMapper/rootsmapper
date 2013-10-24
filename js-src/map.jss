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
var nSearches;
var delay = 100;
var baseurl;
var version;
var userID;
var familyTree;

function BinaryTree() {
    this.Nodes = new Array();
    this.generation = 0;
    this.node = 0;

    this.traverse = function (run, index, callback) {
        var that = this;
        if (index < this.stage.length) {
            run(this.stage[index], function () {
                index++;
                that.traverse(run, index, callback)
            });
        } else {
            callback();
        }
    }

    this.IDDFS = function (run,callback) {
        this.stage = new Array();
        for (var i = 0; i < this.generations() + 2; i++) {
            if (i < this.generations() + 1) {
                this.root();
                this.DLS(i);
            } else {
                this.traverse(run, 0, callback);
            }
        }
    }

    this.DLS = function (depth) {
        if (depth == 0) {
            this.stage.push({node: this.node, generation: this.generation});
        } else {
            if (this.father() !== undefined) {
                this.DLS(depth - 1);
            }
            this.child();
            if (this.mother() !== undefined) {
                this.DLS(depth - 1);
            }
            this.child();
        }
    }

    this.generations = function () {
        return Math.ceil(log2(this.Nodes.length))-1;
    }

    this.setNode = function (value, generation, node) {
        if (generation === undefined) {
            this.Nodes[this.btSMF(this.generation, this.node)] = value;
        } else {
            this.Nodes[this.btSMF(generation, node)] = value;
        }
    }

    this.getNode = function (generation, node) {
        if (generation === undefined) {
            return this.Nodes[this.btSMF(this.generation, this.node)];
        } else {
            return this.Nodes[this.btSMF(generation, node)];
        }
    }

    this.setNodeByLocation = function (value, location) {
        this.Nodes[location] = value;
    }

    this.getNodeByLocation = function (location) {
        if (location === undefined) {
            return this.Nodes[this.btSMF(this.generation, this.node)];
        } else {
            this.generation = Math.floor(log2(location));
            this.node = location - Math.pow(2, this.generation);
            return this.Nodes[location];
        }
    }

    this.root = function (value) {
        this.generation = 0;
        this.node = 0;
        if (value !== undefined) {
            this.Nodes[this.btSMF(this.generation, this.node)] = value;
        }
        return this.Nodes[this.btSMF(this.generation, this.node)];

    }

    this.mother = function (value) {
        this.generation++
        this.node = this.node * 2 + 1;
        if (value !== undefined) {
            this.Nodes[this.btSMF(this.generation, this.node)] = value;
        }
        return this.Nodes[this.btSMF(this.generation, this.node)];
    }

    this.getMother = function (gen, node) {
        return this.Nodes[this.btSMF(gen + 1, node * 2 + 1)];
    }

    this.father = function (value) {
        this.generation++
        this.node = this.node * 2;
        if (value !== undefined) {
            this.Nodes[this.btSMF(this.generation, this.node)] = value;
        }
        return this.Nodes[this.btSMF(this.generation, this.node)];
    }

    this.getFather = function (gen,node) {
        return this.Nodes[this.btSMF(gen + 1, node * 2)];
    }

    this.child = function (value) {
        this.generation--;
        this.node = this.node >> 1;
        if (value !== undefined) {
            this.Nodes[this.btSMF(this.generation, this.node)] = value;
        }
        return this.Nodes[this.btSMF(this.generation, this.node)];
    }

    this.getChild = function (gen,node) {
        return this.Nodes[this.btSMF(gen - 1, (node >> 1))];
    }

    this.btSMF = function (generation, node) {
        return node + (1 << generation);
    }
}

function currentUser() {

    var xhttp;
    var url = baseurl + "/platform/tree/current-person?access_token=" + accesstoken;
    xhttp = new XMLHttpRequest();
    xhttp.open("GET", url);
    xhttp.setRequestHeader('Accept', 'application/xml');

    xhttp.onload = function (e) {
        if (xhttp.readyState === 4) {
            if (xhttp.status === 200) {

                var xmlDocument = xhttp.responseXML.documentElement;
                var p = $(xmlDocument).find("gx\\:person, person");
                userID = p[0].getAttribute("id");
                var f = $(xmlDocument).find("gx\\:fullText, fullText");
                var name = f[0].textContent;

                populateIdField(userID);
                var username = document.getElementById("username");
                username.innerHTML = name;

                ancestorgens();

            } else if (xhttp.status === 401) {
                alert("Your session has expired. Please log in again.");
                window.location = '?login';
            }
        }
    }

    xhttp.send();

}


function customAlert() {
    var div = document.createElement("div");
    div.setAttribute('id', 'alertDiv');
    var child = document.createElement("div");
    child.setAttribute('id','alertText');
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
            div.setAttribute("id","inputFrame");
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
    }, 10*1000);
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
        
        var ua = navigator.userAgent.toLowerCase();
        if (ua.indexOf('safari') != -1) {
            if (ua.indexOf('chrome') > -1) {
                var safari = false; // chrome
            } else {
                var safari = true; // saf
            }
        }

        if (accesstoken) {
            //if (!safari) {
                currentUser();
            //} else {
            //    populateUser();
            //}
            //sessionHandler();
        }

        google.maps.event.addListener(map, 'click', function () {
            ib.close();
        });

        

    }

    function tooltip(tip,el, v, h) {
		var vert;
		var horiz;
    	if (v) {vert = v} else {vert = 0}
		if (h) {horiz = h} else {horiz = 0}
		var tt;
		var that = document.getElementById(el);

		var timeoutId = setTimeout(function () {
		tt = document.createElement('div');
		tt.setAttribute('id', 'tt');
		tt.innerHTML = tip;
		var rect = that.getBoundingClientRect();
            tt.style.top = (rect.bottom +vert) + 'px';
            tt.style.left =(rect.left +horiz) + 'px';

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

    function ancestorgens(gens) {

        clearOverlays();
        startEvents();
	    var select = document.getElementById('genSelect');
	    genquery = parseFloat(select.value);
        getPedigree(genquery, undefined, undefined);

    }

    function ancestorExpand(id, rootGen, rootNode) {

        startEvents();
        genquery = 1;
        getPedigree(1, id, rootGen, rootNode);

    }

    function getPedigree(gen, root, rootGen, rootNode) {
        var generations = gen;

        if (!rootGen) { rootGen = 0; }
        if (!rootNode) { rootNode = 0; }

        if (root) {
            personId = root;
            // if empty, use user default
        } else {
            var querythis = document.getElementById('personid');
            var personId = querythis.value;
        }

        var xhttp;
        var url = baseurl + "/platform/tree/ancestry?person=" + personId + "&generations=" + generations + "&access_token=" + accesstoken;
        xhttp = new XMLHttpRequest();
        xhttp.open("GET", url);
        xhttp.setRequestHeader('Accept', 'application/xml');

        xhttp.onload = function (e) {
            if (xhttp.readyState === 4) {
                if (xhttp.status === 200) {

                    var xml = xhttp.responseXML.documentElement;
                    var p = $(xml).find("gx\\:person, person");
                    for (var i = 0; i < p.length; i++) {
                        var num = $(p[i]).find("gx\\:ascendancyNumber,ascendancyNumber");
                        var n = parseFloat(num[0].textContent);
                        var gen = Math.floor(log2(n));
                        var node = n + Math.pow(2, gen) * (rootNode - 1);
                        if (!familyTree.getNode(gen + rootGen, node)) {
                            familyTree.setNode({id: p[i].getAttribute("id")}, (gen+rootGen), node);
                        }
                    }
                    
                    readPedigreeLoop();
                } else if (xhttp.status === 401) {
                    completionEvents();
                    alert("Your session has expired. Please log in again.");
                    window.location = 'index.php?login=true';
                } else {
                    completionEvents();
                    alert("Error: " + xhttp.statusText);
                }
            }
        }
        xhttp.send();      
    }

    function readPedigreeLoop() {
        delay = 1;
        familyTree.IDDFS(function (tree, cont) {
            
            var node = tree.node;
            var gen = tree.generation;
            var ID = familyTree.getNode(gen, node);
            var pause = true;
            if (ID) {
                if (ID.isPlotted !== true) {
                    personRead2(ID.id, function (result) {
                        result.generation = gen;
                        result.node = node;
                        if (node < Math.pow(2, gen - 1)) {
                            result.isPaternal = true;
                        }
                        familyTree.setNode(result, gen, node);
                        getPortraitStore(result.id, gen, node);
                        getMeABirthLatLng(gen, node, cont);
                    });
                } else {
                    cont();
                }
            } else {
                cont();
            }
        }, function () {
            setTimeout(function () {
                completionEvents();
            }, 1000);
        });
    }

    function getPlaceAuthority(id, callback) {
        var xhttp;
        var url = baseurl + "/platform/tree/persons/" + id + "?&events=standard&access_token=" + accesstoken;
        xhttp = new XMLHttpRequest();
        xhttp.open("GET", url);
        xhttp.setRequestHeader('Accept', 'application/xml');

        xhttp.onload = function (e) {
            if (xhttp.readyState === 4) {
                if (xhttp.status === 200) {
                    var xmlDocument = xhttp.responseXML.documentElement;
                }
            }
        }
        xhttp.send();
    }


    function personRead2(id, callback) {

        var xhttp;
        var url = baseurl + "/platform/tree/persons/" + id + "?&access_token=" + accesstoken;
        xhttp = new XMLHttpRequest();
        xhttp.open("GET", url);
        xhttp.setRequestHeader('Accept', 'application/json');

        xhttp.onload = function (e) {
            if (this.readyState === 4) {
                if (this.status === 200) {

                    var result = JSON.parse(this.response);
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

                    var living = person.living;

                    if (living == true) {
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


//                    var xmlDocument = xhttp.responseXML.documentElement;

//                    var death = {
//                            date: null,
//                        place: null
//                        }
//                    var birth = {
//                            date : null,
//                            place: null
//                    }


//                    var display = $(xmlDocument).find("gx\\:display, display");
//                    if (display[0]) {
//                        var birthdate = $(display[0]).find("gx\\:birthDate, birthDate");
//                        var birthplace = $(display[0]).find("gx\\:birthPlace, birthPlace");
//                        var deathdate = $(display[0]).find("gx\\:deathDate, deathDate");
//                        var deathplace = $(display[0]).find("gx\\:deathPlace, deathPlace");
//                        var gend = $(display[0]).find("gx\\:gender, gender");
//                        var lifespan = $(display[0]).find("gx\\:lifespan, lifespan");
//                        var namer = $(display[0]).find("gx\\:name, name");

//                        if (birthdate[0]) {
//var date = birthdate[0].textContent; }
//                        if (birthplace[0]) { var place = birthplace[0].textContent;
//                    }
//                        var birth = { date : date, place: place
//                    }

//                        var date = null;
//                        var place = null;
//                        if (deathdate[0]) { var date = deathdate[0].textContent;
//                        }
//                        if (deathplace[0]) { var place = deathplace[0].textContent; }
//                        var death = { date: date, place: place
//                        }

//                        if (gend[0]) {
//var gender = gend[0].textContent; }
//                        if (namer[0]) {
//var name = namer[0].textContent;
//                        }
//                        }

//                        if (xmlDocument.childNodes[3]) {
//                        if (xmlDocument.childNodes[3].childNodes[1]) {
//                            var placeString = xmlDocument.childNodes[3].childNodes[1].textContent;
//                            } else {
//                            var placeString = birth.place;
//                            }
//                } else {
//                    var placeString = birth.place;
//                    }


//                    var alive = $(xmlDocument).find("gx\\:living, living");
//                    if (alive[0]) {
//                        if (alive[0].textContent == "true") {
//                            death.date = "Living";
//                }
//                }

//                    var personObject = {
//                        name: name,
//                        id: id,
//                        birth: birth,
//        death: death,
//    gender: gender,
//        place : placeString
//}

                    // Send reply
                    callback(personObject);
                } else if (xhttp.status === 401) {
        //}).fail(function (jqXHR, textStatus, errorThrown) {
                    completionEvents();
                    alert("Your session has expired. Please log in again.");
                    window.location = 'index.php?login=true';
                    //});
                } else if (this.status === 503) {
                    callback(this.status);
                } else {
                    completionEvents();
                    alert("Error: " + xhttp.statusText);
                }
            }
        }
        xhttp.send();
    }

    function getPortraitStore(id,gen,node) {
        var xhttp;
        var url = baseurl + "/platform/tree/persons/" + id + "/memories?&type=\"photo\"&access_token=" + accesstoken;
        xhttp = new XMLHttpRequest();
        xhttp.open("GET", url);
        xhttp.setRequestHeader('Accept', 'application/json');

        xhttp.onload = function (e) {
            if (this.readyState === 4) {
                if (this.status === 200) {

                    var result = JSON.parse(this.response);
                    var sourceDescriptions = result.sourceDescriptions;
                    if (sourceDescriptions[0]) {
                        var url = sourceDescriptions[0].links["image-icon"].href;
                        var bigurl = sourceDescriptions[0].links.image.href;
                        familyTree.getNode(gen, node).imageIcon = url;
                        familyTree.getNode(gen, node).image = bigurl;
                    } else {
                        familyTree.getNode(gen, node).imageIcon = "";
                        familyTree.getNode(gen, node).image = "";
                    }


                } else if (this.status === 401) {
                    alert("Sorry, your session has already expired. Please log in again.");
                    window.location = 'index.php?login=true';
                } else {
                    alert("Error: " + this.statusText);
                    familyTree.getNode(gen, node).imageIcon = "";
                    familyTree.getNode(gen, node).image = "";
                }
            }
        }

        xhttp.send();
    }

    function personRead(id, callback) {

        var url = baseurl + "/familytree/v2/person/" + id + "?&events=standard&sessionId=" + accesstoken;

        var xhttp;
        xhttp = new XMLHttpRequest();
        xhttp.open("GET", url);

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

                    var genders = xmlDocument.getElementsByTagName("gender");
                    if (genders[0]) {
                        var gender = genders[0].textContent;
                    }
                    var death = {
                        date: null,
                        place: null
                    }
                    var birth = {
                        date: null,
                        place: null
                    }
                    // Get birth date and location
                    var events = xmlDocument.getElementsByTagName("events");
                    if (events[0]) {
                        var value = events[0].getElementsByTagName("value");
                        for (var i = 0; i < value.length; i++) {
                            var dates = value[i].getElementsByTagName("date");
                            var places = value[i].getElementsByTagName("place");

                            if (places[0]) {
                                if (places[0].childNodes[1]) {
                                    var place = places[0].childNodes[1].textContent;
                                } else {
                                    var place = places[0].childNodes[0].textContent;
                                }
                            }
                            if (dates[0]) {
                                if (dates[0].childNodes[1]) {
                                    var date = dates[0].childNodes[1].textContent;
                                } else {
                                    var date = dates[0].childNodes[0].textContent;
                                }
                            }

                            if (value[i].getAttribute("type") == "Birth") {
                                // Package birth information
                                var birth = {
                                    date: date,
                                    place: place
                                }
                            } else if (value[i].getAttribute("type") == "Death") {
                                // Package death information
                                var death = {
                                    date: date,
                                    place: place
                                }
                            }
                        }
                    }

                    // Package individual summary
                    var personObject = {
                        name: name,
                        id: id,
                        birth: birth,
                        death: death,
                        gender: gender
                    }

                    // Send reply
                    callback(personObject);

                } else {
                    if (xhttp.status != 503) {
                        completionEvents();
                        alert("Error: " + xhttp.statusText);
                    } else {
                        callback(xhttp.status);
                    }
                }
            }
        };

        xhttp.send();
        
    }

    function getLatLng(place, callback) {

        if (place) {
            var geocoder = new google.maps.Geocoder();
            var georequest = {
                address: place
            };
            
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

    function getMeABirthLatLng(gen,node,next) {
        setTimeout(function () {
            getLatLng(familyTree.getNode(gen,node).birth.place, function (res) {

                
                if (res == "empty") {
                    delay++
                    getMeABirthLatLng(gen, node, next);
                } else if (res == "other") {
                    var placestring = familyTree.getNode(gen, node).birth.place;

                    var xhttp;
                    var url = "https://api.familysearch.org/authorities/v1/place?place=" + placestring + "&locale=en&sessionId=" + accesstoken;
                    xhttp = new XMLHttpRequest();
                    xhttp.open("GET", url);
                    xhttp.setRequestHeader('Accept', 'application/xml');

                    xhttp.onload = function (e) {
                        if (xhttp.readyState === 4) {
                            if (xhttp.status === 200) {
                                var xmlDocument = xhttp.responseXML.documentElement;
                                var point = $(xmlDocument).find("point");
                                var lat = point[0].childNodes[0].textContent;
                                var lng = point[0].childNodes[1].textContent;
                                var latlng = new google.maps.LatLng(lat, lng);
                                //result.birth.latlng = latlng;
                                //familyTree.setNode(result, gen, node);
                                familyTree.getNode(gen, node).birth.latlng = latlng;
                                plotParent(node, gen);
                                next();
                            } else {
                                getChildBirthPlace2(node, gen, function (ref) {
                                    //result.birth.latlng = e;
                                    //familyTree.setNode(result, gen, node);
                                    familyTree.getNode(gen, node).birth.latlng = ref;
                                    plotParent(node, gen);
                                    next();
                                });
                            }
                        }
                    }
                    xhttp.send();

                } else if (!res) {
                    //console.log("Undefined birthplace for " + progenitors[idx].name + " (" + progenitors[idx].id + ")");
                    //progenitors[idx].birth.latlng = getChildBirthPlace(progenitors, idx);
                    getChildBirthPlace2(node, gen, function (ref) {
                        //result.birth.latlng = e;
                        //familyTree.setNode(result, gen, node);
                        familyTree.getNode(gen, node).birth.latlng = ref;
                        plotParent(node, gen);
                        next();
                    });
                    //tryagain = true;
                    //placequery = undefined;
                    //callLoopNext(loop, progenitors);
                } else {
                    //result.birth.latlng = res;
                    //familyTree.setNode(result, gen, node);
                    familyTree.getNode(gen, node).birth.latlng = res;
                    //tryagain = true;
                    //placequery = undefined;
                    //callLoopNext(loop, progenitors);
                    if (gen == 0 && node == 0) {
                        makeInfoWindow(familyTree.root());
                        familyTree.root().isPlotted = true;
                        next();
                    } else {
                        plotParent(node, gen);
                        next();
                    }
                }
            });
        }, delay);
    }

    function plotParent(node,gen) { 
        var parent = familyTree.getNode(gen, node);
        var child = familyTree.getChild(gen,node);

        if (parent.isPaternal == true) {
            var color = rgbToHex(74, 96, 255);
        } else {
            var color = rgbToHex(255, 96, 182);
        }

        if (child.birth && parent.birth) {

            if (child.birth.latlng && parent.birth.latlng) {
                polymap([child.birth.latlng, parent.birth.latlng], color, node, gen, function (result) { //rgbToHex(74,96,255) rgbToHex(0, 176, 240)
                    makeInfoWindow(familyTree.getNode(gen, node));
                    familyTree.getNode(gen, node).isPlotted = true;
                });
            } else {
                console.log("Recursion waiting for " + child.name + " ... ");
                setTimeout(function () {
                    plotParent(node, gen);
                }, 1000);
            }
        } else {
            console.log("Recursion waiting for " + child + " ... ");
            setTimeout(function () {
                plotParent(node, gen);
            }, 1000);
        }
            

    }

    function callLoopNext(loop,progenitors) {

        var idx = loop.iteration();
        if ( log2(idx+2) == Math.round(log2(idx + 2)) ) { // Finished a complete generation
            if (idx !== 0) {
                //checkBounds(progenitors, loop);
                loop.next()
            } else {
                loop.next();
            }
        } else {
            loop.next();
        }
        
    }

    function checkBounds(progenitors,loop) {

        var bounds = new google.maps.LatLngBounds;
        var currentBounds = map.getBounds();

        if (firstTime.plot == true) {
            makeInfoWindow(progenitors[0]);
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

    function plotNextGeneration(progenitors, loop) {

        var idx = loop.iteration();
        var gen = log2(idx + 2) - 1; // Number of generations completed so far

        loadingAnimationEnd();
        var paths = Math.pow(2, gen);

        for (var j = paths - 1; j < 2 * paths - 1; j++) {
            var patharray = new Array();
            if (progenitors[j]) {
                patharray[1] = progenitors[j].birth.latlng;
            }
            var cdx = j;

            if (isEven(j + 1)) {
                // male
                cdx = (j + 1) / 2 - 1; // child of male
                if (progenitors[cdx]) {
                    patharray[0] = progenitors[cdx].birth.latlng;
                }
            } else {
                // female ancestor
                cdx = (cdx) / 2 - 1; // child of female
                if (progenitors[cdx]) {
                    patharray[0] = progenitors[cdx].birth.latlng;
                }
            }

            if (progenitors[j]) {
                if (progenitors[j].isPaternal == true) { // (j < 3 * paths / 2 - 1)
                    polymap(patharray, rgbToHex(74, 96, 255),"", j, function (result) { //rgbToHex(74,96,255) rgbToHex(0, 176, 240)
                        makeInfoWindow(progenitors[result]);
                        if (result == 2 * paths - 2) {
                            if (gen !== genquery) {
                                loadingAnimationStart();
                            } else {
                                completionEvents();
                            }
                            loop.next();
                        }
                    });
                } else {
                    polymap(patharray, rgbToHex(255, 96, 182),"", j, function (result) { // rgbToHex(255,96,182) rgbToHex(245, 139, 237)
                        makeInfoWindow(progenitors[result]);
                        if (result == 2 * paths - 2) {
                            if (gen !== genquery) {
                                loadingAnimationStart();
                            } else {
                                completionEvents();
                            }
                            loop.next();
                        }
                    });
                }
            } else if (j == 2 * paths - 2) {
                if (gen !== genquery) {
                    loadingAnimationStart();
                } else {
                    completionEvents();
                }
                loop.next();
            }
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
            familyTree.getNode(gen, node).polyline = geodesicPoly;

            var step = 0;
            var numSteps = 100; //Change this to set animation resolution
            var timePerStep = 1; //Change this to alter animation speed
            var interval = setInterval(function () {
                step += 1;
                if (step > numSteps) {
                    clearInterval(interval);
                    callback();
                } else {
                    var are_we_there_yet = google.maps.geometry.spherical.interpolate(c1, c2, step / numSteps);
                    geodesicPoly.setPath([c1, are_we_there_yet]);
                }
            }, timePerStep);
        } else {
            callback(idx);
        }

    }

    function makeInfoWindow(p) {
        if (p) {
            if (p.birth.latlng) {

                if (p.gender == "Male") {
                    var bgcolor = 'lightblue'; //rgbToHex(0, 176, 240);
                    var icon = 'images/male' + p.generation + '.png?v=' + version;
                    var src = 'images/man.png?v=' + version;
                } else {
                    var bgcolor = 'pink'; // rgbToHex(245, 139, 237);
                    var icon = 'images/female' + p.generation + '.png?v=' + version;
                    var src = 'images/woman.png?v=' + version;
                }
                var self = "<img style='width: 18px; height: 18px; margin-top: 10px;' src='" + icon + "'>";
                var father = "<img style='width: 18px; height: 18px; margin-bottom:1px;' src='images/male" + (p.generation + 1) + ".png?v=" + version + "'>";
                var mother = "<img style='width: 18px; height: 18px; margin-top:1px;' src='images/female" + (p.generation + 1) + ".png?v=" + version + "'>";
                var scaleFactor = .5;
                var opts = {
                    map: map,
                    position: p.birth.latlng,
                    icon: {
                        url: icon,
                        origin: new google.maps.Point(0,0),
                        anchor: new google.maps.Point(36*scaleFactor*0.5,36*scaleFactor*0.5),
                        scaledSize: new google.maps.Size(36*scaleFactor,36*scaleFactor)
                    },
                    zIndex: (50-p.generation)
                }

                var mark = new google.maps.Marker(opts);
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
                                  "' style='width:25px; height:26px; margin-top: 12px;' onclick='unPlot(" +p.generation + "," +p.node +") ;'</div>";
                
                //if (p.generation > genquery - 1) {  
                //    mark.isExpanded = false;
                //} else {
                //    mark.isExpanded = true;
                //}
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
                        
                oms.addListener('click', function (mark, event) {
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
                        var buttons = mark.expandButton + mark.deleteButton + '</div>';
                    } else if (motherPlotted == true && fatherPlotted == true) {
                        var buttons = "";
                    } else {
                        var buttons = mark.expandButton + '</div>';
                    }

                    if (mark.isExpanded) {
                        ib.setContent(mark.infoBoxContent + '</div>');
                    } else {
                        ib.setContent(mark.infoBoxContent + buttons + '</div>');
                    }
                  
                    ib.open(map, mark);
                    setPortrait(mark.generation, mark.node);
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

    function unPlot(gen, node) {
        familyTree.getNode(gen,node).marker.setVisible(false);
        familyTree.getNode(gen,node).polyline.setVisible(false);
        familyTree.getChild(gen,node).marker.isExpanded = false;
        familyTree.getNode(gen,node).isPlotted = false;
        familyTree.setNode(undefined, gen, node);
        ib.close();
    }
    
    function setPortrait(gen,node) {
        setTimeout(function () {
            var portrait = document.getElementById('portrait');
            if (portrait) {
                var person = familyTree.getNode(gen, node);
                if (person.image && person.imageIcon) {
                    var imageHTML = "<img style='height:300px;' src='" + person.image + "'>";
                    portrait.setAttribute('src', person.imageIcon);
                    portrait.onmouseover = function () { tooltip(imageHTML, "portrait", 10); }
                } else if (person.image == "" && person.imageIcon == "") {
                    // do nothing
                } else {
                    setPortrait(gen, node)
                }
            } else {
                setPortrait(gen, node)
            }
        }, 50);
    }

    function getPortrait(id) {
        var xhttp;
        var url = baseurl + "/platform/tree/persons/" + id + "/memories?&type=\"photo\"&access_token=" + accesstoken;
        xhttp = new XMLHttpRequest();
        xhttp.open("GET", url);
        xhttp.setRequestHeader('Accept', 'application/json');

        xhttp.onload = function (e) {
            if (this.readyState === 4) {
                if (this.status === 200) {

                    var result = JSON.parse(this.response);
                    var sourceDescriptions = result.sourceDescriptions;
                    if (sourceDescriptions[0]) {
                        var url = sourceDescriptions[0].links["image-icon"].href;
                        var bigurl = sourceDescriptions[0].links.image.href;
                        var portrait = document.getElementById('portrait');
                        portrait.setAttribute('src', url);
                        //portrait.onclick = function () { window.open(bigurl); };
                        var imageHTML = "<img style='height:300px;' src='" + bigurl + "'>";
                        document.getElementById("portrait").onmouseover = function () { tooltip(imageHTML, "portrait", 10); }
                    }

                    
                } else if (this.status === 401) {
                    alert("Sorry, your session has already expired. Please log in again.");
                    window.location = 'index.php?login=true';
                } else {
                    alert("Error: " + this.statusText);
                }
            }
        }

        xhttp.send();
    }

    function getChildBirthPlace(progenitors, idx) {
        // Call this function if you can't find a person's birthplace
        // It will check if the person has children, and if so, returns the child's birthplace instead

        if (progenitors[idx].gender == "Male") {

            if (progenitors[(idx + 1) / 2 - 1]) { // Check if child exists
                return progenitors[(idx + 1) / 2 - 1].birth.latlng;
            } else {
                return undefined;
            }

        } else { // female
            if (progenitors[idx / 2 - 1]) { // Check if child exists
                return progenitors[idx / 2 - 1].birth.latlng;
            } else {
                return undefined;
            }
        }

    }

    function getChildBirthPlace2(node, gen,cb) {
        // Call this function if you can't find a person's birthplace
        // It will check if the person has children, and if so, returns the child's birthplace instead

        var child = familyTree.getChild(gen, node);
        if (child.birth) {
            if (child.birth.latlng) {
                var e = child.birth.latlng;
                cb(e);
            } else {
                setTimeout(function () {
                    getChildBirthPlace2(node, gen,cb)
                }, 1000);
            }
        } else {
            setTimeout(function () {
                getChildBirthPlace2(node, gen,cb)
            }, 1000);
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

            breakout: function () {
                done = true;
                callback();
            }
        };
        loop.next();
        return loop;
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
            }, function() {
        });
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
        nSearches = 0;
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

    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    function rgbToHex(r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
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

    function log2(num) {
        // Base 2 logarithm of number
        return Math.log(num) / Math.log(2);
    }

    function startEvents() {
        loadingAnimationStart();
        var runButton = document.getElementById('runButton');
        runButton.disabled = true;
        runButton.className = 'button disabled';
    }

    function completionEvents() {
        loadingAnimationEnd();
        var runButton = document.getElementById('runButton');
        runButton.disabled = false;
        runButton.className = 'button green';
        if (firstTime.box == true) {
            if (familyTree.root().marker) {
                var mark = familyTree.root().marker;
                ib.setContent(mark.infoBoxContent + '</div>');
                ib.open(map, mark);
                setPortrait(0,0);
                firstTime.box = false;
            }
		}
    }

    google.maps.event.addDomListener(window, 'load', initialize);
