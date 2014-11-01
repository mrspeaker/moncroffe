THREE.CubeGeometry = function ( size ) {

	THREE.Geometry.call( this );

	this.type = 'CubeGeometry';

	this.parameters = {
		size: size
	};

	this.size = size || 1;

	var scope = this;

	var size_half = size / 2;

	function square (size) {
		var g = scope,
			h = size / 2;

		g.vertices.push(new THREE.Vector3(-h, -h, h));
		g.vertices.push(new THREE.Vector3(h, -h, h));
		g.vertices.push(new THREE.Vector3(-h, h, h));
		g.vertices.push(new THREE.Vector3(h, h, h));

		g.vertices.push(new THREE.Vector3(-h, -h, -h));
		g.vertices.push(new THREE.Vector3(h, -h, -h));
		g.vertices.push(new THREE.Vector3(-h, h, -h));
		g.vertices.push(new THREE.Vector3(h, h, -h));

	  	var uvs = [];
		uvs.push( new THREE.Vector2( 0, 0 ) );
		uvs.push( new THREE.Vector2( 1, 0 ) );
		uvs.push( new THREE.Vector2( 0, 1 ) );
		uvs.push( new THREE.Vector2( 1, 1 ) );

		// front
	  	var normal = new THREE.Vector3(0, 0, 1),
			face = new THREE.Face3(0, 1, 3);
		face.normal.copy(normal);
		face.vertexNormals.push(normal.clone(), normal.clone(), normal.clone());
		g.faces.push(face);
		g.faceVertexUvs[0].push([uvs[0], uvs[2], uvs[3]]);

		face = new THREE.Face3(0, 3, 2);
		face.normal.copy(normal);
		face.vertexNormals.push(normal.clone(), normal.clone(), normal.clone());
		g.faces.push(face);
		g.faceVertexUvs[0].push([uvs[0], uvs[3], uvs[2]]);


		// left
		normal = new THREE.Vector3(1, 0, 0);
		face = new THREE.Face3(1, 5, 7);
		face.normal.copy(normal);
		face.vertexNormals.push(normal.clone(), normal.clone(), normal.clone());
		g.faces.push(face);
		g.faceVertexUvs[0].push([uvs[0], uvs[2], uvs[3]]);

		face = new THREE.Face3(1, 7, 3);
		face.normal.copy(normal);
		face.vertexNormals.push(normal.clone(), normal.clone(), normal.clone());
		g.faces.push(face);
		g.faceVertexUvs[0].push([uvs[0], uvs[3], uvs[2]]);

		// back
		normal = new THREE.Vector3(0, 0, -1);
		face = new THREE.Face3(5, 4, 6);
		face.normal.copy(normal);
		face.vertexNormals.push(normal.clone(), normal.clone(), normal.clone());
		g.faces.push(face);
		g.faceVertexUvs[0].push([uvs[0], uvs[2], uvs[3]]);

		face = new THREE.Face3(5, 6, 7);
		face.normal.copy(normal);
		face.vertexNormals.push(normal.clone(), normal.clone(), normal.clone());
		g.faces.push(face);
		g.faceVertexUvs[0].push([uvs[0], uvs[3], uvs[2]]);

		// right
		normal = new THREE.Vector3(-1, 0, 0);
		face = new THREE.Face3(4, 0, 2);
		face.normal.copy(normal);
		face.vertexNormals.push(normal.clone(), normal.clone(), normal.clone());
		g.faces.push(face);
		g.faceVertexUvs[0].push([uvs[0], uvs[2], uvs[3]]);

		face = new THREE.Face3(4, 2, 6);
		face.normal.copy(normal);
		face.vertexNormals.push(normal.clone(), normal.clone(), normal.clone());
		g.faces.push(face);
		g.faceVertexUvs[0].push([uvs[0], uvs[3], uvs[2]]);

		// bottom
		normal = new THREE.Vector3(0, -1, 0);
		face = new THREE.Face3(4, 5, 1);
		face.normal.copy(normal);
		face.vertexNormals.push(normal.clone(), normal.clone(), normal.clone());
		g.faces.push(face);
		g.faceVertexUvs[0].push([uvs[0], uvs[2], uvs[3]]);

		face = new THREE.Face3(4, 1, 0);
		face.normal.copy(normal);
		face.vertexNormals.push(normal.clone(), normal.clone(), normal.clone());
		g.faces.push(face);
		g.faceVertexUvs[0].push([uvs[0], uvs[3], uvs[2]]);

		// top
		normal = new THREE.Vector3(0, 1, 0);
		face = new THREE.Face3(2, 3, 7);
		face.normal.copy(normal);
		face.vertexNormals.push(normal.clone(), normal.clone(), normal.clone());
		g.faces.push(face);
		g.faceVertexUvs[0].push([uvs[0], uvs[2], uvs[3]]);

		face = new THREE.Face3(2, 7, 6);
		face.normal.copy(normal);
		face.vertexNormals.push(normal.clone(), normal.clone(), normal.clone());
		g.faces.push(face);
		g.faceVertexUvs[0].push([uvs[0], uvs[3], uvs[2]]);



	  //return g;
	}

	square(size);


	//buildPlane( 'z', 'y', - 1, - 1, size, size_half, 0 ); // px
	//buildPlane( 'z', 'y',   1, - 1, size, - size_half, 1 ); // nx
	//buildPlane( 'x', 'z',   1,   1, size, size_half, 2 ); // py
	//buildPlane( 'x', 'z',   1, - 1, size, - size_half, 3 ); // ny
	//buildPlane( 'x', 'y',   1, - 1, size, size_half, 4 ); // pz
	//buildPlane( 'x', 'y', - 1, - 1, size, - size_half, 5 ); // nz

	function buildPlane( u, v, udir, vdir, size, depth, materialIndex ) {


		var w, ix, iy,
		gridX = scope.widthSegments,
		gridY = scope.heightSegments,
		width_half = width / 2,
		height_half = height / 2,
		offset = scope.vertices.length;

		if ( ( u === 'x' && v === 'y' ) || ( u === 'y' && v === 'x' ) ) {

			w = 'z';

		} else if ( ( u === 'x' && v === 'z' ) || ( u === 'z' && v === 'x' ) ) {

			w = 'y';
			gridY = scope.depthSegments;

		} else if ( ( u === 'z' && v === 'y' ) || ( u === 'y' && v === 'z' ) ) {

			w = 'x';
			gridX = scope.depthSegments;

		}


		// Add vertices

		var gridX1 = gridX + 1,
		gridY1 = gridY + 1,
		segment_width = width / gridX,
		segment_height = height / gridY,
		normal = new THREE.Vector3();

		normal[ w ] = depth > 0 ? 1 : - 1;

		for ( iy = 0; iy < gridY1; iy ++ ) {

			for ( ix = 0; ix < gridX1; ix ++ ) {

				var vector = new THREE.Vector3();
				vector[ u ] = ( ix * segment_width - width_half ) * udir;
				vector[ v ] = ( iy * segment_height - height_half ) * vdir;
				vector[ w ] = depth;

				scope.vertices.push( vector );

			}

		}


		// Add faces
		// Add faceVertexUvs
		add

		for ( iy = 0; iy < gridY; iy ++ ) {

			for ( ix = 0; ix < gridX; ix ++ ) {

				var a = ix + gridX1 * iy;
				var b = ix + gridX1 * ( iy + 1 );
				var c = ( ix + 1 ) + gridX1 * ( iy + 1 );
				var d = ( ix + 1 ) + gridX1 * iy;

				var uva = new THREE.Vector2( ix / gridX, 1 - iy / gridY );
				var uvb = new THREE.Vector2( ix / gridX, 1 - ( iy + 1 ) / gridY );
				var uvc = new THREE.Vector2( ( ix + 1 ) / gridX, 1 - ( iy + 1 ) / gridY );
				var uvd = new THREE.Vector2( ( ix + 1 ) / gridX, 1 - iy / gridY );

				var face = new THREE.Face3( a + offset, b + offset, d + offset );
				face.normal.copy( normal );
				face.vertexNormals.push( normal.clone(), normal.clone(), normal.clone() );
				face.materialIndex = materialIndex;

				scope.faces.push( face );
				scope.faceVertexUvs[ 0 ].push( [ uva, uvb, uvd ] );

				face = new THREE.Face3( b + offset, c + offset, d + offset );
				face.normal.copy( normal );
				face.vertexNormals.push( normal.clone(), normal.clone(), normal.clone() );
				face.materialIndex = materialIndex;

				scope.faces.push( face );
				scope.faceVertexUvs[ 0 ].push( [ uvb.clone(), uvc, uvd.clone() ] );

			}

		}

	}

	this.mergeVertices();

};

THREE.CubeGeometry.prototype = Object.create( THREE.Geometry.prototype );
