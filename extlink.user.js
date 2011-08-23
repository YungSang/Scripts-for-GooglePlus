// ==UserScript==
// @name        Google+ External Link Cleaner
// @namespace   http://yungsang.com/+
// @description Reset external links to a default behavior (especially for FluidApp)
// @include     https://plus.google.com/*
// @author      YungSang
// @version     0.2.0
// ==/UserScript==

function addJQuery(callback) {
	var script = document.createElement("script");
	script.setAttribute("src", "http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js");
	script.addEventListener('load', function() {
		var script = document.createElement("script");
		script.textContent = "(" + callback.toString() + ")(jQuery.noConflict());";
		document.body.appendChild(script);
	}, false);
	document.body.appendChild(script);
}

addJQuery(function($) {

	setInterval(function() {
		$('a[href^="http"].ot-anchor').filter(':not(.elc_parsed)').each(function() {
			var $this = $(this).addClass('elc_parsed').attr('target', '_blank');
			this.onclick = function(event) {
				event.stopPropagation();
				return true;
			};
		});
	}, 500);

});