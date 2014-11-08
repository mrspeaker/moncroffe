var Target = {

	pos: null,
	bb: null,

	count: 0,

	remove: false,

	init: function (pos, direction) {

		this.bb = {
			w: 1.5,
			d: 1.5,
			h: 1.5
		};

		this.speed = (Math.random() * 4) + 1;

		var material = new THREE.MeshBasicMaterial({
			//blending	: THREE.AdditiveBlending,
			color		: 0xff44aa,
			depthWrite	: false,
			transparent	: true,
			opacity: 0.5
		});

		this.mesh = new THREE.Mesh(
			new THREE.BoxGeometry(this.bb.w, this.bb.h, this.bb.d),
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
