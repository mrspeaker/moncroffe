var Bullet = {

	pos: null,
	bb: null,
	stopped: false,

	count: 0,

	init: function (pos, direction, material) {

		this.bb = {
			w: 0.15,
			d: 1.15,
			h: 0.1
		};

		this.mesh = new THREE.Mesh(
			new THREE.BoxGeometry(this.bb.w, this.bb.h, this.bb.d),
			material
		);

		this.pos = pos;
		this.mesh.position.copy(pos);
		this.mesh.lookAt(pos.add(direction));

		this.direction = direction

		return this;

	},

	stop: function () {
		this.stopped = true;
	},

	tick: function (dt) {
		var m = this.mesh,
			pow = dt * 40;

		if (!this.stopped && this.count++ < 30)
			m.translateZ(pow);

		this.pos = m.position;

		if (this.count < 800) {
			return true;
		}
		return false;
	}

};
