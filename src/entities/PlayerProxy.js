(function (THREE, data, utils) {

	"use strict";

	var PlayerProxy = {

		model: null,

		blinkTime: 0,

		checkWalk: 0,
		walking: false,

		init: function (id, name) {

			this.model = {
				bb: { x: 0.7, y: 1.9, z: 0.7 },
				pos: { x: 0, y: 0, z: 0 },
				lastPos: {x:0, y:0,z:0},
				rot: 0
			};

			this.id = id;
			this.name = name;
			this.initName = name;

			this.mesh = new THREE.Object3D();

			this.body = this.makeALilMan(new THREE.Object3D());
			this.mesh.add(this.body);

			this.addNameLabel(name ? name : "???");

			return this;

		},

		addNameLabel: function (txt) {

			if (this.label) {
				this.mesh.remove(this.label);
			}

			this.label = utils.createCanvasPlane(256, 256, function (ctx, w, h) {

				ctx.font = "22pt Helvetica";

				ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
				ctx.textAlign = "center";
				ctx.fillText(txt, w / 2, h / 2 + 11);

			});

			this.label.position.set(0, this.model.bb.y / 2 + 0.3, 0);
			this.mesh.add(this.label);

		},

		makeALilMan: function (body) {

			var material = new THREE.MeshBasicMaterial({
   				color: 0xaa3388
			});

			function addBodyBit (w, h, d, x, y, z) {

				var mesh = new THREE.Mesh(
					new THREE.BoxGeometry(w, h, d),
					material
				);
				mesh.position.set(x, y, z);
				body.add(mesh);

				return mesh;

			}

			function offsetPivot (mesh, x, y, z) {

				return mesh.geometry.applyMatrix(
					new THREE.Matrix4().makeTranslation(x, y, z)
				);

			}

			var bits = this.bits = {

				torso: addBodyBit(this.model.bb.x, 0.6, this.model.bb.z, 0, -0.15, 0),

				arm1: addBodyBit(0.2, 0.7, 0.3, -(this.model.bb.x / 2) - 0.1, 0, 0),
				arm2: addBodyBit(0.2, 0.7, 0.3, (this.model.bb.x / 2) + 0.1, 0, 0),

				leg1: addBodyBit(0.3, 0.5, 0.3, -(this.model.bb.x / 2) + 0.15, -0.4, 0),
				leg2: addBodyBit(0.3, 0.5, 0.3, (this.model.bb.x / 2) - 0.15, -0.4, 0),

				head: new THREE.Mesh(
					utils.texturify(
						new THREE.CubeGeometry(0.8),
						[[8, 8], [6, 8], [6, 8], [6, 8], [7, 9], [6, 9]]
					),
					data.materials.target
				)

			};

			offsetPivot(bits.arm1, 0, -0.3, 0);
			offsetPivot(bits.arm2, 0, -0.3, 0);
			offsetPivot(bits.leg1, 0, -0.3, 0);
			offsetPivot(bits.leg2, 0, -0.3, 0);

			bits.head.position.set(0, 0.55, 0);
			bits.head.rotation.y += Math.PI;
			body.add(bits.head);

			return body;

		},

		rottt: function () {

			this.body.rotation.y += 0.01;
			this.body.position.y += Math.sin(Date.now() / 1000) * 0.01;
			this.walk();

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

			var lastPos = this.model.lastPos,
				pos = this.model.pos;

			if (this.checkWalk-- <= 0) {
				this.walking = pos.x !== lastPos.x || pos.z !== lastPos.z;

				lastPos.x = pos.x;
				lastPos.y = pos.y;
				lastPos.z = pos.z;
				this.checkWalk = 7;
			}

			this.syncMesh(lookAt);

		},

		syncMesh: function (camera) {

			var model = this.model,
				mesh = this.mesh,
				body = this.body;

			body.rotation.set(0, model.rot, 0);
			mesh.position.set(model.pos.x, model.pos.y, model.pos.z);

			// MOve arms!
			if (this.walking) {
				this.walk();
			}

        	this.label.rotation.setFromRotationMatrix(camera.matrix);

		},

		walk: function () {

			var sp = 100,
				now = Date.now();

			this.bits.head.position.y = 0.55 + Math.cos(now / 50) * 0.03;
			this.bits.arm1.rotation.x = Math.sin((Math.PI * 1.5) + now / sp);
			this.bits.arm2.rotation.x = Math.cos(now / sp);
			this.bits.leg1.rotation.x = Math.cos(now / sp);
			this.bits.leg2.rotation.x = Math.sin((Math.PI * 1.5) + now / sp);

		}

	};

	window.PlayerProxy = PlayerProxy;

}(
	window.THREE,
	window.data,
	window.utils
));
