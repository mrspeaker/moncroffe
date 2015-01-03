function GreedyMesh (volume, dims) {

	function f(i, j, k) {

		return volume[i + dims[0] * (j + dims[1] * k)];

	}

	//Sweep over 3-axes
	var quads = [];

	for (var d = 0; d < 3; ++d) {

		var i, j, k, l,
			width,
			height,
			u = (d + 1) % 3,
			v = (d + 2) % 3,
			x = [0, 0, 0],
			q = [0, 0, 0],
			mask = new Int32Array(dims[u] * dims[v]);

		q[d] = 1;

		for ( x[d] = -1; x[d] < dims[d]; ) {

			//Compute mask
			var n = 0;

			for (x[v] = 0; x[v] < dims[v]; ++x[v]) {

				for (x[u] = 0; x[u] < dims[u]; ++x[u]) {

					mask[n++] =
						(0    <= x[d]      ? f(x[0],      x[1],      x[2])      : false) !=
						(x[d] <  dims[d]-1 ? f(x[0]+q[0], x[1]+q[1], x[2]+q[2]) : false);

				}

			}

			++x[d];

			//Generate mesh for mask using lexicographic ordering
			n = 0;
			for (j = 0; j < dims[v]; ++j) {

				for (i = 0; i < dims[u]; ) {

					if (mask[n]) {

						//Compute width
						for (width = 1; mask[n + width] && i + width < dims[u]; ++width) {}

						//Compute height (this is slightly awkward)
						var done = false;
						for(height = 1; j + height < dims[v]; ++height) {

							for (k = 0; k < width; ++k) {

								if (!mask[n + k + height * dims[u]]) {

									done = true;
									break;

								}
							}

							if (done) {

								break;

							}
						}

						//Add quad
						x[u] = i;  x[v] = j;
						var du = [0,0,0];
						var dv = [0,0,0];
						du[u] = width;
						dv[v] = height;

						quads.push([
						  [x[0],             x[1],             x[2]            ]
						, [x[0]+du[0],       x[1]+du[1],       x[2]+du[2]      ]
						, [x[0]+du[0]+dv[0], x[1]+du[1]+dv[1], x[2]+du[2]+dv[2]]
						, [x[0]      +dv[0], x[1]      +dv[1], x[2]      +dv[2]]
						]);

						//Zero-out mask
						for (l = 0; l < height; ++l) {

							for (k = 0; k < width; ++k) {

								mask[n + k + l * dims[u]] = false;

							}

						}

						i += width;
						n += width;

					} else {

						++i;
						++n;

					}

				}

			}

		}

	}

  	return quads;
}

function makeVoxels(low, high, f) {

	var voxels = [];

	for (var k = low[2]; k < high[2]; ++k) {

		for (var j = low[1]; j < high[1]; ++j) {

			for (var i = low[0]; i < high[0]; ++i) {

				voxels.push(f(i, j, k));

			}

		}

	}

	return {
		voxels: voxels,
		dims: [
			high[0] - low[0],
			high[1] - low[1],
			high[2] - low[2]
		]
	};

}

var testa = {};
for(var i = 1; i <= 16; i <<= 1) {

	testa[i + 'x' + i + 'x' + i] = makeVoxels(
		[0,0,0],
		[i,i,i],
		function() { return true; }
	);

}
