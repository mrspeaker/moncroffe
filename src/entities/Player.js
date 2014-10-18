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
			h: 1.9
		};

		var obj = this.obj = new THREE.Object3D();

		obj.position.y = 6;
		obj.position.x = 0;
		obj.position.z = 3;

		obj.rotation.y = 0;

		var controls = this.controls = new THREE.FirstPersonControls(obj);
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
			move = this.controls.update(delta),
			jump = move[3];

		

		if (jump) {
			this.acc = 1.5;
		}
		if (this.acc > 0) {
			this.acc -= 0.2;
			obj.translateY(this.acc);
		}

		obj.translateX(move[0]);
		obj.translateY(move[1]);
		obj.translateZ(move[2]);
		var col = this.screen.getTouchingVoxels(this);

		if (!col.inside) {
			if (!col.below) {
				obj.translateY(-0.3);
			} else {
				obj.position.y = col.below[1];
			}

		} else {
			obj.translateX(-move[0]);
			obj.translateY(-move[1]);
			obj.translateZ(-move[2]);
		}


		camera.position.set(
			obj.position.x,
			obj.position.y + this.bb.h,
			obj.position.z);

		camera.rotation.set(
			obj.rotation.x,
			obj.rotation.y,
			obj.rotation.z);
	}
};