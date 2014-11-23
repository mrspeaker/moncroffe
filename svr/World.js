// var Three = require("../lib/three.min.js");
var Perlin = require("../lib/Perlin.js"),
	data = require("../src/data.js");

var World = {
	seed: 42,
	startTime: 0,
	elapsed: 0,

	clients: [],
	players: [],
	targets: [],
	bullets: [],

	flash: false,

	bouy: null,

	init: function () {

		data.init();
		this.data = data;

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

		var xo = data.world.midX,
			zo = data.world.midZ,
			maxX = data.world.maxX,
			maxZ = data.world.maxZ;

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

		if (!this.bouy && Math.random () < 0.01) {
			console.log("added bouy");
			this.bouy = this.getSafePos();
		}
	},

	getSafePos: function () {

		var xo = data.world.midX,
			zo = data.world.midZ,
			maxX = data.world.maxX,
			maxZ = data.world.maxZ,
			safe = false;

		while (!safe) {

			var pos = { x: Math.floor(xo + (Math.random() * (maxX * 0.97) * 2) - (maxX * 0.97)),
				y: Math.floor(Math.random() * 18 | 0) + 1,
				z: Math.floor(zo + (Math.random() * (maxZ * 0.97) * 2) - (maxZ * 0.97))
			}

			var val = Perlin.noise.simplex3(pos.x / 15, pos.y / 10, pos.z / 15);

			if (val < 0.01) {
				safe = true;
			}

		}

		return pos;
	},

	gotBouy: function (id) {
		this.flash = true;
		this.bouy = null;
	}
};

module.exports = World;

