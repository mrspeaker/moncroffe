var Bouy = {

	model: {
		bb: { x: 1.5, y: 1.5, z: 1.5 },
		pos: { x: 0, y: 0, z: 0 }
	},

	count: 0,

	remove: false,
	speed: 0.5,

	init: function (id, pos, material) {

		this.id = id;

		var geom = utils.texturify(
			new THREE.CubeGeometry(this.model.bb.x),
			[[1, 8], [1, 8], [1, 8], [1, 8], [1, 9], [1, 9]]);

		this.mesh = new THREE.Mesh(
			geom,
			material
		);

		var pos = this.model.pos;
		pos.x = pos.x;
		pos.y = pos.y;
		pos.z = pos.z;

		this.mesh.position.copy(pos);

		return this;

	},

	tick: function (dt) {
		var m = this.mesh,
			pos = m.position,
			pow = Math.sin(Date.now() / 1000) * dt * this.speed;

		m.translateY(pow);

		this.model.pos.x = pos.x;
		this.model.pos.y = pos.y;
		this.model.pos.z = pos.z;

		return !(this.remove);
	},

	setPos: function (pos) {



	}

};
