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

			var w = 0, wdir = 1,
				h = 0, hdir = 1,
				x = 0,
				y = 0,
				path = [],
				radius = 1;

			// Spiral pattern
			while (radius--) {
				w++;
				h++;

				// Moving left/up
				for (;x < w * wdir; x += wdir) {
					path.push([x, y]);
				}

				for (;y < h * hdir; y += hdir) {
					path.push([x, y]);
				}

				wdir = wdir * -1;
				hdir = hdir * -1;

				// Moving right/down
				for (;x > w * wdir; x += wdir) {
					path.push([x, y]);
				}

				for (;y > h * hdir; y += hdir) {
					path.push([x, y]);
				}

				wdir = wdir * -1;
				hdir = hdir * -1;

			};

			var chunks = path
				// Create the chunks
				.map(function (ch) {
					var x = ch[0],
						z = ch[1],
						id = x + ":" + z,
						chunk;

					chunk = this.chunks[id] = this.createChunk(x, z);
					return {id: id, x: x, z: z, chunk: chunk};
				}, this);

			// Todo: promise-ify (or at least callback-ify!)
			var self = this;

			function doChunkGeom(chunks) {
				if (chunks.length) {
					var ch = chunks[0];
					self.chunkGeom[ch.id] = self.createChunkGeom(ch.x, ch.z, ch.chunk);
					self.screen.scene.add(self.chunkGeom[ch.id]);

					setTimeout(function () {
						doChunkGeom(chunks.slice(1));
					}, 50);
				}
			}

			doChunkGeom(chunks);

		},

		setBlockAt: function (x, y, z, type) {
			var chunkX = Math.floor(x / this.chunkWidth),
				chunkZ = Math.floor(z / this.chunkWidth),
				chunk;

			x -= chunkX * this.chunkWidth;
			z -= chunkZ * this.chunkWidth;

			x = Math.floor(x);
			z = Math.floor(z);
			y = Math.round(y);
			if (y < 0) y = 0;

			chunk = this.chunks[chunkX + ":" + chunkZ];
			if (chunk) {
				chunk[z][y][x].type = type;
			}

			return chunkX + ":" + chunkZ;
		},

		isBlockAt: function (x, y, z) {
			return this.getBlockAt(x, y, z).type !== "air";
		},

		getBlockAt: function (x, y, z) {

			var chunkX = Math.floor(x / this.chunkWidth),
				chunkZ = Math.floor(z / this.chunkWidth),
				chunk;

			x -= chunkX * this.chunkWidth;
			z -= chunkZ * this.chunkWidth;

			if (y > this.chunkHeight - 1 || y < 0) {
				return { type: "air" };
			}

			chunk = this.chunks[chunkX + ":" + chunkZ];

			if (!chunk) {
				return { type: "air" };
			}

			return chunk[z][y][x];//.type !== "air";

		},

		getSurrounding: function (x, y, z) {

			return {
				"front": this.isBlockAt(x, y, z + 1),
				"left": this.isBlockAt(x + 1, y, z),
				"back": this.isBlockAt(x, y, z - 1),
				"right": this.isBlockAt(x - 1, y, z),
				"bottom": this.isBlockAt(x, y - 1, z),
				"top": this.isBlockAt(x, y + 1, z)
			};

		},

		createChunk: function (xo, zo) {

			var chW = this.chunkWidth,
				chH = this.chunkHeight,
				st = Math.random() < 0.3,
				maxSphere = (Math.random() * 3 | 0) + 9,
				minSphere = maxSphere - 2;

			// Create the chunk
			var chunk = [];
			for (var z = 0; z < chW; z++) {
				chunk[z] = [];
				for (var y = 0; y < chH; y++) {
					chunk[z][y] = [];
					for (var x = 0; x < chW; x++) {
						var type = "air";
						/*if (y === 0) {
							// Ground
							type = ["grass", "dirt"][Math.random() * 2 | 0];
						} else if (y === 1 && Math.random() < 0.02) {
							// Random block or air
							type = this.blocks[(Math.random() * this.blocks.length - 1 | 0) + 1];
						} else if (
							// Grass Sphere
							Math.sqrt(x * x + y * y + (z * 5)) < maxSphere && Math.sqrt(x * x + y * y + (z *5)) > minSphere) {
							type = st && y < 4? "stone" : "grass";
						} else if (y === 4 && z > 9 && x > 8) {
							// Platform
							type = ["tree", "stone"][Math.random() * 2 | 0];
						}*/
						// Arena chunk...
						var val = noise.simplex3((x / 10) + (xo * chW), y / 10 , (z / 10) + (zo * chW));
						var val2 = noise.simplex3((x / 20) + (xo * chW), y / 20 , (z / 20) + (zo * chW));
						//val += 1;
						if (y == 0) {
							type = val2 < -0.1 ? "stone" : (Math.random() < 0.3 ? "dirt":"grass");
						} else {
							if (y < 16 && val > 0) {
								type = y < 8 && val2 < -0.1 ? "stone" : "grass";
							}
						}
						if (type === "stone") {
							if (Math.random() < 0.01) {
								type = "gold";
							}
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
				blockSize = this.blockSize,
				useAO = this.screen.useAO;

			function getGeometry(block) {

				function getBlock(x, y) {
					return [
						new THREE.Vector2(x / 16, y / 16),
						new THREE.Vector2((x + 1) / 16, y / 16),
						new THREE.Vector2(x / 16, (y + 1) / 16),
						new THREE.Vector2((x + 1) / 16, (y + 1) / 16)
					];
				}

				var geometry = null,// geoms[block.type];
					surround = block.surround;

				if (!geometry) {

					geometry = new THREE.CubeGeometry(blockSize, surround);


					// f, l, bk, r, b, t
					var blocks = {
							grass: [[3, 15], [3, 15], [3, 15], [3, 15], [2, 15], [0, 15]],
							stone: [[1, 15], [1, 15], [1, 15], [1, 15], [1, 15], [1, 15]],
							dirt: [[2, 15], [2, 15], [2, 15], [2, 15], [2, 15], [2, 15]],
							tree: [[4, 14], [4, 14], [4, 14], [4, 14], [5, 14], [5, 14]],
							wood: [[4, 15], [4, 15], [4, 15], [4, 15], [4, 15], [4, 15]],
							sand: [[2, 14], [2, 14], [2, 14], [2, 14], [2, 14], [2, 14]],
							cobble: [[0, 14], [0, 14], [0, 14], [0, 14], [0, 14], [0, 14]],
							gold: [[0, 13], [0, 13], [0, 13], [0, 13], [0, 13], [0, 13]],
							snow: [[4, 11], [4, 11], [4, 11], [4, 11], [2, 15], [2, 11]],
							ice: [[3, 11], [3, 11], [3, 11], [3, 11], [3, 11], [3, 11]]
						},
						tile = blocks[block.type];

					var front = getBlock(tile[0][0], tile[0][1]),
						left = getBlock(tile[1][0], tile[1][1]),
						back = getBlock(tile[2][0], tile[2][1]),
						right = getBlock(tile[3][0], tile[3][1]),
						bottom = getBlock(tile[4][0], tile[4][1]),
						top = getBlock(tile[5][0], tile[5][1]),
						faceUVs = geometry.faceVertexUvs;

					faceUVs[0] = [];
					if (!surround.front) {
						faceUVs[0].push([front[0], front[1], front[3]]);
						faceUVs[0].push([front[0], front[3], front[2]]);
					}
					if (!surround.left) {
						faceUVs[0].push([left[0], left[1], left[3]]);
						faceUVs[0].push([left[0], left[3], left[2]]);
					}
					if (!surround.back) {
						faceUVs[0].push([back[0], back[1], back[3]]);
						faceUVs[0].push([back[0], back[3], back[2]]);
					}
					if (!surround.right) {
						faceUVs[0].push([right[0], right[1], right[3]]);
						faceUVs[0].push([right[0], right[3], right[2]]);
					}
					if (!surround.bottom) {
						faceUVs[0].push([bottom[0], bottom[1], bottom[3]]);
						faceUVs[0].push([bottom[0], bottom[3], bottom[2]]);
					}
					if (!surround.top) {
						faceUVs[0].push([top[0], top[1], top[3]]);
						faceUVs[0].push([top[0], top[3], top[2]]);
					}

					geoms[block.type] = geometry;

				}

				var faceIndices = [ 'a', 'b', 'c', 'd' ];

				// Clear old colors (if cached box)
				for (var i = 0; i < geometry.faces.length; i++) {
					geometry.faces[i].vertexColors = [];
				}

				if (useAO) {

					var cv = block.vertLight,
						v = [
							new THREE.Color(cv[0], cv[0], cv[0]),
							new THREE.Color(cv[1], cv[1], cv[1]),
							new THREE.Color(cv[2], cv[2], cv[2]),
							new THREE.Color(cv[3], cv[3], cv[3]),
							new THREE.Color(cv[4], cv[4], cv[4]),
							new THREE.Color(cv[5], cv[5], cv[5]),
							new THREE.Color(cv[6], cv[6], cv[6]),
							new THREE.Color(cv[7], cv[7], cv[7])
						];
					var col = new THREE.Color(0xFF0000),
						faceIdx = 0;

					// front
					if (!surround.front) {
						geometry.faces[faceIdx++].vertexColors = [v[0], v[1], v[3]];
						geometry.faces[faceIdx++].vertexColors = [v[0], v[3], v[2]];
					}

					// left
					if (!surround.left) {
						geometry.faces[faceIdx++].vertexColors = [v[1], v[5], v[7]];
						geometry.faces[faceIdx++].vertexColors = [v[1], v[7], v[3]];
					}

					// back
					if (!surround.back) {
						geometry.faces[faceIdx++].vertexColors = [v[5], v[4], v[6]];
						geometry.faces[faceIdx++].vertexColors = [v[5], v[6], v[7]];
					}

					// right
					if (!surround.right) {
						geometry.faces[faceIdx++].vertexColors = [v[4], v[0], v[2]];
						geometry.faces[faceIdx++].vertexColors = [v[4], v[2], v[6]];
					}

					// bottom
					if (!surround.bottom) {
						geometry.faces[faceIdx++].vertexColors = [v[4], v[5], v[1]];
						geometry.faces[faceIdx++].vertexColors = [v[4], v[1], v[0]];
					}

					// top
					if (!surround.top) {
						geometry.faces[faceIdx++].vertexColors = [v[2], v[3], v[7]];
						geometry.faces[faceIdx++].vertexColors = [v[2], v[7], v[6]];
					}

				}

				return geometry;
			}


			// Create the chunk
			var totalGeom = new THREE.Geometry(),
				w = this.chunkWidth,
				h = this.chunkHeight,
				xo = x * w,
				zo = z * w,
				isBlockAt = this.isBlockAt.bind(this),
				vertexAO = function (pos, n) {
					var corner = isBlockAt(pos[0] + n[0][0], pos[1] + n[0][1], pos[2] + n[0][2]),
						side1 = isBlockAt(pos[0] + n[1][0], pos[1] + n[1][1], pos[2] + n[1][2]),
						side2 = isBlockAt(pos[0] + n[2][0], pos[1] + n[2][1], pos[2] + n[2][2]),
						val = 0;

					if (side1 && side2) {
  						val = 0;
  					} else {
  						val = (3 - (side1 + side2 + corner)) / 3;
  					}
					return (val * 0.5) + 0.5;

				}

			var neigbours = {
				"0, 0, 1": [[-1, -1, 1], [-1, -1, 0], [0, -1, 1]],
				"1, 0, 1": [[1, -1, 1], [1, -1, 0], [0, -1, 1]],
				"0, 1, 1": [[-1, 1, 1], [-1, 1, 0], [0, 1, 1]],
				"1, 1, 1": [[1, 1, 1], [1, 1, 0], [0, 1, 1]],

				"0, 0, 0": [[-1, -1, -1], [-1, -1, 0], [0, -1, -1]],
				"1, 0, 0": [[1, -1, -1], [0, -1, -1], [1, -1, 0]],
				"0, 1, 0": [[-1, 1, -1], [-1, 1, 0], [0, 1, -1]],
				"1, 1, 0": [[1, 1, -1], [0, 1, -1], [1, 1, 0]]
			}

			for (var i = 0; i < w; i++) {
				for (var j = 0; j  < h; j++) {
					for (var k = 0; k < w; k++) {
						var block = chunk[i][j][k];
						if (block.type !== "air") {

							var pos = [xo + k, j, zo + i];

							block.surround = this.getSurrounding(xo + k, j, zo + i);

							block.vertLight = [
								vertexAO(pos, neigbours["0, 0, 1"]),
								vertexAO(pos, neigbours["1, 0, 1"]),
								vertexAO(pos, neigbours["0, 1, 1"]),
								vertexAO(pos, neigbours["1, 1, 1"]),

								vertexAO(pos, neigbours["0, 0, 0"]),
								vertexAO(pos, neigbours["1, 0, 0"]),
								vertexAO(pos, neigbours["0, 1, 0"]),
								vertexAO(pos, neigbours["1, 1, 0"])
							];

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
				vertexColors: THREE.VertexColors,
				wireframe: false
			});

			return new THREE.Mesh(totalGeom, blockMaterial);
		}

	};

	window.World = World;

}());
