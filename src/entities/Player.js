var Player = {

	thrd: false,

	init: function (camera, screen) {

		this.camera = camera;
		this.screen = screen;

		
		this.bb = {
			w: 0.7, 
			d: 0.7, 
			h: 1.9
		};

		this.velocity = new THREE.Vector3(0, 0, 0);

		var playerObj = this.playerObj = new THREE.Object3D();
		playerObj.position.set(0, 2 + (this.bb.h / 2), 15);
	    playerObj.add(
			new THREE.Mesh(
	    		new THREE.BoxGeometry(this.bb.w, this.bb.h, this.bb.d), 
	    		new THREE.MeshLambertMaterial({ color: 0xff00ff, wireframe: true})));

	    if (this.thrd) {
	    	this.screen.scene.add(playerObj);
	    }

	    this.addPlayerBase();

		var controls = this.controls = this.createControls();
		this.screen.scene.add(controls.getObject());

		return this;
	},

	addPlayerBase: function () {
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
		this.screen.scene.add(this.marker);
	},

	update: function (delta) {

		var obj = this.playerObj,
			move = this.controls.update(delta),
			power = 200 * delta,
			jump = 130,
			drag = 10 * delta;

		obj.rotation.set(move.rot.x, move.rot.y, move.rot.z);

		var xo = this.velocity.x,
			zo = this.velocity.z,
			yo = this.velocity.y;

		var oldPos = obj.position.clone(),
			newPos;

		xo += move.x * power;
		zo += move.z * power;

		//xo -= xo * drag;
		//zo -= zo * drag;
		yo -= 9.8 * drag;

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
		var col = this.screen.tryMove(this, newPos);

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
		}

		if (move.jump) {
			yo += jump * drag;
		}

		// Confine to chunk
		var chunkSize = this.screen.chunkSize - 1;
		if (obj.position.z < 0) obj.position.z = 0;
		if (obj.position.x > chunkSize) obj.position.x = chunkSize;
		if (obj.position.z > chunkSize) obj.position.z = chunkSize;
		if (obj.position.y > chunkSize) obj.position.y = chunkSize;

		this.velocity.set(0, yo, 0);
		this.controls.setPos(obj.position.x, obj.position.y, obj.position.z);
		this.marker.position.set(obj.position.x, obj.position.y - (this.bb.h / 2) + 0.05, obj.position.z);
	},

	createControls: function () {

		var controls = new THREE.PointerLockControls(this.thrd ? new THREE.Object3D(): this.camera);
		
		if (this.thrd) {
			this.camera.position.set(-5, 2, 10);
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
	}

};