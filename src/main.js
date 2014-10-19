var main = {

	chunkSize: 20,

	init: function () {

		this.initThree();
		this.player = new Player(this.camera, this).init();

		this.scene.fog = new THREE.Fog(0xaaaaaa, 0.010, 40);
		var ambientLight = new THREE.AmbientLight(0x888888);
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
		var geometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);

	    var material = new THREE.MeshPhongMaterial({ 
	    	map: THREE.ImageUtils.loadTexture('res/images/all.jpg'),
	    	wrapAround: true
	    });

	    var bricks = [new THREE.Vector2(0, .666), new THREE.Vector2(.5, .666), new THREE.Vector2(.5, 1), new THREE.Vector2(0, 1)];
		var clouds = [new THREE.Vector2(.5, .666), new THREE.Vector2(1, .666), new THREE.Vector2(1, 1), new THREE.Vector2(.5, 1)];
		var crate = [new THREE.Vector2(0, .333), new THREE.Vector2(.5, .333), new THREE.Vector2(.5, .666), new THREE.Vector2(0, .666)];
		var stone = [new THREE.Vector2(.5, .333), new THREE.Vector2(1, .333), new THREE.Vector2(1, .666), new THREE.Vector2(.5, .666)];
		var water = [new THREE.Vector2(0, 0), new THREE.Vector2(.5, 0), new THREE.Vector2(.5, .333), new THREE.Vector2(0, .333)];
		var wood = [new THREE.Vector2(.5, 0), new THREE.Vector2(1, 0), new THREE.Vector2(1, .333), new THREE.Vector2(.5, .333)];

		geometry.faceVertexUvs[0] = [];

		geometry.faceVertexUvs[0][0] = [ bricks[0], bricks[1], bricks[3] ];
		geometry.faceVertexUvs[0][1] = [ bricks[1], bricks[2], bricks[3] ];
		 
		geometry.faceVertexUvs[0][2] = [ clouds[0], clouds[1], clouds[3] ];
		geometry.faceVertexUvs[0][3] = [ clouds[1], clouds[2], clouds[3] ];
		 
		geometry.faceVertexUvs[0][4] = [ crate[0], crate[1], crate[3] ];
		geometry.faceVertexUvs[0][5] = [ crate[1], crate[2], crate[3] ];
		 
		geometry.faceVertexUvs[0][6] = [ stone[0], stone[1], stone[3] ];
		geometry.faceVertexUvs[0][7] = [ stone[1], stone[2], stone[3] ];
		 
		geometry.faceVertexUvs[0][8] = [ water[0], water[1], water[3] ];
		geometry.faceVertexUvs[0][9] = [ water[1], water[2], water[3] ];
		 
		geometry.faceVertexUvs[0][10] = [ wood[0], wood[1], wood[3] ];
		geometry.faceVertexUvs[0][11] = [ wood[1], wood[2], wood[3] ];

		this.chunk = [];
		var chunkSize = this.chunkSize;
		for (var i = 0; i < chunkSize; i++) {
			this.chunk[i] = [];
			for (var j = 0; j  < chunkSize; j++) {
				this.chunk[i][j] = [];
				for (var k = 0; k < chunkSize; k++) {
					this.chunk[i][j][k] = j === 0 || 	
						j === 1 && ((i < 10 && k < 10) || (i > 15 && k > 15)) ||
						j === 2 && i < 5 && k < 5 ||
						j === 3 && i == 0 && k == 0 ||

						j === 3 && i > 5 && k > 5 ? true : false;
					if (this.chunk[i][j][k]) {
						mesh = new THREE.Mesh(geometry, material);

						mesh.position.x = k;
						mesh.position.y = j;
						mesh.position.z = i;

						mesh.position.set(k, j, i);

						this.scene.add(mesh);
					}
				}
			}
		}

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
		this.renderer = renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setClearColor( 0xffffff, 1);
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
