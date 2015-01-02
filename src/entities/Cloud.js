(function () {

	"use strict";

	var Cloud = {

		model: null,

		count: 0,

		remove: false,
		speed: 1.8,

		init: function (pos) {

			this.model = {
				pos: { x: 0, y: 0, z: 0},
			};

			var geometry = new THREE.BoxGeometry(
				(Math.random() * 30) + 15,
				1,
				(Math.random() * 40) + 15
			);
			var material = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
			var mesh = new THREE.Mesh(geometry, material);

			this.mesh = new THREE.Object3D();
			this.mesh.add(mesh);

			this.model.pos = { x: pos.x, y: pos.y, z: pos.z };
			this.mesh.position.copy(pos);
			this.mesh.lookAt(pos.add(new THREE.Vector3(0, 0, 1)));

			return this;

		},

		tick: function (dt) {

			var mesh = this.mesh,
				pow = dt * this.speed;

			mesh.translateZ(pow);

			this.pos = mesh.position;

			if (this.pos.z > 250) {

				this.mesh.position.z -= 500;
				//this.remove = true;
				this.mesh.position.x = Math.random() * 500 - 250;

			}

			return !(this.remove);

		}

	};

	window.Cloud = Cloud;

}());