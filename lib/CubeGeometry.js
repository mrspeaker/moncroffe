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

	}

	square(size);

	this.mergeVertices();

};

THREE.CubeGeometry.prototype = Object.create( THREE.Geometry.prototype );
