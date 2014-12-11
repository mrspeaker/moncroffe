(function (THREE, utils) {

	"use strict";

	var Bouy = {

		model: null,

		count: 0,

		remove: false,
		speed: 0.3,

		init: function (material) {

			this.model = {
				bb: { x: 1.5, y: 1.5, z: 1.5 },
				pos: { x: 0, y: 0, z: 0 },
				origPos: { x: 0, y: 0, z: 0 }
			};

			var geom = utils.texturify(
				new THREE.CubeGeometry(this.model.bb.x),
				[[1, 8], [1, 8], [1, 8], [1, 8], [1, 9], [1, 9]]);

			this.mesh = new THREE.Mesh(
				geom,
				material
			);

			return this;

		},

		setPos: function (pos) {

			this.model.pos = {
				x: pos.x,
				y: pos.y,
				z: pos.z
			};

			this.model.origPos = {
				x: pos.x,
				y: pos.y,
				z: pos.z
			};

			this.mesh.position.set(
				pos.x,
				pos.y,
				pos.z
			);
		},

		tick: function (dt) {

			var m = this.mesh,
				pos = m.position,
				pow = Math.sin(Date.now() / 800) * dt * this.speed;

			m.translateY(pow);
			pos.x += (Math.random() * 0.04) - 0.02;
			pos.z += (Math.random() * 0.04) - 0.02;

			return !(this.remove);
		}

	};

	window.Bouy = Bouy;

}(
	window.THREE,
	window.utils
));
