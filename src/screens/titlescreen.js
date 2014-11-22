var TitleScreen = {

	name: "TitleScreen",

	scene: null,
	screen: null,

	count: 0,

	init: function (screen) {

		this.screen = screen;
		this.scene = new THREE.Scene();

		// Spinny intro
		var target = Object
			.create(Target)
			.init(
				0,
				new THREE.Vector3(0, 0, -7),
				new THREE.Vector3(0.5, 0.2, 0.1),
				0,
				this.screen.materials.target);
		this.target = target;
		this.scene.add(target.mesh);

		this.button = document.querySelector("#lezgo");
		this.button.addEventListener("click", (function joinit (e) {
			this.join();
			this.button.removeEventListener("click", joinit);
		}).bind(this), false);

		return this;
	},

	join: function () {
		var self = this,
			name = document.querySelector("#playerName").value,
			lobby = document.querySelector("#lobby");
		lobby.style.display = "none";
		this.screen.network = Object.create(Network).init(name, function () {
			self.next();
		});
	},

	next: function () {
		this.screen.screen = Object.create(WorldScreen).init(this.screen);
	},

	tick: function (dt) {
		this.target.mesh.rotation.x += 0.05;
		this.target.mesh.rotation.y += 0.055;
		this.target.mesh.rotation.z += 0.060;
	}

};
