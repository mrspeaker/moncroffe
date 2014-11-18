var PlayerProxy = {

	bb: {
		w: 0.7,
		d: 0.7,
		h: 1.9
	},

	init: function (id) {

		this.id = id;

		this.mesh = new THREE.Mesh(
			new THREE.BoxGeometry(this.bb.w, this.bb.h, this.bb.d),
			new THREE.MeshLambertMaterial({
   				color: 0x770000,
			}));

		return this;

	}

};
