(function (World, core, utils, THREE, Sound, data, user_settings, TitleScreen, WorldScreen) {

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

		network: null, // TODO: do real network thingo.
		screen: null,
		lastScene: null,

		havePointerLock: "pointerLockElement" in document || "mozPointerLockElement" in document || "webkitPointerLockElement" in document,

		init: function () {

			Sound._setVolume(0);

			data.init();
			data.textures = this.loadTextures();
			data.materials = this.createMaterials(data.textures);

			this.initUserSettings();
			this.init3d();

			this.reset();

			var self = this;

			utils.dom.on("#exitGame", "click", function (e) {

				main.reset();

			});

			this.run();

		},

		reset: function () {

			this.unbindPointer && this.unbindPointer();
			if (Network.socket) {
				Network.leaveTheWorld();
				//Network.socket.io.disconnect();
				// hmm... if i don't disconnect, I'll still get messages from the game?!
			}

			if (this.screen && this.screen.scene) {
				utils.removeAllFromScene(this.screen.scene);
			}
			// LOl... old camera gets borked when switching scenes
			// hack is just replace it. Figure it out, yo.
			this.camera = new THREE.PerspectiveCamera(85, 1, 0.01, 500);
			this.setCameraDimensions();
			this.screen = Object.create(TitleScreen).init(this);

		},

		startGame: function () {

			utils.removeAllFromScene(this.screen.scene);

			this.screen = Object.create(WorldScreen).init(this);

		},

		initUserSettings: function () {

			var Settings = window.Settings = core.utils.extend({}, user_settings);

			var stored = window.localStorage.getItem("settings");
			if (stored !== null && stored !== "undefined") {
				window.Settings = core.utils.extend(window.Settings, JSON.parse(stored));
			} else {
				this.saveSettings();
			}

		},

		saveSettings: function () {

			window.localStorage.setItem("settings", JSON.stringify(window.Settings));

		},

		makeAzerty: function () {

			var Settings = window.Settings;

			Settings.up = Settings.up.filter(function (k) { return k !== 87; }).concat([90]); // remove W, add Z
			Settings.left = Settings.left.filter(function (k) { return k !== 65; }).concat([81]); // remove A, add Q
			this.saveSettings();
			alert("need to refresh...");
			console.log("game french-ified");

		},

		makeQwerty: function () {

			var Settings = window.Settings;

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
			document.addEventListener("keydown", (function (e) {

				var key = e.keyCode,
					isKey = function (k) { return k === key; },
					s,
					Settings = window.Settings;

				if (Settings.oculus.some(isKey)) {
					this.toggleOculus();
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
					Settings.invert_mouse = !Settings.invert_mouse;
					main.reset();
				}

				if (Settings.ao.some(isKey)) {
					var pos = player.model.pos;
					this.screen.useAO = !this.screen.useAO;
					this.screen.world.reMeshChunk(pos.x / data.chunk.w | 0, pos.z / data.chunk.w | 0);
					return;
				}

				if (e.keyCode === 53 /*5*/) {
					if (this.vrControls) {
						this.vrControls.zeroSensor();
					}
				}

				if (e.keyCode === 84) {
					this.toggleChat();
					e.preventDefault();
				}

			}).bind(this), false);

			window.addEventListener("resize", this.setCameraDimensions.bind(this), false);

			// Hide all the HUDS
			Array.prototype.slice.call(document.querySelectorAll("#bg > div")).forEach(function (el) {
				el.style.display = "none";
			});

			var self = this;
			document.querySelector("#chatMsg").addEventListener("keydown", function (e) {

				e.stopPropagation();

				if (e.keyCode === 13) {
					if (this.value !== "") {
						window.Network.sendChat(this.value);
					}
					self.toggleChat();
				}

			});

			window.onbeforeunload = function() {
				if (!window.askToLeave) {
					return;
				}
				return 'Sure you wanna leave?';
			};

		},

		toggleChat: function () {

			var box = document.querySelector("#chatMsg"),
				visible = box.style.display === "block";

			box.style.display = visible ? "none" : "block";
			visible = !visible;

			if (visible) {
				box.value = "";
				box.focus();
			}

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
				night: THREE.ImageUtils.loadTexture("res/images/night.jpg"),
				uparrow: THREE.ImageUtils.loadTexture("res/images/uparrow.png"),
				plants: THREE.ImageUtils.loadTexture("res/images/plants.png")
			};

			t.blocks.magFilter = THREE.NearestFilter;
			t.blocks.minFilter = THREE.NearestFilter;

			t.night.wrapS = t.night.wrapT = THREE.RepeatWrapping;
			t.night.repeat.set(3, 3);

			t.plants.magFilter = THREE.NearestFilter;
			t.plants.minFilter = THREE.NearestFilter;

			t.uparrow.magFilter = THREE.NearestFilter;
			t.uparrow.minFilter = THREE.NearestFilter;
			t.uparrow.wrapS = t.uparrow.wrapT = THREE.RepeatWrapping;
			t.uparrow.repeat.set(30, 30);

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
				depthWrite	: false,
				transparent	: true,
				opacity: 0.75
			});

			m.target2 = new THREE.MeshBasicMaterial({
				map: textures.blocks,
				color : 0xff44aa
			});

			m.blocks = new THREE.MeshLambertMaterial({
				map: textures.blocks,
				wrapAround: true,
				vertexColors: THREE.VertexColors,
				wireframe: false
			});

			m.arrow = new THREE.MeshLambertMaterial({
				map: textures.uparrow,
				transparent: true,
				opacity: 0.2,
				side: THREE.DoubleSide
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

		tick: function () {

			var delta = this.clock.getDelta() / this.oneFrameEvery;
			delta = Math.min(60 / 1000, delta); // HACK: Limit for physics
			var dt = delta * 1000 | 0;
			if (dt < 15 || dt > 21) {
				//utils.msg(dt); // Track big/small updates
			}

			if (this.screen.scene && this.screen.name !== this.lastScene) {

				this.lastScene = this.screen.name;

				// Create a new composer
				if (this.screen.name === "WorldScreen") {
					this.composer = new THREE.EffectComposer(this.renderer);
					this.composer.addPass(new THREE.RenderPass(this.screen.scene, this.camera));

					var effect = new THREE.ShaderPass(THREE.VignetteShader);
					this.vignetteEffect = effect.uniforms["darkness"];
					this.vignetteEffect.value = 1.2;
					this.composer.addPass( effect );

					var effect = new THREE.ShaderPass( THREE.HueSaturationShader );
					effect.uniforms["saturation"].value = 0.6;
					this.hue = effect.uniforms["hue"];

					effect.renderToScreen = true;
					this.composer.addPass( effect );
				} else {
					this.composer = null;
				}
			}

			if (this.hue) {
				//-35 to 10
				//-1 to 1
				this.hue.value = (((Math.sin(Date.now() / 20000) + 1) * 0.5) * 40 - 30) / 100;
			}

			this.screen.tick(delta);

		},

		render: function () {

			if (!this.isOculus) {
				if (this.composer) {
					this.composer.render();
				} else {
					this.renderer.render(this.screen.scene, this.camera);
				}
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
	window.core,
	window.utils,
	window.THREE,
	window.Sound,
	window.data,
	window.user_settings,
	window.TitleScreen,
	window.WorldScreen
));
