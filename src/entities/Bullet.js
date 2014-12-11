(function (THREE) {

	"use strict";

	var Bullet = {

		stopped: false,
		ownShot: true,

		model: null,

		count: 0,
		life: 30,
		hangAroundFor: 4000,

		direction: null,
		velocity: 40,

		init: function (pos, direction, material) {

			this.model = {
				pos: { x: 0, y: 0, z: 0 },
				bb: { x: 0.15, y: 0.10, z: 1.15 }
			};

			this.mesh = new THREE.Mesh(
				new THREE.BoxGeometry(this.model.bb.x, this.model.bb.y, this.model.bb.z),
				material
			);

			this.model.pos.x = pos.x;
			this.model.pos.y = pos.y;
			this.model.pos.z = pos.z;

			this.mesh.position.copy(pos);
			this.mesh.lookAt(pos.add(direction));

			this.direction = direction;

			return this;

		},

		stop: function () {

			this.stopped = true;

		},

		tick: function (dt) {
			var m = this.mesh,
				pow = dt * this.velocity;

			if (this.count++ < this.life && !this.stopped) {
				m.translateZ(pow);
				this.model.pos = {
					x: m.position.x,
					y: m.position.y,
					z: m.position.z
				};
				if (this.count === this.life) {
					this.stopped = true;
				}
			}

			if (this.count < this.hangAroundFor) {
				return true;
			}

			return false;
		}

	};

	window.Bullet = Bullet;

}(window.THREE));
