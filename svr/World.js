// var Three = require("../lib/three.min.js");

var World = {
	seed: 42,
	startTime: 0,
	elapsed: 0,

	clients: [],
	players: [],
	targets: [],
	bullets: [],

	reset: function () {
		this.startTime = Date.now();
		this.elapsed = 0;
		this.seed = Math.random() * 99999999 | 0;
		console.log("Reset:", this.seed);
	},

	tick: function () {

		// Add a target.
		if (Math.random() < 0.01) {
			var xo = 8,
				zo = 8,
				maxX = 20,
				maxZ = 20;

			this.targets.push({
				id: Math.random() * 99999999 | 0,
				pos: {
					x: xo + (Math.random() * (maxX * 2) - maxX),
					y: (Math.random() * 13 | 0) + 0.75,
					z: zo + (Math.random() * (maxZ * 2) - maxZ)
				},
				rot: {
					x: Math.random() - 0.5,
					y: 0,
					z: Math.random() - 0.5
				},
				speed: (Math.random() * 4) + 1
			});
		}
	}
};

module.exports = World;

