var main = {

	day: true,

	chunkWidth: 16,
	chunkHeight: 20,
	chunks: null,
	chunkGeom: null,

	blockSize: 1,
	blocks: ["blank", "grass", "stone", "dirt", "tree", "wood", "sand", "cobble", "gold", "snow"],
	curTool: 1,
	lastToolChange: Date.now(),

	frame: 0,
	oneFrameEvery: 1,

	doAddBlock: false,
	doRemoveBlock: false,

	lights: null,

	init: function () {

		this.initThree();
		this.player = Object.create(Player).init(this);

		this.addCursorObject();
		this.addLights();
		this.createTextures();
		this.createChunks();
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
			if (e.keyCode === 69) {
				this.day = !this.day;
				this.updateDayNight();
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
		if (dir > 0 && this.curTool > this.blocks.length - 1) {
			this.curTool = 1;
		}
		if (dir < 0 && this.curTool === 0) {
			this.curTool = this.blocks.length - 1;
		}

		document.querySelector("#gui").innerHTML = this.blocks[this.curTool];
	},

	createChunks: function () {

		this.chunks = {}; // Reference to chunk data
		this.chunkGeom = {}; // Reference to chunk mesh

		var addChunk = (function (x, z) {
			var id = x + ":" + z;
			this.chunks[id] = this.createChunk();
			this.chunkGeom[id] = this.createChunkGeom(x, z, this.chunks[id]);
			this.scene.add(this.chunkGeom[id]);
		}).bind(this);

		addChunk(0, 0);
		addChunk(0, 1);
		addChunk(1, 0);
		addChunk(1, 1);
		
		addChunk(-1, 0);
		addChunk(0, -1); 
		addChunk(2, 0);
		addChunk(1, 2);

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

	createChunk: function () {

	    // Create the chunk
		var chunk = [];
		for (var z = 0; z < this.chunkWidth; z++) {
			chunk[z] = [];
			for (var y = 0; y < this.chunkHeight; y++) {
				chunk[z][y] = [];
				for (var x = 0; x < this.chunkWidth; x++) {
					if (y === 0) {
						// Ground
						chunk[z][y][x] = ["grass", "dirt"][Math.random() * 2 | 0];
					} else if (
						// Grass Sphere
						Math.sqrt(x * x + y * y + (z * 5)) < 10 && Math.sqrt(x * x + y * y + (z *5)) > 7) {
						chunk[z][y][x] =  "grass";
					} else if (y === 4 && z > 9 && x > 8) {
						// Platform
						chunk[z][y][x] = ["tree", "stone"][Math.random() * 2 | 0];
					} else if (Math.random() < 0.01) {
						// Random block or air
						chunk[z][y][x] = this.blocks[(Math.random() * this.blocks.length - 1 | 0) + 1];
					} else {
						// Air
						chunk[z][y][x] = 0;
					}
				}
			}
		}

		return chunk;
	},

	createChunkGeom: function (x, z, chunk) {
	    var geoms = [],
	    	blockSize = this.blockSize;

	    function getGeometry(type) {

	    	if (geoms[type]) {
	    		return geoms[type];
	    	}

	    	var geometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize),
	    		// F, B, T, B, L, R
	    		blocks = {
	    			grass: [[3, 15], [3, 15], [0, 15], [2, 15], [3, 15], [3, 15]],
	    			stone: [[1, 15], [1, 15], [1, 15], [1, 15], [1, 15], [1, 15]],
	    			dirt: [[2, 15], [2, 15], [2, 15], [2, 15], [2, 15], [2, 15]],
	    			tree: [[4, 14], [4, 14], [5, 14], [5, 14], [4, 14], [4, 14]],
	    			wood: [[4, 15], [4, 15], [4, 15], [4, 15], [4, 15], [4, 15]],
	    			sand: [[2, 14], [2, 14], [2, 14], [2, 14], [2, 14], [2, 14]],
	    			cobble: [[0, 14], [0, 14], [0, 14], [0, 14], [0, 14], [0, 14]],
	    			gold: [[0, 13], [0, 13], [0, 13], [0, 13], [0, 13], [0, 13]],
	    			snow: [[4, 11], [4, 11], [2, 11], [2, 15], [4, 11], [4, 11]],
	    			ice: [[3, 11], [3, 11], [3, 11], [3, 11], [3, 11], [3, 11]]
	    		},
	    		block = blocks[type];
    	    
    	    function getBlock(x, y) {
    	    	return [
    		    	new THREE.Vector2(x / 16, y / 16),
    		    	new THREE.Vector2((x + 1) / 16, y / 16),
    		    	new THREE.Vector2((x + 1) / 16, (y + 1) / 16), 
    		    	new THREE.Vector2(x / 16, (y + 1) / 16)
    	    	];
    	    }

    	    var front = getBlock(block[0][0], block[0][1]),
    			back = getBlock(block[1][0], block[1][1]),
    			top = getBlock(block[2][0], block[2][1]),
    			bottom = getBlock(block[3][0], block[3][1]),
    			right = getBlock(block[4][0], block[4][1]),
    			left = getBlock(block[5][0], block[5][1]),
    			faceUVs = geometry.faceVertexUvs;

    		faceUVs[0] = [];
    		faceUVs[0][0] = [front[3], front[0], front[2]];
    		faceUVs[0][1] = [front[0], front[1], front[2]];
    		faceUVs[0][2] = [back[3], back[0], back[2]];
    		faceUVs[0][3] = [back[0], back[1], back[2]];
    		faceUVs[0][4] = [top[3], top[0], top[2]];
    		faceUVs[0][5] = [top[0], top[1], top[2]];
    		faceUVs[0][6] = [bottom[3], bottom[0], bottom[2]];
    		faceUVs[0][7] = [bottom[0], bottom[1], bottom[2]];
    		faceUVs[0][8] = [right[3], right[0], right[2]];
    		faceUVs[0][9] = [right[0], right[1], right[2]];
    		faceUVs[0][10] = [left[3], left[0], left[2]];
    		faceUVs[0][11] = [left[0], left[1], left[2]];


			var faceIndices = [ 'a', 'b', 'c', 'd' ];
			var c = []
    		var size = 1;
    		for (var i = 0; i < geometry.vertices.length; i++) {
    			var point = geometry.vertices[ i ];
    			var color = new THREE.Color( 0xffffff );
    			color.setRGB( 0.5 + point.x / size, 0.5 + point.y / size, 0.5 + point.z / size );
    			c[i] = color; // use this array for convenience
			}
    		
    		// copy the colors to corresponding positions 
			//     in each face's vertexColors array.
			/*console.log(geometry.faces.length)
			for (i = 0; i < geometry.faces.length; i++ ) {
    			face = geometry.faces[ i ];
    			numberOfSides = ( face instanceof THREE.Face3 ) ? 3 : 4;
    			for( var j = 0; j < numberOfSides; j++ ) {
    				var color = new THREE.Color( 0xffffff );
    				var r = Math.random();
    				color.setRGB(r, r, r)
        			vertexIndex = face[ faceIndices[ j ] ];
        			face.vertexColors[ j ] = color// c[ vertexIndex ];
    			}
			}*/

			var face = geometry.faces[0];
			/*numberOfSides = ( face instanceof THREE.Face3 ) ? 3 : 4;
    			var r = Math.random();
    			for( var j = 0; j < numberOfSides; j++ ) {
    				var color = new THREE.Color( 0xffffff );
    				
    				color.setRGB(r, r, r)
        			// vertexIndex = face[ faceIndices[ j ] ];
        			face.vertexColors[ j ] = color// c[ vertexIndex ];
    			}
			*/
			function lightitup (tri1, tri2) {

				var shadow = 0x999999,
					light = 0xffffff;
				face = geometry.faces[tri1];
				face.vertexColors[0] = new THREE.Color( light );
				face.vertexColors[1] = new THREE.Color( shadow );
				face.vertexColors[2] = new THREE.Color( light );

				face = geometry.faces[tri2];
				face.vertexColors[0] = new THREE.Color( shadow );
				face.vertexColors[1] = new THREE.Color( shadow );    		
				face.vertexColors[2] = new THREE.Color( light );

			}

			lightitup(0, 1);
			lightitup(2, 3);
			lightitup(8, 9);
			lightitup(10, 11);
			

			/*var radius = 0.5;
			for ( var i = 0; i < geometry.faces.length; i ++ ) {

				f  = geometry.faces[ i ];
				//f2 = geometry2.faces[ i ];
				//f3 = geometry3.faces[ i ];

				n = ( f instanceof THREE.Face3 ) ? 3 : 4;

				for( var j = 0; j < n; j++ ) {

					vertexIndex = f[ faceIndices[ j ] ];

					p = geometry.vertices[ vertexIndex ];

					color = new THREE.Color( 0xffffff );
					color.setHSL( ( p.y / radius + 1 ) / 2, 1.0, 0.5 );

					f.vertexColors[ j ] = color;

					//color = new THREE.Color( 0xffffff );
					//color.setHSL( 0.0, ( p.y / radius + 1 ) / 2, 0.5 );

					//f2.vertexColors[ j ] = color;

					//color = new THREE.Color( 0xffffff );
					//color.setHSL( 0.125 * vertexIndex/geometry.vertices.length, 1.0, 0.5 );

					//f3.vertexColors[ j ] = color;

				}

			}
			*/

    		geoms[type] = geometry;

    		return geometry;
	    }


	    // Create the chunk
		var totalGeom = new THREE.Geometry();

		for (var i = 0; i < this.chunkWidth; i++) {
			for (var j = 0; j  < this.chunkHeight; j++) {
				for (var k = 0; k < this.chunkWidth; k++) {
					if (chunk[i][j][k]) {
						var geometry = getGeometry(chunk[i][j][k]),
							mesh = new THREE.Mesh(geometry, blockMaterial);

						// Move up so bottom of cube is at 0, not -0.5
						mesh.position.set(k + (x * this.chunkWidth), j + blockSize / 2, i + (z * this.chunkWidth));
						mesh.updateMatrix();

						totalGeom.merge(mesh.geometry, mesh.matrix);

					}
				}
			}
		}

		var blockMaterial = new THREE.MeshLambertMaterial({ 
			map: this.textures.blocks,
			wrapAround: true,
			vertexColors: THREE.VertexColors
		});
	
		return new THREE.Mesh(totalGeom, blockMaterial);
	},

	reMeshChunk: function (chunk) {
		// This just deletes & recreates the whole chunk. THis way is verrryy... wrong? Slow at least.
		if (!this.chunks[chunk]) {
			return;
		}
		var split = chunk.split(":"); // TODO: ha... c'mon now.
		this.scene.remove(this.chunkGeom[chunk]);
		this.chunkGeom[chunk] = this.createChunkGeom(split[0], split[1], this.chunks[chunk]);
		this.scene.add(this.chunkGeom[chunk]);
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
			chunkZ = this.cursor.__chunkZ;

		if (pos.z + face.z >= this.chunkWidth) {
			chunkZ++;
			pos.z -= this.chunkWidth;
		}
		if (pos.z + face.z < 0) {
			chunkZ--;
			pos.z += this.chunkWidth;
		}
		if (pos.x + face.x >= this.chunkWidth) {
			chunkX++;
			pos.x -= this.chunkWidth;
		}
		if (pos.x + face.x < 0) {
			chunkX--;
			pos.x += this.chunkWidth;
		}

		var chunkId = chunkX + ":" + chunkZ,
			chunk = this.chunks[chunkId];
		if (!chunk) {
			return;
		}
		chunk[pos.z + face.z][pos.y + face.y][pos.x + face.x] = this.blocks[this.curTool];
		this.reMeshChunk(chunkId);
	},

	removeBlockAtCursor: function () {
		if (!this.cursor.visible) {
			return;
		}
		var pos = this.cursor.__pos;
		this.chunks[this.cursor.__chunk][pos.z][pos.y][pos.x] = 0;
		this.reMeshChunk(this.cursor.__chunk);
	},

	addLights: function () {

		this.lights = {};
		this.lights.ambientLight = new THREE.AmbientLight(0x999999);
		this.scene.add(this.lights.ambientLight);

		var light = new THREE.PointLight(0xF3AC44, 1, 8);
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
			msg(dt);
		}
		this.player.update(delta);
	},

	cast: function () {
		var ob = this.player.controls,
			cursor = this.cursor,
			chs = this.chunks,
			origin = ob.getObject().position.clone(),
			chW = this.chunkWidth;

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

			return chs[cursor.__chunk][z][y][x];
		});
	},

	fireOne: function () {
		var dir = this.player.controls.getDirection().clone();
		var pos = this.player.controls.getObject().position.clone();
		
		dir.multiplyScalar(9);
		pos.add(dir);

		var chunks = {}

		var type = 0;//"sand"

		chunks[this.setBlockAt(pos.x, pos.y, pos.z, type)] = true;
		chunks[this.setBlockAt(pos.x - 1, pos.y, pos.z, type)] = true;
		chunks[this.setBlockAt(pos.x + 1, pos.y, pos.z, type)] = true;

		chunks[this.setBlockAt(pos.x, pos.y + 1, pos.z, type)] = true;
		chunks[this.setBlockAt(pos.x, pos.y - 1, pos.z, type)] = true;
		
		chunks[this.setBlockAt(pos.x, pos.y, pos.z + 1, type)] = true;
		chunks[this.setBlockAt(pos.x, pos.y, pos.z - 1, type)] = true;

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

	setBlockAt: function (x, y, z, type) {
		var chunkX = Math.floor(x / this.chunkWidth),
			chunkZ = Math.floor(z / this.chunkWidth),
			chunk;
		
		x -= chunkX * this.chunkWidth;
		z -= chunkZ * this.chunkWidth;

		x = Math.round(x);
		z = Math.round(z);
		y = Math.round(y);
		if (y < 0) y = 0;

		chunk = this.chunks[chunkX + ":" + chunkZ];

		if (chunk) {
			chunk[z][y][x] = type;
		}

		return chunkX + ":" + chunkZ;
	},

	getBlockAt: function (x, y, z) {

		var chunkX = Math.floor(x / this.chunkWidth),
			chunkZ = Math.floor(z / this.chunkWidth),
			chunk;
		
		x -= chunkX * this.chunkWidth;
		z -= chunkZ * this.chunkWidth;

		chunk = this.chunks[chunkX + ":" + chunkZ];

		if (!chunk) {
			return 1;
		}

		return chunk[z][y][x];

	},
	
	tryMove: function (e, move) {

		var p = e.playerObj.position.clone(),
			bb = e.bb,
			block = this.getBlockAt.bind(this);

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
