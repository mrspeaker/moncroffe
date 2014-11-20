var World = {
	seed: 42,
	startTime: 0,
	elapsed: 0,
	players: [],
	clients: [],
	reset: function () {
		this.startTime = Date.now();
		this.elapsed = 0;
		this.seed = Math.random() * 99999999 | 0;
		console.log("Reset:", this.seed);
	}
};

module.exports = World;

