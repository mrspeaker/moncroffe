(function (World, utils, THREE, Sound, data, user_settings, TitleScreen, WorldScreen) {

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

		havePointerLock: "pointerLockElement" in document || "mozPointerLockElement" in document || "webkitPointerLockElement" in document,

		init: function () {

			Sound._setVolume(0);

			data.init();
			data.textures = this.loadTextures();
			data.materials = this.createMaterials(data.textures);

			this.initUserSettings();
			this.init3d();

			this.screen = Object.create(TitleScreen).init(this);

			var self = this;
			utils.bindPointerLock(function (state) {
				self.onPointerLockChange(state);
			});

			this.run();

			utils.msg("");
		},

		initUserSettings: function () {

			window.Settings = utils.extend({}, user_settings);

			var stored = window.localStorage.getItem("settings");
			if (stored !== null && stored !== "undefined") {
				Settings = JSON.parse(stored);
			} else {
				this.saveSettings();
			}

		},

		saveSettings: function () {

			window.localStorage.setItem("settings", JSON.stringify(Settings));

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
					isKey = function (k) { return k === key; },
					s;

				if (Settings.oculus.some(isKey)) {
					this.toggleOculus();
					return;
				}

				if (Settings.ao.some(isKey)) {
					var pos = player.model.pos;
					this.screen.useAO = !this.screen.useAO;
					this.screen.world.reMeshChunk(pos.x / data.chunk.w | 0, pos.z / data.chunk.w | 0);
					return;
				}

				if (e.keyCode === 49 /*1*/) {
					s = Settings.mouse_sensitivity - 0.05;
					Settings.mouse_sensitivity = s;
					player.controls.setSensitivity(s);
					utils.msg("Sensitivity", s.toFixed(2));

					this.saveSettings();
				}
				if (e.keyCode === 50 /*2*/) {
					s = Settings.mouse_sensitivity + 0.05;
					Settings.mouse_sensitivity = s;
					player.controls.setSensitivity(s);
					utils.msg("Sensitivity", s.toFixed(2));

					this.saveSettings();
				}

				if (e.keyCode === 51 /*3*/) {
					this.vrControls && this.vrControls.zeroSensor();
				}

			}).bind(this), false);

			window.addEventListener("resize", this.setCameraDimensions.bind(this), false );
		},

		onPointerLockChange: function (state) {
			if (!this.screen.player) return;
			this.screen.player.controls.enabled = state;
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
	window.THREE,
	window.Sound,
	window.data,
	window.user_settings,
	window.TitleScreen,
	window.WorldScreen
));
