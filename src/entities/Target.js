var Target = {

	pos: null,
	bb: null,

	count: 0,

	remove: false,
	speed: 0,

	init: function (id, pos, direction, speed, material) {

		this.id = id;

		this.bb = {
			w: 1.5,
			d: 1.5,
			h: 1.5
		};

		this.speed = speed;

		var geom = utils.texturify(
			new THREE.CubeGeometry(this.bb.w),
			[[8, 8], [6, 8], [6, 8], [6, 8], [6, 9], [6, 9]]);

		this.mesh = new THREE.Mesh(
			geom,
			material
		);

		this.pos = pos;
		this.mesh.position.copy(pos);
		this.mesh.lookAt(pos.add(direction));

		this.direction = direction;

		return this;

	},

	tick: function (dt) {
		var m = this.mesh,
			pow = dt * this.speed;

		m.translateZ(pow);

		this.pos = m.position;

		if (this.count++ > 2000) {
			this.remove = true;
		}

		return !(this.remove);
	}

};
