// The MIT License (MIT)
//
// Copyright (c) 2012-2013 Mikola Lysenko
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.


// Trying to de-l337 this algo.

var GreedyMesh = (function() {

	//Cache buffer internally
	var mask = new Int32Array(4096);

  	return function (volume, dims) {

		function getVoxel(i, j, k) {

			return volume[i + dims[0] * (j + dims[1] * k)];

		}

		//Sweep over 3-axes
		var vertices = [],
			faces = [];

		var dX = 0,
			dY = 1,
			dZ = 2;

		[dX, dY, dZ].forEach(function (dim) {

		  	var i, j, k, l,
		  		width,
		  		height,
				u = (dim + 1) % 3, // y -> x -> z
				v = (dim + 2) % 3, // z -> x -> y
				x = [0, 0, 0],
				quad = [0, 0, 0];

			// err, wat?
		  	if (mask.length < dims[u] * dims[v]) {

				mask = new Int32Array(dims[u] * dims[v]);

		  	}

	  		quad[dim] = 1;

	  		for (x[dim] = -1; x[dim] < dims[dim]; ) {

	  			//Compute mask
				var voxelIdx = 0;

				for (x[v] = 0; x[v] < dims[v]; x[v]++) {

					for (x[u] = 0; x[u] < dims[u]; x[u]++, voxelIdx++) {

						var a = (0 <= x[dim] ? getVoxel(x[0], x[1], x[2]) : 0),
							b = (x[dim] < dims[dim] - 1 ? getVoxel(x[0] + quad[0], x[1] + quad[1], x[2] + quad[2]) : 0);

						if ((!!a) === (!!b)) {

							// Air cube
							mask[voxelIdx] = false;

						} else if (!!a) {

							mask[voxelIdx] = a;

						} else {

							// Derpy trick to fork paths in meshing algo
							// -ve to swap quads
							mask[voxelIdx] = -b;

						}
					}
				}

				x[dim]++;

				//Generate mesh for mask using lexicographic ordering
				voxelIdx = 0;
				for (j = 0; j < dims[v]; j++) {

					for (i = 0; i < dims[u]; ) {

		  				var color = mask[voxelIdx];

		  				// If not air block...
		  				if (!!color) {

							// Compute width of continuous same blocks
							width = 1;
							while (color === mask[voxelIdx + width] && i + width < dims[u]) {

								width++;

							}

							// Compute height of continuous same blocks
							var done = false;
							for (height = 1; j + height < dims[v]; height++) {

			  					for (k = 0; k < width; k++) {

									if (color !== mask[voxelIdx + k + height * dims[u]]) {

				  						done = true;
				  						break;

									}

			  					}

			  					if (done) {

									break;

			  					}

							}

							//Add quad
							x[u] = i;
							x[v] = j;

							var du = [0,0,0],
			  					dv = [0,0,0];

			  				// Derpy trick to fork paths from masking algo
							if (color > 0) {

			  					dv[v] = height;
			  					du[u] = width;

							} else {

								// Undo derp trick
			  					color = -color;
			  					du[v] = height;
			  					dv[u] = width;
							}

							var vertex_count = vertices.length;
							vertices.push([x[0],             x[1],             x[2]            ]);
							vertices.push([x[0]+du[0],       x[1]+du[1],       x[2]+du[2]      ]);
							vertices.push([x[0]+du[0]+dv[0], x[1]+du[1]+dv[1], x[2]+du[2]+dv[2]]);
							vertices.push([x[0]      +dv[0], x[1]      +dv[1], x[2]      +dv[2]]);
							faces.push([vertex_count, vertex_count + 1, vertex_count + 2, vertex_count + 3, color]);

							//Zero-out mask
							for (l = 0; l < height; l++) {

								for (k = 0; k < width; k++) {

			  						mask[voxelIdx + k + l * dims[u]] = 0;

								}

							}

							i += width;
							voxelIdx += width;

		  				} else {

		  					// Air block - just skip to next one
							i++;
							voxelIdx++;

		  				}

					}

				}

	  		}


		});


		return { vertices:vertices, faces:faces };

  	}

})();


GreedyMesh.TestData = (function createTestData() {

	var result = {};

	function makeVoxels(l, h, f) {

		var d = [ h[0]-l[0], h[1]-l[1], h[2]-l[2] ],
			v = [];

		for(var k=l[2]; k<h[2]; ++k)
		for(var j=l[1]; j<h[1]; ++j)
		for(var i=l[0]; i<h[0]; ++i) {
		  v.push(f(i,j,k));
		}
		return {voxels:v, dims:d};

	}

  	var colorTab = [
		0xff0000,
		0x00ff00,
		0x0000ff,
		0xff00ff,
		0xffff00,
		0x00ffff,
		0x000001,
		0xffffff
	];

	for (var i=1,c=0; i<=16; i<<=1,++c) {

		result[i + 'x' + i + 'x' + i] = makeVoxels([0,0,0], [i,i,i], function() { return colorTab[c]; });
	}

  	result['Sphere'] = makeVoxels([-16,-16,-16], [16,16,16], function(i,j,k) {

		return i*i+j*j+k*k <= 16*16 ? 0x113344 : 0;

  	});

  	result['Noise'] = makeVoxels([0,0,0], [16,16,16], function(i,j,k) {

		return Math.random() < 0.1 ? Math.random() * 0xffffff : 0;
  	});

  	result['16 Color Noise'] = makeVoxels([0,0,0], [16,16,16], function(i,j,k) {

		return Math.random() < 0.1 ? colorTab[Math.floor(Math.random() * colorTab.length)] : 0;
  	});

  	result['Hilly Terrain'] = makeVoxels([0, 0, 0], [32,32,32], function(i,j,k) {

		var h0 = 3.0 * Math.sin(Math.PI * i / 12.0 - Math.PI * k * 0.1) + 27;

		if(j > h0+1) {
	  		return 0;
		}
		if(h0 <= j) {
	  		return 0x23dd31;
		}

		var h1 = 2.0 * Math.sin(Math.PI * i * 0.25 - Math.PI * k * 0.3) + 20;
		if(h1 <= j) {
	  		return 0x964B00;
		}
		if(2 < j) {
	  		return Math.random() < 0.1 ? 0x222222 : 0xaaaaaa;
		}

		return 0xff0000;

  	});

  	return result;

}());
