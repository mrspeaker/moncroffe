var Bullet = {

	pos: null,
	bb: null,

	count: 0,

	init: function (pos, direction) {

		this.bb = {
			w: 0.15,
			d: 1.1,
			h: 0.1
		};

		var material = new THREE.MeshBasicMaterial({
			blending	: THREE.AdditiveBlending,
			color		: 0x4444aa,
			side		: THREE.DoubleSide,
			depthWrite	: false,
			transparent	: true
		});

		this.mesh = new THREE.Mesh(
			new THREE.BoxGeometry(this.bb.w, this.bb.h, this.bb.d),
			material
		);

		this.mesh.position.copy(pos);
		this.mesh.lookAt(pos.add(direction));

		this.direction = direction

		return this;

	},

	tick: function (dt) {
		var m = this.mesh,
			pow = dt * 30;
		//m.translateX(pow);
		//m.translateY(pow);
		m.translateZ(pow);

		if (this.count++ < 40) {
			return true;
		}
		return false;
	}

};
