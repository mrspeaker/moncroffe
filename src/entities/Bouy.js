var Bouy = {

	pos: null,
	bb: null,

	count: 0,

	remove: false,
	speed: 0.5,

	init: function (id, pos, material) {

		this.id = id;

		this.bb = {
			w: 1.5,
			d: 1.5,
			h: 1.5
		};

		var geom = utils.texturify(
			new THREE.CubeGeometry(this.bb.w),
			[[1, 8], [1, 8], [1, 8], [1, 8], [1, 9], [1, 9]]);

		this.mesh = new THREE.Mesh(
			geom,
			material
		);

		this.pos = pos;
		this.mesh.position.copy(pos);

		return this;

	},

	tick: function (dt) {
		var m = this.mesh,
			pow = Math.sin(Date.now() / 1000) * dt * this.speed;

		m.translateY(pow);

		this.pos = m.position;

		return !(this.remove);
	}

};
