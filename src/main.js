var main = {

	day: true,

	curTool: 1,
	lastToolChange: Date.now(),

	frame: 0,
	oneFrameEvery: 1,

	doAddBlock: false,
	doRemoveBlock: false,

	lights: null,
	world: null,

	useAO: true,

	init: function () {

		this.initThree();
		this.world = Object.create(World).init(this);
		this.player = Object.create(Player).init(this);

		this.addCursorObject();
		this.addLights();
		this.createTextures();

		var chs = this.world.createChunks();
		for (var ch in chs) {
			this.scene.add(chs[ch]);
		};

		this.addSkyBox();
		this.updateDayNight();
		this.bindHandlers();

		this.run();

		msg("");
	},

	initThree: function () {

		this.scene = new THREE.Scene();

		this.renderer = new THREE.WebGLRenderer();

		this.camera = new THREE.PerspectiveCamera(75, 1, 0.01, 500);
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
		document.addEventListener('contextmenu', function(e) {
			e.preventDefault();
			return false;
		}, false);

		var onMouseWheel = (function (e) {
			var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
			this.changeTool(-delta);
		}).bind(this);
		document.addEventListener("mousewheel", onMouseWheel, false);
		document.addEventListener("DOMMouseScroll", onMouseWheel, false);

		window.addEventListener("resize", this.setCameraDimensions.bind(this), false );

		document.addEventListener("keydown", (function(e){
			// Toggle Day/Night
			if (e.keyCode === 69 /*e*/) {
				this.day = !this.day;
				this.updateDayNight();
			}

			// Toggle AO
			if (e.keyCode === 81 /*q*/) {
				var pos = this.player.playerObj.position;
				this.useAO = !this.useAO;
				console.log(this.useAO, (pos.x / this.world.chunkWidth | 0) + ":" + (pos.z / this.world.chunkWidth | 0))
				this.reMeshChunk((pos.x / this.world.chunkWidth | 0) + ":" + (pos.z / this.world.chunkWidth | 0));
			}
		}).bind(this), false);
	},

	updateDayNight: function () {
		var day = this.day;

		this.renderer.setClearColor(day ? 0x88C4EC : 0x000000, 1);
		this.scene.fog = day ?
			new THREE.Fog(0xD7EAF9, 10, 120) :
			new THREE.Fog(0x000000, 1, 80);

		this.scene.remove(this.lights.ambientLight);
		this.lights.ambientLight = new THREE.AmbientLight(day ? 0x999999 : 0x2f2f2f);
		this.lights.player.visible = !this.day;
		this.scene.add(this.lights.ambientLight);
		this.skybox.visible = !day;

	},

	setCameraDimensions: function () {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	},

	changeTool: function (dir) {

		if (Date.now() - this.lastToolChange < 200) {
			return;
		}
		this.lastToolChange = Date.now();

		this.curTool += dir;
		if (dir > 0 && this.curTool > this.world.blocks.length - 1) {
			this.curTool = 1;
		}
		if (dir < 0 && this.curTool === 0) {
			this.curTool = this.world.blocks.length - 1;
		}

		document.querySelector("#gui").innerHTML = this.world.blocks[this.curTool];
	},

	addSkyBox: function () {
		var geometry = new THREE.BoxGeometry(490, 490, 490);
		var skyMaterial = new THREE.MeshLambertMaterial({
			map: this.textures.night,
			fog: false,
			ambient: new THREE.Color(0x999999)
		});
		var sky = this.skybox = new THREE.Mesh(geometry, skyMaterial);
		sky.material.side = THREE.BackSide;
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

	createTextures: function () {
		this.textures = {
			blocks: THREE.ImageUtils.loadTexture("res/images/terrain.png"),
			night: THREE.ImageUtils.loadTexture("res/images/night.jpg")
		}
		this.textures.blocks.magFilter = THREE.NearestFilter;
		this.textures.blocks.minFilter = THREE.NearestFilter;

		this.textures.night.wrapS = this.textures.night.wrapT = THREE.RepeatWrapping;
		this.textures.night.repeat.set(3, 3);
	},
	reMeshChunk: function (chunk) {
		// This just deletes & recreates the whole chunk. THis way is verrryy... wrong? Slow at least.
		if (!this.world.chunks[chunk]) {
			return;
		}
		var split = chunk.split(":"); // TODO: ha... c'mon now.
		this.scene.remove(this.world.chunkGeom[chunk]);
		this.world.chunkGeom[chunk] = this.world.createChunkGeom(split[0], split[1], this.world.chunks[chunk]);
		this.scene.add(this.world.chunkGeom[chunk]);
	},

	addBlockAtCursor: function () {
		if (!this.cursor.visible) {
			this.fireOne();
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
		chunk[pos.z + face.z][pos.y + face.y][pos.x + face.x].type = this.world.blocks[this.curTool];

		this.reMeshChunk(chunkId);
	},

	removeBlockAtCursor: function () {
		if (!this.cursor.visible) {
			return;
		}
		var pos = this.cursor.__pos;
		this.world.chunks[this.cursor.__chunk][pos.z][pos.y][pos.x].type = "air";
		this.reMeshChunk(this.cursor.__chunk);
	},

	addLights: function () {

		this.lights = {};
		this.lights.ambientLight = new THREE.AmbientLight(0x999999);
		this.scene.add(this.lights.ambientLight);

		var light = this.lights.player = new THREE.PointLight(0xF3AC44, 1, 8);
		this.camera.add(light); // light follows player

		light = new THREE.PointLight(0xF4D2A3, 1, 10);
		light.position.set(this.chunkWidth - 5, 5, this.chunkWidth - 5);
		this.scene.add(light);

		light = new THREE.PointLight(0xF4D2A3, 1, 10);
		light.position.set(2 * this.chunkWidth - 5, 5, 2 * this.chunkWidth - 5);
		this.scene.add(light);

	},

	run: function () {
		if (this.frame++ % this.oneFrameEvery === 0) {
			this.tick();
			this.render();
		}
		requestAnimationFrame(function () { main.run() });
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
			msg(dt); // Track big/small updates
		}
		this.player.tick(delta);
		this.world.tick(delta);
	},

	cast: function () {
		var ob = this.player.controls,
			cursor = this.cursor,
			chs = this.world.chunks,
			origin = ob.getObject().position.clone(),
			chW = this.world.chunkWidth;

		origin.addScalar(0.5);

		this.raycast(origin, ob.getDirection(), 5, function (x, y, z, face) {
			if (x === "miss") {
				cursor.visible = false;
				return false;
			}

			cursor.visible = true;

			if (y < 0) y = 0; // looking below ground breaks

			var chunkX = Math.floor(x / chW),
				chunkZ = Math.floor(z / chW),
				chunk = chs[chunkX + ":" + chunkZ];

			if (!chunk) {
				return false;
			}

			cursor.position.set(x, y + 0.5, z);

			x -= chunkX * chW;
			z -= chunkZ * chW;

			cursor.__face = face;
			cursor.__chunk = chunkX + ":" + chunkZ;
			cursor.__chunkX = chunkX;
			cursor.__chunkZ = chunkZ;

			cursor.__pos = {x: x, y: y, z: z};

			return chs[cursor.__chunk][z][y][x].type !== "air";
		});
	},

	fireOne: function () {
		var dir = this.player.controls.getDirection().clone();
		var pos = this.player.controls.getObject().position.clone();

		dir.multiplyScalar(7);
		pos.add(dir);

		var chunks = {}

		var type = "sand";

		chunks[this.world.setBlockAt(pos.x, pos.y, pos.z, type)] = true;
		chunks[this.world.setBlockAt(pos.x - 1, pos.y, pos.z, type)] = true;
		chunks[this.world.setBlockAt(pos.x + 1, pos.y, pos.z, type)] = true;

		chunks[this.world.setBlockAt(pos.x, pos.y + 1, pos.z, type)] = true;
		chunks[this.world.setBlockAt(pos.x, pos.y - 1, pos.z, type)] = true;

		chunks[this.world.setBlockAt(pos.x, pos.y, pos.z + 1, type)] = true;
		chunks[this.world.setBlockAt(pos.x, pos.y, pos.z - 1, type)] = true;

		for (var ch in chunks) {
			this.reMeshChunk(ch);
		}

	},

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
			block = this.world.getBlockAt.bind(this.world);

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
		if (nyt > this.chunkHeight - 1) {nyt = this.chunkHeight - 1}

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

		return {x: p.x, y: p.y, z: p.z, ground: hitGround};
	},

	render: function () {
		this.renderer.render(this.scene, this.camera);
	}
};
