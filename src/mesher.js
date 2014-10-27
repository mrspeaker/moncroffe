importScripts('../lib/three.min.js');


onmessage = function (e) {
	var d = e.data;
	var res = createChunkGeom(d.x, d.z, d.chunkDetails);
	postMessage({
		x: d.x,
		z: d.z,
		chunkGeom: res.geom
	});
}

var createChunkGeom = function (x, z, chunkDetails) {
    var geoms = [],
    	blockSize = this.blockSize,
    	chunk = chunkDetails.chunk,
    	chunkWidth = chunkDetails.chunkWidth,
    	chunkHeight = chunkDetails.chunkHeight,
    	blocks = chunkDetails.blocks

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
    			wood: [[4, 15], [4, 15], [4, 15], [4, 15], [4, 15], [4, 15]],
    			sand: [[2, 14], [2, 14], [2, 14], [2, 14], [2, 14], [2, 14]],
    			cobble: [[0, 14], [0, 14], [0, 14], [0, 14], [0, 14], [0, 14]],
    			gold: [[0, 13], [0, 13], [0, 13], [0, 13], [0, 13], [0, 13]],
    			snow: [[2, 11], [2, 11], [2, 11], [2, 11], [2, 11], [2, 11]],
    			ice: [[3, 11], [3, 11], [3, 11], [3, 11], [3, 11], [3, 11]]
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
	var totalGeom = new THREE.Geometry();

	for (var i = 0; i < chunkWidth; i++) {
		for (var j = 0; j  < chunkHeight; j++) {
			for (var k = 0; k < chunkWidth; k++) {
				if (chunk[i][j][k]) {
					var geometry = getGeometry(chunk[i][j][k]),
						mesh = new THREE.Mesh(geometry);//, blockMaterial);

					// Move up so bottom of cube is at 0, not -0.5
					mesh.position.set(k + (x * chunkWidth), j + blockSize / 2, i + (z * chunkWidth));
					mesh.updateMatrix();

					totalGeom.merge(mesh.geometry, mesh.matrix);

				}
			}
		}
	}

	//  var blockMaterial = new THREE.MeshLambertMaterial({ 
	// 	map: blocks,
	// 	wrapAround: true
	// });

	// var mesh = new THREE.Mesh(totalGeom, blockMaterial);
	return {geom: totalGeom};
};
