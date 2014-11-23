// var Three = require("../lib/three.min.js");
var Perlin = require("../lib/Perlin.js");

var World = {
	seed: 42,
	startTime: 0,
	elapsed: 0,

	clients: [],
	players: [],
	targets: [],
	bullets: [],

	flash: false,

	chW: 16,
	chH: 20,
	radius: 2,
	maxX: null,
	maxZ: null,
	xo: null,
	zo: null,

	bouy: null,

	init: function () {

		this.xo = this.chW / 2;
		this.zo = this.chW;
		this.maxX = this.chW * this.radius + (this.chW / 2);
		this.maxZ = this.chW * this.radius;

	},

	reset: function () {
		this.startTime = Date.now();
		this.elapsed = 0;
		this.seed = Math.random() * 99999999 | 0;
		Perlin.noise.seed(this.seed);

		this.bouy = null;
		console.log("Reset:", this.seed);
	},

	tick: function () {

		var xo = this.xo,
			zo = this.zo,
			maxX = this.maxX,
			maxZ = this.maxZ;

		// Add a target.
		if (Math.random() < 0.01) {

			this.targets.push({
				id: Math.random() * 99999999 | 0,
				pos: {
					x: xo + (Math.random() * (maxX * 0.3) * 2) - (maxX * 0.3),
					y: (Math.random() * 13 | 0) + 0.75,
					z: zo + (Math.random() * (maxZ * 0.3) * 2) - (maxZ * 0.3)
				},
				rot: {
					x: Math.random() - 0.5,
					y: 0,
					z: Math.random() - 0.5
				},
				speed: (Math.random() * 4) + 1
			});
		}

		if (!this.bouy) {
			this.bouy = this.getSafePos();
			console.log(this.bouy)
		}
	},

	getSafePos: function () {

		var xo = this.xo,
			zo = this.zo,
			maxX = this.maxX,
			maxZ = this.maxZ,
			safe = false;

		while (!safe) {

			var pos = { x: Math.floor(xo + (Math.random() * (maxX * 0.9) * 2) - (maxX * 0.9)),
				y: Math.floor(Math.random() * 17 | 0) + 1,
				z: Math.floor(zo + (Math.random() * (maxZ * 0.9) * 2) - (maxZ * 0.9))
			}

			/*var chunkX = Math.floor(pos.x / this.chW),
				chunkZ = Math.floor(pos.z / this.chW);

			pos.x -= (chunkX * this.chW);
			pos.z -= (chunkZ * this.chW);*/

			var val = Perlin.noise.simplex3(pos.x / 15, pos.y / 10, pos.z / 15);

			if (val < 0.01) {
				safe = true;
			}

		}

		return pos;
	},

	gotBouy: function (id) {
		this.flash = true;
		this.bouy = this.getSafePos();
	}
};

module.exports = World;

