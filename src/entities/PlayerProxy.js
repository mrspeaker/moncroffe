var PlayerProxy = {

	bb: {
		w: 0.7,
		d: 0.7,
		h: 1.9
	},

	init: function (id, name) {

		this.id = id;
		this.name = name;

		this.mesh = new THREE.Mesh(
			new THREE.BoxGeometry(this.bb.w, this.bb.h, this.bb.d),
			new THREE.MeshBasicMaterial({
   				color: 0x992277,
			}));

		return this;

	}

};
