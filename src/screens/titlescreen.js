var TitleScreen = {

	scene: null,
	screen: null,

	count: 0,

	init: function (screen) {

		this.screen = screen;
		this.scene = new THREE.Scene();

		var target = Object.create(Target).init(
					new THREE.Vector3(0, 0, -7),

					new THREE.Vector3(
						0.5,
						0.2,
						0.1
					),
					this.screen.materials.target);
		this.target = target;
		this.scene.add(target.mesh);

		var self = this;
		/*document.addEventListener("keydown", function a (e) {
			if (e.keyCode === 32) {
				document.removeEventListener("keydown", a, false);
				self.next();
			}
		}, false);*/
		return this;
	},

	next: function () {
		this.screen.screen = Object.create(WorldScreen).init(this.screen);
	},

	tick: function (dt) {
		if (this.count++ > 35) {
			this.next();
		}

		this.target.mesh.rotation.x += 0.05;
		this.target.mesh.rotation.y += 0.055;
		this.target.mesh.rotation.z += 0.060;
	}

};
