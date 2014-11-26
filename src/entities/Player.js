var Player = {

	thrd: utils.urlParams.third || false,

	curTool: 1,
	lastToolChange: Date.now(),

	model: {
		bb: { x: 0.7, y: 1.9, z: 0.7 },
		pos: { x: 0, y: 19, z: 0 },
		spawn: { x: 0, y: 19, z: 0 },
		rot: 0,
		vel: { x: 0, y: 0, z: 0 },
		tool: 1
	},

	init: function (screen) {

		this.screen = screen;

		this.bb = {
			w: 0.7,
			d: 0.7,
			h: 1.9
		};

		this.playerObj = new THREE.Object3D();
		this.addPlayerMesh();

		this.respawn();

		this.controls = this.createControls();

		return this;
	},

	respawn: function () {

		var spawn = this.model.spawn;

		this.model.pos = {
			x: spawn.x,
			y: spawn.y,
			z: spawn.z
		};

		this.playerObj.position.set(spawn.x, spawn.y, spawn.z);

	},

	addPlayerMesh: function () {

		this.edge = edge = new THREE.Mesh(
			new THREE.BoxGeometry(0.1, 0.3, 0.1),
			new THREE.MeshLambertMaterial({ color: 0x0099ff }));
			edge.position.x = -(this.model.bb.x / 2);
			edge.position.z = -(this.model.bb.z / 2)

		this.marker = new THREE.Object3D();
		this.marker.add(new THREE.Mesh(
			new THREE.BoxGeometry(this.model.bb.x, 0.1, this.model.bb.z),
			new THREE.MeshLambertMaterial({ color: 0x0000ff })));
		this.marker.add(new THREE.Mesh(
			new THREE.BoxGeometry(0.05, 0.2, 0.5),
			new THREE.MeshLambertMaterial({ color: 0x00ffff })));
		this.marker.add(new THREE.Mesh(
			new THREE.BoxGeometry(0.5, 0.2, 0.05),
			new THREE.MeshLambertMaterial({ color: 0x00ffff })));
		this.marker.add(edge);
		this.screen.scene.add(this.marker);

		// Mesh bounding box for the player in third person mode
		if (this.thrd) {
			this.playerObj.add(
				new THREE.Mesh(
					new THREE.BoxGeometry(this.model.bb.x, this.model.bb.y, this.model.bb.z),
					new THREE.MeshLambertMaterial({ color: 0xff00ff, wireframe: true})));

			this.screen.scene.add(this.playerObj);
		}

	},

	tick: function (delta) {

		if (!this.controls.enabled) {
			delta = 0;
		}

		var mesh = this.playerObj,
			model = this.model,
			move = this.controls.update(delta),
			power = 250 * delta,
			jump = 23,
			drag = 10 * delta;

		model.rot = move.rot.y;

		var xo = 0,
			zo = 0,
			yo = model.vel.y;

		var oldPos = mesh.position.clone(),
			newPos;

		xo += move.x * power;
		zo += move.z * power;
		yo -= 9.8 * drag; // Gravity

		// TODO: translate on model, not mesh.
		mesh.translateX(xo * delta);
		mesh.translateY(yo * delta);
		mesh.translateZ(zo * delta);

		newPos = mesh.position.clone();
		newPos.sub(oldPos);

		mesh.translateX(-xo * delta);
		mesh.translateY(-yo * delta);
		mesh.translateZ(-zo * delta);

		// Check if ok...
		var col = this.screen.screen.tryMove(this, newPos);

		model.pos = { x: col.x, y: col.y, z: col.z };

		if (col.ground) {
			yo = 0;
		}

		// Check if fallen past ground
		if (model.pos.y < 0 + (model.bb.y / 2)) {
			yo = 0;
			model.pos.y = 0 + (model.bb.y / 2);
			col.ground = true; // Allow jumping!
		}

		if (col.ground && move.jump) {
			yo += jump;
		}

		this.screen.cast(); // see what we're looking at

		model.vel.y = yo;

		// bobbing
		var size = 0.12,
			speed = 200,
			bobbing = !this.screen.screen.isOculus && col.ground && (model.pos.x !== oldPos.x || model.pos.z !== oldPos.z),
			bobX = bobbing ? Math.sin(Date.now() / speed) * size : 0;
			bobY = bobbing ? - Math.abs(Math.cos(Date.now() / speed)) * size + (size/2) : 0;

		this.controls.setPos(model.pos.x + bobX, model.pos.y + bobY, model.pos.z);

		this.syncMesh();

	},

	syncMesh: function () {
		var model = this.model,
			mesh = this.playerObj,
			marker = this.marker;

		mesh.rotation.set(0, model.rot, 0);
		mesh.position.set(model.pos.x, model.pos.y, model.pos.z);

		marker.position.set(model.pos.x, model.pos.y - (model.bb.y / 2) + 0.05, model.pos.z);
	},

	createControls: function () {

		var camera = this.screen.screen.camera,
			controls = new THREE.PointerLockControls(
				this.thrd ? new THREE.Object3D(): camera,
				Settings);

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

		var blocks = this.screen.world.blocks;

		this.lastToolChange = Date.now();

		this.curTool += dir;
		if (dir > 0 && this.curTool > blocks.length - 1) {
			this.curTool = 1;
		}
		if (dir < 0 && this.curTool === 0) {
			this.curTool = blocks.length - 1;
		}

		document.querySelector("#gui").innerHTML = blocks[this.curTool];
	}

};