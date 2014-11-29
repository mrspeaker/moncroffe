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
			var clown = Object
				.create(Clown)
				.init(
					0,
					new THREE.Vector3(0, 0, -7),
					new THREE.Vector3(0.5, 0.2, 0.1),
					0,
					data.materials.target);
			this.clown = clown;
			this.scene.add(clown.mesh);

			clown.mesh.rotation.x += Math.PI;

			document.querySelector("#playerName").value = Settings.playerName;
			this.button = document.querySelector("#lezgo");
			this.button.addEventListener("click", (function joinit () {
				this.join();
				this.button.removeEventListener("click", joinit);
			}).bind(this), false);

			document.querySelector("#gui").style.display = "none";
			document.querySelector("#cursor").style.display = "none";
			document.querySelector("#blocker").style.display = "none";
			document.querySelector("#instructions").style.display = "none";

			return this;
		},

		join: function () {
			var self = this,
				name = document.querySelector("#playerName").value,
				lobby = document.querySelector("#lobby");
			lobby.style.display = "none";
			if (name !== Settings.playerName) {
				Settings.playerName = name;
				main.saveSettings();
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
			this.clown.mesh.rotation.x += 0.05;
			this.clown.mesh.rotation.y += 0.055;
			this.clown.mesh.rotation.z += 0.060;
		}

	};

	window.TitleScreen = TitleScreen;

}(
	window.THREE,
	window.Clown,
	window.data
));