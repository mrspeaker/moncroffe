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

		var controls = this.controls = new THREE.FirstPersonControls(this.obj);
		controls.lon = 235;
		controls.movementSpeed = 3;
		controls.lookSpeed = 0.1;
		controls.lookVertical = false;

		return this;
	},

	update: function (delta) {

		var obj = this.obj,
			camera = this.camera,
			lim = 100,
			move = this.controls.update(delta);

		obj.translateX(move[0]);
		obj.translateY(move[1]);
		obj.translateZ(move[2]);
		var col = this.screen.getTouchingVoxels(this);

		if (!col.inside) {
			
			if (!col.below) {
				obj.translateY(-0.1);
			} else {
				obj.position.y = col.below[1] + this.bb.h;
			}

		} else {
			//obj.position.y = col.inside[1] + this.bb.h;
			obj.translateX(-move[0]);
			obj.translateY(-move[1]);
			obj.translateZ(-move[2]);
		}

		camera.position.set(
			obj.position.x,
			obj.position.y,
			obj.position.z);

		camera.rotation.set(
			obj.rotation.x,
			obj.rotation.y,
			obj.rotation.z);
	}
};