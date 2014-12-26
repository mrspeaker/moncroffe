(function () {

	"use strict";

	var Cursor = {

		pos: null,
		face: null,
		chunkX: 0,
		chunkZ: 0,
		chunkId: "0:0",
		visible: true,

		init: function (screen) {

			var cursor = this.mesh = new THREE.Mesh(
				new THREE.BoxGeometry(1.01, 1.01, 1.01),
				new THREE.MeshBasicMaterial({
					color: 0xdddddd,
					wireframe: false,
					opacity: 0.15,
					transparent: true
				}));

			this.pos = new THREE.Vector3(0, 0, 0);
			cursor.position.copy(this.pos);

			this.screen = screen;

			screen.scene.add(cursor);

			return this;

		},

		set: function (pos, chunk, face) {

			this.pos.set(pos.x, pos.y, pos.z);

			this.chunkX = chunk.x;
			this.chunkZ = chunk.z;
			this.chunkId = chunk.x + ":" + chunk.z;

			this.worldPos = {
				x: pos.x + (chunk.x * chunk.w),
				y: pos.y,
				z: pos.z + (chunk.z * chunk.w)
			};

			this.face = face;

		},

		hide: function () {

			if (!this.visible) return;

			this.visible = false;
			this.mesh.visible = false;

		},

		show: function () {

			if (this.visible) return;

			this.visible = true;
			this.mesh.visible = true;

		},

		tick: function (dt) {

		}

	};

	window.Cursor = Cursor;

}());
