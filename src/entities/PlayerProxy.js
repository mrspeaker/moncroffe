(function () {

	"use strict";

	var PlayerProxy = {

		model: null,

		blinkTime: 0,

		init: function (id, name) {

			this.model = {
				bb: { x: 0.7, y: 1.9, z: 0.7 },
				pos: { x: 0, y: 0, z: 0 },
				rot: 0
			};

			this.id = id;
			this.name = name;
			this.initName = name;

			this.mesh = new THREE.Object3D();

			var body = this.body = new THREE.Object3D();
			var mat = new THREE.MeshBasicMaterial({
   				color: 0x992277
			});

			function addBit (w, h, d, x, y, z) {
				var mesh = new THREE.Mesh(
					new THREE.BoxGeometry(w, h, d),
					mat
				);
				mesh.position.set(x, y, z);
				body.add(mesh);
				return mesh;
			}

			//addBit(this.model.bb.x, this.model.bb.y, this.model.bb.z, 0, 0, 0);

			addBit(this.model.bb.x, 0.6, this.model.bb.z, 0, -0.15, 0);

			this.arm1 = addBit(0.2, 0.7, 0.3, -(this.model.bb.x / 2) - 0.1, -0.2, 0);
			this.arm2 =addBit(0.2, 0.7, 0.3, (this.model.bb.x / 2) + 0.1, -0.2, 0);

			addBit(0.3, 0.5, 0.3, -(this.model.bb.x / 2) + 0.15, -0.7, 0);
			addBit(0.3, 0.5, 0.3, (this.model.bb.x / 2) - 0.15, -0.7, 0);

			var geom = utils.texturify(
				new THREE.CubeGeometry(0.8),
				[[8, 8], [6, 8], [6, 8], [6, 8], [7, 9], [6, 9]]);
			var mesh = new THREE.Mesh(
				geom,
				data.materials.target
			);
			mesh.position.set(0, 0.55, 0)
			mesh.rotation.y += Math.PI;

			body.add(mesh)

			this.mesh.add(this.body);

			this.addNameLabel(name ? name : "???");

			return this;

		},

		addNameLabel: function (txt) {
			if (this.label) {
				this.mesh.remove(this.label);
			}
			this.label = utils.createCanvasPlane(200, 40, function (ctx, w, h) {

				ctx.font = "22pt Helvetica";

				ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
				ctx.textAlign = "center";
				ctx.fillText(txt, w / 2, h / 2 + 11);

			});

			this.label.position.set(0, this.model.bb.y / 2 + 0.3, 0);
			this.mesh.add(this.label);
		},

		rottt: function () {
			this.body.rotation.y += 0.01;
			this.body.position.y += Math.sin(Date.now() / 1000) * 0.01;
		},

		tick: function (dt, lookAt) {

			if (this.name !== this.initName) {
				this.addNameLabel(this.name);
				this.initName = this.name;
			}

			if (this.blinkTime > 0) {
				this.mesh.visible = this.blinkTime % 10 < 5;
				if (this.blinkTime-- === 0) {
					this.mesh.visible = true;
				}
			}

			this.syncMesh(lookAt);

		},

		syncMesh: function (camera) {

			var model = this.model,
				mesh = this.mesh,
				body = this.body;

			body.rotation.set(0, model.rot, 0);
			mesh.position.set(model.pos.x, model.pos.y, model.pos.z);

        	this.label.rotation.setFromRotationMatrix(camera.matrix);

		}

	};

	window.PlayerProxy = PlayerProxy;

}());
