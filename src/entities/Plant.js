(function () {

	"use strict";

	var Plant = {

		model: null,

		remove: false,

		init: function (pos) {

			this.model = {
				pos: { x: 0, y: 0, z: 0},
			};

			var geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1);

			var buf= geometry.getAttribute("uv"),
				uvs = buf.array;

			var x = Math.random() < 0.4 ? 2 : 1,
				y = 3;

			uvs[0] = x / 4;
			uvs[1] = y / 4;
			uvs[2] = (x + 1) / 4;
			uvs[3] = y / 4;
			uvs[4] = x / 4;
			uvs[5] = (y + 1) / 4;
			uvs[6] = (x + 1) / 4;
			uvs[7] = (y + 1) / 4;

			buf.needsUpdate = true;

			var material = new THREE.MeshLambertMaterial({
				transparent: true,
				ambient: 0xffffff,
				side: THREE.DoubleSide,
				map: data.textures.plants
			});
			this.mesh = new THREE.Object3D();

			var one = new THREE.Mesh( geometry, material );
			var two = new THREE.Mesh( geometry, material );
			var three = new THREE.Mesh( geometry, material );

			this.model.pos = { x: pos.x, y: pos.y, z: pos.z };

			two.rotation.y = Math.PI / 3;
			three.rotation.y = (Math.PI / 3) * 2;

			this.mesh.add(one);
			this.mesh.add(two);
			this.mesh.add(three);

			this.mesh.position.copy(pos);
			this.mesh.rotation.x = Math.PI;
			this.mesh.rotation.y = Math.random() * 2 * Math.PI;

			return this

		},

		tick: function (dt) {

			return !(this.remove);
		}

	};

	window.Plant = Plant;

}());