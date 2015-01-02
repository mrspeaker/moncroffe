(function (THREE, Network, Particles, PlayerProxy, data, core, utils) {

	"use strict";

	var TitleScreen = {

		name: "TitleScreen",

		scene: null,
		screen: null,

		count: 0,

		init: function (screen) {

			this.screen = screen;
			this.scene = new THREE.Scene();
			this.addMan();

			this.initDOM();
			Network.init();
			utils.msg(" ");

			window.noise.seed((Math.random() * 20000) | 0);
			Test.run(this.scene);

			return this;
		},

		initDOM: function () {

			var dom = utils.dom,
				join = dom.$("#lezgo"),
				create = dom.$("#lezcreate"),
				joinHandler,
				createHandler;

			dom.$("#playerName").value = window.Settings.playerName;

			joinHandler = function () {

				join.removeEventListener("click", joinHandler, false);
				this.connect();

			}.bind(this);

			join.addEventListener("click", joinHandler, false);

			createHandler = function () {

				create.removeEventListener("click", createHandler);
				this.connect(true);

			}.bind(this);

			create.addEventListener("click", createHandler, false);

			dom.hide(dom.$("#gui"));
			dom.hide(dom.$("#cursor"));
			dom.hide(dom.$("#blocker"));
			dom.hide(dom.$("#instructions"));
			dom.$$("#bg > div").forEach(dom.hide);

			dom.show(dom.$("#lobby"));

		},

		addMan: function () {

			this.pp = Object.create(PlayerProxy).init(1, " ");
			this.pp.mesh.position.set(0, 0, -3);
			this.pp.mesh.rotation.y += Math.PI / 1.5;
			this.scene.add(this.pp.mesh);
			this.pp.body.add(Particles.group);

		},

		connect: function (createRoom) {

			var dom = utils.dom,
				name = core.utils.cleanInput(dom.$("#playerName").value),
				lobby = document.querySelector("#lobby");

			dom.hide(lobby);

			if (name !== window.Settings.playerName) {

				window.Settings.playerName = name;
				this.screen.saveSettings();

			}

			if (createRoom) {

				alert("sorry, no private games yet.");

			}

			if (!Network.socket) {

				console.error("Should have already got a connection");

			}

			dom.$("#blocker").style.display = "";
			dom.$("#instructions").style.display = "";
			dom.$("#gui").style.display = "";
			dom.$("#cursor").style.display = "";

			Network.joinTheWorld(name);
			this.next();

		},

		next: function () {

			var screen = this.screen;

			screen.unbindPointer = utils.bindPointerLock(utils.dom.$("#board"), function (state) {

				screen.onPointerLockChange(state);

			});

			screen.startGame();

		},

		receiveHiScores: function (s) {

			console.log(s);

		},

		tick: function () {

			this.pp.rottt();

			Particles.group.rotation.x -= 0.016;
			Particles.group.rotation.z += 0.002;
			Particles.group.rotation.y -= 0.0005;

			this.screen.camera.position.x = 0 + Math.sin(Date.now() / 1000) * 0.8;
			this.screen.camera.position.z = 1.5 + Math.sin(Date.now() / 1000) * 1;
		}

	};

	window.TitleScreen = TitleScreen;

}(
	window.THREE,
	window.Network,
	window.Particles,
	window.PlayerProxy,
	window.data,
	window.core,
	window.utils
));
