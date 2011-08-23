// ==UserScript==
// @name        G+ Video Embedder
// @namespace   http://yungsang.com/+
// @description Convert a video link to an embedded video.
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
	var DEBUG = 0;

	var sequence = 0;

	var converters = [
		{ // NicoVideo
			regex : /http:\/\/(?:www\.)?nicovideo\.jp\/watch\/([0-9a-zA-Z]+)/g, 
			replacement : function(text, id) {
				var seq = sequence++;
				var str = 'window.nicovideo_callback_$1 = function(player){player.write("nicovideo_$1");}';
				str = str.replace(/\$1/g, seq);
				eval(str);
				setTimeout(function() {
					var str = 'http://ext.nicovideo.jp/thumb_watch/$1?w=400&h=300&cb=nicovideo_callback_$2';
					str = str.replace(/\$1/g, id);
					str = str.replace(/\$2/g, seq);
					$.getScript(str);
				}, 0);
				var str = '<span><div id="nicovideo_$1"></div></span>';
				str = str.replace(/\$1/g, seq);
				return str;
			}
		}
	];

	function convert() {
		var $links = $('a.ot-anchor').filter(':not(.gve_parsed)');
		$links.each(function() {
			var self = this;
			var $this = $(this).addClass('gve_parsed');
			$.each(converters, function(index, value) {
				if (self.href.match(value.regex)) {
log(this.href);
					var html = self.href.replace(value.regex, value.replacement);
					$this.after(html);
					return;
				}
			});
		});
		setTimeout(convert, 500);
	}

	convert();

//--============================================================================
//-- Logger
//--============================================================================
	function log(str) {
		if (!DEBUG) return;
		if ((typeof console != 'undefined') && (typeof console.log == 'function')) console.log(str);
	}
});
