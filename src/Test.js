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

	stop: function () {

		window.clearTimeout(this.timer);

	},

	createChunkGeom: function (x, y, z, chunk, cb) {

		var blockSize = 1,
			useAO = true,
			w = 16,
			h = 20,
			xo = x * w,
			yo = y * h,
			zo = z * w,
			stats = {
				verts: 0,
				faces: 0,
				cubes: 0
			};

		// f, l, bk, r, b, t
		var blocks = {
			grass: [[3, 15], [3, 15], [3, 15], [3, 15], [2, 15], [0, 15]],
			stone: [[1, 15], [1, 15], [1, 15], [1, 15], [1, 15], [1, 15]],
			dirt: [[2, 15], [2, 15], [2, 15], [2, 15], [2, 15], [2, 15]],
			gold: [[4, 15], [4, 15], [4, 15], [4, 15], [4, 15], [4, 15]]
		};

		function getBlock(x, y) {

			return [
				new THREE.Vector2(x / 16, y / 16),
				new THREE.Vector2((x + 1) / 16, y / 16),
				new THREE.Vector2(x / 16, (y + 1) / 16),
				new THREE.Vector2((x + 1) / 16, (y + 1) / 16)
			];

		}

		function getGeometry(block) {

			var geometry = new THREE.CubeGeometry(blockSize);

			var tile = blocks[block.type];

			var front = getBlock(tile[0][0], tile[0][1]),
				left = getBlock(tile[1][0], tile[1][1]),
				back = getBlock(tile[2][0], tile[2][1]),
				right = getBlock(tile[3][0], tile[3][1]),
				bottom = getBlock(tile[4][0], tile[4][1]),
				top = getBlock(tile[5][0], tile[5][1]),
				faceUVs = geometry.faceVertexUvs;

			// Set UV texture coords for the cube
			faceUVs[0] = [];

			faceUVs[0].push([front[0], front[1], front[3]]);
			faceUVs[0].push([front[0], front[3], front[2]]);

			faceUVs[0].push([left[0], left[1], left[3]]);
			faceUVs[0].push([left[0], left[3], left[2]]);

			faceUVs[0].push([back[0], back[1], back[3]]);
			faceUVs[0].push([back[0], back[3], back[2]]);

			faceUVs[0].push([right[0], right[1], right[3]]);
			faceUVs[0].push([right[0], right[3], right[2]]);

			faceUVs[0].push([bottom[0], bottom[1], bottom[3]]);
			faceUVs[0].push([bottom[0], bottom[3], bottom[2]]);

			faceUVs[0].push([top[0], top[1], top[3]]);
			faceUVs[0].push([top[0], top[3], top[2]]);

			return geometry;
		}


		// Create the chunk
		var totalGeom = new THREE.Geometry();

		var mesh = new THREE.Mesh(),
			i, j, k, block, pos, count = 0;

		mesh.matrixAutoUpdate = false;

		var todos = [];

		for (i = 0; i < w; i++) {

			for (j = 0; j < h; j++) {

				for (k = 0; k < w; k++) {

					block = chunk[i][j][k];

					if (block.type !== "air") {

						todos.push([block, k, j, i]);

					}

				}

			}

		}

		var blockMaterial = data.materials.target;

		function mergy (leftTodo) {

			if (!leftTodo.length) {

				cb(new THREE.Mesh(totalGeom, blockMaterial));

				return;

			}

			Test.timer = setTimeout(function () {

				var atATime = Math.min(15, leftTodo.length);

				for (var b = 0; b < atATime; b++) {

					var deets = leftTodo.pop();

					block = deets[0];
					i = deets[1];
					j = deets[2];
					k = deets[3];

					pos = [xo + k, yo + j, zo + i];

					// Make a cube
					mesh.geometry = getGeometry(block);

					// Move up so bottom of cube is at 0, not -0.5
					mesh.position.set(pos[0], pos[1] + blockSize / 2, pos[2]);
					mesh.updateMatrix();

					// Merge it
					totalGeom.merge(mesh.geometry, mesh.matrix);

				}

				mergy(leftTodo);

			}, 0);

		}

		mergy(todos);

	},

	makeGreedyGeom: function (result) {

		var geometry	= new THREE.Geometry();
		geometry.vertices.length = 0;
		geometry.faces.length = 0;
		for(var i=0; i<result.vertices.length; ++i) {

			var q = result.vertices[i];
			geometry.vertices.push(new THREE.Vector3(q[0], q[1], q[2]));

		}
		for(var i=0; i<result.faces.length; ++i) {

			var q = result.faces[i];
			if(q.length === 5) {

		  		var f = new THREE.Face3(q[0], q[1], q[2]);
		  		f.color = new THREE.Color(q[4]);
		  		f.vertexColors = [f.color,f.color,f.color,f.color];
		  		geometry.faces.push(f);

		  		f = new THREE.Face3(q[0], q[2], q[3]);
		  		f.color = new THREE.Color(q[4]);
		  		f.vertexColors = [f.color,f.color,f.color,f.color];
		  		geometry.faces.push(f);

			} else if(q.length == 4) {

		  		var f = new THREE.Face3(q[0], q[1], q[2]);
		  		f.color = new THREE.Color(q[3]);
		  		f.vertexColors = [f.color,f.color,f.color];
		  		geometry.faces.push(f);

			}
		}

		geometry.computeFaceNormals();

		geometry.verticesNeedUpdate = true;
		geometry.elementsNeedUpdate = true;
		geometry.normalsNeedUpdate = true;

		geometry.computeBoundingBox();
		geometry.computeBoundingSphere();

		return geometry;
	}

};
