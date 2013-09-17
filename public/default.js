(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize
                // your application here.
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }
            args.setPromise(WinJS.UI.processAll());
        }
    };

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // args.setPromise().
    };

    app.start();

    window.addEventListener("message", receiveMessage, false);

    function receiveMessage(e) {
        if (e.origin === "ms-appx-web://" + window.location.host) {
            getSessionId(e.data);
        }
    };

    function getSessionId(gen) {

        var key = "XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX";
        var url = "https://sandbox.familysearch.org/identity/v2/login?key=" + key;

        WinJS.xhr({ url: url }).done(
            function (result) {
                var xml = result.response;
                var xmlDocument = new Windows.Data.Xml.Dom.XmlDocument();
                xmlDocument.loadXml(xml);
                var session = xmlDocument.getElementsByTagName("session");
                var sessionID = session[0].getAttribute("id");
                ancestors(sessionID,gen);
            })

    }

    function ancestors(id,gen) {
        var generations = gen;
        var personId = "KW7F-W25";

        var url = "https://sandbox.familysearch.org/familytree/v2/pedigree/" + personId + "?ancestors=" + generations + "&properties=all&sessionId=" + id;

        WinJS.xhr({ url: url}).done(
            function (result) {
                var xml = result.response;
                var xmlDocument = new Windows.Data.Xml.Dom.XmlDocument();
                xmlDocument.loadXml(xml);
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
                    //if (i < Math.pow(2, generations - 1) - 1) {
                    //    if (persons[(i + 1) * 2 - 1].getAttribute("id") !== parents[1].getAttribute("id")) {
                    //        persons[(i + 1) * 2 - 1]
                    //    }
                    //}
                }

                getLocations(tags, id);
            })
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
                if (result == "") {
                    if ((loop.iteration() + 1) / 2 == Math.round((loop.iteration() + 1) / 2)) { // male

                        locations[loop.iteration()] = locations[(loop.iteration() + 1) / 2 - 1];
                    } else { // female ancestor

                        locations[loop.iteration()] = locations[(loop.iteration()) / 2 - 1];
                    }
                }
                // Okay, for cycle could continue
                loop.next();
            })
            },
        function () {
            var iframe = document.getElementById("Map");
            iframe.contentWindow.postMessage(locations, "*");
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
            WinJS.xhr({ url: url }).done(
                    function (result) {
                        var xml = result.response;
                        var xmlDocument = new Windows.Data.Xml.Dom.XmlDocument();
                        xmlDocument.loadXml(xml);
                        var locString = "";
                        var events = xmlDocument.getElementsByTagName("events");
                        if (events[0]) {

                            var places = events[0].getElementsByTagName("place");

                            if (places[0]) {
                                var locString = places[0].childNodes[0].innerText;
                            }
                        }

                        callback(locString);

                    },
                    function (error) {
                        var pause = "true";
                    })
        } else {
            callback(id);
        }

    }

})();
