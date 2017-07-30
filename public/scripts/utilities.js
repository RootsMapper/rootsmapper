/* 
  RootsMapper
  https://github.com/dawithers/rootsmapper
  Copyright (c) 2013 Mitch Withers, Drew Withers
  Released under the MIT licence: http://opensource.org/licenses/mit-license
*/

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

function isEventFromChild(event,element) {
  // Make sure event doesn't fire when moving from a child element to this element
  var e = event.fromElement || event.relatedTarget;
    while (e && e.parentNode && e.parentNode != window) {
        if (e.parentNode == element||  e == element) {
            if(e.preventDefault) {
                e.preventDefault();
            }
            return true;
        }
        e = e.parentNode;
    }
    return false;
}

function isEventToChild(event,element) {
  // Make sure event doesn't fire when moving from this element onto a child element 
    var e = event.toElement || event.relatedTarget;
    while (e && e.parentNode && e.parentNode != window) {
        if (e.parentNode == element||  e == element) {
            if(e.preventDefault) {
                e.preventDefault();
            }
            return true;
        }
        e = e.parentNode;
    }
    return false;
}