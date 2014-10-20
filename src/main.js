var main = {

	chunkSize: 20,

	day: false,

	init: function () {

		this.initThree();
		this.player = new Player(this.camera, this).init();

		this.scene.fog = new THREE.Fog(this.day ? 0xD7EAF9 : 0x111111, 0.1, 80);
		var ambientLight = new THREE.AmbientLight(this.day ? 0x888888 : 0x333333);
		this.scene.add(ambientLight);


		//var hemiLight = new THREE.HemisphereLight( 0x0000ff, 0x00ff00, 0.6 ); 
		//this.scene.add(hemiLight);

		var light = new THREE.PointLight( 0xffffff, 1, 10 ); 
		light.position.set(10, 2.2, 10); 
		this.scene.add(light);

		light = new THREE.PointLight( 0xffffff, 1, 10 ); 
		light.position.set(0, 5, 8); 
		this.scene.add(light);

		/*var directionalLight = new THREE.DirectionalLight(0x000044);
		directionalLight.position.set(20, 10, 20).normalize();
		this.scene.add(directionalLight);*/

		var blockSize = 1;

		var tex = THREE.ImageUtils.loadTexture('res/images/terrain-orig.png');
		tex.magFilter = THREE.NearestFilter;
		tex.minFilter = THREE.NearestFilter;

	    var material = new THREE.MeshLambertMaterial({ 
	    	map: tex,
	    	wrapAround: true
	    });

	    var geoms = [];

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
    			left = getBlock(block[5][0], block[5][1]);

    		geometry.faceVertexUvs[0] = [];
    		geometry.faceVertexUvs[0][0] = [ front[3], front[0], front[2] ];
    		geometry.faceVertexUvs[0][1] = [ front[0], front[1], front[2] ];
    		geometry.faceVertexUvs[0][2] = [ back[3], back[0], back[2] ];
    		geometry.faceVertexUvs[0][3] = [ back[0], back[1], back[2] ];
    		geometry.faceVertexUvs[0][4] = [ top[3], top[0], top[2] ];
    		geometry.faceVertexUvs[0][5] = [ top[0], top[1], top[2] ];
    		geometry.faceVertexUvs[0][6] = [ bottom[3], bottom[0], bottom[2] ];
    		geometry.faceVertexUvs[0][7] = [ bottom[0], bottom[1], bottom[2] ];
    		geometry.faceVertexUvs[0][8] = [ right[3], right[0], right[2] ];
    		geometry.faceVertexUvs[0][9] = [ right[0], right[1], right[2] ];
    		geometry.faceVertexUvs[0][10] = [ left[3], left[0], left[2] ];
    		geometry.faceVertexUvs[0][11] = [ left[0], left[1], left[2] ];

    		geoms[type] = geometry;

    		return geometry;
	    }

		this.chunk = [];
		var chunkSize = this.chunkSize;
		var totalGeom = new THREE.Geometry();
		var materials = [];
		for (var i = 0; i < chunkSize; i++) {
			this.chunk[i] = [];
			for (var j = 0; j  < chunkSize; j++) {
				this.chunk[i][j] = [];
				for (var k = 0; k < chunkSize; k++) {
					this.chunk[i][j][k] = j === 0 || 	
						j === 1 && ((i < 10 && k < 10) || (i > 15 && k > 15)) ||
						j === 2 && i < 5 && k < 5 ||
						j === 3 && i == 0 && k == 0 ||

						j === 3 && i > 5 && k > 5 ? true : Math.random() < 0.05;
					if (this.chunk[i][j][k]) {
						var blocks = ["grass", "stone", "dirt","grass", "stone", "dirt", "grass", "stone", "dirt", "tree", "cobble", "gold", "snow"];
						var geometry = getGeometry(blocks[Math.random() * blocks.length | 0]);
						mesh = new THREE.Mesh(geometry, material);
						materials.push(material);

						mesh.position.set(k, j, i);

						mesh.updateMatrix();
						totalGeom.merge(mesh.geometry, mesh.matrix);

					}
				}
			}
		}

		var total = new THREE.Mesh(totalGeom, material);
		this.scene.add(total);

		this.clock = new THREE.Clock();

		this.run();
	},

	onWindowResize: function () {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize( window.innerWidth, window.innerHeight );
	},

	initThree: function () {

		var scene, camera, renderer;

		this.scene = scene = new THREE.Scene();

		this.camera = camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 500);
		this.renderer = renderer = new THREE.WebGLRenderer();
		renderer.setClearColor( this.day ? 0x88C4EC : 0x000000, 1);
		renderer.setSize(window.innerWidth, window.innerHeight);

		document.querySelector("#board").appendChild(renderer.domElement);

		var self = this;
		window.addEventListener( 'resize', function () { self.onWindowResize(); }, false );

	},

	run: function () {
		this.tick();
		this.render();
		requestAnimationFrame(() => main.run());
	},

	tick: function () {
		var delta = this.clock.getDelta()
		this.player.update(delta);
	},

	getTouchingVoxels: function (e) {

		var cnk = this.chunk,
			p = e.obj.position,
			bb = e.bb,
			xl,
			xm,
			xr,
			ytop, 
			ybot, 
			zl,
			zm,
			zr;

		xl = p.x | 0;
		xm = p.x + (bb.w / 2) | 0;
		xr = p.x + bb.w | 0;
		ytop = p.y + bb.h | 0;
		ybot = p.y | 0;
		zl = p.z | 0;
		zm = p.z + (bb.d / 2) | 0;
		zr = p.z + bb.d | 0;

		//  Take the unit surface normal of the colliding voxel (pointing outward).
    	//	Multiply it by the dot product of itself and the player velocity.
    	//  Subtract it from the player's velocity.
		// This will give you the "slide against the wall" effect that most games employ (without any problematic trigonometry)


		document.querySelector("#watch").innerHTML = xm + ":" + zm + ":" + ytop + " / " + ybot;	 	

		return {
			centerBot: this.chunk[zm][ybot + 1][xm] ? true : false,
			below: this.chunk[zl][ybot][xl] ? [xl, ybot, zl] : false
		}
	},

	render: function () {
		this.renderer.render(this.scene, this.camera);
	}
};
