(function (World, utils, THREE) {

	"use strict";

	var main = {

		isOculus: false,

		frame: 0,
		oneFrameEvery: 1, // Slow down time, for testing
		quality: 1, // Divides the screen width/height and streches the canvas

		camera: null,
		renderer: null,
		vrRenderer: null,
		vrControls: null,
		clock: null,

		textures: {},
		materials: {},

		network: null,
		screen: null,

		init: function () {

			data.init();
			data.textures = this.loadTextures();
			data.materials = this.createMaterials(data.textures);

			this.initUserSettings();
			this.init3d();

			this.screen = Object.create(TitleScreen).init(this);

			this.run();

			utils.msg("");
		},

		initUserSettings: function () {

			window.Settings = utils.extend({}, user_settings);

			var stored = window.localStorage.getItem("settings");
			if (stored !== null) {
				Settings = JSON.parse(stored);
			}

		},

		saveSettings: function () {

			var s = window.Settings;
			console.log(s, "SSS")
			window.localStorage.setItem("settings", JSON.stringify(s));

		},

		makeAzerty: function () {

			Settings.up = Settings.up.filter(function (k) { return k !== 87; }).concat([90]); // remove W, add Z
			Settings.left = Settings.left.filter(function (k) { return k !== 65; }).concat([81]); // remove A, add Q
			this.saveSettings();
			alert("need to refresh...");
			console.log("game french-ified");

		},

		makeQwerty: function () {

			Settings.up = Settings.up.filter(function (k) { return k !== 90; }).concat([87]); // remove Z, add W
			Settings.left = Settings.left.filter(function (k) { return k !== 81; }).concat([65]); // remove Q, add A
			this.saveSettings();
			alert("need to refresh...");

		},

		init3d: function () {

			this.renderer = new THREE.WebGLRenderer();

			this.vrRenderer = new THREE.VREffect(this.renderer, function (err) {
				if (err) {
					console.error("vr error:", err);
				}
			});
			this.camera = new THREE.PerspectiveCamera(85, 1, 0.01, 500);
			this.setCameraDimensions();
			this.vrControls = new THREE.VRControls(this.camera);

			this.clock = new THREE.Clock();

			document.querySelector("#board").appendChild(this.renderer.domElement);

		},

		bindHandlers: function (player) {

			document.addEventListener("mousedown", (function(e){

				if (!player.controls.enabled) {
					return;
				}

				if (e.shiftKey || e.button !== 0) {
					this.screen.doRemoveBlock = true;
				} else {
					this.screen.doAddBlock = true;
				}

			}).bind(this), false);

			// Stop right-click menu
			document.addEventListener("contextmenu", function(e) {

				e.preventDefault();
				return false;

			}, false);

			var onMouseWheel = function (e) {

				var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
				player.changeTool(-delta);

			};

			document.addEventListener("mousewheel", onMouseWheel, false);
			document.addEventListener("DOMMouseScroll", onMouseWheel, false);
			document.addEventListener("keydown", (function(e){

				var key = e.keyCode,
					isKey = function (k) { return k === key };

				if (Settings.oculus.some(isKey)) {
					this.toggleOculus();
					return;
				}

				if (Settings.ao.some(isKey)) {
					var pos = player.playerObj.position;
					this.screen.useAO = !this.screen.useAO;
					this.screen.world.reMeshChunk(pos.x / data.chunk.w | 0, pos.z / data.chunk.w | 0);
					return;
				}

				if (e.keyCode === 49 /*1*/) {
					var s = Settings.mouse_sensitivity - 0.05;
					Settings.mouse_sensitivity = s;
					player.controls.setSensitivity(s);
					utils.msg("Sensitivity", s.toFixed(2));

					this.saveSettings();
				}
				if (e.keyCode === 50 /*2*/) {
					var s = Settings.mouse_sensitivity + 0.05;
					Settings.mouse_sensitivity = s;
					player.controls.setSensitivity(s);
					utils.msg("Sensitivity", s.toFixed(2));

					this.saveSettings();
				}

				if (e.keyCode === 51 /*3*/) {
					this.vrControls && this.vrControls.zeroSensor();
				}

			}).bind(this), false);

			utils.bindPointerLock(function (state) {

				player.controls.enabled = state;

			});

			window.addEventListener("resize", this.setCameraDimensions.bind(this), false );
		},

		setCameraDimensions: function () {

			var w = window.innerWidth,
				h = window.innerHeight,
				quality = this.quality;

			this.camera.aspect = w / h;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize(w / quality, h / quality);
			this.vrRenderer.setSize(w / quality, h / quality);

		},

		loadTextures: function () {

			var t = {
				blocks: THREE.ImageUtils.loadTexture("res/images/terrain.png"),
				night: THREE.ImageUtils.loadTexture("res/images/night.jpg")
			};

			t.blocks.magFilter = THREE.NearestFilter;
			t.blocks.minFilter = THREE.NearestFilter;

			t.night.wrapS = t.night.wrapT = THREE.RepeatWrapping;
			t.night.repeat.set(3, 3);

			return t;

		},

		createMaterials: function (textures) {

			var m = {};

			m.bullet = new THREE.MeshBasicMaterial({
				blending	: THREE.AdditiveBlending,
				color		: 0x4444aa,
				depthWrite	: false,
				transparent	: true
			});

			m.target = new THREE.MeshBasicMaterial({
				map: textures.blocks,
				//color		: 0xff44aa,
				depthWrite	: false,
				transparent	: true,
				opacity: 0.5
			});

			m.blocks = new THREE.MeshLambertMaterial({
				map: textures.blocks,
				wrapAround: true,
				vertexColors: THREE.VertexColors,
				wireframe: false
			});

			return m;
		},

		toggleOculus: function () {

			this.isOculus = !this.isOculus;
			this.setCameraDimensions();
			document.querySelector("#cursor").className = this.isOculus ? "oculus" : "";

		},

		run: function () {

			if (this.frame++ % this.oneFrameEvery === 0) {
				this.tick();
				this.render();
			}

			requestAnimationFrame(function () { main.run(); });

		},

		startGame: function () {
			this.screen = Object.create(WorldScreen).init(this);
		},

		tick: function () {

			var delta = this.clock.getDelta() / this.oneFrameEvery;
			delta = Math.min(60 / 1000, delta); // HACK: Limit for physics
			var dt = delta * 1000 | 0;
			if (dt < 15 || dt > 21) {
				//utils.msg(dt); // Track big/small updates
			}

			this.screen.tick(delta);

		},

		tryMove: function (e, move) {

			var p = e.playerObj.position.clone(),
				bb = e.bb,
				block = this.screen.world.isBlockAt.bind(this.screen.world);

			var xl = Math.round(p.x - (bb.w / 2)),
				xr = Math.round(p.x + (bb.w / 2)),
				nxl = Math.round((p.x + move.x) - (bb.w / 2)),
				nxr = Math.round((p.x + move.x) + (bb.w / 2));

			var zl = Math.round(p.z - (bb.d / 2)),
				zr = Math.round(p.z + (bb.d / 2)),
				nzl = Math.round((p.z + move.z) - (bb.d / 2)),
				nzr = Math.round((p.z + move.z) + (bb.d / 2));

			var yb = Math.round(p.y - (bb.h / 2)),
				yt = Math.round(p.y + (bb.h / 2) - 0.5),
				nyb = Math.round((p.y + move.y) - (bb.h / 2) - 0.5), // Erm, why -0.5? dunno. Mabye replace yb/yt Math.round with floor.
				nyt = Math.round((p.y + move.y) + (bb.h / 2) - 0.5);

			// Ensure not out of bounds: down or up.
			if (nyb < 0) nyb = 0;
			if (nyt < 1) nyt = 1;
			if (nyt > data.chunk.h - 1) nyt = data.chunk.h - 1;

			// Check forward/backward
			if (!(
				block(xl, yb, nzl) || block(xr, yb, nzl) || block(xl, yb, nzr) || block(xr, yb, nzr) ||
				block(xl, yt, nzl) || block(xr, yt, nzl) || block(xl, yt, nzr) || block(xr, yt, nzr)
			)) {
				p.z += move.z;
				zl = nzl;
				zr = nzr;
			}

			// Check left/right
			if (!(
				block(nxl, yb, zl) || block(nxl, yb, zr) || block(nxr, yb, zl) || block(nxr, yb, zr) ||
				block(nxl, yt, zl) || block(nxl, yt, zr) || block(nxr, yt, zl) || block(nxr, yt, zr)
			)) {
				p.x += move.x;
				xl = nxl;
				xr = nxr;
			}

			// Check bottom
			var hitGround = true,
				pushingAndJumping = (move.y > 0 && (move.z || move.y));
			if (pushingAndJumping || !(block(xl, nyb, zl) || block(xr, nyb, zl) || block(xl, nyb, zr) || block(xr, nyb, zr))) {
				hitGround = false;
				p.y += move.y;
			} else {
				p.y = yb + (bb.h / 2);
			}

			// Check top:
			/*
				TODO: this ain't quite right - "slide down" cubes
				Always detects a head hit if you are jumping and pushing.
				It's detecting the sides not just the top
				- Maybe a resolution problem: if sides, move back, if top move down
				- Maybe because of forward/back and left/right done togetehr?
			*/
			if (block(xl, nyt, zl) || block(xr, nyt, zl) || block(xl, nyt, zr) || block(xr, nyt, zr)) {
				//p.y = nyt - (bb.h / 2); // can't force down because it's detecting sides, not just top
				hitGround = true;
			}

			return { x: p.x, y: p.y, z: p.z, ground: hitGround };
		},

		render: function () {

			if (!this.isOculus) {
				this.renderer.render(this.screen.scene, this.camera);
			} else {
				this.vrControls.update();
				this.vrRenderer.render(
					this.screen.scene,
					this.camera);
			}

		}
	};

	window.main = main;

}(
	window.World,
	window.utils,
	window.THREE
));
