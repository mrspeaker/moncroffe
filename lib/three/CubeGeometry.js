/*

	My roll-you-own cubes...
	doesn't render faces if they are surrounded by other cubes

*/

THREE.CubeGeometry = function ( size, surround ) {

	THREE.Geometry.call( this );

	if (!surround) {
		surround = {
			front: false,
			right: false,
			back: false,
			left: false,
			top: false,
			bottom: false
		}
	}

	this.type = 'CubeGeometry';

	this.parameters = {
		size: size
	};

	this.size = size || 1;

	var scope = this;

	var h = size / 2,
		vi = 0;

	this.vertices = [];
	this.vertices[vi++] = new THREE.Vector3(-h, -h, h);
	this.vertices[vi++] = new THREE.Vector3(h, -h, h);
	this.vertices[vi++] = new THREE.Vector3(-h, h, h);
	this.vertices[vi++] = new THREE.Vector3(h, h, h);

	this.vertices[vi++] = new THREE.Vector3(-h, -h, -h);
	this.vertices[vi++] = new THREE.Vector3(h, -h, -h);
	this.vertices[vi++] = new THREE.Vector3(-h, h, -h);
	this.vertices[vi++] = new THREE.Vector3(h, h, -h);

  	var uvs = [],
  		face,
  		normal;
  	vi = 0;
	uvs[vi++] = THREE.Vector2( 0, 0 );
	uvs[vi++] = THREE.Vector2( 1, 0 );
	uvs[vi++] = THREE.Vector2( 0, 1 );
	uvs[vi++] = THREE.Vector2( 1, 1 );

	// front
	if (!surround.front) {

	  	normal = new THREE.Vector3(0, 0, 1),
		face = new THREE.Face3(0, 1, 3);
		face.normal.copy(normal);
		face.vertexNormals.push(normal, normal, normal);
		this.faces.push(face);
		face.normal = new THREE.Vector3(0, 0, 1)
		this.faceVertexUvs[0].push([uvs[0], uvs[2], uvs[3]]);

		face = new THREE.Face3(0, 3, 2);
		face.normal.copy(normal);
		face.vertexNormals.push(normal, normal, normal);
		this.faces.push(face);
		this.faceVertexUvs[0].push([uvs[0], uvs[3], uvs[2]]);

	}

	// left
	if (!surround.left) {

		normal = new THREE.Vector3(1, 0, 0);
		face = new THREE.Face3(1, 5, 7);
		face.normal.copy(normal);
		face.vertexNormals.push(normal, normal, normal);
		this.faces.push(face);
		this.faceVertexUvs[0].push([uvs[0], uvs[2], uvs[3]]);

		face = new THREE.Face3(1, 7, 3);
		face.normal.copy(normal);
		face.vertexNormals.push(normal, normal, normal);
		this.faces.push(face);
		this.faceVertexUvs[0].push([uvs[0], uvs[3], uvs[2]]);

	}

	// back
	if (!surround.back) {

		normal = new THREE.Vector3(0, 0, -1);
		face = new THREE.Face3(5, 4, 6);
		face.normal.copy(normal);
		face.vertexNormals.push(normal, normal, normal);
		this.faces.push(face);
		this.faceVertexUvs[0].push([uvs[0], uvs[2], uvs[3]]);

		face = new THREE.Face3(5, 6, 7);
		face.normal.copy(normal);
		face.vertexNormals.push(normal, normal, normal);
		this.faces.push(face);
		this.faceVertexUvs[0].push([uvs[0], uvs[3], uvs[2]]);

	}

	// right
	if (!surround.right) {

		normal = new THREE.Vector3(-1, 0, 0);
		face = new THREE.Face3(4, 0, 2);
		face.normal.copy(normal);
		face.vertexNormals.push(normal, normal, normal);
		this.faces.push(face);
		this.faceVertexUvs[0].push([uvs[0], uvs[2], uvs[3]]);

		face = new THREE.Face3(4, 2, 6);
		face.normal.copy(normal);
		face.vertexNormals.push(normal, normal, normal);
		this.faces.push(face);
		this.faceVertexUvs[0].push([uvs[0], uvs[3], uvs[2]]);

	}

	// bottom
	if (!surround.bottom) {

		normal = new THREE.Vector3(0, -1, 0);
		face = new THREE.Face3(4, 5, 1);
		face.normal.copy(normal);
		face.vertexNormals.push(normal, normal, normal);
		this.faces.push(face);
		this.faceVertexUvs[0].push([uvs[0], uvs[2], uvs[3]]);

		face = new THREE.Face3(4, 1, 0);
		face.normal.copy(normal);
		face.vertexNormals.push(normal, normal, normal);
		this.faces.push(face);
		this.faceVertexUvs[0].push([uvs[0], uvs[3], uvs[2]]);

	}

	// top
	if (!surround.top) {

		normal = new THREE.Vector3(0, 1, 0);
		face = new THREE.Face3(2, 3, 7);
		face.normal.copy(normal);
		face.vertexNormals.push(normal, normal, normal);
		this.faces.push(face);
		this.faceVertexUvs[0].push([uvs[0], uvs[2], uvs[3]]);

		face = new THREE.Face3(2, 7, 6);
		face.normal.copy(normal);
		face.vertexNormals.push(normal, normal, normal);
		this.faces.push(face);
		this.faceVertexUvs[0].push([uvs[0], uvs[3], uvs[2]]);

	}

};

THREE.CubeGeometry.prototype = Object.create( THREE.Geometry.prototype );
