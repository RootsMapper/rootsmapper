/* 
  RootsMapper
  https://github.com/dawithers/rootsmapper
  Copyright (c) 2013 Mitch Withers, Drew Withers
  Released under the MIT licence: http://opensource.org/licenses/mit-license
*/

function alphaFilterKeypress(evt) {
    evt = evt || window.event;
    var charCode = evt.keyCode || evt.which;
    var charStr = String.fromCharCode(charCode);
    if (charCode != 13) {
      return /[a-z0-9\-]/i.test(charStr);
    } else {
      checkID();
    }
}

window.onload = function() {
    var input = document.getElementById("personid");
    input.onkeypress = alphaFilterKeypress;
};

function HtmlEncode(s)
{
  var el = document.createElement("div");
  el.innerText = el.textContent = s;
  s = el.innerHTML;
  return s;
}
