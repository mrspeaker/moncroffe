/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.PointerLockControls = function ( camera ) {

	var scope = this;

	camera.rotation.set( 0, 0, 0 );
	camera.position.set(0, 1.9, 0)

	var pitchObject = new THREE.Object3D();
	pitchObject.add(camera);

	var yawObject = new THREE.Object3D();
	yawObject.position.y = 2;
	yawObject.position.x = 2;
	yawObject.position.z = 17;
	yawObject.add(pitchObject);

	var moveForward = false;
	var moveBackward = false;
	var moveLeft = false;
	var moveRight = false;

	//var isOnObject = false;
	//var canJump = false;

	var prevTime = performance.now();

	var velocity = new THREE.Vector3();

	var PI_2 = Math.PI / 2;

	var onMouseMove = function ( event ) {

		if ( scope.enabled === false ) return;

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		yawObject.rotation.y -= movementX * 0.001;
		pitchObject.rotation.x -= movementY * 0.001;

		pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );

	};

	var onKeyDown = function ( event ) {

		switch ( event.keyCode ) {

			case 38: // up
			case 87: // w
				moveForward = true;
				break;

			case 37: // left
			case 65: // a
				moveLeft = true; break;

			case 40: // down
			case 83: // s
				moveBackward = true;
				break;

			case 39: // right
			case 68: // d
				moveRight = true;
				break;

			case 32: // space
				//if ( canJump === true ) velocity.y += 25;
				//canJump = false;
				break;

		}

	};

	var onKeyUp = function ( event ) {

		switch( event.keyCode ) {

			case 38: // up
			case 87: // w
				moveForward = false;
				break;

			case 37: // left
			case 65: // a
				moveLeft = false;
				break;

			case 40: // down
			case 83: // s
				moveBackward = false;
				break;

			case 39: // right
			case 68: // d
				moveRight = false;
				break;

		}

	};

	document.addEventListener( 'mousemove', onMouseMove, false );
	document.addEventListener( 'keydown', onKeyDown, false );
	document.addEventListener( 'keyup', onKeyUp, false );

	this.enabled = false;

	this.getObject = function () {

		return yawObject;

	};

	// this.isOnObject = function ( boolean ) {

	// 	isOnObject = boolean;
	// 	canJump = boolean;

	// };

	this.getDirection = function() {

		// assumes the camera itself is not rotated

		var direction = new THREE.Vector3( 0, 0, -1 );
		var rotation = new THREE.Euler( 0, 0, 0, "YXZ" );

		return function( v ) {

			rotation.set( pitchObject.rotation.x, yawObject.rotation.y, 0 );

			v.copy( direction ).applyEuler( rotation );

			return v;

		}

	}();

	this.update = function () {

		var move = {
			x: 0, 
			y: 0, 
			z: 0, 
			jump: false,
			delta: 0,
			rot: yawObject.rotation
		};

		if ( scope.enabled === false ) return move;

		var time = performance.now();
		var delta = ( time - prevTime ) / 1000;
		move.delta = delta;

		var drag = 10.0,
			poww = 50;

		//velocity.x -= velocity.x * drag * delta;
		//velocity.z -= velocity.z * drag * delta;

		//velocity.y -= 9.8 * drag * delta;

		if ( moveForward ) move.z -= poww * delta;
		if ( moveBackward ) move.z += poww * delta;

		if ( moveLeft ) move.x -= poww * delta;
		if ( moveRight ) move.x += poww * delta;

		/*if ( isOnObject === true ) {

			velocity.y = Math.max( 0, velocity.y );

		}*/

		/*yawObject.translateX( velocity.x * delta );
		yawObject.translateY( velocity.y * delta ); 
		yawObject.translateZ( velocity.z * delta );*/

		/*if ( yawObject.position.y < 0 ) {

			velocity.y = 0;
			yawObject.position.y = 0;

			canJump = true;

		}*/

		prevTime = time;

		return move;

	};

	this.setPos = function (x, y, z) {
		yawObject.position.set(x, y, z);
		return;
		yawObject.translateX(x);
		yawObject.translateY(y);
		yawObject.translateZ(z);
	};

};
