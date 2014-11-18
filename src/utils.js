(function () {

	"use strict";

	var utils = {};

	utils.msg = function (m) {
		var dom = document.querySelector("#watch"),
			args = Array.prototype.slice.call(arguments);
		dom.innerHTML = "";
		args.forEach(function (m, i) {
			dom.innerHTML += m + (i < args.length - 1 ? " : " : "");
		});
	}

	utils.msgln = function (m) {
		var dom = document.querySelector("#watch"),
			args = Array.prototype.slice.call(arguments);
		dom.innerHTML += "<br/>";
		args.forEach(function (m, i) {
			dom.innerHTML += m + (i < args.length - 1 ? " : " : "");
		});
	}

	utils.rnd = {

		seed: 42,

		rand: function(max, min) {

			max = max || 1;
			min = min || 0;

			this.seed = (this.seed * 9301 + 49297) % 233280;

			return ((this.seed / 233280) * (max - min) + min) | 0;
		},

		randf: function() {

			this.seed = (this.seed * 9301 + 49297) % 233280;

			return this.seed / 233280;

		}

	},

	utils.dist = function (v1, v2) {
    	var dx = v1.x - v2.x,
    		dy = v1.y - v2.y,
    		dz = v1.z - v2.z;

    	return Math.sqrt(dx*dx+dy*dy+dz*dz);
	}

	utils.urlParams = (function () {
		if (!window.location && !window.location.search) {
			return {};
		}
		var params = {},
			match,
			pl = /\+/g,  // Regex for replacing addition symbol with a space
			search = /([^&=]+)=?([^&]*)/g,
			decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
			query = window.location.search.substring(1);

		while (match = search.exec(query)) {
		   params[decode(match[1])] = decode(match[2]);
		}

		return params;
	}());

	/*
		Make a 2D array of X/Z coords in
		spiral order: so load chunks closest first.
	*/
	utils.spiral2D = function (radius) {
		var w = 0, wdir = 1,
			h = 0, hdir = 1,
			x = 0,
			y = 0,
			path = [];

		// Spiral pattern
		while (radius--) {
			w++;
			h++;

			// Moving left/up
			for (;x < w * wdir; x += wdir) {
				path.push([x, y]);
			}

			for (;y < h * hdir; y += hdir) {
				path.push([x, y]);
			}

			wdir = wdir * -1;
			hdir = hdir * -1;

			// Moving right/down
			for (;x > w * wdir; x += wdir) {
				path.push([x, y]);
			}

			for (;y > h * hdir; y += hdir) {
				path.push([x, y]);
			}

			wdir = wdir * -1;
			hdir = hdir * -1;

		};

		return path;
	};

	utils.bindPointerLock = function (onChange) {

		var blocker = document.getElementById( 'blocker' ),
			instructions = document.getElementById( 'instructions' ),
			havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

		if (havePointerLock) {
			var element = document.body;
			var pointerlockchange = function ( event ) {
				if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
					onChange(true);
					blocker.style.display = "none";
				} else {
					onChange(false);
					blocker.style.display = "-webkit-box";
					blocker.style.display = "-moz-box";
					blocker.style.display = "box";
					instructions.style.display = "";
				}
			}

			var pointerlockerror = function ( event ) {
				instructions.style.display = "";
			};

			["pointerlockchange", "mozpointerlockchange", "webkitpointerlockchange"].forEach(function (e) {
				document.addEventListener(e, pointerlockchange, false );
			});

			["pointerlockerror", "mozpointerlockerror", "webkitpointerlockerror"].forEach(function (e) {
				document.addEventListener(e, pointerlockerror, false );
			});

			instructions.addEventListener("click", function ( event ) {
				instructions.style.display = "none";
				// Ask the browser to lock the pointer
				element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
				element.requestPointerLock();
			}, false );
		} else {
			instructions.innerHTML = "Your browser doesn't seem to support Pointer Lock API";
		}
	}

	// extends 'from' object with members from 'to'. If 'to' is null, a deep clone of 'from' is returned
	utils.extend = function (from, to) {
	    if (from == null || typeof from != "object") return from;
	    if (from.constructor != Object && from.constructor != Array) return from;
	    if (from.constructor == Date || from.constructor == RegExp || from.constructor == Function ||
	        from.constructor == String || from.constructor == Number || from.constructor == Boolean)
	        return new from.constructor(from);

	    to = to || new from.constructor();

	    for (var name in from)
	    {
	        to[name] = typeof to[name] == "undefined" ? extend(from[name], null) : to[name];
	    }

	    return to;
	}

	utils.texturify = function (cube, tile, surround) {

		if (!surround) {
			surround = {
				front: false,
				right: false,
				back: false,
				left: false,
				top: false,
				bottom: false
			}
		}

		function getBlock(x, y) {
			return [
				new THREE.Vector2(x / 16, y / 16),
				new THREE.Vector2((x + 1) / 16, y / 16),
				new THREE.Vector2(x / 16, (y + 1) / 16),
				new THREE.Vector2((x + 1) / 16, (y + 1) / 16)
			];
		}

		var front = getBlock(tile[0][0], tile[0][1]),
			left = getBlock(tile[1][0], tile[1][1]),
			back = getBlock(tile[2][0], tile[2][1]),
			right = getBlock(tile[3][0], tile[3][1]),
			bottom = getBlock(tile[4][0], tile[4][1]),
			top = getBlock(tile[5][0], tile[5][1]),
			faceUVs = cube.faceVertexUvs;

		// Set UV texture coords for the cube
		faceUVs[0] = [];
		if (!surround.front) {
			faceUVs[0].push([front[0], front[1], front[3]]);
			faceUVs[0].push([front[0], front[3], front[2]]);
		}
		if (!surround.left) {
			faceUVs[0].push([left[0], left[1], left[3]]);
			faceUVs[0].push([left[0], left[3], left[2]]);
		}
		if (!surround.back) {
			faceUVs[0].push([back[0], back[1], back[3]]);
			faceUVs[0].push([back[0], back[3], back[2]]);
		}
		if (!surround.right) {
			faceUVs[0].push([right[0], right[1], right[3]]);
			faceUVs[0].push([right[0], right[3], right[2]]);
		}
		if (!surround.bottom) {
			faceUVs[0].push([bottom[0], bottom[1], bottom[3]]);
			faceUVs[0].push([bottom[0], bottom[3], bottom[2]]);
		}
		if (!surround.top) {
			faceUVs[0].push([top[0], top[1], top[3]]);
			faceUVs[0].push([top[0], top[3], top[2]]);
		}

		return cube;

	}

	window.utils = utils;

}());
