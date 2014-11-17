(function (World, Player, Bullet, utils, THREE) {

	"use strict";

	var main = {

		useAO: true,
		isOculus: false,

		player: null,
		clientId: null,
		players: {},
		world: null,
		bullets: null,
		targets: null,
		particles: null,
		cursor: null,

		frame: 0,
		oneFrameEvery: 1, // Slow down time, for testing
		quality: 1, // Divides the screen width/height and streches the canvas

		doAddBlock: false,
		doRemoveBlock: false,

		scene: null,
		camera: null,
		renderer: null,
		oculusRenderer: null,
		vrControls: null,
		clock: null,

		stratosphere: {
			skybox: null,
			nightbox: null,
			uniforms: null,
		},

		lights: {},
		textures: {},
		materials: {},

		useNetwork: true,
		socket: null,

		settings: null,

		screen: null,
		lastPing: Date.now(),
		pingTime: 200,

		init: function () {

			var self = this;

			this.initUserSettings();

			if (this.useNetwork) {
				this.socket = io();
				this.socket.on("ping", function (data) {
					if (!self.clientId) {
						return;
					}
					JSON.parse(data).forEach(function (p) {
						if (p.id === self.clientId) {
							return;
						}
						var playa = self.players[p.id];
						if (!self.players[p.id]) {
							// add it
							console.log("Player joined:", p.id);
							playa = self.players[p.id] = Object.create(PlayerProxy).init(p.id);
							self.scene.add(playa.mesh);
						}

						// Update it
						playa.mesh.position.set(
							p.position.x,
							p.position.y,
							p.position.z
						);
					});
				});

				this.socket.on("dropped", function (id) {
					console.log("Player left:", id);
					var p = self.players[id];
					self.scene.remove(p.mesh);
					delete self.players[id];
				});
			}

			this.initScene();
			this.loadTextures();
			this.addMaterials();

			this.bullets = [];
			this.targets = [];
			this.particles = [];

			this.world = Object.create(World).init(this);
			this.player = Object.create(Player).init(this);
			this.cursor = Object.create(Cursor).init(this);

			this.addLights();
			this.addStratosphere();

			this.bindHandlers();

			this.world.createChunks();
			this.updateDayNight();

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

			// this.oculusRenderer = new THREE.OculusRiftEffect(this.renderer, { worldScale: 100 }); // 100 Units == 1m
			this.oculusRenderer = new THREE.VREffect(this.renderer, function (err) {
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
			this.oculusRenderer.setSize(w / quality, h / quality);

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

		addStratosphere: function () {

			// Stary night
			var nightGeometry = new THREE.SphereGeometry(200, 32, 15),
				nightMaterial = new THREE.MeshLambertMaterial({
					map: this.textures.night,
					fog: false,
					ambient: new THREE.Color(0xaaaaaa),
					side: THREE.BackSide
				});

			var night = this.stratosphere.nightbox = new THREE.Mesh(nightGeometry, nightMaterial);
			night.visible = false;

			// Horizon day shader
			var uniforms = this.stratosphere.uniforms = {
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

			var sky = this.stratosphere.skybox = new THREE.Mesh(skyGeometry, skyMaterial);

			this.scene.add(sky);
			this.scene.add(night);

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

			if (this.frame % 50 === 0) {
				this.updateDayNight();
			}

			requestAnimationFrame(function () { main.run(); });

		},

		tick: function () {

			if (this.doAddBlock) {
				var added = this.world.addBlockAtCursor(this.cursor, this.player.curTool, []);
				if (!added) {
					this.fire();
				}
				this.doAddBlock = false;
			}

			if (this.doRemoveBlock) {
				this.world.removeBlockAtCursor(this.cursor);
				this.doRemoveBlock = false;
			}

			var delta = this.clock.getDelta() / this.oneFrameEvery;
			delta = Math.min(60 / 1000, delta); // HACK: Limit for physics
			var dt = delta * 1000 | 0;
			if (dt < 15 || dt > 21) {
				//utils.msg(dt); // Track big/small updates
			}

			this.screen.tick(delta);

			this.player.tick(delta);
			this.bullets = this.bullets.filter(function (b) {
				var ret = b.tick(delta);
				if (ret) {
					var block = this.world.getBlockAtPos(b.pos);
					if (block.type !== "air") {
						b.stop();
					}
				} else {
					this.scene.remove(b.mesh);
				}
				return ret;
			}, this);

			var maxX = this.world.maxX,
				maxZ = this.world.maxZ,
				xo = this.world.xo,
				zo = this.world.zo;

			this.targets = this.targets.filter(function (t) {
				var ret = t.tick(delta);
				if (!ret) {
					this.scene.remove(t.mesh);
				} else {
					// If not to far out into space...

					if (Math.abs(t.pos.x - xo) < maxX * 1.3 && Math.abs(t.pos.z - zo) < maxZ * 1.3) {
						var hit = this.bullets.some(function (b) {
							return !b.stopped && utils.dist(b.pos, t.pos) < 2;
						});
						if (hit) {
							// Messin' round with networking
							if (this.useNetwork) {
								this.socket.emit("hit", t.pos);
							}
							ret = false;
							this.scene.remove(t.mesh);
							this.explodeParticles(t.pos);
						}
					}
				}
				return ret;
			}, this);

			this.particles = this.particles.filter(function (p) {
				var t = p.tick(delta);
				if (!t) {
					this.scene.remove(p.mesh);
				}
				return t;
			}, this);

			this.world.tick(delta);

			// Add a pumpkin
			if (Math.random() < 0.01) {
				var target = Object.create(Target).init(
					new THREE.Vector3(
						xo + (Math.random() * (maxX * 0.3) * 2) - (maxX * 0.3),
						(Math.random() * 13 | 0) + 0.75,
						zo + (Math.random() * (maxZ * 0.3) * 2) - (maxZ * 0.3)
					),
					new THREE.Vector3(
						Math.random() - 0.5,
						0,
						Math.random() - 0.5
					),
					this.materials.target);
				this.targets.push(target);
				this.scene.add(target.mesh);
			}

			// Do update ping
			var now = Date.now(),
				player = this.player.playerObj;
			if (this.clientId && now - this.lastPing > this.pingTime) {
				this.lastPing = now;
				this.socket.emit("ping", {
					clientId: this.clientId,
					pos: {
						x: player.position.x,
						y: player.position.y,
						z: player.position.z
					}
				});
			}

		},

		updateDayNight: function () {

			var time = (this.frame % 8000) / 4000;

			if (time > 1) {
				time = 1 + (1 - time);
			}

			//time = Math.sin(Math.PI/2 * Math.cos(time * 2 * Math.PI)) * 0.5 + 0.5;

			this.scene.fog.color.copy(new THREE.Color(0xE8D998).lerp(new THREE.Color(0x000000), time));

			this.scene.remove(this.lights.ambientLight);
			this.lights.ambientLight = new THREE.AmbientLight((new THREE.Color(0x999999)).lerp(new THREE.Color(0x2f2f2f), time));
			this.scene.add(this.lights.ambientLight);

			this.lights.player.visible = time > 0.5;

			this.stratosphere.uniforms.topColor.value = new THREE.Color(0x88C4EC).lerp(new THREE.Color(0x000000), time);
			this.stratosphere.uniforms.bottomColor.value = new THREE.Color(0xE8D998).lerp(new THREE.Color(0x000000), time);
			this.stratosphere.skybox.visible = time < 0.875;
			this.stratosphere.nightbox.visible = time >= 0.875;

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
				this.oculusRenderer.render(
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
