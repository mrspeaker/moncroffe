(function () {

	"use strict";

	var World = {

		blocks: ["air", "grass", "stone", "dirt", "tree", "wood", "sand", "cobble", "gold", "snow"],

		seed: utils.urlParams.seed || (Math.random() * 99999999 | 0),
		radius: 2,

		elapsed: 0,

		init: function (screen, seed) {

			window.noise.seed(seed || this.seed);

			this.chunks = {};
			this.chunkGeom = {};
			this.screen = screen;
			this.scene = screen.scene;

			this.blockMaterial = data.materials.blocks;

			var chW = data.chunk.w;
			this.xo = chW / 2;
			this.zo = chW;
			this.maxX = chW * this.radius + (chW / 2);
			this.maxZ = chW * this.radius;

			return this;
		},

		tick: function (dt) { },

		createChunks: function () {

			var chunks = utils.spiral2D(this.radius)

				// Create the chunk data
				.map(function (ch) {
					var x = ch[0],
						z = ch[1],
						id = x + ":" + z,
						chunk;

					chunk = this.chunks[id] = this.createChunk(x, z);
					return { id: id, x: x, z: z, chunk: chunk };
				}, this);

			// Todo: promise-ify (or at least callback-ify!)
			var self = this;
			(function createChunksGeom(chunks) {
				if (!chunks.length) return;

				var ch = chunks[0];
				self.chunkGeom[ch.id] = self.createChunkGeom(ch.x, ch.z, ch.chunk);
				self.scene.add(self.chunkGeom[ch.id]);

				setTimeout(function () {
					createChunksGeom(chunks.slice(1));
				}, 20);
			}(chunks));

		},

		setBlockAt: function (x, y, z, type) {

			var chW = data.chunk.w,
				chunkX = Math.floor(x / chW),
				chunkZ = Math.floor(z / chW),
				chunk;

			x -= chunkX * chW;
			z -= chunkZ * chW;

			x = Math.floor(x);
			z = Math.floor(z);
			y = Math.round(y);
			if (y < 0) y = 0;

			chunk = this.chunks[chunkX + ":" + chunkZ];
			if (chunk) {
				chunk[z][y][x].type = type;
			}

			return { x: chunkX, z:chunkZ };

		},

		setBlockAtPos: function (pos, type) {

			return this.setBlockAt(Math.round(pos.x), Math.round(pos.y), Math.round(pos.z), type);

		},

		isBlockAt: function (x, y, z) {

			return this.getBlockAt(x, y, z).type !== "air";

		},

		getBlockAtPos: function (pos) {

			return this.getBlockAt(Math.round(pos.x), Math.round(pos.y), Math.round(pos.z));

		},

		getBlockAt: function (x, y, z) {

			var chW = data.chunk.w,
				chH = data.chunk.h,
				chunkX = Math.floor(x / chW),
				chunkZ = Math.floor(z / chW),
				chunk;

			x -= chunkX * chW;
			z -= chunkZ * chW;

			if (y > chH - 1 || y < 0) {
				return { type: "air" };
			}

			chunk = this.chunks[chunkX + ":" + chunkZ];

			if (!chunk) {
				return { type: "air" };
			}

			return chunk[z][y][x];

		},

		getBlockChunkAndPosAt: function (x, y, z) {

			// TODO: really round? I don't even know anymore...
			x = Math.round(x);
			y = Math.round(y); // Not sure if y should be rounded...
			z = Math.round(z);

			var chW = data.chunk.w,
				chH = data.chunk.h,
				chunkX = Math.floor(x / chW),
				chunkZ = Math.floor(z / chW),
				chunk;

			x -= chunkX * chW;
			z -= chunkZ * chW;

			if (y > chH - 1 || y < 0) {
				console.log("wat?", y);
				return {
					chunkX: 999,
					chunkZ: 999
				};
			}

			chunk = this.chunks[chunkX + ":" + chunkZ];

			if (!chunk) {
				console.log("wit?", chunkX, chunkZ, x, y, z)
				return null;
			}

			return {
				chunkX: chunkX,
				chunkZ: chunkZ,
				x: x,
				y: y,
				z: z
			}

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

		reMeshChunkAndSurrounds: function (chX, chZ, x, z) {
			var chW = data.chunk.w,
				rechunks = [[chX, chZ]];

			// Check if surrounding chunks need re-meshing
			if (z === 0) {
				rechunks.push([chX, chZ - 1]);
			}
			if (z === chW - 1) {
				rechunks.push([chX, chZ + 1]);
			}
			if (x === 0) {
				rechunks.push([chX - 1, chZ]);
			}
			if (x === chW - 1) {
				rechunks.push([chX + 1, chZ]);
			}

			rechunks.forEach(function (ch) {
				this.reMeshChunk(ch[0], ch[1]);
			}, this);
		},

		addBlockAtCursor: function (cursor, blockId, playerBlocks) {

			if (!cursor.visible) {
				return false;
			}
			var face = cursor.face,
				pos = cursor.pos;

			// Allow for pos + face == could change chunks
			// (eg, if you attach to a face in an ajacent chunk)
			var chunkX = cursor.chunkX,
				chunkZ = cursor.chunkZ,
				chW = data.chunk.w;

			if (pos.z + face.z >= chW) {
				chunkZ++;
				pos.z -= chW;
			}
			if (pos.z + face.z < 0) {
				chunkZ--;
				pos.z += chW;
			}
			if (pos.x + face.x >= chW) {
				chunkX++;
				pos.x -= chW;
			}
			if (pos.x + face.x < 0) {
				chunkX--;
				pos.x += chW;
			}

			var chunk = this.chunks[chunkX + ":" + chunkZ];
			if (!chunk) {
				return false;
			}

			// Check if player is in this block
			if (playerBlocks.some(function (pb) {
				var cAp = this.getBlockChunkAndPosAt(pb[0], pb[1], pb[2]);

				if (chunkX !== cAp.chunkX || chunkZ !== cAp.chunkZ) {
					return false;
				}
				if (cAp.x === pos.x + face.x && cAp.y == pos.y + face.y && cAp.z == pos.z + face.z) {
					return true;
				}
				return false;
			}, this)) {
				return false;
			}

			chunk[pos.z + face.z][pos.y + face.y][pos.x + face.x].type = this.blocks[blockId];

			this.reMeshChunkAndSurrounds(chunkX, chunkZ, pos.x, pos.z);

			return true;
		},

		removeBlockAtCursor: function (cursor) {

			var pos = cursor.pos;

			if (!cursor.visible) {
				return;
			}

			this.chunks[cursor.chunkId][pos.z][pos.y][pos.x].type = "air";

			this.reMeshChunkAndSurrounds(cursor.chunkX, cursor.chunkZ, pos.x, pos.z);
		},

		// Todo: move me to Chunk
		createChunk: function (xo, zo) {

			var chW = data.chunk.w,
				chH = data.chunk.h,
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

						// Arena chunk...
						//var val = noise.simplex3((x / 10) + (xo * chW), y / 10 , (z / 10) + (zo * chW));
						//var val2 = noise.simplex3((x / 20) + (xo * chW), y / 20 , (z / 20) + (zo * chW));

						// Blob chunk
						var val = noise.simplex3((x + (xo * chW)) / 15, y / 10, (z + (zo* chW)) / 15);
						var val2 = noise.simplex3((x + (xo * chW)) / 20, y / 20, (z + (zo* chW)) / 22);

						//if (xo == 0 && zo == 0) { console.log(val)}

						if (y == 0) {
							type = val2 < -0.1 ? "stone" : (Math.random() < 0.3 ? "dirt":"grass");
						} else {
							if (y < 16 && val > 0) {
								type = y < 8 && val2 < -0.1 ? "stone" : "grass";
							}
						}

						// Lil bit of gold
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

		// TODO: refactor this with a "createQuad" function,
		// so it can be fed to a greedy mesher.
		createChunkGeom: function (x, z, chunk) {
			var blockSize = data.block.size,
				useAO = this.screen.useAO,
				w = data.chunk.w,
				h = data.chunk.h,
				xo = x * w,
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
				tree: [[4, 14], [4, 14], [4, 14], [4, 14], [5, 14], [5, 14]],
				wood: [[4, 15], [4, 15], [4, 15], [4, 15], [4, 15], [4, 15]],
				sand: [[2, 14], [2, 14], [2, 14], [2, 14], [2, 14], [2, 14]],
				cobble: [[0, 14], [0, 14], [0, 14], [0, 14], [0, 14], [0, 14]],
				gold: [[0, 13], [0, 13], [0, 13], [0, 13], [0, 13], [0, 13]],
				snow: [[4, 11], [4, 11], [4, 11], [4, 11], [2, 15], [2, 11]],
				ice: [[3, 11], [3, 11], [3, 11], [3, 11], [3, 11], [3, 11]]
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

				var surround = block.surround,
					geometry = new THREE.CubeGeometry(blockSize, surround);

				stats.cubes++;
				stats.verts += geometry.vertices.length;
				stats.faces += geometry.faces.length;


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

				// Do Ambient occlusion calcs
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
						],
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

			// For AO calcs
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

			var mesh = new THREE.Mesh(),
				i, j, k, block, pos;
			mesh.matrixAutoUpdate = false;
			for (i = 0; i < w; i++) {
				for (j = 0; j  < h; j++) {
					for (k = 0; k < w; k++) {
						block = chunk[i][j][k];
						if (block.type !== "air") {

							pos = [xo + k, j, zo + i];

							// For face culling
							block.surround = this.getSurrounding(pos[0], j, pos[2]);

							// For AO calcs
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

							// Make a cube
							mesh.geometry = getGeometry(block);

							// Move up so bottom of cube is at 0, not -0.5
							mesh.position.set(pos[0], j + blockSize / 2, pos[2]);
							mesh.updateMatrix();

							// Merge it
							totalGeom.merge(mesh.geometry, mesh.matrix);
						}
					}
				}
			}

			utils.msg("Cubes:" + stats.cubes, " F:" + stats.faces, " V:" + stats.verts);

			var totalMesh = new THREE.Mesh(totalGeom, this.blockMaterial);
			totalMesh.matrixAutoUpdate = false;
			return totalMesh;
		},

		reMeshChunk: function (x, z) {

			var chId = x + ":" + z;

			if (!this.chunks[chId]) {
				return;
			}

			var screen = this.screen.screen,
				scene = this.scene,
				start = screen.clock.getElapsedTime(),
				end;

			scene.remove(this.chunkGeom[chId]);
			this.chunkGeom[chId] = this.createChunkGeom(x, z, this.chunks[chId]);
			scene.add(this.chunkGeom[chId]);

			var end = screen.clock.getElapsedTime();

			//utils.msgln("Remesh Chunk[" + chId + "]:", ((end - start) * 1000 | 0) + "ms");

		}


	};

	window.World = World;

}());
