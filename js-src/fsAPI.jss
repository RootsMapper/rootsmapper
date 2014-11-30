/*
  RootsMapper
  https://github.com/dawithers/rootsmapper
  Copyright (c) 2013 Mitch Withers, Drew Withers
  Released under the MIT licence: http://opensource.org/licenses/mit-license
*/

function fsAPI(options, callback, timeout) {
    // Generic function for FamilySearch API requests
    // options.url = API url (Required)
    // options.media = "xml" for xml, else JSON

    // Construct request
    var xhttp;
    xhttp = new XMLHttpRequest();


    // Set request type
    if (options.media == "image" ) {
      xhttp.open("HEAD", options.url);
      xhttp.setRequestHeader('Accept', '*/*');
    } else {
      xhttp.open("GET", options.url);
      xhttp.setRequestHeader('Accept', 'application/' + (options.media || 'json'));
    //   xhttp.setRequestHeader('Accept-Encoding','compress, gzip');
    }

    // If concerned about timing out, define a timeout limit
    if (timeout) {
        xhttp.timeout = timeout;
        xhttp.ontimeout = function () {
            typeof callback === 'function' && callback(undefined, "Operation Timed Out");
        }
    }

    // Define behavior when request is ready
    xhttp.onload = function (e) {
        if (this.readyState === 4) {

            // Special consideration for portrait requests
            if (this.status === 204 && options.media == "img") {
              queue = 1;
              var status = this.statusText;
              typeof callback === 'function' && callback(undefined, status);

            // Successful response
            } else if (this.status === 200) {
                queue = 1;

                var status = this.statusText;

                if (options.media == "xml") {
                    var result = this.responseXML.documentElement;
                } else if (options.media =="img") {
                    var headers = parseResponseHeaders(this.getAllResponseHeaders());
                    var result = headers["Content-Location"];
                } else {
                    var result = JSON.parse(this.response);
                }
                typeof callback === 'function' && callback(result, status);

            // Throttled by FamilySearch
            } else if (this.status === 429) {
                setTimeout(function () {
                    fsAPI(options, callback);
                }, 5 * 1000);

            // Session is expired
            } else if (this.status === 401) {
                alert("Your session has expired. Please log in again.");
                window.location = 'index.php?login=true';

            // Other error
            } else {
                var status = this.statusText;
                typeof callback === 'function' && callback(undefined, status);
            }
        }
    }

    // Send request
    xhttp.send();
}

function parseResponseHeaders(headerStr) {
    var headers = {};
    if (!headerStr) {
        return headers;
    }
    var headerPairs = headerStr.split('\u000d\u000a');
    for (var i = 0; i < headerPairs.length; i++) {
        var headerPair = headerPairs[i];
        // Can't use split() here because it does the wrong thing
        // if the header value has the string ": " in it.
        var index = headerPair.indexOf('\u003a\u0020');
        if (index > 0) {
            var key = headerPair.substring(0, index);
            var val = headerPair.substring(index + 2);
            headers[key] = val;
        }
    }
    return headers;
}
