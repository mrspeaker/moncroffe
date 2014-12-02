(function () {

	"use strict";

	var Clown = {

		model: {
			pos: { x: 0, y: 0, z: 0},
			bb: {
				x: 1.5,
				y: 1.5,
				z: 1.5
			}
		},

		count: 0,

		remove: false,
		speed: 0,

		init: function (id, pos, direction, speed, material) {

			this.id = id;

			this.speed = speed;

			var geom = utils.texturify(
				new THREE.CubeGeometry(this.model.bb.x),
				[[8, 8], [6, 8], [6, 8], [6, 8], [7, 9], [6, 9]]);

			this.mesh = new THREE.Object3D();

			var mesh = new THREE.Mesh(
				geom,
				material
			);

			this.mesh.add(mesh);

			this.model.pos = { x: pos.x, y: pos.y, z: pos.z };
			this.mesh.position.copy(pos);
			this.mesh.lookAt(pos.add(direction));

			this.direction = direction;

			return this;

		},

		tick: function (dt) {
			var mesh = this.mesh,
				pow = dt * this.speed;

			mesh.translateZ(pow);

			this.pos = mesh.position;

			if (this.count++ > 2000) {
				this.remove = true;
			}

			return !(this.remove);
		}

	};

	window.Clown = Clown;

}());