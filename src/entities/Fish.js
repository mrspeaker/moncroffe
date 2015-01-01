(function () {

	"use strict";

	var Fish = {

		model: null,

		count: 0,

		remove: false,
		speed: 0.1,

		init: function (pos) {

			this.scale = 0.3;

			this.model = {
				pos: { x: 0, y: 0, z: 0},
				bb: {
					x: this.scale,
					y: this.scale,
					z: this.scale
				}
			};

			this.speed = Math.random() * 0.3 + 0.1;

			var geom = utils.texturify(
				new THREE.CubeGeometry(this.model.bb.x),
				[[9, 9], [10, 9], [9, 8], [10, 9], [9, 8], [9, 8]]);

			this.mesh = new THREE.Object3D();

			var mesh = new THREE.Mesh(
				geom,
				data.materials.blocks
			);

			this.mesh.add(mesh);

			var geometry = new THREE.PlaneBufferGeometry(this.scale, this.scale, 1, 1);
			var buf= geometry.getAttribute("uv"),
				uvs = buf.array;

			var x = 3,
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

			this.tail = new THREE.Mesh( geometry, material );
			this.tail.position.z -= this.model.bb.z;
			this.tail.rotation.y = Math.PI / 2;
			this.mesh.add(this.tail);

			this.model.pos = { x: pos.x, y: pos.y, z: pos.z };
			this.mesh.position.copy(pos);
			//this.mesh.lookAt(pos.add(direction));

			//this.direction = direction;

			return this;

		},

		tick: function (dt) {

			var mesh = this.mesh,
				pow = dt * this.speed;

			mesh.translateZ(pow);

			this.pos = mesh.position;

			if (this.count++ > 2000) {
			//	this.remove = true;
			}

			if (Math.random() < 0.005) {

				this.mesh.rotation.y = Math.random() * Math.PI * 2;

			}

			this.tail.rotation.y = (Math.PI / 2) + (Math.sin(Date.now() / 100) * 0.3);
			this.tail.position.x = - (Math.sin(Date.now() / 100) * 0.03);

			return !(this.remove);

		}

	};

	window.Fish = Fish;

}());