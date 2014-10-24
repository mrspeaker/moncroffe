var main = {

	chunkSize: 20,
	blockSize: 1,

	day: false,

	count: 0,

	init: function () {

		this.initThree();
		this.player = Object.create(Player).init(this.camera, this);

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

		msg("");
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
		this.tick();
		this.render();
		requestAnimationFrame(function () { main.run() });
	},

	tick: function () {
		var delta = this.clock.getDelta();
		this.player.update(delta);
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
			nyb = Math.round((p.y + move.y) - (bb.h / 2) - 0.5), // Erm, why -0.5? dunno.
			nyt = Math.round((p.y + move.y) + (bb.h / 2) - 0.5);

		if (nyb < 0) { nyb = 0; }

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
		var hitGround = true;
		if (!(ch[zl][nyb][xl] || ch[zl][nyb][xr] || ch[zr][nyb][xl] || ch[zr][nyb][xr])) {
			hitGround = false;
			p.y += move.y;
		} else {
			p.y = yb + (bb.h / 2);
		}

		// Check top: TODO: this ain't right. Jumping in messed up. Can get stuck in cubes.
		if (!hitGround && (ch[zl][nyt][xl] || ch[zl][nyt][xr] || ch[zr][nyt][xl] || ch[zr][nyt][xr])) {
			p.y = nyt - (bb.h / 2);
			hitGround = true;
		}
		
		return {x: p.x, y: p.y, z: p.z, ground: hitGround};
	},

	render: function () {
		this.renderer.render(this.scene, this.camera);
	}
};
