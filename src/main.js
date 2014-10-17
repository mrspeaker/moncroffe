var main = {

	chunkSize: 20,

	init: function () {

		
		this.initThree();
		this.player = new Player(this.camera, this).init();

		var ambientLight = new THREE.AmbientLight(0x333);
      	this.scene.add(ambientLight);

      	var light = new THREE.PointLight( 0xffffff, 1, 100 ); 
      	light.position.set(0, 10, 0); 
      	this.scene.add(light);

		var directionalLight = new THREE.DirectionalLight(0xffffff);
      //directionalLight.position.set(1, 10, 1).normalize();
      //this.scene.add(directionalLight);

		var geometry = new THREE.BoxGeometry( 0.99, 0.99, 0.99 );
        var material = new THREE.MeshLambertMaterial( { color: 0x88ff88	 } );

       	this.chunk = [];
       	var chunkSize = this.chunkSize;
       	for (var i = 0; i < chunkSize; i++) {
       		this.chunk[i] = [];
       		for (var j = 0; j  < chunkSize; j++) {
       			this.chunk[i][j] = [];
       			for (var k = 0; k < chunkSize; k++) {
       				this.chunk[i][j][k] = j === 0 || 	
       					j === 1 && i < 10  && k < 10 ||
       					j === 2 && i < 5 && k < 5 ? true : false;
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
        this.renderer = renderer = new THREE.WebGLRenderer( { antialias: true } );
        renderer.setSize(window.innerWidth, window.innerHeight);

        document.body.appendChild(renderer.domElement);

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

		var p = e.obj.position,
			bb = e.bb,
			x, y, z;

		x = p.x | 0;
		y = p.y - bb.h | 0;
		z = p.z | 0;

		return {
			below: this.chunk[z][y][x] ? [x, y, z] : false
		}
	},

	render: function () {
		this.renderer.render( this.scene, this.camera );
	}
};
