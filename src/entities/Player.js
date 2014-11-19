var Player = {

	thrd: utils.urlParams.third || false,

	curTool: 1,
	lastToolChange: Date.now(),

	init: function (screen, scene) {

		this.screen = screen;
		this.scene = scene;

		this.bb = {
			w: 0.7,
			d: 0.7,
			h: 1.9
		};

		this.velocity = new THREE.Vector3(0, 0, 0);

		var playerObj = this.playerObj = new THREE.Object3D();

		playerObj.position.set(screen.screen.world.chunkWidth * 0.1, 17 +  (this.bb.h / 2), screen.screen.world.chunkWidth * 0.75);

		this.addPlayerMesh();

		var controls = this.controls = this.createControls();
		this.scene.add(controls.getObject());

		return this;
	},

	addPlayerMesh: function () {

		this.edge = edge = new THREE.Mesh(
			new THREE.BoxGeometry(0.1, 0.3, 0.1),
			new THREE.MeshLambertMaterial({ color: 0x0099ff }));
			edge.position.x = -(this.bb.w / 2);
			edge.position.z = -(this.bb.d / 2)

		this.marker = new THREE.Object3D();
		this.marker.add(new THREE.Mesh(
			new THREE.BoxGeometry(this.bb.w, 0.1, this.bb.d),
			new THREE.MeshLambertMaterial({ color: 0x0000ff })));
		this.marker.add(new THREE.Mesh(
			new THREE.BoxGeometry(0.05, 0.2, 0.5),
			new THREE.MeshLambertMaterial({ color: 0x00ffff })));
		this.marker.add(new THREE.Mesh(
			new THREE.BoxGeometry(0.5, 0.2, 0.05),
			new THREE.MeshLambertMaterial({ color: 0x00ffff })));
		this.marker.add(edge);
		this.scene.add(this.marker);

		// Mesh bounding box for the player in third person mode
		if (this.thrd) {
			this.playerObj.add(
				new THREE.Mesh(
					new THREE.BoxGeometry(this.bb.w, this.bb.h, this.bb.d),
					new THREE.MeshLambertMaterial({ color: 0xff00ff, wireframe: true})));

			this.scene.add(this.playerObj);
		}

	},

	tick: function (delta) {

		if (!this.controls.enabled) {
			delta = 0;
		}

		var obj = this.playerObj,
			move = this.controls.update(delta),
			power = 250 * delta,
			jump = 23,
			drag = 10 * delta;

		obj.rotation.set(move.rot.x, move.rot.y, move.rot.z);

		var xo = this.velocity.x,
			zo = this.velocity.z,
			yo = this.velocity.y;

		var oldPos = obj.position.clone(),
			newPos;

		xo += move.x * power;
		zo += move.z * power;
		yo -= 9.8 * drag; // Gravity

		// TODO: translate without doing the actual translate, please.
		obj.translateX(xo * delta);
		obj.translateY(yo * delta);
		obj.translateZ(zo * delta);

		newPos = obj.position.clone();
		newPos.sub(oldPos);

		obj.translateX(-xo * delta);
		obj.translateY(-yo * delta);
		obj.translateZ(-zo * delta);

		// Check if ok...
		var col = this.screen.screen.tryMove(this, newPos);

		obj.position.x = col.x;
		obj.position.y = col.y;
		obj.position.z = col.z;

		if (col.ground) {
			yo = 0;
		}

		// Check if fallen past ground
		if (obj.position.y < 0 + (this.bb.h / 2)) {
			yo = 0;
			obj.position.y = 0 + (this.bb.h / 2);
			col.ground = true; // Allow jumping!
		}

		if (col.ground && move.jump) {
			yo += jump;
		}

		this.screen.screen.cast(); // see what we're looking at

		// Carry over gravity velocity to next frame
		// x/z stops dead - no drag.
		this.velocity.set(0, yo, 0);

		// bobbing
		var size = 0.12,
			speed = 200,
			bobbing = !this.screen.screen.isOculus && col.ground && (obj.position.x !== oldPos.x || obj.position.z !== oldPos.z),
			bobX = bobbing ? Math.sin(Date.now() / speed) * size : 0;
			bobY = bobbing ? - Math.abs(Math.cos(Date.now() / speed)) * size + (size/2) : 0;

		this.controls.setPos(obj.position.x + bobX, obj.position.y + bobY, obj.position.z);
		this.marker.position.set(obj.position.x, obj.position.y - (this.bb.h / 2) + 0.05, obj.position.z);

	},

	createControls: function () {

		var camera = this.screen.screen.camera,
			controls = new THREE.PointerLockControls(
				this.thrd ? new THREE.Object3D(): camera,
				this.screen.screen.settings.mouse_sensitivity);

		if (this.thrd) {
			camera.position.set(-5, 12, 10);
			camera.rotation.set(0, -Math.PI / 2 , 0);
		} else {
			camera.position.y = this.bb.h - 1 - 0.2;
		}

		return controls;
	},

	changeTool: function (dir) {

		if (Date.now() - this.lastToolChange < 200) {
			return;
		}

		var blocks = this.screen.screen.world.blocks;

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