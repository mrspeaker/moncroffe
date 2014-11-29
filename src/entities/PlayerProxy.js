(function () {

	"use strict";

	var PlayerProxy = {

		model: {
			bb: { x: 0.7, y: 1.9, z: 0.7 },
			pos: { x: 0, y: 0, z: 0 },
			rot: 0
		},

		blinkTime: 0,

		init: function (id, name) {

			this.id = id;
			this.name = name;

			this.mesh = new THREE.Mesh(
				new THREE.BoxGeometry(this.model.bb.x, this.model.bb.y, this.model.bb.z),
				new THREE.MeshBasicMaterial({
	   				color: 0x992277,
				}));

			return this;

		},

		tick: function () {

			if (this.blinkTime > 0) {
				this.mesh.visible = this.blinkTime % 10 < 5;
				if (this.blinkTime-- === 0) {
					this.mesh.visible = true;
				}
			}

			this.syncMesh();

		},

		syncMesh: function () {
			var model = this.model,
				mesh = this.mesh;

			mesh.rotation.set(0, model.rot, 0);
			mesh.position.set(model.pos.x, model.pos.y, model.pos.z);
		}

	};

	window.PlayerProxy = PlayerProxy;

}());
