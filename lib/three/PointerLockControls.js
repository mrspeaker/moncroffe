/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.PointerLockControls = function ( camera, settings ) {

	var scope = this;

	camera.rotation.set(0, 0, 0);

	var pitchObject = new THREE.Object3D();
	pitchObject.add(camera);

	var yawObject = new THREE.Object3D();
	yawObject.add(pitchObject);

	var moveForward = false;
	var moveBackward = false;
	var moveLeft = false;
	var moveRight = false;
	var moveJump = false;

	var PI_2 = Math.PI / 2;


	var moveSensitivity = settings.mouse_sensitivity / 1000;

	var onMouseMove = function ( event ) {

		if ( scope.enabled === false ) return;

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		if (settings.invert_mouse) {
			movementY *= -1;
		}

		yawObject.rotation.y -= movementX * moveSensitivity;
		pitchObject.rotation.x -= movementY * moveSensitivity;

		pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );

	};

	var onKeyDown = function (e) {

		var key = e.keyCode,
			isKey = function (k) { return k === key };

		if (settings.up.some(isKey)) {
			moveForward = true;
			return;
		}

		if (settings.down.some(isKey)) {
			moveBackward = true;
			return;
		}

		if (settings.left.some(isKey)) {
			moveLeft = true;
			return;
		}

		if (settings.right.some(isKey)) {
			moveRight = true;
			return;
		}

		if (settings.jump.some(isKey)) {
			moveJump = true;
			return;
		}

	};

	var onKeyUp = function (e) {

		var key = e.keyCode,
			isKey = function (k) { return k === key };

		if (settings.up.some(isKey)) {
			moveForward = false;
			return;
		}

		if (settings.down.some(isKey)) {
			moveBackward = false;
			return;
		}

		if (settings.left.some(isKey)) {
			moveLeft = false;
			return;
		}

		if (settings.right.some(isKey)) {
			moveRight = false;
			return;
		}

	};

	document.addEventListener("mousemove", onMouseMove, false);
	document.addEventListener("keydown", onKeyDown, false);
	document.addEventListener("keyup", onKeyUp, false);

	this.enabled = false;

	this.getObject = function () {

		return yawObject;

	};

	this.getDirection = function() {

		// assumes the camera itself is not rotated
		var direction = new THREE.Vector3(0, 0, -1);
		var rotation = new THREE.Euler(0, 0, 0, "YXZ");

		return function () {

			var v = yawObject.position.clone()
			rotation.set( pitchObject.rotation.x, yawObject.rotation.y, 0 );

			v.copy( direction ).applyEuler( rotation );

			return v;

		}

	}();

	this.update = function (delta) {

		var move = {
			x: 0,
			y: 0,
			z: 0,
			jump: moveJump,
			rot: yawObject.rotation
		};

		moveJump = false;

		if (scope.enabled === false) return move;

		if (moveForward) move.z -= 1;
		if (moveBackward) move.z += 1;
		if (moveLeft) move.x -= 1;
		if (moveRight) move.x += 1;

		return move;

	};

	this.setPos = function (x, y, z) {
		yawObject.position.set(x, y , z);
	};

	this.setSensitivity = function (sensitivity) {
		moveSensitivity = sensitivity / 1000;
	}

};
