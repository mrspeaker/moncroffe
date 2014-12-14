(function (THREE, Clown, data) {

	"use strict";

	var TitleScreen = {

		name: "TitleScreen",

		scene: null,
		screen: null,

		count: 0,

		init: function (screen) {

			this.screen = screen;
			this.scene = new THREE.Scene();

			// Spinny intro
			/*var clown = Object
				.create(Clown)
				.init(
					0,
					new THREE.Vector3(0, 0, -7),
					new THREE.Vector3(0.5, 0.2, 0.1),
					0,
					data.materials.target);
			this.clown = clown;*/

			//this.scene.add(clown.mesh);
			//clown.mesh.rotation.x += Math.PI;

			this.pp = Object.create(PlayerProxy).init(1, " ");
			this.pp.mesh.position.set(0, 0, -3);
			this.pp.mesh.rotation.y += Math.PI / 1.5;

			this.scene.add(this.pp.mesh);

			document.querySelector("#playerName").value = Settings.playerName;
			var join = document.querySelector("#lezgo"),
				joinHandler = function () {
					join.removeEventListener("click", joinHandler, false);
					this.connect();
				}.bind(this);
			join.addEventListener("click", joinHandler, false);

			var create = document.querySelector("#lezcreate"),
				createHandler = function () {
					create.removeEventListener("click", createHandler);
					this.connect(true);
				}.bind(this);
			create.addEventListener("click", createHandler, false);

			document.querySelector("#gui").style.display = "none";
			document.querySelector("#cursor").style.display = "none";
			document.querySelector("#blocker").style.display = "none";
			document.querySelector("#instructions").style.display = "none";

			document.querySelector("#lobby").style.display = "block";
			utils.msg(" ");

			return this;
		},

		connect: function (createRoom) {
			var self = this,
				name = core.utils.cleanInput(document.querySelector("#playerName").value),
				lobby = document.querySelector("#lobby");
			lobby.style.display = "none";

			if (name !== Settings.playerName) {
				Settings.playerName = name;
				main.saveSettings();
			}

			if (createRoom) {
				alert("sorry, no private games yet.");
			}

			Network.init(name, function () {
				document.querySelector("#blocker").style.display = "";
				document.querySelector("#instructions").style.display = "";
				document.querySelector("#gui").style.display = "";
				document.querySelector("#cursor").style.display = "";

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