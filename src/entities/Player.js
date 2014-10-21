var Player = function (camera, screen) {

	this.camera = camera;
	this.screen = screen;

	this.thrd = false;
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

		var playerObj = this.playerObj = new THREE.Object3D();
		playerObj.position.set(0, 1 + (this.bb.h / 2), 10);
	    playerObj.add(
			new THREE.Mesh(
	    		new THREE.BoxGeometry(this.bb.w, this.bb.h, this.bb.d), 
	    		new THREE.MeshLambertMaterial({ color: 0xff00ff })));

	    if (this.thrd) {
	    	this.screen.scene.add(playerObj);
	    }

		var controls = this.controls = this.createControls();
		this.screen.scene.add(controls.getObject());

		return this;
	},

	createControls: function () {

		var controls = new THREE.PointerLockControls(this.thrd ? new THREE.Object3D(): this.camera);
		
		if (this.thrd) {
			this.camera.position.set(-8, 2, 10);
			this.camera.rotation.set(0, -Math.PI / 2 , 0);
		} else {
			this.camera.position.y = this.bb.h - 1 - 0.2;
		}

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

		var obj = this.playerObj,
			move = this.controls.update(),
			jump = move.jump;

		// Hmm - dodgy - copying the rotation back to the player
		// weird having 2 objects for player orientation
		obj.rotation.set(move.rot.x, move.rot.y, move.rot.z);

		var xo = this.velocity.x,
			zo = this.velocity.z,
			yo = this.velocity.y;

		xo += move.x;
		zo += move.z;

		var drag = 10.0;
		xo -= xo * drag * move.delta;
		zo -= zo * drag * move.delta;
		yo -= 9.8 * drag * move.delta;

		obj.translateX(xo * move.delta);
		obj.translateY(yo * move.delta);
		obj.translateZ(zo * move.delta);

		// Check if ok...
		var col = this.screen.getTouchingVoxels(this);
		var msgg = "";
		if (col.below) {
			msgg = "below"
			obj.position.y = col.below[1] + 1+ (this.bb.h / 2) ;// + 1 + (this.bb.h / 2);
			yo = 0;
		} else {
			msgg = "nope"
		}

		if (obj.position.y < (this.bb.h / 2)) {
			yo = 0;
			obj.position.y = (this.bb.h / 2);
		}

		if (move.jump) {
			//obj.position.y += 1;
			yo += 145 * drag * move.delta;
		}

		var chunkSize = this.screen.chunkSize - 1;
		//if (obj.position.x < 0) obj.position.x = 0;
		if (obj.position.z < 0) obj.position.z = 0;
		if (obj.position.x > chunkSize) obj.position.x = chunkSize;
		if (obj.position.z > chunkSize) obj.position.z = chunkSize;
		if (obj.position.y > chunkSize) obj.position.y = chunkSize;


		msg(msgg + ":" + obj.position.y.toFixed(2));// + (col.ftl ? col.ftl[0] : "") + ":" + (col.ftr ? col.ftr[0] : ""));

		/*if (col.ftl || col.ftr) {
			obj.translateX(-xo * move.delta);
			//obj.translateY(-yo * move.delta);
			obj.translateZ(-zo * move.delta);
			xo = 0;
			//yo = 0;
			zo = 0;
		}*/

		// Store the leftover 
		this.velocity.set(xo, yo, zo);
		
		this.controls.setPos(obj.position.x, obj.position.y, obj.position.z);
		if (!this.thrd) this.screen.camera.y += this.bb.h;

	}
};