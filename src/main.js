(function (World, Player, Bullet, utils, THREE) {

	"use strict";

	var main = {

		useAO: true,
		isOculus: false,

		player: null,
		world: null,
		bullets: null,
		cursor: null,

		frame: 0,
		oneFrameEvery: 1, // Slow down time
		quality: 1, // just divides the screen width/height ;)

		doAddBlock: false,
		doRemoveBlock: false,

		scene: null,
		camera: null,
		renderer: null,
		oculusRenderer: null,
		clock: null,

		skybox: null,
		nightbox: null,
		hemisphereUniforms: null,

		lights: {},
		textures: {},

		seed: utils.urlParams.seed || (Math.random() * 99999999 | 0),

		init: function () {

			window.noise.seed(this.seed);

			this.initScene();
			this.loadTextures();

			this.bullets = [];
			this.world = Object.create(World).init(this);
			this.player = Object.create(Player).init(this);

			this.addCursorObject();
			this.addLights();
			this.addSkyBox();

			this.bindHandlers();

			this.world.createChunks();
			this.updateDayNight();
			this.run();

			utils.msg("");
		},

		initScene: function () {

			this.scene = new THREE.Scene();
			this.renderer = new THREE.WebGLRenderer();
			this.oculusRenderer = new THREE.OculusRiftEffect(this.renderer, { worldScale: 100 }); // 100 Units == 1m

			this.camera = new THREE.PerspectiveCamera(70, 1, 0.01, 500);
			this.setCameraDimensions();

			this.clock = new THREE.Clock();

			document.querySelector("#board").appendChild(this.renderer.domElement);

		},

		bindHandlers: function () {

			document.addEventListener("mousedown", (function(e){
				if (!this.player.controls.enabled) {
					return;
				}

				if (e.shiftKey || e.button !== 0) {
					this.doRemoveBlock = true;
				} else {
					this.doAddBlock = true;
				}
			}).bind(this), false);

			// Stop right-click menu
			document.addEventListener("contextmenu", function(e) {
				e.preventDefault();
				return false;
			}, false);

			var onMouseWheel = (function (e) {

				var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
				this.player.changeTool(-delta);

			}).bind(this);

			document.addEventListener("mousewheel", onMouseWheel, false);
			document.addEventListener("DOMMouseScroll", onMouseWheel, false);

			document.addEventListener("keydown", (function(e){

				// Toggle Oculus
				if (e.keyCode === 69 /*e*/) {
					this.toggleOculus();
				}

				// Toggle AO
				if (e.keyCode === 81 /*q*/) {
					var pos = this.player.playerObj.position;
					this.useAO = !this.useAO;
					this.world.reMeshChunk((pos.x / this.world.chunkWidth | 0) + ":" + (pos.z / this.world.chunkWidth | 0));
				}

			}).bind(this), false);

			utils.bindPointerLock(this.setPoinerLock.bind(this));
			window.addEventListener("resize", this.setCameraDimensions.bind(this), false );
		},

		setPoinerLock: function (state) {

			this.player.controls.enabled = state;

		},

		setCameraDimensions: function () {

			this.camera.aspect = window.innerWidth / window.innerHeight;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize(window.innerWidth / this.quality, window.innerHeight / this.quality);
			this.oculusRenderer.setSize(window.innerWidth / this.quality, window.innerHeight / this.quality);

		},

		loadTextures: function () {

			this.textures = {
				blocks: THREE.ImageUtils.loadTexture("res/images/terrain.png"),
				night: THREE.ImageUtils.loadTexture("res/images/night.jpg")
			};

			this.textures.blocks.magFilter = THREE.NearestFilter;
			this.textures.blocks.minFilter = THREE.NearestFilter;

			this.textures.night.wrapS = this.textures.night.wrapT = THREE.RepeatWrapping;
			this.textures.night.repeat.set(3, 3);

		},

		addLights: function () {

			this.lights.ambientLight = new THREE.AmbientLight(0x999999);
			this.scene.add(this.lights.ambientLight);

			var light = this.lights.player = new THREE.PointLight(0xF3AC44, 1, 8);
			this.camera.add(light); // light follows player

			light = new THREE.PointLight(0xF4D2A3, 1, 10);
			light.position.set(this.world.chunkWidth - 5, 5, this.world.chunkWidth - 5);
			this.scene.add(light);

			light = new THREE.PointLight(0xF4D2A3, 1, 10);
			light.position.set(2 * this.world.chunkWidth - 3, 5, 2 * this.world.chunkWidth - 3);
			this.scene.add(light);

			this.scene.fog = new THREE.Fog(0xE8D998, 10, 80);

		},

		addSkyBox: function () {

			// Stary night
			var nightGeometry = new THREE.SphereGeometry(500, 32, 15),
				nightMaterial = new THREE.MeshLambertMaterial({
					map: this.textures.night,
					fog: false,
					ambient: new THREE.Color(0xaaaaaa),
					side: THREE.BackSide
				});
			var night = this.nightbox = new THREE.Mesh(nightGeometry, nightMaterial);
			this.scene.add(night);
			night.visible = false;

			// Horizon shader
			var uniforms = {
				topColor: { type: "c", value: new THREE.Color(0x88C4EC) },
				bottomColor: { type: "c", value: new THREE.Color(0xE8D998) },
				offset: { type: "f", value: 40 },
				exponent: { type: "f", value: 0.6 }
			};

			var skyGeometry = new THREE.SphereGeometry(200, 32, 15),
				skyMaterial = new THREE.ShaderMaterial({
					uniforms: uniforms,
					vertexShader:  document.getElementById("vHemisphere").textContent,
					fragmentShader: document.getElementById("fHemisphere").textContent,
					side: THREE.BackSide
				});
			this.hemisphereUniforms = skyMaterial.uniforms;

			var sky = this.skybox = new THREE.Mesh(skyGeometry, skyMaterial);
			this.scene.add(sky);

		},

		addCursorObject: function () {

			var cursor = this.cursor = new THREE.Mesh(
				new THREE.BoxGeometry(1.01, 1.01, 1.01),
				new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: false}));
			cursor.position.set(1, 2, 8);
			cursor.material.opacity = 0.2;
			cursor.material.transparent = true;

			cursor.__face = null;

			this.scene.add(cursor);

		},

		addBlockAtCursor: function () {

			if (!this.cursor.visible) {
				this.fire();
				return;
			}
			var face = this.cursor.__face,
				pos = this.cursor.__pos;

			// THis is a fix because pos + face could change chunks
			// (eg, if you attach to a face in an ajacent chunk)
			var chunkX = this.cursor.__chunkX,
				chunkZ = this.cursor.__chunkZ,
				chW = this.world.chunkWidth;

			if (pos.z + face.z >= chW) {
				chunkZ++;
				pos.z -= chW;
			}
			if (pos.z + face.z < 0) {
				chunkZ--;
				pos.z += chW;
			}
			if (pos.x + face.x >= chW) {
				chunkX++;
				pos.x -= chW;
			}
			if (pos.x + face.x < 0) {
				chunkX--;
				pos.x += chW;
			}

			var chunkId = chunkX + ":" + chunkZ,
				chunk = this.world.chunks[chunkId];
			if (!chunk) {
				return;
			}
			chunk[pos.z + face.z][pos.y + face.y][pos.x + face.x].type = this.world.blocks[this.player.curTool];

			this.world.reMeshChunk(chunkId);

		},

		removeBlockAtCursor: function () {

			if (!this.cursor.visible) {
				return;
			}
			var pos = this.cursor.__pos;
			this.world.chunks[this.cursor.__chunk][pos.z][pos.y][pos.x].type = "air";
			this.world.reMeshChunk(this.cursor.__chunk);

		},

		toggleOculus: function () {

			this.isOculus = !this.isOculus;
			this.setCameraDimensions();

		},

		run: function () {

			if (this.frame++ % this.oneFrameEvery === 0) {
				this.tick();
				this.render();
			}

			if (this.frame % 50 === 0) {
				this.updateDayNight();
			}

			requestAnimationFrame(function () { main.run(); });

		},

		tick: function () {

			if (this.doAddBlock) {
				this.addBlockAtCursor();
				this.doAddBlock = false;
			}

			if (this.doRemoveBlock) {
				this.removeBlockAtCursor();
				this.doRemoveBlock = false;
			}

			var delta = this.clock.getDelta() / this.oneFrameEvery;
			delta = Math.min(60 / 1000, delta); // HACK: Limit for physics
			var dt = delta * 1000 | 0;
			if (dt < 15 || dt > 21) {
				//utils.msg(dt); // Track big/small updates
			}

			this.player.tick(delta);
			this.bullets = this.bullets.filter(function (b) {
				return b.tick(delta);
			});
			this.world.tick(delta);

		},

		updateDayNight: function () {

			var time = (this.frame % 8000) / 4000;

			if (time > 1) {
				time = 1 + (1 - time);
			}

			//time = Math.sin(Math.PI/2 * Math.cos(time * 2 * Math.PI)) * 0.5 + 0.5;

			//this.renderer.setClearColor(day ? 0x88C4EC : 0x000000, 1);
			this.scene.fog.color.copy(new THREE.Color(0xE8D998).lerp(new THREE.Color(0x000000), time));

			this.scene.remove(this.lights.ambientLight);
			this.lights.ambientLight = new THREE.AmbientLight((new THREE.Color(0x999999)).lerp(new THREE.Color(0x2f2f2f), time));
			this.scene.add(this.lights.ambientLight);

			this.hemisphereUniforms.topColor.value = new THREE.Color(0x88C4EC).lerp(new THREE.Color(0x000000), time);
			this.hemisphereUniforms.bottomColor.value = new THREE.Color(0xE8D998).lerp(new THREE.Color(0x000000), time);
			this.lights.player.visible = time > 0.5;
			this.skybox.visible = time < 0.875;
			this.nightbox.visible = time >= 0.875;

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
					cursor.visible = false;
					return false;
				}

				cursor.visible = true;

				if (y < 0) y = 0; // looking below ground breaks
				if (y > chH - 1) y = chH - 1;

				var chunkX = Math.floor(x / chW),
					chunkZ = Math.floor(z / chW),
					chunk = chs[chunkX + ":" + chunkZ];

				if (!chunk) {
					return false;
				}

				cursor.position.set(x, y + 0.5, z);

				x -= chunkX * chW;
				z -= chunkZ * chW;

				// TODO: clean this up! no __'s.
				cursor.__face = face;
				cursor.__chunk = chunkX + ":" + chunkZ;
				cursor.__chunkX = chunkX;
				cursor.__chunkZ = chunkZ;

				cursor.__pos = {x: x, y: y, z: z};

				return chunk[z][y][x].type !== "air";
			});
		},

		fire: function () {

			var ob = this.player.controls,
				origin = ob.getObject().position,
				direction = ob.getDirection().clone();

			var bullet = Object.create(Bullet).init(origin, direction);
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
		  // Extensions to the described algorithm:
		  //   • Imposed a distance limit.
		  //   • The face passed through to reach the current cube is provided to
		  //     the callback.

		  // The foundation of this algorithm is a parameterized representation of
		  // the provided ray,
		  //                    origin + t * direction,
		  // except that t is not actually stored; rather, at any given point in the
		  // traversal, we keep track of the *greater* t values which we would have
		  // if we took a step sufficient to cross a cube boundary along that axis
		  // (i.e. change the integer part of the coordinate) in the variables
		  // tMaxX, tMaxY, and tMaxZ.

		  // Cube containing origin point.
		  var x = Math.floor(origin.x);
		  var y = Math.floor(origin.y);
		  var z = Math.floor(origin.z);
		  // Break out direction vector.
		  var dx = direction.x;
		  var dy = direction.y;
		  var dz = direction.z;

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
		  //while (/* ray has not gone past bounds of world */
		  //       (stepX > 0 ? x < wx : x >= 0) &&
		  //       (stepY > 0 ? y < wy : y >= 0) &&
		  //       (stepZ > 0 ? z < wz : z >= 0)) {
			while(true) {

			// Invoke the callback, unless we are not *yet* within the bounds of the
			// world.
			//if (!(x < 0 || y < 0 || z < 0 || x >= wx || y >= wy || z >= wz))
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
				this.renderer.render(this.scene, this.camera);
			} else {
				// TODO: figure out how to get final matrix, without having
				// to pass both the yaw and pitch and multiplying
				this.oculusRenderer.render(this.scene, this.player.controls.getObject(), this.player.controls.getObject().children[0]);
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
