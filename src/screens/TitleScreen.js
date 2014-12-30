(function (THREE, Clown, data) {

	"use strict";

	var TitleScreen = {

		name: "TitleScreen",

		scene: null,
		screen: null,

		count: 0,

		init: function (screen) {

			var dom = utils.dom;

			this.screen = screen;
			this.scene = new THREE.Scene();

			this.pp = Object.create(PlayerProxy).init(1, " ");
			this.pp.mesh.position.set(0, 0, -3);
			this.pp.mesh.rotation.y += Math.PI / 1.5;
			this.scene.add(this.pp.mesh);
			this.pp.body.add(Particles.group);

			dom.$("#playerName").value = Settings.playerName;
			var join = dom.$("#lezgo"),
				joinHandler = function () {
					join.removeEventListener("click", joinHandler, false);
					this.connect();
				}.bind(this);
			join.addEventListener("click", joinHandler, false);

			var create = dom.$("#lezcreate"),
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

			// TODO: init here, then join on join
			Network.init();

			utils.msg(" ");

			return this;
		},

		connect: function (createRoom) {

			var name = core.utils.cleanInput(utils.dom.$("#playerName").value),
				lobby = document.querySelector("#lobby");

			utils.dom.hide(lobby);

			if (name !== Settings.playerName) {
				Settings.playerName = name;
				main.saveSettings();
			}

			if (createRoom) {
				alert("sorry, no private games yet.");
			}

			if (!Network.socket) {
				console.error("Should have already got a connection");
				//self.next();
				//return;
			}

			utils.dom.$("#blocker").style.display = "";
			utils.dom.$("#instructions").style.display = "";
			utils.dom.$("#gui").style.display = "";
			utils.dom.$("#cursor").style.display = "";

			Network.joinTheWorld(name);
			this.next();

		},

		next: function () {
			var self = this;

			this.screen.unbindPointer = utils.bindPointerLock(utils.dom.$("#board"), function (state) {

				self.screen.onPointerLockChange(state);

			});

			this.screen.startGame();

		},

		tick: function () {

			this.pp.rottt();

			Particles.group.rotation.x -= 0.016;
			Particles.group.rotation.z += 0.002;
			Particles.group.rotation.y -= 0.0005;

			this.screen.camera.position.z = 1.5 + Math.sin(Date.now() / 1000) * 1;
			this.screen.camera.position.x = 0 + Math.sin(Date.now() / 1000) * 0.8;
		}

	};

	window.TitleScreen = TitleScreen;

}(
	window.THREE,
	window.Clown,
	window.data
));