(function (THREE) {

	"use strict";

	var utils = {};

	utils.msg = function () {
		var dom = document.querySelector("#watch"),
			args = Array.prototype.slice.call(arguments);

		dom.innerHTML = "";

		args.forEach(function (m, i) {

			dom.innerHTML += m + (i < args.length - 1 ? " : " : "");

		});
	};

	utils.msgln = function () {

		var dom = document.querySelector("#watch"),
			args = Array.prototype.slice.call(arguments);

		dom.innerHTML += "<br/>";

		args.forEach(function (m, i) {

			dom.innerHTML += m + (i < args.length - 1 ? " : " : "");

		});

	};

	utils.showMsg = function (id, time) {

		time = time ? time * 1000 : 1000;
		document.querySelector("#bg").style.display = "block";
		document.querySelector(id).style.display = "";

		return setTimeout(function () {

			document.querySelector("#bg").style.display = "none";
			document.querySelector(id).style.display = "none";

		}, time);

	};

	utils.selectorAll = function (selector) {

		return Array.prototype.slice.call(document.querySelectorAll(selector));

	};

	utils.dom = {};
	utils.dom.show = function (el) { el.style.display = ""; };
	utils.dom.hide = function (el) { el.style.display = "none"; };
	utils.dom.$ = function (sel) { return document.querySelector(sel); }
	utils.dom.$$ = utils.selectorAll;
	utils.dom.on = function (sel, evnt, f) {

		var el = typeof sel === "string" ? utils.dom.$(sel) : sel;

		el.addEventListener(evnt, f, false);

	};

	utils.removeAllFromScene = function (scene) {

		scene.children.forEach(function (child) {

			scene.remove(child);

		});

		return scene;

	};

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

	utils.bindPointerLock = function (el, onChange) {

		var blocker = document.getElementById("blocker"),
			instructions = document.getElementById("instructions"),
			havePointerLock = "pointerLockElement" in document || "mozPointerLockElement" in document || "webkitPointerLockElement" in document;

		function unbind () {

			["pointerlockchange", "mozpointerlockchange", "webkitpointerlockchange"].forEach(function (e) {

				document.removeEventListener(e, pointerlockchange, false);

			});

			["pointerlockerror", "mozpointerlockerror", "webkitpointerlockerror"].forEach(function (e) {

				document.removeEventListener(e, pointerlockerror, false);

			});

			blocker.style.display = "none";
			instructions.style.display = "none";

			(document.exitPointerLock ||
				document.mozExitPointerLock ||
				document.webkitExitPointerLock).call(document);

		}

		if (havePointerLock) {
			var element = el; //document.body;
			var pointerlockchange = function () {

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

			};

			var pointerlockerror = function () {

				instructions.style.display = "";

			};

			["pointerlockchange", "mozpointerlockchange", "webkitpointerlockchange"].forEach(function (e) {

				document.addEventListener(e, pointerlockchange, false);

			});

			["pointerlockerror", "mozpointerlockerror", "webkitpointerlockerror"].forEach(function (e) {

				document.addEventListener(e, pointerlockerror, false);

			});

			instructions.addEventListener("click", function () {

				instructions.style.display = "none";
				// Ask the browser to lock the pointer
				element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
				element.requestPointerLock();

			}, false);
		} else {

			instructions.innerHTML = "Your browser doesn't seem to support Pointer Lock API";

		}

		return unbind;
	};

	utils.texturify = function (cube, tile, surround) {

		if (!surround) {

			surround = {
				front: false,
				right: false,
				back: false,
				left: false,
				top: false,
				bottom: false
			};

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

	};

	utils.createCanvasPlane = function (w, h, drawFunc) {

		var canvas = document.createElement("canvas"),
			ctx = canvas.getContext("2d"),
			scale = 0.01,
			texture,
			material,
			geometry,
			planeMesh;

		canvas.width = w;
		canvas.height = h;

		drawFunc(ctx, w, h);

		texture = new THREE.Texture(canvas);
		texture.needsUpdate = true;

		material = new THREE.MeshBasicMaterial({
			map: texture,
			side: THREE.DoubleSide,
			transparent: true
		});

		geometry = new THREE.PlaneBufferGeometry(canvas.width, canvas.height, 1, 1);
		planeMesh = new THREE.Mesh(geometry, material);

		planeMesh.scale.set(scale, scale, scale);

		return planeMesh;

	};

	window.utils = utils;

}(
	window.THREE
));
