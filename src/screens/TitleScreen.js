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

			utils.msg(" ");

			return this;
		},

		connect: function (createRoom) {

			var self = this,
				name = core.utils.cleanInput(utils.dom.$("#playerName").value),
				lobby = document.querySelector("#lobby");

			utils.dom.hide(lobby)

			if (name !== Settings.playerName) {
				Settings.playerName = name;
				main.saveSettings();
			}

			if (createRoom) {
				alert("sorry, no private games yet.");
			}

			if (Network.socket) {
				console.log("already connected");
				self.next();
				return;
			}

			Network.init(name, function () {
				utils.dom.$("#blocker").style.display = "";
				utils.dom.$("#instructions").style.display = "";
				utils.dom.$("#gui").style.display = "";
				utils.dom.$("#cursor").style.display = "";

				self.next();
			});
		},

		next: function () {

			this.screen.startGame();

		},

		tick: function () {

			//this.clown.mesh.rotation.x += 0.05;
			//this.clown.mesh.rotation.y += 0.055;
			//this.clown.mesh.rotation.z += 0.060;

			this.pp.rottt();

		}

	};

	window.TitleScreen = TitleScreen;

}(
	window.THREE,
	window.Clown,
	window.data
));