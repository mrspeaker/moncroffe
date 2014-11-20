var World = {
	seed: 42,
	startTime: 0,
	elapsed: 0,
	clients: [],
	players: [],
	bullets: [],
	reset: function () {
		this.startTime = Date.now();
		this.elapsed = 0;
		this.seed = Math.random() * 99999999 | 0;
		console.log("Reset:", this.seed);
	},
	tick: function () {

	}
};

module.exports = World;

