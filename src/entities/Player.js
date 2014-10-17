var Player = function (camera, screen) {

	this.camera = camera;
	this.screen = screen;
};

Player.prototype.constructor = Player;
Player.prototype = {
	init: function () {
		this.bb = {
			w: 0.7, 
			d: 0.7, 
			h: 1.2
		};

		this.obj = new THREE.Object3D();

		this.obj.position.y = 6;
		this.obj.position.x = 2;
		this.obj.position.z = 2;

		this.obj.rotation.y = Math.PI;

		var controls = this.controls = new THREE.FirstPersonControls(this.obj);
		controls.movementSpeed = 3;
		controls.lookSpeed = 0.1;
		controls.lookVertical = false;
		return this;
	},

	update: function (delta) {

		var obj = this.obj,
			camera = this.camera;

		var move = this.controls.update(delta);

		var lim = 100;

		obj.translateX(move[0]);
		if (obj.position.x < -lim) {
			obj.position.x = -lim;
		}
		if (obj.position.x > lim) {
			obj.position.x = lim;
		}
		obj.translateY(move[1]);
		obj.translateZ(move[2]);
		if (obj.position.z > lim) {
			obj.position.z = lim;
		}
		if (obj.position.z < -lim) {
			obj.position.z = -lim;
		}

		var col = this.screen.getTouchingVoxels(this);
		if (col.inside) {
			obj.position.y = col.inside[1] + this.bb.h;
		}
		else if (!col.below) {
			obj.translateY(-0.1);
		} else {
			obj.position.y = col.below[1] + this.bb.h;
		}

		camera.position.set(
			obj.position.x + this.bb.w / 2,
			obj.position.y,
			obj.position.z);

		camera.rotation.set(
			obj.rotation.x,
			obj.rotation.y,
			obj.rotation.z);
	}
};