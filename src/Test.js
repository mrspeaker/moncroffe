var Test = {

	timer: null,

	run: function (scene) {

		var self = this;

		window.noise.seed((Math.random() * 20000) | 0);

		var chunks = [
			[ 2, 0, -3],
			[ 1, 0, -3],
			[ 0, 0, -3],
			[-1, 0, -3],
			[-2, 0, -3],

			[ 2, -1, -3],
			[ 1, -1, -3],
			[ 0, -1, -3],
			[-1, -1, -3],
			[-2, -1, -3],
		];


		function renderChunk (chunks) {

			var c = chunks.pop();

			var chunk = World.createChunk(c[0], c[2]);
			self.createChunkGeom(c[0], c[1], c[2], chunk, function (mesh) {

				scene.add(mesh);

				if (chunks.length) {

					renderChunk(chunks);

				}

			});

		}
		renderChunk(chunks)


	},

	makeGreedyGeom: function (result) {

		var geometry = new THREE.Geometry(),
			quad,
			face,
			i;

		geometry.vertices.length = 0;
		geometry.faces.length = 0;

		//geometry.faceVertexUvs[0] = [];

		var uvs = [],
  		  	vi = 0;
		uvs[vi++] = THREE.Vector2( 0, 0 );
		uvs[vi++] = THREE.Vector2( 1, 0 );
		uvs[vi++] = THREE.Vector2( 0, 1 );
		uvs[vi++] = THREE.Vector2( 1, 1 );

		for (i = 0; i < result.vertices.length; i++) {

			quad = result.vertices[i];
			geometry.vertices.push(new THREE.Vector3(quad[0], quad[1], quad[2]));

		}

		for(i = 0; i < result.faces.length; i++) {

			quad = result.faces[i];

			var col = new THREE.Color(quad[4]);
			// var normal = new THREE.Vector3(0, 1, 0);

	  		face = new THREE.Face3(quad[0], quad[1], quad[2]);
	  		//face.color = new THREE.Color(quad[4]);
	  		face.vertexColors = [col, col, col];
	  		//geometry.faceVertexUvs[0].push([uvs[0], uvs[2], uvs[3]]);
	  		//geometry.faceVertexUvs[0].push([
	  		//	uvs[0], uvs[2], uvs[3]
	  		//	THREE.Vector2( 0, 0 )
	  		//]);
	  		geometry.faces.push(face);


	  		face = new THREE.Face3(quad[0], quad[2], quad[3]);
	  		//face.color = new THREE.Color(quad[4]);
	  		//col.clone().lerp(new THREE.Color(0x000000), 0.5)
	  		face.vertexColors = [col, col, col];//.clone().lerp(new THREE.Color(0x000000), 0.5)];

	  		//geometry.faceVertexUvs[0].push([uvs[0], uvs[3], uvs[2]]);
	  		geometry.faces.push(face);

		}

		geometry.computeFaceNormals();

		geometry.verticesNeedUpdate = true;
		geometry.elementsNeedUpdate = true;
		geometry.normalsNeedUpdate = true;

//		geometry.buffersNeedUpdate = true;
//		geometry.uvsNeedUpdate = true;

		geometry.computeBoundingBox();
		geometry.computeBoundingSphere();

		// this.assignUVs(geometry);

		geometry.uvsNeedUpdate = true;

		return geometry;

	},

	assignUVs: function( geometry ){

	    var max = geometry.boundingBox.max;
	    var min = geometry.boundingBox.min;

	    var offset = new THREE.Vector2(0 - min.x, 0 - min.y);
	    var range = new THREE.Vector2(max.x - min.x, max.y - min.y);

	    geometry.faceVertexUvs[0] = [];
	    var faces = geometry.faces;

	    for (i = 0; i < geometry.faces.length ; i++) {

	      var v1 = geometry.vertices[faces[i].a];
	      var v2 = geometry.vertices[faces[i].b];
	      var v3 = geometry.vertices[faces[i].c];

	      geometry.faceVertexUvs[0].push([
	        new THREE.Vector2( ( v1.x + offset.x ) / range.x , ( v1.y + offset.y ) / range.y ),
	        new THREE.Vector2( ( v2.x + offset.x ) / range.x , ( v2.y + offset.y ) / range.y ),
	        new THREE.Vector2( ( v3.x + offset.x ) / range.x , ( v3.y + offset.y ) / range.y )
	      ]);

	    }

	},

	assignUVs2: function (geometry) {

	    geometry.faceVertexUvs[0] = [];

	    geometry.faces.forEach(function(face) {

	        var components = ['x', 'y', 'z'].sort(function(a, b) {
	            return Math.abs(face.normal[a]) > Math.abs(face.normal[b]);
	        });

	        var v1 = geometry.vertices[face.a];
	        var v2 = geometry.vertices[face.b];
	        var v3 = geometry.vertices[face.c];

	        geometry.faceVertexUvs[0].push([
	            new THREE.Vector2(v1[components[0]], v1[components[1]]),
	            new THREE.Vector2(v2[components[0]], v2[components[1]]),
	            new THREE.Vector2(v3[components[0]], v3[components[1]])
	        ]);

	    });

	    geometry.uvsNeedUpdate = true;
	}

};
