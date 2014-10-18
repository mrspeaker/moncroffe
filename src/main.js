var main = {

	chunkSize: 20,

	init: function () {

		this.initThree();
		this.player = new Player(this.camera, this).init();

		var ambientLight = new THREE.AmbientLight(0x333333);
		this.scene.add(ambientLight);

		var light = new THREE.PointLight( 0xffffcc, 1, 100 ); 
		light.position.set(10, 20, 10); 
		this.scene.add(light);

		/*
		var directionalLight = new THREE.DirectionalLight(0x000044);
		directionalLight.position.set(20, 10, 20).normalize();
		this.scene.add(directionalLight);
		*/

		var geometry = new THREE.BoxGeometry(0.99, 0.99, 0.99);
		var material = new THREE.MeshLambertMaterial( { color: 0xffffff	 } );

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
						j === 3 && i == 0 && k == 0 ? true : false;
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

	initThree: function () {

		var scene, camera, renderer;

		this.scene = scene = new THREE.Scene();

		this.camera = camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 500);
		this.renderer = renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(window.innerWidth, window.innerHeight);

		document.querySelector("#board").appendChild(renderer.domElement);

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
			xr,
			ytop, 
			ybot, 
			zl,
			zr;

		xl = p.x | 0;
		xr = p.x + bb.w | 0;
		ytop = p.y + bb.h | 0;
		ybot = p.y | 0;
		zl = p.z | 0;
		zr = p.z + bb.d | 0;

		document.querySelector("#watch").innerHTML = xl + ":" + zl + ":" + ytop + " / " + ybot;	 	

		return {
			inside: this.chunk[zl][ytop][xl] ? [xl, ytop, zl] : false,
			below: this.chunk[zl][ybot][xl] ? [xl, ybot, zl] : false
		}
	},

	render: function () {
		this.renderer.render(this.scene, this.camera);
	}
};
