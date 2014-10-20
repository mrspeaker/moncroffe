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

		this.velocity = new THREE.Vector3(0, 0, 0);

		var obj = this.obj = new THREE.Object3D();
		obj.position.y =10;
		obj.position.x = 2;
		obj.position.z = 18;

		var controls = this.controls = this.createControls();
		this.screen.scene.add(controls.getObject());

		return this;
	},

	createControls: function () {

		var controls = new THREE.PointerLockControls(this.camera);

		var blocker = document.getElementById( 'blocker' );
		var instructions = document.getElementById( 'instructions' );
		// http://www.html5rocks.com/en/tutorials/pointerlock/intro/
		var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
		if (havePointerLock) {
			var element = document.body;
			var pointerlockchange = function ( event ) {
				if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
					controls.enabled = true;
					blocker.style.display = "none";
				} else {
					controls.enabled = false;
					blocker.style.display = "-webkit-box";
					blocker.style.display = "-moz-box";
					blocker.style.display = "box";
					instructions.style.display = "";
				}
			}
			var pointerlockerror = function ( event ) {
				instructions.style.display = "";
			}
		
			// Hook pointer lock state change events
			document.addEventListener("pointerlockchange", pointerlockchange, false );
			document.addEventListener("mozpointerlockchange", pointerlockchange, false );
			document.addEventListener("webkitpointerlockchange", pointerlockchange, false );
			document.addEventListener("pointerlockerror", pointerlockerror, false );
			document.addEventListener("mozpointerlockerror", pointerlockerror, false );
			document.addEventListener("webkitpointerlockerror", pointerlockerror, false );
			instructions.addEventListener("click", function ( event ) {
				instructions.style.display = "none";
				// Ask the browser to lock the pointer
				element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
				element.requestPointerLock();
			}, false );
		} else {
			instructions.innerHTML = "Your browser doesn't seem to support Pointer Lock API";
		}

		return controls;
	},

	update: function (delta) {

		var obj = this.obj,
			move = this.controls.update(),
			jump = move.jump;

		// Hmm - dodgy - copying the rotation back to the player
		obj.rotation.set(move.rot.x, move.rot.y, move.rot.z);

		var drag = 10.0;
		this.velocity.x -= this.velocity.x * drag * move.delta;
		this.velocity.z -= this.velocity.z * drag * move.delta;
		this.velocity.y -= 9.8 * drag * move.delta;

		this.velocity.x += move.x;
		this.velocity.z += move.z;

		obj.translateX(this.velocity.x * move.delta);
		obj.translateY(this.velocity.y * move.delta);
		obj.translateZ(this.velocity.z * move.delta);

		document.querySelector("#watch").innerHTML = obj.position.y

		if (obj.position.y < 0) {
			this.velocity.y = 0;
			obj.position.y = 0;
		}

		if (move.jump) {
			this.velocity.y += 25;
		}
		/*ar col = this.screen.getTouchingVoxels(this);
		if (!col.below) {
			console.log("in the air!")
		} else {
			if (move.jump) {
				this.velocity.y += 25;
			}

			console.log("on the ground!", move.jump);
			//obj.position.y = col.below[1];
		}*/

		/*if (!col.centerBot) {
			
		} else {
			obj.translateX(- this.velocity.x * move.delta);
			obj.translateY(- this.velocity.y * move.delta);
			obj.translateZ(- this.velocity.z * move.delta);
		}*/

		
		this.controls.setPos(obj.position.x, obj.position.y + this.bb.h, obj.position.z);
		
/*
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

		if (!col.centerBot) {
			if (!col.below) {
			 	// "Gravity" 
				obj.translateY(-0.3);
			} else {
				obj.position.y = col.below[1];
			}
		} else {
			obj.translateX(-move[0]);
			obj.translateY(-move[1]);
			obj.translateZ(-move[2]);
		}*/

		/*camera.position.set(
			obj.position.x - this.bb.w / 2,
			obj.position.y + this.bb.h,
			obj.position.z - this.bb.d / 2);

		camera.rotation.set(
			obj.rotation.x,
			obj.rotation.y,
			obj.rotation.z);*/
	}
};