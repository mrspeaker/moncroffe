var main = {

	chunkSize: 25,
	blockSize: 1,

	day: false,

	count: 0,
	oneFrameEvery: 1,

	init: function () {

		this.initThree();
		this.player = Object.create(Player).init(this.camera, this);

		this.sel = new THREE.Mesh(
	    		new THREE.BoxGeometry(1.0, 1.0, 1.0), 
	    		new THREE.MeshLambertMaterial({ color: 0xff00ff, wireframe: false}));
		this.sel.position.set(1, 2, 8);
		this.sel.material.opacity = 0.5;
		this.sel.material.transparent = true

		this.scene.add(this.sel);

		this.addLights();

		var blockTex = THREE.ImageUtils.loadTexture('res/images/terrain-orig.png');
		blockTex.magFilter = THREE.NearestFilter;
		blockTex.minFilter = THREE.NearestFilter;

	    var blockMaterial = new THREE.MeshLambertMaterial({ 
	    	map: blockTex,
	    	wrapAround: true
	    });

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
	    			cobble: [[0, 14], [0, 14], [0, 14], [0, 14], [0, 14], [0, 14]],
	    			gold: [[0, 13], [0, 13], [0, 13], [0, 13], [0, 13], [0, 13]],
	    			snow: [[2, 11], [2, 11], [2, 11], [2, 11], [2, 11], [2, 11]]
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

    		geoms[type] = geometry;

    		return geometry;
	    }


	    // Create the chunk
		this.chunk = [];
		var chunkSize = this.chunkSize,
			totalGeom = new THREE.Geometry();

		for (var i = 0; i < chunkSize; i++) {
			this.chunk[i] = [];
			for (var j = 0; j  < chunkSize; j++) {
				this.chunk[i][j] = [];
				for (var k = 0; k < chunkSize; k++) {
					this.chunk[i][j][k] = j === 0 || 	
						j === 1 && ((i < 10 && k < 10) || (i > 15 && k > 15)) ||
						j === 2 && i < 5 && k < 5 ||
						j === 3 && i == 0 && k == 0 ||

						j === 3 && i > 5 && k > 5 ? true : Math.random() < 0.02;
					if (this.chunk[i][j][k]) {
						var blocks = ["grass", "stone", "dirt","grass", "stone", "dirt", "grass", "stone", "dirt", "tree", "cobble", "gold", "snow"],
							geometry = getGeometry(blocks[Math.random() * blocks.length | 0]),
							mesh = new THREE.Mesh(geometry, blockMaterial);

						// Move up so bottom of cube is at 0, not -0.5
						mesh.position.set(k, j + blockSize / 2, i);

						mesh.updateMatrix();
						totalGeom.merge(mesh.geometry, mesh.matrix);

					}
				}
			}
		}

		// Add all the geometry
		this.scene.add(new THREE.Mesh(totalGeom, blockMaterial));

		this.clock = new THREE.Clock();
		this.run();

		document.addEventListener("mousedown", (function(){
			this.cast();
		}).bind(this), false);

		msg("");
	},

	cast: function () {
		var ob = this.player.controls,
			sel = this.sel,
			ch = this.chunk,
			origin = ob.getObject().position.clone();

		origin.addScalar(0.5);
		
		this.raycast(origin, ob.getDirection(), 5, function (x, y, z, face) {
			sel.position.set(x + face.x, y + 0.5 + face.y, z + face.z);
			return ch[z][y][x];
		});
	},

	onWindowResize: function () {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize( window.innerWidth, window.innerHeight );
	},

	initThree: function () {

		var scene, camera, renderer;

		this.scene = scene = new THREE.Scene();

		this.camera = camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 500);
		this.renderer = renderer = new THREE.WebGLRenderer();
		renderer.setClearColor( this.day ? 0x88C4EC : 0x000000, 1);
		renderer.setSize(window.innerWidth, window.innerHeight);

		document.querySelector("#board").appendChild(renderer.domElement);

		var self = this;
		window.addEventListener( 'resize', function () { self.onWindowResize(); }, false );

	},

	addLights: function () {

		this.scene.fog = new THREE.Fog(this.day ? 0xD7EAF9 : 0x111111, 0.1, 80);
		var ambientLight = new THREE.AmbientLight(this.day ? 0x888888 : 0x333333);
		this.scene.add(ambientLight);

		var light = new THREE.PointLight( 0xffffff, 1, 10 ); 
		light.position.set(10, 2.2, 10); 
		this.scene.add(light);

		light = new THREE.PointLight( 0xffffff, 1, 10 ); 
		light.position.set(0, 5, 8); 
		this.scene.add(light);

	},

	run: function () {
		if (this.count++ % this.oneFrameEvery === 0) {
			this.tick();
			this.render();
		}
		requestAnimationFrame(function () { main.run() });
	},

	tick: function () {
		var delta = this.clock.getDelta() / this.oneFrameEvery;
		this.player.update(delta);
	},


	raycast: function (origin, direction, radius, callback) {

		var wx = wy = wz = this.chunkSize;

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
	  while (/* ray has not gone past bounds of world */
	         (stepX > 0 ? x < wx : x >= 0) &&
	         (stepY > 0 ? y < wy : y >= 0) &&
	         (stepZ > 0 ? z < wz : z >= 0)) {
	    
	    // Invoke the callback, unless we are not *yet* within the bounds of the
	    // world.
	    if (!(x < 0 || y < 0 || z < 0 || x >= wx || y >= wy || z >= wz))
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
	  	callback(0, 3, 10, new THREE.Vector3(0, 1, 0))
	  }
	},
	
	tryMove: function (e, move) {

		var ch = this.chunk,
			p = e.playerObj.position.clone(),
			bb = e.bb;

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

		if (xl < 0) xl = 0;
		if (xr < 0) xr = 0;
		if (nxl < 0) nxl = 0;
		if (nxr < 0) nxr = 0;

		// Check forward/backward
		if (!(
			ch[nzl][yb][xl] || ch[nzl][yb][xr] || ch[nzr][yb][xl] || ch[nzr][yb][xr] ||
			ch[nzl][yt][xl] || ch[nzl][yt][xr] || ch[nzr][yt][xl] || ch[nzr][yt][xr]
		)) {
			p.z += move.z;
			zl = nzl;
			zr = nzr;
		}

		// Check left/right
		if (!(
			ch[zl][yb][nxl] || ch[zr][yb][nxl] || ch[zl][yb][nxr] || ch[zr][yb][nxr] ||
			ch[zl][yt][nxl] || ch[zr][yt][nxl] || ch[zl][yt][nxr] || ch[zr][yt][nxr]
		)) {
			p.x += move.x;
			xl = nxl;
			xr = nxr;
		}

		// Check bottom
		var hitGround = true,
			pushingAndJumping = (move.y > 0 && (move.z || move.y));
		if (pushingAndJumping || !(ch[zl][nyb][xl] || ch[zl][nyb][xr] || ch[zr][nyb][xl] || ch[zr][nyb][xr])) {
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
		if (ch[zl][nyt][xl] || ch[zl][nyt][xr] || ch[zr][nyt][xl] || ch[zr][nyt][xr]) {
			//p.y = nyt - (bb.h / 2); // can't force down because it's detecting sides, not just top
			hitGround = true;
		}
		
		return {x: p.x, y: p.y, z: p.z, ground: hitGround};
	},

	render: function () {
		this.renderer.render(this.scene, this.camera);
	}
};
