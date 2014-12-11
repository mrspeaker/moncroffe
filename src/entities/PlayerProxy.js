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

			this.body = new THREE.Mesh(
				new THREE.BoxGeometry(this.model.bb.x, this.model.bb.y, this.model.bb.z),
				new THREE.MeshBasicMaterial({
	   				color: 0x992277,
	   				opacity: 0.8,
   					transparent: true
				}));

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
