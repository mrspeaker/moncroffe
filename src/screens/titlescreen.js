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
				new THREE.Vector3(0, 0, -7),

				new THREE.Vector3(
					0.5,
					0.2,
					0.1
				),
				0,
				this.screen.materials.target);
		this.target = target;
		this.scene.add(target.mesh);

		return this;
	},

	next: function () {
		this.screen.screen = Object.create(WorldScreen).init(this.screen);
	},

	tick: function (dt) {
		this.target.mesh.rotation.x += 0.05;
		this.target.mesh.rotation.y += 0.055;
		this.target.mesh.rotation.z += 0.060;

		if (this.count++ === 60) {
			var self = this;
			// Join up the game
			this.screen.network = Object.create(Network).init(function () {
				self.next();
			});
		}
	}

};
