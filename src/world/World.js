(function (utils, data, noise, THREE) {

  "use strict";

  var World = {

    blocks: ["air", "grass", "stone", "dirt", "gold"],

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
      this.testMaterial = new THREE.MeshPhongMaterial({
        /*color    : 0x4444aa,*/
        /*side: THREE.DoubleSide,*/
        /*ambient: 0xff7f7f,*/
        wireframe:false,
        fog: true,
        vertexColors: THREE.VertexColors,
        shading: THREE.FlatShading
        /*map: data.textures.blocks*/
      });

      var chW = data.chunk.w;
      this.xo = chW / 2;
      this.zo = chW;
      this.maxX = chW * this.radius + (chW / 2);
      this.maxZ = chW * this.radius;

      return this;
    },

    tick: function () { },

    posToChunk: function (pos) {

      var chW = data.chunk.w,
        chunkX = Math.floor(pos.x / chW),
        chunkZ = Math.floor(pos.z / chW),
        x = pos.x - chunkX * chW,
        z = pos.z - chunkZ * chW;

      return {
        chX: chunkX,
        chZ: chunkZ,
        x: x,
        z: z
      }

    },

    createChunks: function (xoff, yoff, zoff) {

      var chunks = core.utils.spiral2D(this.radius)

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
        self.chunkGeom[ch.id] = self.createGreedyChunkGeom(ch.x + xoff, yoff, ch.z + zoff, ch.chunk);
        self.scene.add(self.chunkGeom[ch.id]);

        setTimeout(function () {

          createChunksGeom(chunks.slice(1));

        }, 1);

      }(chunks));

    },

    removeChunks: function () {

      for (var ch in this.chunkGeom) {

        this.scene.remove(this.chunkGeom[ch]);

      }

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
      if (y < 0) {

        y = 0;

      }

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

        return {
          chunkX: 999,
          chunkZ: 999
        };

      }

      chunk = this.chunks[chunkX + ":" + chunkZ];

      if (!chunk) {

        // prolly outside the world
        return {
          chunkX: 999,
          chunkZ: 999
        };

      }

      return {
        chunkX: chunkX,
        chunkZ: chunkZ,
        x: x,
        y: y,
        z: z
      };

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

      // Don't dig ground
      if (!cursor.visible || pos.y === 0) {

        return false;

      }

      var dug = this.chunks[cursor.chunkId][pos.z][pos.y][pos.x];

      if (dug.type !== "air") {

        this.chunks[cursor.chunkId][pos.z][pos.y][pos.x].type = "air";
        this.reMeshChunkAndSurrounds(cursor.chunkX, cursor.chunkZ, pos.x, pos.z);

        return true;

      }

      return false;

    },

    // Todo: move me to Chunk
    createChunk: function (xo, zo) {

      var chW = data.chunk.w,
        chH = data.chunk.h;

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
            var val = noise.simplex3((x + (xo * chW)) / data.world.noise.x, y / data.world.noise.y, (z + (zo* chW)) / data.world.noise.z);
            var val2 = noise.simplex3((x + (xo * chW)) / 20, y / 20, (z + (zo* chW)) / 22);

            if (y === 0) {

              type = val2 < -0.1 ? "stone" : (Math.random() < 0.3 ? "dirt":"grass");

            } else {

              if (y < 16 && val > 0) {

                type = y < 8 && val2 < -0.1 ? "stone" : "grass";

              }

              /*if (val < -0.75) {//} && Math.abs(val) < 0.02) {
                this.screen.waypoints.push([x + (xo * chW), y, z + (zo * chW)]);
              }*/

            }

            // Lil bit of gold
            if (type === "stone" && Math.random() < 0.01) {

              type = "gold";

            }

            chunk[z][y][x] = {
              type: type,
              light: {}
            };
          }
        }
      }

      return chunk;
    },

    createGreedyChunkGeom: function (x, y, z, chunk) {

      var zw = chunk.length,
        yw = chunk[0].length,
        xw = chunk[0][0].length,
        voxels = [],
        dims = [zw, yw, xw];

      var w = data.chunk.w,
        h = data.chunk.h,
        xo = x * w,
        yo = y * h,
        zo = z * w;

      var isBlockAt = this.isBlockAt.bind(this);
      var vertexAO = function (pos, n) {
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

        };

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
      };

      for (var zz = 0; zz < zw; zz++) {

        for (var yy = 0; yy < yw; yy++) {

          for (var xx = 0; xx < xw; xx++) {

            var block = {col: 0};

            //block.surround = this.getSurrounding(xx, yy, zz);
            var pos = [xo + xx, yo + yy, zo + zz];
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

            var type = chunk[zz][yy][xx].type;
            if (type !== "air") type = "stone"
            switch (type) {
              // TODO: not just colors: figure out type and if needs ao.
            case "air":
              //col = 0;
              break;
            case "stone":
              block.col = 0x828DB2;
              break;
            case "grass":
              block.col = 0x54773F;
              break;
            case "dirt":
              block.col = 0x3C404F;
              break;
            default:
              block.col = 0x6B7291;
            }

            if (type !== "air" && block.vertLight.every(f => f === 1)) {

              //const s = block.surround;
              //if (s.left && s.right && s.front && s.back && s.top && s.bottom) {
                //console.log("hideen");
              //}
              //if (block.surround.left) block.col = 0xf11111;
              block.col |= 0x0000ff;
              /*if (block.surround.right) block.col += 0x006000;
              if (block.surround.front) block.col += 0x600000;
              if (block.surround.back) block.col += 0x606000;
              if (block.surround.top) block.col += 0x000606;
              if (block.surround.bottom) block.col += 0x60060f;*/
            }

            voxels.push(block.col);
          }
        }
      }

      var meshed = GreedyMesh(voxels, dims);
      var greedyGeom = Test.makeGreedyGeom(meshed);
      var totalMesh = new THREE.Mesh(greedyGeom, this.testMaterial);
      totalMesh.matrixAutoUpdate = false; // needed? why?

      totalMesh.position.set(
        x * xw - 0.5,
        y * yw,
        z * zw - 0.5
      );
      totalMesh.updateMatrix();


      return totalMesh;

    },

    // TODO: refactor this with a "createQuad" function,
    // so it can be fed to a greedy mesher.
    createChunkGeom: function (x, y, z, chunk) {

      var blockSize = data.block.size,
        useAO = this.screen.useAO,
        w = data.chunk.w,
        h = data.chunk.h,
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

      function getGeometry(block, tileOffsetForFun) {

        var surround = block.surround,
          geometry = new THREE.CubeGeometry(blockSize, surround);

        stats.cubes++;
        stats.verts += geometry.vertices.length;
        stats.faces += geometry.faces.length;


        var tile = blocks[block.type];

        // Swap grass pattern sometimes
        if (block.type === "grass") {

          tile[5][1] = [15, 15, 14, 14, 13, 13, 12][tileOffsetForFun % 7];

        }

        // Swap stone pattern sometimes
        if (block.type === "stone") {

          tile[0][1] = [15, 14, 13][tileOffsetForFun % 3];
          tile[1][1] = [15, 14, 13][tileOffsetForFun % 3];
          tile[2][1] = [15, 14, 13][tileOffsetForFun % 3];
          tile[3][1] = [15, 14, 13][tileOffsetForFun % 3];
          tile[4][1] = [15, 14, 13][tileOffsetForFun % 3];
          tile[5][1] = [15, 14, 13][tileOffsetForFun % 3];

        }

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

        };

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
      };

      var mesh = new THREE.Mesh(),
        i, j, k, block, pos, count = 0;

      mesh.matrixAutoUpdate = false;

      for (i = 0; i < w; i++) {

        for (j = 0; j < h; j++) {

          for (k = 0; k < w; k++) {

            block = chunk[i][j][k];

            if (block.type !== "air") {

              pos = [xo + k, yo + j, zo + i];

              // For face culling
              block.surround = this.getSurrounding(pos[0], pos[1], pos[2]);

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
              mesh.geometry = getGeometry(block, Math.abs((xo + k) ^ (zo + i) + j));

              // Move up so bottom of cube is at 0, not -0.5
              mesh.position.set(pos[0], pos[1] + blockSize / 2, pos[2]);
              mesh.updateMatrix();

              // Merge it
              totalGeom.merge(mesh.geometry, mesh.matrix);

            }

          }

        }

      }

      //utils.msg("Cubes:" + stats.cubes, " F:" + stats.faces, " V:" + stats.verts);
      var totalMesh = new THREE.Mesh(totalGeom, this.blockMaterial);
      totalMesh.matrixAutoUpdate = false; // needed? why?

      return totalMesh;

    },

    reMeshChunk: function (x, z) {

      var chId = x + ":" + z;

      if (!this.chunks[chId]) {

        return;

      }

      var scene = this.scene;
      //start = screen.clock.getElapsedTime()

      scene.remove(this.chunkGeom[chId]);
      this.chunkGeom[chId] = this.createGreedyChunkGeom(x, 0, z, this.chunks[chId]);
      scene.add(this.chunkGeom[chId]);

      //end = screen.clock.getElapsedTime();
      //utils.msgln("Remesh Chunk[" + chId + "]:", ((end - start) * 1000 | 0) + "ms");

    }


  };

  window.World = World;

}(
  window.utils,
  window.data,
  window.noise,
  window.THREE
));
