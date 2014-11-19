(function (World, Player, Bullet, utils, THREE) {

	"use strict";

	var main = {

		useAO: true,
		isOculus: false,

		player: null,
		clientId: null,
		world: null,
		bullets: null,
		targets: null,
		particles: null,
		cursor: null,

		frame: 0,
		oneFrameEvery: 1, // Slow down time, for testing
		quality: 1, // Divides the screen width/height and streches the canvas

		scene: null,
		camera: null,
		renderer: null,
		vrRenderer: null,
		vrControls: null,
		clock: null,

		textures: {},
		materials: {},

		network: null,

		settings: null,

		screen: null,

		init: function () {

			var self = this;

			this.initUserSettings();

			this.initScene();
			this.loadTextures();
			this.addMaterials();

			this.bullets = [];
			this.targets = [];
			this.particles = [];

			this.screen = Object.create(TitleScreen).init(this);

			this.run();

			utils.msg("");
		},

		initUserSettings: function () {

			this.settings = utils.extend({}, default_settings);

			var stored = window.localStorage.getItem("settings");
			if (stored !== null) {
				this.settings = JSON.parse(stored);
			}

		},

		saveSettings: function () {

			var s = this.settings;
			window.localStorage.setItem("settings", JSON.stringify(s));

		},

		initScene: function () {

			this.scene = new THREE.Scene();
			this.renderer = new THREE.WebGLRenderer();

			this.vrRenderer = new THREE.VREffect(this.renderer, function (err) {
				if (err) {
					console.error("vr error:", err);
				}
			});
			this.camera = new THREE.PerspectiveCamera(85, 1, 0.01, 500);
			this.setCameraDimensions();
			this.vrControls = new THREE.VRControls(this.camera);


			this.clock = new THREE.Clock();

			document.querySelector("#board").appendChild(this.renderer.domElement);

		},

		bindHandlers: function () {

			var player = this.player;

			document.addEventListener("mousedown", (function(e){

				if (!player.controls.enabled) {
					return;
				}

				if (e.shiftKey || e.button !== 0) {
					this.screen.doRemoveBlock = true;
				} else {
					this.screen.doAddBlock = true;
				}

			}).bind(this), false);

			// Stop right-click menu
			document.addEventListener("contextmenu", function(e) {

				e.preventDefault();
				return false;

			}, false);

			var onMouseWheel = function (e) {

				var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
				player.changeTool(-delta);

			};

			document.addEventListener("mousewheel", onMouseWheel, false);
			document.addEventListener("DOMMouseScroll", onMouseWheel, false);
			document.addEventListener("keydown", (function(e){

				// Toggle Oculus
				if (e.keyCode === 69 /*e*/) {
					this.toggleOculus();
				}

				// Toggle AO
				if (e.keyCode === 81 /*q*/) {
					var pos = player.playerObj.position;
					this.useAO = !this.useAO;
					this.world.reMeshChunk(pos.x / this.world.chunkWidth | 0, pos.z / this.world.chunkWidth | 0);
				}

				if (e.keyCode === 49 /*1*/) {
					var s = this.settings.mouse_sensitivity - 0.05;
					this.settings.mouse_sensitivity = s;
					player.controls.setSensitivity(s);
					utils.msg("Sensitivity", s.toFixed(2));

					this.saveSettings();
				}
				if (e.keyCode === 50 /*2*/) {
					var s = this.settings.mouse_sensitivity + 0.05;
					this.settings.mouse_sensitivity = s;
					player.controls.setSensitivity(s);
					utils.msg("Sensitivity", s.toFixed(2));

					this.saveSettings();
				}

				if (e.keyCode === 51 /*3*/) {
					this.vrControls.zeroSensor();
				}

			}).bind(this), false);

			utils.bindPointerLock(function (state) {

				player.controls.enabled = state;

			});

			window.addEventListener("resize", this.setCameraDimensions.bind(this), false );
		},

		setCameraDimensions: function () {

			var w = window.innerWidth,
				h = window.innerHeight,
				quality = this.quality;

			this.camera.aspect = w / h;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize(w / quality, h / quality);
			this.vrRenderer.setSize(w / quality, h / quality);

		},

		loadTextures: function () {

			var t = this.textures = {
				blocks: THREE.ImageUtils.loadTexture("res/images/terrain.png"),
				night: THREE.ImageUtils.loadTexture("res/images/night.jpg")
			};

			t.blocks.magFilter = THREE.NearestFilter;
			t.blocks.minFilter = THREE.NearestFilter;

			t.night.wrapS = t.night.wrapT = THREE.RepeatWrapping;
			t.night.repeat.set(3, 3);

		},

		addMaterials: function () {

			this.materials.bullet = new THREE.MeshBasicMaterial({
				blending	: THREE.AdditiveBlending,
				color		: 0x4444aa,
				depthWrite	: false,
				transparent	: true
			});

			this.materials.target = new THREE.MeshBasicMaterial({
				map: this.textures.blocks,
				//color		: 0xff44aa,
				depthWrite	: false,
				transparent	: true,
				opacity: 0.5
			});

			this.materials.blocks = new THREE.MeshLambertMaterial({
				map: this.textures.blocks,
				wrapAround: true,
				vertexColors: THREE.VertexColors,
				wireframe: false
			});

		},

		toggleOculus: function () {

			this.isOculus = !this.isOculus;
			this.setCameraDimensions();
			document.querySelector("#cursor").className = this.isOculus ? "oculus" : "";

		},

		run: function () {

			if (this.frame++ % this.oneFrameEvery === 0) {
				this.tick();
				this.render();
			}

			requestAnimationFrame(function () { main.run(); });

		},

		tick: function () {

			var delta = this.clock.getDelta() / this.oneFrameEvery;
			delta = Math.min(60 / 1000, delta); // HACK: Limit for physics
			var dt = delta * 1000 | 0;
			if (dt < 15 || dt > 21) {
				//utils.msg(dt); // Track big/small updates
			}

			this.screen.tick(delta);

		},

		explodeParticles: function (pos) {

			for (var i = 0; i < 10; i++) {
				var p = Object.create(Particle).init(
					0.3,
					new THREE.Vector3(
						pos.x + ((Math.random() * 3) - 1.5),
						pos.y + ((Math.random() * 3) - 1.5),
						pos.z + ((Math.random() * 3) - 1.5)),
					this.materials.target);
				this.scene.add(p.mesh);
				this.particles.push(p);
			}

		},

		cast: function () {

			var ob = this.player.controls,
				cursor = this.cursor,
				chs = this.world.chunks,
				origin = ob.getObject().position.clone(),
				chW = this.world.chunkWidth,
				chH = this.world.chunkHeight;

			origin.addScalar(0.5);

			this.raycast(origin, ob.getDirection(), 5, function (x, y, z, face) {

				if (x === "miss") {
					cursor.hide();
					return false;
				}

				cursor.show();

				if (y < 0) y = 0; // looking below ground breaks
				if (y > chH - 1) y = chH - 1;

				var chunkX = Math.floor(x / chW),
					chunkZ = Math.floor(z / chW),
					chunk = chs[chunkX + ":" + chunkZ];

				if (!chunk) {
					return false;
				}

				// Set mesh to original position
				cursor.mesh.position.set(x, y + 0.5, z);

				x -= chunkX * chW;
				z -= chunkZ * chW;

				cursor.set({x: x, y: y, z: z}, {x: chunkX, z: chunkZ}, face);

				return chunk[z][y][x].type !== "air";
			});
		},

		fire: function () {

			var ob = this.player.controls,
				origin = this.player.playerObj.position.clone(),
				direction = ob.getDirection().clone();

			if (this.isOculus) {
				// var vector = new THREE.Vector3( 0, 0, 1 );
				// var camMatrix = ob.getObject().children[0].children[0].matrixWorld;
				// vector.applyQuaternion(new THREE.Vector3().setFromRotationMatrix(camMatrix));
				// //vector.applyMatrix3(camMatrix);
				// //vector.matrix.multiply(camMatrix);
				// //direction.add(vector);// vector.angleTo( origin );
				// direction.copy(vector);
			}

			// Eh, to fire from another location need
			// to translate, then re-do getDirection logic
			if (!this.isOculus) origin.y += 0.4;

			var bullet = Object.create(Bullet).init(origin, direction, this.materials.bullet);
			this.bullets.push(bullet);
			this.scene.add(bullet.mesh);

		},

		/*

			Could do this with three camera and figure out face pos,
			but I want to do it on the voxel model itself so it
			doesn't need the front-end. Maybe make a text adventure
			out of it...

			> GO WEST
			> ... THERE ARE CUBES TO THE EAST, BOTTOM WEST, BOTTOM...

		*/
		raycast: function (origin, direction, radius, callback) {

			function intbound(s, ds) {
			  // Find the smallest positive t such that s+t*ds is an integer.
			  if (ds < 0) {
				return intbound(-s, -ds);
			  } else {
				s = mod(s, 1);
				// problem is now s+t*ds = 1
				return (1-s)/ds;
			  }
			}

			function signum(x) {
			  return x > 0 ? 1 : x < 0 ? -1 : 0;
			}

			function mod(value, modulus) {
			  return (value % modulus + modulus) % modulus;
			}

			// From "A Fast Voxel Traversal Algorithm for Ray Tracing"
			// by John Amanatides and Andrew Woo, 1987
			// <http://www.cse.yorku.ca/~amana/research/grid.pdf>
			// <http://citeseer.ist.psu.edu/viewdoc/summary?doi=10.1.1.42.3443>
			// The foundation of this algorithm is a parameterized representation of
			// the provided ray,
			//                    origin + t * direction,
			// except that t is not actually stored; rather, at any given point in the
			// traversal, we keep track of the *greater* t values which we would have
			// if we took a step sufficient to cross a cube boundary along that axis
			// (i.e. change the integer part of the coordinate) in the variables
			// tMaxX, tMaxY, and tMaxZ.

		  	// Cube containing origin point.
		  	var x = Math.floor(origin.x),
		  		y = Math.floor(origin.y),
		  		z = Math.floor(origin.z);

		  	// Break out direction vector.
		  	var dx = direction.x,
		  		dy = direction.y,
		  		dz = direction.z;

		  // Direction to increment x,y,z when stepping.
		  var stepX = signum(dx);
		  var stepY = signum(dy);
		  var stepZ = signum(dz);
		  // See description above. The initial values depend on the fractional
		  // part of the origin.
		  var tMaxX = intbound(origin.x, dx);
		  var tMaxY = intbound(origin.y, dy);
		  var tMaxZ = intbound(origin.z, dz);
		  // The change in t when taking a step (always positive).
		  var tDeltaX = stepX/dx;
		  var tDeltaY = stepY/dy;
		  var tDeltaZ = stepZ/dz;
		  // Buffer for reporting faces to the callback.
		  var face = new THREE.Vector3();

		  // Avoids an infinite loop.
		  if (dx === 0 && dy === 0 && dz === 0)
			throw new RangeError("Raycast in zero direction!");

		  // Rescale from units of 1 cube-edge to units of 'direction' so we can
		  // compare with 't'.
		  radius /= Math.sqrt(dx*dx+dy*dy+dz*dz);

		  var calledBack = false;
			while(true) {

			// Invoke the callback
			  if (callback(x, y, z, face)) {
				calledBack = true;
				break;
			  }

			// tMaxX stores the t-value at which we cross a cube boundary along the
			// X axis, and similarly for Y and Z. Therefore, choosing the least tMax
			// chooses the closest cube boundary. Only the first case of the four
			// has been commented in detail.
			if (tMaxX < tMaxY) {
			  if (tMaxX < tMaxZ) {
				if (tMaxX > radius) break;
				// Update which cube we are now in.
				x += stepX;
				// Adjust tMaxX to the next X-oriented boundary crossing.
				tMaxX += tDeltaX;
				// Record the normal vector of the cube face we entered.
				face.x = -stepX;
				face.y = 0;
				face.z = 0;
			  } else {
				if (tMaxZ > radius) break;
				z += stepZ;
				tMaxZ += tDeltaZ;
				face.x = 0;
				face.y = 0;
				face.z = -stepZ;
			  }
			} else {
			  if (tMaxY < tMaxZ) {
				if (tMaxY > radius) break;
				y += stepY;
				tMaxY += tDeltaY;
				face.x = 0;
				face.y = -stepY;
				face.z = 0;
			  } else {
				// Identical to the second case, repeated for simplicity in
				// the conditionals.
				if (tMaxZ > radius) break;
				z += stepZ;
				tMaxZ += tDeltaZ;
				face.x = 0;
				face.y = 0;
				face.z = -stepZ;
			  }
			}
		  }
		  if (!calledBack) {
			callback("miss");
		  }
		},

		tryMove: function (e, move) {

			var p = e.playerObj.position.clone(),
				bb = e.bb,
				block = this.world.isBlockAt.bind(this.world);

			var xl = Math.round(p.x - (bb.w / 2)),
				xr = Math.round(p.x + (bb.w / 2)),
				nxl = Math.round((p.x + move.x) - (bb.w / 2)),
				nxr = Math.round((p.x + move.x) + (bb.w / 2));

			var zl = Math.round(p.z - (bb.d / 2)),
				zr = Math.round(p.z + (bb.d / 2)),
				nzl = Math.round((p.z + move.z) - (bb.d / 2)),
				nzr = Math.round((p.z + move.z) + (bb.d / 2));

			var yb = Math.round(p.y - (bb.h / 2)),
				yt = Math.round(p.y + (bb.h / 2) - 0.5),
				nyb = Math.round((p.y + move.y) - (bb.h / 2) - 0.5), // Erm, why -0.5? dunno. Mabye replace yb/yt Math.round with floor.
				nyt = Math.round((p.y + move.y) + (bb.h / 2) - 0.5);

			// Ensure not out of bounds: down or up.
			if (nyb < 0) nyb = 0;
			if (nyt < 1) nyt = 1;
			if (nyt > this.chunkHeight - 1) nyt = this.chunkHeight - 1;

			// Check forward/backward
			if (!(
				block(xl, yb, nzl) || block(xr, yb, nzl) || block(xl, yb, nzr) || block(xr, yb, nzr) ||
				block(xl, yt, nzl) || block(xr, yt, nzl) || block(xl, yt, nzr) || block(xr, yt, nzr)
			)) {
				p.z += move.z;
				zl = nzl;
				zr = nzr;
			}

			// Check left/right
			if (!(
				block(nxl, yb, zl) || block(nxl, yb, zr) || block(nxr, yb, zl) || block(nxr, yb, zr) ||
				block(nxl, yt, zl) || block(nxl, yt, zr) || block(nxr, yt, zl) || block(nxr, yt, zr)
			)) {
				p.x += move.x;
				xl = nxl;
				xr = nxr;
			}

			// Check bottom
			var hitGround = true,
				pushingAndJumping = (move.y > 0 && (move.z || move.y));
			if (pushingAndJumping || !(block(xl, nyb, zl) || block(xr, nyb, zl) || block(xl, nyb, zr) || block(xr, nyb, zr))) {
				hitGround = false;
				p.y += move.y;
			} else {
				p.y = yb + (bb.h / 2);
			}

			// Check top:
			/*
				TODO: this ain't quite right - "slide down" cubes
				Always detects a head hit if you are jumping and pushing.
				It's detecting the sides not just the top
				- Maybe a resolution problem: if sides, move back, if top move down
				- Maybe because of forward/back and left/right done togetehr?
			*/
			if (block(xl, nyt, zl) || block(xr, nyt, zl) || block(xl, nyt, zr) || block(xr, nyt, zr)) {
				//p.y = nyt - (bb.h / 2); // can't force down because it's detecting sides, not just top
				hitGround = true;
			}

			return { x: p.x, y: p.y, z: p.z, ground: hitGround };
		},

		render: function () {

			if (!this.isOculus) {
				this.renderer.render(this.screen.scene, this.camera);
			} else {
				this.vrControls.update();
				this.vrRenderer.render(
					this.scene,
					this.camera); //this.player.controls.getObject().children[0].children[0].matrixWorld);
			}

		}
	};

	window.main = main;

}(
	window.World,
	window.Player,
	window.Bullet,
	window.utils,
	window.THREE
));
