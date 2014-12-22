(function (THREE, utils) {

	"use strict";

	var Player = {

		thrd: utils.urlParams.third || false,

		lastToolChange: Date.now(),

		mesh: null,
		marker: null,

		model: null,

		jumpPower: 18,
		gravity: 9.8,
		speed: 5.5,

		beingFlung: false, // More power to move when getting flung
		powerUpTime: 0,

		init: function (screen) {

			this.model = {
				bb: { x: 0.7, y: 1.9, z: 0.7 },
				pos: { x: 0, y: 19, z: 0 },
				lastPos: { x: 0, y: 19, z: 0 },
				spawn: { x: 0, y: 19, z: 0 },
				rot: 0,
				vel: { x: 0, y: 0, z: 0 },
				tool: 1
			};

			this.screen = screen;

			this.mesh = new THREE.Object3D();
			//this.marker = this.addMeshBB();

			this.respawn();

			this.controls = this.createControls();
			this.syncAll();

			return this;
		},

		respawn: function () {

			var spawn = this.model.spawn;

			this.model.pos = {
				x: spawn.x,
				y: spawn.y,
				z: spawn.z
			};

			this.mesh.position.set(spawn.x, spawn.y, spawn.z);

		},

		powerUp: function (time) {

			this.powerUpTime = time;

		},

		addMeshBB: function () {

			var edge = new THREE.Mesh(
				new THREE.BoxGeometry(0.1, 0.3, 0.1),
				new THREE.MeshLambertMaterial({ color: 0x0099ff }));
			edge.position.x = -(this.model.bb.x / 2);
			edge.position.z = -(this.model.bb.z / 2);

			var marker = new THREE.Object3D();
			marker.add(new THREE.Mesh(
				new THREE.BoxGeometry(this.model.bb.x, 0.1, this.model.bb.z),
				new THREE.MeshLambertMaterial({ color: 0x0000ff })));
			marker.add(new THREE.Mesh(
				new THREE.BoxGeometry(0.05, 0.2, 0.5),
				new THREE.MeshLambertMaterial({ color: 0x00ffff })));
			marker.add(new THREE.Mesh(
				new THREE.BoxGeometry(0.5, 0.2, 0.05),
				new THREE.MeshLambertMaterial({ color: 0x00ffff })));
			marker.add(edge);
			this.screen.scene.add(marker);

			// Mesh bounding box for the player in third person mode
			if (this.thrd) {
				this.mesh.add(
					new THREE.Mesh(
						new THREE.BoxGeometry(this.model.bb.x, this.model.bb.y, this.model.bb.z),
						new THREE.MeshLambertMaterial({ color: 0xff00ff, wireframe: true})));

				this.screen.scene.add(this.mesh);
			}

			return marker;

		},

		tick: function (delta) {

			if (!this.controls.enabled) {
				delta = 0;
			}

			var model = this.model,
				move = this.controls.update(delta),
				power = (this.beingFlung ? this.speed * 2.5 : this.speed) * delta,
				jump = this.jumpPower, //23,
				drag = 10 * delta;

			model.lastPos.x = model.pos.x;
			model.lastPos.y = model.pos.y;
			model.lastPos.z = model.pos.z;

			model.rot = move.rot.y;

			// Figure out how far we want to move this frame
			var xo = model.vel.x,
				zo = model.vel.z,
				yo = model.vel.y;

			xo += move.x * power;
			zo += move.z * power;

			// Auto power!
			if (this.powerUpTime > 0) {
				this.powerUpTime--;
				if (this.powerUpTime === 0) {
					this.screen.screen.vignetteEffect.value = 0.7;
				}
				if (zo !== 0) {
					zo *= this.beingFlung ? 1.1 : 1.3;
					var vector = this.controls.getDirection().clone();
					yo = vector.y * 10;
				}
			} else {
				// Gravity
				yo -= this.gravity * drag;
			}

			// Forward/backward
			var wannaMove = {
				x: zo * Math.sin(model.rot),
				z: zo * Math.cos(model.rot),
				y: yo * delta
			};

			// Strafe
			wannaMove.x += xo * Math.sin(model.rot + Math.PI / 2);
			wannaMove.z += xo * Math.cos(model.rot + Math.PI / 2);

			// Check that amount of movement is ok...
			var col = this.screen.tryMove(model.pos, model.bb, wannaMove);

			model.pos = { x: col.x, y: col.y, z: col.z };

			model.vel.x *= 0.8;
			model.vel.z *= 0.8;
			if (model.vel.x < 0.01) {model.vel.x = 0;}
			if (model.vel.z < 0.01) {model.vel.z = 0;}

			if (col.ground) {
				yo = 0;
				this.beingFlung = false;
			}

			// Check if fallen past ground
			if (model.pos.y < 0 + (model.bb.y / 2)) {
				yo = 0;
				model.pos.y = 0 + (model.bb.y / 2);
				col.ground = true; // Allow jumping!
			}

			// Guiser
			if (model.pos.y < 16 &&
				(model.pos.z < -17 || model.pos.z > 48 ||
				 model.pos.x < -33 || model.pos.x > 48)) {
				//col.ground = false;
				if (yo > 10 && !this.beingFlung) {
					this.screen.sounds.geyser.play();
					this.beingFlung = true;
				}
				yo += 350 * delta;
			}

			// If we're on the ground, and want to jump... do it.
			if (col.ground && move.jump) {
				yo += jump;
			}
			model.vel.y = yo;

			this.screen.cast(); // see what we're looking at

			// bobbing
			var size = 0.12,
				speed = 200,
				bobbing = !this.screen.screen.isOculus && col.ground && (wannaMove.x !== 0 || wannaMove.z !== 0),
				bobX = bobbing ? Math.sin(Date.now() / speed) * size : 0,
				bobY = bobbing ? - Math.abs(Math.cos(Date.now() / speed)) * size + (size/2) : 0;

			// Sync the camera
			this.controls.setPos(model.pos.x + bobX, model.pos.y + bobY, model.pos.z);

			this.syncMesh();
		},

		syncAll: function () {

			var pos = this.model.pos;
			this.syncMesh();
			this.controls.setPos(pos.x, pos.y, pos.z);


		},

		syncMesh: function () {
			var model = this.model,
				mesh = this.mesh,
				marker = this.marker;

			mesh.rotation.set(0, model.rot, 0);
			mesh.position.set(model.pos.x, model.pos.y, model.pos.z);

			if (marker) {
				marker.position.set(model.pos.x, model.pos.y - (model.bb.y / 2) + 0.05, model.pos.z);
			}
		},

		knockback: function () {

			this.model.vel.z += 0.1;

		},

		createControls: function () {

			var camera = this.screen.screen.camera,
				controls = new THREE.PointerLockControls(
					this.thrd ? new THREE.Object3D(): camera,
					window.Settings);

			if (this.thrd) {
				camera.position.set(-5, 18, 5);
				camera.rotation.set(0, -Math.PI / 2 , 0);
			} else {
				camera.position.y = this.model.bb.y - 1 - 0.2;
			}

			this.screen.scene.add(controls.getObject());

			return controls;
		},

		changeTool: function (dir) {

			if (Date.now() - this.lastToolChange < 200) {
				return;
			}
			this.lastToolChange = Date.now();

			var blocks = this.screen.world.blocks,
				tool = this.model.tool;

			tool += dir;
			if (dir > 0 && tool > blocks.length - 1) {
				tool = 1;
			}
			if (dir < 0 && tool === 0) {
				tool = blocks.length - 1;
			}

			document.querySelector("#gui").innerHTML = blocks[tool];

			this.model.tool = tool;
		}

	};

	window.Player = Player;

}(
	window.THREE,
	window.utils
));
