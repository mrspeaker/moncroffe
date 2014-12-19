(function (THREE, utils) {

	"use strict";

	var PowerBall = {

		model: null,
		count: 0,
		remove: false,
		speed: 0.7,

		init: function () {

			this.model = {
				bb: { x: 1.5, y: 1.5, z: 1.5 },
				pos: { x: 0, y: 0, z: 0 },
				origPos: { x: 0, y: 0, z: 0 }
			};

			var geometry = new THREE.SphereGeometry(0.7, 20, 20);
			var material = new THREE.MeshBasicMaterial({
				color: 0xE8D998,
				transparent: true,
				opacity: 0.3
			});
			this.mesh = new THREE.Mesh( geometry, material );

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
				pow = Math.sin(Date.now() / 500) * dt * this.speed;

			m.translateY(pow);

			if (this.count++ > 5000) {
				this.remove = true;
			}

			return !(this.remove);
		}

	};

	window.PowerBall = PowerBall;

}(
	window.THREE,
	window.utils
));
