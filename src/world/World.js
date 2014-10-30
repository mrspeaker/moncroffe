(function () {

	"use strict";

	var World = {

		chunkWidth: 16,
		chunkHeight: 20,
		blockSize: 1,
		blocks: ["air", "grass", "stone", "dirt", "tree", "wood", "sand", "cobble", "gold", "snow"],

		init: function (screen) {
			this.chunks = {};
			this.chunkGeom = {};
			this.screen = screen;
			return this;
		},

		tick: function (dt) {

		},

		createChunks: function () {

			var addChunk = (function (x, z) {
				var id = x + ":" + z;
				this.chunks[id] = this.createChunk();
				this.chunkGeom[id] = this.createChunkGeom(x, z, this.chunks[id]);
			}).bind(this);

			addChunk(0, 0);
			addChunk(0, 1);
			addChunk(1, 0);
			addChunk(1, 1);
			addChunk(1, -1);
			addChunk(2, -1);

			addChunk(-1, 0);
			addChunk(0, -1);
			addChunk(2, 0);
			addChunk(1, 2);

			return this.chunkGeom;

		},

		setBlockAt: function (x, y, z, type) {
			var chunkX = Math.floor(x / this.chunkWidth),
				chunkZ = Math.floor(z / this.chunkWidth),
				chunk;

			x -= chunkX * this.chunkWidth;
			z -= chunkZ * this.chunkWidth;

			x = Math.round(x);
			z = Math.round(z);
			y = Math.round(y);
			if (y < 0) y = 0;

			chunk = this.chunks[chunkX + ":" + chunkZ];

			if (chunk) {
				chunk[z][y][x].type = type;
			}

			return chunkX + ":" + chunkZ;
		},

		getBlockAt: function (x, y, z) {


			var chunkX = Math.floor(x / this.chunkWidth),
				chunkZ = Math.floor(z / this.chunkWidth),
				chunk;

			x -= chunkX * this.chunkWidth;
			z -= chunkZ * this.chunkWidth;

			if (y > this.chunkHeight - 1) {
				return false;
			}

			chunk = this.chunks[chunkX + ":" + chunkZ];

			if (!chunk) {
				return false;
			}

			return chunk[z][y][x].type !== "air";

		},


		createChunk: function () {

			// Create the chunk
			var chunk = [];
			for (var z = 0; z < this.chunkWidth; z++) {
				chunk[z] = [];
				for (var y = 0; y < this.chunkHeight; y++) {
					chunk[z][y] = [];
					for (var x = 0; x < this.chunkWidth; x++) {
						var type = "air";
						if (y === 0) {
							// Ground
							type = ["grass", "dirt"][Math.random() * 2 | 0];
						} else if (
							// Grass Sphere
							Math.sqrt(x * x + y * y + (z * 5)) < 10 && Math.sqrt(x * x + y * y + (z *5)) > 7) {
							type =  "grass";
						} else if (y === 4 && z > 9 && x > 8) {
							// Platform
							type = ["tree", "stone"][Math.random() * 2 | 0];
						} else if (Math.random() < 0.01) {
							// Random block or air
							type = this.blocks[(Math.random() * this.blocks.length - 1 | 0) + 1];
						}

						chunk[z][y][x] = {
							type: type,
							light: {}
						}
					}
				}
			}

			return chunk;
		},

		createChunkGeom: function (x, z, chunk) {
			var geoms = {},
				blockSize = this.blockSize;

			function getGeometry(block) {

				var geometry = geoms[block.type];

				if (!geometry) {

					geometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);

					// F, B, T, B, L, R
					var blocks = {
							grass: [[3, 15], [3, 15], [0, 15], [2, 15], [3, 15], [3, 15]],
							stone: [[1, 15], [1, 15], [1, 15], [1, 15], [1, 15], [1, 15]],
							dirt: [[2, 15], [2, 15], [2, 15], [2, 15], [2, 15], [2, 15]],
							tree: [[4, 14], [4, 14], [5, 14], [5, 14], [4, 14], [4, 14]],
							wood: [[4, 15], [4, 15], [4, 15], [4, 15], [4, 15], [4, 15]],
							sand: [[2, 14], [2, 14], [2, 14], [2, 14], [2, 14], [2, 14]],
							cobble: [[0, 14], [0, 14], [0, 14], [0, 14], [0, 14], [0, 14]],
							gold: [[0, 13], [0, 13], [0, 13], [0, 13], [0, 13], [0, 13]],
							snow: [[4, 11], [4, 11], [2, 11], [2, 15], [4, 11], [4, 11]],
							ice: [[3, 11], [3, 11], [3, 11], [3, 11], [3, 11], [3, 11]]
						},
						tile = blocks[block.type];

					function getBlock(x, y) {
						return [
							new THREE.Vector2(x / 16, y / 16),
							new THREE.Vector2((x + 1) / 16, y / 16),
							new THREE.Vector2((x + 1) / 16, (y + 1) / 16),
							new THREE.Vector2(x / 16, (y + 1) / 16)
						];
					}

					var front = getBlock(tile[0][0], tile[0][1]),
						back = getBlock(tile[1][0], tile[1][1]),
						top = getBlock(tile[2][0], tile[2][1]),
						bottom = getBlock(tile[3][0], tile[3][1]),
						right = getBlock(tile[4][0], tile[4][1]),
						left = getBlock(tile[5][0], tile[5][1]),
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

					geoms[block.type] = geometry;

				}

				var faceIndices = [ 'a', 'b', 'c', 'd' ],
					v = block.light;

				// Clear old colors (if cached box)
				for (var i = 0; i < geometry.faces.length; i++) {
					geometry.faces[i].vertexColors = [];
				}

				var cv = block.vertLight;

				var shadow = new THREE.Color(cv[0], cv[0], cv[0]),
					light = new THREE.Color(cv[1], cv[1], cv[1]),
					red = new THREE.Color(cv[2], cv[2], cv[2]),
					bl = new THREE.Color(cv[3], cv[3], cv[3]),
					pnk = new THREE.Color(cv[4], cv[4], cv[4]),
					gry = new THREE.Color(cv[5], cv[5], cv[5]),
					org = new THREE.Color(cv[6], cv[6], cv[6]),
					bl2 = new THREE.Color(cv[7], cv[7], cv[7]);

				function setCol (face, p1, p2, p3) {
					face = geometry.faces[face];
					face.vertexColors[0] = p1 ? light : shadow;
					face.vertexColors[1] = p2 ? light : shadow;
					face.vertexColors[2] = p3 ? light : shadow;
				}

				/*if (v.x && v.z) {
					setCol(4, false, false, false);
					setCol(5, false, true, false);
				}
				else if (v.x) {
					setCol(4, false, false, true);
					setCol(5, false, true, true);
				}
				else if (v.z) {
					setCol(4, false, true, false);
					setCol(5, true, true, false);
				} else  if (v.xz) {
					setCol(4, false, true, true);
					setCol(5, true, true, true);
				}*/
				var v = [light, shadow, red, bl, pnk, gry, org, bl2];

				// left
				geometry.faces[0].vertexColors = [v[0], v[3], v[2]];
				geometry.faces[1].vertexColors = [v[3], v[5], v[2]];

				// right
				geometry.faces[2].vertexColors = [v[4], v[6], v[1]];
				geometry.faces[3].vertexColors = [v[6], v[7], v[1]];

				// top
				geometry.faces[4].vertexColors = [v[4], v[1], v[2]];
				geometry.faces[5].vertexColors = [v[1], v[0], v[2]];

				// bottom
				geometry.faces[6].vertexColors = [v[7], v[6], v[3]];
				geometry.faces[7].vertexColors = [v[6], v[5], v[3]];

				// front
				geometry.faces[8].vertexColors = [v[1], v[7], v[0]];
				geometry.faces[9].vertexColors = [v[7], v[3], v[0]];

				// back
				geometry.faces[10].vertexColors = [v[2], v[7], v[4]];
				geometry.faces[11].vertexColors = [v[7], v[6], v[4]];

				return geometry;
			}


			// Create the chunk
			var totalGeom = new THREE.Geometry(),
				w = this.chunkWidth,
				h = this.chunkHeight,
				xo = x * w,
				zo = z * w;

			for (var i = 0; i < w; i++) {
				for (var j = 0; j  < h; j++) {
					for (var k = 0; k < w; k++) {
						var block = chunk[i][j][k];
						if (block.type !== "air") {
							block.light = {
								x: this.getBlockAt(xo + k - 1, j + 1, zo + i),
								z: this.getBlockAt(xo + k, j + 1, zo + i - 1),
								xz: this.getBlockAt(xo + k - 1, j + 1, zo + i - 1)
							}
							block.vertLight = [0.4, 0.4, 1, 1, 1, 1, 1, 1];

							var geometry = getGeometry(block),
								mesh = new THREE.Mesh(geometry, blockMaterial);

							// Move up so bottom of cube is at 0, not -0.5
							mesh.position.set(k + (x * this.chunkWidth), j + blockSize / 2, i + (z * this.chunkWidth));
							mesh.updateMatrix();

							totalGeom.merge(mesh.geometry, mesh.matrix);
						}
					}
				}
			}

			var blockMaterial = new THREE.MeshLambertMaterial({
				map: this.screen.textures.blocks,
				wrapAround: true,
				vertexColors: THREE.VertexColors
			});

			return new THREE.Mesh(totalGeom, blockMaterial);
		}

	};

	window.World = World;

}());
