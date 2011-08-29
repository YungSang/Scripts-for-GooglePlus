// ==UserScript==
// @name        Google+ Star
// @namespace   http://yungsang.com/+
// @description Added the star functionality, pulled out from Usability Boost for Google Plus Chrome Extension
// @include     https://plus.google.com/*
// @author      YungSang
// @version     0.2.0
// ==/UserScript==

(function() {

/*
 * Google+ CSS
 *
 * version : 20110822 & 20110829
 */
	var SELECTOR = {
		sparks          : '.a-f-a4-ob-B, .c-i-ica-Qa-C',

		sub_title       : '.vo, .op',
		share_box       : '.i-Wd, .f-ad',
		posts           : '.br, .Sq',

		individual_post : 'div[id^="update-"]',
			post_header   : '.kr, .jr', // not used
				post_icon   : '.Km img, .Nm img',
				post_info   : '.Nw, .Ex', // not used
					post_name : '.nC a, .eE a',
					post_date : '.Fl, .hl',
			post_content  : '.un.Ao, .Us.Gk',

		stream_link     : '.b-j.a-f-j-Ja.a-ob-j.a-ob-oh-j'
	};

	var CLASSES = {
		stream_link : [
			'b-j a-f-j-Ja a-ob-j a-ob-oh-j',
			'a-j c-i-j-ua c-Qa-j c-Qa-gg-j'
		],
		circle_link : [
			'a-f-ob-oh-j',
			'c-i-Qa-gg-j'
		]
	};

/*
 * Main
 */
	if (localStorage['favorites'] == null) {
		localStorage['favorites'] = JSON.stringify([]);
	}
	var favorites = JSON.parse(localStorage['favorites']);

	function storeFavorites(){
		localStorage['favorites'] = JSON.stringify(favorites);
	}
	function removeFavorite(postId) {
		for (var i = 0, len = favorites.length ; i < len ; i++) {
			if (favorites[i].id == postId) {
				favorites.splice(i,1);
				return true;
			}
		}
		return false;
	}
	function isFavorite(postId) {
		for (var i = 0, len = favorites.length ; i < len ; i++) {
			if (favorites[i].id == postId) {
				return true;
			}
		}
		return false;
	}
	function updateFavoriteCount() {
		try {		
			var elm = document.getElementById('favoritesLink');
			elm.innerHTML = 'Starred <strong>(' + favorites.length + ')</strong>';
		} catch(e){}
	}

	function setStarToPost(elm) {
		if (elm.added_star) {
			return; // prevent addding again and again
		}
		elm.added_star = true;

		var isStarred = isFavorite(elm.id);

		var starHolder = document.createElement('div');

		if (isStarred) {
			starHolder.className = 'post_star starred';
		} else {
			starHolder.className = 'post_star';
		}

		elm.appendChild(starHolder);

		starHolder.addEventListener('mouseover', function(e) {
			e.target.className = 'post_star starred';
		});
		starHolder.addEventListener('mouseout', function(e) {
			if (!isStarred) {
				e.target.className = 'post_star';
			}
		});

		starHolder.addEventListener('click', function(e) {
			var nameLink = elm.querySelector(SELECTOR.post_name);

			if (isStarred) {
				isStarred = false;
				e.target.className = 'post_star';
				removeFavorite(elm.id);
			} else {
				isStarred = true;
				e.target.className = 'post_star starred';

				var contentBox = elm.querySelector(SELECTOR.post_content);
				var text = contentBox.innerText.replace(/\n/g, ' ').substring(0, 130) + '...';

				var imgElm = elm.querySelectorAll(SELECTOR.post_icon)[0];
				var picture_url = imgElm.src;

				var postLink = elm.querySelector(SELECTOR.post_date);

				var obj = {
					id          : elm.id,
					name        : nameLink.innerHTML,
					post_date   : postLink.title,
					post_url    : postLink.href,
					text        : text,
					picture_url : picture_url
				};

				favorites.push(obj);
			}

			storeFavorites();
			updateFavoriteCount();
		});
	}

	function sortDates(a, b) {
		var A = new Date(a.post_date);
		var B = new Date(b.post_date);
		return B- A;
	}

	var timer = null;
	function update() {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
		var elms = document.body.querySelectorAll(SELECTOR.individual_post);
		for (var i = 0, len = elms.length ; i < len ; i++) {
			var elm = elms[i];
			setStarToPost(elm);
		}

		try {
			var favoritesLink = document.getElementById('favoritesLink');
			if (favoritesLink == null) {		
				var sparksNode = document.body.querySelector(SELECTOR.sparks);			
				
				var favoriteNode = document.createElement('a');
				favoriteNode.href = '';
				favoriteNode.id = 'favoritesLink';
				favoriteNode.className = class_stream_link;
				favoriteNode.innerHTML = 'Starred <strong>(' + favorites.length + ')</strong>';
				favoriteNode.onclick = function(){
					var nodes = sparksNode.parentNode.querySelectorAll('a');
					var ln = nodes.length;
					for (z = 0 ; z < ln ; z++) {
						var node = nodes[z];
						node.style.color = '#333';
						node.style.fontWeight = 'normal';
						try {
							if (node.className.indexOf(class_circle_link) != -1) {
								node.style.backgroundImage = 'url(https://ssl.gstatic.com/s2/oz/images/nav/nav_ci_link_icon.png)';
							}
						} catch(e){}
					}

					this.style.color = '';
					this.style.fontWeight = '';
					this.className = class_stream_link + ' selected';

					var postContainer = document.body.querySelector(SELECTOR.posts);
					postContainer.style.display = 'none';
					postContainer.nextSibling.innerHTML = '';

					try {
						var oldStarredContainer = document.getElementById('starred_container');
						oldStarredContainer.parentNode.removeChild(oldStarredContainer);
					} catch(e){}

					var divContainer = document.createElement('div');
					divContainer.id = 'starred_container';
					postContainer.parentNode.insertBefore(divContainer, postContainer);					

					var titlePage = document.body.querySelector(SELECTOR.sub_title);
					titlePage.innerHTML = 'Starred';

					var shareBox = document.body.querySelector(SELECTOR.share_box);
					shareBox.innerHTML = '';

					favorites = JSON.parse(localStorage['favorites']); // update if changes has been made in other tabs
					favorites.sort(sortDates);

					var ln = favorites.length;
					for (var i = 0 ; i < ln ; i++) {
						var favorite = favorites[i];
						addMiniPost(favorite, divContainer);
					}

					return false;
				}
				sparksNode.parentNode.insertBefore(favoriteNode, sparksNode);
			}
		} catch(e){}

		timer = setTimeout(update, 500);
	}

	function addMiniPost(favorite, container){
		var divMiniPost = document.createElement('div');
		divMiniPost.id = favorite.id;
		divMiniPost.className = 'minipost';

		var img = document.createElement('img');
		img.src = favorite.picture_url;
		divMiniPost.appendChild(img);

		var divStar = document.createElement('div');
		divStar.className = 'post_star';
		divStar.onclick = function(e) {
			e.stopPropagation();
			removeFavorite(favorite.id);
			storeFavorites();
			updateFavoriteCount();
			divMiniPost.parentNode.removeChild(divMiniPost);
		}
		divMiniPost.appendChild(divStar);

		var spanName = document.createElement('span');
		spanName.style.fontWeight = 'bold';
		spanName.style.color = '#36C';
		spanName.innerHTML = favorite.name;
		divMiniPost.appendChild(spanName);

		divMiniPost.appendChild(document.createTextNode(' - '));

		var spanDate = document.createElement('span');
		spanDate.style.color = '#999';
		spanDate.innerHTML = favorite.post_date;
		divMiniPost.appendChild(spanDate);

		var divContent = document.createElement('div');
		divContent.style.width = '90%';
		divContent.innerHTML = favorite.text;
		divMiniPost.appendChild(divContent);

		var divClear = document.createElement('div');
		divClear.style.clear = 'both';
		divMiniPost.appendChild(divClear);

		divMiniPost.onclick = function(e){
			window.open(favorite.post_url);
		}

		container.appendChild(divMiniPost);
	}

	function setCSSFromFunction(fnc) {	 
		var style = document.createElement('style');
		style.type = 'text/css';
		var string = fnc.toString();
		string = string.match(/\/\*([\s\S]*)\*\//)[1];
		style.textContent = string;
		document.getElementsByTagName('head')[0].appendChild(style);
	}

	function starred_css() {/*
		#favoritesLink {
			background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAoCAYAAADOvcv6AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAzNJREFUeNrsVUtPE1EUvvPsFNpAaGmnCU2qQuikCaHERIwQA5jgzh/AzoSk6sIEFN2zAmOILhA3/gY2LtyAxi0uWPTBQqqFQAot4dHCvNr63bGttMUGF+64TTN3zj3fnHO+c+YbhlywksmkpKrqGt0Xi8XBUCiUq/dhLwICNCkIQrcoij0sy0Yu8mHqDaurq7zP50u53W4fx3Fkb28vvbOz0zUyMmI2jSjL8gQAUmtrK5EkiWDPwfagIWIsFltmGGa8VCpJFWNnZ+eJw+Fw0v3p6ameTqfFKoBhVFy+MIlEIu1yuTxwJJdZ+XyeZDKZQxaZjB4cHBxns1mCqH8F0DP4UVAemCGLnGg06gCLKzAMeDwejuf5GpBpmmR/f7+AFc/lcsPhcPiwhtWNjY1UR0eHvz7tcnrZ3d1ducJulVVE7Uc6MmWzfrW0tNBLm9frvdnQDqQ6297eLoA16/7o6Mj609qozel08ihlrmYA4vF4AIcxv99vp46ox9A0LYkjDfUqqJun4K2tLdpXpbe3N1GJeBfjlaG1bG9v64ZhLKCeUDAY7MOsTmNyNHpmt9tTIGisGhH1DeGJnzCX33A7BcDa+RrX19e7MEVLAN2D331FUT4zzXrXbF0B/xX48+UTCf1bK78Vg9dfLV1OcwCaZBm2G33tQd8il4qYePqQt9lsKUySj46ZrulpVVO7gm8+NNccgCYAkHiOJxzL0QHnYGvUnM1nkWUM3jgpkarmiDbxBEBLczBmOgZePKeLlubw2NxGWlaEc8tZ2eBtEMvv4281KJiSruu3WKQyaujGsW7oCNpEc/CjPgDlgRmyyNl8HnGAwRUYBhCdA6O1LJeKFFCAb7xgFoZvvH5/WMPqj5nHKUEU/HVp0/QoMIta5Qq71Ucjaj/Skans16+yrc0m2ho1B6nOQncEpvw5MUzD+tPaqA0SQuVjrmYAkjOPAtjHIA12yo+mawamx9Ic1KugPVbu6plK+6oE5hf/aA4iZlA4OVPPdDxsAfWErs2/60PEaXz2NPSTsBybwtlYNVXcfC8Wii7Q/RW3dwJziy8qJGD/FtG7TcP8CB8vso5eScf/Av4SYACnRKyQdyiLMQAAAABJRU5ErkJggg==) 1px 6px no-repeat;
		}
		#favoritesLink.selected {
			background-position: 1px -14px;
			color: #e14b39;
			font-weight: bold;
		}

		div.post_star {
			position:absolute;
			top:38px;
			right:20px;
			width:14px;
			height:14px;
			background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAOCAYAAABKKc6PAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA7ZJREFUeNqkVV9oU1cYP+eee5Obf/2TpElcm5mipg3R2ozqZG1x2YT5INsUEbQvFhHHRCxVEB8GBZ+2hzlERRhYBg7Rh7INtodtWKWgKxY1k6SJUlqTtCEkaRObpLk3ubl+J9pAmmCDHgj35Dv3/L7f/X2/7xyMaozZ2Vk+l8tN0XmxWNzldDrT6D3G6OhRXo2bHmGMGJQWew6dvFqFx9TaCCSOcxy3WaFQbGEY5hv0nkPDNJ9oaDTamw0fbMEN/Mla71QRGR8fZzHG55uampR6vV4BRM7S2LuSGB8ZYQlhv9u6vY90be9nCGbP0di6RCwWywAhhNdoNIjneQRzArGv3pVIpG1xQKlQ8G2tbchkakEanY6LWONVeNjn8/0GCnwhyzK/GmxpaVnWarU6Os9ms2I0GlWUN2Ccg8c9IPl1e3t7bi3gzeunf8cM3luUpPKeT/o+FTZu3Kyk83B4Tpq49y8pK0GIKMvFu9jv90cNBoMJEtf1hZlMBsXj8aQkSdZaJr71y1Bs546PjTabrS68YPAF+m9y8iXUj3y2uLh4XxCEBvAE/eKaG0AxtLS0hJaXlzOwp6+zs7NmJ3FK1u3xPH4Qi0W0Pa4uBOrUxivK6MlTL5qbC61wStJbesvr9WqhS+5Ago9MJhNh2UovFQoFFIvFQARpOp1O97tcruTbvvL2lW+1KqPuLsuR7v5eF9Go+Yr1bDaH7k8+lVZyQiCREXoHB39KVtANBAJBUMW6tkxvypGIRCIWt9tdqNeoYzeGg93bbNZ2m6myHOE4mno0k9DPNFrcIyOFiq4BVbpBfgvtlrVDrVbTR6PZbO6pl8Svo0PdoL7lQ6uxaq11g566vnG+NdFT1b5QmgtwdnCrHkmlUqUf9QaN6XQ66qfv6yWi4siFrY42jpDXKQLPF5AvMF/yBo1tsplZtVpRxitlnZ6etkEyn9VqVdHE4Ic8mHcWlgTwiwN8Qw85FAqF6Lni6Ojo8L+NxM3RIRthZN/+fTtVhYKEHjx8lk+msiU8jVrp2LXDzlIyf/wFtwgjO44MXvavKrIbjvM49UI4HBbz+fxF8IMTOqML7pozCwsLAl1TqVRBMOzn66khS8XdRr0u/iIUR3/+/URMvVy52Py8wXlg4McuISed+efO/0J4PoEs5uYgLjIlPPbNxTYD94tBFMUJ+Dtst9unVkFhfsnj8YxBma4BiT2gjHfdumA8E42lDMlkdiIvisMHj10u4315+IdLN34+Nebzz18ThPweSF7CeyXAAFoogvWsxuyAAAAAAElFTkSuQmCC);
			background-position:0 0;
			background-repeat:no-repeat;
			cursor:pointer;
		}

		div.post_star.starred {
			background-position:-20px 0;
		}

		div.minipost {
			cursor:pointer;
			margin-left:20px;
			margin-right:20px;
			padding:15px;

			background-color:#FFF;
			margin-bottom:18px;
			border-radius:4px;	

			border-top:1px solid #DDD !important;
			border-left:1px solid #DDD;
			border-bottom:none !important;
			box-shadow: 1px 1px 1px #AAA;
		}
		div.minipost img {
			float:left;	
			border-radius:2px;
			box-shadow: 1px 1px 1px rgba(0,0,0,.4);	
			margin-right:12px;
		}
		div.minipost:hover {
			background-color:#edeff4;
		}
		div.minipost div.post_star {
			position:static;
			float:right;
			background-position:-20px 0;
		}
		div.minipost div.post_star.starred {
			display: none;
		}
*/}
	setCSSFromFunction(starred_css);

	var class_stream_link;
	var class_circle_link;

	var stream_link = document.querySelectorAll(SELECTOR.stream_link);
	if (stream_link.length) {
		class_stream_link = CLASSES.stream_link[0];
		class_circle_link = CLASSES.circle_link[0];
	}
	else {
		class_stream_link = CLASSES.stream_link[1];
		class_circle_link = CLASSES.circle_link[1];
	}

	update();

})();